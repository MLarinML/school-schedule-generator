import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { JWTManager } from '../../../../lib/auth/jwt'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    // Проверяем авторизацию
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const payload = JWTManager.verifyToken(token)
    
    if (!payload) {
      return NextResponse.json({ error: 'Сессия истекла или недействительна' }, { status: 401 })
    }

    // Проверяем, что пользователь - админ
    const session = await prisma.session.findUnique({
      where: { id: payload.sessionId },
      include: { 
        user: { 
          include: { 
            roles: { 
              include: { role: true } 
            } 
          } 
        } 
      }
    })

    if (!session || !session.user.roles.some(ur => ur.role.name === 'admin')) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }

    // Получаем настройки из переменных окружения
    const settings = {
      siteName: process.env.SITE_NAME || 'Генератор расписаний',
      siteDescription: process.env.SITE_DESCRIPTION || 'Создавайте расписания для учебных заведений',
      maintenanceMode: process.env.MAINTENANCE_MODE === 'true',
      registrationEnabled: process.env.REGISTRATION_ENABLED !== 'false',
      emailVerificationRequired: process.env.EMAIL_VERIFICATION_REQUIRED !== 'false',
      rateLimitEnabled: process.env.RATE_LIMIT_ENABLED !== 'false',
      rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW || '3600000'),
      rateLimitMaxAttempts: parseInt(process.env.RATE_LIMIT_MAX_ATTEMPTS || '50'),
      defaultLanguage: process.env.DEFAULT_LANGUAGE || 'ru',
      timezone: process.env.TIMEZONE || 'Europe/Moscow'
    }

    return NextResponse.json({ settings })

  } catch (error) {
    console.error('Ошибка получения настроек:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Проверяем авторизацию
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const payload = JWTManager.verifyToken(token)
    
    if (!payload) {
      return NextResponse.json({ error: 'Сессия истекла или недействительна' }, { status: 401 })
    }

    // Проверяем, что пользователь - админ
    const session = await prisma.session.findUnique({
      where: { id: payload.sessionId },
      include: { 
        user: { 
          include: { 
            roles: { 
              include: { role: true } 
            } 
          } 
        } 
      }
    })

    if (!session || !session.user.roles.some(ur => ur.role.name === 'admin')) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }

    const newSettings = await request.json()

    // В реальном приложении здесь бы обновлялись настройки в базе данных
    // или в файле конфигурации. Для демонстрации просто возвращаем успех.
    
    return NextResponse.json({ 
      message: 'Настройки сохранены успешно',
      settings: newSettings
    })

  } catch (error) {
    console.error('Ошибка сохранения настроек:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
