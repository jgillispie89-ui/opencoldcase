'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { signUp, type AuthState } from '@/app/actions/auth'

export default function SignUpForm() {
  const [state, formAction, isPending] = useActionState<AuthState, FormData>(signUp, null)

  return (
    <form action={formAction} className="space-y-5">
      {state?.error && (
        <div className="bg-red-950/60 border border-red-800 text-red-300 text-sm px-4 py-3 rounded-lg leading-snug">
          {state.error}
        </div>
      )}
      {state?.message && (
        <div className="bg-green-950/60 border border-green-800 text-green-300 text-sm px-4 py-3 rounded-lg leading-snug">
          {state.message}
        </div>
      )}

      <div>
        <label htmlFor="display_name" className="block text-sm font-medium text-neutral-300 mb-1.5">
          Display Name
        </label>
        <input
          id="display_name"
          name="display_name"
          type="text"
          required
          autoComplete="name"
          placeholder="e.g. Jane Doe"
          className="w-full bg-neutral-800 border border-neutral-700 text-neutral-100 placeholder-neutral-500 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/30 transition-colors"
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-neutral-300 mb-1.5">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          className="w-full bg-neutral-800 border border-neutral-700 text-neutral-100 placeholder-neutral-500 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/30 transition-colors"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-neutral-300 mb-1.5">
          Password
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

      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg transition-colors text-sm mt-1"
      >
        {isPending ? 'Creating account…' : 'Create account'}
      </button>

      <p className="text-center text-neutral-500 text-sm pt-1">
        Already have an account?{' '}
        <Link href="/login" className="text-red-400 hover:text-red-300 transition-colors font-medium">
          Sign in
        </Link>
      </p>
    </form>
  )
}
