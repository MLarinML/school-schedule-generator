'use client'

import { useState } from 'react'
import { Header } from '../../components/layout'
import { Mail, CheckCircle, AlertCircle, Info, Copy } from 'lucide-react'

// EmailService используется только на сервере, поэтому определяем провайдеров здесь
const EMAIL_PROVIDERS = [
  {
    name: 'Gmail',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    requiresAuth: true,
    description: 'Google Gmail - популярный почтовый сервис',
    instructions: [
      'Включите двухфакторную аутентификацию в настройках Google',
      'Создайте пароль приложения в разделе "Безопасность"',
      'Используйте пароль приложения, НЕ обычный пароль от Gmail'
    ]
  },
  {
    name: 'Yandex',
    host: 'smtp.yandex.ru',
    port: 465,
    secure: true,
    requiresAuth: true,
    description: 'Яндекс.Почта - российский почтовый сервис',
    instructions: [
      'Включите двухфакторную аутентификацию в настройках Яндекса',
      'Создайте пароль приложения в разделе "Безопасность"',
      'Используйте пароль приложения, НЕ обычный пароль от Яндекса'
    ]
  },
  {
    name: 'Mail.ru',
    host: 'smtp.mail.ru',
    port: 465,
    secure: true,
    requiresAuth: true,
    description: 'Mail.ru - популярный российский почтовый сервис',
    instructions: [
      'Включите двухфакторную аутентификацию в настройках Mail.ru',
      'Создайте пароль приложения в разделе "Безопасность"',
      'Используйте пароль приложения, НЕ обычный пароль от Mail.ru'
    ]
  },
  {
    name: 'Outlook/Hotmail',
    host: 'smtp-mail.outlook.com',
    port: 587,
    secure: false,
    requiresAuth: true,
    description: 'Microsoft Outlook/Hotmail - корпоративный почтовый сервис',
    instructions: [
      'Включите двухфакторную аутентификацию в настройках Microsoft',
      'Создайте пароль приложения в разделе "Безопасность"',
      'Используйте пароль приложения, НЕ обычный пароль от Outlook'
    ]
  }
] as const

type EmailProvider = typeof EMAIL_PROVIDERS[number]

export default function EmailSetupPage() {
  const [selectedProvider, setSelectedProvider] = useState<string>('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

  const handleProviderSelect = (providerName: string) => {
    setSelectedProvider(providerName)
    setTestResult(null)
  }

  const handleTestConnection = async () => {
    if (!email || !password || !selectedProvider) {
      setTestResult({ success: false, message: 'Заполните все поля' })
      return
    }

    setIsTesting(true)
    setTestResult(null)

    try {
      const provider = EMAIL_PROVIDERS.find(p => p.name === selectedProvider)
      if (!provider) {
        setTestResult({ success: false, message: 'Провайдер не найден' })
        return
      }

      // Тестируем подключение через API
      const response = await fetch('/api/email/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          host: provider.host,
          port: provider.port,
          secure: provider.secure,
          user: email,
          pass: password
        })
      })

      const data = await response.json()
      
      if (response.ok && data.success) {
        setTestResult({ 
          success: true, 
          message: 'Подключение успешно! Теперь можете использовать эти настройки.' 
        })
      } else {
        setTestResult({ 
          success: false, 
          message: data.error || 'Не удалось подключиться. Проверьте настройки и пароль приложения.' 
        })
      }
    } catch (error) {
      setTestResult({ 
        success: false, 
        message: `Ошибка: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}` 
      })
    } finally {
      setIsTesting(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const getEnvConfig = () => {
    const provider = EMAIL_PROVIDERS.find(p => p.name === selectedProvider)
    if (!provider) return ''

    return `# ${provider.name}
SMTP_HOST="${provider.host}"
SMTP_PORT=${provider.port}
SMTP_SECURE=${provider.secure}
SMTP_USER="${email}"
SMTP_PASS="${password}"
SMTP_FROM="${email}"`
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onOpenAuth={() => {}} />
      
      {/* Заголовок */}
      <div className="bg-white shadow-sm border-b">
        <div className="container-custom py-8">
          <div className="flex items-center space-x-3 mb-4">
            <Mail className="w-8 h-8 text-primary-600" />
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
              Настройка Email
            </h1>
          </div>
          <p className="text-xl text-gray-600">
            Настройте отправку email для подтверждения регистрации и восстановления пароля
          </p>
        </div>
      </div>

      {/* Основной контент */}
      <div className="container-custom py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Боковая панель с провайдерами */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Почтовые провайдеры</h2>
              
              <div className="space-y-3">
                {EMAIL_PROVIDERS.map((provider) => (
                  <button
                    key={provider.name}
                    onClick={() => handleProviderSelect(provider.name)}
                    className={`w-full text-left p-4 rounded-lg border transition-colors duration-200 ${
                      selectedProvider === provider.name
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <h3 className="font-semibold mb-1">{provider.name}</h3>
                    <p className="text-sm text-gray-600">{provider.description}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Основная область */}
          <div className="lg:col-span-2">
            {selectedProvider ? (
              <div className="space-y-6">
                {/* Информация о провайдере */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">
                    {selectedProvider} - Инструкции по настройке
                  </h2>
                  
                  {(() => {
                    const provider = EMAIL_PROVIDERS.find(p => p.name === selectedProvider)
                    if (!provider) return null

                    return (
                      <div className="space-y-4">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <div className="flex items-start space-x-3">
                            <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                            <div>
                              <h4 className="font-medium text-blue-900 mb-2">Пошаговые инструкции:</h4>
                              <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
                                {provider.instructions.map((instruction, index) => (
                                  <li key={index}>{instruction}</li>
                                ))}
                              </ol>
                            </div>
                          </div>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="font-medium text-gray-900 mb-2">Технические параметры:</h4>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">SMTP сервер:</span>
                              <p className="font-mono bg-white px-2 py-1 rounded border">{provider.host}</p>
                            </div>
                            <div>
                              <span className="text-gray-600">Порт:</span>
                              <p className="font-mono bg-white px-2 py-1 rounded border">{provider.port}</p>
                            </div>
                            <div>
                              <span className="text-gray-600">Безопасность:</span>
                              <p className="font-mono bg-white px-2 py-1 rounded border">
                                {provider.secure ? 'SSL/TLS' : 'STARTTLS'}
                              </p>
                            </div>
                            <div>
                              <span className="text-gray-600">Аутентификация:</span>
                              <p className="font-mono bg-white px-2 py-1 rounded border">
                                {provider.requiresAuth ? 'Требуется' : 'Не требуется'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })()}
                </div>

                {/* Форма тестирования */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Тестирование подключения</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email адрес
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your-email@domain.com"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Пароль приложения
                      </label>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Введите пароль приложения"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                      <p className="mt-1 text-sm text-gray-500">
                        Используйте пароль приложения, НЕ обычный пароль от почты
                      </p>
                    </div>

                    <button
                      onClick={handleTestConnection}
                      disabled={isTesting || !email || !password}
                      className={`w-full px-6 py-3 rounded-lg font-medium transition-colors duration-200 ${
                        isTesting || !email || !password
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-primary-600 text-white hover:bg-primary-700'
                      }`}
                    >
                      {isTesting ? 'Тестируем подключение...' : 'Тестировать подключение'}
                    </button>
                  </div>

                  {/* Результат тестирования */}
                  {testResult && (
                    <div className={`mt-4 p-4 rounded-lg ${
                      testResult.success 
                        ? 'bg-green-50 text-green-800 border border-green-200' 
                        : 'bg-red-50 text-red-800 border border-red-200'
                    }`}>
                      <div className="flex items-center space-x-2">
                        {testResult.success ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-red-600" />
                        )}
                        <span>{testResult.message}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Конфигурация для .env */}
                {testResult?.success && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Конфигурация для .env файла
                    </h3>
                    
                    <div className="bg-gray-900 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-gray-300 text-sm">Скопируйте эти настройки в ваш .env файл</span>
                        <button
                          onClick={() => copyToClipboard(getEnvConfig())}
                          className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
                        >
                          <Copy className="w-4 h-4" />
                          <span className="text-sm">Копировать</span>
                        </button>
                      </div>
                      
                      <pre className="text-green-400 text-sm overflow-x-auto">
                        <code>{getEnvConfig()}</code>
                      </pre>
                    </div>
                    
                    <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                        <div className="text-sm text-blue-800">
                          <p className="font-medium mb-1">После обновления .env файла:</p>
                          <ol className="list-decimal list-inside space-y-1">
                            <li>Перезапустите сервер разработки</li>
                            <li>Попробуйте зарегистрироваться с вашей почтой</li>
                            <li>Проверьте, приходит ли письмо с подтверждением</li>
                          </ol>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
                <Mail className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Выберите почтовый провайдер
                </h3>
                <p className="text-gray-600">
                  Выберите провайдера из списка слева, чтобы увидеть инструкции по настройке
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
