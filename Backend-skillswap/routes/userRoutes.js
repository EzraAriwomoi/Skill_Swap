const express = require("express")
const User = require("../models/User")
const Skill = require("../models/Skill")
const auth = require("../middleware/auth")

const router = express.Router()

// Get user profile
router.get("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password")

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    res.json(user)
  } catch (error) {
    console.error("Get user error:", error)
    res.status(500).json({ message: "Error fetching user" })
  }
})

// Update user profile
router.put("/profile", auth, async (req, res) => {
  try {
    const updates = req.body
    const allowedUpdates = ["name", "bio", "skillsOffered", "skillsWanted", "photoUrl"]

    // Filter out any fields that aren't allowed to be updated
    const filteredUpdates = Object.keys(updates)
      .filter((key) => allowedUpdates.includes(key))
      .reduce((obj, key) => {
        obj[key] = updates[key]
        return obj
      }, {})

    // Update user
    const user = await User.findByIdAndUpdate(req.user._id, filteredUpdates, { new: true, runValidators: true }).select(
      "-password",
    )

    // Update or create skills in the Skills collection
    if (updates.skillsOffered) {
      // Remove existing skills
      await Skill.deleteMany({ user: req.user._id })

      // Add new skills
      const skillPromises = updates.skillsOffered.map((skillObj) => {
        return new Skill({
          user: req.user._id,
          skill: skillObj.skill,
          category: skillObj.category,
        }).save()
      })

      await Promise.all(skillPromises)
    }

    res.json(user)
  } catch (error) {
    console.error("Update profile error:", error)
    res.status(500).json({ message: "Error updating profile" })
  }
})

// Get user availability
router.get("/:id/availability", async (req, res) => {
  try {
    const user = await User.findById(req.params.id)

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    // If user has no availability set, generate some default dates
    if (!user.availability || user.availability.length === 0) {
      const availableDates = []
      const today = new Date()

      // Generate dates for the next 7 days
      for (let i = 1; i <= 7; i++) {
        const date = new Date()
        date.setDate(today.getDate() + i)
        availableDates.push(date)
      }

      return res.json({ availableDates })
    }

    // Return actual availability
    const availableDates = user.availability.map((item) => item.date)
    res.json({ availableDates })
  } catch (error) {
    console.error("Get availability error:", error)
    res.status(500).json({ message: "Error fetching availability" })
  }
})

// Get available times for a specific date
router.get("/:id/availability/:date", async (req, res) => {
  try {
    const user = await User.findById(req.params.id)

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    const dateString = req.params.date
    const targetDate = new Date(dateString)

    // Find availability for the specified date
    const dateAvailability = user.availability.find((item) => {
      const itemDate = new Date(item.date)
      return itemDate.toDateString() === targetDate.toDateString()
    })

    // If no specific times are set for this date, return default times
    if (!dateAvailability || !dateAvailability.times || dateAvailability.times.length === 0) {
      return res.json({ availableTimes: ["09:00", "11:00", "14:00", "16:00", "18:00"] })
    }

    res.json({ availableTimes: dateAvailability.times })
  } catch (error) {
    console.error("Get available times error:", error)
    res.status(500).json({ message: "Error fetching available times" })
  }
})

// Set user availability
router.post("/availability", auth, async (req, res) => {
  try {
    const { availability } = req.body

    const user = await User.findByIdAndUpdate(req.user._id, { availability }, { new: true }).select("-password")

    res.json(user)
  } catch (error) {
    console.error("Set availability error:", error)
    res.status(500).json({ message: "Error setting availability" })
  }
})

module.exports = router
