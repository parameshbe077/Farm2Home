import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { initFirebase, isFirebaseReady } from './config/firebase.js';
import productsRouter from './routes/products.js';
import ordersRouter from './routes/orders.js';
import contactRouter from './routes/contact.js';
import geocodeRouter from './routes/geocode.js';
import adminRouter from './routes/admin/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 5000;
const clientDist = path.join(__dirname, '../client/dist');

initFirebase();

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    message: 'Farm2Home API is running',
    database: isFirebaseReady() ? 'firebase' : 'memory',
  });
});

app.use('/api/products', productsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/contact', contactRouter);
app.use('/api/geocode', geocodeRouter);
app.use('/api/admin', adminRouter);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Farm2Home server running on http://localhost:${PORT}`);
  console.log(`Database: ${isFirebaseReady() ? 'Firebase Firestore' : 'In-memory (fallback)'}`);
});
