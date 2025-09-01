import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { EmailService } from '../../../../lib/email/emailService'
import { RateLimiter } from '../../../../lib/rate-limit/rateLimiter'
import { requestPasswordResetSchema } from '../../../../lib/validation/auth'
import { JWTManager } from '../../../../lib/auth/jwt'

const prisma = new PrismaClient()
const emailService = new EmailService()

export async function POST(request: NextRequest) {
  try {
    // Получаем IP адрес для rate limiting
    const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown'
    
    // Проверяем rate limit для IP
    const ipRateLimit = await RateLimiter.checkIPLimit(ip, 'password_reset', {
      windowMs: 900000, // 15 минут
      maxAttempts: 3
    })
    
    if (!ipRateLimit.allowed) {
      return NextResponse.json(
        { 
          error: 'Слишком много попыток сброса пароля. Попробуйте позже.',
          resetTime: ipRateLimit.resetTime
        },
        { status: 429 }
      )
    }

    const body = await request.json()
    
    // Валидируем данные
    const validationResult = requestPasswordResetSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Неверные данные',
          details: validationResult.error.issues
        },
        { status: 400 }
      )
    }

    const { email } = validationResult.data

    // Проверяем rate limit для email
    const emailRateLimit = await RateLimiter.checkEmailLimit(email, 'password_reset', {
      windowMs: 3600000, // 1 час
      maxAttempts: 2
    })
    
    if (!emailRateLimit.allowed) {
      return NextResponse.json(
        { 
          error: 'Слишком много попыток сброса пароля с этого email. Попробуйте позже.',
          resetTime: emailRateLimit.resetTime
        },
        { status: 429 }
      )
    }

    // Ищем пользователя
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        profile: true
      }
    })

    if (!user) {
      // Не раскрываем, что пользователь не существует
      return NextResponse.json(
        { 
          message: 'Если аккаунт с таким email существует, мы отправили письмо со ссылкой на сброс.' 
        },
        { status: 200 }
      )
    }

    // Проверяем статус пользователя
    if (user.status === 'DISABLED') {
      return NextResponse.json(
        { 
          message: 'Если аккаунт с таким email существует, мы отправили письмо со ссылкой на сброс.' 
        },
        { status: 200 }
      )
    }

    // Удаляем старые токены сброса пароля для этого пользователя
    await prisma.passwordReset.deleteMany({
      where: { 
        userId: user.id,
        expiresAt: { lt: new Date() }
      }
    })

    // Создаем новый токен для сброса пароля
    const resetToken = JWTManager.createVerificationToken()
    const expiresAt = new Date(Date.now() + 3600000) // 1 час

    await prisma.passwordReset.create({
      data: {
        userId: user.id,
        token: resetToken,
        expiresAt
      }
    })

    // Отправляем email для сброса пароля
    const emailTemplate = emailService.createPasswordResetTemplate(
      email,
      resetToken,
      user.profile?.fullName || undefined
    )
    
    const emailSent = await emailService.sendEmail(email, emailTemplate)

    // Логируем событие запроса сброса пароля
    await prisma.securityEvent.create({
      data: {
        userId: user.id,
        type: 'PASSWORD_RESET_REQUEST',
        ip,
        userAgent: request.headers.get('user-agent') || undefined,
        metadata: JSON.stringify({ email, emailSent })
      }
    })

    return NextResponse.json(
      { 
        message: 'Если аккаунт с таким email существует, мы отправили письмо со ссылкой на сброс.',
        emailSent
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Password reset request error:', error)
    
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
