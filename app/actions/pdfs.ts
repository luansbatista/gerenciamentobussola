'use server'

import { createClient as createServerClient } from '@/utils/supabase/servidor'
import { createClient as createClientClient } from '@/utils/supabase/cliente'
import { revalidatePath } from 'next/cache'

// Função helper para criar cliente Supabase
async function createClient() {
  try {
    // Tentar usar o cliente do servidor primeiro
    return await createServerClient()
  } catch (error) {
    // Se falhar, usar o cliente do cliente
    return createClientClient()
  }
}

export interface DisciplinePdf {
  id: string
  title: string
  description: string | null
  discipline: string
  subject: string | null
  file_name: string
  file_url: string
  file_size: number | null
  created_at: string
  updated_at: string
  created_by: string | null
  is_active: boolean
}

export interface CreatePdfData {
  title: string
  description?: string
  discipline: string
  subject?: string
  file_name: string
  file_url: string
  file_size?: number
}

export interface UpdatePdfData {
  id: string
  title?: string
  description?: string
  discipline?: string
  subject?: string
  file_name?: string
  file_url?: string
  file_size?: number
  is_active?: boolean
}

// Buscar todos os PDFs ativos
export async function getDisciplinePdfs(discipline?: string) {
  try {
    const supabase = await createClient()
    
    let query = supabase
      .from('discipline_pdfs')
      .select('*')
      .eq('is_active', true)
      .order('discipline', { ascending: true })
      .order('title', { ascending: true })

    if (discipline && discipline !== 'all') {
      query = query.eq('discipline', discipline)
    }

    const { data, error } = await query

    if (error) {
      console.error('Erro ao buscar PDFs:', error)
      throw new Error('Erro ao buscar PDFs')
    }

    return data || []
  } catch (error) {
    console.error('Erro ao buscar PDFs:', error)
    throw new Error('Erro ao buscar PDFs')
  }
}

// Buscar todos os PDFs (apenas para admins)
export async function getAllPdfs() {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('discipline_pdfs')
      .select('*')
      .order('discipline', { ascending: true })
      .order('title', { ascending: true })

    if (error) {
      console.error('Erro ao buscar todos os PDFs:', error)
      throw new Error('Erro ao buscar PDFs')
    }

    return data || []
  } catch (error) {
    console.error('Erro ao buscar todos os PDFs:', error)
    throw new Error('Erro ao buscar PDFs')
  }
}

// Buscar PDF por ID
export async function getPdfById(id: string) {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('discipline_pdfs')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Erro ao buscar PDF:', error)
      throw new Error('Erro ao buscar PDF')
    }

    return data
  } catch (error) {
    console.error('Erro ao buscar PDF:', error)
    throw new Error('Erro ao buscar PDF')
  }
}

// Criar novo PDF
export async function createPdf(data: CreatePdfData) {
  try {
    const supabase = await createClient()

    const { data: pdf, error } = await supabase
      .from('discipline_pdfs')
      .insert({
        title: data.title,
        description: data.description || null,
        discipline: data.discipline,
        subject: data.subject || null,
        file_name: data.file_name,
        file_url: data.file_url,
        file_size: data.file_size || null,
        created_by: (await supabase.auth.getUser()).data.user?.id || null
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar PDF:', error)
      throw new Error('Erro ao criar PDF')
    }

    revalidatePath('/admin-pdfs')
    return pdf
  } catch (error) {
    console.error('Erro ao criar PDF:', error)
    throw new Error('Erro ao criar PDF')
  }
}

// Atualizar PDF
export async function updatePdf(data: UpdatePdfData) {
  try {
    const supabase = await createClient()
    
    const updateData: any = {}
    if (data.title !== undefined) updateData.title = data.title
    if (data.description !== undefined) updateData.description = data.description
    if (data.discipline !== undefined) updateData.discipline = data.discipline
    if (data.subject !== undefined) updateData.subject = data.subject
    if (data.file_name !== undefined) updateData.file_name = data.file_name
    if (data.file_url !== undefined) updateData.file_url = data.file_url
    if (data.file_size !== undefined) updateData.file_size = data.file_size
    if (data.is_active !== undefined) updateData.is_active = data.is_active

    const { data: pdf, error } = await supabase
      .from('discipline_pdfs')
      .update(updateData)
      .eq('id', data.id)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar PDF:', error)
      throw new Error('Erro ao atualizar PDF')
    }

    revalidatePath('/admin-pdfs')
    revalidatePath('/pdfs')
    return pdf
  } catch (error) {
    console.error('Erro ao atualizar PDF:', error)
    throw new Error('Erro ao atualizar PDF')
  }
}

// Deletar PDF (soft delete)
export async function deletePdf(id: string) {
  try {
    const supabase = await createClient()
    
    const { error } = await supabase
      .from('discipline_pdfs')
      .update({ is_active: false })
      .eq('id', id)

    if (error) {
      console.error('Erro ao deletar PDF:', error)
      throw new Error('Erro ao deletar PDF')
    }

    revalidatePath('/admin-pdfs')
    revalidatePath('/pdfs')
    return true
  } catch (error) {
    console.error('Erro ao deletar PDF:', error)
    throw new Error('Erro ao deletar PDF')
  }
}

// Deletar PDF permanentemente (apenas para admins)
export async function permanentlyDeletePdf(id: string) {
  try {
    const supabase = await createClient()
    
    const { error } = await supabase
      .from('discipline_pdfs')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Erro ao deletar PDF permanentemente:', error)
      throw new Error('Erro ao deletar PDF')
    }

    revalidatePath('/admin-pdfs')
    revalidatePath('/pdfs')
    return true
  } catch (error) {
    console.error('Erro ao deletar PDF permanentemente:', error)
    throw new Error('Erro ao deletar PDF')
  }
}

// Buscar disciplinas disponíveis
export async function getAvailableDisciplines() {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('discipline_pdfs')
      .select('discipline')
      .eq('is_active', true)
      .order('discipline', { ascending: true })

    if (error) {
      console.error('Erro ao buscar disciplinas:', error)
      throw new Error('Erro ao buscar disciplinas')
    }

    // Extrair disciplinas únicas
    const uniqueDisciplines = [...new Set(data?.map(item => item.discipline) || [])]
    
    return uniqueDisciplines
  } catch (error) {
    console.error('Erro ao buscar disciplinas:', error)
    throw new Error('Erro ao buscar disciplinas')
  }
}

// Buscar estatísticas dos PDFs
export async function getPdfStats() {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('discipline_pdfs')
      .select('discipline, is_active')

    if (error) {
      console.error('Erro ao buscar estatísticas:', error)
      // Retornar estatísticas vazias em caso de erro para não quebrar a aplicação
      return {
        total: 0,
        active: 0,
        inactive: 0,
        byDiscipline: {}
      }
    }

    const stats = {
      total: data?.length || 0,
      active: data?.filter(item => item.is_active).length || 0,
      inactive: data?.filter(item => !item.is_active).length || 0,
      byDiscipline: {} as Record<string, number>
    }

    data?.forEach(item => {
      if (item.is_active) {
        stats.byDiscipline[item.discipline] = (stats.byDiscipline[item.discipline] || 0) + 1
      }
    })

    return stats
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error)
    // Retornar estatísticas vazias em caso de erro para não quebrar a aplicação
    return {
      total: 0,
      active: 0,
      inactive: 0,
      byDiscipline: {}
    }
  }
}
