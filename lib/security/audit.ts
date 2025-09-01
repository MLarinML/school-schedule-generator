import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export interface SecurityEvent {
  type: 'LOGIN_SUCCESS' | 'LOGIN_FAIL' | 'LOGOUT' | 'PASSWORD_CHANGE' | 'PASSWORD_RESET_REQUEST' | 'ACCOUNT_LOCKED' | 'SUSPICIOUS_ACTIVITY' | 'EMAIL_VERIFY'
  userId?: string
  ip: string
  userAgent?: string
  metadata?: Record<string, any>
  timestamp?: Date
}

export class SecurityAudit {
  /**
   * Логирует событие безопасности
   */
  static async logEvent(event: SecurityEvent): Promise<void> {
    try {
      await prisma.securityEvent.create({
        data: {
          type: event.type,
          userId: event.userId,
          ip: event.ip,
          userAgent: event.userAgent,
          metadata: event.metadata ? JSON.stringify(event.metadata) : undefined,
        },
      })
    } catch (error) {
      console.error('Failed to log security event:', error)
      // Не выбрасываем ошибку, чтобы не нарушить основной функционал
    }
  }

  /**
   * Логирует успешный вход
   */
  static async logLoginSuccess(userId: string, ip: string, userAgent?: string): Promise<void> {
    await this.logEvent({
      type: 'LOGIN_SUCCESS',
      userId,
      ip,
      userAgent,
      metadata: { timestamp: new Date().toISOString() },
    })
  }

  /**
   * Логирует неудачную попытку входа
   */
  static async logLoginFail(userId: string | undefined, ip: string, userAgent?: string, reason?: string): Promise<void> {
    await this.logEvent({
      type: 'LOGIN_FAIL',
      userId,
      ip,
      userAgent,
      metadata: { reason, timestamp: new Date().toISOString() },
    })
  }

  /**
   * Логирует выход из системы
   */
  static async logLogout(userId: string, ip: string, userAgent?: string): Promise<void> {
    await this.logEvent({
      type: 'LOGOUT',
      userId,
      ip,
      userAgent,
      metadata: { timestamp: new Date().toISOString() },
    })
  }

  /**
   * Логирует смену пароля
   */
  static async logPasswordChange(userId: string, ip: string, userAgent?: string): Promise<void> {
    await this.logEvent({
      type: 'PASSWORD_CHANGE',
      userId,
      ip,
      userAgent,
      metadata: { timestamp: new Date().toISOString() },
    })
  }

  /**
   * Логирует сброс пароля
   */
  static async logPasswordReset(userId: string, ip: string, userAgent?: string): Promise<void> {
    await this.logEvent({
      type: 'PASSWORD_RESET_REQUEST',
      userId,
      ip,
      userAgent,
      metadata: { timestamp: new Date().toISOString() },
    })
  }

  /**
   * Логирует блокировку аккаунта
   */
  static async logAccountLocked(userId: string, ip: string, userAgent?: string, reason?: string): Promise<void> {
    await this.logEvent({
      type: 'ACCOUNT_LOCKED',
      userId,
      ip,
      userAgent,
      metadata: { reason, timestamp: new Date().toISOString() },
    })
  }

  /**
   * Логирует подозрительную активность
   */
  static async logSuspiciousActivity(userId: string | undefined, ip: string, userAgent?: string, details?: string): Promise<void> {
    await this.logEvent({
      type: 'SUSPICIOUS_ACTIVITY',
      userId,
      ip,
      userAgent,
      metadata: { details, timestamp: new Date().toISOString() },
    })
  }

  /**
   * Получает события безопасности для пользователя
   */
  static async getUserEvents(userId: string, limit: number = 100): Promise<any[]> {
    return prisma.securityEvent.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
  }

  /**
   * Получает события безопасности по IP
   */
  static async getIPEvents(ip: string, limit: number = 100): Promise<any[]> {
    return prisma.securityEvent.findMany({
      where: { ip },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
  }

  /**
   * Экспортирует события безопасности в CSV
   */
  static async exportEventsCSV(startDate?: Date, endDate?: Date): Promise<string> {
    const where: any = {}
    
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) where.createdAt.gte = startDate
      if (endDate) where.createdAt.lte = endDate
    }

    const events = await prisma.securityEvent.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { email: true }
        }
      }
    })

    const csvHeader = 'Timestamp,Type,User Email,IP,User Agent,Metadata\n'
    const csvRows = events.map((event: any) => {
      const timestamp = event.createdAt.toISOString()
      const userEmail = event.user?.email || 'N/A'
      const ip = event.ip || 'N/A'
      const userAgent = event.userAgent || 'N/A'
      const metadata = event.metadata || 'N/A'
      
      return `${timestamp},"${event.type}","${userEmail}","${ip}","${userAgent}","${metadata}"`
    }).join('\n')

    return csvHeader + csvRows
  }
}
