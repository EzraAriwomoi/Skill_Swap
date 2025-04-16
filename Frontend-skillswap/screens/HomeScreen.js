"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, ActivityIndicator } from "react-native"
import { Search } from "lucide-react-native"
import SkillCard from "../components/SkillCard"
import api from "../services/api"

export default function HomeScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState("")
  const [skills, setSkills] = useState([])
  const [filteredSkills, setFilteredSkills] = useState([])
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState([
    { id: 1, name: "All", active: true },
    { id: 2, name: "Tech", active: false },
    { id: 3, name: "Art", active: false },
    { id: 4, name: "Music", active: false },
    { id: 5, name: "Language", active: false },
    { id: 6, name: "Fitness", active: false },
  ])

  useEffect(() => {
    fetchSkills()
  }, [])

  useEffect(() => {
    filterSkills()
  }, [searchQuery, categories, skills])

  const fetchSkills = async () => {
    try {
      setLoading(true)
      const response = await api.get("/skills")
      setSkills(response.data)
      setFilteredSkills(response.data)
    } catch (error) {
      console.log("Error fetching skills", error)
    } finally {
      setLoading(false)
    }
  }

  const filterSkills = () => {
    let filtered = [...skills]

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (item) =>
          item.skill.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.user.name.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    // Filter by category
    const activeCategory = categories.find((cat) => cat.active)
    if (activeCategory && activeCategory.name !== "All") {
      filtered = filtered.filter((item) => item.category === activeCategory.name)
    }

    setFilteredSkills(filtered)
  }

  const handleCategoryPress = (id) => {
    setCategories(
      categories.map((cat) => ({
        ...cat,
        active: cat.id === id,
      })),
    )
  }

  const handleSkillPress = (skill) => {
    navigation.navigate("UserProfile", { userId: skill.user.id })
  }

  // Mock data for development
  const mockSkills = [
    {
      id: "1",
      skill: "JavaScript Programming",
      category: "Tech",
      user: {
        id: "101",
        name: "John Doe",
        photoUrl: "https://via.placeholder.com/60",
        rating: 4.8,
        reviewCount: 24,
      },
    },
    {
      id: "2",
      skill: "Guitar Lessons",
      category: "Music",
      user: {
        id: "102",
        name: "Sarah Smith",
        photoUrl: "https://via.placeholder.com/60",
        rating: 4.9,
        reviewCount: 36,
      },
    },
    {
      id: "3",
      skill: "French Language",
      category: "Language",
      user: {
        id: "103",
        name: "Michael Brown",
        photoUrl: "https://via.placeholder.com/60",
        rating: 4.7,
        reviewCount: 18,
      },
    },
    {
      id: "4",
      skill: "Digital Painting",
      category: "Art",
      user: {
        id: "104",
        name: "Emma Wilson",
        photoUrl: "https://via.placeholder.com/60",
        rating: 4.6,
        reviewCount: 15,
      },
    },
    {
      id: "5",
      skill: "Yoga Instruction",
      category: "Fitness",
      user: {
        id: "105",
        name: "David Lee",
        photoUrl: "https://via.placeholder.com/60",
        rating: 4.9,
        reviewCount: 42,
      },
    },
  ]

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Discover Skills</Text>
        <Text style={styles.subtitle}>Find people to learn from</Text>
      </View>

      <View style={styles.searchContainer}>
        <Search size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search skills or tutors"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
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

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      ) : (
        <FlatList
          data={mockSkills} // Use mockSkills for development, replace with filteredSkills when API is ready
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <SkillCard user={item.user} skill={item.skill} onPress={() => handleSkillPress(item)} />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
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
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginTop: 5,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    marginHorizontal: 20,
    marginVertical: 15,
    paddingHorizontal: 15,
    height: 50,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: "100%",
    fontSize: 16,
  },
  categoriesContainer: {
    paddingHorizontal: 15,
    marginBottom: 15,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#fff",
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  activeCategoryButton: {
    backgroundColor: "#6366f1",
    borderColor: "#6366f1",
  },
  categoryText: {
    fontSize: 14,
    color: "#666",
  },
  activeCategoryText: {
    color: "#fff",
    fontWeight: "500",
  },
  listContent: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
})
