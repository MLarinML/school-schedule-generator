import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '../contexts/AuthContext'

export const metadata: Metadata = {
  title: 'УмноеРасписание - Автоматическое создание школьных расписаний',
  description: 'Создавайте корректные школьные расписания за минуты с учётом блокеров учителей и школьных норм. Автоматическая генерация, объяснение конфликтов и экспорт.',
  keywords: 'школьное расписание, генератор расписаний, планировщик уроков, школа, завуч, УмноеРасписание',
  authors: [{ name: 'УмноеРасписание' }],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru">
      <body className="antialiased text-gray-900 bg-white">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
