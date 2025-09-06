import { NextRequest, NextResponse } from 'next/server'
import { EmailService } from '../../../../lib/email/emailService'

export async function POST(request: NextRequest) {
  try {
    const emailService = new EmailService()
    
    // Проверяем соединение
    const isConnected = await emailService.verifyConnection()
    
    if (isConnected) {
      return NextResponse.json({
        success: true,
        message: 'Email service is configured and working correctly'
      })
    } else {
      return NextResponse.json({
        success: false,
        message: 'Email service connection failed. Please check your SMTP settings.',
        instructions: [
          '1. Verify SMTP_USER and SMTP_PASS environment variables are set',
          '2. For Gmail: Use App Password, not regular password',
          '3. Enable 2FA on your email account',
          '4. Check SMTP_HOST and SMTP_PORT settings'
        ]
      }, { status: 400 })
    }
  } catch (error) {
    console.error('Email test error:', error)
    
    return NextResponse.json({
      success: false,
      message: 'Email service test failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Email service test endpoint',
    usage: 'Send POST request to test email connection'
  })
}