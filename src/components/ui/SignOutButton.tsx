'use client'

import { signOut } from '@/app/actions/auth'

export default function SignOutButton() {
  return (
    <form action={signOut}>
      <button
        type="submit"
        className="text-neutral-400 hover:text-neutral-100 transition-colors text-sm"
      >
        Sign Out
      </button>
    </form>
  )
}
