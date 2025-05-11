import { View, StyleSheet, Platform } from "react-native"
import { BlurView } from "expo-blur"

export default function BlurTabBarBackground() {
  if (Platform.OS === "ios") {
    return <BlurView tint="light" intensity={80} style={StyleSheet.absoluteFill} />
  }

  // For Android, use a semi-transparent background
  return <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(255, 255, 255, 0.95)" }]} />
}
