"use client"

import { NavigationContainer } from "@react-navigation/native"
import { createStackNavigator } from "@react-navigation/stack"
import { SafeAreaProvider } from "react-native-safe-area-context"
import { AuthProvider } from "./context/AuthContext"
import AppNavigator from "./navigation/AppNavigator"
import { StatusBar, LogBox } from "react-native"
import { useEffect } from "react"
import { initializeSocket, disconnectSocket } from "./services/socketService"

// Ignore specific warnings
LogBox.ignoreLogs([
  "ViewPropTypes will be removed",
  "ColorPropType will be removed",
  "Animated: `useNativeDriver`",
  "AsyncStorage has been extracted from react-native",
])

const Stack = createStackNavigator()

export default function App() {
  // Initialize socket connection when app starts
  useEffect(() => {
    const setupSocket = async () => {
      try {
        await initializeSocket()
      } catch (error) {
        console.log("Socket initialization error:", error)
      }
    }

    setupSocket()

    // Clean up socket connection when app closes
    return () => {
      disconnectSocket()
    }
  }, [])

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <AuthProvider>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  )
}
