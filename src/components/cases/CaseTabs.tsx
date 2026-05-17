'use client'

import { useState } from 'react'
import Discussion, { type DiscussionRow } from './Discussion'
import Evidence,   { type EvidenceRow }  from './Evidence'
import Notebook                          from './Notebook'
import Theories,   { type TheoryRow }    from './Theories'

type Tab = 'discussion' | 'evidence' | 'theories' | 'notebook'

interface Props {
  caseId: string
  isLoggedIn: boolean
  userId: string | null
  userDisplayName: string | null
  initialDiscussions: DiscussionRow[]
  initialEvidence: EvidenceRow[]
  initialTheories: TheoryRow[]
  initialUpvotedIds: string[]
  initialNotebookContent: string | null
}

export default function CaseTabs({
  caseId, isLoggedIn, userId, userDisplayName,
  initialDiscussions, initialEvidence, initialTheories, initialUpvotedIds,
  initialNotebookContent,
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
        {active === 'discussion' && (
          <Discussion
            caseId={caseId}
            isLoggedIn={isLoggedIn}
            userDisplayName={userDisplayName}
            initialDiscussions={initialDiscussions}
          />
        )}
        {active === 'evidence' && (
          <Evidence
            caseId={caseId}
            isLoggedIn={isLoggedIn}
            userId={userId}
            userDisplayName={userDisplayName}
            initialEvidence={initialEvidence}
          />
        )}
        {active === 'theories' && (
          <Theories
            caseId={caseId}
            isLoggedIn={isLoggedIn}
            userId={userId}
            userDisplayName={userDisplayName}
            initialTheories={initialTheories}
            initialUpvotedIds={initialUpvotedIds}
          />
        )}
        {active === 'notebook' && (
          <Notebook
            caseId={caseId}
            initialContent={initialNotebookContent}
          />
        )}
      </div>
    </div>
  )
}
