import './globals.css'
import { Inter } from 'next/font/google'
import { Toaster } from '@/components/ui/toaster'
import { AuthProvider } from '@/components/auth-provider'
import { createClient } from '@/utils/supabase/servidor'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Bússola da Aprovação - PMBA',
  description: 'Plataforma profissional para preparação em concursos policiais',
    generator: 'v0.dev'
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  // Buscar a sessão do usuário no servidor
  let initialUser = null
  let initialIsAdmin = false

  try {
    // Usar getSession() para SSR - mais apropriado que getUser()
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('Erro ao buscar sessão:', error)
    } else if (session?.user) {
      initialUser = session.user

      // Se houver um usuário, buscar o perfil para verificar se é admin
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', session.user.id)
        .single()

      if (profileError) {
        console.error('Erro ao buscar perfil do usuário no servidor:', profileError)
      } else if (profile) {
        initialIsAdmin = profile.is_admin
      }
    }
  } catch (error) {
    console.error('Erro ao conectar com Supabase:', error)
    // Continuar com valores padrão se houver erro
  }

  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        {/* Passar os dados iniciais do usuário e admin para o AuthProvider */}
        <AuthProvider initialUser={initialUser} initialIsAdmin={initialIsAdmin}>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  )
}
