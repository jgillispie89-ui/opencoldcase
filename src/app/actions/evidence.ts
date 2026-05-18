'use server'

import { createClient } from '@/lib/supabase/server'

export async function deleteEvidence(id: string): Promise<{ error?: string; success?: boolean }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'You must be signed in.' }

    const { data: row } = await supabase
      .from('evidence').select('user_id, file_url').eq('id', id).single()
    if (!row) return { error: 'Evidence not found.' }

    if (row.user_id !== user.id) {
      const { data: profile } = await supabase
        .from('profiles').select('role').eq('id', user.id).single()
      if (profile?.role !== 'super_admin')
        return { error: 'You do not have permission to delete this evidence.' }
    }

    // Delete the storage file before removing the DB row
    if (row.file_url) {
      const marker = '/storage/v1/object/public/evidence/'
      const idx = (row.file_url as string).indexOf(marker)
      if (idx !== -1) {
        const storagePath = (row.file_url as string).slice(idx + marker.length)
        const { error: storageError } = await supabase.storage
          .from('evidence').remove([storagePath])
        if (storageError) {
          // Non-fatal — log but continue with DB delete
          console.error('[evidence] storage delete failed:', storageError.message)
        }
      }
    }

    const { error } = await supabase.from('evidence').delete().eq('id', id)
    if (error) {
      console.error('[evidence] deleteEvidence failed:', error.message)
      return { error: error.message }
    }

    return { success: true }
  } catch (err) {
    console.error('[evidence] unexpected exception in deleteEvidence:', err)
    return { error: 'An unexpected error occurred.' }
  }
}

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
    if (!description && !fileUrl && !sourceUrl) return { error: 'Add a description, file, or source link.' }

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
