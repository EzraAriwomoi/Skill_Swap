import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native"
import Feather from "react-native-vector-icons/Feather"

export default function SkillCard({ user, skill, allSkills = [], onPress }) {
  if (!user) {
    return null
  }

  const skillsText = allSkills && allSkills.length > 0 ? allSkills.join(", ") : skill || "Unnamed Skill"

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <Image
        source={{ uri: user.photoUrl || "https://via.placeholder.com/60" }}
        style={styles.avatar}
        defaultSource={require("../assets/default-avatar.png")}
      />

      <View style={styles.content}>
        <Text style={styles.name}>{user.name || "Unknown User"}</Text>
        <Text style={styles.skill} numberOfLines={2}>
          {skillsText}
        </Text>

        <View style={styles.ratingContainer}>
          <Feather name="star" size={16} color="#FFD700" />
          <Text style={styles.rating}>{user.rating ? user.rating.toFixed(1) : "New"}</Text>
          <Text style={styles.reviewCount}>({user.reviewCount || 0} reviews)</Text>
        </View>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
  },
  content: {
    flex: 1,
    justifyContent: "center",
  },
  name: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  skill: {
    fontSize: 14,
    color: "#6366f1",
    marginBottom: 8,
    lineHeight: 20,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  rating: {
    fontSize: 14,
    fontWeight: "bold",
    marginLeft: 4,
  },
  reviewCount: {
    fontSize: 12,
    color: "#666",
    marginLeft: 4,
  },
})
