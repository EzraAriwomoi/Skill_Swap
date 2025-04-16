import "react-native-gesture-handler"
import { NavigationContainer } from "@react-navigation/native"
import { AuthProvider } from "./context/AuthContext"
import AppNavigator from "./navigation/AppNavigator"
import { StatusBar } from "react-native"

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <StatusBar barStyle="dark-content" />
        <AppNavigator />
      </NavigationContainer>
    </AuthProvider>
  )
}
