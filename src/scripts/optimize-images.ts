import mongoose from 'mongoose';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import Image from '../models/Image';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/thiep-cuoi';
const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';

async function optimizeImages() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find all images that are not WebP (old images)
    const images = await Image.find({});
    console.log(`Found ${images.length} images to check`);

    let optimizedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const image of images) {
      const filePath = path.join(UPLOAD_DIR, image.filename);
      
      // Skip if already WebP
      if (image.filename.endsWith('.webp')) {
        console.log(`⏭️  Skipping ${image.filename} (already WebP)`);
        skippedCount++;
        continue;
      }

      // Check if file exists
      if (!fs.existsSync(filePath)) {
        console.log(`⚠️  File not found: ${image.filename}`);
        errorCount++;
        continue;
      }

      try {
        console.log(`🔄 Optimizing ${image.filename}...`);
        
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

        // Get original file size
        const originalSize = fs.statSync(filePath).size;

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
        const optimizedPath = path.join(UPLOAD_DIR, optimizedFilename);

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

        console.log(`✅ Optimized ${image.filename}: ${(originalSize / 1024).toFixed(1)}KB → ${(optimizedSize / 1024).toFixed(1)}KB (saved ${saved}%)`);
        optimizedCount++;
      } catch (error: any) {
        console.error(`❌ Error optimizing ${image.filename}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n📊 Summary:');
    console.log(`✅ Optimized: ${optimizedCount}`);
    console.log(`⏭️  Skipped: ${skippedCount}`);
    console.log(`❌ Errors: ${errorCount}`);

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

optimizeImages();

