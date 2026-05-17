'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { postEvidence } from '@/app/actions/evidence'

export type EvidenceRow = {
  id: string
  case_id: string
  user_id: string
  title: string
  description: string | null
  file_url: string | null
  source_url: string | null
  created_at: string
  profiles: { display_name: string } | null
  _optimistic?: boolean
}

// ── Helpers ────────────────────────────────────────────────────────────────────

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

function isImage(url: string): boolean {
  return /\.(jpe?g|png|gif|webp|avif)(\?|$)/i.test(url)
}

function fileIcon(url: string): string {
  if (/\.pdf(\?|$)/i.test(url))              return '📄'
  if (/\.(docx?)(\?|$)/i.test(url))          return '📝'
  if (/\.(mp4|mov|avi|mkv)(\?|$)/i.test(url)) return '🎥'
  if (/\.(mp3|wav|m4a)(\?|$)/i.test(url))    return '🎵'
  return '📎'
}

function fileName(url: string): string {
  try { return decodeURIComponent(url.split('/').pop()?.split('?')[0] ?? 'File') }
  catch { return 'File' }
}

// ── Component ──────────────────────────────────────────────────────────────────

interface Props {
  caseId: string
  isLoggedIn: boolean
  userId: string | null
  userDisplayName: string | null
  initialEvidence: EvidenceRow[]
}

const inputCls = [
  'w-full bg-neutral-800 border border-neutral-700 text-neutral-100 placeholder-neutral-500',
  'rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-red-500',
  'focus:ring-1 focus:ring-red-500/30 transition-colors',
].join(' ')

export default function Evidence({
  caseId, isLoggedIn, userId, userDisplayName, initialEvidence,
}: Props) {
  const [items,        setItems]        = useState<EvidenceRow[]>(initialEvidence)
  const [title,        setTitle]        = useState('')
  const [description,  setDescription]  = useState('')
  const [sourceUrl,    setSourceUrl]    = useState('')
  const [file,         setFile]         = useState<File | null>(null)
  const [formError,    setFormError]    = useState<string | null>(null)
  const [saveError,    setSaveError]    = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [lightboxUrl,  setLightboxUrl]  = useState<string | null>(null)

  const hasContent = description.trim() || file || sourceUrl.trim()

  // ── Submit ──────────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimTitle = title.trim()
    const trimDesc  = description.trim()
    const trimUrl   = sourceUrl.trim()

    if (!trimTitle)                          { setFormError('Title is required.');                         return }
    if (!trimDesc && !file && !trimUrl)      { setFormError('Add a description, file, or source link.');  return }

    setFormError(null)
    setSaveError(null)
    setIsSubmitting(true)

    const tempId = `opt-${Date.now()}`
    const optimistic: EvidenceRow = {
      id: tempId, case_id: caseId, user_id: userId ?? 'pending',
      title: trimTitle, description: trimDesc || null,
      file_url: null,
      source_url: trimUrl || null,
      created_at: new Date().toISOString(),
      profiles: { display_name: userDisplayName ?? 'You' },
      _optimistic: true,
    }
    setItems(prev => [optimistic, ...prev])
    setTitle('')
    setDescription('')
    setSourceUrl('')
    setFile(null)

    try {
      let resolvedFileUrl: string | null = null

      if (file) {
        const supabase = createClient()
        const ext  = file.name.split('.').pop() ?? 'bin'
        const path = `${caseId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
        const { data: upload, error: uploadError } = await supabase.storage
          .from('evidence')
          .upload(path, file, { upsert: false })

        if (uploadError) {
          console.error('[Evidence] storage upload failed:', uploadError.message)
          setItems(prev => prev.filter(i => i.id !== tempId))
          setTitle(trimTitle)
          setDescription(trimDesc)
          setSourceUrl(trimUrl)
          setFile(file)
          setSaveError(`Upload failed: ${uploadError.message}`)
          setIsSubmitting(false)
          return
        }

        const { data: { publicUrl } } = supabase.storage.from('evidence').getPublicUrl(upload.path)
        resolvedFileUrl = publicUrl

        // Patch the optimistic card with the real URL so the thumbnail shows immediately
        setItems(prev => prev.map(i => i.id === tempId ? { ...i, file_url: publicUrl } : i))
      }

      const result = await postEvidence(caseId, trimTitle, trimDesc, resolvedFileUrl, trimUrl || null)

      if (result?.error) {
        console.error('[Evidence] postEvidence returned error:', result.error)
        setItems(prev => prev.filter(i => i.id !== tempId))
        setTitle(trimTitle)
        setDescription(trimDesc)
        setSourceUrl(trimUrl)
        setSaveError(result.error)
      } else if (result?.evidence) {
        setItems(prev =>
          prev.map(i => i.id === tempId
            ? { ...i, id: result.evidence!.id, created_at: result.evidence!.created_at, _optimistic: false }
            : i
          )
        )
      }
    } catch (err) {
      console.error('[Evidence] unexpected error:', err)
      setItems(prev => prev.filter(i => i.id !== tempId))
      setTitle(trimTitle)
      setDescription(trimDesc)
      setSourceUrl(trimUrl)
      setSaveError('An unexpected error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* Lightbox */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setLightboxUrl(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightboxUrl}
            alt="Evidence"
            className="max-w-full max-h-full rounded-lg shadow-2xl object-contain"
            onClick={e => e.stopPropagation()}
          />
          <button
            onClick={() => setLightboxUrl(null)}
            className="absolute top-4 right-5 text-white text-3xl leading-none hover:text-neutral-300 transition-colors"
            aria-label="Close"
          >
            ×
          </button>
        </div>
      )}

      {/* Add Evidence form / sign-in prompt */}
      {isLoggedIn ? (
        <form onSubmit={handleSubmit} className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-neutral-300">Add Evidence</h3>

          {formError && (
            <p className="text-red-300 text-sm bg-red-950/50 border border-red-800 rounded-lg px-4 py-2.5">
              {formError}
            </p>
          )}

          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Title — e.g. 'News article from 1987' or 'Crime scene photo'"
            className={inputCls}
          />

          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Description (optional) — provide context for this evidence"
            rows={2}
            className={`${inputCls} resize-y min-h-[64px]`}
          />

          {/* File upload */}
          <label className="flex items-center justify-center w-full border border-dashed border-neutral-600 rounded-lg px-4 py-4 cursor-pointer hover:border-neutral-500 transition-colors bg-neutral-800/50 text-sm text-neutral-400 gap-2">
            <span>📎</span>
            <span>{file ? file.name : 'Attach a file — image, PDF, or document (optional)'}</span>
            {file && (
              <span
                role="button"
                tabIndex={0}
                onClick={ev => { ev.preventDefault(); setFile(null) }}
                onKeyDown={ev => ev.key === 'Enter' && (ev.preventDefault(), setFile(null))}
                className="ml-auto text-neutral-600 hover:text-neutral-400 transition-colors"
                aria-label="Remove file"
              >
                ×
              </span>
            )}
            <input
              type="file"
              className="hidden"
              accept="image/*,.pdf,.doc,.docx,.txt,.csv"
              onChange={e => setFile(e.target.files?.[0] ?? null)}
            />
          </label>

          {/* Source URL */}
          <input
            type="url"
            value={sourceUrl}
            onChange={e => setSourceUrl(e.target.value)}
            placeholder="Source URL (optional) — link to a news article, document, or webpage"
            className={inputCls}
          />

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting || !title.trim() || !hasContent}
              className="bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors"
            >
              {isSubmitting ? (file ? 'Uploading…' : 'Adding…') : 'Add evidence'}
            </button>
          </div>
        </form>
      ) : (
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg px-5 py-4 text-sm text-neutral-400">
          <Link href="/login" className="text-red-400 hover:text-red-300 font-medium transition-colors">
            Sign in
          </Link>
          {' '}to contribute evidence
        </div>
      )}

      {/* Save error banner */}
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

      {/* Evidence list */}
      {items.length === 0 ? (
        <div className="flex flex-col items-center py-14 text-center">
          <div className="w-12 h-12 rounded-full bg-neutral-800 flex items-center justify-center mb-3 text-xl">🗂</div>
          <p className="text-neutral-300 font-medium">No evidence yet</p>
          <p className="text-neutral-600 text-sm mt-1">Be the first to share a lead</p>
        </div>
      ) : (
        <ul className="space-y-4">
          {items.map(item => {
            const name = item.profiles?.display_name ?? 'Unknown'

            return (
              <li
                key={item.id}
                className={`bg-neutral-900 border rounded-xl overflow-hidden transition-opacity ${
                  item._optimistic ? 'opacity-60 border-neutral-700' : 'border-neutral-800'
                }`}
              >
                {/* Image thumbnail — full width above card body */}
                {item.file_url && isImage(item.file_url) && (
                  <button
                    onClick={() => !item._optimistic && setLightboxUrl(item.file_url!)}
                    className="block w-full"
                    aria-label="View full size"
                    disabled={!!item._optimistic}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.file_url}
                      alt={item.title}
                      className="w-full max-h-64 object-cover hover:opacity-90 transition-opacity"
                    />
                  </button>
                )}

                <div className="p-5">
                  {/* Title */}
                  <h3 className="font-semibold text-neutral-100 text-base leading-snug mb-1">
                    {item.title}
                  </h3>

                  {/* Non-image file download */}
                  {item.file_url && !isImage(item.file_url) && (
                    <a
                      href={item.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-red-400 hover:text-red-300 transition-colors mt-1 mb-2"
                    >
                      <span>{fileIcon(item.file_url)}</span>
                      <span className="underline underline-offset-2">{fileName(item.file_url)}</span>
                    </a>
                  )}

                  {/* Description */}
                  {item.description && (
                    <p className="text-sm text-neutral-400 leading-relaxed mt-1 mb-2">
                      {item.description}
                    </p>
                  )}

                  {/* Source URL */}
                  {item.source_url && (
                    <div className="flex items-start gap-1.5 mt-1 mb-2">
                      <span className="text-xs text-neutral-600 mt-0.5 shrink-0">Source:</span>
                      <a
                        href={item.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-red-400 hover:text-red-300 underline underline-offset-2 transition-colors break-all"
                      >
                        {item.source_url}
                      </a>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center gap-1.5 text-xs text-neutral-500 mt-3 pt-3 border-t border-neutral-800">
                    <span className="text-neutral-300 font-medium">{name}</span>
                    <span>·</span>
                    <span>{relativeTime(item.created_at)}</span>
                    {item._optimistic && <span className="italic text-neutral-700">saving…</span>}
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
