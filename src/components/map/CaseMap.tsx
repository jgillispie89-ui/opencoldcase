'use client'

import 'leaflet/dist/leaflet.css'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import type { ColdCase } from '@/types'

const STATUS_COLORS: Record<string, string> = {
  unsolved: '#ef4444',
  cold:     '#60a5fa',
  active:   '#fb923c',
  solved:   '#4ade80',
}

const STATUS_LABELS: Record<string, string> = {
  unsolved: 'Unsolved',
  cold:     'Cold Case',
  active:   'Active Investigation',
  solved:   'Solved',
}

const US_CENTER: [number, number] = [39.5, -98.35]

function resolveColor(c: ColdCase): string {
  return c.pin_color || STATUS_COLORS[c.status] || '#ef4444'
}

function makeIcon(color: string) {
  return L.divIcon({
    className: '',
    html: `<svg width="26" height="34" viewBox="0 0 26 34" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M13 0C5.82 0 0 5.82 0 13c0 10.14 13 21 13 21S26 23.14 26 13C26 5.82 20.18 0 13 0z"
        fill="${color}" stroke="rgba(0,0,0,0.4)" stroke-width="1.5"/>
      <circle cx="13" cy="13" r="5" fill="white" fill-opacity="0.9"/>
    </svg>`,
    iconSize:    [26, 34],
    iconAnchor:  [13, 34],
    popupAnchor: [0, -36],
  })
}

function formatDate(raw: string | null): string {
  if (!raw) return 'Date unknown'
  return new Date(raw).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
}

export default function CaseMap({ cases }: { cases: ColdCase[] }) {
  return (
    <MapContainer
      center={US_CENTER}
      zoom={4}
      minZoom={3}
      maxZoom={18}
      className="w-full h-full"
      worldCopyJump={false}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>'
        subdomains="abcd"
        maxZoom={19}
      />

      {cases.map((c) => {
        const color = resolveColor(c)
        return (
          <Marker key={c.id} position={[c.lat, c.lng]} icon={makeIcon(color)}>
            <Popup minWidth={230} maxWidth={300}>
              <div>
                <p className="font-semibold text-sm leading-snug mb-1 pr-4">{c.title}</p>

                <p className="text-xs text-neutral-400 mb-0.5">
                  {c.location_name}{c.state ? `, ${c.state}` : ''}
                </p>
                <p className="text-xs text-neutral-400 mb-2">{formatDate(c.date_of_incident)}</p>

                <span
                  className="inline-block text-xs font-medium px-2 py-0.5 rounded-full mb-3"
                  style={{ background: color + '28', color }}
                >
                  {STATUS_LABELS[c.status] ?? c.status}
                </span>

                {c.victim_name && (
                  <p className="text-xs text-neutral-400 mb-3">
                    Victim: <span className="text-neutral-200">{c.victim_name}</span>
                  </p>
                )}

                <a
                  href={`/cases/${c.id}`}
                  className="block text-center text-xs font-semibold bg-red-600 hover:bg-red-500 text-white px-3 py-2 rounded-md transition-colors"
                >
                  Open case folder →
                </a>
              </div>
            </Popup>
          </Marker>
        )
      })}
    </MapContainer>
  )
}
