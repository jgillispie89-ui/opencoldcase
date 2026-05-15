'use client'

import { useState } from 'react'

type Tab = 'discussion' | 'evidence' | 'theories' | 'notebook'

const TAB_STUBS: Record<Tab, { icon: string; heading: string; body: string }> = {
  discussion: {
    icon: '💬',
    heading: 'Discussion coming soon',
    body: 'Public conversation about this case will appear here. Anyone can read; sign in to participate.',
  },
  evidence: {
    icon: '🗂',
    heading: 'Evidence coming soon',
    body: 'Community-submitted links, documents, and files related to this case.',
  },
  theories: {
    icon: '🔍',
    heading: 'Theories coming soon',
    body: 'Read and upvote theories from fellow investigators, or post your own.',
  },
  notebook: {
    icon: '📓',
    heading: 'My Notebook coming soon',
    body: 'Your private notes on this case. Only you can see this — never shared with anyone.',
  },
}

interface Props {
  isLoggedIn: boolean
}

export default function CaseTabs({ isLoggedIn }: Props) {
  const [active, setActive] = useState<Tab>('discussion')

  const tabs: { id: Tab; label: string }[] = [
    { id: 'discussion', label: 'Discussion' },
    { id: 'evidence',   label: 'Evidence' },
    { id: 'theories',   label: 'Theories' },
    ...(isLoggedIn ? [{ id: 'notebook' as Tab, label: 'My Notebook' }] : []),
  ]

  const stub = TAB_STUBS[active]

  return (
    <div className="mt-8">
      {/* Tab bar */}
      <div className="flex border-b border-neutral-800 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            className={`
              shrink-0 px-5 py-3 text-sm font-medium transition-colors border-b-2 -mb-px
              ${active === tab.id
                ? 'border-red-500 text-red-400'
                : 'border-transparent text-neutral-500 hover:text-neutral-300 hover:border-neutral-600'}
            `}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="py-16 flex flex-col items-center text-center">
        <div className="w-14 h-14 rounded-full bg-neutral-800 flex items-center justify-center mb-4 text-2xl">
          {stub.icon}
        </div>
        <p className="text-neutral-200 font-semibold">{stub.heading}</p>
        <p className="text-neutral-500 text-sm mt-1.5 max-w-sm">{stub.body}</p>
      </div>
    </div>
  )
}
