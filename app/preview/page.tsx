"use client"

import { Dashboard } from '@/components/dashboard'
import { useAuth } from '@/components/auth-provider'
import { useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'

export default function PreviewPage() {
  const { toast } = useToast()

  useEffect(() => {
    toast({
      title: 'Modo demonstração',
      description: 'Apenas visualização. Ações de escrita estão desativadas.',
    })

    const onSubmit = (e: Event) => {
      e.preventDefault()
      e.stopPropagation()
      toast({ title: 'Ação desativada no modo demonstração' })
    }

    const onClick = (e: Event) => {
      const target = e.target as HTMLElement
      const button = target?.closest('button') as HTMLButtonElement | null
      const anchor = target?.closest('a') as HTMLAnchorElement | null
      // Permitir links e navegação de tabs/sidebar/header
      if (anchor) return
      if (button) {
        const role = button.getAttribute('role')
        if (role === 'tab') return
        if (button.closest('nav') || button.closest('header')) return
        // Bloquear demais botões (potenciais ações de escrita)
        e.preventDefault()
        e.stopPropagation()
        toast({ title: 'Ação desativada no modo demonstração' })
      }
    }

    document.addEventListener('submit', onSubmit, true)
    document.addEventListener('click', onClick, true)
    return () => {
      document.removeEventListener('submit', onSubmit, true)
      document.removeEventListener('click', onClick, true)
    }
  }, [toast])

  return (
    <div className="relative">
      <div className="sticky top-0 z-50 w-full bg-amber-500 text-black text-center text-sm py-2">
        Você está em modo demonstração —
        <Link href="/" className="ml-2 underline font-semibold">Assinar agora</Link>
      </div>
      <Dashboard />
    </div>
  )
}
