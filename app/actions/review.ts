'use server'

import { createClient } from '@/utils/supabase/servidor'


interface UserSubjectProgress {
  id: string
  user_id: string
  discipline: string
  subject: string
  last_study_date: string // YYYY-MM-DD
  next_review_date: string // YYYY-MM-DD
  created_at: string
  updated_at: string
}

/**
 * Upserts (inserts or updates) a subject's progress for a user.
 * Called when a new study session is recorded.
 */
export async function updateSubjectProgress(
  userId: string,
  discipline: string,
  subject: string,
  sessionDate: string // Date of the study session (YYYY-MM-DD)
): Promise<{ success: boolean; message: string }> {
  try {
    const supabase = await createClient()
    const today = new Date(sessionDate)
    const nextReviewDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 7 days from last study

    const { data, error } = await supabase
      .from('user_subject_progress')
      .upsert(
        {
          user_id: userId,
          discipline: discipline,
          subject: subject,
          last_study_date: sessionDate,
          next_review_date: nextReviewDate,
        },
        {
          onConflict: 'user_id, discipline, subject', // Conflict target for upsert
          ignoreDuplicates: false, // Ensure update happens if conflict
        }
      )
      .select() // Select the updated/inserted row

    if (error) {
      console.error('Error upserting subject progress:', error)
      throw new Error(`Falha ao atualizar progresso do assunto: ${error.message}`)
    }

    return { success: true, message: 'Progresso do assunto atualizado com sucesso.' }
  } catch (error: any) {
    console.error('Error in updateSubjectProgress Server Action:', error)
    return { success: false, message: error.message || 'Erro desconhecido ao atualizar progresso.' }
  }
}

/**
 * Fetches subjects due for review for the current user.
 */
export async function getSubjectsForReview(): Promise<UserSubjectProgress[]> {
  try {
    const supabase = await createClient()
    const { data: userAuth, error: userError } = await supabase.auth.getUser()
    if (userError || !userAuth?.user?.id) {
      console.error('Authentication error in getSubjectsForReview:', userError)
      throw new Error('Usuário não autenticado ou erro ao obter informações do usuário.')
    }

    const userId = userAuth.user.id
    const today = new Date().toISOString().split('T')[0] // Current date in YYYY-MM-DD format

    const { data, error } = await supabase
      .from('user_subject_progress')
      .select('*')
      .eq('user_id', userId)
      .lte('next_review_date', today) // Subjects whose next review date is today or in the past
      .order('next_review_date', { ascending: true }) // Order by oldest review first

    if (error) {
      console.error('Error fetching subjects for review:', error)
      throw new Error(`Falha ao buscar assuntos para revisão: ${error.message}`)
    }

    return data || []
  } catch (error: any) {
    console.error('Error in getSubjectsForReview Server Action:', error)
    throw new Error(`Erro ao buscar dados de revisão: ${error.message || 'Erro desconhecido'}`)
  }
}

/**
 * Marks a subject as reviewed, updating its last_study_date and next_review_date.
 */
export async function markAsReviewed(
  subjectProgressId: string
): Promise<{ success: boolean; message: string }> {
  try {
    const supabase = await createClient()
    const { data: userAuth, error: userError } = await supabase.auth.getUser()
    if (userError || !userAuth?.user?.id) {
      console.error('Authentication error in markAsReviewed:', userError)
      return { success: false, message: 'Usuário não autenticado.' }
    }

    const userId = userAuth.user.id
    const today = new Date().toISOString().split('T')[0]

    const { error } = await supabase
      .from('user_subject_progress')
      .update({
        last_study_date: today,
        next_review_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from today
      })
      .eq('id', subjectProgressId)
      .eq('user_id', userId) // Ensure user can only update their own progress

    if (error) {
      console.error('Error marking subject as reviewed:', error)
      throw new Error(`Falha ao marcar assunto como revisado: ${error.message}`)
    }

    return { success: true, message: 'Assunto marcado como revisado com sucesso!' }
  } catch (error: any) {
    console.error('Error in markAsReviewed Server Action:', error)
    return { success: false, message: error.message || 'Erro desconhecido ao marcar como revisado.' }
  }
}
