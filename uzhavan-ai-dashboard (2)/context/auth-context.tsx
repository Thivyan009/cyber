"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { getCurrencyByCountry } from "@/lib/currencies"

type User = {
  id: string
  name: string
  email?: string
  phone: string
  country: string
  currency: {
    code: string
    symbol: string
    name: string
  }
  onboardingComplete?: boolean
  farmProfile?: {
    location: {
      type: string
      latitude: string
      longitude: string
      address: string
      district: string
      state: string
    }
    farmType: string[]
    otherFarmType?: string
    language: string
    farmSize: string
    irrigationMethod: string
    otherIrrigationMethod?: string
    isOrganic: boolean
  }
}

type AuthContextType = {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (name: string, phone: string, password: string, country: string) => Promise<void>
  logout: () => void
  updateUserPreferences: (data: Partial<User>) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  // Check if user is logged in on mount
  useEffect(() => {
    const checkAuth = () => {
      // In a real app, you would verify the token with your backend
      const token = document.cookie.includes("auth-token")

      if (token) {
        // Simulate getting user data from local storage
        const userData = localStorage.getItem("user-data")
        if (userData) {
          setUser(JSON.parse(userData))
        } else {
          // Default user if token exists but no data (shouldn't happen in real app)
          const defaultUser = {
            id: "1",
            name: "Raj Kumar",
            phone: "+91 98765 43210",
            country: "India",
            currency: getCurrencyByCountry("India"),
            onboardingComplete: false,
          }
          setUser(defaultUser)
          localStorage.setItem("user-data", JSON.stringify(defaultUser))
        }
      }

      setIsLoading(false)
    }

    checkAuth()
  }, [])

  const login = async (email: string, password: string) => {
    setIsLoading(true)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // In a real app, you would make an API request to verify credentials
      // and get a token and user data

      // For demo purposes, we'll create a mock user
      const mockUser = {
        id: "1",
        name: "Raj Kumar",
        email,
        phone: "+91 98765 43210",
        country: "India",
        currency: getCurrencyByCountry("India"),
        onboardingComplete: false,
      }

      // Set cookie (in a real app, this would be done by the server)
      document.cookie = "auth-token=mock-token; path=/; max-age=86400"

      // Store user data
      localStorage.setItem("user-data", JSON.stringify(mockUser))
      setUser(mockUser)

      // Redirect to onboarding if not completed, otherwise to dashboard
      router.push(mockUser.onboardingComplete ? "/" : "/onboarding")
    } catch (error) {
      console.error("Login failed:", error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const signup = async (name: string, phone: string, password: string, country: string) => {
    setIsLoading(true)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Get currency based on country
      const currency = getCurrencyByCountry(country)

      // Create new user
      const newUser = {
        id: Date.now().toString(),
        name,
        phone,
        country,
        currency,
        onboardingComplete: false,
      }

      // Set cookie
      document.cookie = "auth-token=mock-token; path=/; max-age=86400"

      // Store user data
      localStorage.setItem("user-data", JSON.stringify(newUser))
      setUser(newUser)

      // Redirect to onboarding
      router.push("/onboarding")
    } catch (error) {
      console.error("Signup failed:", error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    // Clear cookie
    document.cookie = "auth-token=; path=/; max-age=0"

    // Clear user data
    localStorage.removeItem("user-data")
    setUser(null)

    // Redirect to login
    router.push("/auth")
  }

  const updateUserPreferences = (data: Partial<User>) => {
    if (!user) return

    const updatedUser = { ...user, ...data }

    // Update local storage
    localStorage.setItem("user-data", JSON.stringify(updatedUser))

    // Update state
    setUser(updatedUser)
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout, updateUserPreferences }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
