'use server'

import { createClient } from '@/utils/supabase/servidor'

interface QuestionAnswer {
  question_id: string
  discipline: string
  subject: string
  user_answer_index: number
  correct_option_index: number
  is_correct: boolean
  time_taken_seconds?: number
}

/**
 * Registra uma resposta de questão do banco de questões
 */
export async function recordQuestionAnswer(
  questionId: string,
  discipline: string,
  subject: string,
  userAnswerIndex: number,
  correctOptionIndex: number,
  timeTakenSeconds?: number
): Promise<{ success: boolean; message: string }> {
  try {
    const supabase = await createClient()
    const { data: userAuth, error: userError } = await supabase.auth.getUser()
    
    if (userError || !userAuth?.user?.id) {
      console.error('Authentication error in recordQuestionAnswer:', userError)
      return { success: false, message: 'Usuário não autenticado.' }
    }

    const userId = userAuth.user.id
    const isCorrect = userAnswerIndex === correctOptionIndex
    const seconds = Math.max(0, timeTakenSeconds || 0)
    const minutesToAdd = Math.max(1, Math.round(seconds / 60)) // Mínimo de 1 minuto para evitar constraint violation
    const today = new Date().toISOString().split('T')[0]

    // Verificar se já existe resposta anterior desta questão para este usuário
    const { data: existingAnswer, error: fetchExistingAnswerError } = await supabase
      .from('question_answers')
      .select('*')
      .eq('user_id', userId)
      .eq('question_id', questionId)
      .maybeSingle()

    if (fetchExistingAnswerError) {
      console.error('Error fetching existing answer:', fetchExistingAnswerError)
    }

    const hadPrevious = !!existingAnswer
    const previousWasCorrect = existingAnswer?.is_correct === true
    const previousTimeSeconds = existingAnswer?.time_taken_seconds || 0

    // 1. Registrar a resposta na tabela de respostas de questões
    const { error: answerError } = await supabase
      .from('question_answers')
      .upsert({
        user_id: userId,
        question_id: questionId,
        discipline: discipline,
        subject: subject,
        user_answer_index: userAnswerIndex,
        correct_option_index: correctOptionIndex,
        is_correct: isCorrect,
        time_taken_seconds: (previousTimeSeconds || 0) + seconds,
      }, {
        onConflict: 'user_id,question_id',
        ignoreDuplicates: false,
      })

    if (answerError) {
      console.error('Error recording question answer:', answerError)
      throw new Error(`Falha ao registrar resposta: ${answerError.message}`)
    }

    // 2. Atualizar o progresso do usuário na disciplina/assunto (tabela auxiliar)
    // Buscar progresso atual
    const { data: existingProgress, error: fetchProgressError } = await supabase
      .from('user_subject_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('discipline', discipline)
      .eq('subject', subject)
      .maybeSingle()

    if (fetchProgressError) {
      console.error('Error fetching progress:', fetchProgressError)
    }

    const addQuestionToTotals = hadPrevious ? 0 : 1
    const deltaCorrect = (isCorrect ? 1 : 0) - (previousWasCorrect ? 1 : 0)

    if (existingProgress) {
      const newTotal = (existingProgress.total_questions_answered || 0) + addQuestionToTotals
      const newCorrect = (existingProgress.correct_answers || 0) + deltaCorrect
      const { error: updateProgressError } = await supabase
        .from('user_subject_progress')
        .update({
          total_questions_answered: newTotal,
          correct_answers: newCorrect,
          accuracy_percentage: newTotal > 0 ? (newCorrect / newTotal) * 100 : 0,
          last_study_date: today,
          next_review_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 dias a partir de hoje
        })
        .eq('user_id', userId)
        .eq('discipline', discipline)
        .eq('subject', subject)

      if (updateProgressError) {
        console.error('Error updating user progress:', updateProgressError)
      }
    } else {
      const initialTotal = addQuestionToTotals
      const initialCorrect = isCorrect ? 1 : 0
      const { error: insertProgressError } = await supabase
      .from('user_subject_progress')
        .insert({
          user_id: userId,
          discipline,
          subject,
          total_questions_answered: initialTotal,
          correct_answers: initialCorrect,
          accuracy_percentage: initialTotal > 0 ? (initialCorrect / initialTotal) * 100 : 0,
          last_study_date: today,
          next_review_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 dias a partir de hoje
        })

      if (insertProgressError) {
        console.error('Error inserting user progress:', insertProgressError)
      }
    }

    // progresso tratado acima com update/insert dedicados

    // 3. Refletir no dashboard (study_sessions): agregar por dia/usuário/disciplina/assunto
    try {
      // Tentar buscar sessão existente do dia
      const { data: existingSessions, error: fetchSessionError } = await supabase
        .from('study_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('date', today)
        .eq('discipline', discipline)
        .eq('subject', subject)
        .limit(1)

      if (fetchSessionError) {
        console.error('Error fetching study session for aggregation:', fetchSessionError)
      }

      if (existingSessions && existingSessions.length > 0) {
        const current = existingSessions[0]
        const newQuestionsTotal = (current.questions_total || 0) + (hadPrevious ? 0 : 1)
        const newCorrect = (current.correct_answers || 0) + deltaCorrect + (hadPrevious ? 0 : (isCorrect ? 1 : 0)) - (hadPrevious ? (previousWasCorrect ? 1 : 0) : 0)
        // Simplify: newCorrect = oldCorrect + deltaCorrect; since delta already accounts for previous
        const correctedNewCorrect = (current.correct_answers || 0) + deltaCorrect + (hadPrevious ? 0 : (isCorrect ? 1 : 0)) - (hadPrevious ? (previousWasCorrect ? 1 : 0) : 0)
        const finalCorrect = (current.correct_answers || 0) + (hadPrevious ? deltaCorrect : (isCorrect ? 1 : 0))
        const newWrong = Math.max(0, newQuestionsTotal - finalCorrect)
        const newTimeMinutes = (current.study_time_minutes || 0) + minutesToAdd
        const newAvgTime = newQuestionsTotal > 0 ? newTimeMinutes / newQuestionsTotal : 0

        const { error: updateError } = await supabase
          .from('study_sessions')
          .update({
            questions_total: newQuestionsTotal,
            correct_answers: finalCorrect,
            wrong_answers: newWrong,
            accuracy_percentage: newQuestionsTotal > 0 ? (finalCorrect / newQuestionsTotal) * 100 : 0,
            study_time_minutes: newTimeMinutes,
            avg_time_per_question: newAvgTime,
          })
          .eq('id', current.id)

        if (updateError) {
          console.error('Error updating aggregated study session:', updateError)
        }
      } else {
        const initialQuestions = 1
        const initialCorrect = isCorrect ? 1 : 0
        const initialWrong = 1 - initialCorrect
        const initialTime = minutesToAdd
        const initialAvg = initialQuestions > 0 ? (initialTime / initialQuestions) : 0

        const { error: insertSessionError } = await supabase
          .from('study_sessions')
          .insert({
        user_id: userId,
            date: today,
            discipline,
            subject,
            questions_total: initialQuestions,
            correct_answers: initialCorrect,
            wrong_answers: initialWrong,
            accuracy_percentage: initialQuestions > 0 ? (initialCorrect / initialQuestions) * 100 : 0,
            study_time_minutes: initialTime,
            avg_time_per_question: initialAvg,
          })

        if (insertSessionError) {
          console.error('Error inserting aggregated study session:', insertSessionError)
        }
      }
    } catch (aggError) {
      console.error('Aggregation (study_sessions) error:', aggError)
    }

    // 4. Também registrar a tentativa como uma linha de session granular (para histórico detalhado)
    try {
      const { error: granularError } = await supabase
        .from('study_sessions')
        .insert({
          user_id: userId,
          date: today,
          discipline,
          subject,
          questions_total: 1,
          correct_answers: isCorrect ? 1 : 0,
          wrong_answers: isCorrect ? 0 : 1,
          accuracy_percentage: isCorrect ? 100 : 0,
          study_time_minutes: minutesToAdd,
          avg_time_per_question: 1 > 0 ? (minutesToAdd / 1) : 0,
        })
      if (granularError) {
        // Opcional: ignorar se houver política que impeça duplicação por data; mantém o agregado válido
        console.error('Granular session insert error:', granularError)
      }
    } catch (granularCatch) {
      console.error('Granular session unexpected error:', granularCatch)
    }

    return { 
      success: true, 
      message: isCorrect ? 'Resposta correta!' : 'Resposta incorreta. Continue estudando!' 
    }
  } catch (error: any) {
    console.error('Error in recordQuestionAnswer Server Action:', error)
    return { success: false, message: error.message || 'Erro desconhecido ao registrar resposta.' }
  }
}

/**
 * Busca estatísticas de respostas do usuário
 */
export async function getUserQuestionStats(): Promise<{
  total_answered: number
  total_correct: number
  overall_accuracy: number
  discipline_stats: Array<{
    discipline: string
    questions: number
    correct: number
    accuracy: number
  }>
}> {
  try {
    const supabase = await createClient()
    const { data: userAuth, error: userError } = await supabase.auth.getUser()
    
    if (userError || !userAuth?.user?.id) {
      throw new Error('Usuário não autenticado.')
    }

    const userId = userAuth.user.id

    // Buscar todas as respostas do usuário
    const { data: answers, error } = await supabase
      .from('question_answers')
      .select('*')
      .eq('user_id', userId)

    if (error) {
      throw new Error(`Falha ao buscar respostas: ${error.message}`)
    }

    if (!answers || answers.length === 0) {
      return {
        total_answered: 0,
        total_correct: 0,
        overall_accuracy: 0,
        discipline_stats: []
      }
    }

    // Calcular estatísticas gerais
    const totalAnswered = answers.length
    const totalCorrect = answers.filter(a => a.is_correct).length
    const overallAccuracy = totalAnswered > 0 ? (totalCorrect / totalAnswered) * 100 : 0

    // Calcular estatísticas por disciplina
    const disciplineMap = new Map<string, { questions: number; correct: number }>()
    
    answers.forEach(answer => {
      const current = disciplineMap.get(answer.discipline) || { questions: 0, correct: 0 }
      current.questions += 1
      if (answer.is_correct) current.correct += 1
      disciplineMap.set(answer.discipline, current)
    })

    const disciplineStats = Array.from(disciplineMap.entries()).map(([discipline, stats]) => ({
      discipline,
      questions: stats.questions,
      correct: stats.correct,
      accuracy: stats.questions > 0 ? (stats.correct / stats.questions) * 100 : 0
    }))

    return {
      total_answered: totalAnswered,
      total_correct: totalCorrect,
      overall_accuracy: overallAccuracy,
      discipline_stats: disciplineStats
    }
  } catch (error: any) {
    console.error('Error in getUserQuestionStats Server Action:', error)
    throw new Error(`Erro ao buscar estatísticas: ${error.message || 'Erro desconhecido'}`)
  }
}
