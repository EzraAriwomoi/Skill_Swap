"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from "react-native"
import { Calendar, Clock } from "lucide-react-native"
import api from "../services/api"

export default function CreateBookingScreen({ route, navigation }) {
  const { userId, skillName } = route.params
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedTime, setSelectedTime] = useState(null)
  const [availableDates, setAvailableDates] = useState([])
  const [availableTimes, setAvailableTimes] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchAvailability()
  }, [userId])

  useEffect(() => {
    if (selectedDate) {
      fetchAvailableTimes()
    }
  }, [selectedDate])

  const fetchAvailability = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.get(`/users/${userId}/availability`)
      setAvailableDates(response.data.availableDates.map((date) => new Date(date)))
    } catch (error) {
      console.log("Error fetching availability", error)
      setError("Failed to load availability. Please try again.")

      // Fallback to some default dates for development
      const defaultDates = []
      for (let i = 1; i <= 7; i++) {
        defaultDates.push(new Date(Date.now() + 86400000 * i))
      }
      setAvailableDates(defaultDates)
    } finally {
      setLoading(false)
    }
  }

  const fetchAvailableTimes = async () => {
    if (!selectedDate) return

    try {
      setAvailableTimes([]) // Clear previous times
      const dateString = selectedDate.toISOString().split("T")[0]
      const response = await api.get(`/users/${userId}/availability/${dateString}`)
      setAvailableTimes(response.data.availableTimes)
    } catch (error) {
      console.log("Error fetching available times", error)

      // Fallback to some default times for development
      setAvailableTimes(["09:00", "11:00", "14:00", "16:00", "18:00"])
    }
  }

  const formatDate = (date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    })
  }

  const handleBooking = async () => {
    if (!selectedDate || !selectedTime) {
      Alert.alert("Error", "Please select both date and time")
      return
    }

    setSubmitting(true)

    try {
      const dateTime = new Date(`${selectedDate.toISOString().split("T")[0]}T${selectedTime}:00`)

      const response = await api.post("/bookings", {
        teacherId: userId,
        skill: skillName,
        dateTime: dateTime.toISOString(),
        duration: 60, // default duration in minutes
      })

      Alert.alert(
        "Booking Requested",
        "Your booking request has been sent. You'll be notified when the teacher responds.",
        [{ text: "OK", onPress: () => navigation.navigate("Bookings") }],
      )
    } catch (error) {
      console.log("Error creating booking", error)
      Alert.alert("Error", "Failed to create booking. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    )
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchAvailability}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Book a {skillName} Session</Text>
        <Text style={styles.subtitle}>Select a date and time</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          <Calendar size={18} color="#333" style={styles.icon} /> Available Dates
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.datesContainer}>
          {availableDates.map((date, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.dateItem,
                selectedDate && date.toDateString() === selectedDate.toDateString() && styles.selectedItem,
              ]}
              onPress={() => {
                setSelectedDate(date)
                setSelectedTime(null) // Reset selected time when date changes
              }}
            >
              <Text
                style={[
                  styles.dateText,
                  selectedDate && date.toDateString() === selectedDate.toDateString() && styles.selectedText,
                ]}
              >
                {formatDate(date)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {selectedDate && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Clock size={18} color="#333" style={styles.icon} /> Available Times
          </Text>
          <View style={styles.timesContainer}>
            {availableTimes.length > 0 ? (
              availableTimes.map((time, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.timeItem, selectedTime === time && styles.selectedItem]}
                  onPress={() => setSelectedTime(time)}
                >
                  <Text style={[styles.timeText, selectedTime === time && styles.selectedText]}>{time}</Text>
                </TouchableOpacity>
              ))
            ) : (
              <Text style={styles.noTimesText}>No available times for this date</Text>
            )}
          </View>
        </View>
      )}

      <TouchableOpacity
        style={[styles.bookButton, (!selectedDate || !selectedTime || submitting) && styles.disabledButton]}
        onPress={handleBooking}
        disabled={!selectedDate || !selectedTime || submitting}
      >
        {submitting ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={styles.bookButtonText}>Request Booking</Text>
        )}
      </TouchableOpacity>
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
    backgroundColor: "#6366f1",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  header: {
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginTop: 5,
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
    flexDirection: "row",
    alignItems: "center",
  },
  icon: {
    marginRight: 5,
  },
  datesContainer: {
    flexDirection: "row",
    marginBottom: 10,
  },
  dateItem: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    backgroundColor: "#f0f2f5",
    marginRight: 10,
  },
  selectedItem: {
    backgroundColor: "#6366f1",
  },
  dateText: {
    fontSize: 16,
    color: "#333",
  },
  selectedText: {
    color: "#fff",
    fontWeight: "500",
  },
  timesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  timeItem: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    backgroundColor: "#f0f2f5",
    marginRight: 10,
    marginBottom: 10,
    width: "30%",
    alignItems: "center",
  },
  timeText: {
    fontSize: 16,
    color: "#333",
  },
  noTimesText: {
    fontSize: 16,
    color: "#666",
    fontStyle: "italic",
    textAlign: "center",
    padding: 20,
  },
  bookButton: {
    backgroundColor: "#10b981",
    paddingVertical: 15,
    borderRadius: 8,
    marginHorizontal: 15,
    marginTop: 30,
    marginBottom: 30,
    alignItems: "center",
  },
  disabledButton: {
    backgroundColor: "#9ca3af",
  },
  bookButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
})
