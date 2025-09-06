import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { PasswordManager } from '../../../../lib/auth/password'
import { EmailService } from '../../../../lib/email/emailService'
import { RateLimiter } from '../../../../lib/rate-limit/rateLimiter'
import { registerSchema } from '../../../../lib/validation/auth'
import { JWTManager } from '../../../../lib/auth/jwt'

const prisma = new PrismaClient()
const emailService = new EmailService()

export async function POST(request: NextRequest) {
  try {
    // Получаем IP адрес для rate limiting
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    
    // Проверяем rate limit для IP
    const ipRateLimit = await RateLimiter.checkIPLimit(ip, 'register', {
      windowMs: 900000, // 15 минут
      maxAttempts: 3
    })
    
    if (!ipRateLimit.allowed) {
      return NextResponse.json(
        { 
          error: 'Слишком много попыток регистрации. Попробуйте позже.',
          resetTime: ipRateLimit.resetTime
        },
        { status: 429 }
      )
    }

    const body = await request.json()
    
    // Валидируем данные
    const validationResult = registerSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Неверные данные',
          details: validationResult.error.issues
        },
        { status: 400 }
      )
    }

    const { email, password, firstName, lastName } = validationResult.data

    // Проверяем rate limit для email
    const emailRateLimit = await RateLimiter.checkEmailLimit(email, 'register', {
      windowMs: 3600000, // 1 час
      maxAttempts: 2
    })
    
    if (!emailRateLimit.allowed) {
      return NextResponse.json(
        { 
          error: 'Слишком много попыток регистрации с этого email. Попробуйте позже.',
          resetTime: emailRateLimit.resetTime
        },
        { status: 429 }
      )
    }

    // Проверяем, существует ли пользователь
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      // Не раскрываем, что пользователь существует
      return NextResponse.json(
        { 
          message: 'Если аккаунт с таким email не существует, мы отправили письмо для подтверждения.' 
        },
        { status: 200 }
      )
    }

    // Валидируем пароль
    const passwordValidation = PasswordManager.validatePassword(password)
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { 
          error: 'Пароль не соответствует требованиям безопасности',
          details: passwordValidation.errors
        },
        { status: 400 }
      )
    }

    // Хэшируем пароль
    const passwordHash = await PasswordManager.hashPassword(password)

    // Создаем пользователя в транзакции
    const result = await prisma.$transaction(async (tx) => {
      // Создаем пользователя
      const user = await tx.user.create({
        data: {
          email,
          passwordHash,
          passwordAlgo: 'bcrypt',
          status: 'PENDING_VERIFICATION'
        }
      })

      // Создаем профиль
      await tx.userProfile.create({
        data: {
          userId: user.id,
          fullName: `${firstName} ${lastName}`,
          locale: 'ru',
          timezone: 'Europe/Moscow'
        }
      })

      // Назначаем роль viewer по умолчанию
      const viewerRole = await tx.role.findUnique({
        where: { name: 'viewer' }
      })

      if (viewerRole) {
        await tx.userRole.create({
          data: {
            userId: user.id,
            roleId: viewerRole.id
          }
        })
      }

      // Создаем токен для верификации email
      const verificationToken = JWTManager.createVerificationToken()
      const expiresAt = new Date(Date.now() + 3600000) // 1 час

      await tx.emailVerification.create({
        data: {
          userId: user.id,
          token: verificationToken,
          expiresAt
        }
      })

      return { user, verificationToken }
    })

    // Отправляем email для подтверждения
    const emailTemplate = emailService.createEmailVerificationTemplate(
      email,
      result.verificationToken
    )
    
    const emailSent = await emailService.sendEmail(email, emailTemplate)

    // Логируем событие
    await prisma.securityEvent.create({
      data: {
        userId: result.user.id,
        type: 'EMAIL_VERIFY',
        ip,
        userAgent: request.headers.get('user-agent') || undefined,
        metadata: JSON.stringify({ email, emailSent })
      }
    })

    // Сбрасываем rate limit для успешной регистрации
    await RateLimiter.resetLimit(`ip:register:${ip}`)
    await RateLimiter.resetLimit(`email:register:${email}`)

    return NextResponse.json(
      { 
        message: 'Если аккаунт с таким email не существует, мы отправили письмо для подтверждения.',
        emailSent
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Registration error:', error)
    
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
