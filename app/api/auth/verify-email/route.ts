import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { verifyEmailSchema } from '../../../../lib/validation/auth'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Валидируем данные
    const validationResult = verifyEmailSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Неверные данные',
          details: validationResult.error.issues
        },
        { status: 400 }
      )
    }

    const { token } = validationResult.data

    // Получаем IP адрес
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'

    // Ищем токен верификации
    const verification = await prisma.emailVerification.findUnique({
      where: { token },
      include: {
        user: true
      }
    })

    if (!verification) {
      return NextResponse.json(
        { error: 'Ссылка недействительна или истекла' },
        { status: 400 }
      )
    }

    // Проверяем, не истек ли токен
    if (verification.expiresAt < new Date()) {
      // Удаляем истекший токен
      await prisma.emailVerification.delete({
        where: { id: verification.id }
      })

      return NextResponse.json(
        { error: 'Ссылка недействительна или истекла' },
        { status: 400 }
      )
    }

    // Проверяем, не использован ли уже токен
    if (verification.usedAt) {
      return NextResponse.json(
        { error: 'Ссылка уже была использована' },
        { status: 400 }
      )
    }

    // Проверяем, не подтвержден ли уже email
    if (verification.user.isEmailVerified) {
      // Помечаем токен как использованный
      await prisma.emailVerification.update({
        where: { id: verification.id },
        data: { usedAt: new Date() }
      })

      return NextResponse.json(
        { message: 'Email уже подтвержден' },
        { status: 200 }
      )
    }

    // Подтверждаем email в транзакции
    await prisma.$transaction(async (tx) => {
      // Обновляем статус пользователя
      await tx.user.update({
        where: { id: verification.userId },
        data: { 
          isEmailVerified: true,
          status: 'ACTIVE'
        }
      })

      // Помечаем токен как использованный
      await tx.emailVerification.update({
        where: { id: verification.id },
        data: { usedAt: new Date() }
      })
    })

    // Логируем событие подтверждения email
    await prisma.securityEvent.create({
      data: {
        userId: verification.userId,
        type: 'EMAIL_VERIFY',
        ip,
        userAgent: request.headers.get('user-agent') || undefined,
        metadata: JSON.stringify({ 
          email: verification.user.email,
          verificationId: verification.id
        })
      }
    })

    return NextResponse.json(
      { 
        message: 'Email адрес подтвержден успешно',
        user: {
          id: verification.user.id,
          email: verification.user.email,
          isEmailVerified: true
        }
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Email verification error:', error)
    
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

    // Ищем токен верификации
    const verification = await prisma.emailVerification.findUnique({
      where: { token },
      include: {
        user: true
      }
    })

    if (!verification) {
      return NextResponse.json(
        { error: 'Ссылка недействительна или истекла' },
        { status: 400 }
      )
    }

    // Проверяем, не истек ли токен
    if (verification.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Ссылка недействительна или истекла' },
        { status: 400 }
      )
    }

    // Проверяем, не использован ли уже токен
    if (verification.usedAt) {
      return NextResponse.json(
        { error: 'Ссылка уже была использована' },
        { status: 400 }
      )
    }

    // Проверяем, не подтвержден ли уже email
    if (verification.user.isEmailVerified) {
      return NextResponse.json(
        { error: 'Email уже подтвержден' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { 
        message: 'Токен валиден',
        user: {
          id: verification.user.id,
          email: verification.user.email,
          isEmailVerified: false
        }
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Email verification check error:', error)
    
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
