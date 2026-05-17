'use client'

import { useActionState, useTransition } from 'react'
import Link from 'next/link'
import { updateCase, deleteCase, type CaseFormState } from '@/app/actions/cases'
import type { ColdCase } from '@/types'

const US_STATES = [
  ['AL','Alabama'],['AK','Alaska'],['AZ','Arizona'],['AR','Arkansas'],
  ['CA','California'],['CO','Colorado'],['CT','Connecticut'],['DE','Delaware'],
  ['DC','District of Columbia'],['FL','Florida'],['GA','Georgia'],['HI','Hawaii'],
  ['ID','Idaho'],['IL','Illinois'],['IN','Indiana'],['IA','Iowa'],
  ['KS','Kansas'],['KY','Kentucky'],['LA','Louisiana'],['ME','Maine'],
  ['MD','Maryland'],['MA','Massachusetts'],['MI','Michigan'],['MN','Minnesota'],
  ['MS','Mississippi'],['MO','Missouri'],['MT','Montana'],['NE','Nebraska'],
  ['NV','Nevada'],['NH','New Hampshire'],['NJ','New Jersey'],['NM','New Mexico'],
  ['NY','New York'],['NC','North Carolina'],['ND','North Dakota'],['OH','Ohio'],
  ['OK','Oklahoma'],['OR','Oregon'],['PA','Pennsylvania'],['RI','Rhode Island'],
  ['SC','South Carolina'],['SD','South Dakota'],['TN','Tennessee'],['TX','Texas'],
  ['UT','Utah'],['VT','Vermont'],['VA','Virginia'],['WA','Washington'],
  ['WV','West Virginia'],['WI','Wisconsin'],['WY','Wyoming'],
] as const

const input = [
  'w-full bg-neutral-800 border border-neutral-700 text-neutral-100',
  'placeholder-neutral-500 rounded-lg px-4 py-2.5 text-sm',
  'focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/30 transition-colors',
].join(' ')

const labelCls = 'block text-sm font-medium text-neutral-300 mb-1.5'
const hint     = 'text-xs text-neutral-600 mt-1'

interface Props { c: ColdCase }

export default function EditCaseForm({ c }: Props) {
  const [state, formAction, isPending] = useActionState<CaseFormState, FormData>(updateCase, null)
  const [isDeleting, startDeleteTransition] = useTransition()

  function handleDelete() {
    if (!confirm(
      'Are you sure? This will permanently delete this case and all associated discussions, evidence, theories, and notebooks. This cannot be undone.'
    )) return

    startDeleteTransition(async () => {
      const result = await deleteCase(c.id)
      if (result?.error) {
        // deleteCase redirects on success; if we get here it errored
        alert(`Failed to delete: ${result.error}`)
      }
    })
  }

  return (
    <>
      {/* ── Edit form ─────────────────────────────────────────────────────── */}
      <form action={formAction} className="space-y-6">
        <input type="hidden" name="case_id" value={c.id} />

        {state?.error && (
          <div className="bg-red-950/60 border border-red-800 text-red-300 text-sm px-4 py-3 rounded-lg">
            {state.error}
          </div>
        )}

        {/* Title */}
        <div>
          <label htmlFor="title" className={labelCls}>Case Title <span className="text-red-500">*</span></label>
          <input
            id="title" name="title" type="text" required
            defaultValue={c.title}
            className={input}
          />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className={labelCls}>Description <span className="text-red-500">*</span></label>
          <textarea
            id="description" name="description" required rows={6}
            defaultValue={c.description}
            className={`${input} resize-y min-h-[140px]`}
          />
        </div>

        {/* Location + State */}
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_140px] gap-4">
          <div>
            <label htmlFor="location_name" className={labelCls}>Location <span className="text-red-500">*</span></label>
            <input
              id="location_name" name="location_name" type="text" required
              defaultValue={c.location_name}
              className={input}
            />
          </div>
          <div>
            <label htmlFor="state" className={labelCls}>State <span className="text-red-500">*</span></label>
            <select
              id="state" name="state" required
              defaultValue={c.state}
              className={`${input} cursor-pointer`}
            >
              <option value="" disabled>Select…</option>
              {US_STATES.map(([abbr, name]) => (
                <option key={abbr} value={abbr}>{abbr} — {name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Lat + Lng */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="lat" className={labelCls}>Latitude <span className="text-red-500">*</span></label>
            <input
              id="lat" name="lat" type="number" required step="any"
              defaultValue={c.lat}
              className={input}
            />
            <p className={hint}>Right-click a spot on Google Maps → copy coordinates</p>
          </div>
          <div>
            <label htmlFor="lng" className={labelCls}>Longitude <span className="text-red-500">*</span></label>
            <input
              id="lng" name="lng" type="number" required step="any"
              defaultValue={c.lng}
              className={input}
            />
          </div>
        </div>

        {/* Date + Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="date_of_incident" className={labelCls}>Date of Incident</label>
            <input
              id="date_of_incident" name="date_of_incident" type="date"
              defaultValue={c.date_of_incident ?? ''}
              className={`${input} [color-scheme:dark]`}
            />
            <p className={hint}>Leave blank if unknown</p>
          </div>
          <div>
            <label htmlFor="status" className={labelCls}>Status <span className="text-red-500">*</span></label>
            <select
              id="status" name="status"
              defaultValue={c.status}
              className={`${input} cursor-pointer`}
            >
              <option value="unsolved">Unsolved</option>
              <option value="cold">Cold Case</option>
              <option value="active">Active Investigation</option>
              <option value="solved">Solved</option>
            </select>
          </div>
        </div>

        {/* Victim name */}
        <div>
          <label htmlFor="victim_name" className={labelCls}>Victim Name</label>
          <input
            id="victim_name" name="victim_name" type="text"
            defaultValue={c.victim_name ?? ''}
            placeholder="Leave blank if unknown or multiple victims"
            className={input}
          />
        </div>

        <div className="border-t border-neutral-800 pt-2" />

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={isPending}
            className="bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-6 py-2.5 rounded-lg transition-colors text-sm"
          >
            {isPending ? 'Saving…' : 'Save changes'}
          </button>
          <Link
            href={`/cases/${c.id}`}
            className="text-sm text-neutral-500 hover:text-neutral-300 px-4 py-2.5 rounded-lg border border-neutral-800 hover:border-neutral-600 transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>

      {/* ── Danger zone ───────────────────────────────────────────────────── */}
      <div className="mt-12 pt-8 border-t border-neutral-800">
        <h3 className="text-sm font-semibold text-neutral-400 mb-1">Danger Zone</h3>
        <p className="text-xs text-neutral-600 mb-4 max-w-md">
          Permanently deletes this case and all associated discussions, evidence, theories, and notebooks. There is no way to undo this.
        </p>
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="bg-red-950/40 hover:bg-red-950/70 border border-red-900/60 hover:border-red-800 text-red-500 hover:text-red-400 text-sm font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isDeleting ? 'Deleting…' : 'Delete this case'}
        </button>
      </div>
    </>
  )
}
