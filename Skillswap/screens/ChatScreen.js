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
  Alert,
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
  const [error, setError] = useState(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const flatListRef = useRef(null)

  useEffect(() => {
    fetchMessages()
  }, [])

  const fetchMessages = async (refresh = false) => {
    try {
      setLoading(true)
      setError(null)
      const currentPage = refresh ? 1 : page
      const response = await api.get(`/messages/${chatId}?page=${currentPage}&limit=20`)

      const newMessages = response.data.messages
      setHasMore(response.data.hasMore)

      if (refresh || currentPage === 1) {
        setMessages(newMessages)
        setPage(2)
      } else {
        setMessages((prevMessages) => [...prevMessages, ...newMessages])
        setPage(currentPage + 1)
      }
    } catch (error) {
      console.log("Error fetching messages", error)
      setError("Failed to load messages. Please try again.")
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  const loadMoreMessages = async () => {
    if (loadingMore || !hasMore) return

    setLoadingMore(true)
    try {
      const response = await api.get(`/messages/${chatId}?page=${page}&limit=20`)
      const newMessages = response.data.messages

      if (newMessages.length > 0) {
        setMessages((prevMessages) => [...prevMessages, ...newMessages])
        setPage(page + 1)
        setHasMore(response.data.hasMore)
      } else {
        setHasMore(false)
      }
    } catch (error) {
      console.log("Error loading more messages", error)
    } finally {
      setLoadingMore(false)
    }
  }

  const sendMessage = async () => {
    if (inputMessage.trim() === "") return

    setSending(true)
    const messageText = inputMessage.trim()
    setInputMessage("")

    // Optimistically add message to UI
    const tempId = `temp-${Date.now()}`
    const newMessage = {
      id: tempId,
      chatId,
      senderId: user.id,
      receiverId: userId,
      content: messageText,
      timestamp: new Date().toISOString(),
      pending: true,
    }

    setMessages((prevMessages) => [newMessage, ...prevMessages])

    try {
      const response = await api.post("/messages", {
        receiverId: userId,
        content: messageText,
      })

      // Replace the temporary message with the real one from the server
      setMessages((prevMessages) =>
        prevMessages.map((msg) => (msg.id === tempId ? { ...response.data, pending: false } : msg)),
      )
    } catch (error) {
      console.log("Error sending message", error)

      // Mark message as failed
      setMessages((prevMessages) =>
        prevMessages.map((msg) => (msg.id === tempId ? { ...msg, failed: true, pending: false } : msg)),
      )

      Alert.alert("Error", "Failed to send message. Tap to retry.")
    } finally {
      setSending(false)
    }
  }

  const retryMessage = async (failedMessage) => {
    // Remove the failed message
    setMessages((prevMessages) => prevMessages.filter((msg) => msg.id !== failedMessage.id))

    // Set the content to input and trigger send
    setInputMessage(failedMessage.content)
    setTimeout(() => sendMessage(), 100)
  }

  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  if (loading && messages.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00acc1" />
      </View>
    )
  }

  if (error && messages.length === 0) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => fetchMessages(true)}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
      keyboardVerticalOffset={90}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const isCurrentUser = item.senderId === user?.id
          return (
            <TouchableOpacity
              style={[
                styles.messageBubble,
                isCurrentUser ? styles.sentMessage : styles.receivedMessage,
                item.pending && styles.pendingMessage,
                item.failed && styles.failedMessage,
              ]}
              disabled={!item.failed}
              onPress={() => item.failed && retryMessage(item)}
            >
              <Text style={[styles.messageText, isCurrentUser ? styles.sentMessageText : styles.receivedMessageText]}>
                {item.content}
              </Text>
              <View style={styles.messageFooter}>
                {item.pending && <ActivityIndicator size="small" color={isCurrentUser ? "#fff" : "#00acc1"} />}
                {item.failed && <Text style={styles.failedText}>Tap to retry</Text>}
                {!item.pending && !item.failed && <Text style={styles.messageTime}>{formatTime(item.timestamp)}</Text>}
              </View>
            </TouchableOpacity>
          )
        }}
        contentContainerStyle={styles.messagesList}
        inverted={true}
        onEndReached={hasMore ? loadMoreMessages : null}
        onEndReachedThreshold={0.3}
        ListFooterComponent={
          loadingMore ? <ActivityIndicator size="small" color="#00acc1" style={styles.loadingMore} /> : null
        }
      />

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
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: "#ef4444",
    textAlign: "center",
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: "#00acc1",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontWeight: "bold",
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
    backgroundColor: "#00acc1",
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
  pendingMessage: {
    opacity: 0.7,
  },
  failedMessage: {
    backgroundColor: "#fee2e2",
    borderColor: "#ef4444",
    borderWidth: 1,
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
  messageFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginTop: 4,
  },
  messageTime: {
    fontSize: 10,
    color: "rgba(255, 255, 255, 0.7)",
    alignSelf: "flex-end",
  },
  failedText: {
    fontSize: 10,
    color: "#ef4444",
    fontStyle: "italic",
  },
  loadingMore: {
    marginVertical: 10,
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
    backgroundColor: "#00acc1",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },
})
