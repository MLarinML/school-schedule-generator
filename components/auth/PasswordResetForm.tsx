'use client'

import { useState } from 'react'
import { Eye, EyeOff, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react'
import { requestPasswordResetSchema, type RequestPasswordResetFormData } from '../../lib/validation/auth'

interface PasswordResetFormProps {
  onSuccess: () => void
  onBackToLogin: () => void
}

const PasswordResetForm = ({ onSuccess, onBackToLogin }: PasswordResetFormProps) => {
  const [formData, setFormData] = useState<RequestPasswordResetFormData>({
    email: ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [serverMessage, setServerMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const handleInputChange = (field: keyof RequestPasswordResetFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Очищаем ошибку для этого поля
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validateForm = (): boolean => {
    try {
      requestPasswordResetSchema.parse(formData)
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
      const response = await fetch('/api/auth/request-password-reset', {
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
          text: data.error || 'Произошла ошибка при запросе сброса пароля'
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

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Сброс пароля
        </h2>
        <p className="text-gray-600">
          Если аккаунт существует, отправили письмо со ссылкой на сброс. Проверьте почту.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Email адрес
          </label>
          <input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.email ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="your@email.com"
            disabled={isLoading}
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {errors.email}
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
          {isLoading ? 'Отправка...' : 'Отправить ссылку для сброса'}
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

export default PasswordResetForm

