'use server'

import { createClient } from '@/lib/supabase/server'

export async function saveNotebook(
  caseId: string,
  content: string,
): Promise<{ error?: string }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'You must be signed in.' }

    const { error } = await supabase
      .from('notebooks')
      .upsert(
        { case_id: caseId, user_id: user.id, content },
        { onConflict: 'case_id,user_id' },
      )

    if (error) {
      console.error('[notebooks] upsert failed — code:', error.code, '| message:', error.message)
      return { error: error.message }
    }

    return {}
  } catch (err) {
    console.error('[notebooks] unexpected exception in saveNotebook:', err)
    return { error: 'An unexpected error occurred.' }
  }
}
