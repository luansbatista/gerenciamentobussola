'use server'

import { createClient } from '@/utils/supabase/servidor'
import { z } from 'zod'

// Define o schema esperado para cada linha do Excel
const importRowSchema = z.object({
  Data: z.string(), // Ex: "DD/MM/YYYY" ou "YYYY-MM-DD"
  Disciplina: z.string().min(1, "Disciplina é obrigatória"),
  Assunto: z.string().min(1, "Assunto é obrigatório"),
  'Questões Totais': z.number().int().positive("Questões Totais deve ser um número positivo"),
  Acertos: z.number().int().min(0, "Acertos não pode ser negativo"),
  'Tempo de Estudo (min)': z.number().int().positive("Tempo de Estudo deve ser um número positivo"),
})

type ImportRow = z.infer<typeof importRowSchema>

export async function importStudySessions(data: any[]): Promise<{ success: boolean; message: string; importedCount?: number; errorDetails?: any[] }> {
  const supabase = await createClient()
  const { data: userAuth, error: userError } = await supabase.auth.getUser()
  if (userError || !userAuth?.user?.id) {
    console.error('Authentication error in importStudySessions:', userError)
    return { success: false, message: 'Usuário não autenticado.' }
  }

  const userId = userAuth.user.id
  const sessionsToInsert: any[] = []
  const errors: any[] = []

  for (const [index, row] of data.entries()) {
    try {
      const parsedRow = importRowSchema.parse(row)

      const questionsTotal = parsedRow['Questões Totais']
      const correctAnswers = parsedRow['Acertos']
      const studyTimeMinutes = parsedRow['Tempo de Estudo (min)']

      if (correctAnswers > questionsTotal) {
        throw new Error(`Acertos (${correctAnswers}) não pode ser maior que Questões Totais (${questionsTotal}) na linha ${index + 2}.`)
      }

      const wrongAnswers = questionsTotal - correctAnswers
      const accuracy = questionsTotal > 0 ? (correctAnswers / questionsTotal) * 100 : 0
      const avgTimePerQuestion = questionsTotal > 0 ? studyTimeMinutes / questionsTotal : 0

      // Tenta parsear a data em diferentes formatos
      let parsedDate: Date | null = null;
      const dateString = parsedRow.Data;

      // Tenta formato YYYY-MM-DD (ISO)
      if (!isNaN(new Date(dateString).getTime()) && dateString.includes('-')) {
        parsedDate = new Date(dateString);
      } else { // Tenta formato DD/MM/YYYY
        const parts = dateString.split('/');
        if (parts.length === 3) {
          parsedDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
        }
      }

      if (!parsedDate || isNaN(parsedDate.getTime())) {
        throw new Error(`Formato de data inválido na linha ${index + 2}: "${dateString}". Use YYYY-MM-DD ou DD/MM/YYYY.`);
      }

      sessionsToInsert.push({
        user_id: userId,
        date: parsedDate.toISOString().split('T')[0], // Formato 'YYYY-MM-DD'
        discipline: parsedRow.Disciplina,
        subject: parsedRow.Assunto,
        questions_total: questionsTotal,
        correct_answers: correctAnswers,
        wrong_answers: wrongAnswers,
        accuracy_percentage: accuracy,
        study_time_minutes: studyTimeMinutes,
        avg_time_per_question: avgTimePerQuestion,
      })
    } catch (e: any) {
      console.error(`Validation error on row ${index + 2}:`, e.errors || e.message)
      errors.push({ row: index + 2, error: e.errors ? e.errors.map((err: any) => err.message).join(', ') : e.message })
    }
  }

  if (sessionsToInsert.length === 0) {
    return { success: false, message: 'Nenhum dado válido para importar.', errorDetails: errors }
  }

  try {
    const { error } = await supabase
      .from('study_sessions')
      .insert(sessionsToInsert)

    if (error) {
      console.error('Supabase insert error:', error)
      return { success: false, message: `Erro ao inserir dados no banco: ${error.message}`, errorDetails: errors }
    }

    return { success: true, message: `${sessionsToInsert.length} sessões importadas com sucesso!`, importedCount: sessionsToInsert.length, errorDetails: errors }
  } catch (error: any) {
    console.error('Unexpected error during import:', error)
    return { success: false, message: `Erro inesperado durante a importação: ${error.message}`, errorDetails: errors }
  }
}
