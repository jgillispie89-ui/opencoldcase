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

export async function requestPasswordReset(
  prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = (formData.get('email') as string)?.trim()
  if (!email) return { error: 'Email is required.' }

  const supabase = await createClient()
  const siteUrl  = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/auth/callback?next=/reset-password`,
  })

  if (error) {
    console.error('[auth] resetPasswordForEmail failed:', error.message)
    // Don't reveal whether the email exists — always return success message
  }

  // Always return the same message regardless of whether the email is registered
  return { message: email }
}

export async function resetPassword(
  prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const password = formData.get('password') as string
  const confirm  = formData.get('confirm_password') as string

  if (!password || password.length < 6)
    return { error: 'Password must be at least 6 characters.' }
  if (password !== confirm)
    return { error: 'Passwords do not match.' }

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password })

  if (error) {
    console.error('[auth] updateUser (reset) failed:', error.message)
    return { error: error.message }
  }

  return { message: 'done' }
}
