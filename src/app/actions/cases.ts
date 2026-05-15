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

export async function submitCase(
  prevState: CaseFormState,
  formData: FormData
): Promise<CaseFormState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'You must be signed in to submit a case.' }

  const title         = (formData.get('title') as string)?.trim()
  const description   = (formData.get('description') as string)?.trim()
  const location_name = (formData.get('location_name') as string)?.trim()
  const state         = formData.get('state') as string
  const status        = (formData.get('status') as string) || 'unsolved'
  const victim_name   = (formData.get('victim_name') as string)?.trim() || null
  const date_raw      = formData.get('date_of_incident') as string
  const lat           = parseFloat(formData.get('lat') as string)
  const lng           = parseFloat(formData.get('lng') as string)

  if (!title)         return { error: 'Title is required.' }
  if (!description)   return { error: 'Description is required.' }
  if (!location_name) return { error: 'Location name is required.' }
  if (!state)         return { error: 'State is required.' }
  if (isNaN(lat) || lat < -90  || lat > 90)   return { error: 'Latitude must be a number between -90 and 90.' }
  if (isNaN(lng) || lng < -180 || lng > 180)  return { error: 'Longitude must be a number between -180 and 180.' }

  const { data, error } = await supabase
    .from('cases')
    .insert({
      title,
      description,
      location_name,
      state,
      lat,
      lng,
      status,
      victim_name,
      date_of_incident: date_raw || null,
      pin_color: PIN_COLORS[status] ?? '#ef4444',
      created_by: user.id,
    })
    .select('id')
    .single()

  if (error) return { error: error.message }

  redirect(`/cases/${data.id}`)
}
