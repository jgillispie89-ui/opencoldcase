'use server'

import { createClient } from '@/lib/supabase/server'

export type DiscussionState = { error?: string } | null

export async function deleteDiscussion(id: string): Promise<{ error?: string; success?: boolean }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'You must be signed in.' }

    const { data: row } = await supabase
      .from('discussions').select('user_id').eq('id', id).single()
    if (!row) return { error: 'Comment not found.' }

    if (row.user_id !== user.id) {
      const { data: profile } = await supabase
        .from('profiles').select('role').eq('id', user.id).single()
      if (profile?.role !== 'super_admin')
        return { error: 'You do not have permission to delete this comment.' }
    }

    const { error } = await supabase.from('discussions').delete().eq('id', id)
    if (error) {
      console.error('[discussions] deleteDiscussion failed:', error.message)
      return { error: error.message }
    }

    return { success: true }
  } catch (err) {
    console.error('[discussions] unexpected exception in deleteDiscussion:', err)
    return { error: 'An unexpected error occurred.' }
  }
}

export async function postComment(
  prevState: DiscussionState,
  formData: FormData
): Promise<DiscussionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'You must be signed in to comment.' }

  const content = (formData.get('content') as string)?.trim()
  const caseId  = formData.get('case_id') as string

  if (!content) return { error: 'Comment cannot be empty.' }
  if (!caseId)  return { error: 'Invalid case.' }

  const { error } = await supabase
    .from('discussions')
    .insert({ case_id: caseId, user_id: user.id, content })

  if (error) return { error: error.message }

  return null
}
