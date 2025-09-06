export interface User {
  id: string
  email: string
  fullName: string | null
  firstName?: string
  lastName?: string
  schoolName?: string
  language?: string
  isEmailVerified: boolean
  status: 'PENDING' | 'ACTIVE' | 'SUSPENDED'
  createdAt: string
  lastSeenAt: string
  lastLoginAt?: string
  roles: string[]
}

export interface UserProfile {
  id: string
  userId: string
  fullName: string | null
  locale: string
  timezone: string
  avatarUrl: string | null
}

export interface Session {
  id: string
  userId: string
  createdAt: Date
  expiresAt: Date
  lastSeenAt: Date
  ip: string | null
  userAgent: string | null
  isRevoked: boolean
}

export interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthModalOpen: boolean
  returnTo: string | undefined
  checkoutIntent: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
  updateUser: (userData: Partial<User>) => void
  openAuthModal: (returnToPath?: string, isCheckoutIntent?: boolean) => void
  closeAuthModal: () => void
}

