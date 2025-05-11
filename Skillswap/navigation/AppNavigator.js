"use client";

import { useContext, useState, useEffect } from "react";
import { View, Alert, TouchableOpacity } from "react-native";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { AuthContext } from "../context/AuthContext";
import {
  useNavigation,
  getFocusedRouteNameFromRoute,
} from "@react-navigation/native";
import { MoreVertical, ChevronLeft } from "lucide-react-native";
import { Menu, MenuItem } from "../components/Menu";
import api from "../services/api";

// Import custom TabBar component
import TabBar from "../components/TabBar";

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
        options={({ route, navigation }) => ({
          title: route?.params?.userName ?? "Chat",
          headerTitleStyle: {
            fontSize: 18,
            fontWeight: "600",
            color: "black",
          },
          headerLeft: () => {
            return (
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={{ paddingLeft: 10 }}
              >
                <ChevronLeft size={24} />
              </TouchableOpacity>
            );
          },
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
        options={{ title: "User Profile" }}
      />
      <Stack.Screen
        name="CreateBooking"
        component={CreateBookingScreen}
        options={{ title: "Book a Session" }}
      />
      <Stack.Screen
        name="Chat"
        component={ChatScreen}
        options={({ route, navigation }) => ({
          title: route?.params?.userName ?? "Chat",
          headerLeft: () => {
            return (
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={{ paddingLeft: 10 }}
              >
                <ChevronLeft size={24} />
              </TouchableOpacity>
            );
          },
        })}
      />
    </Stack.Navigator>
  );
}

function ProfileHeaderRight() {
  const [menuVisible, setMenuVisible] = useState(false);
  const { logout } = useContext(AuthContext);
  const navigation = useNavigation();

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        onPress: () => {
          logout();
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
            navigation.navigate("Profile", { screen: "EditProfile" });
          }}
          title="Edit Profile"
        />
        <MenuItem
          onPress={() => {
            setMenuVisible(false);
            navigation.navigate("Profile", { screen: "Settings" });
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
  const navigation = useNavigation();
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
          headerRight: () => <ProfileHeaderRight navigation={navigation} />,
          headerLeft: () => (
            <TouchableOpacity onPress={() => screenNavigation.goBack()}>
              <ChevronLeft size={24} />
            </TouchableOpacity>
          ),
          headerLeft: null,
        })}
      />
      <Stack.Screen
        name="EditProfile"
        component={EditProfile}
        options={{ title: "Edit Profile" }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: "Settings" }}
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
        options={{ title: "Bookings" }}
      />
    </Stack.Navigator>
  );
}

function MainTabs() {
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);

  // Fetch total unread message count
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const response = await api.get("/messages/unread-count");
        setTotalUnreadCount(response.data.count);
      } catch (error) {
        console.log("Error fetching unread count:", error);
      }
    };

    fetchUnreadCount();

    // Set up interval to refresh unread count every 30 seconds
    const intervalId = setInterval(fetchUnreadCount, 30000);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <Tab.Navigator
      tabBar={(props) => {
        // Get the route name from the Messages tab
        const messagesRoute = props.state.routes.find(
          (route) => route.name === "Messages"
        );
        const currentRouteName = messagesRoute
          ? getFocusedRouteNameFromRoute(messagesRoute)
          : undefined;

        // If we're in the Chat screen, don't render the tab bar at all
        if (currentRouteName === "Chat") {
          return null;
        }

        return <TabBar {...props} unreadCount={totalUnreadCount} />;
      }}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="Home" component={HomeStack} />
      <Tab.Screen name="Bookings" component={BookingStack} />
      <Tab.Screen
        name="Messages"
        component={ChatStack}
        options={{
          tabBarBadge: totalUnreadCount > 0 ? totalUnreadCount : null,
        }}
      />
      <Tab.Screen name="Profile" component={ProfileStack} />
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
