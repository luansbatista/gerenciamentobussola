"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from './auth-provider'
import { createClient } from '@/utils/supabase/cliente'
import { Mail, Lock, User, Loader2, Eye, EyeOff } from 'lucide-react'
import Image from 'next/image' // Importar Image
import { Users, Target, Award } from 'lucide-react' // Remover Shield

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn, signUp } = useAuth()
  const { toast } = useToast()

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await signIn(email, password)
      toast({
        title: "Login realizado com sucesso!",
        description: "Bem-vindo de volta ao Bússola da Aprovação.",
      })
    } catch (error: any) {
      toast({
        title: "Erro no login",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await signUp(email, password, name)
      toast({
        title: "Conta criada com sucesso!",
        description: "Verifique seu e-mail para confirmar a conta.",
      })
    } catch (error: any) {
      toast({
        title: "Erro no cadastro",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`, // Redireciona para uma página de atualização de senha
      })

      if (error) throw error

      toast({
        title: "E-mail de recuperação enviado!",
        description: "Verifique sua caixa de entrada (e spam) para o link de redefinição de senha.",
      })
    } catch (error: any) {
      toast({
        title: "Erro ao recuperar senha",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4" suppressHydrationWarning>
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('/placeholder-8skwu.png')] opacity-5"></div>
      
      <div className="relative z-10 w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        {/* Left Side - Branding */}
        <div className="text-white space-y-8">
          <div className="space-y-4">
            <div className="space-y-4">
              <div className="flex justify-center mb-4">
                <Image
                  src="/images/bussola-da-aprovacao-logo.png"
                  alt="Bússola da Aprovação Logo"
                  width={300}
                  height={300}
                  className="h-auto w-auto max-h-24"
                />
              </div>
              <div className="text-center">
                <h1 className="text-4xl font-bold">Sistema Bússola da Aprovação</h1>
                <p className="text-blue-200">Sistema de estudos para o concurso da PMBA.</p>
              </div>
            </div>
            
            <p className="text-xl text-gray-300 leading-relaxed">
              A plataforma mais completa para sua preparação em concursos policiais. 
              Organize seus estudos, acompanhe seu progresso e alcance a aprovação.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="text-center space-y-2">
              <div className="bg-slate-800 p-4 rounded-lg">
                <Target className="h-8 w-8 text-blue-400 mx-auto" />
              </div>
              <h3 className="font-semibold">Foco Total</h3>
              <p className="text-sm text-gray-400">Técnica Pomodoro integrada</p>
            </div>
            
            <div className="text-center space-y-2">
              <div className="bg-slate-800 p-4 rounded-lg">
                <Award className="h-8 w-8 text-green-400 mx-auto" />
              </div>
              <h3 className="font-semibold">Resultados</h3>
              <p className="text-sm text-gray-400">Acompanhe sua evolução</p>
            </div>
            
            <div className="text-center space-y-2">
              <div className="bg-slate-800 p-4 rounded-lg">
                <Users className="h-8 w-8 text-purple-400 mx-auto" />
              </div>
              <h3 className="font-semibold">Comunidade</h3>
              <p className="text-sm text-gray-400">Compare com outros</p>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <Card className="w-full max-w-md mx-auto bg-white/95 backdrop-blur-sm shadow-2xl">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl text-gray-900">Acesse sua conta</CardTitle>
            <CardDescription className="text-gray-600">
              Entre ou crie sua conta para começar seus estudos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="signin" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                  Entrar
                </TabsTrigger>
                <TabsTrigger value="signup" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                  Cadastrar
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-gray-700">E-mail</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu@email.com"
                      className="border-gray-300 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-gray-700">Senha</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="border-gray-300 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div className="text-right text-sm">
                    <button
                      type="button" // Importante: use type="button" para não submeter o formulário
                      onClick={handleForgotPassword}
                      className="text-blue-600 hover:underline"
                      disabled={loading}
                    >
                      Esqueceu a senha?
                    </button>
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5" 
                    disabled={loading}
                  >
                    {loading ? "Entrando..." : "Entrar"}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-gray-700">Nome completo</Label>
                    <Input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Seu nome completo"
                      className="border-gray-300 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-gray-700">E-mail</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu@email.com"
                      className="border-gray-300 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-gray-700">Senha</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="border-gray-300 focus:border-blue-500"
                      required
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5" 
                    disabled={loading}
                  >
                    {loading ? "Cadastrando..." : "Criar Conta"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center">
                Ao criar uma conta, você concorda com nossos termos de uso e política de privacidade.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
