import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  ScrollView,
  Dimensions,
  SafeAreaView,
  Alert,
} from "react-native";
import { AuthContext } from "../context/AuthContext";
import { X, Camera } from "lucide-react-native";
import { categorizeSkill } from "../utils/skillCategories";
import api from "../services/api";
import * as ImagePicker from "expo-image-picker";

const { width, height } = Dimensions.get("window");

const countryNameToCode = {
  Kenya: "KE",
  Uganda: "UG",
  Tanzania: "TZ",
  Nigeria: "NG",
  // more will be displayed
};

export default function EditProfile({ navigation }) {
  const { user, updateProfile } = useContext(AuthContext);
  const [isEditing, setIsEditing] = useState(true);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [skillsOffered, setSkillsOffered] = useState([]);
  const [skillsWanted, setSkillsWanted] = useState([]);
  const [newSkillOffered, setNewSkillOffered] = useState("");
  const [newSkillWanted, setNewSkillWanted] = useState("");
  const [loading, setLoading] = useState(false);
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [originalData, setOriginalData] = useState({});

  useEffect(() => {
    if (user) {
      const userData = {
        name: user.name || "",
        bio: user.bio || "",
        location: user.location || "",
        skillsOffered: user.skillsOffered || [],
        skillsWanted: user.skillsWanted || [],
        photoUrl: user.photoUrl || null,
      };

      setName(userData.name);
      setBio(userData.bio);
      setSkillsOffered(userData.skillsOffered);
      setSkillsWanted(userData.skillsWanted);
      setOriginalData(userData);
      setPhotoUrl(userData.photoUrl);

      const [parsedCity = "", parsedCountry = ""] = userData.location
        .split(",")
        .map((s) => s.trim());
      setCity(parsedCity);
      setCountry(parsedCountry);
    }
  }, [user]);

  const handleSaveProfile = async () => {
    setLoading(true);

    const categorizedSkillsOffered = skillsOffered.map((skillObj) => {
      if (!skillObj.category || skillObj.category === "Other") {
        return {
          ...skillObj,
          category: categorizeSkill(skillObj.skill),
        };
      }
      return skillObj;
    });

    const combinedLocation =
      city || country ? `${city}, ${country}` : "No location set";

    const result = await updateProfile({
      name,
      bio,
      location: combinedLocation,
      skillsOffered: categorizedSkillsOffered,
      skillsWanted,
      photoUrl,
    });
    setLoading(false);

    if (result.success) {
      Alert.alert("Success", "Profile updated successfully!");
      navigation.goBack();
    } else {
      Alert.alert("Error", result.message);
    }
  };

  const handleImageUpload = async () => {
    const newUrl = await uploadProfileImage();
    if (newUrl) setPhotoUrl(newUrl);
  };

  const uploadProfileImage = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      alert("Permission to access media library is required!");
      return;
    }

    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      base64: false,
    });

    if (pickerResult.canceled) return;

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

    setLoading(true);
    try {
      const res = await api.post("/users/upload-photo", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setLoading(false);
      return res.data.photoUrl;
    } catch (error) {
      setLoading(false);
      console.error("Upload error:", error);
      alert("Failed to upload image.");
      return null;
    }
  };

  const addSkillOffered = () => {
    if (newSkillOffered.trim() === "") return;
    const category = categorizeSkill(newSkillOffered);
    setSkillsOffered([...skillsOffered, { skill: newSkillOffered, category }]);
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

  const getFlagEmoji = (location) => {
    const country = location.split(",").pop().trim();
    const countryCode = countryNameToCode[country];
    return countryCode
      ? String.fromCodePoint(
          ...[...countryCode.toUpperCase()].map(
            (c) => 0x1f1e6 - 65 + c.charCodeAt()
          )
        )
      : "";
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollViewContent}
      >
        <View style={styles.header}>
          <View style={styles.profileImageContainer}>
            <Image
              source={
                photoUrl
                  ? { uri: photoUrl }
                  : require("../assets/default-avatar.png")
              }
              style={styles.profileImage}
            />
            <TouchableOpacity
              onPress={handleImageUpload}
              style={styles.cameraIconContainer}
            >
              <Camera size={18} color="white" />
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Your Name"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>City</Text>
            <TextInput
              style={styles.input}
              value={city}
              onChangeText={setCity}
              placeholder="Your City"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Country</Text>
            <TextInput
              style={styles.input}
              value={country}
              onChangeText={setCountry}
              placeholder="Your Country"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About Me</Text>
          <TextInput
            style={[styles.bioInput, styles.professionalInput]}
            value={bio}
            onChangeText={setBio}
            placeholder="Tell us about yourself..."
            multiline
            textAlignVertical="top"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Skills I Can Teach</Text>
          <View style={styles.addSkillContainer}>
            <TextInput
              style={[styles.skillInput, styles.professionalInput]}
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
                  <Text style={styles.categoryText}>
                    {skillObj.category || categorizeSkill(skillObj.skill)}
                  </Text>
                  <TouchableOpacity onPress={() => removeSkillOffered(index)}>
                    <Text style={styles.removeSkill}>×</Text>
                  </TouchableOpacity>
                </View>
              ))
            ) : (
              <Text style={styles.noSkillsText}>No skills added yet</Text>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Skills I Want to Learn</Text>
          <View style={styles.addSkillContainer}>
            <TextInput
              style={[styles.skillInput, styles.professionalInput]}
              value={newSkillWanted}
              onChangeText={setNewSkillWanted}
              placeholder="Add a skill..."
            />
            <TouchableOpacity style={styles.addButton} onPress={addSkillWanted}>
              <Text style={styles.addButtonText}>+</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.skillsContainer}>
            {skillsWanted.length > 0 ? (
              skillsWanted.map((skill, index) => (
                <View key={index} style={styles.skillBadge}>
                  <Text style={styles.skillText}>{skill}</Text>
                  <TouchableOpacity onPress={() => removeSkillWanted(index)}>
                    <Text style={styles.removeSkill}>×</Text>
                  </TouchableOpacity>
                </View>
              ))
            ) : (
              <Text style={styles.noSkillsText}>No skills added yet</Text>
            )}
          </View>
        </View>

        <View style={styles.bottomButtonsContainer}>
          <TouchableOpacity
            style={[styles.bottomButton, styles.cancelBottomButton]}
            onPress={() => navigation.goBack()}
          >
            <X size={width * 0.05} color="#fff" />
            <Text style={styles.bottomButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.bottomButton, styles.saveBottomButton]}
            onPress={handleSaveProfile}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.bottomButtonText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>
        <View style={{ height: height * 0.1 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

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
  scrollViewContent: {
    paddingBottom: height * 0.03,
  },
  header: {
    backgroundColor: "#fff",
    padding: width * 0.05,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  profileImageContainer: {
    position: "relative",
    alignItems: "center",
    marginBottom: height * 0.03,
  },
  profileImage: {
    width: width * 0.25,
    height: width * 0.25,
    borderRadius: width * 0.125,
  },
  cameraIconContainer: {
    position: "absolute",
    bottom: height * 0.01,
    right: -width * 0.01,
    backgroundColor: "#00acc1",
    borderRadius: 20,
    padding: 6,
    borderWidth: 2,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  inputContainer: {
    width: "80%",
    marginBottom: height * 0.02,
  },
  inputLabel: {
    fontSize: width * 0.04,
    color: "#333",
    marginBottom: height * 0.005,
    fontWeight: "bold",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: width * 0.02,
    padding: width * 0.03,
    fontSize: width * 0.045,
    color: "#555",
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
  bioInput: {
    fontSize: width * 0.04,
    lineHeight: height * 0.03,
    color: "#555",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: width * 0.02,
    padding: width * 0.025,
    minHeight: height * 0.12,
  },
  professionalInput: {
    backgroundColor: "#f7f7f7",
  },
  addSkillContainer: {
    flexDirection: "row",
    marginBottom: height * 0.02,
    alignItems: "center",
  },
  skillInput: {
    flex: 1,
    height: height * 0.05,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: width * 0.02,
    paddingHorizontal: width * 0.025,
    marginRight: width * 0.025,
    fontSize: width * 0.04,
    backgroundColor: "#f7f7f7",
  },
  addButton: {
    backgroundColor: "#00acc1",
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
    backgroundColor: "#E0F7FA",
    borderColor: "#00ACC1",
  },
  artSkill: {
    backgroundColor: "#FCE4EC",
    borderColor: "#EC407A",
    borderWidth: 1,
  },
  musicSkill: {
    backgroundColor: "#EDE7F6",
    borderColor: "#7E57C2",
    borderWidth: 1,
  },
  languageSkill: {
    backgroundColor: "#FFF3E0",
    borderColor: "#FFA726",
    borderWidth: 1,
  },
  otherSkill: {
    backgroundColor: "#F5F5F5",
    borderColor: "#BDBDBD",
    borderWidth: 1,
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
  bottomButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: width * 0.05,
  },
  bottomButton: {
    paddingVertical: height * 0.015,
    paddingHorizontal: width * 0.05,
    borderRadius: width * 0.04,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  cancelBottomButton: {
    backgroundColor: "#ef4444",
  },
  saveBottomButton: {
    backgroundColor: "#00acc1",
  },
  bottomButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: width * 0.045,
    marginLeft: width * 0.01,
  },
});
