"use client";

import { useState, useEffect, useCallback, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  SafeAreaView,
  Platform,
  StatusBar,
  Image,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";
import TutorCard from "../components/TutorCard";
import api from "../services/api";
import { useFocusEffect } from "@react-navigation/native";
import { AuthContext } from "../context/AuthContext";
import { LinearGradient } from "expo-linear-gradient";

const { width, height } = Dimensions.get("window");

export default function HomeScreen({ navigation }) {
  const { user: currentUser } = useContext(AuthContext);
  const [searchQuery, setSearchQuery] = useState("");
  const [skills, setSkills] = useState([]);
  const [filteredSkills, setFilteredSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([
    { id: 1, name: "All", active: true },
    { id: 2, name: "Tech", active: false },
    { id: 3, name: "Art", active: false },
    { id: 4, name: "Music", active: false },
    { id: 5, name: "Fitness", active: false },
    { id: 6, name: "Language", active: false },
    { id: 7, name: "Business", active: false },
    { id: 8, name: "Writing", active: false },
    { id: 9, name: "Tutoring & Academics", active: false },
    { id: 10, name: "Design", active: false },
    { id: 11, name: "Photography & Videography", active: false },
    { id: 12, name: "Trades & DIY", active: false },
    { id: 13, name: "Cooking & Baking", active: false },
    { id: 14, name: "Communication", active: false },
  ]);

  useFocusEffect(
    useCallback(() => {
      fetchSkills();
    }, [])
  );

  useEffect(() => {
    filterSkills();
  }, [searchQuery, categories, skills]);

  useEffect(() => {
    if (currentUser) {
      fetchSkills();
    }
  }, [currentUser]);

  const fetchSkills = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get("/skills", {
        params: { excludeUserId: currentUser._id },
      });

      if (!response.data || !Array.isArray(response.data)) {
        throw new Error("Invalid data format received from server");
      }

      // Group skills by user
      const userMap = new Map();
      response.data.forEach((skill) => {
        if (!skill.user || !skill.user.id) return;

        const userId = skill.user.id;
        if (!userMap.has(userId)) {
          userMap.set(userId, {
            user: {
              id: userId,
              name: skill.user.name,
              photoUrl: skill.user.photoUrl,
              bio: skill.user.bio,
              location: skill.user.location,
              rating: skill.user.rating,
              reviewCount: skill.user.reviewCount,
            },
            id: userId, // Use userId as the ID for the tutor object
            allSkills: skill.skill
              ? [{ name: skill.skill, category: skill.category }]
              : [], // Add the first skill if it exists
          });
        } else {
          if (skill.skill) {
            userMap
              .get(userId)
              .allSkills.push({ name: skill.skill, category: skill.category });
          }
        }
      });

      const uniqueUserSkills = Array.from(userMap.values());
      setSkills(uniqueUserSkills);
      setFilteredSkills(uniqueUserSkills);
    } catch (error) {
      console.log("Error fetching skills", error);
      if (error.response || error.message.includes("Network")) {
        setError("Something went wrong. Please try again.");
      } else {
        setError(null);
        setSkills([]);
        setFilteredSkills([]);
      }
    } finally {
      // Closing brace for the catch block was missing
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchSkills();
  };

  const filterSkills = () => {
    let filtered = [...skills];

    if (searchQuery) {
      filtered = filtered.filter(
        (tutor) =>
          (tutor.user?.name &&
            tutor.user.name
              .toLowerCase()
              .includes(searchQuery.toLowerCase())) ||
          (tutor.allSkills &&
            tutor.allSkills.some(
              (skill) =>
                skill.name &&
                skill.name.toLowerCase().includes(searchQuery.toLowerCase())
            ))
      );
    }

    const activeCategory = categories.find((cat) => cat.active);
    if (activeCategory && activeCategory.name !== "All") {
      filtered = filtered.filter(
        (tutor) =>
          tutor.allSkills &&
          tutor.allSkills.some(
            (skill) => skill.category === activeCategory.name
          )
      );
    }

    setFilteredSkills(filtered);
  };

  const handleCategoryPress = (id) => {
    setCategories(
      categories.map((cat) => ({
        ...cat,
        active: cat.id === id,
      }))
    );
  };

  const handleTutorPress = (tutor) => {
    if (tutor && tutor.user && tutor.user.id) {
      navigation.navigate("UserProfile", { userId: tutor.user.id });
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={["#00acc1", "rgba(0, 172, 193, 0)"]}
        style={styles.gradientBackground}
      />
      <View style={styles.androidSafeArea}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Discover Skills</Text>
            <Text style={styles.subtitle}>
              Find skilled people to learn from
            </Text>
          </View>

          <View style={styles.searchContainer}>
            <Icon
              name="search"
              size={20}
              color="#999"
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Search skills or tutors"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Icon
                  name="x"
                  size={20}
                  color="#999"
                  style={styles.clearIcon}
                />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.categoriesContainer}>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={categories}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.categoryButton,
                    item.active && styles.activeCategoryButton,
                  ]}
                  onPress={() => handleCategoryPress(item.id)}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      item.active && styles.activeCategoryText,
                    ]}
                  >
                    {item.name}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>

          {loading && !refreshing ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#00acc1" />
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={fetchSkills}
              >
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={filteredSkills}
              keyExtractor={(item) =>
                item.user?._id
                  ? item.user._id.toString()
                  : Math.random().toString()
              }
              renderItem={({ item }) => (
                <TutorCard tutor={item} onPress={handleTutorPress} />
              )}
              contentContainerStyle={[
                styles.listContent,
                filteredSkills.length === 0 && styles.emptyListContent,
              ]}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={["#00acc1"]}
                />
              }
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No tutors found</Text>
                  <Text style={styles.emptySubText}>Pull down to refresh</Text>
                </View>
              }
            />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "transparent",
  },
  androidSafeArea: {
    flex: 1,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  gradientBackground: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: 200,
  },
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: width * 0.05,
    paddingTop: Platform.OS === "ios" ? height * 0.04 : height * 0.02,
    paddingBottom: height * 0.01,
  },
  title: {
    fontSize: width * 0.07,
    fontWeight: "bold",
  },
  subtitle: {
    fontSize: width * 0.04,
    color: "#666",
    marginTop: height * 0.005,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: width * 0.025,
    marginHorizontal: width * 0.05,
    marginVertical: height * 0.018,
    paddingHorizontal: width * 0.038,
    height: height * 0.06,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchIcon: {
    marginRight: width * 0.025,
  },
  searchInput: {
    flex: 1,
    height: "100%",
    fontSize: width * 0.04,
  },
  clearIcon: {
    marginLeft: 10,
  },
  categoriesContainer: {
    paddingHorizontal: width * 0.038,
    marginBottom: height * 0.018,
  },
  categoryButton: {
    paddingHorizontal: width * 0.04,
    paddingVertical: height * 0.01,
    borderRadius: width * 0.05,
    backgroundColor: "#fff",
    marginHorizontal: width * 0.013,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  activeCategoryButton: {
    backgroundColor: "#00acc1",
    // backgroundColor: "#6366f1",
    borderColor: "#00acc1",
  },
  categoryText: {
    fontSize: width * 0.035,
    color: "#666",
  },
  activeCategoryText: {
    color: "#fff",
    fontWeight: "500",
  },
  listContent: {
    paddingHorizontal: width * 0.05,
    paddingBottom: height * 0.02,
    flexGrow: 1,
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: "center",
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
    padding: width * 0.05,
  },
  errorText: {
    fontSize: width * 0.04,
    color: "#ef4444",
    textAlign: "center",
    marginBottom: height * 0.025,
  },
  retryButton: {
    backgroundColor: "#00acc1",
    paddingVertical: height * 0.013,
    paddingHorizontal: width * 0.05,
    borderRadius: width * 0.02,
  },
  retryButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: width * 0.038,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: width * 0.05,
  },
  emptyText: {
    fontSize: width * 0.045,
    fontWeight: "bold",
    color: "#666",
    textAlign: "center",
  },
  emptySubText: {
    fontSize: width * 0.035,
    color: "#999",
    marginTop: height * 0.01,
    textAlign: "center",
  },
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
