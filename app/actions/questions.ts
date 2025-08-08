'use server'

import { createClient } from '@/utils/supabase/servidor'

interface Question {
  id: string
  discipline: string
  subject: string
  question_text: string
  options: string[]
  correct_option_index: number
  created_at: string
}

interface CreateQuestionData {
  discipline: string
  subject: string
  question_text: string
  options: string[]
  correct_option_index: number
}

/**
 * Cria uma nova questão no banco de dados
 */
export async function createQuestion(data: CreateQuestionData): Promise<{ success: boolean; message: string; questionId?: string }> {
  try {
    const supabase = await createClient()
    const { data: userAuth, error: userError } = await supabase.auth.getUser()
    
    if (userError || !userAuth?.user?.id) {
      console.error('Authentication error in createQuestion:', userError)
      return { success: false, message: 'Usuário não autenticado.' }
    }

    // Verificar se o usuário é admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', userAuth.user.id)
      .single()

    if (profileError || !profile?.is_admin) {
      console.error('Authorization error in createQuestion:', profileError)
      return { success: false, message: 'Acesso negado. Apenas administradores podem criar questões.' }
    }

    // Validar dados da questão
    if (!data.question_text.trim()) {
      return { success: false, message: 'Texto da questão é obrigatório.' }
    }

    if (data.options.length < 2) {
      return { success: false, message: 'A questão deve ter pelo menos 2 opções.' }
    }

    if (data.correct_option_index < 0 || data.correct_option_index >= data.options.length) {
      return { success: false, message: 'Índice da opção correta inválido.' }
    }

    // Inserir a questão
    const { data: question, error } = await supabase
      .from('questions')
      .insert({
        discipline: data.discipline,
        subject: data.subject,
        question_text: data.question_text,
        options: data.options,
        correct_option_index: data.correct_option_index,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating question:', error)
      return { success: false, message: `Erro ao criar questão: ${error.message}` }
    }

    return { 
      success: true, 
      message: 'Questão criada com sucesso!',
      questionId: question.id
    }
  } catch (error: any) {
    console.error('Error in createQuestion Server Action:', error)
    return { success: false, message: error.message || 'Erro desconhecido ao criar questão.' }
  }
}

/**
 * Busca questões aleatórias para o banco de questões
 */
export interface QuestionFilters {
  limit?: number
  discipline?: string
  subject?: string
  answeredFilter?: 'all' | 'answered' | 'unanswered'
  correctnessFilter?: 'all' | 'correct' | 'incorrect'
}

export async function getRandomQuestions(
  limit: number = 10,
  filters?: QuestionFilters
): Promise<Question[]> {
  try {
    const supabase = await createClient()
    const { data: userAuth, error: userError } = await supabase.auth.getUser()
    
    if (userError || !userAuth?.user?.id) {
      console.error('Authentication error in getRandomQuestions:', userError)
      throw new Error('Usuário não autenticado.')
    }

    // Usuário comum pode carregar questões para praticar
    const disciplineFilter = filters?.discipline
    const subjectFilter = filters?.subject
    const answeredFilter = filters?.answeredFilter ?? 'all'
    const correctnessFilter = filters?.correctnessFilter ?? 'all'

    // Pré-buscar respostas do usuário para aplicar filtros de feito/não feito e acertos/erros
    let answeredMap = new Map<string, boolean>()
    let correctMap = new Map<string, boolean>()

    if (answeredFilter !== 'all' || correctnessFilter !== 'all') {
      const answersQuery = supabase
        .from('question_answers')
        .select('question_id,is_correct,discipline,subject')
        .eq('user_id', userAuth.user.id)

      if (disciplineFilter) answersQuery.eq('discipline', disciplineFilter)
      if (subjectFilter) answersQuery.eq('subject', subjectFilter)

      const { data: answers, error: answersError } = await answersQuery

      if (answersError) {
        console.error('Error fetching user answers for filtering:', answersError)
        throw new Error(`Erro ao buscar respostas do usuário: ${answersError.message}`)
      }

      for (const a of answers || []) {
        answeredMap.set(a.question_id, true)
        correctMap.set(a.question_id, !!a.is_correct)
      }
    }

    // Buscar questões com filtros básicos
    const baseQuery = supabase
      .from('questions')
      .select('*')
      .order('created_at', { ascending: false })

    if (disciplineFilter) baseQuery.eq('discipline', disciplineFilter)
    if (subjectFilter) baseQuery.eq('subject', subjectFilter)

    // Buscar um lote maior e filtrar em memória para aplicar regras de respondidas/corretas
    const fetchLimit = Math.max(limit * 5, 50)
    const { data: allQuestions, error } = await baseQuery.limit(fetchLimit)

    if (error) {
      console.error('Error fetching questions:', error)
      throw new Error(`Erro ao buscar questões: ${error.message}`)
    }

    let filtered = (allQuestions || []) as Question[]

    if (answeredFilter !== 'all') {
      filtered = filtered.filter(q => {
        const isAnswered = answeredMap.has(q.id)
        return answeredFilter === 'answered' ? isAnswered : !isAnswered
      })
    }

    if (correctnessFilter !== 'all') {
      // Só faz sentido em respondidas; se filtro de não respondidas, ignorar
      if (answeredFilter !== 'unanswered') {
        filtered = filtered.filter(q => {
          const isAnswered = answeredMap.has(q.id)
          const isCorrect = correctMap.get(q.id) === true
          if (!isAnswered) return false
          return correctnessFilter === 'correct' ? isCorrect : !isCorrect
        })
      }
    }

    // Limitar ao desejado
    return filtered.slice(0, limit)
  } catch (error: any) {
    console.error('Error in getRandomQuestions Server Action:', error)
    throw new Error(`Erro ao buscar questões: ${error.message || 'Erro desconhecido'}`)
  }
}

/**
 * Importa questões de um arquivo Excel
 */
export async function importQuestions(fileData: ArrayBuffer): Promise<{ success: boolean; message: string; importedCount?: number; errorDetails?: any[] }> {
  try {
    const supabase = await createClient()
    const { data: userAuth, error: userError } = await supabase.auth.getUser()
    
    if (userError || !userAuth?.user?.id) {
      console.error('Authentication error in importQuestions:', userError)
      return { success: false, message: 'Usuário não autenticado.' }
    }

    // Verificar se o usuário é admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', userAuth.user.id)
      .single()

    if (profileError || !profile?.is_admin) {
      console.error('Authorization error in importQuestions:', profileError)
      return { success: false, message: 'Acesso negado. Apenas administradores podem importar questões.' }
    }

    // Processar arquivo Excel
    const XLSX = await import('xlsx')
    const workbook = XLSX.read(new Uint8Array(fileData), { type: 'array' })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    const json = XLSX.utils.sheet_to_json(worksheet)

    const questionsToInsert: any[] = []
    const errors: any[] = []

    for (const [index, row] of json.entries()) {
      try {
        // Normalização de cabeçalhos e valores para aceitar planilhas diversas
        const rowData = row as any
        const norm = (s: any) => String(s ?? '')
          .normalize('NFD')
          .replace(/\p{Diacritic}/gu, '')
          .toLowerCase()
          .trim()

        const keys = Object.keys(rowData)
        const findVal = (...cands: string[]) => {
          for (const k of keys) {
            const nk = norm(k)
            if (cands.some(c => nk.includes(c))) return rowData[k]
          }
          return ''
        }

        const disciplina = rowData['Disciplina'] ?? findVal('disciplina', 'materia')
        const assunto = rowData['Assunto'] ?? findVal('assunto', 'topico', 'tema')
        const questao = rowData['Questão'] ?? rowData['Questao'] ?? findVal('questao', 'pergunta', 'enunciado')
        let opcoesRaw = rowData['Opções'] ?? rowData['Opcoes'] ?? findVal('opcoes', 'alternativas', 'respostas')
        const corretaRaw = rowData['Correta'] ?? findVal('correta', 'gabarito', 'resposta')

        // Montar opções a partir de colunas A..E quando não houver coluna única
        let options: string[] = []
        if (opcoesRaw && String(opcoesRaw).trim() !== '') {
          options = String(opcoesRaw)
            .split(/\r?\n|\||;|\//)
            .map((s: string) => s.trim())
            .filter((s: string) => s.length > 0)
        } else {
          const letterCols = keys.filter(k => /^(a|b|c|d|e)(\)|\.|\s|:)?$/i.test(norm(k)))
          if (letterCols.length >= 2) {
            options = letterCols
              .map(col => String(rowData[col] || '').trim())
              .filter(s => s.length > 0)
          }
        }

        if (!disciplina || !assunto || !questao || options.length < 2 || !String(corretaRaw)) {
          throw new Error('Campos obrigatórios ausentes')
        }

        // Índice da correta pode ser número, letra (A..E) ou o próprio texto da opção
        const corrStr = String(corretaRaw).trim()
        let correctIndex = -1
        const asNumber = parseInt(corrStr, 10)
        if (!Number.isNaN(asNumber)) {
          correctIndex = asNumber - 1
        } else {
          const letter = corrStr.replace(/[^a-z]/gi, '').toUpperCase()
          if (/^[A-Z]$/.test(letter)) {
            correctIndex = letter.charCodeAt(0) - 'A'.charCodeAt(0)
          } else {
            const idx = options.findIndex(opt => norm(opt) === norm(corrStr))
            correctIndex = idx
          }
        }

        if (correctIndex < 0 || correctIndex >= options.length) {
          throw new Error('Índice/valor da opção correta inválido')
        }

        questionsToInsert.push({
          discipline: String(disciplina),
          subject: String(assunto),
          question_text: String(questao),
          options,
          correct_option_index: correctIndex,
        })
      } catch (e: any) {
        errors.push({ row: index + 2, error: e.message })
      }
    }

    if (questionsToInsert.length === 0) {
      return { success: false, message: 'Nenhuma questão válida encontrada no arquivo.', errorDetails: errors }
    }

    // Inserir questões no banco
    const { error } = await supabase
      .from('questions')
      .insert(questionsToInsert)

    if (error) {
      console.error('Error inserting questions:', error)
      return { success: false, message: `Erro ao inserir questões: ${error.message}`, errorDetails: errors }
    }

    return { 
      success: true, 
      message: `${questionsToInsert.length} questões importadas com sucesso!`, 
      importedCount: questionsToInsert.length, 
      errorDetails: errors 
    }
  } catch (error: any) {
    console.error('Error in importQuestions Server Action:', error)
    return { success: false, message: error.message || 'Erro desconhecido ao importar questões.' }
  }
}

/**
 * Inserção em massa com dados já normalizados (alternativa de importação com mapeamento manual no cliente)
 */
export async function bulkInsertQuestions(items: Array<{
  discipline: string
  subject: string
  question_text: string
  options: string[]
  correct_option_index: number
}>): Promise<{ success: boolean; message: string; insertedCount?: number; errors?: any[] }> {
  try {
    const supabase = await createClient()
    const { data: userAuth, error: userError } = await supabase.auth.getUser()
    if (userError || !userAuth?.user?.id) {
      return { success: false, message: 'Usuário não autenticado.' }
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', userAuth.user.id)
      .single()
    if (!profile?.is_admin) {
      return { success: false, message: 'Acesso negado. Apenas administradores podem importar questões.' }
    }

    const errors: any[] = []
    const valid: any[] = []
    items.forEach((q, idx) => {
      const discipline = String(q.discipline || '').trim()
      const subject = String(q.subject || '').trim()
      const question_text = String(q.question_text || '').trim()
      const options = Array.isArray(q.options) ? q.options.map(o => String(o || '').trim()).filter(Boolean) : []
      const correct_option_index = Number(q.correct_option_index)
      if (!discipline || !subject || !question_text || options.length < 2 || correct_option_index < 0 || correct_option_index >= options.length) {
        errors.push({ index: idx, error: 'Dados inválidos para a questão' })
      } else {
        valid.push({ discipline, subject, question_text, options, correct_option_index })
      }
    })

    if (valid.length === 0) {
      return { success: false, message: 'Nenhuma questão válida para inserir.', errors }
    }

    const { error } = await supabase.from('questions').insert(valid)
    if (error) {
      return { success: false, message: `Erro ao inserir questões: ${error.message}`, errors }
    }
    return { success: true, message: `${valid.length} questões importadas com sucesso!`, insertedCount: valid.length, errors }
  } catch (e: any) {
    return { success: false, message: e.message || 'Erro desconhecido ao importar questões.' }
  }
}

/**
 * Conta total de questões considerando filtros simples (disciplina/assunto).
 * Observação: não aplica filtros respondidas/corretas por motivo de custo.
 */
export async function getQuestionsTotalCount(filters?: { discipline?: string; subject?: string }): Promise<number> {
  const supabase = await createClient()
  const query = supabase.from('questions').select('*', { count: 'exact', head: true })
  if (filters?.discipline) query.eq('discipline', filters.discipline)
  if (filters?.subject) query.eq('subject', filters.subject)
  const { count } = await query
  return count ?? 0
}

/**
 * Gera mini simulado por assuntos (quantidades solicitadas por assunto)
 */
export async function generateMiniSimulation(requests: Array<{ discipline?: string; subject: string; count: number }>): Promise<Question[]> {
  const supabase = await createClient()
  let result: Question[] = []

  // Função util para embaralhar
  const shuffle = <T,>(arr: T[]): T[] => {
    const a = arr.slice()
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[a[i], a[j]] = [a[j], a[i]]
    }
    return a
  }

  for (const req of requests) {
    if (!req.subject || req.count <= 0) continue
    let q = supabase.from('questions').select('*').eq('subject', req.subject)
    if (req.discipline) q = q.eq('discipline', req.discipline)
    // Buscar um lote maior e sortear em memória
    const { data, error } = await q.limit(Math.max(req.count * 5, 50))
    if (error) continue
    const picked = shuffle(data || []).slice(0, req.count)
    result = result.concat(picked as Question[])
  }

  // Embaralhar o conjunto final
  return shuffle(result)
}
