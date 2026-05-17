'use client'

import { useState, useRef, useEffect } from 'react'
import { saveNotebook } from '@/app/actions/notebooks'

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

interface Props {
  caseId: string
  initialContent: string | null
}

export default function Notebook({ caseId, initialContent }: Props) {
  const [content,    setContent]    = useState(initialContent ?? '')
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')

  const saveTimer   = useRef<ReturnType<typeof setTimeout> | null>(null)
  const clearSavedTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (saveTimer.current)      clearTimeout(saveTimer.current)
      if (clearSavedTimer.current) clearTimeout(clearSavedTimer.current)
    }
  }, [])

  async function performSave(val: string) {
    setSaveStatus('saving')
    try {
      const result = await saveNotebook(caseId, val)
      if (result?.error) {
        console.error('[Notebook] save returned error:', result.error)
        setSaveStatus('error')
      } else {
        setSaveStatus('saved')
        clearSavedTimer.current = setTimeout(() => setSaveStatus('idle'), 2500)
      }
    } catch (err) {
      console.error('[Notebook] unexpected save error:', err)
      setSaveStatus('error')
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const val = e.target.value
    setContent(val)

    // Clear any pending "saved" fade-out
    if (clearSavedTimer.current) {
      clearTimeout(clearSavedTimer.current)
      clearSavedTimer.current = null
    }
    setSaveStatus('idle')

    // Debounce the save — 1.5s after the user stops typing
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => performSave(val), 1500)
  }

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">

      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-neutral-800">
        <span className="text-xs text-neutral-600 flex items-center gap-1.5 select-none">
          🔒 Private to you — never shared
        </span>

        {/* Save status indicator */}
        <span className={`text-xs transition-opacity duration-300 ${saveStatus === 'idle' ? 'opacity-0' : 'opacity-100'}`}>
          {saveStatus === 'saving' && (
            <span className="text-neutral-500">Saving…</span>
          )}
          {saveStatus === 'saved' && (
            <span className="text-emerald-500">✓ Saved</span>
          )}
          {saveStatus === 'error' && (
            <span className="text-red-400">Failed to save</span>
          )}
        </span>
      </div>

      {/* Writing area */}
      <textarea
        value={content}
        onChange={handleChange}
        placeholder={[
          'Your private investigation notes for this case.',
          '',
          'Only you can see what you write here. Use it to organize your thoughts, track leads, jot suspicions, note timeline gaps, or anything else.',
          '',
          'Start typing to begin…',
        ].join('\n')}
        spellCheck
        className={[
          'w-full bg-transparent text-neutral-200 placeholder-neutral-700',
          'px-5 py-5 text-sm leading-relaxed',
          'focus:outline-none resize-none',
          'min-h-[520px]',
        ].join(' ')}
      />
    </div>
  )
}
