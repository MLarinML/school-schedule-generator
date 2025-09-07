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
import { SubscriptionStatus } from '../components/subscription'
import { smoothScrollTo } from '../lib/utils/smoothScroll'

export default function Home() {
  const { isAuthModalOpen, closeAuthModal, returnTo, checkoutIntent, openAuthModal, user } = useAuth()

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
      // Увеличиваем задержку для полной загрузки страницы и всех компонентов
      const timer = setTimeout(() => {
        try {
          smoothScrollTo(elementId, 80)
        } catch (error) {
          console.warn('Error auto-scrolling to element:', error)
        }
      }, 300)
      
      return () => clearTimeout(timer)
    }
  }, [])

  return (
    <>
      <main className="min-h-screen">
        <Header onOpenAuth={(returnTo, checkoutIntent) => openAuthModal(returnTo, checkoutIntent)} />
        <Hero onOpenAuth={(returnTo, checkoutIntent) => openAuthModal(returnTo, checkoutIntent)} />
        
        {/* Subscription Status for logged in users */}
        {user && (
          <section className="py-8 bg-gray-50">
            <div className="container-custom">
              <div className="max-w-4xl mx-auto">
                <SubscriptionStatus />
              </div>
            </div>
          </section>
        )}
        
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
