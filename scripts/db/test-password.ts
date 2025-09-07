import { PasswordManager } from '../../lib/auth/password'

async function testPassword() {
  const password = 'TestPassword123'
  
  console.log('🔐 Testing password hashing...')
  console.log('Password:', password)
  
  const hash = await PasswordManager.hashPassword(password)
  console.log('Hash:', hash)
  
  const isValid = await PasswordManager.verifyPassword(password, hash)
  console.log('Verification result:', isValid)
  
  // Тестируем с неправильным паролем
  const isInvalid = await PasswordManager.verifyPassword('WrongPassword', hash)
  console.log('Wrong password verification:', isInvalid)
}

testPassword().catch(console.error)
