import Link from 'next/link'
import Navbar from '@/components/ui/Navbar'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import type { ColdCase } from '@/types'

export const metadata: Metadata = { title: 'Browse Cases — OpenColdCase' }

// ── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; badge: string; dot: string }> = {
  unsolved: {
    label: 'Unsolved',
    badge: 'bg-red-500/10 border border-red-500/30 text-red-400',
    dot:   'bg-red-500',
  },
  cold: {
    label: 'Cold Case',
    badge: 'bg-blue-500/10 border border-blue-500/30 text-blue-400',
    dot:   'bg-blue-400',
  },
  active: {
    label: 'Active Investigation',
    badge: 'bg-orange-500/10 border border-orange-500/30 text-orange-400',
    dot:   'bg-orange-400',
  },
  solved: {
    label: 'Solved',
    badge: 'bg-green-500/10 border border-green-500/30 text-green-400',
    dot:   'bg-green-400',
  },
}

const FILTERS = [
  { value: '',         label: 'All' },
  { value: 'unsolved', label: 'Unsolved' },
  { value: 'cold',     label: 'Cold Case' },
  { value: 'active',   label: 'Active' },
  { value: 'solved',   label: 'Solved' },
]

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(raw: string | null): string | null {
  if (!raw) return null
  return new Date(raw + 'T00:00:00').toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}

function preview(text: string): string {
  return text.length > 120 ? text.slice(0, 120).trimEnd() + '…' : text
}

function caseCount(n: number, status: string): string {
  const statusLabel = STATUS_CONFIG[status]?.label.toLowerCase()
  const noun = statusLabel ? `${statusLabel} case` : 'case'
  return `${n} ${noun}${n !== 1 ? 's' : ''} on the map`
}

// ── Case card ────────────────────────────────────────────────────────────────

function CaseCard({ c }: { c: ColdCase }) {
  const status      = STATUS_CONFIG[c.status] ?? STATUS_CONFIG.unsolved
  const formattedDate = formatDate(c.date_of_incident)

  return (
    <Link
      href={`/cases/${c.id}`}
      className="group flex flex-col bg-neutral-900 border border-neutral-800 rounded-xl p-5 hover:border-neutral-600 hover:bg-neutral-800/60 transition-all duration-150"
    >
      {/* Status badge */}
      <span className={`self-start text-xs font-semibold px-2.5 py-0.5 rounded-full mb-3 ${status.badge}`}>
        {status.label}
      </span>

      {/* Title */}
      <h2 className="text-neutral-100 font-semibold text-base leading-snug group-hover:text-white transition-colors mb-2 line-clamp-2">
        {c.title}
      </h2>

      {/* Meta */}
      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-neutral-500 mb-3">
        <span>📍 {c.location_name}{c.state ? `, ${c.state}` : ''}</span>
        {formattedDate && <span>📅 {formattedDate}</span>}
        {c.victim_name && <span>👤 {c.victim_name}</span>}
      </div>

      {/* Description preview */}
      <p className="text-neutral-500 text-sm leading-relaxed flex-1">
        {preview(c.description)}
      </p>

      {/* Footer affordance */}
      <div className="mt-4 text-xs text-neutral-600 group-hover:text-red-500 transition-colors font-medium">
        Open case folder →
      </div>
    </Link>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

interface PageProps {
  searchParams: Promise<{ status?: string }>
}

export default async function CasesPage({ searchParams }: PageProps) {
  const { status } = await searchParams
  const activeStatus = (status && STATUS_CONFIG[status]) ? status : ''

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let query = supabase
    .from('cases')
    .select('*')
    .order('created_at', { ascending: false })

  if (activeStatus) query = query.eq('status', activeStatus)

  const { data } = await query
  const cases: ColdCase[] = data ?? []

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-neutral-100">All Cases</h1>
          <p className="text-neutral-500 text-sm mt-1">
            {caseCount(cases.length, activeStatus)}
          </p>
        </div>

        {/* Filter bar */}
        <div className="flex flex-wrap gap-2 mb-8">
          {FILTERS.map(f => {
            const isActive = f.value === activeStatus
            const href = f.value ? `/cases?status=${f.value}` : '/cases'
            return (
              <Link
                key={f.value}
                href={href}
                className={`
                  flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors
                  ${isActive
                    ? 'bg-neutral-700 text-neutral-100'
                    : 'bg-neutral-900 border border-neutral-800 text-neutral-500 hover:text-neutral-300 hover:border-neutral-600'}
                `}
              >
                {f.value && (
                  <span className={`w-1.5 h-1.5 rounded-full ${STATUS_CONFIG[f.value]?.dot}`} />
                )}
                {f.label}
              </Link>
            )
          })}
        </div>

        {/* Empty state */}
        {cases.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-full bg-neutral-800 flex items-center justify-center mb-4 text-3xl">
              🗂️
            </div>
            <p className="text-neutral-200 font-semibold text-lg">
              {activeStatus
                ? `No ${STATUS_CONFIG[activeStatus]?.label.toLowerCase()} cases yet`
                : 'No cases on the map yet'}
            </p>
            <p className="text-neutral-500 text-sm mt-1.5 mb-6 max-w-xs">
              {activeStatus
                ? 'Try a different filter, or be the first to submit one.'
                : 'Be the first to pin a cold case to the map.'}
            </p>
            {user ? (
              <Link
                href="/cases/submit"
                className="bg-red-600 hover:bg-red-500 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
              >
                Submit a Case
              </Link>
            ) : (
              <Link
                href="/login"
                className="text-red-400 hover:text-red-300 text-sm font-medium transition-colors"
              >
                Sign in to submit a case →
              </Link>
            )}
          </div>
        ) : (
          /* Case grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {cases.map(c => <CaseCard key={c.id} c={c} />)}
          </div>
        )}
      </main>
    </div>
  )
}
