import axios from "axios"
import AsyncStorage from "@react-native-async-storage/async-storage"

const api = axios.create({
  baseURL: "http://192.168.100.4:3000/api",
  headers: {
    "Content-Type": "application/json",
  },
})

// Add request interceptor to add auth token to all requests
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem("token")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// Add response interceptor to handle common errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // Handle 401 Unauthorized errors (token expired)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        // Try to refresh token (if you have refresh token functionality)
        // const refreshToken = await AsyncStorage.getItem("refreshToken")
        // const response = await axios.post("https://your-backend-url.com/api/auth/refresh", { refreshToken })
        // const { token } = response.data
        // await AsyncStorage.setItem("token", token)
        // originalRequest.headers.Authorization = `Bearer ${token}`
        // return api(originalRequest)

        // If no refresh token functionality, clear storage and redirect to login
        await AsyncStorage.removeItem("token")
        await AsyncStorage.removeItem("user")
        return Promise.reject(error)
      } catch (refreshError) {
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  },
)

export default api
