"use client";

import { createContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../services/api";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    loadStoredUser();
  }, []);

  const loadStoredUser = async () => {
    try {
      setLoading(true);
      const storedUser = await AsyncStorage.getItem("user");
      const token = await AsyncStorage.getItem("token");

      if (storedUser && token) {
        try {
          const response = await api.get("/auth/validate-token");
          if (response.status === 200) {
            setUser(JSON.parse(storedUser));
          } else {
            await AsyncStorage.removeItem("user");
            await AsyncStorage.removeItem("token");
          }
        } catch (error) {
          console.log("Token validation error:", error);
          setUser(JSON.parse(storedUser));
        }
      }
    } catch (error) {
      console.log("Error loading stored user", error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setAuthError(null);
      const response = await api.post("/auth/login", { email, password });
      const { user, token } = response.data;

      await AsyncStorage.setItem("user", JSON.stringify(user));
      await AsyncStorage.setItem("token", token);

      setUser(user);
      return { success: true };
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        "Login failed. Please check your credentials.";
      setAuthError(errorMessage);
      return {
        success: false,
        message: errorMessage,
      };
    }
  };

  const signup = async (name, email, password) => {
    try {
      setAuthError(null);
      const response = await api.post("/auth/signup", {
        name,
        email,
        password,
      });
      const { user, token } = response.data;

      await AsyncStorage.setItem("user", JSON.stringify(user));
      await AsyncStorage.setItem("token", token);

      setUser(user);
      return { success: true };
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Signup failed. Please try again.";
      setAuthError(errorMessage);
      return {
        success: false,
        message: errorMessage,
      };
    }
  };

  const logout = async () => {
    try {
      try {
        await api.post("/auth/logout");
      } catch (error) {
        console.log("Logout API error:", error);
      }
      // Clear user data from AsyncStorage
      await AsyncStorage.removeItem("user");
      await AsyncStorage.removeItem("token");

      setUser(null);
      return { success: true };
    } catch (error) {
      console.log("Error logging out", error);
      return { success: false, message: "Logout failed" };
    }
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await api.put("/users/profile", profileData);
      const updatedUser = response.data;

      // Update stored user
      await AsyncStorage.setItem("user", JSON.stringify(updatedUser));

      setUser(updatedUser);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Profile update failed",
      };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        authError,
        login,
        signup,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
