'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { 
  Users, 
  CreditCard, 
  BarChart3, 
  Settings, 
  Shield, 
  Mail,
  Calendar,
  TrendingUp,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'

interface AdminStats {
  totalUsers: number
  activeUsers: number
  totalSubscriptions: number
  activeSubscriptions: number
  monthlyRevenue: number
  pendingVerifications: number
}

export default function AdminPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalSubscriptions: 0,
    activeSubscriptions: 0,
    monthlyRevenue: 0,
    pendingVerifications: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/?auth=login')
      return
    }

    if (user && !user.roles?.includes('admin')) {
      router.push('/')
      return
    }

    if (user?.roles?.includes('admin')) {
      fetchAdminStats()
    }
  }, [user, isLoading, router])

  const fetchAdminStats = async () => {
    try {
      const response = await fetch('/api/admin/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Ошибка загрузки статистики:', error)
    } finally {
      setLoading(false)
    }
  }

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!user || !user.roles?.includes('admin')) {
    return null
  }

  const adminSections = [
    {
      title: 'Пользователи',
      description: 'Управление пользователями и их аккаунтами',
      icon: Users,
      href: '/admin/users',
      color: 'bg-blue-500',
      stats: `${stats.totalUsers} пользователей`
    },
    {
      title: 'Подписки',
      description: 'Управление подписками и платежами',
      icon: CreditCard,
      href: '/admin/subscriptions',
      color: 'bg-green-500',
      stats: `${stats.activeSubscriptions} активных`
    },
    {
      title: 'Аналитика',
      description: 'Статистика и отчеты',
      icon: BarChart3,
      href: '/admin/analytics',
      color: 'bg-purple-500',
      stats: `${stats.monthlyRevenue}₽ за месяц`
    },
    {
      title: 'Безопасность',
      description: 'Мониторинг безопасности и событий',
      icon: Shield,
      href: '/admin/security',
      color: 'bg-red-500',
      stats: `${stats.pendingVerifications} на проверке`
    },
    {
      title: 'Email',
      description: 'Управление email-рассылками',
      icon: Mail,
      href: '/admin/email',
      color: 'bg-yellow-500',
      stats: 'Настройки SMTP'
    },
    {
      title: 'Настройки',
      description: 'Системные настройки',
      icon: Settings,
      href: '/admin/settings',
      color: 'bg-gray-500',
      stats: 'Конфигурация'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Админ-панель</h1>
              <p className="text-gray-600 mt-1">Управление системой и пользователями</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500">
                Добро пожаловать, {user.firstName || user.email}
              </div>
              <button
                onClick={() => router.push('/')}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                На главную
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Всего пользователей</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalUsers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Активных пользователей</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.activeUsers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <CreditCard className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Активных подписок</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.activeSubscriptions}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Доход за месяц</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.monthlyRevenue}₽</p>
              </div>
            </div>
          </div>
        </div>

        {/* Admin Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {adminSections.map((section) => {
            const IconComponent = section.icon
            return (
              <div
                key={section.href}
                onClick={() => router.push(section.href)}
                className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer p-6"
              >
                <div className="flex items-center mb-4">
                  <div className={`p-3 ${section.color} rounded-lg`}>
                    <IconComponent className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900">{section.title}</h3>
                    <p className="text-sm text-gray-600">{section.stats}</p>
                  </div>
                </div>
                <p className="text-gray-600 text-sm">{section.description}</p>
              </div>
            )
          })}
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Быстрые действия</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => router.push('/admin/users?action=create')}
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <Users className="h-5 w-5 text-blue-600 mr-3" />
              <span className="text-sm font-medium">Добавить пользователя</span>
            </button>
            <button
              onClick={() => router.push('/admin/subscriptions?action=create')}
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <CreditCard className="h-5 w-5 text-green-600 mr-3" />
              <span className="text-sm font-medium">Создать подписку</span>
            </button>
            <button
              onClick={() => router.push('/admin/email?action=send')}
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <Mail className="h-5 w-5 text-yellow-600 mr-3" />
              <span className="text-sm font-medium">Отправить email</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
