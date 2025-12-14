import express from 'express';
import Wedding from '../models/Wedding';

const router = express.Router();

// Get wedding by slug
router.get('/:slug', async (req, res) => {
  try {
    const wedding = await Wedding.findOne({ slug: req.params.slug });
    if (!wedding) {
      return res.status(404).json({ error: 'Wedding not found' });
    }
    res.json(wedding);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all weddings
router.get('/', async (req, res) => {
  try {
    const weddings = await Wedding.find().sort({ createdAt: -1 });
    res.json(weddings);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create wedding
router.post('/', async (req, res) => {
  try {
    const wedding = new Wedding(req.body);
    await wedding.save();
    res.status(201).json(wedding);
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Slug already exists' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// Update wedding
router.put('/:id', async (req, res) => {
  try {
    const wedding = await Wedding.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!wedding) {
      return res.status(404).json({ error: 'Wedding not found' });
    }
    res.json(wedding);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete wedding
router.delete('/:id', async (req, res) => {
  try {
    const wedding = await Wedding.findByIdAndDelete(req.params.id);
    if (!wedding) {
      return res.status(404).json({ error: 'Wedding not found' });
    }
    res.json({ message: 'Wedding deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
