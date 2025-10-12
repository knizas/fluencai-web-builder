'use client'
import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Home, Folder, Images } from 'lucide-react'
import { useAuth } from '@/lib/auth/AuthProvider'
import { authedFetch } from '@/lib/utils/authedFetch'

export default function LeftBanner() {
  const { user, loading } = useAuth()
  const [credits, setCredits] = useState<number | null>(null)
  const [flash, setFlash] = useState(false)

  // Helper to fetch credits
  const fetchCredits = useMemo(() => {
    return async () => {
      if (!user) { setCredits(null); return }
      try {
        const res = await authedFetch('/api/credits/get')
        const j = await res.json()
        const nextVal = Number(j.credits ?? 0)
        setCredits(prev => {
          // Trigger the flash when the value actually changes
          if (prev !== null && prev !== nextVal) {
            setFlash(true)
            // turn off the flash after the animation completes
            setTimeout(() => setFlash(false), 450)
          }
          return nextVal
        })
      } catch {
        setCredits(null)
      }
    }
  }, [user])

  // Initial load + event listener for global updates
  useEffect(() => {
    let mounted = true
    ;(async () => { if (mounted) await fetchCredits() })()

    const onCreditsUpdated = () => { fetchCredits() }
    window.addEventListener('credits:updated', onCreditsUpdated)

    return () => {
      mounted = false
      window.removeEventListener('credits:updated', onCreditsUpdated)
    }
  }, [fetchCredits])

  const linkStyle: React.CSSProperties = {
    display:'flex', alignItems:'center', gap:10, padding:'8px 10px',
    borderRadius:10, textDecoration:'none'
  }

  const signedIn = !!user && !loading
  const accountHref = signedIn ? '/account' : '/signin'
  const accountShort = signedIn ? (user!.displayName || user!.email || 'Account') : 'My account'

  return (
    <div className="glass left equalHeight" style={{ padding:16, height:'100%', display:'flex', flexDirection:'column' }}>
      <div style={{ fontWeight:900, fontSize:18, marginBottom:12 }}>Fluencai</div>

      <nav style={{ display:'grid', gap:8 }}>
        <Link href="/" className="btn-outline" style={linkStyle as any}><Home size={16}/><span>Home</span></Link>
        <Link href="/projects" className="btn-outline" style={linkStyle as any}><Folder size={16}/><span>Projects</span></Link>
        <Link href="/media" className="btn-outline" style={linkStyle as any}><Images size={16}/><span>Media</span></Link>
      </nav>

      <div style={{ flex:1 }} />

      <Link
        href={accountHref}
        className="btn"
        style={{
          display:'block', textAlign:'center', padding:'12px 14px',
          borderRadius:12, fontWeight:800, textDecoration:'none'
        }}
      >
        {signedIn ? (
          <>
            {accountShort}
            {' · '}
            <span className={flash ? 'credits-pulse' : undefined}>
              {credits ?? '—'}
            </span>
          </>
        ) : (
          'My account'
        )}
      </Link>

      {/* tiny animation for credits updates */}
      <style jsx>{`
        @keyframes pulseIn {
          0%   { transform: scale(1);   background: transparent; }
          30%  { transform: scale(1.08); background: rgba(0,0,0,.06); }
          100% { transform: scale(1);   background: transparent; }
        }
        .credits-pulse {
          display: inline-block;
          padding: 0 6px;
          border-radius: 8px;
          animation: pulseIn .42s ease-out;
        }
      `}</style>
    </div>
  )
}
