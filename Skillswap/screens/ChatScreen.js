"use client";

import { useState, useEffect, useRef, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  SafeAreaView,
  Platform,
  ActivityIndicator,
  Alert,
  Keyboard,
  Dimensions,
} from "react-native";
import { Send } from "lucide-react-native";
import { AuthContext } from "../context/AuthContext";
import api from "../services/api";
import { LinearGradient } from "expo-linear-gradient";
import {
  getSocket,
  joinRoom,
  leaveRoom,
  markMessagesAsRead,
  sendTypingStatus,
} from "../services/socketService";

const { width, height } = Dimensions.get("window");

export default function ChatScreen({ route }) {
  const { chatId, userId } = route.params;
  const { user } = useContext(AuthContext);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const flatListRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    fetchMessages();

    joinRoom(chatId);
    markMessagesAsRead(chatId, user.id);

    // Listen for new messages
    const socket = getSocket();
    if (socket) {
      socket.on("new_message", (data) => {
        if (data.chatId === chatId) {
          setMessages((prevMessages) => [
            ...prevMessages,
            {
              ...data,
              id: data._id || `temp-${Date.now()}`,
              timestamp: data.createdAt || new Date().toISOString(),
            },
          ]);

          // Mark message as read since we're in the chat
          markMessagesAsRead(chatId, user.id);
        }
      });

      // Listen for typing status
      socket.on("typing_status", (data) => {
        if (data.chatId === chatId && data.userId !== user.id) {
          setOtherUserTyping(data.isTyping);
        }
      });
    }

    // Keyboard listeners
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      () => {
        setKeyboardVisible(true);
        setTimeout(() => {
          if (flatListRef.current && messages.length > 0) {
            flatListRef.current.scrollToEnd({ animated: true });
          }
        }, 100);
      }
    );

    const keyboardDidHideListener = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => {
        setKeyboardVisible(false);
      }
    );

    return () => {
      // Leave chat room when component unmounts
      leaveRoom(chatId);

      const socket = getSocket();
      if (socket) {
        socket.off("new_message");
        socket.off("typing_status");
      }

      // Clear typing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, [chatId, user.id]);

  useEffect(() => {
    flatListRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const fetchMessages = async (refresh = false) => {
    try {
      setLoading(true);
      setError(null);
      const currentPage = refresh ? 1 : page;
      const response = await api.get(
        `/messages/${chatId}?page=${currentPage}&limit=20`
      );

      const fetchedMessages = response.data.messages.map((msg) => ({
        ...msg,
        id: msg._id ? msg._id.toString() : msg._id,
        timestamp: msg.createdAt || msg.updatedAt || new Date().toISOString(),
      }));
      setHasMore(response.data.hasMore);

      if (refresh || currentPage === 1) {
        setMessages(fetchedMessages.reverse());
        setPage(2);
      } else {
        setMessages((prevMessages) => [...fetchedMessages, ...prevMessages]);
        setPage(currentPage + 1);
      }
    } catch (error) {
      console.log("Error fetching messages", error);
      setError("Failed to load messages. Please try again.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMoreMessages = async () => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);
    try {
      const response = await api.get(
        `/messages/${chatId}?page=${page}&limit=20`
      );
      const newMessages = response.data.messages;

      if (newMessages.length > 0) {
        setMessages((prevMessages) => [...newMessages, ...prevMessages]);
        setPage(page + 1);
        setHasMore(response.data.hasMore);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.log("Error loading more messages", error);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleInputChange = (text) => {
    setInputMessage(text);

    // Send typing status
    if (!isTyping) {
      setIsTyping(true);
      sendTypingStatus(chatId, user.id, true);
    }

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator after 3 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      sendTypingStatus(chatId, user.id, false);
    }, 3000);
  };

  const sendMessage = async () => {
    if (inputMessage.trim() === "") return;

    setSending(true);
    const messageText = inputMessage.trim();
    setInputMessage("");

    // Clear typing status
    setIsTyping(false);
    sendTypingStatus(chatId, user.id, false);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    const tempId = `temp-${Date.now()}`;
    const newMessage = {
      id: tempId,
      chatId,
      senderId: user.id,
      receiverId: userId,
      content: messageText,
      timestamp: new Date().toISOString(),
      pending: true,
    };

    setMessages((prevMessages) => [...prevMessages, newMessage]);

    try {
      const response = await api.post("/messages", {
        receiverId: userId,
        content: messageText,
      });

      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.id === tempId
            ? {
                ...response.data,
                id: response.data._id
                  ? response.data._id.toString()
                  : response.data._id,
                timestamp: response.data.createdAt || response.data.updatedAt,
                pending: false,
              }
            : msg
        )
      );
    } catch (error) {
      console.log("Error sending message", error);

      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.id === tempId ? { ...msg, failed: true, pending: false } : msg
        )
      );

      Alert.alert("Error", "Failed to send message. Tap to retry.");
    } finally {
      setSending(false);

      // Scroll to bottom after sending
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const retryMessage = async (failedMessage) => {
    setMessages((prevMessages) =>
      prevMessages.filter((msg) => msg.id !== failedMessage.id)
    );

    setInputMessage(failedMessage.content);
    setTimeout(() => sendMessage(), 100);
  };

  const formatTime = (timestamp) => {
    try {
      // Check if timestamp is undefined or null
      if (!timestamp) {
        console.log("Missing timestamp");
        return "Just now";
      }

      const date = new Date(timestamp);

      // Check if date is invalid after creation
      if (isNaN(date.getTime())) {
        console.log("Invalid date:", timestamp);
        return "Just now";
      }

      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      console.log("Error formatting time:", error);
      return "Just now";
    }
  };

  const formatDate = (timestamp) => {
    try {
      const now = new Date();
      const yesterday = new Date();
      yesterday.setDate(now.getDate() - 1);
      const messageDate = new Date(timestamp);

      if (
        messageDate.toDateString() === now.toDateString() &&
        now.toDateString() === new Date().toDateString()
      ) {
        return "Today";
      } else if (messageDate.toDateString() === yesterday.toDateString()) {
        return "Yesterday";
      } else {
        const diffInDays = Math.floor(
          (now - messageDate) / (1000 * 60 * 60 * 24)
        );
        if (diffInDays < 7) {
          return messageDate.toLocaleDateString([], { weekday: "long" });
        } else {
          return messageDate.toLocaleDateString([], {
            weekday: "short",
            month: "short",
            day: "numeric",
          });
        }
      }
    } catch (error) {
      return "";
    }
  };

  // This is the key function to determine if a message is from the current user
  const isMessageFromCurrentUser = (message) => {
    // First try with user.id (from AuthContext)
    if (user && user.id && String(message.senderId) === String(user.id)) {
      return true;
    }

    // Then try with user._id (in case that's how it's stored)
    if (user && user._id && String(message.senderId) === String(user._id)) {
      return true;
    }

    return false;
  };

  if (loading && messages.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00acc1" />
      </View>
    );
  }

  if (error && messages.length === 0) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => fetchMessages(true)}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["left", "right"]}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <LinearGradient
          colors={["#00acc1", "rgba(0, 172, 193, 0.1)"]}
          style={styles.gradientBackground}
        />
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => {
            const isCurrentUser = isMessageFromCurrentUser(item);
            const showDate =
              index === 0 ||
              new Date(item.timestamp).toDateString() !==
                new Date(messages[index - 1]?.timestamp).toDateString();

            return (
              <>
                {showDate && (
                  <View style={styles.dateContainer}>
                    <Text style={styles.dateText}>
                      {formatDate(item.timestamp)}
                    </Text>
                  </View>
                )}
                <View style={styles.messageRow}>
                  {isCurrentUser ? (
                    // Current user's message (right side)
                    <View style={styles.rightMessageContainer}>
                      <View
                        style={[
                          styles.messageBubble,
                          styles.sentBubble,
                          item.pending && styles.pendingMessage,
                          item.failed && styles.failedMessage,
                        ]}
                      >
                        <Text style={[styles.messageText, styles.sentText]}>
                          {item.content}
                        </Text>
                        <View style={styles.messageFooter}>
                          {item.pending && (
                            <ActivityIndicator size="small" color="#fff" />
                          )}
                          {item.failed && (
                            <TouchableOpacity
                              onPress={() => retryMessage(item)}
                            >
                              <Text style={styles.failedText}>
                                Tap to retry
                              </Text>
                            </TouchableOpacity>
                          )}
                          {!item.pending && !item.failed && (
                            <Text style={[styles.messageTime, styles.sentTime]}>
                              {formatTime(item.timestamp)}
                            </Text>
                          )}
                        </View>
                      </View>
                    </View>
                  ) : (
                    // Other user's message (left side)
                    <View style={styles.leftMessageContainer}>
                      <View
                        style={[
                          styles.messageBubble,
                          styles.receivedBubble,
                          item.pending && styles.pendingMessage,
                          item.failed && styles.failedMessage,
                        ]}
                      >
                        <Text style={[styles.messageText, styles.receivedText]}>
                          {item.content}
                        </Text>
                        <View style={styles.messageFooter}>
                          {item.pending && (
                            <ActivityIndicator size="small" color="#00acc1" />
                          )}
                          {item.failed && (
                            <TouchableOpacity
                              onPress={() => retryMessage(item)}
                            >
                              <Text style={styles.failedText}>
                                Tap to retry
                              </Text>
                            </TouchableOpacity>
                          )}
                          {!item.pending && !item.failed && (
                            <Text
                              style={[styles.messageTime, styles.receivedTime]}
                            >
                              {formatTime(item.timestamp)}
                            </Text>
                          )}
                        </View>
                      </View>
                    </View>
                  )}
                </View>
              </>
            );
          }}
          contentContainerStyle={styles.messagesList}
          onEndReached={hasMore ? loadMoreMessages : null}
          onEndReachedThreshold={0.3}
          onContentSizeChange={() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }}
          ListHeaderComponent={
            loadingMore ? (
              <ActivityIndicator
                size="small"
                color="#00acc1"
                style={styles.loadingMore}
              />
            ) : null
          }
          ListFooterComponent={
            otherUserTyping ? (
              <View style={styles.typingContainer}>
                <View style={styles.typingBubble}>
                  <Text style={styles.typingText}>Typing</Text>
                  <View style={styles.typingDots}>
                    <View style={[styles.typingDot, styles.typingDot1]} />
                    <View style={[styles.typingDot, styles.typingDot2]} />
                    <View style={[styles.typingDot, styles.typingDot3]} />
                  </View>
                </View>
              </View>
            ) : (
              <View style={{ height: 0 }} />
            )
          }
        />

        {/* Input container */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={inputMessage}
            onChangeText={handleInputChange}
            placeholder="Type a message..."
            placeholderTextColor="#999"
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (sending || inputMessage.trim() === "") && styles.disabledButton,
            ]}
            onPress={sendMessage}
            disabled={sending || inputMessage.trim() === ""}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Send size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  gradientBackground: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: 120,
    zIndex: 0,
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
    padding: 16,
    paddingBottom: 16,
  },
  dateContainer: {
    alignItems: "center",
    marginVertical: 16,
  },
  dateText: {
    fontSize: 14,
    color: "#666",
    backgroundColor: "#f0f4f8",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  messageRow: {
    width: "100%",
    marginBottom: 12,
  },
  leftMessageContainer: {
    alignSelf: "flex-start",
    maxWidth: "80%",
  },
  rightMessageContainer: {
    alignSelf: "flex-end",
    maxWidth: "80%",
  },
  messageBubble: {
    padding: 12,
    borderRadius: 18,
  },
  sentBubble: {
    backgroundColor: "#00acc1",
    borderBottomRightRadius: 4,
  },
  receivedBubble: {
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
    marginBottom: 4,
  },
  sentText: {
    color: "#fff",
  },
  receivedText: {
    color: "#333",
  },
  messageFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  messageTime: {
    fontSize: 12,
    alignSelf: "flex-end",
  },
  sentTime: {
    color: "rgba(255, 255, 255, 0.7)",
  },
  receivedTime: {
    color: "#888",
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
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#ddd",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  input: {
    flex: 1,
    backgroundColor: "#f0f0f0",
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === "ios" ? 10 : 8,
    paddingTop: Platform.OS === "ios" ? 10 : 8, // Ensure consistent padding on iOS and Android
    fontSize: 16,
    marginRight: 12,
    maxHeight: 100,
    minHeight: 40,
    color: "#333",
  },
  sendButton: {
    backgroundColor: "#00acc1",
    borderRadius: 24,
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  disabledButton: {
    backgroundColor: "#ccc",
  },
  typingContainer: {
    alignItems: "flex-start",
    marginTop: 8,
  },
  typingBubble: {
    backgroundColor: "#f0f0f0",
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  typingText: {
    fontSize: 14,
    color: "#666",
    marginRight: 5,
  },
  typingDots: {
    flexDirection: "row",
    alignItems: "center",
  },
  typingDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#666",
    marginHorizontal: 1,
  },
  typingDot1: {
    opacity: 0.4,
    transform: [{ scale: 0.9 }],
  },
  typingDot2: {
    opacity: 0.7,
    transform: [{ scale: 1 }],
  },
  typingDot3: {
    opacity: 1,
    transform: [{ scale: 1.1 }],
  },
});
