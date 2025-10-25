'use client'

/**
 * Auth Context Provider
 *
 * Provides authentication state and methods throughout the app.
 * Automatically creates anonymous sessions for new users.
 */

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import {
  getOrCreateAnonUser,
  upgradeAnonUser,
  signUpUser,
  loginUser,
  logoutUser,
  getCurrentUser,
  type AuthUser
} from '@/lib/supabase/auth'

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  isAnonymous: boolean
  upgradeAccount: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signUp: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  // Initialize auth session (anonymous or existing)
  useEffect(() => {
    initializeAuth()

    // Listen for auth state changes
    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔔 Auth state changed:', event, session?.user?.is_anonymous ? 'anonymous' : 'authenticated')

      if (session?.user) {
        const authUser = await getCurrentUser()
        setUser(authUser)
      } else {
        setUser(null)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  async function initializeAuth() {
    setLoading(true)
    try {
      // Try to get existing session or create anonymous user
      const authUser = await getOrCreateAnonUser()

      if (authUser) {
        const currentUser = await getCurrentUser()
        setUser(currentUser)
      }
    } catch (error) {
      console.error('❌ Error initializing auth:', error)
    } finally {
      setLoading(false)
    }
  }

  async function refreshUser() {
    const currentUser = await getCurrentUser()
    setUser(currentUser)
  }

  async function handleUpgradeAccount(email: string, password: string) {
    const result = await upgradeAnonUser(email, password)
    if (result.success) {
      await refreshUser()
    }
    return result
  }

  async function handleSignUp(email: string, password: string) {
    const result = await signUpUser(email, password)
    if (result.success) {
      await refreshUser()
    }
    return result
  }

  async function handleLogin(email: string, password: string) {
    const result = await loginUser(email, password)
    if (result.success) {
      await refreshUser()
    }
    return result
  }

  async function handleLogout() {
    await logoutUser()
    // After logout, create new anonymous session
    await initializeAuth()
  }

  const value = {
    user,
    loading,
    isAnonymous: user?.isAnonymous || false,
    upgradeAccount: handleUpgradeAccount,
    signUp: handleSignUp,
    login: handleLogin,
    logout: handleLogout,
    refreshUser
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
