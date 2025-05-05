"use client";

import { useState, useContext, useEffect, useCallback } from "react";
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
  Dimensions,
  SafeAreaView,
  Platform,
  StatusBar,
  RefreshControl,
} from "react-native";
import { AuthContext } from "../context/AuthContext";
import { MoreVertical, X, Camera } from "lucide-react-native";
import { Menu, MenuItem } from "../components/Menu";
import { categorizeSkill } from "../utils/skillCategories";
import * as ImagePicker from "expo-image-picker";
import api from "../services/api";

const { width, height } = Dimensions.get("window");

export default function ProfileScreen({ navigation }) {
  const { user, logout, updateProfile } = useContext(AuthContext);
  const [isEditing, setIsEditing] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [skillsOffered, setSkillsOffered] = useState([]);
  const [skillsWanted, setSkillsWanted] = useState([]);
  const [newSkillOffered, setNewSkillOffered] = useState("");
  const [newSkillWanted, setNewSkillWanted] = useState("");
  const [loading, setLoading] = useState(false);
  const [originalData, setOriginalData] = useState({});
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      const userData = {
        name: user.name || "",
        bio: user.bio || "",
        skillsOffered: user.skillsOffered || [],
        skillsWanted: user.skillsWanted || [],
      };

      setName(userData.name);
      setBio(userData.bio);
      setSkillsOffered(userData.skillsOffered);
      setSkillsWanted(userData.skillsWanted);
      setOriginalData(userData);
    }
  }, [user]);

  const fetchUserProfile = useCallback(async () => {
    setRefreshing(true);
    setLoading(true);
    try {
      const response = await api.get(`/users/${user?._id}`);
      if (response.data) {
        const userData = {
          name: response.data.name || "",
          bio: response.data.bio || "",
          skillsOffered: response.data.skillsOffered || [],
          skillsWanted: response.data.skillsWanted || [],
          photoUrl: response.data.photoUrl || null,
        };
        setName(userData.name);
        setBio(userData.bio);
        setSkillsOffered(userData.skillsOffered);
        setSkillsWanted(userData.skillsWanted);
        setOriginalData(userData);
      } else {
        Alert.alert("Error", "Failed to fetch profile data.");
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      Alert.alert("Error", "Something went wrong while fetching profile.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [api, user?._id]); // Update dependency array

  const onRefresh = useCallback(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  const handleSaveProfile = async () => {
    setLoading(true);

    // Auto-categorize skills
    const categorizedSkillsOffered = skillsOffered.map((skillObj) => {
      if (!skillObj.category || skillObj.category === "Other") {
        return {
          ...skillObj,
          category: categorizeSkill(skillObj.skill),
        };
      }
      return skillObj;
    });

    const result = await updateProfile({
      name,
      bio,
      skillsOffered: categorizedSkillsOffered,
      skillsWanted,
    });
    setLoading(false);

    if (result.success) {
      setIsEditing(false);
    } else {
      Alert.alert("Error", result.message);
    }
  };

  const handleImageUpload = async () => {
    const photoUrl = await uploadProfileImage();
    if (photoUrl) {
      setUser((prevUser) => ({
        ...prevUser,
        photoUrl,
      }));
    }
  };

  const uploadProfileImage = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      alert("Permission to access camera roll is required!");
      return;
    }

    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      base64: false,
    });

    if (pickerResult.cancelled) return;

    const localUri = pickerResult.assets[0].uri;
    const filename = localUri.split("/").pop();
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : `image`;

    const formData = new FormData();
    formData.append("image", {
      uri: localUri,
      name: filename,
      type,
    });

    setLoading(true); // Start loading before upload

    try {
      const res = await api.post("/users/upload-photo", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      console.log("Uploaded image URL:", res.data.photoUrl);
      const newPhotoUrl = res.data.photoUrl; // Update the user profile with the new photo URL

      const updateResult = await updateProfile({ photoUrl: newPhotoUrl });
      setLoading(false); // End loading after update

      // if (updateResult.success) {
      //   // Optionally, update the local user context immediately
      //   // This will trigger a re-render with the new image-  
      //   // setUser((prevUser) => ({ ...prevUser, photoUrl: newPhotoUrl }));
      //   Alert.alert("Success", "Profile picture updated!");
      // } else {
      //   Alert.alert(
      //     "Error",
      //     updateResult.message || "Failed to update profile picture."
      //   );
      // }

      return newPhotoUrl;
    } catch (error) {
      setLoading(false); // Ensure loading is off on error
      console.error("Upload error:", error);
      Alert.alert(
        "Failed to upload image",
        error.message || "Something went wrong during upload."
      );
      return null;
    }
  };

  const handleCancelEdit = () => {
    // Restore original data
    setName(originalData.name);
    setBio(originalData.bio);
    setSkillsOffered(originalData.skillsOffered);
    setSkillsWanted(originalData.skillsWanted);
    setIsEditing(false);
  };

  const addSkillOffered = () => {
    if (newSkillOffered.trim() === "") return;

    // Auto-categorize the skill
    const category = categorizeSkill(newSkillOffered);

    setSkillsOffered([
      ...skillsOffered,
      {
        skill: newSkillOffered,
        category,
      },
    ]);
    setNewSkillOffered("");
  };

  const addSkillWanted = () => {
    if (newSkillWanted.trim() !== "") {
      setSkillsWanted([...skillsWanted, newSkillWanted]);
      setNewSkillWanted("");
    }
  };

  const removeSkillOffered = (index) => {
    const updatedSkills = [...skillsOffered];
    updatedSkills.splice(index, 1);
    setSkillsOffered(updatedSkills);
  };

  const removeSkillWanted = (index) => {
    const updatedSkills = [...skillsWanted];
    updatedSkills.splice(index, 1);
    setSkillsWanted(updatedSkills);
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", onPress: logout, style: "destructive" },
    ]);
  };

  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity
            onPress={() => setMenuVisible(true)}
            style={styles.menuButton}
          >
            <MoreVertical size={24} color="#333" />
          </TouchableOpacity>
          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            anchor={{ x: 0, y: 0 }}
            style={styles.menu}
          >
            <MenuItem
              onPress={() => {
                setMenuVisible(false);
                setIsEditing(true);
              }}
              title="Edit Profile"
            />
            <MenuItem
              onPress={() => {
                setMenuVisible(false);
                handleLogout();
              }}
              title="Logout"
            />
            <MenuItem
              onPress={() => {
                setMenuVisible(false);
                navigation.navigate("Settings");
              }}
              title="Settings"
            />
          </Menu>
        </View>

        <ScrollView
          style={styles.scrollContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#6366f1"]}
            />
          }
        >
          <View style={styles.header}>
            <View style={{ position: "relative", alignItems: "center" }}>
              <Image
                source={
                  user.photoUrl
                    ? { uri: user.photoUrl }
                    : require("../assets/default-avatar.png")
                }
                style={styles.profileImage}
              />
              <TouchableOpacity
                style={styles.cameraIconContainer}
                onPress={handleImageUpload}
              >
                <Camera size={18} color="white" />
              </TouchableOpacity>
            </View>
            {isEditing ? (
              <TextInput
                style={styles.nameInput}
                value={name}
                onChangeText={setName}
                placeholder="Your Name"
              />
            ) : (
              <Text style={styles.name}>{user.name}</Text>
            )}

            {isEditing && (
              <View style={styles.editActionButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={handleCancelEdit}
                >
                  <X size={width * 0.04} color="#fff" />
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleSaveProfile}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.saveButtonText}>Save</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
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
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={addSkillOffered}
                >
                  <Text style={styles.addButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            )}
            <View style={styles.skillsContainer}>
              {skillsOffered.length > 0 ? (
                skillsOffered.map((skillObj, index) => (
                  <View
                    key={index}
                    style={[
                      styles.skillBadge,
                      getCategoryStyle(skillObj.category),
                    ]}
                  >
                    <Text style={styles.skillText}>{skillObj.skill}</Text>
                    {!isEditing && (
                      <Text style={styles.categoryText}>
                        {skillObj.category || categorizeSkill(skillObj.skill)}
                      </Text>
                    )}
                    {isEditing && (
                      <TouchableOpacity
                        onPress={() => removeSkillOffered(index)}
                      >
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
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={addSkillWanted}
                >
                  <Text style={styles.addButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            )}
            <View style={styles.skillsContainer}>
              {skillsWanted.length > 0 ? (
                skillsWanted.map((skill, index) => (
                  <View key={index} style={styles.skillBadge}>
                    <Text style={styles.skillText}>{skill}</Text>
                    {isEditing && (
                      <TouchableOpacity
                        onPress={() => removeSkillWanted(index)}
                      >
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
      </View>
    </SafeAreaView>
  );
}

// Helper function to get style based on category
const getCategoryStyle = (category) => {
  switch (category) {
    case "Tech":
      return styles.techSkill;
    case "Art":
      return styles.artSkill;
    case "Music":
      return styles.musicSkill;
    case "Language":
      return styles.languageSkill;
    case "Fitness":
      return styles.fitnessSkill;
    default:
      return styles.otherSkill;
  }
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  headerContainer: {
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: width * 0.05,
    paddingVertical: height * 0.02,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingTop:
      Platform.OS === "android"
        ? StatusBar.currentHeight + height * 0.02
        : height * 0.02,
  },
  headerTitle: {
    fontSize: width * 0.05,
    fontWeight: "bold",
  },
  menuButton: {
    padding: width * 0.01,
  },
  menu: {
    position: "absolute",
    top: height * 0.07,
    right: width * 0.05,
  },
  scrollContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    backgroundColor: "#fff",
    padding: width * 0.05,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  profileImage: {
    width: width * 0.25,
    height: width * 0.25,
    borderRadius: width * 0.125,
    marginBottom: height * 0.02,
  },
  name: {
    fontSize: width * 0.06,
    fontWeight: "bold",
    marginBottom: height * 0.01,
  },
  nameInput: {
    fontSize: width * 0.06,
    fontWeight: "bold",
    marginBottom: height * 0.01,
    textAlign: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#6366f1",
    paddingBottom: height * 0.005,
    width: "80%",
  },
  editActionButtons: {
    flexDirection: "row",
    marginTop: height * 0.01,
  },
  saveButton: {
    backgroundColor: "#6366f1",
    paddingVertical: height * 0.01,
    paddingHorizontal: width * 0.03,
    borderRadius: width * 0.05,
    flexDirection: "row",
    alignItems: "center",
    marginLeft: width * 0.02,
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: width * 0.04,
  },
  cancelButton: {
    backgroundColor: "#ef4444",
    paddingVertical: height * 0.01,
    paddingHorizontal: width * 0.03,
    borderRadius: width * 0.05,
    flexDirection: "row",
    alignItems: "center",
    marginRight: width * 0.02,
  },
  cancelButtonText: {
    color: "#fff",
    marginLeft: width * 0.01,
    fontSize: width * 0.04,
  },
  section: {
    backgroundColor: "#fff",
    padding: width * 0.05,
    marginTop: height * 0.02,
    borderRadius: width * 0.025,
    marginHorizontal: width * 0.04,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: width * 0.045,
    fontWeight: "bold",
    marginBottom: height * 0.02,
    color: "#333",
  },
  bioText: {
    fontSize: width * 0.04,
    lineHeight: height * 0.03,
    color: "#555",
  },
  bioInput: {
    fontSize: width * 0.04,
    lineHeight: height * 0.03,
    color: "#555",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: width * 0.02,
    padding: width * 0.025,
    minHeight: height * 0.12,
    textAlignVertical: "top",
  },
  addSkillContainer: {
    flexDirection: "row",
    marginBottom: height * 0.02,
  },
  skillInput: {
    flex: 1,
    height: height * 0.05,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: width * 0.02,
    paddingHorizontal: width * 0.025,
    marginRight: width * 0.025,
    fontSize: width * 0.04,
  },
  addButton: {
    backgroundColor: "#6366f1",
    width: height * 0.05,
    height: height * 0.05,
    borderRadius: height * 0.025,
    justifyContent: "center",
    alignItems: "center",
  },
  addButtonText: {
    color: "#fff",
    fontSize: width * 0.05,
    fontWeight: "bold",
  },
  skillsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  skillBadge: {
    backgroundColor: "#e0e7ff",
    paddingVertical: height * 0.008,
    paddingHorizontal: width * 0.03,
    borderRadius: width * 0.05,
    marginRight: width * 0.02,
    marginBottom: height * 0.01,
    flexDirection: "row",
    alignItems: "center",
  },
  techSkill: {
    backgroundColor: "#dbeafe", // light blue
  },
  artSkill: {
    backgroundColor: "#fae8ff", // light purple
  },
  musicSkill: {
    backgroundColor: "#fef3c7", // light yellow
  },
  languageSkill: {
    backgroundColor: "#dcfce7", // light green
  },
  fitnessSkill: {
    backgroundColor: "#ffedd5", // light orange
  },
  otherSkill: {
    backgroundColor: "#e0e7ff", // light indigo (default)
  },
  skillText: {
    color: "#4f46e5",
    fontWeight: "500",
  },
  categoryText: {
    fontSize: 10,
    color: "#6b7280",
    marginLeft: 6,
    fontStyle: "italic",
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
  cameraIconContainer: {
    position: "absolute",
    bottom: height * 0.02,
    left: width * 0.25 - 30,
    backgroundColor: "#6366f1",
    borderRadius: 20,
    padding: 6,
    borderWidth: 2,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
});
