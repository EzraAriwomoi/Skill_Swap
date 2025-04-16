"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native"
import { Star, MessageCircle, Calendar } from "lucide-react-native"
import api from "../services/api"

export default function UserProfile({ route, navigation }) {
  const { userId } = route.params
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUserProfile()
  }, [userId])

  const fetchUserProfile = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/users/${userId}`)
      setUser(response.data)
    } catch (error) {
      console.log("Error fetching user profile", error)
      // Use mock data if API fails
      setUser(getMockUser(userId))
    } finally {
      setLoading(false)
    }
  }

  const getMockUser = (id) => {
    // Mock data for development
    return {
      id,
      name: "David Lee",
      photoUrl: "https://via.placeholder.com/150",
      bio: "Certified yoga instructor with 5+ years of experience. I specialize in Hatha and Vinyasa yoga for beginners and intermediate practitioners.",
      rating: 4.9,
      reviewCount: 42,
      skillsOffered: [
        { skill: "Yoga Instruction", category: "Fitness" },
        { skill: "Meditation", category: "Fitness" },
        { skill: "Nutrition Coaching", category: "Health" },
      ],
    }
  }

  const handleMessagePress = () => {
    navigation.navigate("Chat", {
      chatId: `chat-${userId}`,
      userName: user.name,
      userId: userId,
    })
  }

  const handleBookingPress = () => {
    navigation.navigate("CreateBooking", { userId, skillName: user.skillsOffered[0].skill })
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    )
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Image source={{ uri: user.photoUrl }} style={styles.profileImage} />
        <Text style={styles.name}>{user.name}</Text>
        <View style={styles.ratingContainer}>
          <Star size={18} color="#FFD700" fill="#FFD700" />
          <Text style={styles.rating}>{user.rating.toFixed(1)}</Text>
          <Text style={styles.reviewCount}>({user.reviewCount} reviews)</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <Text style={styles.bioText}>{user.bio}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Skills Offered</Text>
        <View style={styles.skillsContainer}>
          {user.skillsOffered.map((skillObj, index) => (
            <View key={index} style={styles.skillBadge}>
              <Text style={styles.skillText}>{skillObj.skill}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.messageButton} onPress={handleMessagePress}>
          <MessageCircle size={20} color="#fff" />
          <Text style={styles.buttonText}>Message</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.bookButton} onPress={handleBookingPress}>
          <Calendar size={20} color="#fff" />
          <Text style={styles.buttonText}>Book Session</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
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
    backgroundColor: "#e0e7ff",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  skillText: {
    color: "#4f46e5",
    fontWeight: "500",
  },
  actionButtons: {
    flexDirection: "row",
    padding: 15,
    marginTop: 15,
    marginBottom: 30,
  },
  messageButton: {
    flex: 1,
    backgroundColor: "#6366f1",
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
})
