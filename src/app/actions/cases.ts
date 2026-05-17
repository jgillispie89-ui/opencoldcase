'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export type CaseFormState = { error?: string } | null

const PIN_COLORS: Record<string, string> = {
  unsolved: '#ef4444',
  cold:     '#60a5fa',
  active:   '#fb923c',
  solved:   '#4ade80',
}

function parseCaseForm(formData: FormData) {
  return {
    title:           (formData.get('title')         as string)?.trim(),
    description:     (formData.get('description')   as string)?.trim(),
    location_name:   (formData.get('location_name') as string)?.trim(),
    state:           formData.get('state')           as string,
    status:          (formData.get('status')         as string) || 'unsolved',
    victim_name:     (formData.get('victim_name')    as string)?.trim() || null,
    date_of_incident: (formData.get('date_of_incident') as string) || null,
    lat:             parseFloat(formData.get('lat') as string),
    lng:             parseFloat(formData.get('lng') as string),
  }
}

function validateCaseFields(f: ReturnType<typeof parseCaseForm>): string | null {
  if (!f.title)         return 'Title is required.'
  if (!f.description)   return 'Description is required.'
  if (!f.location_name) return 'Location name is required.'
  if (!f.state)         return 'State is required.'
  if (isNaN(f.lat) || f.lat < -90  || f.lat > 90)   return 'Latitude must be a number between -90 and 90.'
  if (isNaN(f.lng) || f.lng < -180 || f.lng > 180)  return 'Longitude must be a number between -180 and 180.'
  return null
}

async function checkSuperAdmin(supabase: Awaited<ReturnType<typeof createClient>>, userId: string): Promise<boolean> {
  const { data } = await supabase.from('profiles').select('role').eq('id', userId).single()
  return data?.role === 'super_admin'
}

export async function submitCase(
  prevState: CaseFormState,
  formData: FormData
): Promise<CaseFormState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'You must be signed in to submit a case.' }

  const f = parseCaseForm(formData)
  const validationError = validateCaseFields(f)
  if (validationError) return { error: validationError }

  const { data, error } = await supabase
    .from('cases')
    .insert({
      ...f,
      pin_color: PIN_COLORS[f.status] ?? '#ef4444',
      created_by: user.id,
    })
    .select('id')
    .single()

  if (error) return { error: error.message }

  redirect(`/cases/${data.id}`)
}

export async function updateCase(
  prevState: CaseFormState,
  formData: FormData
): Promise<CaseFormState> {
  const caseId = (formData.get('case_id') as string)?.trim()
  if (!caseId) return { error: 'Invalid case.' }

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'You must be signed in.' }

    const { data: existing } = await supabase
      .from('cases').select('created_by').eq('id', caseId).single()
    if (!existing) return { error: 'Case not found.' }
    if (existing.created_by !== user.id && !(await checkSuperAdmin(supabase, user.id)))
      return { error: 'You do not have permission to edit this case.' }

    const f = parseCaseForm(formData)
    const validationError = validateCaseFields(f)
    if (validationError) return { error: validationError }

    const { error } = await supabase
      .from('cases')
      .update({ ...f, pin_color: PIN_COLORS[f.status] ?? '#ef4444' })
      .eq('id', caseId)

    if (error) {
      console.error('[cases] updateCase failed:', error.message)
      return { error: error.message }
    }
  } catch (err) {
    console.error('[cases] unexpected exception in updateCase:', err)
    return { error: 'An unexpected error occurred. Please try again.' }
  }

  redirect(`/cases/${caseId}`)
}

export async function deleteCase(caseId: string): Promise<{ error?: string }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'You must be signed in.' }

    const { data: existing } = await supabase
      .from('cases').select('created_by').eq('id', caseId).single()
    if (!existing) return { error: 'Case not found.' }
    if (existing.created_by !== user.id && !(await checkSuperAdmin(supabase, user.id)))
      return { error: 'You do not have permission to delete this case.' }

    const { error } = await supabase.from('cases').delete().eq('id', caseId)
    if (error) {
      console.error('[cases] deleteCase failed:', error.message)
      return { error: error.message }
    }
  } catch (err) {
    console.error('[cases] unexpected exception in deleteCase:', err)
    return { error: 'An unexpected error occurred. Please try again.' }
  }

  redirect('/cases')
}
