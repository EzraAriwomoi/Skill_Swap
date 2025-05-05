require("dotenv").config();
const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
const dotenv = require("dotenv")
const authRoutes = require("./routes/authRoutes")
const userRoutes = require("./routes/userRoutes")
const skillRoutes = require("./routes/skillRoutes")
const messageRoutes = require("./routes/messageRoutes")
const bookingRoutes = require("./routes/bookingRoutes")

dotenv.config()

const app = express()

// Middleware
app.use(cors())
app.use(express.json())

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err))

console.log("Cloudinary config:", {
  name: process.env.CLOUDINARY_CLOUD_NAME,
  key: process.env.CLOUDINARY_API_KEY,
  secret: process.env.CLOUDINARY_API_SECRET ? "Loaded ✅" : "Missing ❌",
});  

// Routes
app.use("/api/auth", authRoutes)
app.use("/api/users", userRoutes)
app.use("/api/skills", skillRoutes)
app.use("/api/messages", messageRoutes)
app.use("/api/bookings", bookingRoutes)

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ message: "Something went wrong!" })
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
