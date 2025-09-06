'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { 
  Mail, 
  Send, 
  Settings, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  TestTube,
  Users,
  Calendar
} from 'lucide-react'

interface EmailConfig {
  host: string
  port: number
  secure: boolean
  user: string
  from: string
  status: 'connected' | 'disconnected' | 'error'
}

export default function AdminEmailPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [emailConfig, setEmailConfig] = useState<EmailConfig>({
    host: '',
    port: 587,
    secure: false,
    user: '',
    from: '',
    status: 'disconnected'
  })
  const [loading, setLoading] = useState(true)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const [sendingEmail, setSendingEmail] = useState(false)
  const [emailForm, setEmailForm] = useState({
    to: '',
    subject: '',
    message: ''
  })

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
      fetchEmailConfig()
    }
  }, [user, isLoading, router])

  const fetchEmailConfig = async () => {
    try {
      const response = await fetch('/api/admin/email/config')
      if (response.ok) {
        const data = await response.json()
        setEmailConfig(data.config)
      }
    } catch (error) {
      console.error('Ошибка загрузки конфигурации email:', error)
    } finally {
      setLoading(false)
    }
  }

  const testEmailConnection = async () => {
    try {
      const response = await fetch('/api/email/test-connection', {
        method: 'POST'
      })
      
      const result = await response.json()
      setTestResult({
        success: response.ok,
        message: result.message || (response.ok ? 'Соединение успешно' : 'Ошибка соединения')
      })
    } catch (error) {
      setTestResult({
        success: false,
        message: 'Ошибка тестирования соединения'
      })
    }
  }

  const sendTestEmail = async () => {
    if (!emailForm.to || !emailForm.subject || !emailForm.message) {
      setTestResult({
        success: false,
        message: 'Заполните все поля'
      })
      return
    }

    setSendingEmail(true)
    try {
      const response = await fetch('/api/admin/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailForm)
      })
      
      const result = await response.json()
      setTestResult({
        success: response.ok,
        message: result.message || (response.ok ? 'Email отправлен успешно' : 'Ошибка отправки')
      })
    } catch (error) {
      setTestResult({
        success: false,
        message: 'Ошибка отправки email'
      })
    } finally {
      setSendingEmail(false)
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Управление Email</h1>
              <p className="text-gray-600 mt-1">Настройка и тестирование email-сервиса</p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/admin')}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Назад в админ-панель
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Email Status */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Статус Email-сервиса</h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {emailConfig.status === 'connected' ? (
                <CheckCircle className="h-6 w-6 text-green-500 mr-3" />
              ) : (
                <XCircle className="h-6 w-6 text-red-500 mr-3" />
              )}
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {emailConfig.status === 'connected' ? 'Подключено' : 'Не подключено'}
                </p>
                <p className="text-sm text-gray-500">
                  {emailConfig.host ? `${emailConfig.host}:${emailConfig.port}` : 'Не настроено'}
                </p>
              </div>
            </div>
            <button
              onClick={testEmailConnection}
              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700"
            >
              <TestTube className="h-4 w-4 mr-2" />
              Тестировать соединение
            </button>
          </div>
        </div>

        {/* Test Result */}
        {testResult && (
          <div className={`rounded-lg p-4 mb-6 ${
            testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-center">
              {testResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500 mr-3" />
              )}
              <p className={`text-sm font-medium ${
                testResult.success ? 'text-green-800' : 'text-red-800'
              }`}>
                {testResult.message}
              </p>
            </div>
          </div>
        )}

        {/* Email Configuration */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Конфигурация SMTP</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Хост</label>
              <input
                type="text"
                value={emailConfig.host}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Порт</label>
              <input
                type="number"
                value={emailConfig.port}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Пользователь</label>
              <input
                type="text"
                value={emailConfig.user}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">От кого</label>
              <input
                type="text"
                value={emailConfig.from}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={emailConfig.secure}
                readOnly
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="ml-2 text-sm text-gray-700">Использовать SSL/TLS</span>
            </label>
          </div>
        </div>

        {/* Send Test Email */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Отправить тестовый email</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Получатель</label>
              <input
                type="email"
                value={emailForm.to}
                onChange={(e) => setEmailForm({ ...emailForm, to: e.target.value })}
                placeholder="test@example.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Тема</label>
              <input
                type="text"
                value={emailForm.subject}
                onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })}
                placeholder="Тестовое сообщение"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Сообщение</label>
              <textarea
                value={emailForm.message}
                onChange={(e) => setEmailForm({ ...emailForm, message: e.target.value })}
                placeholder="Это тестовое сообщение для проверки работы email-сервиса."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={sendTestEmail}
              disabled={sendingEmail}
              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:opacity-50"
            >
              {sendingEmail ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Отправляем...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Отправить тестовый email
                </>
              )}
            </button>
          </div>
        </div>

        {/* Email Templates */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Шаблоны email</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <Mail className="h-5 w-5 text-blue-600 mr-2" />
                <h4 className="font-medium text-gray-900">Подтверждение email</h4>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Отправляется при регистрации для подтверждения email-адреса
              </p>
              <button className="text-sm text-primary-600 hover:text-primary-700">
                Настроить шаблон
              </button>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <Users className="h-5 w-5 text-green-600 mr-2" />
                <h4 className="font-medium text-gray-900">Сброс пароля</h4>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Отправляется при запросе сброса пароля
              </p>
              <button className="text-sm text-primary-600 hover:text-primary-700">
                Настроить шаблон
              </button>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <Calendar className="h-5 w-5 text-purple-600 mr-2" />
                <h4 className="font-medium text-gray-900">Уведомления</h4>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Системные уведомления и важные сообщения
              </p>
              <button className="text-sm text-primary-600 hover:text-primary-700">
                Настроить шаблон
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
