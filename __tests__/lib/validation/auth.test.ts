import { 
  registerSchema, 
  loginSchema, 
  requestPasswordResetSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  changePasswordSchema,
  updateProfileSchema
} from '../../../lib/validation/auth'

describe('Auth Validation Schemas', () => {
  describe('registerSchema', () => {
    it('should validate correct registration data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'StrongPass123!',
        firstName: 'Иван',
        lastName: 'Иванов'
      }

      const result = registerSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject invalid email', () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'StrongPass123!',
        firstName: 'Иван',
        lastName: 'Иванов'
      }

      const result = registerSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues?.some(e => e.message.includes('корректный email'))).toBe(true)
      }
    })

    it('should reject weak password', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'weak',
        firstName: 'Иван',
        lastName: 'Иванов'
      }

      const result = registerSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues?.some(e => e.message.includes('не менее 10 символов'))).toBe(true)
      }
    })



    it('should transform email to lowercase', () => {
      const data = {
        email: 'TEST@EXAMPLE.COM',
        password: 'StrongPass123!',
        firstName: 'Иван',
        lastName: 'Иванов'
      }

      const result = registerSchema.parse(data)
      expect(result.email).toBe('test@example.com')
    })

    it('should reject without firstName', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'StrongPass123!',
        lastName: 'Иванов'
      }

      const result = registerSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues?.some(e => e.path.includes('firstName'))).toBe(true)
      }
    })

    it('should reject without lastName', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'StrongPass123!',
        firstName: 'Иван'
      }

      const result = registerSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues?.some(e => e.path.includes('lastName'))).toBe(true)
      }
    })
  })

  describe('loginSchema', () => {
    it('should validate correct login data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'password123'
      }

      const result = loginSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should validate login data with rememberMe', () => {
      const validData = {
        email: 'test@example.com',
        password: 'password123',
        rememberMe: true
      }

      const result = loginSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject invalid email', () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'password123'
      }

      const result = loginSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject empty password', () => {
      const invalidData = {
        email: 'test@example.com',
        password: ''
      }

      const result = loginSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should transform email to lowercase', () => {
      const data = {
        email: 'TEST@EXAMPLE.COM',
        password: 'password123'
      }

      const result = loginSchema.parse(data)
      expect(result.email).toBe('test@example.com')
    })
  })

  describe('requestPasswordResetSchema', () => {
    it('should validate correct email', () => {
      const validData = {
        email: 'test@example.com'
      }

      const result = requestPasswordResetSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject invalid email', () => {
      const invalidData = {
        email: 'invalid-email'
      }

      const result = requestPasswordResetSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should transform email to lowercase', () => {
      const data = {
        email: 'TEST@EXAMPLE.COM'
      }

      const result = requestPasswordResetSchema.parse(data)
      expect(result.email).toBe('test@example.com')
    })
  })

  describe('resetPasswordSchema', () => {
    it('should validate correct reset data', () => {
      const validData = {
        token: 'valid-token-123',
        password: 'NewStrongPass123!',
        confirmPassword: 'NewStrongPass123!'
      }

      const result = resetPasswordSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject weak password', () => {
      const invalidData = {
        token: 'valid-token-123',
        password: 'weak',
        confirmPassword: 'weak'
      }

      const result = resetPasswordSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject mismatched passwords', () => {
      const invalidData = {
        token: 'valid-token-123',
        password: 'NewStrongPass123!',
        confirmPassword: 'DifferentPass123!'
      }

      const result = resetPasswordSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('verifyEmailSchema', () => {
    it('should validate correct token', () => {
      const validData = {
        token: 'valid-token-123'
      }

      const result = verifyEmailSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject empty token', () => {
      const invalidData = {
        token: ''
      }

      const result = verifyEmailSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('changePasswordSchema', () => {
    it('should validate correct change password data', () => {
      const validData = {
        currentPassword: 'OldPass123!',
        newPassword: 'NewStrongPass123!',
        confirmNewPassword: 'NewStrongPass123!'
      }

      const result = changePasswordSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject weak new password', () => {
      const invalidData = {
        currentPassword: 'OldPass123!',
        newPassword: 'weak',
        confirmNewPassword: 'weak'
      }

      const result = changePasswordSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject mismatched new passwords', () => {
      const invalidData = {
        currentPassword: 'OldPass123!',
        newPassword: 'NewStrongPass123!',
        confirmNewPassword: 'DifferentPass123!'
      }

      const result = changePasswordSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('updateProfileSchema', () => {
    it('should validate correct profile data', () => {
      const validData = {
        fullName: 'Иван Иванов',
        locale: 'ru',
        timezone: 'Europe/Moscow'
      }

      const result = updateProfileSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should use default values', () => {
      const data = {}

      const result = updateProfileSchema.parse(data)
      expect(result.locale).toBe('ru')
      expect(result.timezone).toBe('Europe/Moscow')
    })

    it('should accept valid locale values', () => {
      const validData = {
        locale: 'en'
      }

      const result = updateProfileSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject invalid locale', () => {
      const invalidData = {
        locale: 'invalid'
      }

      const result = updateProfileSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })
})
