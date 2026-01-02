import axios from 'axios'

// Production'da backend URL'i, development'ta proxy kullan
const getBaseURL = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL
  }
  if (import.meta.env.PROD) {
    // Production'da backend URL'i kullan
    return 'https://servisyonetimsistemi.onrender.com/api'
  }
  // Development'ta proxy kullan
  return '/api'
}

const api = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor - Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    console.log('[AXIOS] Request to:', config.url)
    console.log('[AXIOS] Token exists:', !!token)
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
      console.log('[AXIOS] Token added:', token.substring(0, 30) + '...')
      console.log('[AXIOS] Authorization header:', config.headers.Authorization.substring(0, 40) + '...')
    } else {
      console.warn('[AXIOS] No token found for request:', config.url)
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor - Handle errors
let isRedirecting = false

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Prevent multiple redirects
      if (isRedirecting) {
        return Promise.reject(error)
      }
      
      // Login sayfasındayken veya login endpoint'ine istek atarken redirect yapma
      const isLoginPage = window.location.pathname === '/login'
      const isAuthEndpoint = error.config?.url?.includes('/auth/login') || error.config?.url?.includes('/auth/register')
      
      // Sadece login sayfasında değilsek ve auth endpoint'i değilse redirect yap
      if (!isLoginPage && !isAuthEndpoint) {
        const token = localStorage.getItem('token')
        if (!token) {
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          localStorage.removeItem('activeProject')
          isRedirecting = true
          window.location.href = '/login'
        }
      }
    }
    return Promise.reject(error)
  }
)

export default api

