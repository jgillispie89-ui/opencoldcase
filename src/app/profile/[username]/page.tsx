import { notFound } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/ui/Navbar'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import type { ColdCase } from '@/types'

interface PageProps {
  params: Promise<{ username: string }>
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  'bg-red-700', 'bg-orange-700', 'bg-amber-700',
  'bg-emerald-700', 'bg-teal-700', 'bg-sky-700',
  'bg-indigo-700', 'bg-violet-700', 'bg-pink-700',
]

function avatarColor(name: string): string {
  const hash = Array.from(name).reduce((n, ch) => n + ch.charCodeAt(0), 0)
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]
}

function relativeDate(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
  if (days === 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 7)   return `${days} days ago`
  const weeks = Math.floor(days / 7)
  if (weeks < 5)  return `${weeks} week${weeks !== 1 ? 's' : ''} ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months} month${months !== 1 ? 's' : ''} ago`
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const STATUS_CONFIG: Record<string, { label: string; badge: string }> = {
  unsolved: { label: 'Unsolved',             badge: 'bg-red-500/10 border border-red-500/30 text-red-400' },
  cold:     { label: 'Cold Case',            badge: 'bg-blue-500/10 border border-blue-500/30 text-blue-400' },
  active:   { label: 'Active Investigation', badge: 'bg-orange-500/10 border border-orange-500/30 text-orange-400' },
  solved:   { label: 'Solved',               badge: 'bg-green-500/10 border border-green-500/30 text-green-400' },
}

function preview(text: string, max = 110): string {
  return text.length > max ? text.slice(0, max).trimEnd() + '…' : text
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 text-center">
      <p className="text-2xl font-bold text-neutral-100">{value}</p>
      <p className="text-xs text-neutral-500 mt-1 leading-snug">{label}</p>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="text-base font-semibold text-neutral-300 mb-4">{title}</h2>
      {children}
    </section>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <p className="text-neutral-600 text-sm py-6 text-center bg-neutral-900/50 border border-neutral-800 rounded-xl">
      {message}
    </p>
  )
}

function MiniCaseCard({ c }: { c: ColdCase }) {
  const status = STATUS_CONFIG[c.status] ?? STATUS_CONFIG.unsolved
  return (
    <Link
      href={`/cases/${c.id}`}
      className="group flex flex-col bg-neutral-900 border border-neutral-800 rounded-xl p-4 hover:border-neutral-600 hover:bg-neutral-800/60 transition-all duration-150"
    >
      <span className={`self-start text-xs font-semibold px-2 py-0.5 rounded-full mb-2 ${status.badge}`}>
        {status.label}
      </span>
      <h3 className="text-neutral-100 font-semibold text-sm leading-snug group-hover:text-white transition-colors line-clamp-2 mb-1.5">
        {c.title}
      </h3>
      <p className="text-xs text-neutral-500">
        📍 {c.location_name}{c.state ? `, ${c.state}` : ''}
      </p>
      <p className="text-neutral-600 text-xs leading-relaxed flex-1 mt-2 line-clamp-2">
        {preview(c.description, 90)}
      </p>
      <div className="mt-3 text-xs text-neutral-600 group-hover:text-red-500 transition-colors font-medium">
        Open case folder →
      </div>
    </Link>
  )
}

type ActivityCase = { id: string; title: string; status: string }

function ActivityListItem({
  c,
  snippet,
  children,
}: {
  c: ActivityCase
  snippet?: string
  children?: React.ReactNode
}) {
  const status = STATUS_CONFIG[c.status] ?? STATUS_CONFIG.unsolved
  return (
    <li className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
      <div className="flex items-start gap-2 flex-wrap mb-1">
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${status.badge}`}>
          {status.label}
        </span>
        <Link href={`/cases/${c.id}`} className="font-semibold text-neutral-100 hover:text-red-400 transition-colors leading-snug">
          {c.title}
        </Link>
      </div>
      {snippet && <p className="text-sm text-neutral-500 mt-1.5 line-clamp-2 italic">&ldquo;{snippet}&rdquo;</p>}
      {children}
    </li>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('profiles').select('display_name').eq('username', username).single()
  return { title: data ? `${data.display_name} — OpenColdCase` : 'Profile — OpenColdCase' }
}

export default async function ProfilePage({ params }: PageProps) {
  const { username } = await params
  const supabase = await createClient()

  // Round 1: fetch the profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, display_name, username, role, created_at')
    .eq('username', username)
    .single()

  if (!profile) notFound()

  // Round 2: fetch all activity in parallel
  const [
    { data: submittedCases },
    { data: rawDiscussions },
    { data: rawTheories },
    { data: rawEvidence },
  ] = await Promise.all([
    supabase
      .from('cases')
      .select('*')
      .eq('created_by', profile.id)
      .order('created_at', { ascending: false }),

    supabase
      .from('discussions')
      .select('case_id, content, created_at')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false }),

    supabase
      .from('theories')
      .select('case_id, id, title, created_at')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false }),

    supabase
      .from('evidence')
      .select('case_id, id, title, created_at')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false }),
  ])

  // Group discussions: most recent comment per case
  const discussionsByCaseId = new Map<string, { content: string; created_at: string }>()
  for (const d of rawDiscussions ?? []) {
    if (!discussionsByCaseId.has(d.case_id)) {
      discussionsByCaseId.set(d.case_id, { content: d.content, created_at: d.created_at })
    }
  }

  // Group theories by case
  const theoriesByCaseId = new Map<string, { id: string; title: string }[]>()
  for (const t of rawTheories ?? []) {
    const arr = theoriesByCaseId.get(t.case_id) ?? []
    arr.push({ id: t.id, title: t.title })
    theoriesByCaseId.set(t.case_id, arr)
  }

  // Group evidence by case
  const evidenceByCaseId = new Map<string, { id: string; title: string }[]>()
  for (const e of rawEvidence ?? []) {
    const arr = evidenceByCaseId.get(e.case_id) ?? []
    arr.push({ id: e.id, title: e.title })
    evidenceByCaseId.set(e.case_id, arr)
  }

  // Round 3: fetch case details for all cases they participated in
  const allActivityCaseIds = [
    ...new Set([
      ...[...discussionsByCaseId.keys()],
      ...[...theoriesByCaseId.keys()],
      ...[...evidenceByCaseId.keys()],
    ]),
  ]

  const { data: activityCases } = allActivityCaseIds.length > 0
    ? await supabase
        .from('cases')
        .select('id, title, status')
        .in('id', allActivityCaseIds)
    : { data: [] as ActivityCase[] }

  const caseMap = Object.fromEntries((activityCases ?? []).map(c => [c.id, c as ActivityCase]))

  // Stats
  const submittedCount = submittedCases?.length ?? 0
  const commentCount   = rawDiscussions?.length ?? 0
  const theoryCount    = rawTheories?.length ?? 0
  const evidenceCount  = rawEvidence?.length ?? 0

  const joinDate = new Date(profile.created_at as string).toLocaleDateString('en-US', {
    month: 'long', year: 'numeric',
  })
  const color   = avatarColor(profile.display_name as string)
  const initial = (profile.display_name as string).charAt(0).toUpperCase()

  return (
    <div className="flex flex-col min-h-screen bg-neutral-950">
      <Navbar />

      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-8">

        {/* ── Profile header ─────────────────────────────────────────────────── */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 mb-6">
          <div className="flex items-start gap-5">
            <div className={`w-16 h-16 rounded-full ${color} flex items-center justify-center text-white text-2xl font-bold shrink-0 select-none`}>
              {initial}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold text-neutral-100">{profile.display_name as string}</h1>
                {(profile as { role?: string }).role === 'super_admin' && (
                  <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-400 leading-none">
                    Admin
                  </span>
                )}
              </div>
              <p className="text-neutral-600 text-sm mt-0.5">@{profile.username as string}</p>
              <p className="text-neutral-600 text-sm mt-1">Joined {joinDate}</p>
            </div>
          </div>
        </div>

        {/* ── Stats row ──────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <StatCard label="Cases submitted" value={submittedCount} />
          <StatCard label="Comments posted" value={commentCount} />
          <StatCard label="Theories posted" value={theoryCount} />
          <StatCard label="Evidence shared" value={evidenceCount} />
        </div>

        {/* ── Cases submitted ────────────────────────────────────────────────── */}
        <Section title={`Cases submitted by ${profile.display_name as string}`}>
          {submittedCount === 0 ? (
            <EmptyState message="Hasn't submitted any cases yet" />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(submittedCases as ColdCase[]).map(c => (
                <MiniCaseCard key={c.id} c={c} />
              ))}
            </div>
          )}
        </Section>

        {/* ── Cases commented on ─────────────────────────────────────────────── */}
        <Section title="Active in these cases">
          {discussionsByCaseId.size === 0 ? (
            <EmptyState message="Hasn't commented on any cases yet" />
          ) : (
            <ul className="space-y-3">
              {[...discussionsByCaseId.entries()].map(([caseId, comment]) => {
                const c = caseMap[caseId]
                if (!c) return null
                return (
                  <ActivityListItem key={caseId} c={c} snippet={comment.content}>
                    <p className="text-xs text-neutral-700 mt-1">{relativeDate(comment.created_at)}</p>
                  </ActivityListItem>
                )
              })}
            </ul>
          )}
        </Section>

        {/* ── Theories shared ────────────────────────────────────────────────── */}
        <Section title="Theories shared">
          {theoriesByCaseId.size === 0 ? (
            <EmptyState message="Hasn't posted any theories yet" />
          ) : (
            <ul className="space-y-3">
              {[...theoriesByCaseId.entries()].map(([caseId, theories]) => {
                const c = caseMap[caseId]
                if (!c) return null
                return (
                  <ActivityListItem key={caseId} c={c}>
                    <ul className="mt-2 space-y-1">
                      {theories.map(t => (
                        <li key={t.id} className="text-sm text-neutral-400 flex items-start gap-2">
                          <span className="text-neutral-700 mt-0.5 shrink-0">▸</span>
                          <span>{t.title}</span>
                        </li>
                      ))}
                    </ul>
                  </ActivityListItem>
                )
              })}
            </ul>
          )}
        </Section>

        {/* ── Evidence contributed ───────────────────────────────────────────── */}
        <Section title="Evidence contributed">
          {evidenceByCaseId.size === 0 ? (
            <EmptyState message="Hasn't contributed any evidence yet" />
          ) : (
            <ul className="space-y-3">
              {[...evidenceByCaseId.entries()].map(([caseId, items]) => {
                const c = caseMap[caseId]
                if (!c) return null
                return (
                  <ActivityListItem key={caseId} c={c}>
                    <ul className="mt-2 space-y-1">
                      {items.map(e => (
                        <li key={e.id} className="text-sm text-neutral-400 flex items-start gap-2">
                          <span className="text-neutral-700 mt-0.5 shrink-0">▸</span>
                          <span>{e.title}</span>
                        </li>
                      ))}
                    </ul>
                  </ActivityListItem>
                )
              })}
            </ul>
          )}
        </Section>

      </main>
    </div>
  )
}
