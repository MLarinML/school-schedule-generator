'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

import { User, AuthContextType } from '../types/auth'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [returnTo, setReturnTo] = useState<string | undefined>(undefined)
  const [checkoutIntent, setCheckoutIntent] = useState(false)

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/session')
      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
      } else {
        setUser(null)
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (response.ok) {
        // Сначала обновляем состояние пользователя
        await checkAuth()
        
        // Если checkAuth не вернул пользователя, создаем временного пользователя
        if (!user) {
          // Создаем временного пользователя на основе email
          const tempUser: User = {
            id: 'temp',
            email: email,
            firstName: email.split('@')[0],
            lastName: '',
            isEmailVerified: true,
            status: 'ACTIVE',
            createdAt: new Date().toISOString(),
            lastSeenAt: new Date().toISOString(),
          }
          setUser(tempUser)
        }
        
        return { success: true }
      } else {
        return { success: false, error: data.error || 'Ошибка входа' }
      }
    } catch (error) {
      console.error('Login failed:', error)
      return { success: false, error: 'Ошибка сети' }
    }
  }

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      })
      setUser(null)
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...userData })
    }
  }

  const openAuthModal = (returnToPath?: string, isCheckoutIntent?: boolean) => {
    setReturnTo(returnToPath || window.location.pathname)
    setCheckoutIntent(isCheckoutIntent || false)
    setIsAuthModalOpen(true)
  }

  const closeAuthModal = () => {
    setIsAuthModalOpen(false)
    setReturnTo(undefined)
    setCheckoutIntent(false)
  }

  useEffect(() => {
    checkAuth()
  }, [])

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthModalOpen,
    returnTo,
    checkoutIntent,
    login,
    logout,
    checkAuth,
    updateUser,
    openAuthModal,
    closeAuthModal,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
