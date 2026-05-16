'use server'

import { createClient } from '@/lib/supabase/server'

export type DiscussionState = { error?: string } | null

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
