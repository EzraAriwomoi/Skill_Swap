"use client";

import { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { Star, MessageCircle, Calendar } from "lucide-react-native";
import { AuthContext } from "../context/AuthContext";
import api from "../services/api";

export default function UserProfile({ route, navigation }) {
  const { userId } = route.params;
  const { user: currentUser } = useContext(AuthContext);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUserProfile();
  }, [userId]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/users/${userId}`);
      setUser(response.data);
    } catch (error) {
      console.log("Error fetching user profile", error);
      setError("Failed to load user profile. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchUserProfile();
  };

  const handleMessagePress = () => {
    if (!currentUser) {
      Alert.alert("Login Required", "You need to login to send messages", [
        { text: "Cancel", style: "cancel" },
        { text: "Login", onPress: () => navigation.navigate("Auth") },
      ]);
      return;
    }

    // Navigate to the Messages tab first, then to the Chat screen
    navigation.navigate("Messages", {
      screen: "Chat",
      params: {
        chatId: `chat-${userId}`,
        userName: user.name,
        userId: userId,
      },
    });
  };

  const handleBookingPress = () => {
    if (!currentUser) {
      Alert.alert("Login Required", "You need to login to book sessions", [
        { text: "Cancel", style: "cancel" },
        { text: "Login", onPress: () => navigation.navigate("Auth") },
      ]);
      return;
    }

    navigation.navigate("CreateBooking", {
      userId,
      skillName: user.skillsOffered[0].skill,
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
        <TouchableOpacity style={styles.retryButton} onPress={fetchUserProfile}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Check if this is the current user's profile
  const isOwnProfile = currentUser && user && currentUser.id === user._id;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={["#00acc1"]}
        />
      }
    >
      <View style={styles.header}>
        <Image
          source={
            user.photoUrl
              ? { uri: user.photoUrl }
              : require("../assets/default-avatar.png")
          }
          style={styles.profileImage}
        />
        <Text style={styles.name}>{user.name}</Text>
        <View style={styles.ratingContainer}>
          <Star size={18} color="#FFD700" fill="#FFD700" />
          <Text style={styles.rating}>{user.rating.toFixed(1)}</Text>
          <Text style={styles.reviewCount}>({user.reviewCount} reviews)</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <Text style={styles.bioText}>{user.bio || "No bio available."}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Skills Offered</Text>
        <View style={styles.skillsContainer}>
          {user.skillsOffered && user.skillsOffered.length > 0 ? (
            user.skillsOffered.map((skillObj, index) => (
              <View key={index} style={styles.skillBadge}>
                <Text style={styles.skillText}>{skillObj.skill}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.noSkillsText}>No skills listed</Text>
          )}
        </View>
      </View>

      {/* Only show action buttons if NOT viewing own profile */}
      {!isOwnProfile && (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.messageButton}
            onPress={handleMessagePress}
          >
            <MessageCircle size={20} color="#fff" />
            <Text style={styles.buttonText}>Message</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.bookButton}
            onPress={handleBookingPress}
          >
            <Calendar size={20} color="#fff" />
            <Text style={styles.buttonText}>Book Session</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
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
  header: {
    backgroundColor: "#fff",
    padding: 20,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 15,
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 5,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
  },
  rating: {
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 5,
  },
  reviewCount: {
    fontSize: 14,
    color: "#666",
    marginLeft: 5,
  },
  section: {
    backgroundColor: "#fff",
    padding: 20,
    marginTop: 15,
    borderRadius: 10,
    marginHorizontal: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#333",
  },
  bioText: {
    fontSize: 16,
    lineHeight: 24,
    color: "#555",
  },
  skillsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  skillBadge: {
    backgroundColor: "#e0f7fa",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  skillText: {
    color: "#00acc1",
    fontWeight: "500",
  },
  noSkillsText: {
    color: "#999",
    fontStyle: "italic",
  },
  actionButtons: {
    flexDirection: "row",
    padding: 15,
    marginTop: 15,
    marginBottom: 30,
  },
  messageButton: {
    flex: 1,
    backgroundColor: "#00acc1",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 8,
  },
  bookButton: {
    flex: 1,
    backgroundColor: "#10b981",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 8,
    marginLeft: 8,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    marginLeft: 8,
  },
});
