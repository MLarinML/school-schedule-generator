import nodemailer from 'nodemailer'
import { JWTManager } from '../auth/jwt'

export interface EmailConfig {
  host: string
  port: number
  secure: boolean
  user: string
  pass: string
  from: string
}

export interface EmailProvider {
  name: string
  host: string
  port: number
  secure: boolean
  requiresAuth: boolean
  description: string
  instructions: string[]
}

export interface EmailTemplate {
  subject: string
  html: string
  text: string
}

export class EmailService {
  private transporter: nodemailer.Transporter
  private config: EmailConfig

  // Популярные почтовые провайдеры
  static readonly EMAIL_PROVIDERS: EmailProvider[] = [
    {
      name: 'Gmail',
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      requiresAuth: true,
      description: 'Google Gmail - популярный почтовый сервис',
      instructions: [
        'Включите двухфакторную аутентификацию в настройках Google',
        'Создайте пароль приложения в разделе "Безопасность"',
        'Используйте пароль приложения, НЕ обычный пароль от Gmail'
      ]
    },
    {
      name: 'Yandex',
      host: 'smtp.yandex.ru',
      port: 465,
      secure: true,
      requiresAuth: true,
      description: 'Яндекс.Почта - российский почтовый сервис',
      instructions: [
        'Включите двухфакторную аутентификацию в настройках Яндекса',
        'Создайте пароль приложения в разделе "Безопасность"',
        'Используйте пароль приложения, НЕ обычный пароль от Яндекса'
      ]
    },
    {
      name: 'Mail.ru',
      host: 'smtp.mail.ru',
      port: 465,
      secure: true,
      requiresAuth: true,
      description: 'Mail.ru - популярный российский почтовый сервис',
      instructions: [
        'Включите двухфакторную аутентификацию в настройках Mail.ru',
        'Создайте пароль приложения в разделе "Безопасность"',
        'Используйте пароль приложения, НЕ обычный пароль от Mail.ru'
      ]
    },
    {
      name: 'Outlook/Hotmail',
      host: 'smtp-mail.outlook.com',
      port: 587,
      secure: false,
      requiresAuth: true,
      description: 'Microsoft Outlook/Hotmail - корпоративный почтовый сервис',
      instructions: [
        'Включите двухфакторную аутентификацию в настройках Microsoft',
        'Создайте пароль приложения в разделе "Безопасность"',
        'Используйте пароль приложения, НЕ обычный пароль от Outlook'
      ]
    }
  ]

  constructor() {
    this.config = {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
      from: process.env.SMTP_FROM || 'noreply@raspisanie.ru'
    }

    // Проверяем, что все необходимые переменные окружения установлены
    if (!this.config.user || !this.config.pass) {
      console.warn('Email service: SMTP credentials not configured. Email functionality will be disabled.')
      console.warn('Please set SMTP_USER and SMTP_PASS environment variables.')
    }

    this.transporter = nodemailer.createTransport({
      host: this.config.host,
      port: this.config.port,
      secure: this.config.secure,
      auth: this.config.user && this.config.pass ? {
        user: this.config.user,
        pass: this.config.pass
      } : undefined,
      // Добавляем дополнительные настройки для Gmail
      tls: {
        rejectUnauthorized: false
      }
    })
  }

  /**
   * Отправляет email
   */
  async sendEmail(to: string, template: EmailTemplate): Promise<boolean> {
    try {
      // Проверяем, что email сервис настроен
      if (!this.config.user || !this.config.pass) {
        console.error('Email service not configured. Cannot send email.')
        return false
      }

      const mailOptions = {
        from: this.config.from,
        to,
        subject: template.subject,
        html: template.html,
        text: template.text
      }

      await this.transporter.sendMail(mailOptions)
      console.log(`Email sent successfully to ${to}`)
      return true
    } catch (error) {
      console.error('Failed to send email:', error)
      
      // Дополнительная информация об ошибке для отладки
      if (error instanceof Error) {
        if (error.message.includes('535-5.7.8')) {
          console.error('Gmail authentication failed. Please check your App Password.')
          console.error('Instructions: https://support.google.com/accounts/answer/185833')
        } else if (error.message.includes('EAUTH')) {
          console.error('SMTP authentication failed. Please check your credentials.')
        }
      }
      
      return false
    }
  }

  /**
   * Создает шаблон для подтверждения email
   */
  createEmailVerificationTemplate(
    email: string,
    token: string,
    fullName?: string
  ): EmailTemplate {
    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify-email?token=${token}`
    const appName = process.env.NEXT_PUBLIC_APP_NAME || 'Генератор школьных расписаний'

    return {
      subject: `Подтвердите ваш email - ${appName}`,
      html: `
        <!DOCTYPE html>
        <html lang="ru">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Подтверждение email</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; text-align: center;">
            <h1 style="color: #2563eb; margin-bottom: 20px;">${appName}</h1>
            <h2 style="color: #1f2937; margin-bottom: 20px;">Подтвердите ваш email адрес</h2>
            
            <p style="font-size: 16px; margin-bottom: 20px;">
              Здравствуйте${fullName ? `, ${fullName}` : ''}!
            </p>
            
            <p style="font-size: 16px; margin-bottom: 20px;">
              Для завершения регистрации в сервисе "${appName}" подтвердите ваш email адрес:
              <strong>${email}</strong>
            </p>
            
            <div style="margin: 30px 0;">
              <a href="${verificationUrl}" 
                 style="background: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: bold; display: inline-block;">
                Подтвердить email
              </a>
            </div>
            
            <p style="font-size: 14px; color: #6b7280; margin-bottom: 20px;">
              Если кнопка не работает, скопируйте эту ссылку в браузер:
            </p>
            
            <p style="font-size: 14px; color: #6b7280; word-break: break-all; background: #f3f4f6; padding: 15px; border-radius: 5px;">
              ${verificationUrl}
            </p>
            
            <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
              Ссылка действительна 60 минут. Если вы не регистрировались в сервисе, 
              просто проигнорируйте это письмо.
            </p>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            <p style="font-size: 12px; color: #9ca3af; text-align: center;">
              © 2024 ${appName}. Все права защищены.
            </p>
          </div>
        </body>
        </html>
      `,
      text: `
        ${appName}
        
        Подтвердите ваш email адрес
        
        Здравствуйте${fullName ? `, ${fullName}` : ''}!
        
        Для завершения регистрации в сервисе "${appName}" подтвердите ваш email адрес: ${email}
        
        Перейдите по ссылке для подтверждения:
        ${verificationUrl}
        
        Ссылка действительна 60 минут. Если вы не регистрировались в сервисе, просто проигнорируйте это письмо.
        
        © 2024 ${appName}. Все права защищены.
      `
    }
  }

  /**
   * Создает шаблон для сброса пароля
   */
  createPasswordResetTemplate(
    email: string,
    token: string,
    fullName?: string
  ): EmailTemplate {
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${token}`
    const appName = process.env.NEXT_PUBLIC_APP_NAME || 'Генератор школьных расписаний'

    return {
      subject: `Сброс пароля - ${appName}`,
      html: `
        <!DOCTYPE html>
        <html lang="ru">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Сброс пароля</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; text-align: center;">
            <h1 style="color: #dc2626; margin-bottom: 20px;">${appName}</h1>
            <h2 style="color: #1f2937; margin-bottom: 20px;">Сброс пароля</h2>
            
            <p style="font-size: 16px; margin-bottom: 20px;">
              Здравствуйте${fullName ? `, ${fullName}` : ''}!
            </p>
            
            <p style="font-size: 16px; margin-bottom: 20px;">
              Мы получили запрос на сброс пароля для вашего аккаунта:
              <strong>${email}</strong>
            </p>
            
            <div style="margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background: #dc2626; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: bold; display: inline-block;">
                Сбросить пароль
              </a>
            </div>
            
            <p style="font-size: 14px; color: #6b7280; margin-bottom: 20px;">
              Если кнопка не работает, скопируйте эту ссылку в браузер:
            </p>
            
            <p style="font-size: 14px; color: #6b7280; word-break: break-all; background: #f3f4f6; padding: 15px; border-radius: 5px;">
              ${resetUrl}
            </p>
            
            <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
              Ссылка действительна 60 минут. Если вы не запрашивали сброс пароля, 
              просто проигнорируйте это письмо.
            </p>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            <p style="font-size: 12px; color: #9ca3af; text-align: center;">
              © 2024 ${appName}. Все права защищены.
            </p>
          </div>
        </body>
        </html>
      `,
      text: `
        ${appName}
        
        Сброс пароля
        
        Здравствуйте${fullName ? `, ${fullName}` : ''}!
        
        Мы получили запрос на сброс пароля для вашего аккаунта: ${email}
        
        Перейдите по ссылке для сброса пароля:
        ${resetUrl}
        
        Ссылка действительна 60 минут. Если вы не запрашивали сброс пароля, просто проигнорируйте это письмо.
        
        © 2024 ${appName}. Все права защищены.
      `
    }
  }

  /**
   * Создает шаблон уведомления о смене пароля
   */
  createPasswordChangeNotificationTemplate(
    email: string,
    fullName?: string
  ): EmailTemplate {
    const appName = process.env.NEXT_PUBLIC_APP_NAME || 'Генератор школьных расписаний'
    const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/login`

    return {
      subject: `Пароль изменен - ${appName}`,
      html: `
        <!DOCTYPE html>
        <html lang="ru">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Пароль изменен</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; text-align: center;">
            <h1 style="color: #059669; margin-bottom: 20px;">${appName}</h1>
            <h2 style="color: #1f2937; margin-bottom: 20px;">Пароль успешно изменен</h2>
            
            <p style="font-size: 16px; margin-bottom: 20px;">
              Здравствуйте${fullName ? `, ${fullName}` : ''}!
            </p>
            
            <p style="font-size: 16px; margin-bottom: 20px;">
              Пароль для вашего аккаунта <strong>${email}</strong> был успешно изменен.
            </p>
            
            <div style="background: #d1fae5; border: 1px solid #10b981; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <p style="margin: 0; color: #065f46; font-weight: bold;">
                🔒 В целях безопасности все активные сессии были завершены.
              </p>
            </div>
            
            <p style="font-size: 16px; margin-bottom: 20px;">
              Если это были вы, можете войти в аккаунт с новым паролем.
            </p>
            
            <div style="margin: 30px 0;">
              <a href="${loginUrl}" 
                 style="background: #059669; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: bold; display: inline-block;">
                Войти в аккаунт
              </a>
            </div>
            
            <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
              Если вы не изменяли пароль, немедленно свяжитесь с поддержкой.
            </p>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            <p style="font-size: 12px; color: #9ca3af; text-align: center;">
              © 2024 ${appName}. Все права защищены.
            </p>
          </div>
        </body>
        </html>
      `,
      text: `
        ${appName}
        
        Пароль успешно изменен
        
        Здравствуйте${fullName ? `, ${fullName}` : ''}!
        
        Пароль для вашего аккаунта ${email} был успешно изменен.
        
        🔒 В целях безопасности все активные сессии были завершены.
        
        Если это были вы, можете войти в аккаунт с новым паролем по ссылке:
        ${loginUrl}
        
        Если вы не изменяли пароль, немедленно свяжитесь с поддержкой.
        
        © 2024 ${appName}. Все права защищены.
      `
    }
  }

  /**
   * Проверяет подключение к SMTP серверу
   */
  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify()
      return true
    } catch (error) {
      console.error('SMTP connection failed:', error)
      return false
    }
  }

  /**
   * Получает настройки для конкретного провайдера по email
   */
  static getProviderByEmail(email: string): EmailProvider | null {
    const domain = email.split('@')[1]?.toLowerCase()
    
    if (!domain) return null

    if (domain.includes('gmail.com') || domain.includes('googlemail.com')) {
      return this.EMAIL_PROVIDERS.find(p => p.name === 'Gmail') || null
    }
    
    if (domain.includes('yandex.ru') || domain.includes('ya.ru')) {
      return this.EMAIL_PROVIDERS.find(p => p.name === 'Yandex') || null
    }
    
    if (domain.includes('mail.ru') || domain.includes('inbox.ru') || domain.includes('bk.ru')) {
      return this.EMAIL_PROVIDERS.find(p => p.name === 'Mail.ru') || null
    }
    
    if (domain.includes('outlook.com') || domain.includes('hotmail.com') || domain.includes('live.com')) {
      return this.EMAIL_PROVIDERS.find(p => p.name === 'Outlook/Hotmail') || null
    }
    
    return null
  }

  /**
   * Создает конфигурацию для конкретного провайдера
   */
  static createProviderConfig(provider: EmailProvider, user: string, pass: string): EmailConfig {
    return {
      host: provider.host,
      port: provider.port,
      secure: provider.secure,
      user,
      pass,
      from: user
    }
  }

  /**
   * Обновляет конфигурацию транспорта
   */
  updateConfig(newConfig: EmailConfig): void {
    this.config = { ...this.config, ...newConfig }
    
    this.transporter = nodemailer.createTransport({
      host: this.config.host,
      port: this.config.port,
      secure: this.config.secure,
      auth: {
        user: this.config.user,
        pass: this.config.pass
      }
    })
  }
}
