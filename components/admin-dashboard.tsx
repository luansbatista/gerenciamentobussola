"use client"

import { useState, useEffect, useMemo } from 'react'
import { useAuth } from './auth-provider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { 
  Users, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Clock, 
  Award, 
  Calendar,
  BookOpen,
  Activity,
  Zap,
  Trophy,
  Eye,
  Filter,
  Download,
  Search,
  UserCheck,
  UserX,
  BarChart3,
  PieChart,
  LineChart,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw
} from 'lucide-react'
import { createClient } from '@/utils/supabase/cliente'
import { subjectsData } from '@/lib/subjects-data'
import { useToast } from '@/hooks/use-toast'

interface UserStats {
  user_id: string
  user_name: string
  user_email: string
  is_admin: boolean
  created_at: string
  last_login: string
  total_questions: number
  total_correct: number
  overall_accuracy: number
  total_time: number
  study_streak: number
  discipline_stats: {
    discipline: string
    questions: number
    correct: number
    accuracy: number
  }[]
  recent_activity: {
    date: string
    questions: number
    accuracy: number
  }[]
}

interface SystemStats {
  totalUsers: number
  activeUsers: number
  inactiveUsers: number
  totalQuestions: number
  totalSessions: number
  averageAccuracy: number
  topDisciplines: {
    discipline: string
    questions: number
    users: number
  }[]
  userGrowth: {
    date: string
    newUsers: number
    activeUsers: number
  }[]
}

export function AdminDashboard() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<UserStats[]>([])
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null)
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDiscipline, setSelectedDiscipline] = useState('all')
  const [selectedPeriod, setSelectedPeriod] = useState('30')
  const [sortBy, setSortBy] = useState('questions')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [showInactive, setShowInactive] = useState(true)

  useEffect(() => {
    if (user && user.is_admin) {
      fetchAdminData()
    }
  }, [user, selectedPeriod])

  const fetchAdminData = async () => {
    if (!user || !user.is_admin) return

    setLoading(true)
    try {
      const supabase = createClient()

      // Buscar todos os usuários com suas estatísticas
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (usersError) {
        console.error('Error fetching users:', usersError)
        toast({
          title: "Erro ao carregar usuários",
          description: usersError.message,
          variant: "destructive"
        })
        return
      }

      // Buscar estatísticas de estudo para cada usuário
      const usersWithStats: UserStats[] = []
      
      for (const userProfile of usersData || []) {
        // Buscar sessões de estudo do usuário
        const { data: sessions, error: sessionsError } = await supabase
          .from('study_sessions')
          .select('*')
          .eq('user_id', userProfile.id)

        // Buscar respostas de questões do usuário
        const { data: answers, error: answersError } = await supabase
          .from('question_answers')
          .select('*')
          .eq('user_id', userProfile.id)

        if (sessionsError || answersError) {
          console.error('Error fetching user data:', sessionsError || answersError)
          continue
        }

        // Calcular estatísticas do usuário
        const allData = [
          ...(sessions || []),
          ...(answers || []).map(qa => ({
            id: qa.id,
            date: qa.created_at.split('T')[0],
            discipline: qa.discipline,
            subject: qa.subject,
            questions_total: 1,
            correct_answers: qa.is_correct ? 1 : 0,
            wrong_answers: qa.is_correct ? 0 : 1,
            accuracy_percentage: qa.is_correct ? 100 : 0,
            study_time_minutes: Math.round(qa.time_taken_seconds / 60),
            avg_time_per_question: qa.time_taken_seconds
          }))
        ]

        const totalQuestions = allData.reduce((sum, item) => sum + item.questions_total, 0)
        const totalCorrect = allData.reduce((sum, item) => sum + item.correct_answers, 0)
        const totalTime = allData.reduce((sum, item) => sum + item.study_time_minutes, 0)
        const overallAccuracy = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0

        // Calcular streak de estudo
        const dates = [...new Set(allData.map(item => item.date))].sort()
        let streak = 0
        let currentStreak = 0
        
        for (let i = dates.length - 1; i >= 0; i--) {
          const date = dates[i]
          const nextDate = i > 0 ? dates[i - 1] : null
          
          if (nextDate) {
            const date1 = new Date(date)
            const date2 = new Date(nextDate)
            const diffDays = Math.floor((date1.getTime() - date2.getTime()) / (1000 * 60 * 60 * 24))
            
            if (diffDays === 1) {
              currentStreak++
            } else {
              streak = Math.max(streak, currentStreak)
              currentStreak = 1
            }
          } else {
            currentStreak++
          }
        }
        streak = Math.max(streak, currentStreak)

        // Breakdown por disciplina
        const disciplineMap = new Map<string, { questions: number; correct: number }>()
        allData.forEach(item => {
          const existing = disciplineMap.get(item.discipline) || { questions: 0, correct: 0 }
          existing.questions += item.questions_total
          existing.correct += item.correct_answers
          disciplineMap.set(item.discipline, existing)
        })

        const disciplineStats = Array.from(disciplineMap.entries()).map(([discipline, data]) => ({
          discipline,
          questions: data.questions,
          correct: data.correct,
          accuracy: data.questions > 0 ? (data.correct / data.questions) * 100 : 0
        }))

        // Atividade recente
        const dailyMap = new Map<string, { questions: number; correct: number }>()
        allData.forEach(item => {
          const existing = dailyMap.get(item.date) || { questions: 0, correct: 0 }
          existing.questions += item.questions_total
          existing.correct += item.correct_answers
          dailyMap.set(item.date, existing)
        })

        const recentActivity = Array.from(dailyMap.entries()).map(([date, data]) => ({
          date,
          questions: data.questions,
          accuracy: data.questions > 0 ? (data.correct / data.questions) * 100 : 0
        })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 7)

        usersWithStats.push({
          user_id: userProfile.id,
          user_name: userProfile.name || 'Usuário Anônimo',
          user_email: userProfile.email,
          is_admin: userProfile.is_admin || false,
          created_at: userProfile.created_at,
          last_login: userProfile.updated_at,
          total_questions: totalQuestions,
          total_correct: totalCorrect,
          overall_accuracy: overallAccuracy,
          total_time: totalTime,
          study_streak: streak,
          discipline_stats: disciplineStats,
          recent_activity: recentActivity
        })
      }

      setUsers(usersWithStats)

      // Calcular estatísticas do sistema
      const totalUsers = usersWithStats.length
      const activeUsers = usersWithStats.filter(u => u.total_questions > 0).length
      const inactiveUsers = totalUsers - activeUsers
      const totalQuestions = usersWithStats.reduce((sum, u) => sum + u.total_questions, 0)
      const totalSessions = usersWithStats.reduce((sum, u) => sum + u.recent_activity.length, 0)
      const averageAccuracy = usersWithStats.length > 0 
        ? usersWithStats.reduce((sum, u) => sum + u.overall_accuracy, 0) / usersWithStats.length 
        : 0

      // Top disciplinas
      const disciplineMap = new Map<string, { questions: number; users: number }>()
      usersWithStats.forEach(user => {
        user.discipline_stats.forEach(stat => {
          const existing = disciplineMap.get(stat.discipline) || { questions: 0, users: 0 }
          existing.questions += stat.questions
          existing.users += 1
          disciplineMap.set(stat.discipline, existing)
        })
      })

      const topDisciplines = Array.from(disciplineMap.entries())
        .map(([discipline, data]) => ({
          discipline,
          questions: data.questions,
          users: data.users
        }))
        .sort((a, b) => b.questions - a.questions)
        .slice(0, 5)

      // Crescimento de usuários (simulado)
      const userGrowth = []
      const now = new Date()
      for (let i = 30; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
        const dateStr = date.toISOString().split('T')[0]
        const newUsers = usersWithStats.filter(u => 
          u.created_at.split('T')[0] === dateStr
        ).length
        const activeUsers = usersWithStats.filter(u => 
          u.recent_activity.some(a => a.date === dateStr)
        ).length

        userGrowth.push({
          date: dateStr,
          newUsers,
          activeUsers
        })
      }

      setSystemStats({
        totalUsers,
        activeUsers,
        inactiveUsers,
        totalQuestions,
        totalSessions,
        averageAccuracy,
        topDisciplines,
        userGrowth
      })

    } catch (error: any) {
      console.error('Error fetching admin data:', error)
      toast({
        title: "Erro ao carregar dados",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Filtrar e ordenar usuários
  const filteredUsers = useMemo(() => {
    let filtered = users.filter(user => {
      const matchesSearch = user.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           user.user_email.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesDiscipline = selectedDiscipline === 'all' || 
                               user.discipline_stats.some(d => d.discipline === selectedDiscipline)
      const matchesActivity = showInactive || user.total_questions > 0
      
      return matchesSearch && matchesDiscipline && matchesActivity
    })

    // Ordenar
    filtered.sort((a, b) => {
      let aValue: any, bValue: any
      
      switch (sortBy) {
        case 'questions':
          aValue = a.total_questions
          bValue = b.total_questions
          break
        case 'accuracy':
          aValue = a.overall_accuracy
          bValue = b.overall_accuracy
          break
        case 'time':
          aValue = a.total_time
          bValue = b.total_time
          break
        case 'streak':
          aValue = a.study_streak
          bValue = b.study_streak
          break
        case 'name':
          aValue = a.user_name
          bValue = b.user_name
          break
        default:
          aValue = a.total_questions
          bValue = b.total_questions
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    return filtered
  }, [users, searchTerm, selectedDiscipline, showInactive, sortBy, sortOrder])

  if (!user?.is_admin) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <Shield className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Acesso Negado</h2>
          <p className="text-gray-600">Você não tem permissão para acessar o dashboard administrativo.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Carregando dashboard administrativo...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="bg-purple-600 p-2 rounded-lg">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                Dashboard Administrativo
              </CardTitle>
              <CardDescription>
                Visão geral de todos os usuários e estatísticas do sistema
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchAdminData}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Atualizar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {/* Implementar exportação */}}
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Estatísticas do Sistema */}
      {systemStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total de Usuários</p>
                  <p className="text-2xl font-bold text-gray-900">{systemStats.totalUsers}</p>
                  <p className="text-xs text-gray-500">
                    {systemStats.activeUsers} ativos, {systemStats.inactiveUsers} inativos
                  </p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total de Questões</p>
                  <p className="text-2xl font-bold text-gray-900">{systemStats.totalQuestions}</p>
                  <p className="text-xs text-gray-500">
                    {systemStats.totalSessions} sessões registradas
                  </p>
                </div>
                <Target className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Assertividade Média</p>
                  <p className="text-2xl font-bold text-gray-900">{systemStats.averageAccuracy.toFixed(1)}%</p>
                  <p className="text-xs text-gray-500">
                    Média geral do sistema
                  </p>
                </div>
                <Award className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Usuários Ativos</p>
                  <p className="text-2xl font-bold text-gray-900">{systemStats.activeUsers}</p>
                  <p className="text-xs text-gray-500">
                    {((systemStats.activeUsers / systemStats.totalUsers) * 100).toFixed(1)}% do total
                  </p>
                </div>
                <UserCheck className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs com Dados Detalhados */}
      <Tabs defaultValue="users" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="users">Usuários</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="disciplines">Disciplinas</TabsTrigger>
          <TabsTrigger value="activity">Atividade</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          {/* Filtros */}
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div>
                  <label className="text-sm font-medium">Buscar</label>
                  <Input
                    placeholder="Nome ou email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Disciplina</label>
                  <Select value={selectedDiscipline} onValueChange={setSelectedDiscipline}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      {subjectsData.map((subject) => (
                        <SelectItem key={subject.id} value={subject.name}>
                          {subject.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Ordenar por</label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="questions">Questões</SelectItem>
                      <SelectItem value="accuracy">Assertividade</SelectItem>
                      <SelectItem value="time">Tempo</SelectItem>
                      <SelectItem value="streak">Streak</SelectItem>
                      <SelectItem value="name">Nome</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Ordem</label>
                  <Select value={sortOrder} onValueChange={(value: 'asc' | 'desc') => setSortOrder(value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="desc">Decrescente</SelectItem>
                      <SelectItem value="asc">Crescente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowInactive(!showInactive)}
                  >
                    {showInactive ? <UserX className="h-4 w-4 mr-2" /> : <UserCheck className="h-4 w-4 mr-2" />}
                    {showInactive ? 'Ocultar Inativos' : 'Mostrar Inativos'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabela de Usuários */}
          <Card>
            <CardHeader>
              <CardTitle>Lista de Usuários ({filteredUsers.length})</CardTitle>
              <CardDescription>
                Dados detalhados de todos os usuários do sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Questões</TableHead>
                      <TableHead className="text-right">Assertividade</TableHead>
                      <TableHead className="text-right">Tempo</TableHead>
                      <TableHead className="text-right">Streak</TableHead>
                      <TableHead className="text-right">Última Atividade</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.user_id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{user.user_name}</div>
                            <div className="text-sm text-gray-500">{user.user_email}</div>
                            {user.is_admin && (
                              <Badge variant="secondary" className="mt-1">
                                Admin
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {user.total_questions > 0 ? (
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span className="text-sm">Ativo</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <XCircle className="h-4 w-4 text-red-500" />
                              <span className="text-sm">Inativo</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-right">{user.total_questions}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant={user.overall_accuracy >= 70 ? "default" : "secondary"}>
                            {user.overall_accuracy.toFixed(1)}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{Math.round(user.total_time / 60)}h</TableCell>
                        <TableCell className="text-right">{user.study_streak}</TableCell>
                        <TableCell className="text-right">
                          {user.recent_activity.length > 0 
                            ? new Date(user.recent_activity[0].date).toLocaleDateString('pt-BR')
                            : 'Nunca'
                          }
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Disciplinas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Top Disciplinas
                </CardTitle>
                <CardDescription>
                  Disciplinas mais estudadas no sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {systemStats?.topDisciplines.map((discipline, index) => (
                    <div key={discipline.discipline} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">
                          {index + 1}
                        </div>
                        <span className="font-medium">{discipline.discipline}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">{discipline.questions} questões</span>
                        <Badge variant="outline">{discipline.users} usuários</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Distribuição de Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Distribuição de Performance
                </CardTitle>
                <CardDescription>
                  Distribuição dos usuários por nível de assertividade
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { label: 'Excelente (90%+)', count: filteredUsers.filter(u => u.overall_accuracy >= 90).length, color: 'bg-green-500' },
                    { label: 'Bom (70-89%)', count: filteredUsers.filter(u => u.overall_accuracy >= 70 && u.overall_accuracy < 90).length, color: 'bg-blue-500' },
                    { label: 'Regular (50-69%)', count: filteredUsers.filter(u => u.overall_accuracy >= 50 && u.overall_accuracy < 70).length, color: 'bg-yellow-500' },
                    { label: 'Baixo (<50%)', count: filteredUsers.filter(u => u.overall_accuracy < 50).length, color: 'bg-red-500' },
                    { label: 'Sem dados', count: filteredUsers.filter(u => u.total_questions === 0).length, color: 'bg-gray-500' }
                  ].map((category) => (
                    <div key={category.label} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${category.color}`}></div>
                        <span className="text-sm">{category.label}</span>
                      </div>
                      <span className="text-sm font-medium">{category.count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="disciplines" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Análise por Disciplina
              </CardTitle>
              <CardDescription>
                Desempenho detalhado por disciplina
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {subjectsData.map((subject) => {
                  const usersInDiscipline = filteredUsers.filter(u => 
                    u.discipline_stats.some(d => d.discipline === subject.name)
                  )
                  const totalQuestions = usersInDiscipline.reduce((sum, u) => {
                    const stat = u.discipline_stats.find(d => d.discipline === subject.name)
                    return sum + (stat?.questions || 0)
                  }, 0)
                  const totalCorrect = usersInDiscipline.reduce((sum, u) => {
                    const stat = u.discipline_stats.find(d => d.discipline === subject.name)
                    return sum + (stat?.correct || 0)
                  }, 0)
                  const averageAccuracy = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0

                  return (
                    <div key={subject.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: subject.color }}
                          ></div>
                          <h3 className="font-medium">{subject.name}</h3>
                        </div>
                        <Badge variant={averageAccuracy >= 70 ? "default" : "secondary"}>
                          {averageAccuracy.toFixed(1)}%
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Usuários ativos</span>
                          <span className="font-medium">{usersInDiscipline.length}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Total de questões</span>
                          <span className="font-medium">{totalQuestions}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Acertos</span>
                          <span className="font-medium text-green-600">{totalCorrect}</span>
                        </div>
                        <Progress value={averageAccuracy} className="mt-2" />
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Atividade do Sistema
              </CardTitle>
              <CardDescription>
                Análise da atividade dos usuários ao longo do tempo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {systemStats?.userGrowth.slice(-7).map((day) => (
                  <div key={day.date} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="text-sm font-medium">
                        {new Date(day.date).toLocaleDateString('pt-BR', { 
                          weekday: 'short', 
                          day: 'numeric',
                          month: 'short'
                        })}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <div className="text-sm text-gray-600">Novos usuários</div>
                        <div className="text-lg font-bold text-blue-600">{day.newUsers}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-gray-600">Usuários ativos</div>
                        <div className="text-lg font-bold text-green-600">{day.activeUsers}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
