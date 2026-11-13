import { Router } from 'express';
import { requireAdmin } from '../../middleware/adminAuth.js';
import {
  listRiders,
  createRider,
  setRiderPassword,
  deleteRider,
} from '../../services/ridersService.js';

const router = Router();
router.use(requireAdmin);

function sendServiceError(res, err, next) {
  if (err.status) return res.status(err.status).json({ error: err.message });
  return next(err);
}

router.get('/', async (_req, res, next) => {
  try {
    res.json(await listRiders());
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const rider = await createRider({
      name: req.body?.name,
      email: req.body?.email,
      password: req.body?.password,
      createdBy: req.admin?.email || '',
    });
    res.status(201).json(rider);
  } catch (err) {
    sendServiceError(res, err, next);
  }
});

router.patch('/:id/password', async (req, res, next) => {
  try {
    await setRiderPassword(req.params.id, req.body?.password);
    res.json({ ok: true });
  } catch (err) {
    sendServiceError(res, err, next);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await deleteRider(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    sendServiceError(res, err, next);
  }
});

export default router;
