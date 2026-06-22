import { Router } from 'express';
import multer from 'multer';
import { requireAdmin } from '../../middleware/adminAuth.js';
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../../services/productsService.js';
import { uploadProductImage } from '../../services/imageStorageService.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
      cb(null, true);
      return;
    }
    cb(new Error('Please use a JPG, PNG, or WebP image'));
  },
});

const router = Router();
router.use(requireAdmin);

router.get('/', async (_req, res, next) => {
  try {
    const products = await getAllProducts();
    res.json(products);
  } catch (err) {
    next(err);
  }
});

router.post('/:id/image', (req, res, next) => {
  upload.single('image')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message || 'Invalid image upload' });
    }

    try {
      const product = await getProductById(req.params.id);
      if (!product) return res.status(404).json({ error: 'Product not found' });
      if (!req.file) return res.status(400).json({ error: 'No image file provided' });

      const imageUrl = await uploadProductImage(req.params.id, req.file);
      const updated = await updateProduct(req.params.id, { imageUrl });
      res.json(updated);
    } catch (uploadErr) {
      res.status(400).json({ error: uploadErr.message });
    }
  });
});

router.get('/:id', async (req, res, next) => {
  try {
    const product = await getProductById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const product = await createProduct(req.body);
    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const product = await updateProduct(req.params.id, req.body);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const deleted = await deleteProduct(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Product not found' });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
