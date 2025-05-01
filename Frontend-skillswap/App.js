import "react-native-gesture-handler";
import { NavigationContainer } from "@react-navigation/native";
import { AuthProvider } from "./context/AuthContext";
import AppNavigator from "./navigation/AppNavigator";
import { StatusBar, Platform } from "react-native";

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        {Platform.OS === "ios" || Platform.OS === "android" ? (
          <StatusBar barStyle="dark-content" />
        ) : null}
        <AppNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}