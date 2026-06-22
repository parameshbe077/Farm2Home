import { Router } from 'express';
import { requireCustomer } from '../middleware/customerAuth.js';
import { getCustomerProfile, upsertCustomerProfile } from '../services/customersService.js';
import { getOrdersByUserId } from '../services/ordersService.js';

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

export default router;
