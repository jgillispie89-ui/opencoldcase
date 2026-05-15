'use client'

import { useActionState } from 'react'
import { submitCase, type CaseFormState } from '@/app/actions/cases'

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

const label = 'block text-sm font-medium text-neutral-300 mb-1.5'
const hint  = 'text-xs text-neutral-600 mt-1'

export default function SubmitCaseForm() {
  const [state, formAction, isPending] = useActionState<CaseFormState, FormData>(submitCase, null)

  return (
    <form action={formAction} className="space-y-6">
      {state?.error && (
        <div className="bg-red-950/60 border border-red-800 text-red-300 text-sm px-4 py-3 rounded-lg">
          {state.error}
        </div>
      )}

      {/* Title */}
      <div>
        <label htmlFor="title" className={label}>Case Title <span className="text-red-500">*</span></label>
        <input id="title" name="title" type="text" required placeholder="e.g. The Unsolved Murder of Jane Doe" className={input} />
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className={label}>Description <span className="text-red-500">*</span></label>
        <textarea
          id="description"
          name="description"
          required
          rows={5}
          placeholder="Provide a clear summary of the case — what happened, when, any known details…"
          className={`${input} resize-y min-h-[120px]`}
        />
      </div>

      {/* Location name + State */}
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_140px] gap-4">
        <div>
          <label htmlFor="location_name" className={label}>Location <span className="text-red-500">*</span></label>
          <input id="location_name" name="location_name" type="text" required placeholder="e.g. Dallas, TX" className={input} />
        </div>
        <div>
          <label htmlFor="state" className={label}>State <span className="text-red-500">*</span></label>
          <select id="state" name="state" required defaultValue="" className={`${input} cursor-pointer`}>
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
          <label htmlFor="lat" className={label}>Latitude <span className="text-red-500">*</span></label>
          <input
            id="lat" name="lat" type="number" required step="any"
            placeholder="e.g. 32.7767"
            className={input}
          />
          <p className={hint}>Right-click a spot on Google Maps → copy coordinates</p>
        </div>
        <div>
          <label htmlFor="lng" className={label}>Longitude <span className="text-red-500">*</span></label>
          <input
            id="lng" name="lng" type="number" required step="any"
            placeholder="e.g. -96.7970"
            className={input}
          />
        </div>
      </div>

      {/* Date + Status */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="date_of_incident" className={label}>Date of Incident</label>
          <input id="date_of_incident" name="date_of_incident" type="date" className={`${input} [color-scheme:dark]`} />
          <p className={hint}>Leave blank if unknown</p>
        </div>
        <div>
          <label htmlFor="status" className={label}>Status <span className="text-red-500">*</span></label>
          <select id="status" name="status" defaultValue="unsolved" className={`${input} cursor-pointer`}>
            <option value="unsolved">Unsolved</option>
            <option value="cold">Cold Case</option>
            <option value="active">Active Investigation</option>
            <option value="solved">Solved</option>
          </select>
        </div>
      </div>

      {/* Victim name */}
      <div>
        <label htmlFor="victim_name" className={label}>Victim Name</label>
        <input id="victim_name" name="victim_name" type="text" placeholder="Leave blank if unknown or multiple victims" className={input} />
      </div>

      {/* Divider */}
      <div className="border-t border-neutral-800 pt-2" />

      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors text-sm"
      >
        {isPending ? 'Submitting…' : 'Submit case to the map'}
      </button>
    </form>
  )
}
