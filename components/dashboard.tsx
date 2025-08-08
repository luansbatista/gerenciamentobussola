"use client"

import { useEffect, useState } from 'react'
import { useAuth } from './auth-provider'
import { Sidebar } from './sidebar'
import { EntriesDashboard } from './entries-dashboard'
import { StudyFormEnhanced } from './study-form-enhanced'
import { PomodoroTimer } from './pomodoro-timer'
import { SettingsPage } from './settings-page'
import { GlobalRanking } from './global-ranking'
import { StudyRecordsPage } from './study-records-page'
import { ReviewPage } from './review-page'
import { FlashcardsPage } from './flashcards-page'
import { QuestionBankPage } from './question-bank-page' // Importa a nova página do banco de questões
import { SimulationListPage } from './simulation-list-page' // Importa a nova página de simulados
import { AdminQuestionForm } from './admin-question-form' // Importa o formulário admin de questões
import { AdminSimulationForm } from './admin-simulation-form' // Importa o formulário admin de simulados
import { AdminDashboard } from './admin-dashboard' // Importa o dashboard administrativo
import { PdfsPage } from './pdfs-page' // Importa a página de PDFs
import { AdminPdfsPage } from './admin-pdfs-page' // Importa a página admin de PDFs
import { SimulationsPage } from './simulations-page' // Importa a página de simulados
import { AdminSimulationsPage } from './admin-simulations-page' // Importa a página admin de simulados

import { ErrorBoundary } from './error-boundary'

export function Dashboard() {
  const { user, loading } = useAuth()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [todayLabel, setTodayLabel] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    try {
      const label = new Date().toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      })
      setTodayLabel(label)
    } catch {
      // ignore
    }
  }, [])

  // Tratamento de erro para evitar travamentos
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('Erro capturado:', event.error)
      setError(event.error?.message || 'Erro desconhecido')
    }

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Promise rejeitada:', event.reason)
      setError(event.reason?.message || 'Erro de carregamento')
    }

    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [])

  const renderContent = () => {
    try {
      switch (activeTab) {
        case 'dashboard':
          return <ErrorBoundary><EntriesDashboard /></ErrorBoundary>

        case 'study':
          return <ErrorBoundary><StudyFormEnhanced /></ErrorBoundary>
        case 'pomodoro':
          return <ErrorBoundary><PomodoroTimer /></ErrorBoundary>
        case 'records':
          return <ErrorBoundary><StudyRecordsPage /></ErrorBoundary>
        case 'ranking':
          return <ErrorBoundary><GlobalRanking /></ErrorBoundary>
        case 'review':
          return <ErrorBoundary><ReviewPage /></ErrorBoundary>
        case 'flashcards':
          return <ErrorBoundary><FlashcardsPage /></ErrorBoundary>
        case 'settings':
          return <ErrorBoundary><SettingsPage /></ErrorBoundary>
        case 'question-bank': // NOVO: Caso para a página do banco de questões
          return <ErrorBoundary><QuestionBankPage /></ErrorBoundary>
        case 'simulations': // NOVO: Caso para a página de simulados
          return <ErrorBoundary><SimulationsPage /></ErrorBoundary>
        case 'admin-questions': // NOVO: Caso para o formulário admin de questões
          return <ErrorBoundary><AdminQuestionForm /></ErrorBoundary>
        case 'admin-simulations': // NOVO: Caso para admin de simulados
          return <ErrorBoundary><AdminSimulationsPage /></ErrorBoundary>
        case 'admin-dashboard': // NOVO: Caso para o dashboard administrativo
          return <ErrorBoundary><AdminDashboard /></ErrorBoundary>
        case 'pdfs': // NOVO: Caso para a página de PDFs
          return <ErrorBoundary><PdfsPage /></ErrorBoundary>
        case 'admin-pdfs': // NOVO: Caso para a página admin de PDFs
          return <ErrorBoundary><AdminPdfsPage /></ErrorBoundary>
        default:
          return <ErrorBoundary><EntriesDashboard /></ErrorBoundary>
      }
    } catch (error) {
      console.error('Erro ao renderizar conteúdo:', error)
      return (
        <div className="text-center p-8">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Erro ao Carregar</h2>
          <p className="text-gray-600 mb-4">
            Ocorreu um erro ao carregar esta página.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Recarregar Página
          </button>
        </div>
      )
    }
  }

  const getPageTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return user?.user_metadata?.name 
          ? `Olá, ${user.user_metadata.name.split(' ')[0]}. Seja bem-vindo!`
          : 'Dashboard de Lançamentos'

      case 'study':
        return 'Lançamento de Informações'
      case 'pomodoro':
        return 'Timer Pomodoro'
      case 'records':
        return 'Meus Registros de Estudo'
      case 'ranking':
        return 'Ranking Geral'
      case 'review':
        return 'Assuntos para Revisão'
      case 'flashcards':
        return 'Gerenciador de Flashcards'
      case 'settings':
        return 'Configurações'
      case 'question-bank': // NOVO: Título para o banco de questões
        return 'Banco de Questões'
      case 'simulations': // NOVO: Título para simulados
        return 'Simulados PMBA'
      case 'admin-questions': // NOVO: Título para admin de questões
        return 'Gerenciar Questões'
      case 'admin-simulations': // NOVO: Título para admin de simulados
        return 'Gerenciar Simulados'
      case 'admin-dashboard': // NOVO: Título para dashboard administrativo
        return 'Dashboard Administrativo'
      case 'pdfs': // NOVO: Título para a página de PDFs
        return 'PDFs das Disciplinas'
      case 'admin-pdfs': // NOVO: Título para a página admin de PDFs
        return 'Gerenciar PDFs'
      default:
        return user?.user_metadata?.name 
          ? `Olá, ${user.user_metadata.name.split(' ')[0]}. Seja bem-vindo!`
          : 'Dashboard de Lançamentos'
    }
  }

  const getPageDescription = () => {
    switch (activeTab) {
      case 'dashboard':
        return 'Visão geral do seu desempenho e progresso nos estudos'

      case 'study':
        return 'Registre seus resultados e tempo de estudo por disciplina'
      case 'pomodoro':
        return 'Use a técnica Pomodoro para manter o foco nos estudos'
      case 'records':
        return 'Visualize e exporte todas as suas sessões de estudo'
      case 'ranking':
        return 'Compare seu desempenho com outros usuários'
      case 'review':
        return 'Revise os assuntos de acordo com a curva do esquecimento'
      case 'flashcards':
        return 'Crie e revise seus flashcards para memorização eficaz'
      case 'settings':
        return 'Ajuste preferências da sua conta e do sistema'
      case 'question-bank': // NOVO: Descrição para o banco de questões
        return 'Pratique questões de diversas disciplinas e assuntos'
      case 'simulations': // NOVO: Descrição para simulados
        return 'Acesse simulados organizados por disciplina'
      case 'admin-questions': // NOVO: Descrição para admin de questões
        return 'Adicione e importe questões para o banco de dados'
      case 'admin-simulations': // NOVO: Descrição para admin de simulados
        return 'Adicione, edite e gerencie simulados do sistema'
      case 'admin-dashboard': // NOVO: Descrição para dashboard administrativo
        return 'Visão geral de todos os usuários e estatísticas do sistema'
      case 'pdfs': // NOVO: Descrição para a página de PDFs
        return 'Acesse materiais de estudo organizados por disciplina'
      case 'admin-pdfs': // NOVO: Descrição para a página admin de PDFs
        return 'Gerencie os materiais de estudo das disciplinas'
      default:
        return 'Visão geral do seu desempenho e progresso nos estudos'
    }
  }

  // Mostrar loading se ainda estiver carregando
  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando...</p>
          </div>
        </div>
      </div>
    )
  }

  // Mostrar erro se houver
  if (error) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto p-6">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Erro no Sistema</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => {
                setError(null)
                window.location.reload()
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Tentar Novamente
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="flex-1 overflow-auto">
        {/* Top Bar */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {getPageTitle()}
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                {getPageDescription()}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900" suppressHydrationWarning>
                  {todayLabel || ''}
                </div>
                <div className="text-xs text-gray-500">
                  Concurso Soldado PMBA
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-6">
          {renderContent()}
        </div>
      </main>
    </div>
  )
}
