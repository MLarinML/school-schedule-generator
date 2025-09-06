import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { PasswordManager } from '../../../../lib/auth/password'
import { EmailService } from '../../../../lib/email/emailService'
import { resetPasswordSchema } from '../../../../lib/validation/auth'

const prisma = new PrismaClient()
const emailService = new EmailService()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Валидируем данные
    const validationResult = resetPasswordSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Неверные данные',
          details: validationResult.error.issues
        },
        { status: 400 }
      )
    }

    const { token, password } = validationResult.data

    // Получаем IP адрес
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'

    // Ищем токен сброса пароля
    const passwordReset = await prisma.passwordReset.findUnique({
      where: { token },
      include: {
        user: {
          include: {
            profile: true
          }
        }
      }
    })

    if (!passwordReset) {
      return NextResponse.json(
        { error: 'Ссылка недействительна или истекла' },
        { status: 400 }
      )
    }

    // Проверяем, не истек ли токен
    if (passwordReset.expiresAt < new Date()) {
      // Удаляем истекший токен
      await prisma.passwordReset.delete({
        where: { id: passwordReset.id }
      })

      return NextResponse.json(
        { error: 'Ссылка недействительна или истекла' },
        { status: 400 }
      )
    }

    // Проверяем, не использован ли уже токен
    if (passwordReset.usedAt) {
      return NextResponse.json(
        { error: 'Ссылка уже была использована' },
        { status: 400 }
      )
    }

    // Валидируем новый пароль
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

    // Хэшируем новый пароль
    const newPasswordHash = await PasswordManager.hashPassword(password)

    // Выполняем сброс пароля в транзакции
    await prisma.$transaction(async (tx) => {
      // Обновляем пароль пользователя
      await tx.user.update({
        where: { id: passwordReset.userId },
        data: { 
          passwordHash: newPasswordHash,
          passwordAlgo: 'bcrypt',
          passwordUpdatedAt: new Date()
        }
      })

      // Помечаем токен как использованный
      await tx.passwordReset.update({
        where: { id: passwordReset.id },
        data: { usedAt: new Date() }
      })

      // Отзываем все активные сессии пользователя
      await tx.session.updateMany({
        where: { 
          userId: passwordReset.userId,
          isRevoked: false
        },
        data: { 
          isRevoked: true,
          lastSeenAt: new Date()
        }
      })
    })

    // Отправляем уведомление об изменении пароля
    const emailTemplate = emailService.createPasswordChangeNotificationTemplate(
      passwordReset.user.email,
      passwordReset.user.profile?.fullName || undefined
    )
    
    await emailService.sendEmail(passwordReset.user.email, emailTemplate)

    // Логируем событие смены пароля
    await prisma.securityEvent.create({
      data: {
        userId: passwordReset.userId,
        type: 'PASSWORD_CHANGE',
        ip,
        userAgent: request.headers.get('user-agent') || undefined,
        metadata: JSON.stringify({ 
          email: passwordReset.user.email,
          resetId: passwordReset.id,
          reason: 'password_reset'
        })
      }
    })

    return NextResponse.json(
      { 
        message: 'Пароль успешно изменен. Все активные сессии завершены для безопасности.',
        user: {
          id: passwordReset.user.id,
          email: passwordReset.user.email
        }
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Password reset error:', error)
    
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { error: 'Токен не указан' },
        { status: 400 }
      )
    }

    // Ищем токен сброса пароля
    const passwordReset = await prisma.passwordReset.findUnique({
      where: { token },
      include: {
        user: {
          include: {
            profile: true
          }
        }
      }
    })

    if (!passwordReset) {
      return NextResponse.json(
        { error: 'Ссылка недействительна или истекла' },
        { status: 400 }
      )
    }

    // Проверяем, не истек ли токен
    if (passwordReset.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Ссылка недействительна или истекла' },
        { status: 400 }
      )
    }

    // Проверяем, не использован ли уже токен
    if (passwordReset.usedAt) {
      return NextResponse.json(
        { error: 'Ссылка уже была использована' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { 
        message: 'Токен валиден',
        user: {
          id: passwordReset.user.id,
          email: passwordReset.user.email,
          fullName: passwordReset.user.profile?.fullName
        }
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Password reset check error:', error)
    
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
