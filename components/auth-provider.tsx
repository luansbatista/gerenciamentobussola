"use client"

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/cliente'
import type { User } from '@supabase/supabase-js'

interface AuthContextType {
  user: (User & { is_admin?: boolean }) | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, name: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: React.ReactNode
  initialUser: User | null
  initialIsAdmin: boolean
}

export function AuthProvider({ children, initialUser, initialIsAdmin }: AuthProviderProps) {
  const [user, setUser] = useState<(User & { is_admin?: boolean }) | null>(
    initialUser ? { ...initialUser, is_admin: initialIsAdmin } : null
  )
  const [loading, setLoading] = useState(false)
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    let supabase: any = null
    let retryCount = 0
    const maxRetries = 3

    const initializeSupabase = async () => {
      try {
        supabase = await createClient()
        return true
      } catch (error) {
        console.error('Falha ao criar cliente Supabase no cliente:', error)
        retryCount++
        
        if (retryCount < maxRetries) {
          console.log(`Tentativa ${retryCount} de ${maxRetries} para conectar ao Supabase`)
          setTimeout(initializeSupabase, 1000 * retryCount) // Backoff exponencial
          return false
        } else {
          console.error('Falha definitiva ao conectar ao Supabase após', maxRetries, 'tentativas')
          setInitialized(true)
          return false
        }
      }
    }

    const setupAuth = async () => {
      if (!(await initializeSupabase())) {
        return
      }
      
      // Verificar se já temos dados iniciais do servidor
      if (initialUser) {
        setInitialized(true)
      }

      if (!supabase) return

      const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: any, session: any) => {
          // Silenciar logs em produção
        
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          setLoading(true)
          let currentUser: (User & { is_admin?: boolean }) | null = session?.user ?? null
          
          if (currentUser) {
            try {
              const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('is_admin')
                .eq('id', currentUser.id)
                .single()

              if (!profileError && profile) {
                currentUser = { ...currentUser, is_admin: profile.is_admin }
              }
            } catch (error) {
              console.error('Erro ao buscar perfil:', error)
            }
          }
          
          setUser(currentUser)
          setLoading(false)
          setInitialized(true)
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          setLoading(false)
          setInitialized(true)
        } else if (event === 'INITIAL_SESSION') {
          // Manter o usuário inicial se já temos dados do servidor
          if (!initialUser && session?.user) {
            setUser({ ...session.user, is_admin: false })
          }
          setInitialized(true)
        }
      }
    )

    // Bootstrap de sessão no cliente para garantir inicialização
    // mesmo se o evento INITIAL_SESSION não disparar
    ;(async () => {
      if (initialUser) return
      
      // Timeout para evitar loading infinito
      const timeout = setTimeout(() => {
        console.warn('Timeout ao inicializar autenticação')
        setLoading(false)
        setInitialized(true)
      }, 10000) // 10 segundos

      try {
        setLoading(true)
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) {
          console.error('Erro ao buscar sessão inicial (cliente):', error)
        }
        let currentUser: (User & { is_admin?: boolean }) | null = session?.user ?? null
        if (currentUser) {
          try {
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('is_admin')
              .eq('id', currentUser.id)
              .single()
            if (!profileError && profile) {
              currentUser = { ...currentUser, is_admin: profile.is_admin }
            }
          } catch (profileErr) {
            console.error('Erro ao buscar perfil (bootstrap):', profileErr)
          }
        }
        setUser(currentUser)
      } catch (bootstrapErr) {
        console.error('Falha no bootstrap de sessão:', bootstrapErr)
      } finally {
        clearTimeout(timeout)
        setInitialized(true)
        setLoading(false)
      }
    })()

    return () => subscription.unsubscribe()
    }

    setupAuth()
  }, [initialUser])

  const signIn = async (email: string, password: string) => {
    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email: string, password: string, name: string) => {
    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
        },
      })
      if (error) throw error
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  // Não mostrar loading se já temos dados iniciais
  const isLoading = loading && !initialized

  return (
    <AuthContext.Provider value={{ user, loading: isLoading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
