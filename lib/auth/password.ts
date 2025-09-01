import bcrypt from 'bcryptjs'

const SALT_ROUNDS = 12

export interface PasswordValidationResult {
  isValid: boolean
  errors: string[]
}

export class PasswordManager {
  private static pepper = process.env.PASSWORD_PEPPER || 'default-pepper'

  /**
   * Хэширует пароль с солью и перцем
   */
  static async hashPassword(password: string): Promise<string> {
    const pepperedPassword = password + this.pepper
    return bcrypt.hash(pepperedPassword, SALT_ROUNDS)
  }

  /**
   * Проверяет пароль
   */
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    const pepperedPassword = password + this.pepper
    return bcrypt.compare(pepperedPassword, hash)
  }

  /**
   * Валидирует пароль по политике безопасности
   */
  static validatePassword(password: string): PasswordValidationResult {
    const errors: string[] = []
    const minLength = parseInt(process.env.PASSWORD_MIN_LENGTH || '10')

    if (password.length < minLength) {
      errors.push(`Пароль должен содержать не менее ${minLength} символов`)
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Пароль должен содержать хотя бы одну заглавную букву')
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Пароль должен содержать хотя бы одну строчную букву')
    }

    if (!/\d/.test(password)) {
      errors.push('Пароль должен содержать хотя бы одну цифру')
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Пароль должен содержать хотя бы один специальный символ')
    }

    // Проверка на частые пароли (базовый список)
    const commonPasswords = [
      'password', '123456', 'qwerty', 'admin', 'letmein',
      'welcome', 'monkey', 'dragon', 'master', 'hello'
    ]
    
    if (commonPasswords.includes(password.toLowerCase())) {
      errors.push('Пароль слишком простой, выберите другой')
    }

    // Проверка на повторяющиеся символы
    if (/(.)\1{2,}/.test(password)) {
      errors.push('Пароль не должен содержать повторяющиеся символы подряд')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Генерирует случайный пароль
   */
  static generateSecurePassword(length: number = 16): string {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
    let password = ''
    
    // Гарантируем наличие всех типов символов
    password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]
    password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]
    password += '0123456789'[Math.floor(Math.random() * 10)]
    password += '!@#$%^&*'[Math.floor(Math.random() * 8)]
    
    // Дополняем до нужной длины
    for (let i = password.length; i < length; i++) {
      password += charset[Math.floor(Math.random() * charset.length)]
    }
    
    // Перемешиваем символы
    return password.split('').sort(() => Math.random() - 0.5).join('')
  }
}

