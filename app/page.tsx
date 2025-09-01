'use client'

import { useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Header, Footer } from '../components/layout'
import { 
  Hero, 
  ProblemSolution, 
  Features, 
  HowItWorks, 
  Testimonials, 
  FAQ
} from '../components/pages'
import { AuthModal } from '../components/auth'
import { smoothScrollTo } from '../lib/utils/smoothScroll'

export default function Home() {
  const { isAuthModalOpen, closeAuthModal, returnTo, checkoutIntent, openAuthModal } = useAuth()

  // Автоматически открываем модальное окно входа, если в URL есть параметр auth=login
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('auth') === 'login') {
      openAuthModal()
    }
  }, [openAuthModal])

  // Автоматически прокручиваем к нужному блоку, если в URL есть хеш
  useEffect(() => {
    if (window.location.hash) {
      const elementId = window.location.hash.substring(1)
      // Небольшая задержка для полной загрузки страницы
      setTimeout(() => {
        smoothScrollTo(elementId, 80)
      }, 100)
    }
  }, [])

  return (
    <>
      <main className="min-h-screen">
        <Header onOpenAuth={(returnTo, checkoutIntent) => openAuthModal(returnTo, checkoutIntent)} />
        <Hero onOpenAuth={(returnTo, checkoutIntent) => openAuthModal(returnTo, checkoutIntent)} />
        <ProblemSolution onOpenAuth={(returnTo, checkoutIntent) => openAuthModal(returnTo, checkoutIntent)} />
        <Features />
        <HowItWorks onOpenAuth={(returnTo, checkoutIntent) => openAuthModal(returnTo, checkoutIntent)} />
        <Testimonials />
        <FAQ onOpenAuth={(returnTo, checkoutIntent) => openAuthModal(returnTo, checkoutIntent)} />
        <Footer />
      </main>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={closeAuthModal}
        returnTo={returnTo}
        checkoutIntent={checkoutIntent}
      />
    </>
  )
}
