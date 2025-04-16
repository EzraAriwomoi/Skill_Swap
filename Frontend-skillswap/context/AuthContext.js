"use client"

import { createContext, useState, useEffect } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"
import api from "../services/api"

export const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is logged in
    const loadStoredUser = async () => {
      try {
        const storedUser = await AsyncStorage.getItem("user")
        const token = await AsyncStorage.getItem("token")

        if (storedUser && token) {
          api.defaults.headers.common["Authorization"] = `Bearer ${token}`
          setUser(JSON.parse(storedUser))
        }
      } catch (error) {
        console.log("Error loading stored user", error)
      } finally {
        setLoading(false)
      }
    }

    loadStoredUser()
  }, [])

  const login = async (email, password) => {
    try {
      const response = await api.post("/auth/login", { email, password })
      const { user, token } = response.data

      await AsyncStorage.setItem("user", JSON.stringify(user))
      await AsyncStorage.setItem("token", token)

      api.defaults.headers.common["Authorization"] = `Bearer ${token}`

      setUser(user)
      return { success: true }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Login failed",
      }
    }
  }

  const signup = async (name, email, password) => {
    try {
      const response = await api.post("/auth/signup", { name, email, password })
      const { user, token } = response.data

      await AsyncStorage.setItem("user", JSON.stringify(user))
      await AsyncStorage.setItem("token", token)
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`

      setUser(user)
      return { success: true }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Signup failed",
      }
    }
  }

  const logout = async () => {
    try {
      // Remove stored user and token
      await AsyncStorage.removeItem("user")
      await AsyncStorage.removeItem("token")

      // Remove token from API calls
      delete api.defaults.headers.common["Authorization"]

      setUser(null)
    } catch (error) {
      console.log("Error logging out", error)
    }
  }

  const updateProfile = async (profileData) => {
    try {
      const response = await api.put("/users/profile", profileData)
      const updatedUser = response.data

      // Update stored user
      await AsyncStorage.setItem("user", JSON.stringify(updatedUser))

      setUser(updatedUser)
      return { success: true }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Profile update failed",
      }
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        signup,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
