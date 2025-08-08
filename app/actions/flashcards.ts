'use server'

import { createClient } from '@/utils/supabase/servidor'
import { addDays } from 'date-fns'

interface Flashcard {
  id: string
  user_id: string
  discipline: string
  subject: string
  question: string
  answer: string
  ease_factor: number
  repetitions: number
  current_interval: number
  next_review_date: string
  last_reviewed_at: string | null
  created_at: string
  updated_at: string
}

/**
 * Cria um novo flashcard.
 */
export async function createFlashcard(
  discipline: string,
  subject: string,
  question: string,
  answer: string
): Promise<{ success: boolean; message: string; flashcard?: Flashcard }> {
  try {
    const supabase = await createClient()
    const { data: userAuth, error: userError } = await supabase.auth.getUser()
    if (userError || !userAuth?.user?.id) {
      console.error('Authentication error in createFlashcard:', userError)
      return { success: false, message: 'Usuário não autenticado.' }
    }

    const userId = userAuth.user.id
    const today = new Date().toISOString().split('T')[0] // Data de criação

    const { data, error } = await supabase
      .from('flashcards')
      .insert({
        user_id: userId,
        discipline,
        subject,
        question,
        answer,
        ease_factor: 2.5, // Padrão inicial
        repetitions: 0,
        current_interval: 0,
        next_review_date: today, // Pode ser revisado imediatamente ou no dia seguinte
        last_reviewed_at: null,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating flashcard:', error)
      throw new Error(`Falha ao criar flashcard: ${error.message}`)
    }

    return { success: true, message: 'Flashcard criado com sucesso!', flashcard: data }
  } catch (error: any) {
    console.error('Error in createFlashcard Server Action:', error)
    return { success: false, message: error.message || 'Erro desconhecido ao criar flashcard.' }
  }
}

/**
 * Busca flashcards para revisão (vencidos ou para hoje).
 */
export async function getFlashcardsForReview(): Promise<Flashcard[]> {
  try {
    const supabase = await createClient()
    const { data: userAuth, error: userError } = await supabase.auth.getUser()
    if (userError || !userAuth?.user?.id) {
      console.error('Authentication error in getFlashcardsForReview:', userError)
      throw new Error('Usuário não autenticado ou erro ao obter informações do usuário.')
    }

    const userId = userAuth.user.id
    const today = new Date().toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('flashcards')
      .select('*')
      .eq('user_id', userId)
      .lte('next_review_date', today) // Flashcards cuja próxima revisão é hoje ou no passado
      .order('next_review_date', { ascending: true })

    if (error) {
      console.error('Error fetching flashcards for review:', error)
      throw new Error(`Falha ao buscar flashcards para revisão: ${error.message}`)
    }

    return data || []
  } catch (error: any) {
    console.error('Error in getFlashcardsForReview Server Action:', error)
    throw new Error(`Erro ao buscar flashcards de revisão: ${error.message || 'Erro desconhecido'}`)
  }
}

/**
 * Busca todos os flashcards do usuário, ordenados pela próxima data de revisão.
 */
export async function getAllFlashcards(): Promise<Flashcard[]> {
  try {
    const supabase = await createClient()
    const { data: userAuth, error: userError } = await supabase.auth.getUser()
    if (userError || !userAuth?.user?.id) {
      console.error('Authentication error in getAllFlashcards:', userError)
      throw new Error('Usuário não autenticado ou erro ao obter informações do usuário.')
    }

    const userId = userAuth.user.id

    const { data, error } = await supabase
      .from('flashcards')
      .select('*')
      .eq('user_id', userId)
      .order('next_review_date', { ascending: true })

    if (error) {
      console.error('Error fetching all flashcards:', error)
      throw new Error(`Falha ao buscar todos os flashcards: ${error.message}`)
    }

    return data || []
  } catch (error: any) {
    console.error('Error in getAllFlashcards Server Action:', error)
    throw new Error(`Erro ao buscar todos os flashcards: ${error.message || 'Erro desconhecido'}`)
  }
}

/**
 * Marca um flashcard como revisado, atualizando seu estado para repetição espaçada.
 * Implementa uma versão simplificada do algoritmo SM-2.
 * @param flashcardId ID do flashcard a ser atualizado.
 * @param correctnessScore Pontuação de 0 a 5 (0=Esqueci completamente, 5=Perfeito).
 */
export async function markFlashcardReviewed(
  flashcardId: string,
  correctnessScore: number
): Promise<{ success: boolean; message: string }> {
  try {
    const supabase = await createClient()
    const { data: userAuth, error: userError } = await supabase.auth.getUser()
    if (userError || !userAuth?.user?.id) {
      console.error('Authentication error in markFlashcardReviewed:', userError)
      return { success: false, message: 'Usuário não autenticado.' }
    }

    const userId = userAuth.user.id

    const { data: currentFlashcard, error: fetchError } = await supabase
      .from('flashcards')
      .select('*')
      .eq('id', flashcardId)
      .eq('user_id', userId)
      .single()

    if (fetchError || !currentFlashcard) {
      console.error('Flashcard not found or unauthorized:', fetchError)
      throw new Error('Flashcard não encontrado ou não autorizado.')
    }

    let newEaseFactor = currentFlashcard.ease_factor
    let newRepetitions = currentFlashcard.repetitions
    let newInterval = currentFlashcard.current_interval

    if (correctnessScore >= 3) { // Resposta correta (3, 4, 5)
      newRepetitions += 1
      newEaseFactor = newEaseFactor + (0.1 - (5 - correctnessScore) * (0.08 + (5 - correctnessScore) * 0.02))
      if (newEaseFactor < 1.3) newEaseFactor = 1.3 // Mínimo ease factor

      if (newRepetitions === 1) {
        newInterval = 1 // Primeira repetição: 1 dia
      } else if (newRepetitions === 2) {
        newInterval = 6 // Segunda repetição: 6 dias
      } else {
        newInterval = Math.round(newInterval * newEaseFactor) // Repetições futuras
      }
    } else { // Resposta incorreta (0, 1, 2)
      newRepetitions = 0
      newInterval = 1 // Reinicia o intervalo para 1 dia
    }

    const today = new Date()
    const nextReviewDate = addDays(today, newInterval).toISOString().split('T')[0]

    const { error: updateError } = await supabase
      .from('flashcards')
      .update({
        ease_factor: newEaseFactor,
        repetitions: newRepetitions,
        current_interval: newInterval,
        next_review_date: nextReviewDate,
        last_reviewed_at: today.toISOString(),
      })
      .eq('id', flashcardId)
      .eq('user_id', userId)

    if (updateError) {
      console.error('Error updating flashcard:', updateError)
      throw new Error(`Falha ao marcar flashcard como revisado: ${updateError.message}`)
    }

    return { success: true, message: 'Flashcard marcado como revisado com sucesso!' }
  } catch (error: any) {
    console.error('Error in markFlashcardReviewed Server Action:', error)
    return { success: false, message: error.message || 'Erro desconhecido ao marcar flashcard como revisado.' }
  }
}

/**
 * Deleta um flashcard.
 */
export async function deleteFlashcard(flashcardId: string): Promise<{ success: boolean; message: string }> {
  try {
    const supabase = await createClient()
    const { data: userAuth, error: userError } = await supabase.auth.getUser()
    if (userError || !userAuth?.user?.id) {
      console.error('Authentication error in deleteFlashcard:', userError)
      return { success: false, message: 'Usuário não autenticado.' }
    }

    const userId = userAuth.user.id

    const { error } = await supabase
      .from('flashcards')
      .delete()
      .eq('id', flashcardId)
      .eq('user_id', userId) // Garante que o usuário só pode deletar seus próprios flashcards

    if (error) {
      console.error('Error deleting flashcard:', error)
      throw new Error(`Falha ao deletar flashcard: ${error.message}`)
    }

    return { success: true, message: 'Flashcard deletado com sucesso!' }
  } catch (error: any) {
    console.error('Error in deleteFlashcard Server Action:', error)
    return { success: false, message: error.message || 'Erro desconhecido ao deletar flashcard.' }
  }
}
