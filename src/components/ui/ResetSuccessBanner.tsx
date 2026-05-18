'use client'

import { useState } from 'react'

export default function ResetSuccessBanner() {
  const [dismissed, setDismissed] = useState(false)
  if (dismissed) return null

  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[2000] w-full max-w-sm px-4">
      <div className="bg-green-950/90 border border-green-700 text-green-300 text-sm px-4 py-3 rounded-lg shadow-2xl backdrop-blur-sm flex items-center justify-between gap-4">
        <span>Password updated! You&apos;re now signed in.</span>
        <button
          onClick={() => setDismissed(true)}
          className="text-green-500 hover:text-green-300 transition-colors shrink-0 leading-none"
          aria-label="Dismiss"
        >
          ×
        </button>
      </div>
    </div>
  )
}
