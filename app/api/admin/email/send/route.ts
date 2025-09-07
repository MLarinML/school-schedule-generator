import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { JWTManager } from '../../../../../lib/auth/jwt'
import { EmailService } from '../../../../../lib/email/emailService'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
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

    const { to, subject, message } = await request.json()

    if (!to || !subject || !message) {
      return NextResponse.json({ error: 'Заполните все поля' }, { status: 400 })
    }

    // Отправляем email
    const emailService = new EmailService()
    
    await emailService.sendEmail(to, {
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">${subject}</h2>
          <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            ${message.replace(/\n/g, '<br>')}
          </div>
          <p style="color: #666; font-size: 14px;">
            Это тестовое сообщение, отправленное из админ-панели.
          </p>
        </div>
      `,
      text: message
    })

    return NextResponse.json({ message: 'Email отправлен успешно' })

  } catch (error) {
    console.error('Ошибка отправки email:', error)
    return NextResponse.json(
      { error: 'Ошибка отправки email' },
      { status: 500 }
    )
  }
}
