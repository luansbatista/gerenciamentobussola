"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { BarChart3, Trophy, Users, Calendar } from 'lucide-react'
import { Loader2 } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { subjectsData } from '@/lib/subjects-data'
import { getGlobalRanking } from '@/app/actions/ranking'
import { Label } from '@/components/ui/label'

interface UserStats {
  user_id: string
  user_name: string
  total_questions: number
  total_correct: number
  overall_accuracy: number
  discipline_stats: {
    discipline: string
    questions: number
    correct: number
    accuracy: number
  }[]
}

export function GlobalRanking() {
  const [ranking, setRanking] = useState<UserStats[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDiscipline, setSelectedDiscipline] = useState('overall')
  const [selectedMonth, setSelectedMonth] = useState('all')

  // Gerar opções de meses (últimos 12 meses)
  const getMonthOptions = () => {
    const months = []
    const currentDate = new Date()
    
    // Mês atual
    months.push({
      value: 'all',
      label: 'Todos os meses'
    })
    
    // Últimos 12 meses
    for (let i = 0; i < 12; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1)
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const label = date.toLocaleDateString('pt-BR', { 
        year: 'numeric', 
        month: 'long' 
      })
      months.push({ value, label })
    }
    
    return months
  }

  useEffect(() => {
    const fetchAndSetRanking = async () => {
      setLoading(true)
      try {
        const allUsersStats = await getGlobalRanking(selectedMonth)

        // Filter and sort based on selected discipline
        let sortedRanking = [...allUsersStats]

        if (selectedDiscipline !== 'overall') {
          sortedRanking = sortedRanking
            .filter(user => user.discipline_stats.some(d => d.discipline === selectedDiscipline && d.questions > 0))
            .sort((a, b) => {
              const aDisc = a.discipline_stats.find(d => d.discipline === selectedDiscipline)!
              const bDisc = b.discipline_stats.find(d => d.discipline === selectedDiscipline)!
              
              // Primary sort by questions, secondary by accuracy
              if (bDisc.questions !== aDisc.questions) {
                return bDisc.questions - aDisc.questions
              }
              return bDisc.accuracy - aDisc.accuracy
            })
        } else {
          // Overall ranking: primary by total questions, secondary by overall accuracy
          sortedRanking = sortedRanking.sort((a, b) => {
            if (b.total_questions !== a.total_questions) {
              return b.total_questions - a.total_questions
            }
            return b.overall_accuracy - a.overall_accuracy
          })
        }

        setRanking(sortedRanking)
      } catch (error) {
        console.error('Error fetching ranking data in client:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAndSetRanking()
  }, [selectedDiscipline, selectedMonth])

  const monthOptions = getMonthOptions()

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Trophy className="h-5 w-5 text-white" />
            </div>
            Ranking Geral de Estudantes
          </CardTitle>
          <CardDescription>
            Compare seu desempenho com outros usuários.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <Label htmlFor="discipline-filter" className="flex items-center gap-2 mb-2">
                <BarChart3 className="h-4 w-4" />
                Filtrar por Disciplina
              </Label>
              <Select value={selectedDiscipline} onValueChange={setSelectedDiscipline}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as Disciplinas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="overall">Geral</SelectItem>
                  {subjectsData.map((subject) => (
                    <SelectItem key={subject.id} value={subject.name}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="month-filter" className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4" />
                Filtrar por Mês
              </Label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar mês" />
                </SelectTrigger>
                <SelectContent>
                  {monthOptions.map((month) => (
                    <SelectItem key={month.value} value={month.value}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Carregando ranking...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">Pos.</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead className="text-right">Questões</TableHead>
                    <TableHead className="text-right">Assertividade</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ranking.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-gray-500">
                        Nenhum dado de ranking disponível para o período selecionado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    ranking.map((user, index) => {
                      const displayQuestions = selectedDiscipline === 'overall' 
                        ? user.total_questions 
                        : user.discipline_stats.find(d => d.discipline === selectedDiscipline)?.questions || 0
                      const displayAccuracy = selectedDiscipline === 'overall' 
                        ? user.overall_accuracy 
                        : user.discipline_stats.find(d => d.discipline === selectedDiscipline)?.accuracy || 0

                      return (
                        <TableRow key={user.user_id}>
                          <TableCell className="font-medium">{index + 1}</TableCell>
                          <TableCell className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-gray-500" />
                            {user.user_name}
                          </TableCell>
                          <TableCell className="text-right">{displayQuestions}</TableCell>
                          <TableCell className="text-right font-semibold text-green-600">
                            {displayAccuracy.toFixed(1)}%
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
