'use client'

import { useState, useEffect } from 'react'
import { CheckCircle, Clock, AlertCircle, Crown, Calendar, Users, Settings } from 'lucide-react'

interface SubscriptionData {
  id: string
  planId: string
  planName: string
  status: 'active' | 'expired' | 'cancelled'
  startDate: string
  endDate: string
  features: string[]
  daysRemaining: number
}

interface SubscriptionStatusProps {
  className?: string
}

const SubscriptionStatus = ({ className = '' }: SubscriptionStatusProps) => {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchSubscriptionStatus()
  }, [])

  const fetchSubscriptionStatus = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/subscription/status')
      const data = await response.json()

      if (data.success) {
        setSubscription(data.subscription)
      } else {
        setError(data.error || 'Ошибка загрузки подписки')
      }
    } catch (err) {
      setError('Ошибка соединения')
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'expired':
        return <AlertCircle className="w-5 h-5 text-red-600" />
      default:
        return <Clock className="w-5 h-5 text-yellow-600" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Активна'
      case 'expired':
        return 'Истекла'
      case 'cancelled':
        return 'Отменена'
      default:
        return 'Неизвестно'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'expired':
        return 'text-red-600 bg-red-50 border-red-200'
      case 'cancelled':
        return 'text-gray-600 bg-gray-50 border-gray-200'
      default:
        return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    }
  }

  if (loading) {
    return (
      <div className={`bg-white rounded-xl p-6 shadow-sm border ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`bg-white rounded-xl p-6 shadow-sm border border-red-200 ${className}`}>
        <div className="flex items-center space-x-2 text-red-600">
          <AlertCircle className="w-5 h-5" />
          <span className="font-medium">Ошибка загрузки подписки</span>
        </div>
        <p className="text-sm text-gray-600 mt-2">{error}</p>
      </div>
    )
  }

  if (!subscription) {
    return (
      <div className={`bg-white rounded-xl p-6 shadow-sm border ${className}`}>
        <div className="text-center">
          <Crown className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Нет активной подписки
          </h3>
          <p className="text-gray-600 mb-4">
            Оформите подписку, чтобы получить доступ ко всем возможностям
          </p>
          <a
            href="/subscription"
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Выбрать тариф
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-xl p-6 shadow-sm border ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <Crown className="w-6 h-6 text-primary-600" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {subscription.planName}
            </h3>
            <div className="flex items-center space-x-2">
              {getStatusIcon(subscription.status)}
              <span className={`text-sm font-medium px-2 py-1 rounded-full border ${getStatusColor(subscription.status)}`}>
                {getStatusText(subscription.status)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Status Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Calendar className="w-4 h-4" />
          <span>
            До {new Date(subscription.endDate).toLocaleDateString('ru-RU')}
          </span>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Clock className="w-4 h-4" />
          <span>
            {subscription.daysRemaining > 0 
              ? `Осталось ${subscription.daysRemaining} дней`
              : 'Подписка истекла'
            }
          </span>
        </div>
      </div>

      {/* Features */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
          <Settings className="w-4 h-4 mr-2" />
          Включенные возможности
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {subscription.features.map((feature, index) => (
            <div key={index} className="flex items-center space-x-2 text-sm text-gray-600">
              <CheckCircle className="w-3 h-3 text-green-600 flex-shrink-0" />
              <span>{feature}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        {subscription.status === 'active' && subscription.daysRemaining > 0 && (
          <a
            href="/schedule/schedule-builder"
            className="flex-1 bg-primary-600 text-white text-center py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors"
          >
            Перейти к сервису
          </a>
        )}
        <a
          href="/subscription"
          className="flex-1 bg-gray-100 text-gray-700 text-center py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Управление подпиской
        </a>
      </div>
    </div>
  )
}

export default SubscriptionStatus
