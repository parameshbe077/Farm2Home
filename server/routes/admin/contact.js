import { Router } from 'express';
import { requireAdmin } from '../../middleware/adminAuth.js';
import { getContactMessages } from '../../services/contactService.js';

const router = Router();
router.use(requireAdmin);

router.get('/', async (_req, res, next) => {
  try {
    const messages = await getContactMessages();
    res.json(messages);
  } catch (err) {
    next(err);
  }
});

export default router;
