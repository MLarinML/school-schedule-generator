import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export interface RateLimitConfig {
  windowMs: number
  maxAttempts: number
  blockDurationMs?: number
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetTime: Date
  blocked: boolean
  blockExpiresAt?: Date
}

export class RateLimiter {
  private static getDefaultConfig(): RateLimitConfig {
    // Для разработки - очень мягкие лимиты
    const isDevelopment = process.env.NODE_ENV === 'development'
    
    if (isDevelopment) {
      return {
        windowMs: 3600000, // 60 минут
        maxAttempts: 100,  // 100 попыток
        blockDurationMs: 3600000 // 60 минут блокировки
      }
    }
    
    return {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '900000'), // 15 минут
      maxAttempts: parseInt(process.env.RATE_LIMIT_MAX_ATTEMPTS || '5'),
      blockDurationMs: parseInt(process.env.RATE_LIMIT_WINDOW || '900000') // Используем то же окно
    }
  }

  /**
   * Проверяет ограничение частоты для IP адреса
   */
  static async checkIPLimit(
    ip: string,
    action: string,
    config?: Partial<RateLimitConfig>
  ): Promise<RateLimitResult> {
    const finalConfig = { ...this.getDefaultConfig(), ...config }
    const key = `ip:${action}:${ip}`
    
    return this.checkLimit(key, finalConfig)
  }

  /**
   * Проверяет ограничение частоты для email
   */
  static async checkEmailLimit(
    email: string,
    action: string,
    config?: Partial<RateLimitConfig>
  ): Promise<RateLimitResult> {
    const finalConfig = { ...this.getDefaultConfig(), ...config }
    const key = `email:${action}:${email.toLowerCase()}`
    
    return this.checkLimit(key, finalConfig)
  }

  /**
   * Проверяет ограничение частоты для комбинированного ключа
   */
  static async checkCombinedLimit(
    ip: string,
    email: string,
    action: string,
    config?: Partial<RateLimitConfig>
  ): Promise<RateLimitResult> {
    const finalConfig = { ...this.getDefaultConfig(), ...config }
    const key = `combined:${action}:${ip}:${email.toLowerCase()}`
    
    return this.checkLimit(key, finalConfig)
  }

  /**
   * Основная логика проверки ограничений
   */
  private static async checkLimit(
    key: string,
    config: RateLimitConfig
  ): Promise<RateLimitResult> {
    // Для разработки - отключаем rate limiting
    const isDevelopment = process.env.NODE_ENV === 'development'
    
    if (isDevelopment) {
      return {
        allowed: true,
        remaining: 100,
        resetTime: new Date(Date.now() + 3600000), // 60 минут
        blocked: false
      }
    }
    
    const now = new Date()
    const windowStart = new Date(now.getTime() - config.windowMs)
    const blockExpiresAt = new Date(now.getTime() + (config.blockDurationMs || 0))

    try {
      // Получаем текущее ограничение
      let rateLimit = await prisma.rateLimit.findUnique({
        where: { key }
      })

      if (!rateLimit) {
        // Создаем новое ограничение
        rateLimit = await prisma.rateLimit.create({
          data: {
            key,
            windowStartsAt: now,
            windowEndsAt: new Date(now.getTime() + config.windowMs),
            count: 1
          }
        })
        
        return {
          allowed: true,
          remaining: config.maxAttempts - 1,
          resetTime: rateLimit.windowEndsAt,
          blocked: false
        }
      }

      // Проверяем, не истекло ли окно
      if (now > rateLimit.windowEndsAt) {
        // Создаем новое окно
        rateLimit = await prisma.rateLimit.update({
          where: { key },
          data: {
            windowStartsAt: now,
            windowEndsAt: new Date(now.getTime() + config.windowMs),
            count: 1
          }
        })
        
        return {
          allowed: true,
          remaining: config.maxAttempts - 1,
          resetTime: rateLimit.windowEndsAt,
          blocked: false
        }
      }

      // Проверяем, не превышен ли лимит
      if (rateLimit.count >= config.maxAttempts) {
        return {
          allowed: false,
          remaining: 0,
          resetTime: rateLimit.windowEndsAt,
          blocked: true,
          blockExpiresAt
        }
      }

      // Увеличиваем счетчик
      rateLimit = await prisma.rateLimit.update({
        where: { key },
        data: {
          count: rateLimit.count + 1
        }
      })

      return {
        allowed: true,
        remaining: config.maxAttempts - rateLimit.count,
        resetTime: rateLimit.windowEndsAt,
        blocked: false
      }
    } catch (error) {
      console.error('Rate limit check failed:', error)
      // В случае ошибки разрешаем запрос
      return {
        allowed: true,
        remaining: config.maxAttempts,
        resetTime: new Date(now.getTime() + config.windowMs),
        blocked: false
      }
    }
  }

  /**
   * Сбрасывает ограничение для ключа
   */
  static async resetLimit(key: string): Promise<void> {
    try {
      await prisma.rateLimit.delete({
        where: { key }
      })
    } catch (error) {
      console.error('Failed to reset rate limit:', error)
    }
  }

  /**
   * Очищает устаревшие записи ограничений
   */
  static async cleanup(): Promise<void> {
    try {
      const now = new Date()
      await prisma.rateLimit.deleteMany({
        where: {
          windowEndsAt: {
            lt: now
          }
        }
      })
    } catch (error) {
      console.error('Rate limit cleanup failed:', error)
    }
  }

  /**
   * Получает статистику по ограничениям
   */
  static async getStats(): Promise<{ total: number; active: number }> {
    try {
      const now = new Date()
      const total = await prisma.rateLimit.count()
      const active = await prisma.rateLimit.count({
        where: {
          windowEndsAt: {
            gt: now
          }
        }
      })
      
      return { total, active }
    } catch (error) {
      console.error('Failed to get rate limit stats:', error)
      return { total: 0, active: 0 }
    }
  }
}

