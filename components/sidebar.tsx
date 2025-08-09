"use client"

import { useState } from 'react'
import { useAuth } from './auth-provider'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Image from 'next/image'
import { Calendar, BookOpen, Timer, BarChart3, Settings, LogOut, User, ChevronLeft, ChevronRight, Trophy, List, Repeat, BookText, HelpCircle, FileQuestion, FileText, Shield, TrendingUp, FileText as FileTextIcon } from 'lucide-react'
import { useRouter } from 'next/navigation' // Importar useRouter

interface SidebarProps {
  activeTab: string
  setActiveTab: (tab: string) => void
}

export function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const { user, signOut } = useAuth()
  const [collapsed, setCollapsed] = useState(false)
  const router = useRouter() // Inicializar useRouter

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: BarChart3,
      description: 'Visão geral dos lançamentos',
      color: 'text-blue-500',
      priority: 1
    },
    {
      id: 'study',
      label: 'Lançamentos',
      icon: BookOpen,
      description: 'Registrar estudos',
      color: 'text-emerald-500',
      priority: 2
    },
    {
      id: 'question-bank',
      label: 'Materiais de Estudo',
      icon: FileQuestion,
      description: 'Acesse questões, simulados e PDFs',
      color: 'text-violet-500',
      priority: 3
    },
    {
      id: 'study-tools',
      label: 'Ferramentas de Estudo',
      icon: Repeat,
      description: 'Revisões, flashcards e pomodoro',
      color: 'text-amber-500',
      priority: 4
    },
    {
      id: 'records',
      label: 'Meus Registros',
      icon: List,
      description: 'Histórico de estudos',
      color: 'text-cyan-500',
      priority: 6
    },
    {
      id: 'ranking',
      label: 'Ranking Geral',
      icon: Trophy,
      description: 'Compare seu desempenho',
      color: 'text-yellow-500',
      priority: 7
    },
    {
      id: 'settings',
      label: 'Configurações',
      icon: Settings,
      description: 'Ajustes do sistema',
      color: 'text-slate-500',
      priority: 9
    },
  ]

  const adminMenuItems = [
    {
      id: 'admin-dashboard',
      label: 'Dashboard Admin',
      icon: Shield,
      description: 'Visão geral do sistema',
      color: 'text-red-500',
      priority: 1
    },
    {
      id: 'admin-questions',
      label: 'Gerenciar Questões',
      icon: FileQuestion,
      description: 'Adicionar/Importar questões',
      color: 'text-violet-500',
      priority: 2
    },
    {
      id: 'admin-simulations',
      label: 'Gerenciar Simulados',
      icon: FileText,
      description: 'Criar/Editar simulados',
      color: 'text-indigo-500',
      priority: 3
    },
    {
      id: 'admin-pdfs',
      label: 'Gerenciar PDFs',
      icon: FileTextIcon,
      description: 'Importar e gerenciar materiais',
      color: 'text-rose-500',
      priority: 4
    },
    {
      id: 'admin-subscriptions',
      label: 'Gerenciar Assinaturas',
      icon: Shield,
      description: 'Ativar/Desativar acesso de usuários',
      color: 'text-emerald-500',
      priority: 5
    },
  ]

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (_) {
      // ignorar
    } finally {
      if (typeof window !== 'undefined') {
        window.location.href = '/logout'
      } else {
        router.replace('/logout')
      }
    }
  }

  return (
    <div className={`bg-slate-900 text-white transition-all duration-300 ${collapsed ? 'w-16' : 'w-72'} min-h-screen flex flex-col`}>
      {/* Header */}
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center justify-center w-full">
              <Image
                src="/images/bussola-da-aprovacao-logo.png"
                alt="Bússola da Aprovação Logo"
                width={300}
                height={300}
                className="h-auto w-auto max-h-24"
              />
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
            className="text-slate-400 hover:text-white hover:bg-slate-800"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center space-x-3">
          <div className="bg-slate-700 p-2 rounded-full">
            <User className="h-5 w-5 text-slate-300" />
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user?.user_metadata?.name || 'Usuário'}
              </p>
              <p className="text-xs text-slate-400 truncate">
                {user?.email}
              </p>
              <Badge variant="secondary" className="mt-1 bg-blue-600 text-white text-xs">
                Concurseiro PMBA
              </Badge>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <div className="space-y-2">
          {menuItems
            .sort((a, b) => a.priority - b.priority)
            .map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.id
            
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg transition-all duration-200 ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-lg' 
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className={`h-5 w-5 flex-shrink-0 transition-colors duration-200 ${isActive ? 'text-white' : item.color}`} />
                {!collapsed && (
                  <div className="text-left">
                    <div className="text-sm font-medium">{item.label}</div>
                    <div className="text-xs opacity-75">{item.description}</div>
                  </div>
                )}
              </button>
            )
          })}

          {user?.is_admin && (
            <>
              {!collapsed && (
                <div className="flex items-center space-x-3 px-3 py-2 text-slate-400 text-xs font-semibold uppercase mt-4 border-t border-slate-700 pt-4">
                  <Shield className="h-4 w-4" />
                  <span>Admin</span>
                </div>
              )}
              {adminMenuItems
                .sort((a, b) => a.priority - b.priority)
                .map((item) => {
                const Icon = item.icon
                const isActive = activeTab === item.id
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg transition-all duration-200 ${
                      isActive 
                        ? 'bg-purple-600 text-white shadow-lg' 
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <Icon className={`h-5 w-5 flex-shrink-0 transition-colors duration-200 ${isActive ? 'text-white' : item.color}`} />
                    {!collapsed && (
                      <div className="text-left">
                        <div className="text-sm font-medium">{item.label}</div>
                        <div className="text-xs opacity-75">{item.description}</div>
                      </div>
                    )}
                  </button>
                )
              })}
            </>
          )}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-700">
        <Button
          onClick={handleSignOut}
          variant="ghost"
          className="w-full justify-start text-slate-400 hover:text-white hover:bg-slate-800"
        >
          <LogOut className="h-4 w-4 mr-3" />
          {!collapsed && 'Sair'}
        </Button>
      </div>
    </div>
  )
}
