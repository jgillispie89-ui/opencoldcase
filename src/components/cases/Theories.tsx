'use client'

import { useState } from 'react'
import Link from 'next/link'
import { postTheory, toggleUpvote } from '@/app/actions/theories'

export type TheoryRow = {
  id: string
  case_id: string
  user_id: string
  title: string
  content: string
  upvotes: number
  created_at: string
  updated_at: string
  profiles: { display_name: string } | null
  _optimistic?: boolean
}

// ── Relative time ─────────────────────────────────────────────────────────────

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

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  caseId: string
  isLoggedIn: boolean
  userId: string | null
  userDisplayName: string | null
  initialTheories: TheoryRow[]
  initialUpvotedIds: string[]
}

const inputCls = [
  'w-full bg-neutral-800 border border-neutral-700 text-neutral-100 placeholder-neutral-500',
  'rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-red-500',
  'focus:ring-1 focus:ring-red-500/30 transition-colors',
].join(' ')

export default function Theories({
  caseId, isLoggedIn, userId, userDisplayName,
  initialTheories, initialUpvotedIds,
}: Props) {
  const [theories,     setTheories]     = useState<TheoryRow[]>(initialTheories)
  const [upvotedIds,   setUpvotedIds]   = useState(() => new Set(initialUpvotedIds))
  const [pendingVotes, setPendingVotes] = useState(() => new Set<string>())

  const [title,       setTitle]       = useState('')
  const [content,     setContent]     = useState('')
  const [formError,   setFormError]   = useState<string | null>(null)
  const [saveError,   setSaveError]   = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // ── Upvote ──────────────────────────────────────────────────────────────────

  async function handleUpvote(theoryId: string) {
    if (!isLoggedIn || pendingVotes.has(theoryId)) return

    const wasUpvoted = upvotedIds.has(theoryId)
    const delta = wasUpvoted ? -1 : 1

    setPendingVotes(prev => new Set([...prev, theoryId]))
    setUpvotedIds(prev => {
      const next = new Set(prev)
      wasUpvoted ? next.delete(theoryId) : next.add(theoryId)
      return next
    })
    setTheories(prev =>
      prev.map(t => t.id === theoryId ? { ...t, upvotes: Math.max(0, t.upvotes + delta) } : t)
    )

    try {
      const result = await toggleUpvote(theoryId)

      if (result?.error) {
        console.error('[Theories] toggleUpvote returned error:', result.error)
        setUpvotedIds(prev => {
          const next = new Set(prev)
          wasUpvoted ? next.add(theoryId) : next.delete(theoryId)
          return next
        })
        setTheories(prev =>
          prev.map(t => t.id === theoryId ? { ...t, upvotes: Math.max(0, t.upvotes - delta) } : t)
        )
      }
    } catch (err) {
      console.error('[Theories] toggleUpvote threw unexpectedly:', err)
      setUpvotedIds(prev => {
        const next = new Set(prev)
        wasUpvoted ? next.add(theoryId) : next.delete(theoryId)
        return next
      })
      setTheories(prev =>
        prev.map(t => t.id === theoryId ? { ...t, upvotes: Math.max(0, t.upvotes - delta) } : t)
      )
    } finally {
      setPendingVotes(prev => {
        const next = new Set(prev)
        next.delete(theoryId)
        return next
      })
    }
  }

  // ── Submit theory ───────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimTitle   = title.trim()
    const trimContent = content.trim()
    if (!trimTitle)   { setFormError('Title is required.');          return }
    if (!trimContent) { setFormError('Theory content is required.'); return }

    setFormError(null)
    setSaveError(null)
    setIsSubmitting(true)

    const tempId = `opt-${Date.now()}`
    const optimistic: TheoryRow = {
      id: tempId, case_id: caseId, user_id: userId ?? 'pending',
      title: trimTitle, content: trimContent, upvotes: 0,
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      profiles: { display_name: userDisplayName ?? 'You' },
      _optimistic: true,
    }

    setTheories(prev => [optimistic, ...prev])
    setTitle('')
    setContent('')

    try {
      const result = await postTheory(caseId, trimTitle, trimContent)

      if (result?.error) {
        console.error('[Theories] postTheory returned error:', result.error)
        setTheories(prev => prev.filter(t => t.id !== tempId))
        setTitle(trimTitle)
        setContent(trimContent)
        setSaveError(result.error)
      } else if (result?.theory) {
        setTheories(prev =>
          prev.map(t => t.id === tempId
            ? { ...t, ...result.theory!, profiles: { display_name: userDisplayName ?? 'You' }, _optimistic: false }
            : t
          )
        )
      }
    } catch (err) {
      console.error('[Theories] postTheory threw unexpectedly:', err)
      setTheories(prev => prev.filter(t => t.id !== tempId))
      setTitle(trimTitle)
      setContent(trimContent)
      setSaveError('An unexpected error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* Submit form / sign-in prompt */}
      {isLoggedIn ? (
        <form onSubmit={handleSubmit} className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-neutral-300">Share a Theory</h3>

          {formError && (
            <p className="text-red-300 text-sm bg-red-950/50 border border-red-800 rounded-lg px-4 py-2.5">
              {formError}
            </p>
          )}

          <div>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Theory title — e.g. 'The neighbor had motive and opportunity'"
              className={inputCls}
            />
          </div>
          <div>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Lay out your hypothesis in detail. What evidence supports it? What are the weaknesses?"
              rows={5}
              className={`${inputCls} resize-y min-h-[120px]`}
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting || !title.trim() || !content.trim()}
              className="bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors"
            >
              {isSubmitting ? 'Posting…' : 'Post theory'}
            </button>
          </div>
        </form>
      ) : (
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg px-5 py-4 text-sm text-neutral-400">
          <Link href="/login" className="text-red-400 hover:text-red-300 font-medium transition-colors">
            Sign in
          </Link>
          {' '}to share a theory
        </div>
      )}

      {/* Save error banner — shown between form and list so it's visible when scrolled down */}
      {saveError && (
        <div className="flex items-start justify-between gap-3 bg-red-950/50 border border-red-800 rounded-lg px-4 py-3">
          <p className="text-red-300 text-sm">{saveError}</p>
          <button
            onClick={() => setSaveError(null)}
            className="shrink-0 text-red-500 hover:text-red-300 text-lg leading-none transition-colors"
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      )}

      {/* Theory list */}
      {theories.length === 0 ? (
        <div className="flex flex-col items-center py-14 text-center">
          <div className="w-12 h-12 rounded-full bg-neutral-800 flex items-center justify-center mb-3 text-xl">🔍</div>
          <p className="text-neutral-300 font-medium">No theories yet</p>
          <p className="text-neutral-600 text-sm mt-1">Be the first to share a lead</p>
        </div>
      ) : (
        <ul className="space-y-4">
          {theories.map(theory => {
            const name      = theory.profiles?.display_name ?? 'Unknown'
            const isUpvoted = upvotedIds.has(theory.id)
            const isPending = pendingVotes.has(theory.id)

            return (
              <li
                key={theory.id}
                className={`bg-neutral-900 border rounded-xl p-5 transition-opacity ${
                  theory._optimistic ? 'opacity-60 border-neutral-700' : 'border-neutral-800'
                }`}
              >
                {/* Title */}
                <h3 className="font-semibold text-neutral-100 text-base leading-snug mb-2.5">
                  {theory.title}
                </h3>

                {/* Body */}
                <p className="text-sm text-neutral-300 leading-relaxed whitespace-pre-wrap break-words mb-4">
                  {theory.content}
                </p>

                {/* Footer */}
                <div className="flex items-center justify-between border-t border-neutral-800 pt-3 gap-3 flex-wrap">
                  <div className="text-xs text-neutral-500 flex items-center gap-1.5">
                    <span className="text-neutral-300 font-medium">{name}</span>
                    <span>·</span>
                    <span>{relativeTime(theory.created_at)}</span>
                    {theory._optimistic && <span className="italic text-neutral-700">posting…</span>}
                  </div>

                  <button
                    onClick={() => handleUpvote(theory.id)}
                    disabled={!isLoggedIn || isPending || !!theory._optimistic}
                    title={isLoggedIn ? (isUpvoted ? 'Remove upvote' : 'Upvote this theory') : 'Sign in to upvote'}
                    className={`
                      flex items-center gap-1.5 text-sm font-semibold px-3.5 py-1 rounded-full border transition-all
                      ${isUpvoted
                        ? 'bg-red-600 border-red-600 text-white hover:bg-red-500 hover:border-red-500'
                        : 'border-neutral-700 text-neutral-400 hover:border-red-500/60 hover:text-red-400 bg-transparent'}
                      disabled:opacity-40 disabled:cursor-not-allowed
                    `}
                  >
                    ▲ <span>{theory.upvotes}</span>
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
