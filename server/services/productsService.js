import { getFirestore, isFirebaseReady } from '../config/firebase.js';
import { products as seedProducts } from '../data/products.js';

function applyFilters(list, { category, featured }) {
  let result = list.map(normalizeProduct);

  if (category && category !== 'all') {
    result = result.filter((p) => p.category === category);
  }

  if (featured === 'true' || featured === true) {
    result = result.filter((p) => p.featured);
  }

  return result.sort((a, b) => a.id - b.id);
}

function parseStock(value, fallback = 0) {
  if (typeof value === 'number' && !Number.isNaN(value)) {
    return Math.max(0, Math.floor(value));
  }
  if (value !== undefined && value !== null && value !== '') {
    const parsed = Number(value);
    if (!Number.isNaN(parsed)) return Math.max(0, Math.floor(parsed));
  }
  return fallback;
}

function normalizeProduct(product) {
  if (!product) return product;

  const hasStock = typeof product.stock === 'number' && !Number.isNaN(product.stock);
  const stock = hasStock
    ? Math.max(0, Math.floor(product.stock))
    : (product.inStock === false ? 0 : 50);
  const imageUrl = typeof product.imageUrl === 'string' && product.imageUrl.trim()
    ? product.imageUrl.trim()
    : null;

  return {
    ...product,
    stock,
    inStock: stock > 0,
    imageUrl,
  };
}

export async function getProducts(filters = {}) {
  if (!isFirebaseReady()) {
    return applyFilters(seedProducts, filters);
  }

  const db = getFirestore();
  const snapshot = await db.collection('products').get();
  const products = snapshot.docs.map((doc) => {
    const data = doc.data();
    return normalizeProduct({ id: data.id ?? Number(doc.id), ...data });
  });

  return applyFilters(products, filters);
}

export async function getProductById(id) {
  const numId = Number(id);

  if (!isFirebaseReady()) {
    const found = seedProducts.find((p) => p.id === numId);
    return found ? normalizeProduct(found) : null;
  }

  const db = getFirestore();
  const doc = await db.collection('products').doc(String(numId)).get();

  if (!doc.exists) return null;

  const data = doc.data();
  return normalizeProduct({ id: data.id ?? numId, ...data });
}

export async function getProductsByIds(ids) {
  const products = await Promise.all(ids.map((id) => getProductById(id)));
  return products.filter(Boolean);
}

export async function getAllProducts() {
  return getProducts({});
}

export async function getNextProductId() {
  const products = await getAllProducts();
  if (!products.length) return 1;
  return Math.max(...products.map((p) => p.id)) + 1;
}

function validateProduct(data, isCreate = false) {
  const errors = [];
  if (isCreate && !data.name?.trim()) errors.push('Name is required');
  if (data.name !== undefined && !data.name?.trim()) errors.push('Name cannot be empty');
  if (data.category !== undefined && !['fruits', 'rice', 'vegetables', 'flowers'].includes(data.category)) {
    errors.push('Invalid category');
  }
  if (data.price !== undefined && (typeof data.price !== 'number' || data.price < 0)) {
    errors.push('Price must be a positive number');
  }
  if (data.stock !== undefined) {
    const stock = parseStock(data.stock, -1);
    if (stock < 0) errors.push('Stock must be a whole number 0 or more');
  }
  if (errors.length) throw new Error(errors.join(', '));
}

export async function createProduct(data) {
  validateProduct(data, true);
  const id = await getNextProductId();
  const stock = parseStock(data.stock, 0);
  const product = normalizeProduct({
    id,
    name: data.name.trim(),
    category: data.category,
    emoji: data.emoji?.trim() || '🌾',
    price: Number(data.price),
    unit: data.unit?.trim() || 'per kg',
    featured: Boolean(data.featured),
    stock,
    ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl?.trim() || null }),
  });

  if (!isFirebaseReady()) {
    seedProducts.push(product);
    return product;
  }

  const db = getFirestore();
  await db.collection('products').doc(String(id)).set(product);
  return product;
}

export async function updateProduct(id, data) {
  const existing = await getProductById(id);
  if (!existing) return null;

  validateProduct({ ...existing, ...data });

  const stock = data.stock !== undefined ? parseStock(data.stock, 0) : existing.stock;

  const updated = normalizeProduct({
    ...existing,
    ...(data.name !== undefined && { name: data.name.trim() }),
    ...(data.category !== undefined && { category: data.category }),
    ...(data.emoji !== undefined && { emoji: data.emoji.trim() }),
    ...(data.price !== undefined && { price: Number(data.price) }),
    ...(data.unit !== undefined && { unit: data.unit.trim() }),
    ...(data.featured !== undefined && { featured: Boolean(data.featured) }),
    ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl?.trim() || null }),
    stock,
  });

  if (!isFirebaseReady()) {
    const idx = seedProducts.findIndex((p) => p.id === Number(id));
    if (idx >= 0) seedProducts[idx] = updated;
    return updated;
  }

  const db = getFirestore();
  await db.collection('products').doc(String(id)).set(updated);
  return updated;
}

export async function deleteProduct(id) {
  const existing = await getProductById(id);
  if (!existing) return false;

  if (!isFirebaseReady()) {
    const idx = seedProducts.findIndex((p) => p.id === Number(id));
    if (idx >= 0) seedProducts.splice(idx, 1);
    return true;
  }

  const db = getFirestore();
  await db.collection('products').doc(String(id)).delete();
  return true;
}
