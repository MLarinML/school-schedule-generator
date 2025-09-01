'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { CheckCircle, AlertCircle } from 'lucide-react'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import ResetPasswordForm from '@/components/auth/ResetPasswordForm'

const ResetPasswordPage = () => {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')

  const [status, setStatus] = useState<'form' | 'success' | 'error'>('form')
  const [message, setMessage] = useState('')

  const handleSuccess = () => {
    setStatus('success')
    setMessage('Пароль успешно изменен. Все активные сессии завершены для безопасности.')
  }

  const handleBackToLogin = () => {
    router.push('/')
  }

  if (status === 'success') {
    return (
      <>
        <Header onOpenAuth={() => {}} />
        <main className="min-h-screen bg-gray-50 flex items-center justify-center py-12">
          <div className="max-w-md w-full mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="text-center">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  Пароль изменен!
                </h1>
                <p className="text-gray-600 mb-6">
                  {message}
                </p>
                <button
                  onClick={handleBackToLogin}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                >
                  Войти в аккаунт
                </button>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  if (status === 'error') {
    return (
      <>
        <Header onOpenAuth={() => {}} />
        <main className="min-h-screen bg-gray-50 flex items-center justify-center py-12">
          <div className="max-w-md w-full mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="text-center">
                <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  Ошибка сброса пароля
                </h1>
                <p className="text-gray-600 mb-6">
                  {message}
                </p>
                <button
                  onClick={handleBackToLogin}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                >
                  Вернуться на главную
                </button>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Header onOpenAuth={() => {}} />
      <main className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-md w-full mx-auto">
          <ResetPasswordForm
            onSuccess={handleSuccess}
            onBackToLogin={handleBackToLogin}
          />
        </div>
      </main>
      <Footer />
    </>
  )
}

export default ResetPasswordPage
