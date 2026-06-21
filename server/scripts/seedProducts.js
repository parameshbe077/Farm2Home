import 'dotenv/config';
import { initFirebase, isFirebaseReady, getFirestore } from '../config/firebase.js';
import { products as seedProducts } from '../data/products.js';

initFirebase();

if (!isFirebaseReady()) {
  console.error('Firebase is not configured. Set FIREBASE_SERVICE_ACCOUNT_PATH in server/.env');
  process.exit(1);
}

const db = getFirestore();

console.log(`Seeding ${seedProducts.length} products to Firestore...`);

for (const product of seedProducts) {
  await db.collection('products').doc(String(product.id)).set(product);
  console.log(`  ✓ ${product.name}`);
}

console.log('Done! Products are ready in Firebase.');
