import { getFirestore, isFirebaseReady } from '../config/firebase.js';
import { getProductsByIds, updateProduct } from './productsService.js';
import { sendOrderAlert } from './notificationService.js';

const memoryOrders = [];

function qtyByProductId(items) {
  return items.reduce((acc, item) => {
    acc[item.id] = (acc[item.id] || 0) + item.qty;
    return acc;
  }, {});
}

function validateStock(items, productMap) {
  const needed = qtyByProductId(items);

  for (const [id, qty] of Object.entries(needed)) {
    const product = productMap[Number(id)];
    if (!product) {
      throw new Error('One or more products are invalid');
    }
    if (product.stock < qty) {
      if (product.stock <= 0) {
        throw new Error(`${product.name} is out of stock`);
      }
      throw new Error(`Only ${product.stock} left for ${product.name}`);
    }
  }
}

function buildOrderItems(items, productMap) {
  return items.map((item) => {
    const product = productMap[item.id];
    if (!product || product.stock < item.qty) return null;
    return {
      id: product.id,
      name: product.name,
      emoji: product.emoji,
      imageUrl: product.imageUrl || null,
      price: product.price,
      qty: item.qty,
      lineTotal: product.price * item.qty,
    };
  }).filter(Boolean);
}

async function decrementStock(items, productMap) {
  const needed = qtyByProductId(items);

  for (const [id, qty] of Object.entries(needed)) {
    const product = productMap[Number(id)];
    await updateProduct(id, { stock: product.stock - qty });
  }
}

function normalizeClientOrderId(value) {
  const normalized = String(value || '').trim();
  if (!normalized) return null;
  return normalized.slice(0, 120);
}

async function findExistingOrderByClientId(userId, clientOrderId) {
  if (!userId || !clientOrderId) return null;

  if (!isFirebaseReady()) {
    return memoryOrders.find((order) => (
      order.userId === userId && order.clientOrderId === clientOrderId
    )) || null;
  }

  try {
    const db = getFirestore();
    const existing = await db.collection('orders')
      .where('clientOrderId', '==', clientOrderId)
      .limit(1)
      .get();

    if (existing.empty) return null;
    const found = existing.docs[0];
    const data = found.data();
    if (data.userId !== userId) return null;
    return { id: found.id, ...data };
  } catch (err) {
    // Missing index / transient query errors must not block new orders
    console.warn('clientOrderId lookup skipped:', err.message);
    return null;
  }
}

export async function getOrdersByUserId(userId) {
  if (!userId) return [];

  if (!isFirebaseReady()) {
    return memoryOrders
      .filter((o) => o.userId === userId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .map((o) => toPublicOrder(o, { includePhone: true }))
      .filter(Boolean);
  }

  const db = getFirestore();
  const snapshot = await db.collection('orders').where('userId', '==', userId).get();
  return snapshot.docs
    .map((doc) => toPublicOrder({ id: doc.id, ...doc.data() }, { includePhone: true }))
    .filter(Boolean)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export async function getOrders() {
  if (!isFirebaseReady()) {
    return [...memoryOrders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  const db = getFirestore();
  const snapshot = await db.collection('orders').orderBy('createdAt', 'desc').get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

export async function createOrder({ items, customer, userId, userEmail, clientOrderId }) {
  const safeClientOrderId = normalizeClientOrderId(clientOrderId);
  const existingOrder = await findExistingOrderByClientId(userId, safeClientOrderId);
  if (existingOrder) {
    return existingOrder;
  }

  const productIds = [...new Set(items.map((item) => item.id))];
  const products = await getProductsByIds(productIds);
  const productMap = Object.fromEntries(products.map((p) => [p.id, p]));

  validateStock(items, productMap);

  const orderItems = buildOrderItems(items, productMap);
  if (orderItems.length !== items.length) {
    throw new Error('One or more products are out of stock or invalid');
  }

  const total = orderItems.reduce((sum, item) => sum + item.lineTotal, 0);
  const order = {
    items: orderItems,
    total,
    customer: {
      ...(customer || {}),
      ...(userEmail && { email: userEmail }),
    },
    userId: userId || null,
    ...(safeClientOrderId && { clientOrderId: safeClientOrderId }),
    status: 'pending',
    paymentMethod: 'cod',
    createdAt: new Date().toISOString(),
  };

  if (!isFirebaseReady()) {
    const saved = { id: String(memoryOrders.length + 1), ...order };
    saved.orderNumber = saved.id.slice(-6).toUpperCase();
    memoryOrders.push(saved);
    await decrementStock(items, productMap);
    sendOrderAlert(saved).catch((err) => {
      console.error('Order alert failed:', err.message);
    });
    return saved;
  }

  const db = getFirestore();
  const saved = await db.runTransaction(async (transaction) => {
    const refs = productIds.map((id) => db.collection('products').doc(String(id)));
    const docs = await Promise.all(refs.map((ref) => transaction.get(ref)));

    const txProductMap = {};
    docs.forEach((doc, index) => {
      if (!doc.exists) throw new Error('One or more products are invalid');
      const data = doc.data();
      const id = productIds[index];
      const stock = typeof data.stock === 'number' ? Math.max(0, Math.floor(data.stock)) : (data.inStock === false ? 0 : 50);
      txProductMap[id] = {
        ref: refs[index],
        name: data.name,
        stock,
      };
    });

    const needed = qtyByProductId(items);
    for (const [id, qty] of Object.entries(needed)) {
      const product = txProductMap[Number(id)];
      if (!product) throw new Error('One or more products are invalid');
      if (product.stock < qty) {
        if (product.stock <= 0) {
          throw new Error(`${product.name} is out of stock`);
        }
        throw new Error(`Only ${product.stock} left for ${product.name}`);
      }
    }

    for (const [id, qty] of Object.entries(needed)) {
      const product = txProductMap[Number(id)];
      const newStock = product.stock - qty;
      transaction.update(product.ref, { stock: newStock, inStock: newStock > 0 });
    }

    const orderRef = db.collection('orders').doc();
    const orderNumber = orderRef.id.slice(-6).toUpperCase();
    const payload = { ...order, orderNumber };
    transaction.set(orderRef, payload);
    return { id: orderRef.id, ...payload };
  });

  sendOrderAlert(saved).catch((err) => {
    console.error('Order alert failed:', err.message);
  });
  return saved;
}

const ORDER_STATUSES = ['pending', 'confirmed', 'delivered', 'cancelled'];

export async function updateOrderStatus(id, status) {
  if (!ORDER_STATUSES.includes(status)) {
    throw new Error('Invalid status');
  }

  if (!isFirebaseReady()) {
    const order = memoryOrders.find((o) => o.id === id);
    if (!order) return null;
    order.status = status;
    order.updatedAt = new Date().toISOString();
    return order;
  }

  const db = getFirestore();
  const ref = db.collection('orders').doc(id);
  const doc = await ref.get();
  if (!doc.exists) return null;

  const updatedAt = new Date().toISOString();
  await ref.update({ status, updatedAt });
  return { id: doc.id, ...doc.data(), status, updatedAt };
}

export { ORDER_STATUSES };

function normalizePhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  return digits.slice(-10);
}

function toIsoDate(value) {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (typeof value.toDate === 'function') return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

function toPublicOrder(order, { includePhone = false } = {}) {
  if (!order?.id) return null;

  const customer = {
    name: order.customer?.name,
    address: order.customer?.address,
    area: order.customer?.area,
    pincode: order.customer?.pincode,
    lat: order.customer?.lat ?? null,
    lng: order.customer?.lng ?? null,
  };
  if (includePhone) {
    customer.phone = order.customer?.phone;
  }

  return {
    id: String(order.id),
    orderNumber: order.orderNumber || String(order.id).slice(-6).toUpperCase(),
    status: order.status,
    items: Array.isArray(order.items) ? order.items : [],
    total: order.total,
    createdAt: toIsoDate(order.createdAt),
    updatedAt: toIsoDate(order.updatedAt),
    paymentMethod: order.paymentMethod || 'cod',
    customer,
  };
}

function phoneMatches(order, phoneDigits) {
  return normalizePhone(order.customer?.phone) === phoneDigits;
}

async function findOrdersByRef(orderRef) {
  const ref = orderRef.trim();
  if (!ref) return [];

  if (!isFirebaseReady()) {
    return memoryOrders.filter((o) => {
      const num = o.orderNumber || o.id.slice(-6).toUpperCase();
      return o.id === ref || num === ref.toUpperCase();
    });
  }

  const db = getFirestore();

  if (ref.length >= 15) {
    const doc = await db.collection('orders').doc(ref).get();
    return doc.exists ? [{ id: doc.id, ...doc.data() }] : [];
  }

  const byNumber = await db.collection('orders')
    .where('orderNumber', '==', ref.toUpperCase())
    .limit(5)
    .get();

  if (!byNumber.empty) {
    return byNumber.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  }

  const recent = await db.collection('orders').orderBy('createdAt', 'desc').limit(300).get();
  return recent.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }))
    .filter((o) => o.id.slice(-6).toUpperCase() === ref.toUpperCase());
}

export async function trackOrder(orderRef, phone) {
  const phoneDigits = normalizePhone(phone);
  if (phoneDigits.length < 10) {
    return { error: 'Enter a valid 10-digit phone number' };
  }

  if (!orderRef?.trim()) {
    return { error: 'Order number is required' };
  }

  const candidates = await findOrdersByRef(orderRef);
  const order = candidates.find((o) => phoneMatches(o, phoneDigits));

  if (!order) {
    return { error: 'Order not found. Check your order number and phone.' };
  }

  return { order: toPublicOrder(order) };
}
