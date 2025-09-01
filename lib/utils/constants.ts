// Аутентификация
export const AUTH_CONSTANTS = {
  SESSION_DURATION: 24 * 60 * 60 * 1000, // 1 день
  REMEMBER_ME_DURATION: 30 * 24 * 60 * 60 * 1000, // 30 дней
  PASSWORD_MIN_LENGTH: 10,
  SALT_ROUNDS: 12,
} as const

// Rate Limiting
export const RATE_LIMIT_CONSTANTS = {
  LOGIN_ATTEMPTS: {
    IP: { maxAttempts: 5, windowMs: 15 * 60 * 1000 }, // 15 минут
    EMAIL: { maxAttempts: 3, windowMs: 15 * 60 * 1000 },
  },
  PASSWORD_RESET: {
    IP: { maxAttempts: 3, windowMs: 60 * 60 * 1000 }, // 1 час
    EMAIL: { maxAttempts: 2, windowMs: 60 * 60 * 1000 },
  },
} as const

// Email
export const EMAIL_CONSTANTS = {
  VERIFICATION_EXPIRY: 24 * 60 * 60 * 1000, // 24 часа
  PASSWORD_RESET_EXPIRY: 60 * 60 * 1000, // 1 час
} as const

// UI
export const UI_CONSTANTS = {
  ANIMATION_DURATION: 200,
  MODAL_BACKDROP_OPACITY: 0.5,
  TOAST_DURATION: 5000,
} as const

// API
export const API_CONSTANTS = {
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
} as const

