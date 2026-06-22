import { Router } from 'express';
import adminProductsRouter from './products.js';
import adminOrdersRouter from './orders.js';
import adminContactRouter from './contact.js';

const router = Router();

router.use('/products', adminProductsRouter);
router.use('/orders', adminOrdersRouter);
router.use('/contact-messages', adminContactRouter);

export default router;
