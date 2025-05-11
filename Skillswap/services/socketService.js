import { io } from "socket.io-client"
import AsyncStorage from "@react-native-async-storage/async-storage"

let socket = null

export const initializeSocket = async () => {
  try {
    const socketUrl = "http://192.168.100.4:3000"
    const token = await AsyncStorage.getItem("token")

    if (!token) {
      console.log("No token available for socket connection")
      return null
    }

    // Close existing connection if any
    if (socket) {
      socket.disconnect()
    }

    console.log("Connecting to socket at:", socketUrl)

    // Create new connection with more detailed options
    socket = io(socketUrl, {
      auth: { token },
      transports: ["websocket"], // Force WebSocket transport
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000, // Increase timeout
      forceNew: true,
      path: "/socket.io", // Make sure this matches your server's socket.io path
    })

    // Setup event listeners
    socket.on("connect", () => {
      console.log("Socket connected successfully:", socket.id)
    })

    socket.on("connect_error", (err) => {
      console.log("Socket connection error:", err.message)
      console.log("Error details:", err)
    })

    socket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason)
    })

    socket.on("error", (error) => {
      console.log("Socket error:", error)
    })

    socket.io.on("error", (error) => {
      console.log("Transport error:", error)
    })

    socket.io.on("reconnect_attempt", (attempt) => {
      console.log(`Socket reconnection attempt ${attempt}`)
    })

    return socket
  } catch (error) {
    console.log("Error initializing socket:", error)
    return null
  }
}

export const getSocket = () => {
  return socket
}

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect()
    socket = null
    console.log("Socket disconnected")
  }
}

export const joinRoom = (roomId) => {
  if (socket && socket.connected) {
    console.log("Joining room:", roomId)
    socket.emit("join_room", { roomId })
  } else {
    console.log("Cannot join room: socket not connected")
  }
}

export const leaveRoom = (roomId) => {
  if (socket && socket.connected) {
    console.log("Leaving room:", roomId)
    socket.emit("leave_room", { roomId })
  }
}

export const joinUserRoom = (userId) => {
  if (socket && socket.connected && userId) {
    console.log("Joining user room:", userId)
    socket.emit("join_user_room", { userId })
  }
}

export const leaveUserRoom = (userId) => {
  if (socket && socket.connected && userId) {
    console.log("Leaving user room:", userId)
    socket.emit("leave_user_room", { userId })
  }
}

export const markMessagesAsRead = (chatId, userId) => {
  if (socket && socket.connected) {
    console.log("Marking messages as read:", chatId)
    socket.emit("mark_messages_read", { chatId, userId })
  }
}

export const sendTypingStatus = (chatId, userId, isTyping) => {
  if (socket && socket.connected) {
    socket.emit("typing", { chatId, userId, isTyping })
  }
}
