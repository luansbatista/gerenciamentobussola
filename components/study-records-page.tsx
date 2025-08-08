"use client"

import { useState, useEffect, useMemo } from 'react'
import { useAuth } from './auth-provider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Loader2, Download, BookOpen } from 'lucide-react'
import { getUserStudySessionsForExport, getUserRecentQuestionAnswers } from '@/app/actions/export' // Reutiliza o Server Action de exportação
import * as XLSX from 'xlsx'
import { useToast } from '@/hooks/use-toast'

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

interface QuestionAnswerRecord {
  question_id: string
  created_at: string
  discipline: string
  subject: string
  is_correct: boolean
  time_taken_seconds: number
  question_text?: string
}

export function StudyRecordsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [sessions, setSessions] = useState<StudySession[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingExport, setLoadingExport] = useState(false)
  const [recentAnswers, setRecentAnswers] = useState<QuestionAnswerRecord[]>([])

  useEffect(() => {
    if (user) {
      fetchStudySessions()
      fetchRecentAnswers()
    }
  }, [user])

  // Agrupar sessões por disciplina e data
  const aggregatedSessions = useMemo(() => {
    const sessionMap = new Map<string, {
      date: string
      discipline: string
      subjects: Set<string>
      total_questions: number
      total_correct: number
      total_wrong: number
      total_time: number
      total_avg_time: number
      accuracy_percentage: number
    }>()

    sessions.forEach((session) => {
      const key = `${session.discipline}-${session.date}`
      const existing = sessionMap.get(key)
      
      if (existing) {
        existing.total_questions += session.questions_total
        existing.total_correct += session.correct_answers
        existing.total_wrong += session.wrong_answers
        existing.total_time += session.study_time_minutes
        existing.total_avg_time += session.avg_time_per_question
        existing.subjects.add(session.subject)
        existing.accuracy_percentage = existing.total_questions > 0 
          ? (existing.total_correct / existing.total_questions) * 100 
          : 0
      } else {
        sessionMap.set(key, {
          date: session.date,
          discipline: session.discipline,
          subjects: new Set([session.subject]),
          total_questions: session.questions_total,
          total_correct: session.correct_answers,
          total_wrong: session.wrong_answers,
          total_time: session.study_time_minutes,
          total_avg_time: session.avg_time_per_question,
          accuracy_percentage: session.accuracy_percentage
        })
      }
    })

    return Array.from(sessionMap.values())
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [sessions])

  // Agrupar respostas por disciplina e data
  const aggregatedAnswers = useMemo(() => {
    const answerMap = new Map<string, {
      date: string
      discipline: string
      subjects: Set<string>
      total_questions: number
      total_correct: number
      total_time: number
      accuracy_percentage: number
    }>()

    recentAnswers.forEach((answer) => {
      const date = new Date(answer.created_at).toISOString().split('T')[0]
      const key = `${answer.discipline}-${date}`
      const existing = answerMap.get(key)
      
      if (existing) {
        existing.total_questions += 1
        existing.total_correct += answer.is_correct ? 1 : 0
        existing.total_time += answer.time_taken_seconds
        existing.subjects.add(answer.subject)
        existing.accuracy_percentage = existing.total_questions > 0 
          ? (existing.total_correct / existing.total_questions) * 100 
          : 0
      } else {
        answerMap.set(key, {
          date,
          discipline: answer.discipline,
          subjects: new Set([answer.subject]),
          total_questions: 1,
          total_correct: answer.is_correct ? 1 : 0,
          total_time: answer.time_taken_seconds,
          accuracy_percentage: answer.is_correct ? 100 : 0
        })
      }
    })

    return Array.from(answerMap.values())
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [recentAnswers])

  const fetchStudySessions = async () => {
    setLoading(true)
    try {
      const data = await getUserStudySessionsForExport()
      setSessions(data)
    } catch (error: any) {
      toast({
        title: "Erro ao carregar registros",
        description: error.message,
        variant: "destructive",
      })
      console.error('Error fetching study sessions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    setLoadingExport(true)
    try {
      const dataToExport = aggregatedSessions.map(session => ({
        Data: new Date(session.date).toLocaleDateString('pt-BR'),
        Disciplina: session.discipline,
        Assuntos: Array.from(session.subjects).join(', '),
        'Questões Totais': session.total_questions,
        Acertos: session.total_correct,
        Erros: session.total_wrong,
        'Assertividade (%)': session.accuracy_percentage.toFixed(1),
        'Tempo de Estudo (min)': session.total_time,
        'Tempo Médio/Questão (min)': (session.total_avg_time / aggregatedSessions.length).toFixed(2),
      }))

      if (aggregatedSessions.length === 0) {
        toast({
          title: "Nenhum dado para exportar",
          description: "Não há sessões de estudo registradas.",
          variant: "default",
        })
        return
      }

      const ws = XLSX.utils.json_to_sheet(dataToExport)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, "RegistrosDeEstudo")
      XLSX.writeFile(wb, "registros_de_estudo.xlsx")

      toast({
        title: "Dados exportados!",
        description: "Seus registros de estudo foram exportados para Excel.",
        action: <Download className="text-green-500" />,
      })

    } catch (error: any) {
      toast({
        title: "Erro ao exportar dados",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoadingExport(false)
    }
  }

  const fetchRecentAnswers = async () => {
    try {
      const answers = await getUserRecentQuestionAnswers(100)
      setRecentAnswers(answers)
    } catch (error: any) {
      toast({ title: 'Erro ao buscar respostas recentes', description: error.message, variant: 'destructive' })
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="bg-blue-600 p-2 rounded-lg">
                <BookOpen className="h-5 w-5 text-white" />
              </div>
              Meus Registros de Estudo
            </CardTitle>
            <Button
              onClick={handleExport}
              disabled={loadingExport || loading}
              variant="outline"
              className="flex items-center gap-2"
            >
              {loadingExport ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Exportando...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Exportar para Excel
                </>
              )}
            </Button>
          </div>
          <CardDescription>
            Visualize e exporte todas as suas sessões de estudo registradas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Carregando registros...</span>
            </div>
          ) : aggregatedSessions.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              Nenhum registro de estudo encontrado. Comece a registrar suas sessões!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Disciplina</TableHead>
                    <TableHead>Assuntos</TableHead>
                    <TableHead className="text-right">Questões</TableHead>
                    <TableHead className="text-right">Acertos</TableHead>
                    <TableHead className="text-right">Erros</TableHead>
                    <TableHead className="text-right">Assertividade</TableHead>
                    <TableHead className="text-right">Tempo (min)</TableHead>
                    <TableHead className="text-right">Tempo/Questão</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {aggregatedSessions.map((session, index) => (
                    <TableRow key={`${session.discipline}-${session.date}-${index}`}>
                      <TableCell>{new Date(session.date).toLocaleDateString('pt-BR')}</TableCell>
                      <TableCell>{session.discipline}</TableCell>
                      <TableCell>{Array.from(session.subjects).join(', ')}</TableCell>
                      <TableCell className="text-right">{session.total_questions}</TableCell>
                      <TableCell className="text-right text-green-600">{session.total_correct}</TableCell>
                      <TableCell className="text-right text-red-600">{session.total_wrong}</TableCell>
                      <TableCell className="text-right font-medium">{session.accuracy_percentage.toFixed(1)}%</TableCell>
                      <TableCell className="text-right">{session.total_time}</TableCell>
                      <TableCell className="text-right">{(session.total_avg_time / aggregatedSessions.length).toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Respostas Recentes</CardTitle>
          <CardDescription>Histórico das questões respondidas agrupadas por disciplina e data</CardDescription>
        </CardHeader>
        <CardContent>
          {aggregatedAnswers.length === 0 ? (
            <div className="text-center text-gray-500 py-8">Nenhuma resposta registrada ainda.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Disciplina</TableHead>
                    <TableHead>Assuntos</TableHead>
                    <TableHead className="text-right">Questões</TableHead>
                    <TableHead className="text-right">Acertos</TableHead>
                    <TableHead className="text-right">Assertividade</TableHead>
                    <TableHead className="text-right">Tempo Total (s)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {aggregatedAnswers.map((answer, index) => (
                    <TableRow key={`${answer.discipline}-${answer.date}-${index}`}>
                      <TableCell>{new Date(answer.date).toLocaleDateString('pt-BR')}</TableCell>
                      <TableCell>{answer.discipline}</TableCell>
                      <TableCell>{Array.from(answer.subjects).join(', ')}</TableCell>
                      <TableCell className="text-right">{answer.total_questions}</TableCell>
                      <TableCell className="text-right text-green-600">{answer.total_correct}</TableCell>
                      <TableCell className="text-right font-medium">{answer.accuracy_percentage.toFixed(1)}%</TableCell>
                      <TableCell className="text-right">{answer.total_time}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
