import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { PasswordManager } from '../../../../lib/auth/password'
import { RateLimiter } from '../../../../lib/rate-limit/rateLimiter'
import { loginSchema } from '../../../../lib/validation/auth'
import { JWTManager } from '../../../../lib/auth/jwt'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    // Получаем IP адрес для rate limiting
    const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown'
    
    // Проверяем rate limit для IP
    const ipRateLimit = await RateLimiter.checkIPLimit(ip, 'login', {
      windowMs: 900000, // 15 минут
      maxAttempts: 5
    })
    
    if (!ipRateLimit.allowed) {
      return NextResponse.json(
        { 
          error: 'Слишком много попыток входа. Попробуйте позже.',
          resetTime: ipRateLimit.resetTime,
          blocked: true
        },
        { status: 429 }
      )
    }

    const body = await request.json()
    
    // Валидируем данные
    const validationResult = loginSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Неверные данные',
          details: validationResult.error.issues
        },
        { status: 400 }
      )
    }

    const { email, password, rememberMe } = validationResult.data

    // Проверяем rate limit для email
    const emailRateLimit = await RateLimiter.checkEmailLimit(email, 'login', {
      windowMs: 900000, // 15 минут
      maxAttempts: 3
    })
    
    if (!emailRateLimit.allowed) {
      return NextResponse.json(
        { 
          error: 'Слишком много попыток входа с этого email. Попробуйте позже.',
          resetTime: emailRateLimit.resetTime,
          blocked: true
        },
        { status: 429 }
      )
    }

    // Ищем пользователя
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        profile: true,
        roles: {
          include: {
            role: true
          }
        }
      }
    })

    if (!user) {
      // Логируем неудачную попытку входа
      await prisma.securityEvent.create({
        data: {
          type: 'LOGIN_FAIL',
          ip,
          userAgent: request.headers.get('user-agent') || undefined,
          metadata: JSON.stringify({ email, reason: 'user_not_found' })
        }
      })

      return NextResponse.json(
        { error: 'Неверный email или пароль' },
        { status: 401 }
      )
    }

    // Проверяем статус пользователя
    if (user.status === 'DISABLED') {
      await prisma.securityEvent.create({
        data: {
          userId: user.id,
          type: 'ACCOUNT_LOCKED',
          ip,
          userAgent: request.headers.get('user-agent') || undefined,
          metadata: JSON.stringify({ email, reason: 'account_disabled' })
        }
      })

      return NextResponse.json(
        { error: 'Аккаунт заблокирован. Обратитесь в поддержку.' },
        { status: 403 }
      )
    }

    if (user.status === 'PENDING_VERIFICATION') {
      await prisma.securityEvent.create({
        data: {
          userId: user.id,
          type: 'LOGIN_FAIL',
          ip,
          userAgent: request.headers.get('user-agent') || undefined,
          metadata: JSON.stringify({ email, reason: 'email_not_verified' })
        }
      })

      return NextResponse.json(
        { error: 'Подтвердите email адрес перед входом' },
        { status: 403 }
      )
    }

    // Проверяем пароль
    const isPasswordValid = await PasswordManager.verifyPassword(password, user.passwordHash)
    
    if (!isPasswordValid) {
      // Логируем неудачную попытку входа
      await prisma.securityEvent.create({
        data: {
          userId: user.id,
          type: 'LOGIN_FAIL',
          ip,
          userAgent: request.headers.get('user-agent') || undefined,
          metadata: JSON.stringify({ email, reason: 'invalid_password' })
        }
      })

      return NextResponse.json(
        { error: 'Неверный email или пароль' },
        { status: 401 }
      )
    }

    // Создаем сессию
    const sessionExpiry = rememberMe 
      ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 дней
      : new Date(Date.now() + 24 * 60 * 60 * 1000) // 1 день

    const session = await prisma.session.create({
      data: {
        userId: user.id,
        expiresAt: sessionExpiry,
        ip,
        userAgent: request.headers.get('user-agent') || undefined
      }
    })

    // Обновляем время последнего входа
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    })

    // Создаем JWT токен
    const roles = user.roles.map(ur => ur.role.name)
    const token = JWTManager.createSessionToken({
      id: session.id,
      userId: user.id,
      email: user.email,
      roles,
      ip,
      userAgent: request.headers.get('user-agent') || undefined
    })

    // Логируем успешный вход
    await prisma.securityEvent.create({
      data: {
        userId: user.id,
        type: 'LOGIN_SUCCESS',
        ip,
        userAgent: request.headers.get('user-agent') || undefined,
        metadata: JSON.stringify({ email, sessionId: session.id })
      }
    })

    // Сбрасываем rate limit для успешного входа
    await RateLimiter.resetLimit(`ip:login:${ip}`)
    await RateLimiter.resetLimit(`email:login:${email}`)

    // Устанавливаем cookie
    const response = NextResponse.json({
      message: 'Вход выполнен успешно',
      user: {
        id: user.id,
        email: user.email,
        fullName: user.profile?.fullName,
        roles,
        isEmailVerified: user.isEmailVerified
      }
    })

    // Устанавливаем HTTP-only cookie с токеном
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: sessionExpiry,
      path: '/'
    })

    return response

  } catch (error) {
    console.error('Login error:', error)
    
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
