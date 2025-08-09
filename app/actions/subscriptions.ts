'use server'

import { createClient as createServerClient } from '@/utils/supabase/servidor'
import { createClient as createClientClient } from '@/utils/supabase/cliente'

async function createClient() {
  try {
    return await createServerClient()
  } catch {
    return createClientClient()
  }
}

export interface SubscriptionInfo {
  email: string
  is_subscribed: boolean
  plan: 'monthly' | 'annual' | null
}

export interface SubscriptionRow extends SubscriptionInfo {
  id: string
  name: string | null
  created_at: string
}

export async function getSubscriptionByEmail(email: string): Promise<SubscriptionInfo | null> {
  const supabase = await createClient()
  const normalized = (email || '').trim().toLowerCase()
  const { data, error } = await supabase
    .from('profiles')
    .select('email, is_subscribed, plan')
    .eq('email', normalized)
    .maybeSingle()

  if (error) {
    console.error('Erro ao buscar assinatura:', error)
    throw new Error('Erro ao buscar assinatura')
  }
  if (!data) return null
  return {
    email: data.email,
    is_subscribed: Boolean(data.is_subscribed),
    plan: (data.plan as any) ?? null,
  }
}

export async function activateSubscriptionByEmail(email: string, plan: 'monthly' | 'annual') {
  const supabase = await createClient()
  const normalized = (email || '').trim().toLowerCase()
  const { error } = await supabase
    .from('profiles')
    .update({ is_subscribed: true, plan })
    .eq('email', normalized)

  if (error) {
    console.error('Erro ao ativar assinatura:', error)
    throw new Error('Erro ao ativar assinatura')
  }
  return { success: true }
}

export async function deactivateSubscriptionByEmail(email: string) {
  const supabase = await createClient()
  const normalized = (email || '').trim().toLowerCase()
  const { error } = await supabase
    .from('profiles')
    .update({ is_subscribed: false, plan: null })
    .eq('email', normalized)

  if (error) {
    console.error('Erro ao desativar assinatura:', error)
    throw new Error('Erro ao desativar assinatura')
  }
  return { success: true }
}

export async function listSubscriptions(params?: { search?: string; limit?: number; offset?: number }): Promise<{ rows: SubscriptionRow[]; total: number }> {
  const supabase = await createClient()
  const search = (params?.search || '').trim().toLowerCase()
  const limit = params?.limit ?? 20
  const offset = params?.offset ?? 0

  let query = supabase
    .from('profiles')
    .select('id, email, name, is_subscribed, plan, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (search) {
    query = query.or(`email.ilike.%${search}%,name.ilike.%${search}%`)
  }

  const { data, error, count } = await query
  if (error) {
    console.error('Erro ao listar assinaturas:', error)
    throw new Error('Erro ao listar assinaturas')
  }

  const rows: SubscriptionRow[] = (data || []).map((r: any) => ({
    id: r.id,
    email: r.email,
    name: r.name ?? null,
    is_subscribed: Boolean(r.is_subscribed),
    plan: (r.plan as any) ?? null,
    created_at: r.created_at,
  }))

  return { rows, total: count ?? rows.length }
}
