"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  Platform,
  StatusBar,
  Animated,
  Dimensions,
} from "react-native"
import { useFocusEffect } from "@react-navigation/native"
import api from "../services/api"
import { LinearGradient } from "expo-linear-gradient"
import { io } from "socket.io-client"
import Feather from "react-native-vector-icons/Feather"
import { useContext } from "react"
import { AuthContext } from "../context/AuthContext"
import AsyncStorage from "@react-native-async-storage/async-storage"

const { width } = Dimensions.get("window")

export default function ChatListScreen({ navigation }) {
  const { user } = useContext(AuthContext)
  const [chats, setChats] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const socket = useRef(null)
  const scrollY = useRef(new Animated.Value(0)).current

  // Connect to socket when component mounts
  useEffect(() => {
    // Initialize socket connection
    const connectSocket = async () => {
      try {
        const socketUrl = process.env.SOCKET_URL || "http://192.168.100.4:3000" // Use same URL as your API
        const token = await AsyncStorage.getItem("token")

        socket.current = io(socketUrl, {
          auth: {
            token: token,
          },
          transports: ["websocket"], // Force WebSocket transport
        })

        // Listen for connection events
        socket.current.on("connect", () => {
          console.log("Socket connected")
        })

        socket.current.on("connect_error", (err) => {
          console.log("Socket connection error:", err.message)
        })

        // Listen for new messages
        socket.current.on("new_message", (data) => {
          console.log("New message received:", data)
          updateChatWithNewMessage(data)
        })

        // Listen for read status updates
        socket.current.on("message_read", (data) => {
          console.log("Message read status updated:", data)
          updateMessageReadStatus(data)
        })
      } catch (error) {
        console.log("Socket connection error:", error)
      }
    }

    connectSocket()

    return () => {
      // Disconnect socket when component unmounts
      if (socket.current) {
        socket.current.disconnect()
      }
    }
  }, [])

  // Fetch chats when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchChats()

      // Join user's room for real-time updates
      if (socket.current && user) {
        socket.current.emit("join_user_room", { userId: user.id })
      }

      return () => {
        // Leave room when screen loses focus
        if (socket.current && user) {
          socket.current.emit("leave_user_room", { userId: user.id })
        }
      }
    }, [user]),
  )

  const fetchChats = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.get("/messages/chats")
      setChats(response.data)
    } catch (error) {
      console.log("Error fetching chats", error)
      setError("Failed to load chats. Please try again.")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const updateChatWithNewMessage = (messageData) => {
    setChats((prevChats) => {
      // Find if we already have this chat
      const chatIndex = prevChats.findIndex((chat) => chat.id === messageData.chatId)

      if (chatIndex >= 0) {
        // Update existing chat
        const updatedChats = [...prevChats]
        updatedChats[chatIndex] = {
          ...updatedChats[chatIndex],
          lastMessage: {
            content: messageData.content,
            timestamp: messageData.createdAt || new Date().toISOString(),
            read: messageData.senderId === user.id, // Messages sent by current user are considered read
          },
          unreadCount:
            messageData.senderId !== user.id
              ? (updatedChats[chatIndex].unreadCount || 0) + 1
              : updatedChats[chatIndex].unreadCount,
        }

        // Move this chat to the top
        const chatToMove = updatedChats.splice(chatIndex, 1)[0]
        return [chatToMove, ...updatedChats]
      } else {
        // This is a new chat, we should fetch all chats to get the complete data
        fetchChats()
        return prevChats
      }
    })
  }

  const updateMessageReadStatus = (data) => {
    setChats((prevChats) => {
      const chatIndex = prevChats.findIndex((chat) => chat.id === data.chatId)

      if (chatIndex >= 0) {
        const updatedChats = [...prevChats]
        updatedChats[chatIndex] = {
          ...updatedChats[chatIndex],
          lastMessage: {
            ...updatedChats[chatIndex].lastMessage,
            read: true,
          },
          unreadCount: 0,
        }
        return updatedChats
      }
      return prevChats
    })
  }

  const onRefresh = () => {
    setRefreshing(true)
    fetchChats()
  }

  const formatTime = (timestamp) => {
    if (!timestamp) return ""

    const now = new Date()
    const messageDate = new Date(timestamp)

    // Check if the message is from today
    if (
      messageDate.getDate() === now.getDate() &&
      messageDate.getMonth() === now.getMonth() &&
      messageDate.getFullYear() === now.getFullYear()
    ) {
      return messageDate.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    }

    // Check if the message is from yesterday
    const yesterday = new Date(now)
    yesterday.setDate(now.getDate() - 1)
    if (
      messageDate.getDate() === yesterday.getDate() &&
      messageDate.getMonth() === yesterday.getMonth() &&
      messageDate.getFullYear() === yesterday.getFullYear()
    ) {
      return "Yesterday"
    }

    // Check if the message is from this week
    const oneWeekAgo = new Date(now)
    oneWeekAgo.setDate(now.getDate() - 7)
    if (messageDate > oneWeekAgo) {
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
      return days[messageDate.getDay()]
    }

    // Otherwise, return the date
    return messageDate.toLocaleDateString([], {
      month: "short",
      day: "numeric",
    })
  }

  const handleChatPress = (chat) => {
    // Mark messages as read when opening the chat
    if (chat.unreadCount > 0 && socket.current) {
      socket.current.emit("mark_messages_read", {
        chatId: chat.id,
        userId: user.id,
      })
    }

    navigation.navigate("Chat", {
      chatId: chat.id,
      userName: chat.user.name,
      userId: chat.user.id,
    })
  }

  // Animated header
  const headerHeight = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [Platform.OS === "android" ? StatusBar.currentHeight + 60 : 80, 60],
    extrapolate: "clamp",
  })

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 60],
    outputRange: [1, 0.9],
    extrapolate: "clamp",
  })

  const titleSize = scrollY.interpolate({
    inputRange: [0, 60],
    outputRange: [28, 22],
    extrapolate: "clamp",
  })

  // Render read status indicators
  const renderReadStatus = (message, unreadCount) => {
    if (!message) return null

    if (message.senderId === user?.id) {
      // Message sent by current user - show read status
      return (
        <View style={styles.readStatusContainer}>
          {message.read ? (
            <Feather name="check-circle" size={14} color="#4CAF50" />
          ) : (
            <Feather name="check" size={14} color="#888" />
          )}
        </View>
      )
    } else if (unreadCount > 0) {
      // Unread message from other user
      return (
        <View style={styles.unreadBadge}>
          <Text style={styles.unreadBadgeText}>{unreadCount > 99 ? "99+" : unreadCount}</Text>
        </View>
      )
    }

    return null
  }

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00acc1" />
      </View>
    )
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchChats}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient colors={["#00acc1", "rgba(0, 172, 193, 0)"]} style={styles.gradientBackground} />
      <View style={styles.container}>
        {/* <Animated.View
          style={[
            styles.header,
            {
              height: headerHeight,
              opacity: headerOpacity,
            },
          ]}
        >
          <Animated.Text style={[styles.title, { fontSize: titleSize }]}>Messages</Animated.Text>
        </Animated.View> */}

        <Animated.FlatList
          data={chats}
          keyExtractor={(item) => item.id.toString()}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.chatItem} onPress={() => handleChatPress(item)} activeOpacity={0.7}>
              <View style={styles.avatarContainer}>
                {item.user.photoUrl ? (
                  <Image
                    source={{ uri: item.user.photoUrl }}
                    style={styles.avatar}
                    defaultSource={require("../assets/default-avatar.png")}
                  />
                ) : (
                  <View style={[styles.avatar, styles.defaultAvatar]}>
                    <Text style={styles.avatarText}>{item.user.name.charAt(0).toUpperCase()}</Text>
                  </View>
                )}
                {item.user.online && <View style={styles.onlineIndicator} />}
              </View>

              <View style={styles.chatContent}>
                <View style={styles.chatHeader}>
                  <Text style={styles.userName}>{item.user.name}</Text>
                  <Text style={styles.timestamp}>
                    {item.lastMessage?.timestamp ? formatTime(item.lastMessage.timestamp) : ""}
                  </Text>
                </View>

                <View style={styles.messageContainer}>
                  <Text
                    style={[
                      styles.message,
                      item.unreadCount > 0 && item.lastMessage?.senderId !== user?.id && styles.unreadMessage,
                    ]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {item.lastMessage?.senderId === user?.id && <Text style={styles.youPrefix}>You: </Text>}
                    {item.lastMessage?.content || "No messages yet"}
                  </Text>

                  {renderReadStatus(item.lastMessage, item.unreadCount)}
                </View>
              </View>
            </TouchableOpacity>
          )}
          contentContainerStyle={[styles.listContent, chats.length === 0 && styles.emptyListContent]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#00acc1"]} tintColor="#00acc1" />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconContainer}>
                <Feather name="message-square" size={50} color="#ccc" />
              </View>
              <Text style={styles.emptyText}>No conversations yet</Text>
              <Text style={styles.emptySubText}>Start chatting with tutors or students</Text>
              <TouchableOpacity style={styles.findPeopleButton} onPress={() => navigation.navigate("Home")}>
                <Text style={styles.findPeopleButtonText}>Find People</Text>
              </TouchableOpacity>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  container: {
    flex: 1,
  },
  // gradientBackground: {
  //   position: "absolute",
  //   left: 0,
  //   right: 0,
  //   top: 0,
  //   height: 60,
  // },
  header: {
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight + 15 : 15,
    paddingBottom: 15,
    paddingHorizontal: 20,
    justifyContent: "flex-end",
    zIndex: 10,
  },
  title: {
    fontWeight: "bold",
    color: "#fff",
    textShadowColor: "rgba(0, 0, 0, 0.1)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#f8f9fa",
  },
  errorText: {
    fontSize: 16,
    color: "#d32f2f",
    textAlign: "center",
    marginBottom: 15,
  },
  retryButton: {
    backgroundColor: "#00acc1",
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  listContent: {
    paddingHorizontal: 15,
    paddingTop: 5,
    paddingBottom: 20,
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: "center",
  },
  chatItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  avatarContainer: {
    position: "relative",
    marginRight: 15,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  defaultAvatar: {
    backgroundColor: "#00acc1",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
  },
  onlineIndicator: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#4CAF50",
    borderWidth: 2,
    borderColor: "#fff",
  },
  chatContent: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  userName: {
    fontSize: 17,
    fontWeight: "600",
    color: "#333",
  },
  timestamp: {
    fontSize: 13,
    color: "#888",
  },
  messageContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  message: {
    flex: 1,
    fontSize: 15,
    color: "#666",
  },
  youPrefix: {
    color: "#888",
    fontWeight: "500",
  },
  unreadMessage: {
    fontWeight: "bold",
    color: "#222",
  },
  readStatusContainer: {
    marginLeft: 5,
    flexDirection: "row",
    alignItems: "center",
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#00acc1",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
    paddingHorizontal: 5,
  },
  unreadBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "bold",
  },
  emptyContainer: {
    alignItems: "center",
    padding: 40,
  },
  emptyIconContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#555",
    marginBottom: 10,
  },
  emptySubText: {
    fontSize: 16,
    color: "#888",
    textAlign: "center",
    marginBottom: 25,
  },
  findPeopleButton: {
    backgroundColor: "#00acc1",
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
  },
  findPeopleButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
})
