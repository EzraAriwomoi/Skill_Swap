import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from "react-native";
import Feather from "react-native-vector-icons/Feather";

export default function TutorCard({ onPress, tutor }) {
  if (!tutor) {
    return null;
  }

  return (
    <TouchableOpacity style={styles.tutorCard} onPress={() => onPress(tutor)}>
      <View style={styles.tutorInfo}>
        <Image
          source={
            tutor.user?.photoUrl
              ? { uri: tutor.user.photoUrl }
              : require("../assets/default-avatar.png")
          }
          style={styles.tutorImage}
        />
        <View>
          <Text style={styles.tutorName}>
            {tutor.user?.name || "Unknown User"}
          </Text>
          <View style={styles.ratingContainer}>
            <Feather name="star" size={16} color="#ffc107" />
            <Text style={styles.rating}>
              {tutor.user?.rating ? tutor.user?.rating.toFixed(1) : "New"}
            </Text>
            <Text style={styles.reviewCount}>
              ({tutor.user?.reviewCount || 0} reviews)
            </Text>
          </View>
          <Text style={styles.tutorLocation}>
            {tutor.user?.location?.trim() || ""} {tutor.user?.flagEmoji || ""}
          </Text>
        </View>
      </View>
      <Text style={styles.tutorBio} numberOfLines={2} ellipsizeMode="tail">
        {tutor.user?.bio?.trim() || "No bio available"}
      </Text>
      {tutor.allSkills && tutor.allSkills.length > 0 && (
        <View style={styles.teachingSkillsContainer}>
          <Text style={styles.teachingText}>Teaching:</Text>
          <View style={styles.skillsRow}>
            {tutor.allSkills.slice(0, 3).map((skill, index) => (
              <View key={index} style={styles.skillBadge}>
                <Text style={styles.skillText}>{skill.name}</Text>
              </View>
            ))}
            {tutor.allSkills.length > 3 && (
              <View style={styles.moreSkillsBadge}>
                <Text style={styles.moreSkillsText}>
                  +{tutor.allSkills.length - 3}
                </Text>
              </View>
            )}
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
}

const { width, height } = Dimensions.get("window");

const styles = StyleSheet.create({
  tutorCard: {
    backgroundColor: "#fff",
    borderRadius: width * 0.025,
    padding: width * 0.04,
    marginBottom: height * 0.018,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tutorInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: height * 0.015,
  },
  tutorImage: {
    width: width * 0.15,
    height: width * 0.15,
    borderRadius: width * 0.075,
    marginRight: width * 0.03,
  },
  tutorName: {
    fontSize: width * 0.045,
    fontWeight: "bold",
    color: "#333",
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: height * 0.005,
  },
  rating: {
    marginLeft: width * 0.01,
    fontSize: width * 0.035,
    color: "#666",
  },
  reviewCount: {
    fontSize: 12,
    color: "#666",
    marginLeft: 4,
  },
  tutorLocation: {
    fontSize: width * 0.035,
    color: "#777",
  },
  tutorBio: {
    fontSize: width * 0.04,
    color: "#555",
    marginBottom: height * 0.015,
    lineHeight: height * 0.022,
  },
  teachingSkillsContainer: {
    marginTop: height * 0.01,
  },
  teachingText: {
    fontSize: width * 0.04,
    fontWeight: "bold",
    color: "#333",
    marginBottom: height * 0.008,
  },
  skillsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  skillBadge: {
    backgroundColor: "#e0f7fa",
    paddingHorizontal: width * 0.025,
    paddingVertical: height * 0.007,
    borderRadius: width * 0.03,
    marginRight: width * 0.015,
  },
  skillText: {
    fontSize: width * 0.032,
    color: "#00acc1",
  },
  moreSkillsBadge: {
    backgroundColor: "#dcedc8",
    paddingHorizontal: width * 0.025,
    paddingVertical: height * 0.007,
    borderRadius: width * 0.03,
  },
  moreSkillsText: {
    fontSize: width * 0.032,
    color: "#558b2f",
  },
});
