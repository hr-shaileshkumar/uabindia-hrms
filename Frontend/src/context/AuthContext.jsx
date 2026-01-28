import { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'
import Swal from 'sweetalert2'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')
    
    if (token && userData) {
      const parsedUser = JSON.parse(userData)
      setUser(parsedUser)
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    }
    
    setLoading(false)
  }, [])

  const generateOtp = async (mobileNumber) => {
    const response = await axios.post('/api/auth/generate-otp', { mobileNumber })
    return response.data
  }

  const verifyOtp = async (mobileNumber, otpCode) => {
    const verifyResponse = await axios.post('/api/auth/verify-otp', {
      mobileNumber,
      otpCode
    })

    if (verifyResponse.data.success) {
      const { token, user } = verifyResponse.data
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))
      setUser(user)
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      return { success: true }
    }

    throw new Error(verifyResponse.data.message)
  }

  const loginWithPassword = async (userId, password) => {
    const response = await axios.post('/api/auth/login', { userId, password })

    if (response.data.success) {
      const { token, user } = response.data
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))
      setUser(user)
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      return { success: true }
    }

    throw new Error(response.data.message)
  }

  const changePassword = async (userId, currentPassword, newPassword) => {
    const response = await axios.post('/api/auth/change-password', {
      userId,
      currentPassword,
      newPassword
    })

    return response.data
  }

  const resetPassword = async (userId, mobileNumber, otpCode, newPassword) => {
    const response = await axios.post('/api/auth/reset-password', {
      userId,
      mobileNumber,
      otpCode,
      newPassword
    })

    return response.data
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    delete axios.defaults.headers.common['Authorization']
  }

  const value = {
    user,
    generateOtp,
    verifyOtp,
    loginWithPassword,
    changePassword,
    resetPassword,
    logout,
    loading
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
