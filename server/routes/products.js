import { Router } from 'express';
import { getProducts, getProductById } from '../services/productsService.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const products = await getProducts(req.query);
    res.json(products);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const product = await getProductById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  } catch (err) {
    next(err);
  }
});

export default router;
