"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator } from "react-native"
import api from "../services/api"

export default function ChatListScreen({ navigation }) {
  const [chats, setChats] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchChats()
  }, [])

  const fetchChats = async () => {
    try {
      setLoading(true)
      const response = await api.get("/messages/chats")
      setChats(response.data)
    } catch (error) {
      console.log("Error fetching chats", error)
    } finally {
      setLoading(false)
    }
  }

  // Mock data for development
  const mockChats = [
    {
      id: "1",
      user: {
        id: "101",
        name: "John Doe",
        photoUrl: "https://via.placeholder.com/50",
      },
      lastMessage: {
        content: "Hey, are you available for a JavaScript lesson tomorrow?",
        timestamp: "2023-06-15T14:30:00Z",
        read: true,
      },
    },
    {
      id: "2",
      user: {
        id: "102",
        name: "Sarah Smith",
        photoUrl: "https://via.placeholder.com/50",
      },
      lastMessage: {
        content: "Thanks for the guitar lesson! It was really helpful.",
        timestamp: "2023-06-14T18:45:00Z",
        read: false,
      },
    },
    {
      id: "3",
      user: {
        id: "103",
        name: "Michael Brown",
        photoUrl: "https://via.placeholder.com/50",
      },
      lastMessage: {
        content: "I'd like to schedule another French lesson next week.",
        timestamp: "2023-06-13T09:15:00Z",
        read: true,
      },
    },
  ]

  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const handleChatPress = (chat) => {
    navigation.navigate("Chat", {
      chatId: chat.id,
      userName: chat.user.name,
      userId: chat.user.id,
    })
  }

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      ) : (
        <FlatList
          data={mockChats}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.chatItem} onPress={() => handleChatPress(item)}>
              <Image source={{ uri: item.user.photoUrl }} style={styles.avatar} />
              <View style={styles.chatContent}>
                <View style={styles.chatHeader}>
                  <Text style={styles.userName}>{item.user.name}</Text>
                  <Text style={styles.timestamp}>{formatTime(item.lastMessage.timestamp)}</Text>
                </View>
                <View style={styles.messageContainer}>
                  <Text style={[styles.message, !item.lastMessage.read && styles.unreadMessage]} numberOfLines={1}>
                    {item.lastMessage.content}
                  </Text>
                  {!item.lastMessage.read && <View style={styles.unreadBadge} />}
                </View>
              </View>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    padding: 15,
  },
  chatItem: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  chatContent: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  userName: {
    fontSize: 16,
    fontWeight: "bold",
  },
  timestamp: {
    fontSize: 12,
    color: "#666",
  },
  messageContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  message: {
    flex: 1,
    fontSize: 14,
    color: "#666",
  },
  unreadMessage: {
    fontWeight: "bold",
    color: "#333",
  },
  unreadBadge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#6366f1",
    marginLeft: 5,
  },
})
