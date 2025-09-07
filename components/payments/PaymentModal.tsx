'use client'

import { useState } from 'react'
import { X, CreditCard, Shield, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  planId: string
  planName: string
  price: string
  period: string
  onSuccess: (subscription: any) => void
}

interface PaymentFormData {
  cardNumber: string
  expiryDate: string
  cvv: string
  cardholderName: string
  email: string
}

const PaymentModal = ({ 
  isOpen, 
  onClose, 
  planId, 
  planName, 
  price, 
  period, 
  onSuccess 
}: PaymentModalProps) => {
  const [step, setStep] = useState<'form' | 'processing' | 'success' | 'error'>('form')
  const [formData, setFormData] = useState<PaymentFormData>({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: '',
    email: ''
  })
  const [error, setError] = useState('')

  const handleInputChange = (field: keyof PaymentFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError('')
  }

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
    const matches = v.match(/\d{4,16}/g)
    const match = matches && matches[0] || ''
    const parts = []
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4))
    }
    if (parts.length) {
      return parts.join(' ')
    } else {
      return v
    }
  }

  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4)
    }
    return v
  }

  const validateForm = (): boolean => {
    if (!formData.cardNumber || formData.cardNumber.replace(/\s/g, '').length < 16) {
      setError('Введите корректный номер карты')
      return false
    }
    if (!formData.expiryDate || formData.expiryDate.length < 5) {
      setError('Введите корректную дату истечения')
      return false
    }
    if (!formData.cvv || formData.cvv.length < 3) {
      setError('Введите корректный CVV код')
      return false
    }
    if (!formData.cardholderName.trim()) {
      setError('Введите имя держателя карты')
      return false
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setError('Введите корректный email')
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setStep('processing')
    setError('')

    try {
      // Создаем платежное намерение
      const createResponse = await fetch('/api/payments/create-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ planId }),
      })

      const createResult = await createResponse.json()

      if (!createResult.success) {
        throw new Error(createResult.error || 'Ошибка создания платежа')
      }

      // Имитируем обработку платежа
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Подтверждаем платеж
      const confirmResponse = await fetch('/api/payments/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          paymentIntentId: createResult.paymentIntent.id,
          planId 
        }),
      })

      const confirmResult = await confirmResponse.json()

      if (!confirmResult.success) {
        throw new Error(confirmResult.error || 'Ошибка подтверждения платежа')
      }

      setStep('success')
      onSuccess(confirmResult.subscription)

    } catch (err) {
      console.error('Ошибка платежа:', err)
      setError(err instanceof Error ? err.message : 'Произошла ошибка при обработке платежа')
      setStep('error')
    }
  }

  const handleClose = () => {
    setStep('form')
    setError('')
    setFormData({
      cardNumber: '',
      expiryDate: '',
      cvv: '',
      cardholderName: '',
      email: ''
    })
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">
            {step === 'success' ? 'Платеж успешен!' : 
             step === 'error' ? 'Ошибка платежа' : 
             'Оплата подписки'}
          </h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 'form' && (
            <>
              {/* Plan Info */}
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">{planName}</h3>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-primary-600">{price}</span>
                  <span className="text-sm text-gray-600">{period}</span>
                </div>
              </div>

              {/* Payment Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Номер карты
                  </label>
                  <input
                    type="text"
                    value={formData.cardNumber}
                    onChange={(e) => handleInputChange('cardNumber', formatCardNumber(e.target.value))}
                    placeholder="1234 5678 9012 3456"
                    maxLength={19}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Срок действия
                    </label>
                    <input
                      type="text"
                      value={formData.expiryDate}
                      onChange={(e) => handleInputChange('expiryDate', formatExpiryDate(e.target.value))}
                      placeholder="MM/YY"
                      maxLength={5}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      CVV
                    </label>
                    <input
                      type="text"
                      value={formData.cvv}
                      onChange={(e) => handleInputChange('cvv', e.target.value.replace(/\D/g, ''))}
                      placeholder="123"
                      maxLength={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Имя держателя карты
                  </label>
                  <input
                    type="text"
                    value={formData.cardholderName}
                    onChange={(e) => handleInputChange('cardholderName', e.target.value)}
                    placeholder="IVAN IVANOV"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email для чека
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="example@school.ru"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                {error && (
                  <div className="flex items-center space-x-2 text-red-600 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-primary-500 to-primary-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-primary-600 hover:to-primary-700 transition-all duration-200 flex items-center justify-center space-x-2"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Оплатить {price}</span>
                </button>
              </form>

              {/* Security Info */}
              <div className="flex items-center justify-center space-x-2 mt-4 text-sm text-gray-500">
                <Shield className="w-4 h-4" />
                <span>Защищенное соединение SSL</span>
              </div>
            </>
          )}

          {step === 'processing' && (
            <div className="text-center py-8">
              <Loader2 className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Обработка платежа...
              </h3>
              <p className="text-gray-600">
                Пожалуйста, не закрывайте страницу
              </p>
            </div>
          )}

          {step === 'success' && (
            <div className="text-center py-8">
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Подписка активирована!
              </h3>
              <p className="text-gray-600 mb-6">
                Ваша подписка {planName} успешно активирована. 
                Теперь вы можете пользоваться всеми возможностями тарифа.
              </p>
              <button
                onClick={handleClose}
                className="bg-primary-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
              >
                Перейти к сервису
              </button>
            </div>
          )}

          {step === 'error' && (
            <div className="text-center py-8">
              <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Ошибка платежа
              </h3>
              <p className="text-gray-600 mb-6">
                {error || 'Произошла ошибка при обработке платежа. Попробуйте еще раз.'}
              </p>
              <div className="space-x-3">
                <button
                  onClick={() => setStep('form')}
                  className="bg-primary-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
                >
                  Попробовать снова
                </button>
                <button
                  onClick={handleClose}
                  className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                >
                  Отмена
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PaymentModal
