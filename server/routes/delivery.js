import { Router } from 'express';
import { requireDelivery } from '../middleware/deliveryAuth.js';
import { getOrders, updateOrderStatus } from '../services/ordersService.js';

const router = Router();
router.use(requireDelivery);

const ACTIVE = new Set(['pending', 'confirmed']);

function toDeliveryOrder(order) {
  const customer = order.customer || {};
  return {
    id: order.id,
    orderNumber: order.orderNumber || String(order.id).slice(-6).toUpperCase(),
    status: order.status,
    total: order.total,
    note: order.note || '',
    createdAt: order.createdAt,
    items: (order.items || []).map((item) => ({
      name: item.name,
      qty: item.qty,
    })),
    customer: {
      name: customer.name || '',
      phone: customer.phone || '',
      address: customer.address || '',
      area: customer.area || '',
      pincode: customer.pincode || '',
      lat: customer.lat ?? null,
      lng: customer.lng ?? null,
    },
  };
}

function canSetStatus(current, next) {
  if (next === 'confirmed') return current === 'pending';
  if (next === 'delivered') return current === 'pending' || current === 'confirmed';
  return false;
}

router.get('/orders', async (_req, res, next) => {
  try {
    const orders = await getOrders();
    const active = orders
      .filter((order) => ACTIVE.has(order.status))
      .map(toDeliveryOrder);
    res.json(active);
  } catch (err) {
    next(err);
  }
});

router.patch('/orders/:id/status', async (req, res, next) => {
  try {
    const { status } = req.body || {};
    if (status !== 'confirmed' && status !== 'delivered') {
      return res.status(400).json({ error: 'Choose picked up or delivered' });
    }

    const orders = await getOrders();
    const current = orders.find((order) => order.id === req.params.id);
    if (!current) return res.status(404).json({ error: 'Order not found' });
    if (!canSetStatus(current.status, status)) {
      return res.status(400).json({ error: 'This order can no longer be updated' });
    }

    const updated = await updateOrderStatus(req.params.id, status);
    if (!updated) return res.status(404).json({ error: 'Order not found' });
    res.json(toDeliveryOrder(updated));
  } catch (err) {
    next(err);
  }
});

export default router;
