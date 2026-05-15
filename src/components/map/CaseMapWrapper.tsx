'use client'

import dynamic from 'next/dynamic'
import type { ColdCase } from '@/types'

const CaseMap = dynamic(() => import('./CaseMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-neutral-950">
      <div className="flex flex-col items-center gap-3">
        <div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-neutral-500 text-sm">Loading map…</p>
      </div>
    </div>
  ),
})

export default function CaseMapWrapper({ cases }: { cases: ColdCase[] }) {
  return <CaseMap cases={cases} />
}
