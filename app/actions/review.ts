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
    const nextReviewDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    const { error } = await supabase
      .from('user_subject_progress')
      .upsert(
        {
          user_id: userId,
          discipline,
          subject,
          last_study_date: sessionDate,
          next_review_date: nextReviewDate,
        },
        { onConflict: 'user_id, discipline, subject', ignoreDuplicates: false }
      )

    if (error) {
      console.error('Error upserting subject progress:', error)
      return { success: false, message: `Falha ao atualizar progresso do assunto: ${error.message}` }
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
    const { data: userAuth } = await supabase.auth.getUser()
    const userId = userAuth?.user?.id
    if (!userId) return []

    const today = new Date().toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('user_subject_progress')
      .select('*')
      .eq('user_id', userId)
      .lte('next_review_date', today)
      .order('next_review_date', { ascending: true })

    if (error) {
      console.error('Error fetching subjects for review:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getSubjectsForReview Server Action:', error)
    return []
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
    const { data: userAuth } = await supabase.auth.getUser()
    const userId = userAuth?.user?.id
    if (!userId) return { success: false, message: 'Usuário não autenticado.' }

    const today = new Date().toISOString().split('T')[0]

    const { error } = await supabase
      .from('user_subject_progress')
      .update({
        last_study_date: today,
        next_review_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      })
      .eq('id', subjectProgressId)
      .eq('user_id', userId)

    if (error) {
      console.error('Error marking subject as reviewed:', error)
      return { success: false, message: `Falha ao marcar assunto como revisado: ${error.message}` }
    }

    return { success: true, message: 'Assunto marcado como revisado com sucesso!' }
  } catch (error: any) {
    console.error('Error in markAsReviewed Server Action:', error)
    return { success: false, message: error.message || 'Erro desconhecido ao marcar como revisado.' }
  }
}
