import express from 'express';
import { getVideoChannelsByLetter } from '../../videoData/videoData';

const router = express.Router();

// HELYES: csak '/' route, így a /api/video-countries végpont él
router.get('/', (req, res) => {
  const byLetter = getVideoChannelsByLetter();
  res.json(byLetter);
});

export default router;