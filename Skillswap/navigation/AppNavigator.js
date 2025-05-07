"use client";

import { useContext, useState } from "react";
import { View, Alert, TouchableOpacity, Platform } from "react-native";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { AuthContext } from "../context/AuthContext";
import { useNavigation } from "@react-navigation/native";
import { MoreVertical } from "lucide-react-native";
import { Menu, MenuItem } from "../components/Menu";
import { ChevronLeft } from "lucide-react-native";

import LoginScreen from "../screens/LoginScreen";
import SignupScreen from "../screens/SignupScreen";
import HomeScreen from "../screens/HomeScreen";
import ProfileScreen from "../screens/ProfileScreen";
import ChatListScreen from "../screens/ChatListScreen";
import ChatScreen from "../screens/ChatScreen";
import EditProfile from "../screens/EditProfile";
import BookingScreen from "../screens/BookingScreen";
import UserProfile from "../screens/UserProfile";
import CreateBookingScreen from "../screens/CreateBookingScreen";
import SettingsScreen from "../screens/SettingsScreen";
import BlurTabBarBackground from "../components/BlurTabBarBackground";
import Feather from "react-native-vector-icons/Feather";

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
    </Stack.Navigator>
  );
}

function ChatStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: "#00acc1" },
        headerBackTitleVisible: false,
        headerLeft: () => {
          const navigation = useNavigation();
          return (
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <ChevronLeft size={24} />
            </TouchableOpacity>
          );
        },
      }}
    >
      <Stack.Screen
        name="ChatList"
        component={ChatListScreen}
        options={{
          title: "Messages",
          headerLeft: null,
        }}
      />
      <Stack.Screen
        name="Chat"
        component={ChatScreen}
        options={({ route }) => ({
          title: route.params.userName,
        })}
      />
    </Stack.Navigator>
  );
}

function HomeStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: "#00acc1" },
        headerBackTitleVisible: false,
        headerLeft: () => {
          const navigation = useNavigation();
          return (
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <ChevronLeft size={24} />
            </TouchableOpacity>
          );
        },
      }}
    >
      <Stack.Screen
        name="HomeScreen"
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="UserProfile"
        component={UserProfile}
        options={{
          title: "User Profile",
        }}
      />
      <Stack.Screen
        name="CreateBooking"
        component={CreateBookingScreen}
        options={{
          title: "Book a Session",
        }}
      />
      <Stack.Screen
        name="Chat"
        component={ChatScreen}
        options={({ route }) => ({
          title: route.params.userName,
        })}
      />
    </Stack.Navigator>
  );
}

function ProfileHeaderRight({ navigation }) {
  const [menuVisible, setMenuVisible] = useState(false);
  const { logout } = useContext(AuthContext);

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        onPress: () => {
          logout();
          navigation.replace("Auth");
        },
        style: "destructive",
      },
    ]);
  };

  return (
    <View
      style={{ marginRight: 10, flexDirection: "row", alignItems: "center" }}
    >
      <TouchableOpacity
        onPress={() => setMenuVisible(true)}
        style={{ marginLeft: 10 }}
      >
        <MoreVertical size={24} />
      </TouchableOpacity>
      <Menu
        visible={menuVisible}
        onDismiss={() => setMenuVisible(false)}
        anchor={{ x: 0, y: 0 }}
        style={{ marginTop: 10 }}
      >
        <MenuItem
          onPress={() => {
            setMenuVisible(false);
            navigation.navigate("EditProfile");
          }}
          title="Edit Profile"
        />
        <MenuItem
          onPress={() => {
            setMenuVisible(false);
            navigation.navigate("Settings");
          }}
          title="Settings"
        />
        <MenuItem
          onPress={() => {
            setMenuVisible(false);
            handleLogout();
          }}
          title="Logout"
        />
      </Menu>
    </View>
  );
}

function ProfileStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: "#00acc1" },
        headerBackTitleVisible: false,
        headerLeft: () => {
          const navigation = useNavigation();
          return (
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <ChevronLeft size={24} />
            </TouchableOpacity>
          );
        },
      }}
    >
      <Stack.Screen
        name="ProfileScreen"
        component={ProfileScreen}
        options={({ navigation: screenNavigation }) => ({
          title: "Profile",
          headerRight: () => (
            <ProfileHeaderRight navigation={screenNavigation} />
          ),
          headerLeft: null,
        })}
      />
      <Stack.Screen
        name="EditProfile"
        component={EditProfile}
        options={{
          title: "Edit Profile",
        }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: "Settings",
        }}
      />
    </Stack.Navigator>
  );
}

function BookingStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: "#00acc1" },
      }}
    >
      <Stack.Screen
        name="BookingScreen"
        component={BookingScreen}
        options={{
          title: "Bookings",
        }}
      />
    </Stack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: "#00acc1",
        tabBarInactiveTintColor: "gray",
        tabBarStyle: {
          position: "absolute",
          backgroundColor: "transparent",
          borderTopWidth: 1,
          elevation: 0,
          height: 85,
        },
        tabBarBackground: () => <BlurTabBarBackground />,
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeStack}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Feather name="home" color={color} size={size} />
          ),
        }}
      />

      <Tab.Screen
        name="Bookings"
        component={BookingStack}
        options={{
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Feather name="calendar" color={color} size={size} />
          ),
        }}
      />

      <Tab.Screen
        name="Messages"
        component={ChatStack}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Feather name="message-circle" color={color} size={size} />
          ),
        }}
      />

      <Tab.Screen
        name="Profile"
        component={ProfileStack}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Feather name="user" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { user } = useContext(AuthContext);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <Stack.Screen name="Main" component={MainTabs} />
      ) : (
        <Stack.Screen name="Auth" component={AuthStack} />
      )}
    </Stack.Navigator>
  );
}
