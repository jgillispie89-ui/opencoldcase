'use client'

import { useState, useEffect } from 'react'

function relativeTime(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (seconds < 30)  return 'just now'
  if (seconds < 60)  return `${seconds} seconds ago`
  const mins = Math.floor(seconds / 60)
  if (mins  < 60)    return `${mins} minute${mins  !== 1 ? 's' : ''} ago`
  const hrs  = Math.floor(mins  / 60)
  if (hrs   < 24)    return `${hrs} hour${hrs   !== 1 ? 's' : ''} ago`
  const days = Math.floor(hrs   / 24)
  if (days  === 1)   return 'yesterday'
  if (days  < 7)     return `${days} days ago`
  const weeks  = Math.floor(days  / 7)
  if (weeks < 5)     return `${weeks} week${weeks !== 1 ? 's' : ''} ago`
  const months = Math.floor(days  / 30)
  if (months < 12)   return `${months} month${months !== 1 ? 's' : ''} ago`
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function absoluteFallback(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

interface Props {
  date: string
}

export default function RelativeTime({ date }: Props) {
  const [label, setLabel] = useState<string | null>(null)

  useEffect(() => {
    setLabel(relativeTime(date))

    const interval = setInterval(() => setLabel(relativeTime(date)), 60_000)
    return () => clearInterval(interval)
  }, [date])

  // Before hydration: render the static absolute date — matches SSR output,
  // no hydration mismatch, no flash of empty content.
  if (label === null) return <span>{absoluteFallback(date)}</span>

  return <span>{label}</span>
}
