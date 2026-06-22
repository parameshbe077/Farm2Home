import { Router } from 'express';
import { geocodeAddress, reverseGeocode, searchAddresses, isGeocodeConfigured, isGoogleGeocodeConfigured } from '../services/geocodeService.js';

const router = Router();

router.get('/status', (_req, res) => {
  res.json({
    configured: isGeocodeConfigured(),
    google: isGoogleGeocodeConfigured(),
    provider: 'openstreetmap',
  });
});

router.get('/search', async (req, res) => {
  const { q } = req.query;
  const result = await searchAddresses(q);
  if (result.error) {
    return res.status(400).json({ error: result.error });
  }
  res.json(result.data);
});

router.get('/', async (req, res) => {
  const { address } = req.query;
  const result = await geocodeAddress(address);
  if (result.error) {
    return res.status(400).json({ error: result.error });
  }
  res.json(result.data);
});

router.get('/reverse', async (req, res) => {
  const { lat, lng } = req.query;
  const result = await reverseGeocode(lat, lng);
  if (result.error) {
    return res.status(400).json({ error: result.error });
  }
  res.json(result.data);
});

export default router;
