"use client"

import { useEffect } from 'react'
import { createClient } from '@/utils/supabase/cliente'

export default function LogoutPage() {
  useEffect(() => {
    const run = async () => {
      try {
        const supabase = createClient()
        // encerra todas as sessões
        // @ts-ignore - escopo opcional
        await supabase.auth.signOut({ scope: 'global' })
      } catch {}
      try {
        // limpa localStorage do supabase
        if (typeof window !== 'undefined') {
          Object.keys(window.localStorage || {}).forEach((k) => {
            if (k.toLowerCase().startsWith('sb-')) {
              window.localStorage.removeItem(k)
            }
          })
        }
      } catch {}
      // redirecionar
      window.location.replace('/')
    }
    run()
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center text-slate-600">
      Saindo...
    </div>
  )
}
