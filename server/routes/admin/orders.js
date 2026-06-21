import { Router } from 'express';
import { requireAdmin } from '../../middleware/adminAuth.js';
import { getOrders, updateOrderStatus, ORDER_STATUSES } from '../../services/ordersService.js';

const router = Router();
router.use(requireAdmin);

router.get('/statuses', (_req, res) => {
  res.json(ORDER_STATUSES);
});

router.get('/', async (_req, res, next) => {
  try {
    const orders = await getOrders();
    res.json(orders);
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/status', async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: 'Status is required' });

    const order = await updateOrderStatus(req.params.id, status);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (err) {
    if (err.message === 'Invalid status') {
      return res.status(400).json({ error: err.message });
    }
    next(err);
  }
});

export default router;
