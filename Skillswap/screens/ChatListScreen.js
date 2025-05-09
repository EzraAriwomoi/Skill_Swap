"use client";

import { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  Platform,
  StatusBar,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import api from "../services/api";
import { LinearGradient } from "expo-linear-gradient";
import Feather from "react-native-vector-icons/Feather";

export default function ChatListScreen({ navigation }) {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  useFocusEffect(
    useCallback(() => {
      fetchChats();
    }, [])
  );

  const fetchChats = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get("/messages/chats");
      setChats(response.data);
    } catch (error) {
      console.log("Error fetching chats", error);
      setError("Failed to load chats. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchChats();
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const handleChatPress = (chat) => {
    navigation.navigate("Chat", {
      chatId: chat.id,
      userName: chat.user.name,
      userId: chat.user.id,
    });
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00acc1" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchChats}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={["#00acc1", "rgba(0, 172, 193, 0)"]}
        style={styles.gradientBackground}
      />
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Chats</Text>
        </View>
        <FlatList
          data={chats}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.chatItem}
              onPress={() => handleChatPress(item)}
            >
              <Image
                source={{ uri: item.user.photoUrl }}
                style={styles.avatar}
                defaultSource={require("../assets/default-avatar.png")}
              />
              <View style={styles.chatContent}>
                <View style={styles.chatHeader}>
                  <Text style={styles.userName}>{item.user.name}</Text>
                  <Text style={styles.timestamp}>
                    {item.lastMessage?.timestamp ? (
                      <>
                        <Feather
                          name="clock"
                          size={12}
                          color="#888"
                          style={{ marginRight: 3 }}
                        />
                        {formatTime(item.lastMessage.timestamp)}
                      </>
                    ) : (
                      <Feather name="clock" size={12} color="#ccc" />
                    )}
                  </Text>
                </View>
                <View style={styles.messageContainer}>
                  <Text
                    style={[
                      styles.message,
                      item.lastMessage &&
                        !item.lastMessage.read &&
                        styles.unreadMessage,
                    ]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {item.lastMessage?.content || "No messages yet"}
                  </Text>
                  {item.lastMessage && !item.lastMessage.read && (
                    <View style={styles.unreadBadge} />
                  )}
                </View>
              </View>
              <Feather name="chevron-right" size={20} color="#ccc" />
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#00acc1"]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Feather
                name="message-square"
                size={40}
                color="#ccc"
                marginBottom={10}
              />
              <Text style={styles.emptyText}>No conversations yet</Text>
              <Text style={styles.emptySubText}>
                Start chatting with tutors or students
              </Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "transparent",
  },
  container: {
    flex: 1,
    backgroundColor: "#f4f6f8",
  },
  gradientBackground: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: 120,
  },
  header: {
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight + 15 : 15,
    paddingBottom: 15,
    paddingHorizontal: 20,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
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
    paddingBottom: 20,
    flexGrow: 1,
  },
  chatItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
  },
  chatContent: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 7,
  },
  userName: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#333",
  },
  timestamp: {
    fontSize: 13,
    color: "#888",
    flexDirection: "row",
    alignItems: "center",
  },
  messageContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  message: {
    flex: 1,
    fontSize: 15,
    color: "#555",
  },
  unreadMessage: {
    fontWeight: "bold",
    color: "#222",
  },
  unreadBadge: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#00acc1",
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#777",
    marginBottom: 10,
  },
  emptySubText: {
    fontSize: 16,
    color: "#999",
    textAlign: "center",
  },
});
