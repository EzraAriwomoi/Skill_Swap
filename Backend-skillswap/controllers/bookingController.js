import Booking from '../models/Booking.js';
import User from '../models/User.js';

// @desc    Create a new booking
// @route   POST /api/bookings
// @access  Private
export const createBooking = async (req, res) => {
  try {
    const { tutorId, skill, dateTime, duration, notes } = req.body;
    
    const booking = await Booking.create({
      studentId: req.user._id,
      tutorId,
      skill,
      dateTime,
      duration,
      notes,
    });
    
    res.status(201).json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get upcoming bookings
// @route   GET /api/bookings/upcoming
// @access  Private
export const getUpcomingBookings = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Find bookings where the user is either the student or tutor
    const bookings = await Booking.find({
      $or: [{ studentId: userId }, { tutorId: userId }],
      dateTime: { $gte: new Date() },
      status: { $in: ['pending', 'accepted'] },
    }).sort({ dateTime: 1 });
    
    // Populate user details
    const populatedBookings = await Promise.all(
      bookings.map(async (booking) => {
        const isTeacher = booking.tutorId.toString() === userId.toString();
        const otherUserId = isTeacher ? booking.studentId : booking.tutorId;
        const otherUser = await User.findById(otherUserId).select('name photoUrl');
        
        return {
          id: booking._id,
          skill: booking.skill,
          dateTime: booking.dateTime,
          duration: booking.duration,
          status: booking.status,
          notes: booking.notes,
          isTeacher,
          user: {
            id: otherUser._id,
            name: otherUser.name,
            photoUrl: otherUser.photoUrl,
          },
        };
      })
    );
    
    res.json(populatedBookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get past bookings
// @route   GET /api/bookings/past
// @access  Private
export const getPastBookings = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Find bookings where the user is either the student or tutor
    const bookings = await Booking.find({
      $or: [{ studentId: userId }, { tutorId: userId }],
      $or: [
        { dateTime: { $lt: new Date() } },
        { status: { $in: ['completed', 'declined'] } },
      ],
    }).sort({ dateTime: -1 });
    
    // Populate user details
    const populatedBookings = await Promise.all(
      bookings.map(async (booking) => {
        const isTeacher = booking.tutorId.toString() === userId.toString();
        const otherUserId = isTeacher ? booking.studentId : booking.tutorId;
        const otherUser = await User.findById(otherUserId).select('name photoUrl');
        
        return {
          id: booking._id,
          skill: booking.skill,
          dateTime: booking.dateTime,
          duration: booking.duration,
          status: booking.status,
          notes: booking.notes,
          isTeacher,
          user: {
            id: otherUser._id,
            name: otherUser.name,
            photoUrl: otherUser.photoUrl,
          },
        };
      })
    );
    
    res.json(populatedBookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Accept a booking
// @route   PUT /api/bookings/:id/accept
// @access  Private
export const acceptBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    // Check if the user is the tutor
    if (booking.tutorId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    
    booking.status = 'accepted';
    await booking.save();
    
    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Decline a booking
// @route   PUT /api/bookings/:id/decline
// @access  Private
export const declineBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    // Check if the user is the tutor
    if (booking.tutorId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    
    booking.status = 'declined';
    await booking.save();
    
    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Complete a booking
// @route   PUT /api/bookings/:id/complete
// @access  Private
export const completeBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    // Check if the user is the student or tutor
    if (
      booking.studentId.toString() !== req.user._id.toString() &&
      booking.tutorId.toString() !== req.user._id.toString()
    ) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    
    booking.status = 'completed';
    await booking.save();
    
    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};