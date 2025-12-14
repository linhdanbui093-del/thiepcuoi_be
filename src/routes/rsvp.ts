import express from 'express';
import RSVP from '../models/RSVP';

const router = express.Router();

// Create RSVP
router.post('/', async (req, res) => {
  try {
    const rsvp = new RSVP(req.body);
    await rsvp.save();
    res.status(201).json(rsvp);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get RSVPs by wedding ID
router.get('/wedding/:weddingId', async (req, res) => {
  try {
    const rsvps = await RSVP.find({ weddingId: req.params.weddingId })
      .sort({ createdAt: -1 });
    res.json(rsvps);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update RSVP
router.put('/:id', async (req, res) => {
  try {
    const rsvp = await RSVP.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!rsvp) {
      return res.status(404).json({ error: 'RSVP not found' });
    }
    res.json(rsvp);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete RSVP
router.delete('/:id', async (req, res) => {
  try {
    const rsvp = await RSVP.findByIdAndDelete(req.params.id);
    if (!rsvp) {
      return res.status(404).json({ error: 'RSVP not found' });
    }
    res.json({ message: 'RSVP deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
