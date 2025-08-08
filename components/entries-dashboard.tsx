"use client"

import { useState, useEffect, useMemo } from 'react'
import { useAuth } from './auth-provider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Clock, 
  Award, 
  Calendar,
  Users,
  BookOpen,
  Activity,
  Zap,
  Trophy,
  Eye,
  Filter,
  Download,
  Search,
  RefreshCw
} from 'lucide-react'
import { createClient } from '@/utils/supabase/cliente'
import { subjectsData } from '@/lib/subjects-data'
import { useToast } from '@/hooks/use-toast'
import { CustomProgressBar } from './custom-progress-bar'
import { Chart } from './chart'

interface StudySession {
  id: string
  date: string
  discipline: string
  subject: string
  questions_total: number
  correct_answers: number
  wrong_answers: number
  accuracy_percentage: number
  study_time_minutes: number
  avg_time_per_question: number
}

interface QuestionAnswer {
  id: string
  created_at: string
  discipline: string
  subject: string
  is_correct: boolean
  time_taken_seconds: number
}

interface DashboardStats {
  totalQuestions: number
  totalCorrect: number
  totalTime: number
  overallAccuracy: number
  studyStreak: number
  weeklyProgress: number
  monthlyProgress: number
  disciplineBreakdown: {
    discipline: string
    questions: number
    correct: number
    accuracy: number
    time: number
  }[]
  dailyActivity: {
    date: string
    questions: number
    accuracy: number
  }[]
  recentPerformance: {
    date: string
    accuracy: number
  }[]
}

interface DisciplineStats {
  discipline: string
  total_questions: number
  total_correct: number
  total_time: number
  accuracy: number
  sessions: number
  trend: 'up' | 'down' | 'stable'
}

export function EntriesDashboard() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [sessions, setSessions] = useState<StudySession[]>([])
  const [questionAnswers, setQuestionAnswers] = useState<QuestionAnswer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Filtros avançados
  const [selectedPeriod, setSelectedPeriod] = useState('30')
  const [selectedDiscipline, setSelectedDiscipline] = useState('all')

  const [showFilters, setShowFilters] = useState(false)
  const [sortBy, setSortBy] = useState('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (user && user.id) {
      fetchDashboardData()
    } else {
      setLoading(false)
    }
  }, [user, selectedPeriod, selectedDiscipline])

  const fetchDashboardData = async () => {
    if (!user || !user.id) {
      setError('Usuário não autenticado')
      setLoading(false)
      return
    }
    
    try {
      setLoading(true)
      setError(null)
      
      const supabase = createClient()
      
      // Buscar sessões de estudo
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('study_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(100)

      if (sessionsError) {
        setError(`Erro ao carregar dados: ${sessionsError.message}`)
        setLoading(false)
        return
      }

      // Buscar respostas de questões
      const { data: answersData, error: answersError } = await supabase
        .from('question_answers')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100)

      if (answersError) {
        console.error('Erro ao carregar respostas:', answersError)
      }

      setSessions(sessionsData || [])
      setQuestionAnswers(answersData || [])

    } catch (error: any) {
      setError(`Erro ao carregar dados: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  // Agregar sessões por disciplina e data
  const aggregatedSessions = useMemo(() => {
    const aggregated = new Map<string, {
      discipline: string
      date: string
      questions_total: number
      correct_answers: number
      wrong_answers: number
      study_time_minutes: number
      sessions_count: number
    }>()

    sessions.forEach((session) => {
      const key = `${session.discipline}-${session.date}`
      const existing = aggregated.get(key)
      
      if (existing) {
        existing.questions_total += session.questions_total
        existing.correct_answers += session.correct_answers
        existing.wrong_answers += session.wrong_answers
        existing.study_time_minutes += session.study_time_minutes
        existing.sessions_count += 1
      } else {
        aggregated.set(key, {
          discipline: session.discipline,
          date: session.date,
          questions_total: session.questions_total,
          correct_answers: session.correct_answers,
          wrong_answers: session.wrong_answers,
          study_time_minutes: session.study_time_minutes,
          sessions_count: 1
        })
      }
    })

    return Array.from(aggregated.values())
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10)
  }, [sessions])

  // Calcular estatísticas das sessões
  const disciplineStats = useMemo(() => {
    const disciplineMap = new Map<string, {
      total_questions: number
      total_correct: number
      total_time: number
      sessions: number
      recent_accuracy: number[]
    }>()

    sessions.forEach((session) => {
      const current = disciplineMap.get(session.discipline) || {
        total_questions: 0,
        total_correct: 0,
        total_time: 0,
        sessions: 0,
        recent_accuracy: []
      }

      current.total_questions += session.questions_total
      current.total_correct += session.correct_answers
      current.total_time += session.study_time_minutes
      current.sessions += 1
      current.recent_accuracy.push(session.accuracy_percentage)

      disciplineMap.set(session.discipline, current)
    })

    return Array.from(disciplineMap.entries()).map(([discipline, stats]) => {
      const accuracy = stats.total_questions > 0 
        ? Math.round((stats.total_correct / stats.total_questions) * 100) 
        : 0

      // Calcular tendência baseada nas últimas 3 sessões
      const recentAccuracy = stats.recent_accuracy.slice(-3)
      let trend: 'up' | 'down' | 'stable' = 'stable'
      
      if (recentAccuracy.length >= 2) {
        const first = recentAccuracy[0]
        const last = recentAccuracy[recentAccuracy.length - 1]
        if (last > first + 5) trend = 'up'
        else if (last < first - 5) trend = 'down'
      }

      return {
        discipline,
        total_questions: stats.total_questions,
        total_correct: stats.total_correct,
        total_time: stats.total_time,
        accuracy,
        sessions: stats.sessions,
        trend
      }
    }).sort((a, b) => b.total_questions - a.total_questions)
  }, [sessions])

  // Calcular estatísticas gerais do dashboard
  const dashboardStats = useMemo((): DashboardStats => {
    const totalQuestions = sessions.reduce((sum, session) => sum + session.questions_total, 0)
    const totalCorrect = sessions.reduce((sum, session) => sum + session.correct_answers, 0)
    const totalTime = sessions.reduce((sum, session) => sum + session.study_time_minutes, 0)
    const overallAccuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0

    // Calcular streak de estudos (dias consecutivos)
    const dates = [...new Set(sessions.map(s => s.date))].sort()
    let studyStreak = 0
    let currentStreak = 0
    const today = new Date().toISOString().split('T')[0]
    
    for (let i = dates.length - 1; i >= 0; i--) {
      const date = dates[i]
      const nextDate = i > 0 ? dates[i - 1] : null
      
      if (nextDate) {
        const current = new Date(date)
        const next = new Date(nextDate)
        const diffDays = Math.floor((current.getTime() - next.getTime()) / (1000 * 60 * 60 * 24))
        
        if (diffDays === 1) {
          currentStreak++
        } else {
          currentStreak = 1
        }
      } else {
        currentStreak = 1
      }
      
      studyStreak = Math.max(studyStreak, currentStreak)
    }

    // Calcular progresso semanal e mensal
    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const weeklyQuestions = sessions
      .filter(s => new Date(s.date) >= weekAgo)
      .reduce((sum, s) => sum + s.questions_total, 0)

    const monthlyQuestions = sessions
      .filter(s => new Date(s.date) >= monthAgo)
      .reduce((sum, s) => sum + s.questions_total, 0)

    // Breakdown por disciplina
    const disciplineBreakdown = disciplineStats.map(stat => ({
      discipline: stat.discipline,
      questions: stat.total_questions,
      correct: stat.total_correct,
      accuracy: stat.accuracy,
      time: stat.total_time
    }))

    // Atividade diária (últimos 7 dias)
    const dailyActivity = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      const dateStr = date.toISOString().split('T')[0]
      const daySessions = sessions.filter(s => s.date === dateStr)
      const questions = daySessions.reduce((sum, s) => sum + s.questions_total, 0)
      const accuracy = daySessions.length > 0 
        ? Math.round(daySessions.reduce((sum, s) => sum + s.accuracy_percentage, 0) / daySessions.length)
        : 0

      return { 
        date: dateStr,
        questions,
        accuracy
      }
    }).reverse()

    // Performance recente (últimas 10 sessões)
    const recentPerformance = sessions.slice(0, 10).map(session => ({
      date: session.date,
      accuracy: session.accuracy_percentage
    }))

      return { 
      totalQuestions,
      totalCorrect,
      totalTime,
      overallAccuracy,
      studyStreak,
      weeklyProgress: weeklyQuestions,
      monthlyProgress: monthlyQuestions,
      disciplineBreakdown,
      dailyActivity,
      recentPerformance
    }
  }, [sessions, disciplineStats])

  // Filtrar dados baseado nos filtros selecionados
  const filteredSessions = useMemo(() => {
    let filtered = [...sessions]

    // Filtro por disciplina
    if (selectedDiscipline !== 'all') {
      filtered = filtered.filter(s => s.discipline === selectedDiscipline)
    }

    // Filtro por período
    if (selectedPeriod !== 'all') {
      const days = parseInt(selectedPeriod)
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - days)
      filtered = filtered.filter(s => new Date(s.date) >= cutoffDate)
    }



    // Filtro por busca
    if (searchTerm) {
      filtered = filtered.filter(s => 
        s.discipline.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.subject.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Ordenação
    filtered.sort((a, b) => {
      let comparison = 0
      switch (sortBy) {
        case 'date':
          comparison = new Date(b.date).getTime() - new Date(a.date).getTime()
          break
        case 'discipline':
          comparison = a.discipline.localeCompare(b.discipline)
          break
        case 'accuracy':
          comparison = b.accuracy_percentage - a.accuracy_percentage
          break
        case 'questions':
          comparison = b.questions_total - a.questions_total
          break
        default:
          comparison = new Date(b.date).getTime() - new Date(a.date).getTime()
      }
      return sortOrder === 'asc' ? -comparison : comparison
    })

    return filtered
  }, [sessions, selectedDiscipline, selectedPeriod, searchTerm, sortBy, sortOrder])

  const getAccuracyFeedback = (accuracy: number) => {
    if (accuracy >= 80) return { text: 'Excelente!', color: 'text-green-600', bg: 'bg-green-100' }
    if (accuracy >= 60) return { text: 'Bom!', color: 'text-yellow-600', bg: 'bg-yellow-100' }
    return { text: 'Precisa melhorar', color: 'text-red-600', bg: 'bg-red-100' }
  }

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'down': return <TrendingDown className="h-4 w-4 text-red-600" />
      default: return <BarChart3 className="h-4 w-4 text-gray-600" />
    }
  }

  const handleExport = async () => {
    try {
      const { default: XLSX } = await import('xlsx')
      
      const exportData = filteredSessions.map(session => ({
        Data: session.date,
        Disciplina: session.discipline,
        Assunto: session.subject,
        'Total de Questões': session.questions_total,
        'Acertos': session.correct_answers,
        'Erros': session.wrong_answers,
        'Precisão (%)': session.accuracy_percentage,
        'Tempo (min)': session.study_time_minutes,
        'Tempo Médio por Questão (min)': session.avg_time_per_question
      }))

      const ws = XLSX.utils.json_to_sheet(exportData)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Sessões de Estudo')
      
      const fileName = `sessoes_estudo_${new Date().toISOString().split('T')[0]}.xlsx`
      XLSX.writeFile(wb, fileName)
      
      toast({
        title: "Exportação concluída",
        description: `Dados exportados para ${fileName}`,
      })
    } catch (error) {
      toast({
        title: "Erro na exportação",
        description: "Não foi possível exportar os dados",
        variant: "destructive"
      })
    }
  }

  const handleRefresh = () => {
    fetchDashboardData()
    toast({
      title: "Dados atualizados",
      description: "Dashboard atualizado com sucesso",
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={fetchDashboardData} variant="outline">
          Tentar novamente
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header com filtros */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <p className="text-gray-600">Acompanhe seu progresso de estudos</p>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button onClick={handleExport} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button 
            onClick={() => setShowFilters(!showFilters)} 
            variant={showFilters ? "default" : "outline"} 
            size="sm"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </Button>
        </div>
      </div>

      {/* Filtros avançados */}
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filtros Avançados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Período</label>
                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">Últimos 7 dias</SelectItem>
                    <SelectItem value="30">Últimos 30 dias</SelectItem>
                    <SelectItem value="90">Últimos 90 dias</SelectItem>
                    <SelectItem value="all">Todo período</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Disciplina</label>
                <Select value={selectedDiscipline} onValueChange={setSelectedDiscipline}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as disciplinas</SelectItem>
                    {subjectsData.map(subject => (
                      <SelectItem key={subject.name} value={subject.name}>
                        {subject.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Ordenar por</label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">Data</SelectItem>
                    <SelectItem value="discipline">Disciplina</SelectItem>
                    <SelectItem value="accuracy">Precisão</SelectItem>
                    <SelectItem value="questions">Questões</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Buscar</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Disciplina ou assunto..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Métricas principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Questões</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats.totalQuestions}</div>
            <p className="text-xs text-muted-foreground">
              {dashboardStats.totalCorrect} acertos ({dashboardStats.overallAccuracy}%)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tempo Total</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats.totalTime}h</div>
            <p className="text-xs text-muted-foreground">
              Média de {dashboardStats.totalTime > 0 ? Math.round(dashboardStats.totalTime / sessions.length) : 0}h por sessão
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Streak de Estudos</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats.studyStreak}</div>
            <p className="text-xs text-muted-foreground">
              dias consecutivos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Progresso Semanal</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats.weeklyProgress}</div>
            <p className="text-xs text-muted-foreground">
              questões esta semana
            </p>
          </CardContent>
        </Card>
              </div>

      {/* Gráficos e análises */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Atividade Diária (Últimos 7 dias)</CardTitle>
            <CardDescription>Questões respondidas por dia</CardDescription>
          </CardHeader>
          <CardContent>
            <Chart
              data={dashboardStats.dailyActivity.map(day => ({
                label: new Date(day.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
                value: day.questions,
                color: '#3b82f6'
              }))}
              type="bar"
              width={400}
              height={200}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance por Disciplina</CardTitle>
            <CardDescription>Precisão média por disciplina</CardDescription>
          </CardHeader>
          <CardContent>
            <Chart
              data={dashboardStats.disciplineBreakdown.map(disc => ({
                label: disc.discipline,
                value: disc.accuracy,
                color: disc.accuracy >= 80 ? '#10b981' : disc.accuracy >= 60 ? '#f59e0b' : '#ef4444'
              }))}
              type="bar"
              width={400}
              height={200}
            />
          </CardContent>
        </Card>
      </div>

      {/* Estatísticas por disciplina */}
      <Card>
        <CardHeader>
          <CardTitle>Desempenho por Disciplina</CardTitle>
          <CardDescription>Análise detalhada do seu progresso</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="space-y-4">
              {disciplineStats.map((stat) => {
                const feedback = getAccuracyFeedback(stat.accuracy)
                return (
                <div key={stat.discipline} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      {getTrendIcon(stat.trend)}
                      <div>
                        <h3 className="font-semibold">{stat.discipline}</h3>
                        <p className="text-sm text-gray-600">
                          {stat.sessions} sessões • {stat.total_time}h
                        </p>
                      </div>
                      </div>
                    </div>
                    
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="font-semibold">{stat.total_questions} questões</p>
                      <p className="text-sm text-gray-600">
                        {stat.total_correct} acertos
                      </p>
                    </div>

                    <div className="text-right">
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${feedback.bg} ${feedback.color}`}>
                          {stat.accuracy}%
                        </span>
                        <span className="text-sm text-gray-600">{feedback.text}</span>
                      </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
        </CardContent>
      </Card>

      {/* Sessões recentes unificadas */}
      <Card>
        <CardHeader>
          <CardTitle>Sessões Recentes</CardTitle>
          <CardDescription>Sessões unificadas por disciplina e data</CardDescription>
        </CardHeader>
        <CardContent>
          {aggregatedSessions.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Nenhuma sessão encontrada</p>
              <p className="text-sm text-gray-500">Comece a estudar para ver suas sessões aqui</p>
            </div>
          ) : (
            <div className="space-y-4">
              {aggregatedSessions.map((session, index) => {
                const accuracy = session.questions_total > 0 
                  ? Math.round((session.correct_answers / session.questions_total) * 100) 
                  : 0
                const feedback = getAccuracyFeedback(accuracy)
                
                return (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <BookOpen className="h-5 w-5 text-blue-600" />
                        </div>
                      </div>
                      
                  <div>
                        <h3 className="font-semibold">{session.discipline}</h3>
                        <p className="text-sm text-gray-600">
                          {new Date(session.date).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          })} • {session.sessions_count} sessão{session.sessions_count > 1 ? 'ões' : ''}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-6">
                      <div className="text-right">
                        <p className="font-semibold">{session.questions_total} questões</p>
                        <p className="text-sm text-gray-600">
                          {session.correct_answers} acertos • {session.wrong_answers} erros
                        </p>
                  </div>
                      
                  <div className="text-right">
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${feedback.bg} ${feedback.color}`}>
                            {accuracy}%
                          </span>
                    </div>
                        <p className="text-sm text-gray-600">{session.study_time_minutes}min</p>
                    </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
