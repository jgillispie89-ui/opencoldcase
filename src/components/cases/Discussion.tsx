'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { postComment } from '@/app/actions/discussions'

export type DiscussionRow = {
  id: string
  case_id: string
  user_id: string
  content: string
  created_at: string
  profiles: { display_name: string } | null
  _optimistic?: boolean
}

// ── Relative time helper ────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (seconds < 30)  return 'just now'
  if (seconds < 60)  return `${seconds} seconds ago`
  const mins = Math.floor(seconds / 60)
  if (mins  < 60)    return `${mins} minute${mins  !== 1 ? 's' : ''} ago`
  const hrs  = Math.floor(mins  / 60)
  if (hrs   < 24)    return `${hrs} hour${hrs   !== 1 ? 's' : ''} ago`
  const days = Math.floor(hrs   / 24)
  if (days  === 1)   return 'yesterday'
  if (days  < 7)     return `${days} days ago`
  const weeks  = Math.floor(days  / 7)
  if (weeks < 5)     return `${weeks} week${weeks !== 1 ? 's' : ''} ago`
  const months = Math.floor(days  / 30)
  if (months < 12)   return `${months} month${months !== 1 ? 's' : ''} ago`
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// ── Avatar color — stable per display name ──────────────────────────────────

const AVATAR_COLORS = [
  'bg-red-700', 'bg-orange-700', 'bg-amber-700',
  'bg-emerald-700', 'bg-teal-700', 'bg-sky-700',
  'bg-indigo-700', 'bg-violet-700', 'bg-pink-700',
]

function avatarColor(name: string): string {
  const hash = Array.from(name).reduce((n, ch) => n + ch.charCodeAt(0), 0)
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]
}

// ── Component ────────────────────────────────────────────────────────────────

interface Props {
  caseId: string
  isLoggedIn: boolean
  userDisplayName: string | null
  initialDiscussions: DiscussionRow[]
}

export default function Discussion({
  caseId, isLoggedIn, userDisplayName, initialDiscussions,
}: Props) {
  const [comments, setComments] = useState<DiscussionRow[]>(initialDiscussions)
  const [content,  setContent]  = useState('')
  const [error,    setError]    = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = content.trim()
    if (!trimmed) return

    setError(null)

    const tempId = `opt-${Date.now()}`
    const optimistic: DiscussionRow = {
      id:         tempId,
      case_id:    caseId,
      user_id:    'pending',
      content:    trimmed,
      created_at: new Date().toISOString(),
      profiles:   { display_name: userDisplayName ?? 'You' },
      _optimistic: true,
    }

    setComments(prev => [optimistic, ...prev])
    setContent('')

    startTransition(async () => {
      const fd = new FormData()
      fd.set('case_id', caseId)
      fd.set('content', trimmed)
      const result = await postComment(null, fd)

      if (result?.error) {
        // Roll back and restore draft so the user can retry
        setComments(prev => prev.filter(c => c.id !== tempId))
        setContent(trimmed)
        setError(result.error)
      } else {
        // Confirm the optimistic comment
        setComments(prev =>
          prev.map(c => c.id === tempId ? { ...c, _optimistic: false } : c)
        )
      }
    })
  }

  return (
    <div className="space-y-6">

      {/* ── Comment form / sign-in prompt ───────────────────────────────── */}
      {isLoggedIn ? (
        <form onSubmit={handleSubmit} className="space-y-3">
          {error && (
            <p className="text-red-300 text-sm bg-red-950/50 border border-red-800 rounded-lg px-4 py-2.5">
              {error}
            </p>
          )}
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Share your thoughts, leads, or questions about this case…"
            rows={3}
            className="w-full bg-neutral-800 border border-neutral-700 text-neutral-100 placeholder-neutral-500 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/30 transition-colors resize-y"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isPending || !content.trim()}
              className="bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors"
            >
              {isPending ? 'Posting…' : 'Post comment'}
            </button>
          </div>
        </form>
      ) : (
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg px-5 py-4 text-sm text-neutral-400">
          <Link href="/login" className="text-red-400 hover:text-red-300 font-medium transition-colors">
            Sign in
          </Link>
          {' '}to join the discussion
        </div>
      )}

      {/* ── Comment list ─────────────────────────────────────────────────── */}
      {comments.length === 0 ? (
        <div className="flex flex-col items-center py-14 text-center">
          <div className="w-12 h-12 rounded-full bg-neutral-800 flex items-center justify-center mb-3 text-xl">
            💬
          </div>
          <p className="text-neutral-300 font-medium">No comments yet</p>
          <p className="text-neutral-600 text-sm mt-1">Be the first to start the discussion</p>
        </div>
      ) : (
        <ul className="space-y-5">
          {comments.map(comment => {
            const name    = comment.profiles?.display_name ?? 'Unknown'
            const initial = name.charAt(0).toUpperCase()
            const color   = comment._optimistic ? 'bg-neutral-700' : avatarColor(name)

            return (
              <li key={comment.id} className={`flex gap-3 transition-opacity ${comment._optimistic ? 'opacity-55' : ''}`}>
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-full ${color} flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5 select-none`}>
                  {initial}
                </div>

                {/* Body */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 flex-wrap mb-1">
                    <span className="text-sm font-semibold text-neutral-200">{name}</span>
                    <span className="text-xs text-neutral-600">{relativeTime(comment.created_at)}</span>
                    {comment._optimistic && (
                      <span className="text-xs text-neutral-700 italic">posting…</span>
                    )}
                  </div>
                  <p className="text-sm text-neutral-300 leading-relaxed whitespace-pre-wrap break-words">
                    {comment.content}
                  </p>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
