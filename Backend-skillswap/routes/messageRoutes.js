const express = require("express")
const mongoose = require("mongoose")
const Message = require("../models/Message")
const User = require("../models/User")
const auth = require("../middleware/auth")

const router = express.Router()

// Get all chats for current user
router.get("/chats", auth, async (req, res) => {
  try {
    // Find all messages where current user is sender or receiver
    const messages = await Message.find({
      $or: [{ senderId: req.user._id }, { receiverId: req.user._id }],
    }).sort({ createdAt: -1 })

    // Extract unique chat IDs and the other user's ID in each chat
    const chats = {}
    messages.forEach((message) => {
      const chatId = message.chatId
      if (!chats[chatId]) {
        // Determine the other user in the conversation
        const otherUserId = message.senderId.equals(req.user._id) ? message.receiverId : message.senderId

        chats[chatId] = {
          id: chatId,
          otherUserId,
          lastMessage: {
            content: message.content,
            timestamp: message.createdAt,
            read: message.read,
          },
        }
      }
    })

    // Get user details for each chat
    const chatArray = Object.values(chats)
    const userIds = chatArray.map((chat) => chat.otherUserId)

    const users = await User.find({
      _id: { $in: userIds },
    }).select("name photoUrl")

    // Map users to chats
    const userMap = {}
    users.forEach((user) => {
      userMap[user._id] = user
    })

    const formattedChats = chatArray.map((chat) => ({
      id: chat.id,
      user: {
        id: chat.otherUserId,
        name: userMap[chat.otherUserId]?.name || "Unknown User",
        photoUrl: userMap[chat.otherUserId]?.photoUrl || "",
      },
      lastMessage: chat.lastMessage,
    }))

    res.json(formattedChats)
  } catch (error) {
    console.error("Get chats error:", error)
    res.status(500).json({ message: "Error fetching chats" })
  }
})

// Get messages for a specific chat
router.get("/:chatId", auth, async (req, res) => {
  try {
    const { chatId } = req.params
    const { page = 1, limit = 20 } = req.query

    const skip = (page - 1) * limit

    // Find messages for this chat
    const messages = await Message.find({ chatId }).sort({ createdAt: -1 }).skip(skip).limit(Number.parseInt(limit))

    // Count total messages for pagination
    const total = await Message.countDocuments({ chatId })

    // Mark unread messages as read if current user is the receiver
    await Message.updateMany(
      {
        chatId,
        receiverId: req.user._id,
        read: false,
      },
      { read: true },
    )

    res.json({
      messages,
      hasMore: skip + messages.length < total,
    })
  } catch (error) {
    console.error("Get messages error:", error)
    res.status(500).json({ message: "Error fetching messages" })
  }
})

// Send a message
router.post("/", auth, async (req, res) => {
  try {
    const { receiverId, content } = req.body

    if (!content || !receiverId) {
      return res.status(400).json({ message: "Receiver ID and content are required" })
    }

    // Check if receiver exists
    const receiver = await User.findById(receiverId)
    if (!receiver) {
      return res.status(404).json({ message: "Receiver not found" })
    }

    // Create chat ID (sorted user IDs to ensure consistency)
    const users = [req.user._id.toString(), receiverId].sort()
    const chatId = `chat-${users.join("-")}`

    // Create and save message
    const message = new Message({
      chatId,
      senderId: req.user._id,
      receiverId,
      content,
      read: false,
    })

    await message.save()

    res.status(201).json(message)
  } catch (error) {
    console.error("Send message error:", error)
    res.status(500).json({ message: "Error sending message" })
  }
})

module.exports = router
