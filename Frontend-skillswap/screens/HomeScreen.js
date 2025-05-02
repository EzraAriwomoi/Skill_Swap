"use client"

import { useState, useEffect, useCallback, useContext } from "react"
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
} from "react-native"
import Icon from "react-native-vector-icons/Feather"
import SkillCard from "../components/SkillCard"
import api from "../services/api"
import { useFocusEffect } from "@react-navigation/native"
import { AuthContext } from "../context/AuthContext"

const { width, height } = Dimensions.get("window")

export default function HomeScreen({ navigation }) {
  const { user: currentUser } = useContext(AuthContext)
  const [searchQuery, setSearchQuery] = useState("")
  const [skills, setSkills] = useState([])
  const [filteredSkills, setFilteredSkills] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const [categories, setCategories] = useState([
    { id: 1, name: "All", active: true },
    { id: 2, name: "Tech", active: false },
    { id: 3, name: "Art", active: false },
    { id: 4, name: "Music", active: false },
    { id: 5, name: "Language", active: false },
    { id: 6, name: "Fitness", active: false },
  ])

  useFocusEffect(
    useCallback(() => {
      fetchSkills()
    }, [])
  )

  useEffect(() => {
    filterSkills()
  }, [searchQuery, categories, skills])

  useEffect(() => {
    if (currentUser) {
      fetchSkills()
    }
  }, [currentUser])

  const fetchSkills = async () => {
    try {
      setLoading(true)
      setError(null)
  
      // Ensure currentUser._id is passed correctly to the API
      const response = await api.get("/skills", {
        params: { excludeUserId: currentUser._id }
      })      
  
      if (!response.data || !Array.isArray(response.data)) {
        throw new Error("Invalid data format received from server")
      }
  
      // Group skills by user
      const userMap = new Map()
      response.data.forEach((skill) => {
        if (!skill.user || !skill.user.id) return
  
        if (!userMap.has(skill.user.id)) {
          userMap.set(skill.user.id, {
            ...skill,
            id: skill.id || `skill-${Math.random().toString(36).substr(2, 9)}`,
            allSkills: [{ name: skill.skill, category: skill.category }],
          })          
        } else {
          if (skill.skill) {
            userMap.get(skill.user.id).allSkills.push({ name: skill.skill, category: skill.category })
          }
        }
      })
  
      const uniqueUserSkills = Array.from(userMap.values())
      setSkills(uniqueUserSkills)
      setFilteredSkills(uniqueUserSkills)
    } catch (error) {
      console.log("Error fetching skills", error)
  
      if (error.response || error.message.includes("Network")) {
        setError("Something went wrong. Please try again.")
      } else {
        setError(null)
        setSkills([])
        setFilteredSkills([])
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }   

  const onRefresh = () => {
    setRefreshing(true)
    fetchSkills()
  }

  const filterSkills = () => {
    let filtered = [...skills]

    if (searchQuery) {
      filtered = filtered.filter(
        (item) =>
          (item.skill && item.skill.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (item.allSkills &&
            item.allSkills.some((skill) => skill.name && skill.name.toLowerCase().includes(searchQuery.toLowerCase()))) ||
          (item.user && item.user.name && item.user.name.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    }

    const activeCategory = categories.find((cat) => cat.active)
    if (activeCategory && activeCategory.name !== "All") {
      filtered = filtered.filter(
        (item) =>
          item.allSkills &&
          item.allSkills.some((skill) => skill.category === activeCategory.name)
      )      
    }

    setFilteredSkills(filtered)
  }

  const handleCategoryPress = (id) => {
    setCategories(
      categories.map((cat) => ({
        ...cat,
        active: cat.id === id,
      }))
    )
  }

  const handleSkillPress = (skill) => {
    if (skill && skill.user && skill.user.id) {
      navigation.navigate("UserProfile", { userId: skill.user.id })
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Discover Skills</Text>
          <Text style={styles.subtitle}>Find people to learn from</Text>
        </View>

        <View style={styles.searchContainer}>
        <Icon name="search" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search skills or tutors"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Icon name="x" size={20} color="#999" style={styles.clearIcon} />
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
                style={[styles.categoryButton, item.active && styles.activeCategoryButton]}
                onPress={() => handleCategoryPress(item.id)}
              >
                <Text style={[styles.categoryText, item.active && styles.activeCategoryText]}>{item.name}</Text>
              </TouchableOpacity>
            )}
          />
        </View>

        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6366f1" />
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchSkills}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={filteredSkills}
            keyExtractor={(item) => (item.id ? item.id.toString() : Math.random().toString())}
            renderItem={({ item }) => (
              <SkillCard
                user={item.user}
                skill={item.skill}
                allSkills={item.allSkills}
                onPress={() => handleSkillPress(item)}
              />
            )}
            contentContainerStyle={[styles.listContent, filteredSkills.length === 0 && styles.emptyListContent]}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#6366f1"]} />}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No skills found</Text>
                <Text style={styles.emptySubText}>Pull down to refresh</Text>
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    paddingHorizontal: width * 0.05,
    paddingTop: Platform.OS === 'ios' ? height * 0.04 : height * 0.02,
    paddingBottom: height * 0.01,
  },
  title: {
    fontSize: width * 0.06,
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
    backgroundColor: "#6366f1",
    borderColor: "#6366f1",
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
    padding: width * 0.05,
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
    backgroundColor: "#6366f1",
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
})