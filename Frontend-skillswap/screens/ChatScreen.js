"use client"

import { useState, useEffect, useRef, useContext } from "react"
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native"
import { Send } from "lucide-react-native"
import { AuthContext } from "../context/AuthContext"
import api from "../services/api"

export default function ChatScreen({ route }) {
  const { chatId, userId } = route.params
  const { user } = useContext(AuthContext)
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const flatListRef = useRef(null)

  useEffect(() => {
    fetchMessages()
  }, [])

  const fetchMessages = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/messages/${chatId}`)
      setMessages(response.data)
    } catch (error) {
      console.log("Error fetching messages", error)
    } finally {
      setLoading(false)
    }
  }

  const sendMessage = async () => {
    if (inputMessage.trim() === "") return

    setSending(true)
    const newMessage = {
      id: Date.now().toString(),
      chatId,
      senderId: user.id,
      receiverId: userId,
      content: inputMessage,
      timestamp: new Date().toISOString(),
      sent: true,
    }

    setMessages((prevMessages) => [...prevMessages, newMessage])
    setInputMessage("")

    try {
      await api.post("/messages", {
        receiverId: userId,
        content: inputMessage,
      })
    } catch (error) {
      console.log("Error sending message", error)
    } finally {
      setSending(false)
    }
  }

  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  // Mock data for development
  const mockMessages = [
    {
      id: "1",
      senderId: "101",
      content: "Hi there! I saw you're teaching JavaScript. I'd like to learn more about React.",
      timestamp: "2023-06-15T14:30:00Z",
    },
    {
      id: "2",
      senderId: user?.id || "current-user",
      content: "Hey! Yes, I'd be happy to teach you React. When would you like to start?",
      timestamp: "2023-06-15T14:32:00Z",
    },
    {
      id: "3",
      senderId: "101",
      content: "That's great! How about next Monday at 6 PM?",
      timestamp: "2023-06-15T14:35:00Z",
    },
    {
      id: "4",
      senderId: user?.id || "current-user",
      content: "Monday at 6 PM works for me. We can start with the basics of React components.",
      timestamp: "2023-06-15T14:38:00Z",
    },
    {
      id: "5",
      senderId: "101",
      content: "Perfect! Looking forward to it. Should I prepare anything beforehand?",
      timestamp: "2023-06-15T14:40:00Z",
    },
  ]

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
      keyboardVerticalOffset={90}
    >
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={mockMessages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const isCurrentUser = item.senderId === user?.id
            return (
              <View style={[styles.messageBubble, isCurrentUser ? styles.sentMessage : styles.receivedMessage]}>
                <Text style={[styles.messageText, isCurrentUser ? styles.sentMessageText : styles.receivedMessageText]}>
                  {item.content}
                </Text>
                <Text style={styles.messageTime}>{formatTime(item.timestamp)}</Text>
              </View>
            )
          }}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />
      )}

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={inputMessage}
          onChangeText={setInputMessage}
          placeholder="Type a message..."
          multiline
        />
        <TouchableOpacity
          style={styles.sendButton}
          onPress={sendMessage}
          disabled={sending || inputMessage.trim() === ""}
        >
          {sending ? <ActivityIndicator size="small" color="#fff" /> : <Send size={20} color="#fff" />}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
  messagesList: {
    padding: 15,
  },
  messageBubble: {
    maxWidth: "80%",
    padding: 12,
    borderRadius: 18,
    marginBottom: 10,
  },
  sentMessage: {
    alignSelf: "flex-end",
    backgroundColor: "#6366f1",
    borderBottomRightRadius: 4,
  },
  receivedMessage: {
    alignSelf: "flex-start",
    backgroundColor: "#fff",
    borderBottomLeftRadius: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  messageText: {
    fontSize: 16,
  },
  sentMessageText: {
    color: "#fff",
  },
  receivedMessageText: {
    color: "#333",
  },
  messageTime: {
    fontSize: 10,
    color: "rgba(255, 255, 255, 0.7)",
    alignSelf: "flex-end",
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: "row",
    padding: 10,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#eee",
    alignItems: "center",
  },
  input: {
    flex: 1,
    backgroundColor: "#f0f2f5",
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: "#6366f1",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },
})
