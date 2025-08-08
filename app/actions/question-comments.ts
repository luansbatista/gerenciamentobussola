'use server'

import { createClient } from '@/utils/supabase/servidor'

export interface QuestionComment {
  id: string
  user_id: string
  question_id: string
  comment: string
  created_at: string
  user_name?: string
}

async function getIsAdmin(supabase: Awaited<ReturnType<typeof createClient>>, userId: string): Promise<boolean> {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', userId)
      .maybeSingle()
    return !!profile?.is_admin
  } catch {
    return false
  }
}

export async function addQuestionComment(
  questionId: string,
  comment: string
): Promise<{ success: boolean; message: string }> {
  try {
    const supabase = await createClient()
    const { data: auth, error: authError } = await supabase.auth.getUser()
    if (authError || !auth?.user?.id) {
      return { success: false, message: 'Usuário não autenticado.' }
    }

    const trimmed = (comment || '').trim()
    if (!trimmed) {
      return { success: false, message: 'Comentário não pode ser vazio.' }
    }

    const userName = (auth.user.user_metadata as any)?.name || null

    const { error } = await supabase
      .from('question_comments')
      .insert({
        user_id: auth.user.id,
        question_id: questionId,
        comment: trimmed,
        user_name: userName,
      })

    if (error) {
      return { success: false, message: `Erro ao salvar comentário: ${error.message}` }
    }

    return { success: true, message: 'Comentário adicionado!' }
  } catch (e: any) {
    return { success: false, message: e.message || 'Erro desconhecido ao salvar comentário.' }
  }
}

export async function getQuestionComments(
  questionId: string
): Promise<{ success: boolean; comments: QuestionComment[]; message?: string }> {
  try {
    const supabase = await createClient()
    const { data: auth, error: authError } = await supabase.auth.getUser()
    if (authError || !auth?.user?.id) {
      return { success: false, comments: [], message: 'Usuário não autenticado.' }
    }

    const { data, error } = await supabase
      .from('question_comments')
      .select('id,user_id,question_id,comment,created_at,user_name')
      .eq('question_id', questionId)
      .order('created_at', { ascending: false })

    if (error) {
      return { success: false, comments: [], message: `Erro ao buscar comentários: ${error.message}` }
    }

    return { success: true, comments: (data as QuestionComment[]) || [] }
  } catch (e: any) {
    return { success: false, comments: [], message: e.message || 'Erro desconhecido ao buscar comentários.' }
  }
}

export async function updateQuestionComment(
  commentId: string,
  newComment: string
): Promise<{ success: boolean; message: string }> {
  try {
    const supabase = await createClient()
    const { data: auth, error: authError } = await supabase.auth.getUser()
    if (authError || !auth?.user?.id) {
      return { success: false, message: 'Usuário não autenticado.' }
    }

    const trimmed = (newComment || '').trim()
    if (!trimmed) {
      return { success: false, message: 'Comentário não pode ser vazio.' }
    }

    // Buscar o comentário para checar propriedade
    const { data: existing, error: fetchErr } = await supabase
      .from('question_comments')
      .select('id,user_id')
      .eq('id', commentId)
      .maybeSingle()
    if (fetchErr || !existing) {
      return { success: false, message: 'Comentário não encontrado.' }
    }

    const isOwner = existing.user_id === auth.user.id
    const isAdmin = await getIsAdmin(supabase, auth.user.id)
    if (!isOwner && !isAdmin) {
      return { success: false, message: 'Sem permissão para editar este comentário.' }
    }

    const { error } = await supabase
      .from('question_comments')
      .update({ comment: trimmed })
      .eq('id', commentId)
    if (error) {
      return { success: false, message: `Erro ao atualizar comentário: ${error.message}` }
    }

    return { success: true, message: 'Comentário atualizado.' }
  } catch (e: any) {
    return { success: false, message: e.message || 'Erro desconhecido ao atualizar comentário.' }
  }
}

export async function deleteQuestionComment(
  commentId: string
): Promise<{ success: boolean; message: string }> {
  try {
    const supabase = await createClient()
    const { data: auth, error: authError } = await supabase.auth.getUser()
    if (authError || !auth?.user?.id) {
      return { success: false, message: 'Usuário não autenticado.' }
    }

    // Buscar o comentário para checar propriedade
    const { data: existing, error: fetchErr } = await supabase
      .from('question_comments')
      .select('id,user_id')
      .eq('id', commentId)
      .maybeSingle()
    if (fetchErr || !existing) {
      return { success: false, message: 'Comentário não encontrado.' }
    }

    const isOwner = existing.user_id === auth.user.id
    const isAdmin = await getIsAdmin(supabase, auth.user.id)
    if (!isOwner && !isAdmin) {
      return { success: false, message: 'Sem permissão para excluir este comentário.' }
    }

    const { error } = await supabase
      .from('question_comments')
      .delete()
      .eq('id', commentId)
    if (error) {
      return { success: false, message: `Erro ao excluir comentário: ${error.message}` }
    }

    return { success: true, message: 'Comentário excluído.' }
  } catch (e: any) {
    return { success: false, message: e.message || 'Erro desconhecido ao excluir comentário.' }
  }
}


