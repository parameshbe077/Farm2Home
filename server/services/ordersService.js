import { getFirestore, isFirebaseReady } from '../config/firebase.js';
import { getProductsByIds } from './productsService.js';
import { sendOrderAlert } from './notificationService.js';

const memoryOrders = [];

export async function getOrders() {
  if (!isFirebaseReady()) {
    return memoryOrders;
  }

  const db = getFirestore();
  const snapshot = await db.collection('orders').orderBy('createdAt', 'desc').get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

export async function createOrder({ items, customer }) {
  const productIds = items.map((item) => item.id);
  const products = await getProductsByIds(productIds);
  const productMap = Object.fromEntries(products.map((p) => [p.id, p]));

  const orderItems = items.map((item) => {
    const product = productMap[item.id];
    if (!product) return null;
    if (product.inStock === false) return null;
    return {
      id: product.id,
      name: product.name,
      emoji: product.emoji,
      price: product.price,
      qty: item.qty,
      lineTotal: product.price * item.qty,
    };
  }).filter(Boolean);

  if (orderItems.length !== items.length) {
    const unavailable = items.filter((item) => {
      const product = productMap[item.id];
      return !product || product.inStock === false;
    });
    if (unavailable.length) {
      throw new Error('One or more products are out of stock or invalid');
    }
    throw new Error('One or more products are invalid');
  }

  const total = orderItems.reduce((sum, item) => sum + item.lineTotal, 0);
  const order = {
    items: orderItems,
    total,
    customer: customer || {},
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  if (!isFirebaseReady()) {
    const saved = { id: String(memoryOrders.length + 1), ...order };
    saved.orderNumber = saved.id.slice(-6).toUpperCase();
    memoryOrders.push(saved);
    sendOrderAlert(saved).catch((err) => {
      console.error('Order alert failed:', err.message);
    });
    return saved;
  }

  const db = getFirestore();
  const ref = await db.collection('orders').add(order);
  const saved = { id: ref.id, ...order, orderNumber: ref.id.slice(-6).toUpperCase() };
  await ref.update({ orderNumber: saved.orderNumber });
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

function toPublicOrder(order) {
  return {
    id: order.id,
    orderNumber: order.orderNumber || order.id.slice(-6).toUpperCase(),
    status: order.status,
    items: order.items,
    total: order.total,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    customer: {
      name: order.customer?.name,
      address: order.customer?.address,
      area: order.customer?.area,
      pincode: order.customer?.pincode,
      lat: order.customer?.lat ?? null,
      lng: order.customer?.lng ?? null,
    },
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
