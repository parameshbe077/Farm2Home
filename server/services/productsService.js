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

function normalizeProduct(product) {
  return {
    ...product,
    inStock: product.inStock !== false,
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
    return seedProducts.find((p) => p.id === numId) || null;
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
  if (errors.length) throw new Error(errors.join(', '));
}

export async function createProduct(data) {
  validateProduct(data, true);
  const id = await getNextProductId();
  const product = {
    id,
    name: data.name.trim(),
    category: data.category,
    emoji: data.emoji?.trim() || '🌾',
    price: Number(data.price),
    unit: data.unit?.trim() || 'per kg',
    featured: Boolean(data.featured),
    inStock: data.inStock !== false,
  };

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

  const updated = {
    ...existing,
    ...(data.name !== undefined && { name: data.name.trim() }),
    ...(data.category !== undefined && { category: data.category }),
    ...(data.emoji !== undefined && { emoji: data.emoji.trim() }),
    ...(data.price !== undefined && { price: Number(data.price) }),
    ...(data.unit !== undefined && { unit: data.unit.trim() }),
    ...(data.featured !== undefined && { featured: Boolean(data.featured) }),
    ...(data.inStock !== undefined && { inStock: Boolean(data.inStock) }),
  };

  const normalized = normalizeProduct(updated);

  if (!isFirebaseReady()) {
    const idx = seedProducts.findIndex((p) => p.id === Number(id));
    if (idx >= 0) seedProducts[idx] = normalized;
    return normalized;
  }

  const db = getFirestore();
  await db.collection('products').doc(String(id)).set(normalized);
  return normalized;
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
