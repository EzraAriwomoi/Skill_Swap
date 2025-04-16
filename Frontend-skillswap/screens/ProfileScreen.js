"use client"

import { useState, useContext, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native"
import { AuthContext } from "../context/AuthContext"
import { Plus, Edit2, LogOut } from "lucide-react-native"

export default function ProfileScreen() {
  const { user, logout, updateProfile } = useContext(AuthContext)
  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState("")
  const [bio, setBio] = useState("")
  const [skillsOffered, setSkillsOffered] = useState([])
  const [skillsWanted, setSkillsWanted] = useState([])
  const [newSkillOffered, setNewSkillOffered] = useState("")
  const [newSkillWanted, setNewSkillWanted] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user) {
      setName(user.name || "")
      setBio(user.bio || "")
      setSkillsOffered(user.skillsOffered || [])
      setSkillsWanted(user.skillsWanted || [])
    }
  }, [user])

  const handleSaveProfile = async () => {
    setLoading(true)
    const result = await updateProfile({
      name,
      bio,
      skillsOffered,
      skillsWanted,
    })
    setLoading(false)

    if (result.success) {
      setIsEditing(false)
    } else {
      Alert.alert("Error", result.message)
    }
  }

  const addSkillOffered = () => {
    if (newSkillOffered.trim() !== "") {
      setSkillsOffered([...skillsOffered, { skill: newSkillOffered, category: "Other" }])
      setNewSkillOffered("")
    }
  }

  const addSkillWanted = () => {
    if (newSkillWanted.trim() !== "") {
      setSkillsWanted([...skillsWanted, newSkillWanted])
      setNewSkillWanted("")
    }
  }

  const removeSkillOffered = (index) => {
    const updatedSkills = [...skillsOffered]
    updatedSkills.splice(index, 1)
    setSkillsOffered(updatedSkills)
  }

  const removeSkillWanted = (index) => {
    const updatedSkills = [...skillsWanted]
    updatedSkills.splice(index, 1)
    setSkillsWanted(updatedSkills)
  }

  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    )
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Image source={{ uri: user.photoUrl || "https://via.placeholder.com/150" }} style={styles.profileImage} />
        {isEditing ? (
          <TextInput style={styles.nameInput} value={name} onChangeText={setName} placeholder="Your Name" />
        ) : (
          <Text style={styles.name}>{user.name}</Text>
        )}
        <View style={styles.actionButtons}>
          {isEditing ? (
            <TouchableOpacity style={styles.editButton} onPress={handleSaveProfile} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.editButtonText}>Save</Text>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.editButton} onPress={() => setIsEditing(true)}>
              <Edit2 size={16} color="#fff" />
              <Text style={styles.editButtonText}>Edit Profile</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.logoutButton} onPress={logout}>
            <LogOut size={16} color="#fff" />
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About Me</Text>
        {isEditing ? (
          <TextInput
            style={styles.bioInput}
            value={bio}
            onChangeText={setBio}
            placeholder="Tell us about yourself..."
            multiline
          />
        ) : (
          <Text style={styles.bioText}>{user.bio || "No bio yet."}</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Skills I Can Teach</Text>
        {isEditing && (
          <View style={styles.addSkillContainer}>
            <TextInput
              style={styles.skillInput}
              value={newSkillOffered}
              onChangeText={setNewSkillOffered}
              placeholder="Add a skill..."
            />
            <TouchableOpacity style={styles.addButton} onPress={addSkillOffered}>
              <Plus size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
        <View style={styles.skillsContainer}>
          {skillsOffered.length > 0 ? (
            skillsOffered.map((skillObj, index) => (
              <View key={index} style={styles.skillBadge}>
                <Text style={styles.skillText}>{skillObj.skill}</Text>
                {isEditing && (
                  <TouchableOpacity onPress={() => removeSkillOffered(index)}>
                    <Text style={styles.removeSkill}>×</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))
          ) : (
            <Text style={styles.noSkillsText}>No skills added yet.</Text>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Skills I Want to Learn</Text>
        {isEditing && (
          <View style={styles.addSkillContainer}>
            <TextInput
              style={styles.skillInput}
              value={newSkillWanted}
              onChangeText={setNewSkillWanted}
              placeholder="Add a skill..."
            />
            <TouchableOpacity style={styles.addButton} onPress={addSkillWanted}>
              <Plus size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
        <View style={styles.skillsContainer}>
          {skillsWanted.length > 0 ? (
            skillsWanted.map((skill, index) => (
              <View key={index} style={styles.skillBadge}>
                <Text style={styles.skillText}>{skill}</Text>
                {isEditing && (
                  <TouchableOpacity onPress={() => removeSkillWanted(index)}>
                    <Text style={styles.removeSkill}>×</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))
          ) : (
            <Text style={styles.noSkillsText}>No skills added yet.</Text>
          )}
        </View>
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
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 15,
  },
  name: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
  },
  nameInput: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#6366f1",
    paddingBottom: 5,
    width: "80%",
  },
  actionButtons: {
    flexDirection: "row",
    marginTop: 10,
  },
  editButton: {
    backgroundColor: "#6366f1",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    marginRight: 10,
  },
  editButtonText: {
    color: "#fff",
    marginLeft: 5,
  },
  logoutButton: {
    backgroundColor: "#ef4444",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  logoutButtonText: {
    color: "#fff",
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
  bioInput: {
    fontSize: 16,
    lineHeight: 24,
    color: "#555",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
    minHeight: 100,
    textAlignVertical: "top",
  },
  addSkillContainer: {
    flexDirection: "row",
    marginBottom: 15,
  },
  skillInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 10,
    marginRight: 10,
  },
  addButton: {
    backgroundColor: "#6366f1",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
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
    flexDirection: "row",
    alignItems: "center",
  },
  skillText: {
    color: "#4f46e5",
    fontWeight: "500",
  },
  removeSkill: {
    color: "#4f46e5",
    fontWeight: "bold",
    fontSize: 18,
    marginLeft: 5,
  },
  noSkillsText: {
    color: "#999",
    fontStyle: "italic",
  },
})
