import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { ApplicationStatus } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Status metadata used across the app
export const STATUS_META: Record<
  ApplicationStatus,
  { label: string; color: string; bg: string; dot: string }
> = {
  SAVED:      { label: 'Saved',      color: 'text-[#8a8a8e]', bg: 'bg-[#8a8a8e]/12', dot: '#8a8a8e' },
  APPLIED:    { label: 'Applied',    color: 'text-[#0071e3]', bg: 'bg-[#0071e3]/12', dot: '#0071e3' },
  ASSESSMENT: { label: 'Assessment', color: 'text-[#7c5cff]', bg: 'bg-[#7c5cff]/12', dot: '#7c5cff' },
  INTERVIEW:  { label: 'Interview',  color: 'text-[#c98a00]', bg: 'bg-[#c98a00]/12', dot: '#c98a00' },
  OFFER:      { label: 'Offer',      color: 'text-[#12936a]', bg: 'bg-[#12936a]/12', dot: '#12936a' },
  REJECTED:   { label: 'Rejected',   color: 'text-[#e5484d]', bg: 'bg-[#e5484d]/12', dot: '#e5484d' },
}

export function matchColor(score: number) {
  if (score >= 85) return '#12936a'
  if (score >= 72) return '#c98a00'
  return '#8a8a8e'
}

export function initials(name: string) {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function companyInitial(company: string) {
  return company[0]?.toUpperCase() ?? '?'
}

// Deterministic color from string (for company avatars)
const PALETTE = [
  '#635bff', '#f24e1e', '#5e6ad2', '#d97757', '#632ca6',
  '#111111', '#1f1f1f', '#0f0f0f', '#ff5a5f', '#58cc02',
  '#1db954', '#0071e3', '#ea4335', '#0a66c2', '#12936a',
]
export function companyColor(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return PALETTE[Math.abs(hash) % PALETTE.length]
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}
