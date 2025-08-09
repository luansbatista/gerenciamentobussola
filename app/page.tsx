"use client"

import { useAuth } from '@/components/auth-provider'
import { LoginForm } from '@/components/login-form'
import { Dashboard } from '@/components/dashboard'
import { Loader2 } from 'lucide-react'
import { SalesPage } from '@/components/sales-page'

export default function Home() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  // Não logado → sempre tela de login
  if (!user) {
    return <LoginForm />
  }

  const isSubscribed = Boolean(user.is_subscribed)
  const isAdmin = Boolean(user.is_admin)
  if (!isAdmin && !isSubscribed) {
    return <SalesPage />
  }

  return <Dashboard />
}
