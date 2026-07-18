import { Router } from 'express';
import { createOrder, trackOrder } from '../services/ordersService.js';
import { validateCustomer } from '../utils/validateCustomer.js';
import { requireCustomer } from '../middleware/customerAuth.js';
import { upsertCustomerProfile } from '../services/customersService.js';

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

router.post('/', requireCustomer, async (req, res, next) => {
  try {
    const { items, customer, clientOrderId } = req.body;

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
      userId: req.user.uid,
      userEmail: req.user.email || validated.data.email,
      clientOrderId,
    });

    // Don't block the HTTP response on profile write — slow Firestore here
    // caused "first click fail / second click success" (order already saved).
    upsertCustomerProfile(req.user.uid, {
      email: req.user.email || '',
      name: validated.data.name,
      phone: validated.data.phone,
      address: validated.data.address,
      area: validated.data.area,
      pincode: validated.data.pincode,
      lat: validated.data.lat ?? null,
      lng: validated.data.lng ?? null,
    }).catch((err) => {
      console.error('Profile save failed:', err.message);
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
