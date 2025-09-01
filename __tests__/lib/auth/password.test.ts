import { PasswordManager } from '../../../lib/auth/password'

describe('PasswordManager', () => {
  describe('validatePassword', () => {
    it('should validate a strong password', () => {
      const result = PasswordManager.validatePassword('StrongPass123!')
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject password shorter than minimum length', () => {
      const result = PasswordManager.validatePassword('Short1!')
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Пароль должен содержать не менее 10 символов')
    })

    it('should reject password without uppercase letter', () => {
      const result = PasswordManager.validatePassword('lowercase123!')
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Пароль должен содержать хотя бы одну заглавную букву')
    })

    it('should reject password without lowercase letter', () => {
      const result = PasswordManager.validatePassword('UPPERCASE123!')
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Пароль должен содержать хотя бы одну строчную букву')
    })

    it('should reject password without digit', () => {
      const result = PasswordManager.validatePassword('NoDigits!@#')
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Пароль должен содержать хотя бы одну цифру')
    })

    it('should reject password without special character', () => {
      const result = PasswordManager.validatePassword('NoSpecialChar123')
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Пароль должен содержать хотя бы один специальный символ')
    })

    it('should reject common passwords', () => {
      const result = PasswordManager.validatePassword('password')
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Пароль слишком простой, выберите другой')
    })

    it('should reject password with repeating characters', () => {
      const result = PasswordManager.validatePassword('aaaStrong123!')
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Пароль не должен содержать повторяющиеся символы подряд')
    })

    it('should accept password with minimum requirements', () => {
      const result = PasswordManager.validatePassword('Abc123!@#x')
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
  })

  describe('generateSecurePassword', () => {
    it('should generate password with default length', () => {
      const password = PasswordManager.generateSecurePassword()
      expect(password).toHaveLength(16)
    })

    it('should generate password with custom length', () => {
      const password = PasswordManager.generateSecurePassword(20)
      expect(password).toHaveLength(20)
    })

    it('should generate password with all required character types', () => {
      const password = PasswordManager.generateSecurePassword()
      
      // Check for uppercase letter
      expect(password).toMatch(/[A-Z]/)
      
      // Check for lowercase letter
      expect(password).toMatch(/[a-z]/)
      
      // Check for digit
      expect(password).toMatch(/\d/)
      
      // Check for special character
      expect(password).toMatch(/[!@#$%^&*]/)
    })

    it('should generate different passwords on multiple calls', () => {
      const password1 = PasswordManager.generateSecurePassword()
      const password2 = PasswordManager.generateSecurePassword()
      expect(password1).not.toBe(password2)
    })
  })

  describe('hashPassword and verifyPassword', () => {
    it('should hash and verify password correctly', async () => {
      const password = 'TestPassword123!'
      const hash = await PasswordManager.hashPassword(password)
      
      expect(hash).toBeDefined()
      expect(hash).not.toBe(password)
      expect(hash.length).toBeGreaterThan(0)
      
      const isValid = await PasswordManager.verifyPassword(password, hash)
      expect(isValid).toBe(true)
    })

    it('should reject incorrect password', async () => {
      const password = 'TestPassword123!'
      const wrongPassword = 'WrongPassword123!'
      const hash = await PasswordManager.hashPassword(password)
      
      const isValid = await PasswordManager.verifyPassword(wrongPassword, hash)
      expect(isValid).toBe(false)
    })

    it('should generate different hashes for same password', async () => {
      const password = 'TestPassword123!'
      const hash1 = await PasswordManager.hashPassword(password)
      const hash2 = await PasswordManager.hashPassword(password)
      
      expect(hash1).not.toBe(hash2)
    })
  })
})
