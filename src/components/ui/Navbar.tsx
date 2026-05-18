import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import SignOutButton from './SignOutButton'

export default async function Navbar() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let displayName: string | null = null
  let isSuperAdmin = false
  let ownUsername: string | null = null
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('display_name, role, username')
      .eq('id', user.id)
      .single()
    displayName  = data?.display_name ?? null
    isSuperAdmin = data?.role === 'super_admin'
    ownUsername  = (data as { username?: string | null } | null)?.username ?? null
  }

  return (
    <header className="flex items-center justify-between px-6 py-3 bg-neutral-900 border-b border-neutral-800 shrink-0">
      <Link href="/" className="flex items-center gap-2">
        <span className="text-red-500 text-xl">●</span>
        <span className="font-semibold tracking-wide text-neutral-100">OpenColdCase</span>
      </Link>

      <nav className="flex items-center gap-4 text-sm text-neutral-400">
        <Link href="/" className="hover:text-neutral-100 transition-colors">Map</Link>
        <Link href="/cases" className="hover:text-neutral-100 transition-colors">Browse Cases</Link>

        {user ? (
          <>
            <span className="flex items-center gap-2">
              {ownUsername ? (
                <Link href={`/profile/${ownUsername}`} className="text-neutral-300 font-medium hover:text-red-300 transition-colors">
                  {displayName ?? user.email}
                </Link>
              ) : (
                <span className="text-neutral-300 font-medium">{displayName ?? user.email}</span>
              )}
              {isSuperAdmin && (
                <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-400 leading-none">
                  Admin
                </span>
              )}
            </span>
            {ownUsername && (
              <Link href={`/profile/${ownUsername}`} className="text-xs text-neutral-600 hover:text-neutral-400 transition-colors">
                View Profile
              </Link>
            )}
            <SignOutButton />
            <Link
              href="/cases/submit"
              className="bg-red-600 hover:bg-red-500 text-white px-3 py-1.5 rounded transition-colors font-medium"
            >
              Submit a Case
            </Link>
          </>
        ) : (
          <>
            <Link href="/login" className="hover:text-neutral-100 transition-colors">
              Sign In
            </Link>
            <Link
              href="/signup"
              className="bg-red-600 hover:bg-red-500 text-white px-3 py-1.5 rounded transition-colors font-medium"
            >
              Sign Up
            </Link>
          </>
        )}
      </nav>
    </header>
  )
}
