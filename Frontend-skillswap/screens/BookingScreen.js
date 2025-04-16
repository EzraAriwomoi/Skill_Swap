"use client"

import { useState, useEffect, useContext } from "react"
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from "react-native"
import { Calendar, Clock, Check, X } from "lucide-react-native"
import { AuthContext } from "../context/AuthContext"
import api from "../services/api"

export default function BookingScreen({ navigation }) {
  const { user } = useContext(AuthContext)
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("upcoming")

  useEffect(() => {
    fetchBookings()
  }, [activeTab])

  const fetchBookings = async () => {
    try {
      setLoading(true)
      const endpoint = activeTab === "upcoming" ? "/bookings/upcoming" : "/bookings/past"
      const response = await api.get(endpoint)
      setBookings(response.data)
    } catch (error) {
      console.log("Error fetching bookings", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAcceptBooking = async (bookingId) => {
    try {
      await api.put(`/bookings/${bookingId}/accept`)
      fetchBookings()
    } catch (error) {
      Alert.alert("Error", "Failed to accept booking")
    }
  }

  const handleDeclineBooking = async (bookingId) => {
    try {
      await api.put(`/bookings/${bookingId}/decline`)
      fetchBookings()
    } catch (error) {
      Alert.alert("Error", "Failed to decline booking")
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    })
  }

  const formatTime = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const mockUpcomingBookings = [
    {
      id: "1",
      skill: "JavaScript Programming",
      dateTime: "2023-06-20T15:00:00Z",
      duration: 60,
      status: "pending",
      user: {
        id: "101",
        name: "John Doe",
        photoUrl: "https://via.placeholder.com/50",
      },
      isTeacher: false, // Current user is student
    },
    {
      id: "2",
      skill: "Guitar Lessons",
      dateTime: "2023-06-22T18:30:00Z",
      duration: 45,
      status: "accepted",
      user: {
        id: "102",
        name: "Sarah Smith",
        photoUrl: "https://via.placeholder.com/50",
      },
      isTeacher: true, // Current user is teacher
    },
    {
      id: "3",
      skill: "French Language",
      dateTime: "2023-06-25T10:00:00Z",
      duration: 60,
      status: "pending",
      user: {
        id: "103",
        name: "Michael Brown",
        photoUrl: "https://via.placeholder.com/50",
      },
      isTeacher: true, // Current user is teacher
    },
  ]

  const mockPastBookings = [
    {
      id: "4",
      skill: "JavaScript Programming",
      dateTime: "2023-06-10T15:00:00Z",
      duration: 60,
      status: "completed",
      user: {
        id: "101",
        name: "John Doe",
        photoUrl: "https://via.placeholder.com/50",
      },
      isTeacher: false, // Current user is student
    },
    {
      id: "5",
      skill: "Guitar Lessons",
      dateTime: "2023-06-08T18:30:00Z",
      duration: 45,
      status: "completed",
      user: {
        id: "102",
        name: "Sarah Smith",
        photoUrl: "https://via.placeholder.com/50",
      },
      isTeacher: true, // Current user is teacher
    },
  ]

  const renderBookingItem = ({ item }) => {
    const isPending = item.status === "pending"
    const isTeacher = item.isTeacher

    return (
      <View style={styles.bookingCard}>
        <View style={styles.bookingHeader}>
          <Text style={styles.skillName}>{item.skill}</Text>
          <View style={[styles.statusBadge, getStatusStyle(item.status)]}>
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>

        <View style={styles.userInfo}>
          <Text style={styles.userRole}>{isTeacher ? "Student" : "Teacher"}</Text>
          <Text style={styles.userName}>{item.user.name}</Text>
        </View>

        <View style={styles.bookingDetails}>
          <View style={styles.detailItem}>
            <Calendar size={16} color="#666" />
            <Text style={styles.detailText}>{formatDate(item.dateTime)}</Text>
          </View>
          <View style={styles.detailItem}>
            <Clock size={16} color="#666" />
            <Text style={styles.detailText}>
              {formatTime(item.dateTime)} ({item.duration} min)
            </Text>
          </View>
        </View>

        {isPending && isTeacher && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.acceptButton]}
              onPress={() => handleAcceptBooking(item.id)}
            >
              <Check size={16} color="#fff" />
              <Text style={styles.actionButtonText}>Accept</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.declineButton]}
              onPress={() => handleDeclineBooking(item.id)}
            >
              <X size={16} color="#fff" />
              <Text style={styles.actionButtonText}>Decline</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    )
  }

  const getStatusStyle = (status) => {
    switch (status) {
      case "pending":
        return styles.pendingStatus
      case "accepted":
        return styles.acceptedStatus
      case "completed":
        return styles.completedStatus
      case "declined":
        return styles.declinedStatus
      default:
        return {}
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "upcoming" && styles.activeTab]}
          onPress={() => setActiveTab("upcoming")}
        >
          <Text style={[styles.tabText, activeTab === "upcoming" && styles.activeTabText]}>Upcoming</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "past" && styles.activeTab]}
          onPress={() => setActiveTab("past")}
        >
          <Text style={[styles.tabText, activeTab === "past" && styles.activeTabText]}>Past</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      ) : (
        <FlatList
          data={activeTab === "upcoming" ? mockUpcomingBookings : mockPastBookings}
          keyExtractor={(item) => item.id}
          renderItem={renderBookingItem}
          contentContainerStyle={styles.bookingsList}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No bookings found</Text>
            </View>
          }
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
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: "#6366f1",
  },
  tabText: {
    fontSize: 16,
    color: "#666",
  },
  activeTabText: {
    color: "#6366f1",
    fontWeight: "bold",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  bookingsList: {
    padding: 15,
  },
  bookingCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  bookingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  skillName: {
    fontSize: 18,
    fontWeight: "bold",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pendingStatus: {
    backgroundColor: "#fef3c7",
  },
  acceptedStatus: {
    backgroundColor: "#dcfce7",
  },
  completedStatus: {
    backgroundColor: "#dbeafe",
  },
  declinedStatus: {
    backgroundColor: "#fee2e2",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
    textTransform: "capitalize",
  },
  userInfo: {
    marginBottom: 15,
  },
  userRole: {
    fontSize: 12,
    color: "#666",
    marginBottom: 2,
  },
  userName: {
    fontSize: 16,
    fontWeight: "500",
  },
  bookingDetails: {
    marginBottom: 15,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  detailText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#666",
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
    flex: 1,
  },
  acceptButton: {
    backgroundColor: "#10b981",
    marginRight: 8,
  },
  declineButton: {
    backgroundColor: "#ef4444",
    marginLeft: 8,
  },
  actionButtonText: {
    color: "#fff",
    fontWeight: "500",
    marginLeft: 5,
  },
  emptyContainer: {
    padding: 20,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    fontStyle: "italic",
  },
})
