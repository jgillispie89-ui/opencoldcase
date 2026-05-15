'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export type AuthState = { error?: string; message?: string } | null

export async function signUp(prevState: AuthState, formData: FormData): Promise<AuthState> {
  const displayName = (formData.get('display_name') as string)?.trim()
  const email = (formData.get('email') as string)?.trim()
  const password = formData.get('password') as string

  if (!displayName) return { error: 'Display name is required.' }
  if (password.length < 6) return { error: 'Password must be at least 6 characters.' }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName },
    },
  })

  if (error) return { error: error.message }

  // Email confirmation is enabled by default in Supabase — if there's no session
  // the user needs to confirm their email before they can sign in.
  if (!data.session) {
    return { message: 'Account created! Check your email and click the confirmation link before signing in.' }
  }

  redirect('/')
}

export async function signIn(prevState: AuthState, formData: FormData): Promise<AuthState> {
  const email = (formData.get('email') as string)?.trim()
  const password = formData.get('password') as string

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) return { error: error.message }

  redirect('/')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/')
}
