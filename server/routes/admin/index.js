import { Router } from 'express';
import adminProductsRouter from './products.js';
import adminOrdersRouter from './orders.js';

const router = Router();

router.use('/products', adminProductsRouter);
router.use('/orders', adminOrdersRouter);

export default router;
