import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import Image from '../models/Image';

const router = express.Router();

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = process.env.UPLOAD_DIR || './uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// Upload image
router.post('/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Ensure category is properly extracted from FormData
    const category = String(req.body.category || 'album').trim();
    const weddingId = req.body.weddingId;
    
    console.log('Upload request - Category:', category, 'WeddingId:', weddingId); // Debug log

    // Validate category
    const validCategories = ['album', 'groom', 'bride', 'couple', 'qr-groom', 'qr-bride', 'story'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ error: `Invalid category: ${category}` });
    }

    // For QR codes, delete existing QR code of same category first
    if (category === 'qr-groom' || category === 'qr-bride') {
      const deleted = await Image.deleteMany({
        weddingId: weddingId,
        category: category
      });
      console.log('Deleted old QR codes:', deleted.deletedCount); // Debug log
    }

    const image = new Image({
      weddingId: weddingId,
      filename: req.file.filename,
      originalName: req.file.originalname,
      path: `/uploads/${req.file.filename}`,
      category: category,
      order: parseInt(req.body.order) || 0
    });

    await image.save();
    console.log('Saved image with category:', image.category); // Debug log
    res.status(201).json(image);
  } catch (error: any) {
    console.error('Upload error:', error); // Debug log
    res.status(500).json({ error: error.message });
  }
});

// Get images by wedding ID
router.get('/wedding/:weddingId', async (req, res) => {
  try {
    const images = await Image.find({ weddingId: req.params.weddingId })
      .sort({ order: 1, createdAt: -1 });
    res.json(images);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get images by category
router.get('/wedding/:weddingId/:category', async (req, res) => {
  try {
    const images = await Image.find({
      weddingId: req.params.weddingId,
      category: req.params.category
    }).sort({ order: 1, createdAt: -1 });
    res.json(images);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete image
router.delete('/:id', async (req, res) => {
  try {
    const image = await Image.findById(req.params.id);
    if (!image) {
      return res.status(404).json({ error: 'Image not found' });
    }

    // Delete file from filesystem
    const filePath = path.join(process.env.UPLOAD_DIR || './uploads', image.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await Image.findByIdAndDelete(req.params.id);
    res.json({ message: 'Image deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update image order
router.put('/:id', async (req, res) => {
  try {
    const image = await Image.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!image) {
      return res.status(404).json({ error: 'Image not found' });
    }
    res.json(image);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
