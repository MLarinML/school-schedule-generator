'use client'

import { useState, useEffect } from 'react'
import { Eye, EyeOff, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react'
import { resetPasswordSchema, type ResetPasswordFormData } from '../../lib/validation/auth'
import { useSearchParams } from 'next/navigation'

interface ResetPasswordFormProps {
  onSuccess: () => void
  onBackToLogin: () => void
}

const ResetPasswordForm = ({ onSuccess, onBackToLogin }: ResetPasswordFormProps) => {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [formData, setFormData] = useState<ResetPasswordFormData>({
    token: token || '',
    password: '',
    confirmPassword: ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [serverMessage, setServerMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [tokenValid, setTokenValid] = useState<boolean | null>(null)
  const [userInfo, setUserInfo] = useState<{ email: string; fullName?: string } | null>(null)

  useEffect(() => {
    if (token) {
      validateToken()
    }
  }, [token])

  const validateToken = async () => {
    try {
      const response = await fetch(`/api/auth/reset-password?token=${token}`)
      const data = await response.json()

      if (response.ok) {
        setTokenValid(true)
        setUserInfo(data.user)
      } else {
        setTokenValid(false)
        setServerMessage({
          type: 'error',
          text: data.error
        })
      }
    } catch (error) {
      setTokenValid(false)
      setServerMessage({
        type: 'error',
        text: 'Ошибка проверки токена'
      })
    }
  }

  const handleInputChange = (field: keyof ResetPasswordFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Очищаем ошибку для этого поля
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validateForm = (): boolean => {
    try {
      resetPasswordSchema.parse(formData)
      setErrors({})
      return true
    } catch (error: any) {
      const newErrors: Record<string, string> = {}
      error.errors?.forEach((err: any) => {
        if (err.path) {
          newErrors[err.path[0]] = err.message
        }
      })
      setErrors(newErrors)
      return false
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setServerMessage(null)

    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        setServerMessage({
          type: 'success',
          text: data.message
        })
        onSuccess()
      } else {
        setServerMessage({
          type: 'error',
          text: data.error || 'Произошла ошибка при сбросе пароля'
        })
      }
    } catch (error) {
      setServerMessage({
        type: 'error',
        text: 'Ошибка сети. Попробуйте еще раз.'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getPasswordStrength = (password: string): { score: number; label: string; color: string } => {
    let score = 0
    if (password.length >= 10) score++
    if (/[A-Z]/.test(password)) score++
    if (/[a-z]/.test(password)) score++
    if (/\d/.test(password)) score++
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++

    const labels = ['Очень слабый', 'Слабый', 'Средний', 'Хороший', 'Отличный']
    const colors = ['text-red-500', 'text-orange-500', 'text-yellow-500', 'text-blue-500', 'text-green-500']
    
    return {
      score: Math.min(score, 5),
      label: labels[score - 1] || 'Очень слабый',
      color: colors[score - 1] || 'text-red-500'
    }
  }

  const passwordStrength = getPasswordStrength(formData.password)

  if (tokenValid === null) {
    return (
      <div className="w-full max-w-md mx-auto text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Проверка ссылки...</p>
      </div>
    )
  }

  if (tokenValid === false) {
    return (
      <div className="w-full max-w-md mx-auto text-center">
        <div className="mb-6">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Ссылка недействительна
          </h2>
          <p className="text-gray-600 mb-6">
            Ссылка для сброса пароля недействительна или истекла.
          </p>
        </div>
        
        <button
          onClick={onBackToLogin}
          className="inline-flex items-center gap-2 text-blue-600 hover:underline font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Вернуться к входу
        </button>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Установить новый пароль
        </h2>
        <p className="text-gray-600">
          Для аккаунта <strong>{userInfo?.email}</strong>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Password */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
            Новый пароль
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              className={`w-full px-3 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.password ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Минимум 10 символов"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              disabled={isLoading}
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          
          {/* Password strength indicator */}
          {formData.password && (
            <div className="mt-2">
              <div className="flex items-center gap-2 mb-1">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <div
                      key={level}
                      className={`w-2 h-2 rounded-full ${
                        level <= passwordStrength.score ? passwordStrength.color.replace('text-', 'bg-') : 'bg-gray-200'
                      }`}
                    />
                  ))}
                </div>
                <span className={`text-sm font-medium ${passwordStrength.color}`}>
                  {passwordStrength.label}
                </span>
              </div>
            </div>
          )}
          
          {errors.password && (
            <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {errors.password}
            </p>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
            Подтвердите новый пароль
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
              className={`w-full px-3 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Повторите новый пароль"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              disabled={isLoading}
            >
              {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {errors.confirmPassword}
            </p>
          )}
        </div>

        {/* Server message */}
        {serverMessage && (
          <div className={`p-3 rounded-lg flex items-center gap-2 ${
            serverMessage.type === 'success' 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {serverMessage.type === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span className="text-sm font-medium">{serverMessage.text}</span>
          </div>
        )}

        {/* Submit button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Установка пароля...' : 'Установить новый пароль'}
        </button>

        {/* Back to login */}
        <div className="text-center">
          <button
            type="button"
            onClick={onBackToLogin}
            className="inline-flex items-center gap-2 text-blue-600 hover:underline font-medium"
            disabled={isLoading}
          >
            <ArrowLeft className="w-4 h-4" />
            Вернуться к входу
          </button>
        </div>
      </form>
    </div>
  )
}

export default ResetPasswordForm

