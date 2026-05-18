import Navbar from '@/components/ui/Navbar'
import CaseMapWrapper from '@/components/map/CaseMapWrapper'
import ResetSuccessBanner from '@/components/ui/ResetSuccessBanner'
import { createClient } from '@/lib/supabase/server'
import type { ColdCase } from '@/types'

const STATUS_LEGEND = [
  { label: 'Unsolved',             color: '#ef4444' },
  { label: 'Cold Case',            color: '#60a5fa' },
  { label: 'Active Investigation', color: '#fb923c' },
  { label: 'Solved',               color: '#4ade80' },
]

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ reset?: string }>
}) {
  const { reset } = await searchParams
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('cases')
    .select('*')
    .order('created_at', { ascending: false })

  const cases: ColdCase[] = error ? [] : (data ?? [])

  return (
    <div className="flex flex-col h-screen">
      <Navbar />
      {reset === 'success' && <ResetSuccessBanner />}

      {/* Map fills all remaining vertical space */}
      <div className="relative flex-1 overflow-hidden">
        <CaseMapWrapper cases={cases} />

        {/* Empty state overlay — floats above the map */}
        {cases.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center z-[1000] pointer-events-none">
            <div className="bg-neutral-900/90 backdrop-blur-sm border border-neutral-800 rounded-xl px-8 py-6 text-center shadow-2xl">
              <p className="text-2xl mb-2">🗂️</p>
              <p className="text-neutral-200 font-semibold">No cases on the map yet</p>
              <p className="text-neutral-500 text-sm mt-1">
                Submit the first cold case to get started
              </p>
            </div>
          </div>
        )}

        {/* Legend — bottom-left, above Leaflet attribution */}
        <div className="absolute bottom-8 left-4 z-[1000] bg-neutral-900/90 backdrop-blur-sm border border-neutral-800 rounded-lg px-4 py-3 shadow-xl">
          <p className="text-neutral-500 text-[10px] uppercase tracking-widest font-semibold mb-2">
            Case Status
          </p>
          <ul className="space-y-1.5">
            {STATUS_LEGEND.map(({ label, color }) => (
              <li key={label} className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ background: color }}
                />
                <span className="text-neutral-300 text-xs">{label}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Case count — top-right corner */}
        {cases.length > 0 && (
          <div className="absolute top-4 right-4 z-[1000] bg-neutral-900/90 backdrop-blur-sm border border-neutral-800 rounded-lg px-3 py-2 shadow-xl">
            <p className="text-neutral-300 text-xs">
              <span className="text-red-400 font-bold text-sm">{cases.length}</span>
              {' '}case{cases.length !== 1 ? 's' : ''} mapped
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
