'use server'

import { createClient } from '@/utils/supabase/servidor'

interface StudySessionExportData {
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
  user_name: string // Adicionado para o nome do usuário
  user_email: string // Adicionado para o email do usuário
}

export async function getAllStudySessionsForAdminExport(): Promise<StudySessionExportData[]> {
  console.log('--- getAllStudySessionsForAdminExport Server Action Initiated ---')
  
  const supabase = await createClient()

  try {
    // Fetch all study sessions and join with profiles to get user name and email
    const { data: sessions, error } = await supabase
      .from('study_sessions')
      .select(`
        id,
        date,
        discipline,
        subject,
        questions_total,
        correct_answers,
        wrong_answers,
        accuracy_percentage,
        study_time_minutes,
        avg_time_per_question,
        profiles(name, email)
      `)
      .order('date', { ascending: false })

    if (error) {
      console.error('Error fetching all study sessions for admin export:', error.message, error.details, error.hint)
      // Log more details about the Supabase error
      console.error('Supabase Error Details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      })
      throw new Error('Falha ao buscar todos os registros de estudo para exportação. Verifique os logs para mais detalhes.')
    }

    console.log('Supabase fetched sessions count for admin export:', sessions?.length)
    if (sessions && sessions.length > 0) {
      console.log('First 3 fetched sessions for admin export:', sessions.slice(0, 3))
    } else {
      console.log('No sessions fetched from Supabase for admin export.')
    }

    const formattedData: StudySessionExportData[] = sessions.map((session: any) => ({
      id: session.id,
      date: session.date,
      discipline: session.discipline,
      subject: session.subject,
      questions_total: session.questions_total,
      correct_answers: session.correct_answers,
      wrong_answers: session.wrong_answers,
      accuracy_percentage: session.accuracy_percentage,
      study_time_minutes: session.study_time_minutes,
      avg_time_per_question: session.avg_time_per_question,
      user_name: session.profiles?.name || 'N/A',
      user_email: session.profiles?.email || 'N/A',
    }))

    console.log('--- getAllStudySessionsForAdminExport Server Action Finished ---')
    return formattedData
  } catch (error: any) {
    console.error('Unexpected error in getAllStudySessionsForAdminExport Server Action:', error.message || 'Unknown error', error)
    throw new Error(`Erro inesperado ao exportar todos os dados: ${error.message || 'Erro desconhecido'}`)
  }
}
