import { Router } from 'express';
import { requireCustomer } from '../middleware/customerAuth.js';
import { getCustomerProfile, upsertCustomerProfile } from '../services/customersService.js';
import { cancelOrderForCustomer, getOrdersByUserId } from '../services/ordersService.js';

const router = Router();

router.use(requireCustomer);

router.get('/me', async (req, res, next) => {
  try {
    const profile = await getCustomerProfile(req.user.uid);
    res.json({
      ...profile,
      email: profile.email || req.user.email || '',
    });
  } catch (err) {
    next(err);
  }
});

router.put('/me', async (req, res, next) => {
  try {
    const { name, phone, address, area, pincode, lat, lng } = req.body || {};
    const profile = await upsertCustomerProfile(req.user.uid, {
      email: req.user.email || '',
      ...(name !== undefined && { name: String(name).trim() }),
      ...(phone !== undefined && { phone: String(phone).trim() }),
      ...(address !== undefined && { address: String(address).trim() }),
      ...(area !== undefined && { area: String(area).trim() }),
      ...(pincode !== undefined && { pincode: String(pincode).trim().replace(/\D/g, '').slice(0, 6) }),
      ...(lat !== undefined && { lat: lat == null ? null : Number(lat) }),
      ...(lng !== undefined && { lng: lng == null ? null : Number(lng) }),
    });
    res.json(profile);
  } catch (err) {
    next(err);
  }
});

router.get('/me/orders', async (req, res, next) => {
  try {
    const orders = await getOrdersByUserId(req.user.uid);
    res.json(orders);
  } catch (err) {
    next(err);
  }
});

router.post('/me/orders/:id/cancel', async (req, res, next) => {
  try {
    const result = await cancelOrderForCustomer(req.params.id, req.user.uid);
    if (result.error === 'not_found') {
      return res.status(404).json({ error: 'Order not found' });
    }
    if (result.error === 'forbidden') {
      return res.status(403).json({ error: 'This order belongs to another account' });
    }
    if (result.error === 'not_pending') {
      return res.status(400).json({
        error: 'Only pending orders can be cancelled. Call us if the farm has already confirmed it.',
      });
    }
    res.json(result.order);
  } catch (err) {
    next(err);
  }
});

export default router;
