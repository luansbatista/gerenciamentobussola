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

export interface Simulation {
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
  duration_minutes?: number
  total_questions?: number
}

export interface CreateSimulationData {
  title: string
  description?: string
  discipline: string
  subject?: string
  file_name: string
  file_url: string
  file_size?: number
  duration_minutes?: number
  total_questions?: number
}

export interface UpdateSimulationData {
  id: string
  title?: string
  description?: string
  discipline?: string
  subject?: string
  file_name?: string
  file_url?: string
  file_size?: number
  is_active?: boolean
  duration_minutes?: number
  total_questions?: number
}

// Buscar todos os simulados ativos
export async function getDisciplineSimulations(discipline?: string) {
  try {
    const supabase = await createClient()
    
    let query = supabase
      .from('simulations')
      .select('*')
      .eq('is_active', true)
      .order('discipline', { ascending: true })
      .order('title', { ascending: true })

    if (discipline && discipline !== 'all') {
      query = query.eq('discipline', discipline)
    }

    const { data, error } = await query

    if (error) {
      console.error('Erro ao buscar simulados:', error)
      throw new Error('Erro ao buscar simulados')
    }

    return data || []
  } catch (error) {
    console.error('Erro ao buscar simulados:', error)
    throw new Error('Erro ao buscar simulados')
  }
}

// Buscar todos os simulados (apenas para admins)
export async function getAllSimulations() {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('simulations')
      .select('*')
      .order('discipline', { ascending: true })
      .order('title', { ascending: true })

    if (error) {
      console.error('Erro ao buscar todos os simulados:', error)
      throw new Error('Erro ao buscar simulados')
    }

    return data || []
  } catch (error) {
    console.error('Erro ao buscar todos os simulados:', error)
    throw new Error('Erro ao buscar simulados')
  }
}

// Buscar simulado por ID
export async function getSimulationById(id: string) {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('simulations')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Erro ao buscar simulado:', error)
      throw new Error('Erro ao buscar simulado')
    }

    return data
  } catch (error) {
    console.error('Erro ao buscar simulado:', error)
    throw new Error('Erro ao buscar simulado')
  }
}

// Criar novo simulado
export async function createSimulation(data: CreateSimulationData) {
  try {
    const supabase = await createClient()

    const { data: simulation, error } = await supabase
      .from('simulations')
      .insert({
        title: data.title,
        description: data.description || null,
        discipline: data.discipline,
        subject: data.subject || null,
        file_name: data.file_name,
        file_url: data.file_url,
        file_size: data.file_size || null,
        duration_minutes: data.duration_minutes || null,
        total_questions: data.total_questions || null,
        created_by: (await supabase.auth.getUser()).data.user?.id || null
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar simulado:', error)
      throw new Error('Erro ao criar simulado')
    }

    revalidatePath('/admin-simulations')
    return simulation
  } catch (error) {
    console.error('Erro ao criar simulado:', error)
    throw new Error('Erro ao criar simulado')
  }
}

// Atualizar simulado
export async function updateSimulation(data: UpdateSimulationData) {
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
    if (data.duration_minutes !== undefined) updateData.duration_minutes = data.duration_minutes
    if (data.total_questions !== undefined) updateData.total_questions = data.total_questions

    const { data: simulation, error } = await supabase
      .from('simulations')
      .update(updateData)
      .eq('id', data.id)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar simulado:', error)
      throw new Error('Erro ao atualizar simulado')
    }

    revalidatePath('/admin-simulations')
    revalidatePath('/simulations')
    return simulation
  } catch (error) {
    console.error('Erro ao atualizar simulado:', error)
    throw new Error('Erro ao atualizar simulado')
  }
}

// Deletar simulado (soft delete)
export async function deleteSimulation(id: string) {
  try {
    const supabase = await createClient()
    
    const { error } = await supabase
      .from('simulations')
      .update({ is_active: false })
      .eq('id', id)

    if (error) {
      console.error('Erro ao deletar simulado:', error)
      throw new Error('Erro ao deletar simulado')
    }

    revalidatePath('/admin-simulations')
    revalidatePath('/simulations')
    return true
  } catch (error) {
    console.error('Erro ao deletar simulado:', error)
    throw new Error('Erro ao deletar simulado')
  }
}

// Deletar simulado permanentemente (apenas para admins)
export async function permanentlyDeleteSimulation(id: string) {
  try {
    const supabase = await createClient()
    
    const { error } = await supabase
      .from('simulations')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Erro ao deletar simulado permanentemente:', error)
      throw new Error('Erro ao deletar simulado')
    }

    revalidatePath('/admin-simulations')
    revalidatePath('/simulations')
    return true
  } catch (error) {
    console.error('Erro ao deletar simulado permanentemente:', error)
    throw new Error('Erro ao deletar simulado')
  }
}

// Buscar disciplinas disponíveis para simulados
export async function getAvailableSimulationDisciplines() {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('simulations')
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

// Buscar estatísticas dos simulados
export async function getSimulationStats() {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('simulations')
      .select('discipline, is_active')

    if (error) {
      console.error('Erro ao buscar estatísticas:', error)
      throw new Error('Erro ao buscar estatísticas')
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
    throw new Error('Erro ao buscar estatísticas')
  }
}
