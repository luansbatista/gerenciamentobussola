'use server'

import { createClient } from '@/utils/supabase/servidor'

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

export async function getUserStudySessionsForExport(): Promise<StudySession[]> {
  console.log('--- getUserStudySessionsForExport Server Action Initiated ---')

  try {
    const supabase = await createClient()
    const { data: userAuth, error: userError } = await supabase.auth.getUser()
    if (userError || !userAuth?.user?.id) {
      console.error('Authentication error in getUserStudySessionsForExport:', userError?.message || 'No user ID')
      throw new Error('Usuário não autenticado ou erro ao obter informações do usuário.')
    }

    console.log('Fetching sessions for user:', userAuth.user.id)
    const { data: sessions, error } = await supabase
      .from('study_sessions')
      .select('*')
      .eq('user_id', userAuth.user.id)
      .order('date', { ascending: false })

    if (error) {
      console.error('Error fetching user study sessions for export:', error.message, error.details, error.hint)
      throw new Error('Falha ao buscar sessões de estudo para exportação.')
    }

    console.log('Fetched user study sessions count:', sessions?.length)
    return sessions || []
  } catch (error: any) {
    console.error('Error in getUserStudySessionsForExport Server Action:', error.message || 'Unknown error')
    throw new Error(`Erro ao exportar dados: ${error.message || 'Erro desconhecido'}`)
  } finally {
    console.log('--- getUserStudySessionsForExport Server Action Finished ---')
  }
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

export async function getUserRecentQuestionAnswers(limit: number = 100): Promise<QuestionAnswerRecord[]> {
  try {
    const supabase = await createClient()
    const { data: userAuth, error: userError } = await supabase.auth.getUser()
    if (userError || !userAuth?.user?.id) {
      throw new Error('Usuário não autenticado.')
    }

    const { data: answers, error } = await supabase
      .from('question_answers')
      .select('question_id,created_at,discipline,subject,is_correct,time_taken_seconds')
      .eq('user_id', userAuth.user.id)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      throw new Error(`Falha ao buscar respostas: ${error.message}`)
    }

    const records: QuestionAnswerRecord[] = (answers as any[]) || []

    // Opcional: buscar enunciados das questões
    const ids = Array.from(new Set(records.map(r => r.question_id))).filter(Boolean)
    if (ids.length > 0) {
      const { data: questions, error: qErr } = await supabase
        .from('questions')
        .select('id, question_text')
        .in('id', ids)
      if (!qErr && questions) {
        const map = new Map<string, string>(questions.map(q => [q.id as string, (q.question_text as string) || '']))
        records.forEach(r => { r.question_text = map.get(r.question_id) })
      }
    }

    return records
  } catch (e: any) {
    throw new Error(e.message || 'Erro ao buscar respostas recentes')
  }
}
