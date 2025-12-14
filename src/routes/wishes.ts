import express from 'express';
import Wish from '../models/Wish';

const router = express.Router();

// Create wish
router.post('/', async (req, res) => {
  try {
    const wish = new Wish(req.body);
    await wish.save();
    res.status(201).json(wish);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get wishes by wedding ID
router.get('/wedding/:weddingId', async (req, res) => {
  try {
    const wishes = await Wish.find({ weddingId: req.params.weddingId })
      .sort({ createdAt: -1 });
    res.json(wishes);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete wish
router.delete('/:id', async (req, res) => {
  try {
    const wish = await Wish.findByIdAndDelete(req.params.id);
    if (!wish) {
      return res.status(404).json({ error: 'Wish not found' });
    }
    res.json({ message: 'Wish deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
