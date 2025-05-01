const express = require("express")
const Booking = require("../models/Booking")
const User = require("../models/User")
const auth = require("../middleware/auth")

const router = express.Router()

// Get upcoming bookings for current user
router.get("/upcoming", auth, async (req, res) => {
  try {
    const now = new Date()

    // Find bookings where current user is student or teacher and date is in the future
    const bookings = await Booking.find({
      $or: [{ student: req.user._id }, { teacher: req.user._id }],
      dateTime: { $gt: now },
      status: { $in: ["pending", "accepted"] },
    }).sort({ dateTime: 1 })

    // Get user details for each booking
    const userIds = bookings.map((booking) =>
      booking.student.equals(req.user._id) ? booking.teacher : booking.student,
    )

    const users = await User.find({
      _id: { $in: userIds },
    }).select("name photoUrl")

    // Map users to bookings
    const userMap = {}
    users.forEach((user) => {
      userMap[user._id] = user
    })

    const formattedBookings = bookings.map((booking) => {
      const isTeacher = booking.teacher.equals(req.user._id)
      const otherUserId = isTeacher ? booking.student : booking.teacher

      return {
        id: booking._id,
        skill: booking.skill,
        dateTime: booking.dateTime,
        duration: booking.duration,
        status: booking.status,
        isTeacher,
        user: {
          id: otherUserId,
          name: userMap[otherUserId]?.name || "Unknown User",
          photoUrl: userMap[otherUserId]?.photoUrl || "",
        },
      }
    })

    res.json(formattedBookings)
  } catch (error) {
    console.error("Get upcoming bookings error:", error)
    res.status(500).json({ message: "Error fetching bookings" })
  }
})

// Get past bookings for current user
router.get("/past", auth, async (req, res) => {
  try {
    const now = new Date()

    // Find bookings where current user is student or teacher and date is in the past
    const bookings = await Booking.find({
      $or: [{ student: req.user._id }, { teacher: req.user._id }],
      $or: [{ dateTime: { $lt: now } }, { status: { $in: ["completed", "declined", "cancelled"] } }],
    }).sort({ dateTime: -1 })

    // Get user details for each booking
    const userIds = bookings.map((booking) =>
      booking.student.equals(req.user._id) ? booking.teacher : booking.student,
    )

    const users = await User.find({
      _id: { $in: userIds },
    }).select("name photoUrl")

    // Map users to bookings
    const userMap = {}
    users.forEach((user) => {
      userMap[user._id] = user
    })

    const formattedBookings = bookings.map((booking) => {
      const isTeacher = booking.teacher.equals(req.user._id)
      const otherUserId = isTeacher ? booking.student : booking.teacher

      return {
        id: booking._id,
        skill: booking.skill,
        dateTime: booking.dateTime,
        duration: booking.duration,
        status: booking.status,
        isTeacher,
        user: {
          id: otherUserId,
          name: userMap[otherUserId]?.name || "Unknown User",
          photoUrl: userMap[otherUserId]?.photoUrl || "",
        },
      }
    })

    res.json(formattedBookings)
  } catch (error) {
    console.error("Get past bookings error:", error)
    res.status(500).json({ message: "Error fetching bookings" })
  }
})

// Create a booking
router.post("/", auth, async (req, res) => {
  try {
    const { teacherId, skill, dateTime, duration } = req.body

    if (!teacherId || !skill || !dateTime) {
      return res.status(400).json({ message: "Teacher ID, skill, and date/time are required" })
    }

    // Check if teacher exists
    const teacher = await User.findById(teacherId)
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" })
    }

    // Create booking
    const booking = new Booking({
      student: req.user._id,
      teacher: teacherId,
      skill,
      dateTime: new Date(dateTime),
      duration: duration || 60,
      status: "pending",
    })

    await booking.save()

    res.status(201).json(booking)
  } catch (error) {
    console.error("Create booking error:", error)
    res.status(500).json({ message: "Error creating booking" })
  }
})

// Accept a booking
router.put("/:id/accept", auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" })
    }

    // Check if current user is the teacher for this booking
    if (!booking.teacher.equals(req.user._id)) {
      return res.status(403).json({ message: "Not authorized to accept this booking" })
    }

    booking.status = "accepted"
    await booking.save()

    res.json(booking)
  } catch (error) {
    console.error("Accept booking error:", error)
    res.status(500).json({ message: "Error accepting booking" })
  }
})

// Decline a booking
router.put("/:id/decline", auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" })
    }

    // Check if current user is the teacher for this booking
    if (!booking.teacher.equals(req.user._id)) {
      return res.status(403).json({ message: "Not authorized to decline this booking" })
    }

    booking.status = "declined"
    await booking.save()

    res.json(booking)
  } catch (error) {
    console.error("Decline booking error:", error)
    res.status(500).json({ message: "Error declining booking" })
  }
})

// Cancel a booking
router.put("/:id/cancel", auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" })
    }

    // Check if current user is the student for this booking
    if (!booking.student.equals(req.user._id)) {
      return res.status(403).json({ message: "Not authorized to cancel this booking" })
    }

    booking.status = "cancelled"
    await booking.save()

    res.json(booking)
  } catch (error) {
    console.error("Cancel booking error:", error)
    res.status(500).json({ message: "Error cancelling booking" })
  }
})

// Complete a booking
router.put("/:id/complete", auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" })
    }

    // Check if current user is the teacher for this booking
    if (!booking.teacher.equals(req.user._id)) {
      return res.status(403).json({ message: "Not authorized to complete this booking" })
    }

    booking.status = "completed"
    await booking.save()

    res.json(booking)
  } catch (error) {
    console.error("Complete booking error:", error)
    res.status(500).json({ message: "Error completing booking" })
  }
})

module.exports = router
