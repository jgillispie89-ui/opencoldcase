'use server'

import { createClient } from '@/lib/supabase/server'

export async function postEvidence(
  caseId: string,
  title: string,
  description: string,
  fileUrl: string | null,
  sourceUrl: string | null,
): Promise<{ error?: string; evidence?: { id: string; created_at: string } }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user)  return { error: 'You must be signed in to submit evidence.' }
    if (!title) return { error: 'Title is required.' }
    if (!fileUrl && !sourceUrl) return { error: 'Provide either a file or a URL.' }
    if (fileUrl && sourceUrl)   return { error: 'Provide a file or a URL, not both.' }

    const { data, error } = await supabase
      .from('evidence')
      .insert({ case_id: caseId, user_id: user.id, title, description: description || null, file_url: fileUrl, source_url: sourceUrl })
      .select('id, created_at')
      .single()

    if (error) {
      console.error('[evidence] insert failed — code:', error.code, '| message:', error.message)
      return { error: error.message }
    }

    console.log('[evidence] inserted — id:', data.id, 'user:', user.id, 'case:', caseId)
    return { evidence: data }
  } catch (err) {
    console.error('[evidence] unexpected exception in postEvidence:', err)
    return { error: 'An unexpected error occurred. Please try again.' }
  }
}
