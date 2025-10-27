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
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔔 Auth state changed:', event, session?.user?.is_anonymous ? 'anonymous' : 'authenticated')

      if (session?.user) {
        // Convert Supabase user to AuthUser immediately (no async delay)
        const authUser: AuthUser = {
          id: session.user.id,
          email: session.user.email || null,
          isAnonymous: session.user.is_anonymous || false,
          tier: 'basic'
        }
        console.log('🔔 Auth state change - Setting user:', authUser.id)
        setUser(authUser)
      } else {
        console.log('🔔 Auth state change - No user, setting null')
        setUser(null)
      }

      // Always set loading to false after processing auth state change
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  async function initializeAuth() {
    console.log('🔐 AuthContext - initializeAuth() started')
    try {
      // Try to get existing session or create anonymous user
      console.log('🔐 AuthContext - Calling getOrCreateAnonUser()')
      const authUser = await getOrCreateAnonUser()
      console.log('🔐 AuthContext - getOrCreateAnonUser() result:', {
        hasUser: !!authUser,
        userId: authUser?.id,
        isAnonymous: authUser?.is_anonymous
      })
      // Note: onAuthStateChange will update user state
    } catch (error) {
      console.error('❌ AuthContext - Error initializing auth:', error)
    } finally {
      // Always set loading to false after initialization attempt
      // This prevents infinite loading state if auth fails or onAuthStateChange doesn't fire
      setLoading(false)
      console.log('🔐 AuthContext - initializeAuth() complete, loading=false')
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
