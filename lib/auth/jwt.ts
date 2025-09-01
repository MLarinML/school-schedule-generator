import jwt from 'jsonwebtoken'
import { randomBytes } from 'crypto'

export interface JWTPayload {
  userId: string
  email: string
  roles: string[]
  sessionId: string
  iat: number
  exp: number
}

export interface SessionData {
  id: string
  userId: string
  email: string
  roles: string[]
  ip?: string
  userAgent?: string
}

export class JWTManager {
  private static secret = process.env.JWT_SECRET || 'default-secret'
  private static sessionExpiry = parseInt(process.env.SESSION_EXPIRY || '86400000')

  /**
   * Создает JWT токен для сессии
   */
  static createToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
    return jwt.sign(payload, this.secret, {
      expiresIn: this.sessionExpiry,
      issuer: 'raspisanie.ru',
      audience: 'raspisanie-users'
    })
  }

  /**
   * Верифицирует JWT токен
   */
  static verifyToken(token: string): JWTPayload | null {
    try {
      const decoded = jwt.verify(token, this.secret, {
        issuer: 'raspisanie.ru',
        audience: 'raspisanie-users'
      }) as JWTPayload
      
      return decoded
    } catch (error) {
      return null
    }
  }

  /**
   * Создает уникальный токен для верификации email или сброса пароля
   */
  static createVerificationToken(): string {
    return randomBytes(32).toString('hex')
  }

  /**
   * Создает токен для сессии
   */
  static createSessionToken(sessionData: SessionData): string {
    const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
      userId: sessionData.userId,
      email: sessionData.email,
      roles: sessionData.roles,
      sessionId: sessionData.id
    }
    
    return this.createToken(payload)
  }

  /**
   * Извлекает данные из токена без верификации (для отладки)
   */
  static decodeToken(token: string): JWTPayload | null {
    try {
      return jwt.decode(token) as JWTPayload
    } catch {
      return null
    }
  }

  /**
   * Проверяет, истек ли токен
   */
  static isTokenExpired(token: string): boolean {
    const decoded = this.decodeToken(token)
    if (!decoded) return true
    
    const now = Math.floor(Date.now() / 1000)
    return decoded.exp < now
  }

  /**
   * Получает время истечения токена
   */
  static getTokenExpiry(token: string): Date | null {
    const decoded = this.decodeToken(token)
    if (!decoded) return null
    
    return new Date(decoded.exp * 1000)
  }
}

