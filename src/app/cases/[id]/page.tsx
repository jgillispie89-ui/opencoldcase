import { notFound } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/ui/Navbar'
import CaseTabs from '@/components/cases/CaseTabs'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import type { DiscussionRow } from '@/components/cases/Discussion'
import type { EvidenceRow }  from '@/components/cases/Evidence'
import type { TheoryRow }    from '@/components/cases/Theories'

interface PageProps {
  params: Promise<{ id: string }>
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  unsolved: { label: 'Unsolved',             className: 'bg-red-500/10    border border-red-500/30    text-red-400'    },
  cold:     { label: 'Cold Case',            className: 'bg-blue-500/10   border border-blue-500/30   text-blue-400'   },
  active:   { label: 'Active Investigation', className: 'bg-orange-500/10 border border-orange-500/30 text-orange-400' },
  solved:   { label: 'Solved',               className: 'bg-green-500/10  border border-green-500/30  text-green-400'  },
}

function formatDate(raw: string | null) {
  if (!raw) return null
  return new Date(raw + 'T00:00:00').toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('cases').select('title').eq('id', id).single()
  return { title: data ? `${data.title} — OpenColdCase` : 'Case — OpenColdCase' }
}

export default async function CasePage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  // Round 1 — case + auth in parallel
  const [{ data: coldCase, error }, { data: { user } }] = await Promise.all([
    supabase.from('cases').select('*').eq('id', id).single(),
    supabase.auth.getUser(),
  ])

  if (error || !coldCase) notFound()

  // Round 2 — seven queries in parallel
  const [
    { data: creator },
    { data: rawDiscussions, error: discussionsError },
    { data: rawEvidence,    error: evidenceError },
    { data: rawTheories,    error: theoriesError },
    { data: viewerProfile },
    { data: rawUpvotes },
    { data: notebookRow },
  ] = await Promise.all([
    supabase
      .from('profiles').select('display_name, username')
      .eq('id', coldCase.created_by).single(),

    // Fetch without FK-dependent join — profiles resolved manually below
    supabase
      .from('discussions').select('*')
      .eq('case_id', id).order('created_at', { ascending: false }),

    // Fetch without FK-dependent join — profiles resolved manually below
    supabase
      .from('evidence').select('*')
      .eq('case_id', id).order('created_at', { ascending: false }),

    // Fetch without FK-dependent join — profiles resolved manually below
    supabase
      .from('theories').select('*')
      .eq('case_id', id)
      .order('upvotes',     { ascending: false })
      .order('created_at',  { ascending: false }),

    user
      ? supabase.from('profiles').select('display_name, role').eq('id', user.id).single()
      : Promise.resolve({ data: null, error: null }),

    user
      ? supabase.from('theory_upvotes').select('theory_id').eq('user_id', user.id)
      : Promise.resolve({ data: [] as { theory_id: string }[], error: null }),

    // maybeSingle — returns null data (not an error) when no notebook row exists yet
    user
      ? supabase.from('notebooks').select('content').eq('case_id', id).eq('user_id', user.id).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ])

  if (discussionsError) console.error('[CasePage] discussions query error:', discussionsError)
  if (evidenceError)    console.error('[CasePage] evidence query error:', evidenceError)
  if (theoriesError)    console.error('[CasePage] theories query error:', theoriesError)

  // Round 3 — resolve author display names for all three content tables (manual join, no FK required)
  const allAuthorIds = [...new Set([
    ...(rawDiscussions ?? []).map(d => d.user_id as string),
    ...(rawEvidence    ?? []).map(e => e.user_id as string),
    ...(rawTheories    ?? []).map(t => t.user_id as string),
  ])]

  const { data: authorProfiles, error: authorProfilesError } = allAuthorIds.length > 0
    ? await supabase.from('profiles').select('id, display_name, username').in('id', allAuthorIds)
    : { data: [] as { id: string; display_name: string; username: string | null }[], error: null }

  if (authorProfilesError) console.error('[CasePage] authorProfiles query error:', authorProfilesError)

  const profileMap = Object.fromEntries(
    ((authorProfiles ?? []) as { id: string; display_name: string; username?: string | null }[]).map(p => [
      p.id,
      { display_name: p.display_name, username: p.username ?? null },
    ])
  )

  const discussions = (rawDiscussions ?? []).map(d => ({
    ...d,
    profiles: profileMap[d.user_id as string] ?? null,
  })) as DiscussionRow[]

  const evidence = (rawEvidence ?? []).map(e => ({
    ...e,
    profiles: profileMap[e.user_id as string] ?? null,
  })) as EvidenceRow[]

  const theories = (rawTheories ?? []).map(t => ({
    ...t,
    profiles: profileMap[t.user_id as string] ?? null,
  })) as TheoryRow[]

  // Only keep upvote IDs that belong to theories on this case
  const caseTheoryIds   = new Set(theories.map(t => t.id))
  const upvotedIds      = (rawUpvotes ?? [])
    .map(r => r.theory_id)
    .filter(id => caseTheoryIds.has(id))

  const isSuperAdmin      = (viewerProfile as { role?: string } | null)?.role === 'super_admin'
  const isCreator         = user?.id === coldCase.created_by
  const isLoggedIn        = !!user
  const userId            = user?.id ?? null
  const userDisplayName   = viewerProfile?.display_name ?? null
  const notebookContent   = notebookRow?.content ?? null
  const status          = STATUS_CONFIG[coldCase.status] ?? STATUS_CONFIG.unsolved
  const formattedDate   = formatDate(coldCase.date_of_incident)

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-8">

        {/* Top bar */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/"
            className="text-sm text-neutral-500 hover:text-neutral-300 transition-colors"
          >
            ← Back to map
          </Link>
          {(isCreator || isSuperAdmin) && (
            <Link
              href={`/cases/${id}/edit`}
              className="text-sm bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-300 px-4 py-1.5 rounded-lg transition-colors"
            >
              Edit Case
            </Link>
          )}
        </div>

        {/* Case header */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 mb-1">
          <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full mb-3 ${status.className}`}>
            {status.label}
          </span>
          <h1 className="text-2xl font-bold text-neutral-100 leading-snug">{coldCase.title}</h1>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-4 text-sm text-neutral-400">
            <span className="flex items-center gap-1.5">
              <span className="text-neutral-600">📍</span>
              {coldCase.location_name}{coldCase.state ? `, ${coldCase.state}` : ''}
            </span>
            {formattedDate && (
              <span className="flex items-center gap-1.5">
                <span className="text-neutral-600">📅</span>
                {formattedDate}
              </span>
            )}
            {coldCase.victim_name && (
              <span className="flex items-center gap-1.5">
                <span className="text-neutral-600">👤</span>
                Victim: <span className="text-neutral-300">{coldCase.victim_name}</span>
              </span>
            )}
            <span className="text-neutral-600 text-xs">
              Submitted by{' '}
              {(creator as { display_name?: string; username?: string | null } | null)?.username ? (
                <Link
                  href={`/profile/${(creator as { username: string }).username}`}
                  className="text-neutral-500 hover:text-red-400 transition-colors"
                >
                  {creator?.display_name ?? 'unknown'}
                </Link>
              ) : (
                <span className="text-neutral-500">{creator?.display_name ?? 'unknown'}</span>
              )}
            </span>
          </div>

          <div className="mt-5 pt-5 border-t border-neutral-800">
            <p className="text-neutral-300 text-sm leading-relaxed whitespace-pre-wrap">
              {coldCase.description}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <CaseTabs
          caseId={id}
          isLoggedIn={isLoggedIn}
          isSuperAdmin={isSuperAdmin}
          userId={userId}
          userDisplayName={userDisplayName}
          initialDiscussions={discussions}
          initialEvidence={evidence}
          initialTheories={theories}
          initialUpvotedIds={upvotedIds}
          initialNotebookContent={notebookContent}
        />
      </main>
    </div>
  )
}
