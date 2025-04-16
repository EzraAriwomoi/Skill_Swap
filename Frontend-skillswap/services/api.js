import axios from "axios"

const api = axios.create({
  baseURL: "http://192.168.107.58:3000/api",
  headers: {
    "Content-Type": "application/json",
  },
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If we get a 401 error and we're not on the login/signup page,
    // we could handle token refresh or logout here
    console.log("API Error:", error.response?.status, error.response?.data)
    return Promise.reject(error)
  },
)

export default api
