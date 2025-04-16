"use client"

import { useState } from "react"
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from "react-native"
import { Calendar, Clock } from "lucide-react-native"

export default function CreateBookingScreen({ route, navigation }) {
  const { userId, skillName } = route.params
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedTime, setSelectedTime] = useState(null)
  const [loading, setLoading] = useState(false)

  // Mock available dates (in a real app, you'd fetch these from the API)
  const availableDates = [
    new Date(Date.now() + 86400000), // tomorrow
    new Date(Date.now() + 86400000 * 2), // day after tomorrow
    new Date(Date.now() + 86400000 * 3),
    new Date(Date.now() + 86400000 * 5),
  ]

  // Mock available times
  const availableTimes = ["09:00", "11:00", "14:00", "16:00", "18:00"]

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

    setLoading(true)

    try {
      // In a real app, you'd make an API call here
      // const response = await api.post("/bookings", {
      //   teacherId: userId,
      //   skill: skillName,
      //   dateTime: new Date(`${selectedDate.toDateString()} ${selectedTime}`),
      //   duration: 60, // default duration in minutes
      // })

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      Alert.alert(
        "Booking Requested",
        "Your booking request has been sent. You'll be notified when the teacher responds.",
        [{ text: "OK", onPress: () => navigation.navigate("Bookings") }],
      )
    } catch (error) {
      console.log("Error creating booking", error)
      Alert.alert("Error", "Failed to create booking. Please try again.")
    } finally {
      setLoading(false)
    }
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
              onPress={() => setSelectedDate(date)}
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

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          <Clock size={18} color="#333" style={styles.icon} /> Available Times
        </Text>
        <View style={styles.timesContainer}>
          {availableTimes.map((time, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.timeItem, selectedTime === time && styles.selectedItem]}
              onPress={() => setSelectedTime(time)}
            >
              <Text style={[styles.timeText, selectedTime === time && styles.selectedText]}>{time}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TouchableOpacity
        style={styles.bookButton}
        onPress={handleBooking}
        disabled={!selectedDate || !selectedTime || loading}
      >
        {loading ? (
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
  bookButton: {
    backgroundColor: "#10b981",
    paddingVertical: 15,
    borderRadius: 8,
    marginHorizontal: 15,
    marginTop: 30,
    marginBottom: 30,
    alignItems: "center",
  },
  bookButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
})
