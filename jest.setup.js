// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Mock environment variables
process.env.JWT_SECRET = 'test-jwt-secret'
process.env.PASSWORD_PEPPER = 'test-pepper'
process.env.SESSION_SECRET = 'test-session-secret'
process.env.PASSWORD_MIN_LENGTH = '10'
process.env.SESSION_EXPIRY = '86400000'
process.env.EMAIL_VERIFICATION_EXPIRY = '3600000'
process.env.PASSWORD_RESET_EXPIRY = '3600000'
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000'
process.env.NEXT_PUBLIC_APP_NAME = 'Генератор школьных расписаний'
process.env.SMTP_HOST = 'smtp.test.com'
process.env.SMTP_PORT = '587'
process.env.SMTP_USER = 'test@test.com'
process.env.SMTP_PASS = 'test-password'
process.env.SMTP_FROM = 'noreply@test.com'
process.env.RATE_LIMIT_WINDOW = '3600000'
process.env.RATE_LIMIT_MAX_ATTEMPTS = '50'

