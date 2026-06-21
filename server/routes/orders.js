import { Router } from 'express';
import { createOrder, trackOrder } from '../services/ordersService.js';
import { validateCustomer } from '../utils/validateCustomer.js';

const router = Router();

router.post('/track', async (req, res, next) => {
  try {
    const { orderRef, phone } = req.body;
    const result = await trackOrder(orderRef, phone);

    if (result.error) {
      return res.status(404).json({ error: result.error });
    }

    res.json(result.order);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { items, customer } = req.body;

    if (!items?.length) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    const validated = validateCustomer(customer);
    if (validated.error) {
      return res.status(400).json({ error: validated.error });
    }

    const order = await createOrder({
      items,
      customer: validated.data,
    });
    res.status(201).json(order);
  } catch (err) {
    if (err.message === 'One or more products are invalid' || err.message === 'One or more products are out of stock or invalid') {
      return res.status(400).json({ error: err.message });
    }
    next(err);
  }
});

export default router;
