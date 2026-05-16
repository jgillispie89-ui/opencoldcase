'use server'

import { createClient } from '@/lib/supabase/server'

export async function postTheory(
  caseId: string,
  title: string,
  content: string
): Promise<{ error?: string; theory?: { id: string; upvotes: number; created_at: string; updated_at: string } }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user)    return { error: 'You must be signed in to post a theory.' }
    if (!title)   return { error: 'Title is required.' }
    if (!content) return { error: 'Theory content is required.' }

    const { data, error } = await supabase
      .from('theories')
      .insert({ case_id: caseId, user_id: user.id, title, content })
      .select('id, upvotes, created_at, updated_at')
      .single()

    if (error) {
      console.error('[theories] insert failed — code:', error.code, '| message:', error.message, '| details:', error.details)
      return { error: error.message }
    }

    console.log('[theories] inserted successfully — id:', data.id, 'user:', user.id, 'case:', caseId)
    return { theory: data }
  } catch (err) {
    console.error('[theories] unexpected exception in postTheory:', err)
    return { error: 'An unexpected error occurred. Please try again.' }
  }
}

export async function toggleUpvote(theoryId: string): Promise<{ error?: string }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'You must be signed in to upvote.' }

    const { error } = await supabase.rpc('toggle_theory_upvote', { p_theory_id: theoryId })
    if (error) {
      console.error('[theories] toggleUpvote RPC failed:', error.message)
      return { error: error.message }
    }

    return {}
  } catch (err) {
    console.error('[theories] unexpected exception in toggleUpvote:', err)
    return { error: 'An unexpected error occurred.' }
  }
}
