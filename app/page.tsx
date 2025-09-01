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

export default function Home() {
  const { isAuthModalOpen, closeAuthModal, returnTo, checkoutIntent, openAuthModal } = useAuth()

  // Автоматически открываем модальное окно входа, если в URL есть параметр auth=login
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('auth') === 'login') {
      openAuthModal()
    }
  }, [openAuthModal])

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
