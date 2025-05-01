const express = require("express")
const jwt = require("jsonwebtoken")
const User = require("../models/User")
const auth = require("../middleware/auth")

const router = express.Router()

// Signup
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body

    // Check if user already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ message: "User already exists with this email" })
    }

    // Create new user
    const user = new User({
      name,
      email,
      password,
    })

    await user.save()

    // Generate token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" })

    // Return user data (excluding password) and token
    const userObject = user.toObject()
    delete userObject.password

    res.status(201).json({
      user: userObject,
      token,
    })
  } catch (error) {
    console.error("Signup error:", error)
    res.status(500).json({ message: "Error creating user" })
  }
})

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body

    // Find user
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" })
    }

    // Check password
    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" })
    }

    // Generate token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" })

    // Return user data (excluding password) and token
    const userObject = user.toObject()
    delete userObject.password

    res.json({
      user: userObject,
      token,
    })
  } catch (error) {
    console.error("Login error:", error)
    res.status(500).json({ message: "Error logging in" })
  }
})

// Logout - just for API completeness, actual logout happens on client
router.post("/logout", auth, (req, res) => {
  res.status(200).json({ message: "Logged out successfully" })
})

// Validate token
router.get("/validate-token", auth, (req, res) => {
  res.status(200).json({ valid: true })
})

module.exports = router
