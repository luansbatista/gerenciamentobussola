"use client"

import { useState, useEffect } from 'react'
import { useAuth } from './auth-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { createClient } from '@/utils/supabase/cliente'
import { getSubjectsForReview, markAsReviewed } from '@/app/actions/review'
import { Calendar, CheckCircle, Clock, BookOpen, RefreshCw, Loader2 } from 'lucide-react'

interface UserSubjectProgress {
  id: string
  user_id: string
  discipline: string
  subject: string
  last_study_date: string
  next_review_date: string
  created_at: string
  updated_at: string
}

export function ReviewPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [subjectsDueForReview, setSubjectsDueForReview] = useState<UserSubjectProgress[]>([])
  const [upcomingReviews, setUpcomingReviews] = useState<UserSubjectProgress[]>([]) // Novo estado para próximas revisões
  const [loading, setLoading] = useState(true)
  const [markingAsReviewed, setMarkingAsReviewed] = useState<string | null>(null) // Track which subject is being marked

  useEffect(() => {
    if (user) {
      fetchAllReviewSubjects() // Chama uma nova função para buscar ambos os tipos de revisão
    }
  }, [user])

  const fetchAllReviewSubjects = async () => {
    setLoading(true)
    try {
      // Fetch subjects due for review (today or past)
      const dueData = await getSubjectsForReview()
      setSubjectsDueForReview(dueData)

      // Fetch all subjects for the user to filter upcoming ones
      const supabase = createClient()
      const { data: allProgress, error } = await supabase
        .from('user_subject_progress')
        .select('*')
        .eq('user_id', user?.id)
        .order('next_review_date', { ascending: true })

      if (error) {
        console.error('Error fetching all subject progress:', error)
        throw new Error(`Falha ao buscar todos os assuntos de revisão: ${error.message}`)
      }

      const today = new Date().toISOString().split('T')[0]
      const upcoming = (allProgress || []).filter(
        (subject) => subject.next_review_date > today // Filter for future dates
      )
      setUpcomingReviews(upcoming)

    } catch (error: any) {
      toast({
        title: "Erro ao carregar assuntos para revisão",
        description: error.message,
        variant: "destructive",
      })
      console.error('Error fetching subjects for review:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsReviewed = async (subjectProgressId: string) => {
    setMarkingAsReviewed(subjectProgressId)
    try {
      const supabase = createClient()
      const result = await markAsReviewed(subjectProgressId)
      if (result.success) {
        toast({
          title: "Assunto revisado!",
          description: result.message,
          action: <CheckCircle className="text-green-500" />,
        })
        fetchAllReviewSubjects() // Refresh both lists
      } else {
        toast({
          title: "Erro ao marcar como revisado",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error: any) {
      toast({
        title: "Erro inesperado",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setMarkingAsReviewed(null)
    }
  }

  const getDaysUntilReview = (nextReviewDate: string) => {
    const today = new Date()
    const reviewDate = new Date(nextReviewDate)
    const diffTime = reviewDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Assuntos Vencidos / Para Hoje */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className="bg-blue-600 p-2 rounded-lg">
              <RefreshCw className="h-5 w-5 text-white" />
            </div>
            Assuntos para Revisão (Vencidos / Hoje)
          </CardTitle>
          <CardDescription>
            Revise os assuntos de acordo com a curva do esquecimento para fixar o conteúdo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Carregando assuntos...</span>
            </div>
          ) : subjectsDueForReview.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              Parabéns! Nenhum assunto pendente de revisão no momento. Continue estudando!
            </div>
          ) : (
            <div className="space-y-4">
              {subjectsDueForReview.map((subjectProgress) => {
                const daysUntilReview = getDaysUntilReview(subjectProgress.next_review_date)
                const isOverdue = daysUntilReview <= 0

                return (
                  <Card key={subjectProgress.id} className={`border ${isOverdue ? 'border-red-400 bg-red-50' : 'border-blue-200 bg-blue-50'}`}>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">{subjectProgress.subject}</h3>
                        <p className="text-sm text-gray-700">{subjectProgress.discipline}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Último estudo: {new Date(subjectProgress.last_study_date).toLocaleDateString('pt-BR')}
                        </p>
                        <p className={`text-xs mt-1 ${isOverdue ? 'text-red-700 font-bold' : 'text-blue-700'}`}>
                          Próxima revisão: {new Date(subjectProgress.next_review_date).toLocaleDateString('pt-BR')}
                          {isOverdue && ' (Vencido!)'}
                        </p>
                      </div>
                      <Button
                        onClick={() => handleMarkAsReviewed(subjectProgress.id)}
                        disabled={markingAsReviewed === subjectProgress.id}
                        className="flex items-center gap-2"
                      >
                        {markingAsReviewed === subjectProgress.id ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Marcando...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4" />
                            Marcar como Revisado
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Próximas Revisões */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className="bg-purple-600 p-2 rounded-lg">
              <Calendar className="h-5 w-5 text-white" />
            </div>
            Próximas Revisões
          </CardTitle>
          <CardDescription>
            Assuntos programados para revisão futura.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-24">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
              <span className="ml-2 text-gray-600">Carregando próximas revisões...</span>
            </div>
          ) : upcomingReviews.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              Nenhum assunto programado para revisão futura no momento.
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingReviews.map((subjectProgress) => (
                <Card key={subjectProgress.id} className="border border-purple-200 bg-purple-50">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">{subjectProgress.subject}</h3>
                      <p className="text-sm text-gray-700">{subjectProgress.discipline}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Último estudo: {new Date(subjectProgress.last_study_date).toLocaleDateString('pt-BR')}
                      </p>
                      <p className="text-xs text-purple-700 font-bold mt-1">
                        Revisar em: {new Date(subjectProgress.next_review_date).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    {/* Não há botão de "Marcar como Revisado" para próximas revisões */}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
