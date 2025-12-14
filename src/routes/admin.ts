import express from 'express';

const router = express.Router();

// This route can be used for admin authentication later
router.get('/health', (req, res) => {
  res.json({ status: 'OK' });
});

export default router;
