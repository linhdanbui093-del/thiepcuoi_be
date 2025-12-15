import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';
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
const uploadMiddleware = upload.single('image');
router.post('/upload', (req: any, res: any, next: any) => {
  uploadMiddleware(req, res, (err: any) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    next();
  });
}, async (req: any, res: express.Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Ensure category is properly extracted from FormData
    const category = String(req.body.category || 'album').trim();
    const weddingId = req.body.weddingId;
    
    console.log('Upload request - Category:', category, 'WeddingId:', weddingId, 'Original size:', req.file.size);

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
      console.log('Deleted old QR codes:', deleted.deletedCount);
    }

    // Compress and optimize image using sharp
    const uploadDir = process.env.UPLOAD_DIR || './uploads';
    const originalPath = req.file.path;
    const optimizedFilename = req.file.filename.replace(/\.[^.]+$/, '.webp');
    const optimizedPath = path.join(uploadDir, optimizedFilename);

    try {
      // Determine max dimensions based on category
      let maxWidth = 1920; // Default max width
      let maxHeight = 1920; // Default max height
      
      if (category === 'qr-groom' || category === 'qr-bride') {
        maxWidth = 800;
        maxHeight = 800;
      } else if (category === 'groom' || category === 'bride' || category === 'couple') {
        maxWidth = 1200;
        maxHeight = 1200;
      } else if (category === 'story') {
        maxWidth = 1600;
        maxHeight = 1600;
      }
      // album uses default 1920x1920

      // Resize and optimize image (auto-rotate based on EXIF)
      // Use sharp with auto orientation handling
      let imageProcessor = sharp(originalPath);
      
      // Get metadata to check orientation
      const metadata = await imageProcessor.metadata();
      console.log('Image metadata:', { width: metadata.width, height: metadata.height, orientation: metadata.orientation });
      
      // .rotate() without parameters automatically applies EXIF orientation
      const optimizedBuffer = await imageProcessor
        .rotate() // Auto-rotate based on EXIF orientation (removes orientation tag)
        .resize(maxWidth, maxHeight, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .webp({ quality: 85, effort: 4 })
        .toBuffer();

      // Write optimized image
      fs.writeFileSync(optimizedPath, optimizedBuffer);
      
      // Delete original file
      if (fs.existsSync(originalPath)) {
        fs.unlinkSync(originalPath);
      }

      const optimizedSize = fs.statSync(optimizedPath).size;
      console.log('Image optimized:', {
        original: req.file.size,
        optimized: optimizedSize,
        saved: `${((1 - optimizedSize / req.file.size) * 100).toFixed(1)}%`
      });

      const image = new Image({
        weddingId: weddingId,
        filename: optimizedFilename,
        originalName: req.file.originalname,
        path: `/uploads/${optimizedFilename}`,
        category: category,
        order: parseInt(req.body.order) || 0
      });

      await image.save();
      console.log('Saved image with category:', image.category);
      res.status(201).json(image);
    } catch (optimizationError: any) {
      console.error('Image optimization error:', optimizationError);
      // If optimization fails, use original file
      const image = new Image({
        weddingId: weddingId,
        filename: req.file.filename,
        originalName: req.file.originalname,
        path: `/uploads/${req.file.filename}`,
        category: category,
        order: parseInt(req.body.order) || 0
      });

      await image.save();
      res.status(201).json(image);
    }
  } catch (error: any) {
    console.error('Upload error:', error);
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

// Optimize a single image (re-optimize existing image)
router.post('/:id/optimize', async (req, res) => {
  try {
    const image = await Image.findById(req.params.id);
    if (!image) {
      return res.status(404).json({ error: 'Image not found' });
    }

    const uploadDir = process.env.UPLOAD_DIR || './uploads';
    const filePath = path.join(uploadDir, image.filename);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Image file not found' });
    }

    // Skip if already WebP
    if (image.filename.endsWith('.webp')) {
      return res.json({ message: 'Image already optimized', image });
    }

    // Get original file size
    const originalSize = fs.statSync(filePath).size;

    // Determine max dimensions based on category
    let maxWidth = 1920;
    let maxHeight = 1920;
    
    if (image.category === 'qr-groom' || image.category === 'qr-bride') {
      maxWidth = 800;
      maxHeight = 800;
    } else if (image.category === 'groom' || image.category === 'bride' || image.category === 'couple') {
      maxWidth = 1200;
      maxHeight = 1200;
    } else if (image.category === 'story') {
      maxWidth = 1600;
      maxHeight = 1600;
    }

        // Resize and optimize image (auto-rotate based on EXIF)
        // .rotate() without parameters auto-rotates based on EXIF orientation tag
        const optimizedBuffer = await sharp(filePath)
          .rotate() // Auto-rotate based on EXIF orientation (removes orientation from metadata)
          .resize(maxWidth, maxHeight, {
            fit: 'inside',
            withoutEnlargement: true
          })
          .webp({ quality: 85, effort: 4 })
          .toBuffer();

        // Create new filename with .webp extension
        const optimizedFilename = image.filename.replace(/\.[^.]+$/, '.webp');
    const optimizedPath = path.join(uploadDir, optimizedFilename);

    // Write optimized image
    fs.writeFileSync(optimizedPath, optimizedBuffer);
    
    const optimizedSize = fs.statSync(optimizedPath).size;
    const saved = ((1 - optimizedSize / originalSize) * 100).toFixed(1);

    // Update database
    image.filename = optimizedFilename;
    image.path = `/uploads/${optimizedFilename}`;
    await image.save();

    // Delete original file
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.json({
      message: 'Image optimized successfully',
      originalSize,
      optimizedSize,
      saved: `${saved}%`,
      image
    });
  } catch (error: any) {
    console.error('Optimize error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Optimize all images for a wedding
router.post('/wedding/:weddingId/optimize-all', async (req, res) => {
  try {
    const images = await Image.find({ weddingId: req.params.weddingId });
    const results = {
      optimized: 0,
      skipped: 0,
      errors: 0,
      details: [] as any[]
    };

    const uploadDir = process.env.UPLOAD_DIR || './uploads';

    for (const image of images) {
      const filePath = path.join(uploadDir, image.filename);
      
      // Skip if already WebP
      if (image.filename.endsWith('.webp')) {
        results.skipped++;
        continue;
      }

      // Check if file exists
      if (!fs.existsSync(filePath)) {
        results.errors++;
        continue;
      }

      try {
        const originalSize = fs.statSync(filePath).size;

        // Determine max dimensions
        let maxWidth = 1920;
        let maxHeight = 1920;
        
        if (image.category === 'qr-groom' || image.category === 'qr-bride') {
          maxWidth = 800;
          maxHeight = 800;
        } else if (image.category === 'groom' || image.category === 'bride' || image.category === 'couple') {
          maxWidth = 1200;
          maxHeight = 1200;
        } else if (image.category === 'story') {
          maxWidth = 1600;
          maxHeight = 1600;
        }

        const optimizedBuffer = await sharp(filePath)
          .rotate() // Auto-rotate based on EXIF orientation
          .resize(maxWidth, maxHeight, {
            fit: 'inside',
            withoutEnlargement: true
          })
          .webp({ quality: 85, effort: 4 })
          .toBuffer();

        const optimizedFilename = image.filename.replace(/\.[^.]+$/, '.webp');
        const optimizedPath = path.join(uploadDir, optimizedFilename);

        fs.writeFileSync(optimizedPath, optimizedBuffer);
        
        const optimizedSize = fs.statSync(optimizedPath).size;
        const saved = ((1 - optimizedSize / originalSize) * 100).toFixed(1);

        image.filename = optimizedFilename;
        image.path = `/uploads/${optimizedFilename}`;
        await image.save();

        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }

        results.optimized++;
        results.details.push({
          id: image._id,
          filename: optimizedFilename,
          originalSize,
          optimizedSize,
          saved: `${saved}%`
        });
      } catch (error: any) {
        results.errors++;
        results.details.push({
          id: image._id,
          error: error.message
        });
      }
    }

    res.json(results);
  } catch (error: any) {
    console.error('Optimize all error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
