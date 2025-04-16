import express from 'express';
import {
  createBooking,
  getUpcomingBookings,
  getPastBookings,
  acceptBooking,
  declineBooking,
  completeBooking,
} from '../controllers/bookingController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.route('/')
  .post(protect, createBooking);

router.get('/upcoming', protect, getUpcomingBookings);
router.get('/past', protect, getPastBookings);

router.put('/:id/accept', protect, acceptBooking);
router.put('/:id/decline', protect, declineBooking);
router.put('/:id/complete', protect, completeBooking);

export default router;