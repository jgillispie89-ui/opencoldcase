import { notFound } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/ui/Navbar'
import CaseTabs from '@/components/cases/CaseTabs'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import type { DiscussionRow } from '@/components/cases/Discussion'

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

  // Round 1: case data + auth (parallel)
  const [{ data: coldCase, error }, { data: { user } }] = await Promise.all([
    supabase.from('cases').select('*').eq('id', id).single(),
    supabase.auth.getUser(),
  ])

  if (error || !coldCase) notFound()

  // Round 2: creator profile + discussions + viewer profile (all parallel)
  const [
    { data: creator },
    { data: rawDiscussions },
    { data: viewerProfile },
  ] = await Promise.all([
    supabase.from('profiles').select('display_name').eq('id', coldCase.created_by).single(),
    supabase.from('discussions')
      .select('*, profiles(display_name)')
      .eq('case_id', id)
      .order('created_at', { ascending: false }),
    user
      ? supabase.from('profiles').select('display_name').eq('id', user.id).single()
      : Promise.resolve({ data: null, error: null }),
  ])

  const discussions: DiscussionRow[] = (rawDiscussions ?? []) as DiscussionRow[]

  const isCreator        = user?.id === coldCase.created_by
  const isLoggedIn       = !!user
  const userDisplayName  = viewerProfile?.display_name ?? null
  const status           = STATUS_CONFIG[coldCase.status] ?? STATUS_CONFIG.unsolved
  const formattedDate    = formatDate(coldCase.date_of_incident)

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
          {isCreator && (
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

          {/* Meta row */}
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
              Submitted by <span className="text-neutral-500">{creator?.display_name ?? 'unknown'}</span>
            </span>
          </div>

          {/* Description */}
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
          userDisplayName={userDisplayName}
          initialDiscussions={discussions}
        />
      </main>
    </div>
  )
}
