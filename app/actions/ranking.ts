'use server'

import { createClient } from '@/utils/supabase/servidor'

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

export async function getGlobalRanking(monthFilter: string = 'all'): Promise<UserStats[]> {
  console.log('--- getGlobalRanking Server Action Initiated ---')
  console.log('Month filter:', monthFilter)

  try {
    const supabase = await createClient()
    
    // Construir query base - buscar de study_sessions
    let query = supabase
      .from('study_sessions')
      .select(`
        user_id,
        discipline,
        questions_total,
        correct_answers
      `)

    // Aplicar filtro de mês se especificado
    if (monthFilter !== 'all') {
      const [year, month] = monthFilter.split('-')
      const startDate = `${year}-${month}-01`
      const endDate = new Date(parseInt(year), parseInt(month), 0).toISOString().split('T')[0]
      
      query = query
        .gte('date', startDate)
        .lte('date', endDate)
    }

    const { data: sessionsData, error } = await query
    let sessions: any[] = sessionsData || []

    if (error) {
      console.error('Error fetching study sessions for ranking:', error)
      throw new Error('Falha ao buscar dados para ranking.')
    }

    console.log('Supabase fetched sessions count:', sessions.length)
    console.log('Sample session data:', sessions[0])

    if (!sessions || sessions.length === 0) {
      console.log('No sessions fetched from study_sessions, trying question_answers...')
      
      // Tentar buscar da tabela question_answers como alternativa
      let questionQuery = supabase
        .from('question_answers')
        .select(`
          user_id,
          discipline,
          is_correct
        `)

      if (monthFilter !== 'all') {
        const [year, month] = monthFilter.split('-')
        const startDate = `${year}-${month}-01`
        const endDate = new Date(parseInt(year), parseInt(month), 0).toISOString().split('T')[0]
        
        questionQuery = questionQuery
          .gte('created_at', startDate)
          .lte('created_at', endDate)
      }

      const { data: questionAnswers, error: questionError } = await questionQuery

      if (questionError) {
        console.error('Error fetching question answers:', questionError)
        return []
      }

      if (!questionAnswers || questionAnswers.length === 0) {
        console.log('No question answers found either.')
        return []
      }

      // Converter question_answers para formato de sessions
      const answerMap = new Map<string, { user_id: string; discipline: string; questions: number; correct: number }>()
      
      questionAnswers.forEach((answer: any) => {
        const key = `${answer.user_id}-${answer.discipline}`
        const existing = answerMap.get(key)
        
        if (existing) {
          existing.questions += 1
          existing.correct += answer.is_correct ? 1 : 0
        } else {
          answerMap.set(key, {
            user_id: answer.user_id,
            discipline: answer.discipline,
            questions: 1,
            correct: answer.is_correct ? 1 : 0
          })
        }
      })

      // Converter para formato de sessions
      sessions = Array.from(answerMap.values()).map(item => ({
        user_id: item.user_id,
        discipline: item.discipline,
        questions_total: item.questions,
        correct_answers: item.correct
      }))

      console.log('Converted question answers to sessions:', sessions.length)
    }

    // Agrupar dados por usuário
    const userStatsMap = new Map<string, {
      user_id: string
      user_name: string
      total_questions: number
      total_correct: number
      discipline_stats: Map<string, { questions: number; correct: number }>
    }>()

    // Buscar nomes dos usuários
    const userIds = [...new Set(sessions.map((s: any) => s.user_id))]
    
    // Tentar buscar da tabela profiles primeiro
    let userNames = new Map<string, string>()
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name')
        .in('id', userIds)

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError)
      } else if (profiles) {
        profiles.forEach(profile => {
          userNames.set(profile.id, profile.name || 'Usuário Anônimo')
        })
      }
    } catch (error) {
      console.error('Error accessing profiles table:', error)
    }

    console.log('User IDs found:', userIds.length)
    console.log('Profiles fetched:', userNames.size)

    sessions.forEach((session: any) => {
      const userId = session.user_id
      const userName = userNames.get(userId) || `Usuário ${userId.slice(0, 8)}`
      
      let userStats = userStatsMap.get(userId)
      if (!userStats) {
        userStats = {
          user_id: userId,
          user_name: userName,
          total_questions: 0,
          total_correct: 0,
          discipline_stats: new Map()
        }
        userStatsMap.set(userId, userStats)
      }

      // Atualizar totais
      userStats.total_questions += session.questions_total
      userStats.total_correct += session.correct_answers

      // Atualizar estatísticas por disciplina
      let disciplineStats = userStats.discipline_stats.get(session.discipline)
      if (!disciplineStats) {
        disciplineStats = { questions: 0, correct: 0 }
      }
      disciplineStats.questions += session.questions_total
      disciplineStats.correct += session.correct_answers
      userStats.discipline_stats.set(session.discipline, disciplineStats)
    })

    // Converter para array e calcular acurácia
    const ranking: UserStats[] = Array.from(userStatsMap.values()).map(userStats => {
      const overallAccuracy = userStats.total_questions > 0 
        ? (userStats.total_correct / userStats.total_questions) * 100 
        : 0

      const disciplineStats = Array.from(userStats.discipline_stats.entries()).map(([discipline, stats]) => ({
        discipline,
        questions: stats.questions,
        correct: stats.correct,
        accuracy: stats.questions > 0 ? (stats.correct / stats.questions) * 100 : 0
      }))

      return {
        user_id: userStats.user_id,
        user_name: userStats.user_name,
        total_questions: userStats.total_questions,
        total_correct: userStats.total_correct,
        overall_accuracy: overallAccuracy,
        discipline_stats: disciplineStats
      }
    })

    console.log('Calculated ranking count:', ranking.length)
    
    if (ranking.length === 0) {
      console.log('No ranking entries calculated.')
    } else {
      console.log('Sample ranking entry:', ranking[0])
    }

    return ranking
  } catch (error: any) {
    console.error('Error in getGlobalRanking Server Action:', error.message || 'Unknown error')
    throw new Error(`Erro ao buscar ranking: ${error.message || 'Erro desconhecido'}`)
  } finally {
    console.log('--- getGlobalRanking Server Action Finished ---')
  }
}
