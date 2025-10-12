'use client'
import React, { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth/AuthProvider'
import { authedFetch } from '@/lib/utils/authedFetch'

export function CreditsBadge() {
  const { user } = useAuth()
  const [credits, setCredits] = useState<number | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [flash, setFlash] = useState(false)

  async function fetchCredits() {
    setErr(null)
    if (!user) { setCredits(null); return }
    try {
      const res = await authedFetch('/api/credits/get', { method: 'GET' })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j?.error || `Request failed: ${res.status}`)
      }
      const j = await res.json()
      const next = Number(j.credits ?? 0)
      setCredits(prev => {
        if (prev !== null && prev !== next) {
          setFlash(true)
          setTimeout(() => setFlash(false), 450)
        }
        return next
      })
    } catch (e: any) {
      setErr(e?.message || 'Failed to load credits')
    }
  }

  useEffect(() => {
    let mounted = true
    if (mounted) fetchCredits()

    // 👂 Listen for global credit updates
    const listener = () => fetchCredits()
    window.addEventListener('credits:updated', listener)

    return () => {
      mounted = false
      window.removeEventListener('credits:updated', listener)
    }
  }, [user])

  if (!user) return null

  return (
    <span
      className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm"
      style={{ background: 'rgba(255,255,255,.7)', backdropFilter: 'blur(6px)' }}
      title={err ?? undefined}
    >
      <span className="font-medium">Credits</span>
      <span
        className={`rounded-full px-2 py-0.5 ${flash ? 'credits-pulse' : ''}`}
      >
        {credits ?? '—'}
      </span>

      {/* Pulse animation */}
      <style jsx>{`
        @keyframes pulseIn {
          0%   { transform: scale(1); background: transparent; }
          30%  { transform: scale(1.08); background: rgba(0,0,0,.08); }
          100% { transform: scale(1); background: transparent; }
        }
        .credits-pulse {
          display: inline-block;
          animation: pulseIn .45s ease-out;
          border-radius: 8px;
        }
      `}</style>
    </span>
  )
}
