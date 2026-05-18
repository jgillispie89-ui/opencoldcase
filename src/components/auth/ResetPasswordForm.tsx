'use client'

import { useActionState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { resetPassword, type AuthState } from '@/app/actions/auth'

export default function ResetPasswordForm() {
  const [state, formAction, isPending] = useActionState<AuthState, FormData>(resetPassword, null)
  const router = useRouter()

  useEffect(() => {
    if (state?.message === 'done') {
      router.push('/?reset=success')
    }
  }, [state, router])

  return (
    <form action={formAction} className="space-y-5">
      {state?.error && (
        <div className="bg-red-950/60 border border-red-800 text-red-300 text-sm px-4 py-3 rounded-lg leading-snug">
          {state.error}
        </div>
      )}

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-neutral-300 mb-1.5">
          New Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="new-password"
          placeholder="Min. 6 characters"
          minLength={6}
          className="w-full bg-neutral-800 border border-neutral-700 text-neutral-100 placeholder-neutral-500 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/30 transition-colors"
        />
      </div>

      <div>
        <label htmlFor="confirm_password" className="block text-sm font-medium text-neutral-300 mb-1.5">
          Confirm New Password
        </label>
        <input
          id="confirm_password"
          name="confirm_password"
          type="password"
          required
          autoComplete="new-password"
          placeholder="Repeat your new password"
          className="w-full bg-neutral-800 border border-neutral-700 text-neutral-100 placeholder-neutral-500 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/30 transition-colors"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg transition-colors text-sm mt-1"
      >
        {isPending ? 'Saving…' : 'Set new password'}
      </button>

      <p className="text-center text-neutral-500 text-sm pt-1">
        <Link href="/login" className="text-red-400 hover:text-red-300 transition-colors font-medium">
          Back to sign in
        </Link>
      </p>
    </form>
  )
}
