'use client'

import { useState } from 'react'
import Discussion, { type DiscussionRow } from './Discussion'

type Tab = 'discussion' | 'evidence' | 'theories' | 'notebook'

const STUBS: Record<Exclude<Tab, 'discussion'>, { icon: string; heading: string; body: string }> = {
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
  caseId: string
  isLoggedIn: boolean
  userDisplayName: string | null
  initialDiscussions: DiscussionRow[]
}

export default function CaseTabs({
  caseId, isLoggedIn, userDisplayName, initialDiscussions,
}: Props) {
  const [active, setActive] = useState<Tab>('discussion')

  const tabs: { id: Tab; label: string }[] = [
    { id: 'discussion', label: 'Discussion' },
    { id: 'evidence',   label: 'Evidence' },
    { id: 'theories',   label: 'Theories' },
    ...(isLoggedIn ? [{ id: 'notebook' as Tab, label: 'My Notebook' }] : []),
  ]

  return (
    <div className="mt-8">
      {/* Tab bar */}
      <div className="flex border-b border-neutral-800 overflow-x-auto">
        {tabs.map(tab => (
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
      <div className="py-6">
        {active === 'discussion' ? (
          <Discussion
            caseId={caseId}
            isLoggedIn={isLoggedIn}
            userDisplayName={userDisplayName}
            initialDiscussions={initialDiscussions}
          />
        ) : (
          <div className="py-10 flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-full bg-neutral-800 flex items-center justify-center mb-4 text-2xl">
              {STUBS[active as Exclude<Tab, 'discussion'>].icon}
            </div>
            <p className="text-neutral-200 font-semibold">
              {STUBS[active as Exclude<Tab, 'discussion'>].heading}
            </p>
            <p className="text-neutral-500 text-sm mt-1.5 max-w-sm">
              {STUBS[active as Exclude<Tab, 'discussion'>].body}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
