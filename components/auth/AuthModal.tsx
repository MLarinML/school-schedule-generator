'use client'

import { useState, useEffect } from 'react'
import { Eye, EyeOff, Mail, Lock, User, AlertCircle, CheckCircle } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { Button, Input, Modal } from '../ui'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  returnTo?: string
  checkoutIntent?: boolean
}

const AuthModal = ({ isOpen, onClose, returnTo, checkoutIntent }: AuthModalProps) => {
  const { login } = useAuth()
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      if (isLogin) {
        // Вход в систему
        const result = await login(email, password)
        
        if (result.success) {
          setSuccess('Вход выполнен успешно!')
          
          // Закрываем модальное окно через 1 секунду
          setTimeout(() => {
            onClose()
            
            // Принудительно обновляем страницу для обновления состояния
            if (checkoutIntent) {
              // Если пользователь хотел оформить подписку, всегда переходим на страницу подписки
              window.location.href = '/subscription#checkout'
            } else if (returnTo && returnTo !== window.location.pathname) {
              // Возвращаем на предыдущую страницу
              window.location.href = returnTo
            } else {
              // По умолчанию переходим в личный кабинет
              window.location.href = '/account'
            }
          }, 1000)
        } else {
          setError(result.error || 'Не удалось войти. Проверьте данные и попробуйте снова.')
        }
      } else {
        // Регистрация (пока не реализована)
        setError('Регистрация пока не доступна. Используйте существующий аккаунт.')
      }
    } catch (err) {
      setError('Произошла ошибка. Попробуйте снова.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleMode = () => {
    setIsLogin(!isLogin)
    setError('')
    setSuccess('')
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isLogin ? 'Вход в аккаунт' : 'Создание аккаунта'}
      size="md"
    >
      {/* Success/Error Messages */}
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
          <span className="text-green-800 font-medium">{success}</span>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <span className="text-red-800 font-medium">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {!isLogin && (
          <Input
            label="Имя"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Введите ваше имя"
            leftIcon={<User className="w-5 h-5" />}
            required={!isLogin}
          />
        )}

        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          leftIcon={<Mail className="w-5 h-5" />}
          required
        />

        <Input
          label="Пароль"
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Введите пароль"
          leftIcon={<Lock className="w-5 h-5" />}
          rightIcon={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
              aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          }
          required
        />

        {isLogin && (
          <div className="text-right">
            <a
              href="#forgot-password"
              className="text-sm text-primary-600 hover:text-primary-700 transition-colors duration-200"
            >
              Забыли пароль?
            </a>
          </div>
        )}

        <Button
          type="submit"
          isLoading={isLoading}
          className="w-full"
          size="lg"
        >
          {isLogin ? 'Войти' : 'Создать аккаунт'}
        </Button>
      </form>

      {/* Toggle mode */}
      <div className="mt-6 text-center">
        <p className="text-gray-600">
          {isLogin ? 'Нет аккаунта?' : 'Уже есть аккаунт?'}{' '}
          <button
            type="button"
            onClick={handleToggleMode}
            className="text-primary-600 hover:text-primary-700 font-medium transition-colors duration-200"
          >
            {isLogin ? 'Создать аккаунт' : 'Войти'}
          </button>
        </p>
      </div>

      {/* Additional info */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <p className="text-gray-600 text-sm text-center">
          {isLogin
            ? 'Войдите, чтобы продолжить оформление подписки'
            : 'Создайте аккаунт для доступа ко всем возможностям'
          }
        </p>
      </div>
    </Modal>
  )
}

export default AuthModal
