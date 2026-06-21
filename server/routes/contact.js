import { Router } from 'express';
import { createContactMessage } from '../services/contactService.js';

const router = Router();

router.post('/', async (req, res, next) => {
  try {
    const { name, email, message } = req.body;

    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return res.status(400).json({ error: 'Name, email, and message are required' });
    }

    await createContactMessage({ name, email, message });
    res.status(201).json({
      success: true,
      message: 'Message received. We will get back to you soon.',
    });
  } catch (err) {
    next(err);
  }
});

export default router;
