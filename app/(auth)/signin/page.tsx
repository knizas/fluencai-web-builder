'use client'
import React, { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/auth/AuthProvider'
import { authedFetch } from '@/lib/utils/authedFetch'
import { firebaseAuth } from '@/lib/firebase/client'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { Loader2, Mail, Lock } from 'lucide-react'

export default function SignInPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const sp = useSearchParams()
  const next = sp.get('next') || '/app'

  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')

  useEffect(() => {
    if (!loading && user) router.replace(next)
  }, [loading, user, router, next])

  async function ensureCredits() {
    try { await authedFetch('/api/credits/ensure', { method: 'POST' }) } catch {}
  }

  async function doEmailSignIn(e: React.FormEvent) {
    e.preventDefault()
    setError(null); setBusy(true)
    try {
      const auth = firebaseAuth()
      await signInWithEmailAndPassword(auth, email, pass)
      await ensureCredits()
      router.replace(next)
    } catch (er:any) {
      setError(er?.message || 'Sign in failed')
    } finally { setBusy(false) }
  }

  if (loading || user) {
    return (
      <main className="auth-wrap page">
        <div className="panel-glass" style={{ padding:20, borderRadius:16, display:'inline-flex', gap:10, alignItems:'center' }}>
          <Loader2 className="spin" size={16}/> Connecting…
        </div>
      </main>
    )
  }

  return (
    <main className="auth-wrap page">
      <section className="auth-card panel-glass fade-in">
        {/* Left brand pane */}
        <div className="auth-left">
          <div className="auth-brand">
            <img src="/logo.svg" width={32} height={32} className="auth-logo" alt="Fluencai"/>
            <strong className="auth-name">Fluencai</strong>
          </div>
          <h1 className="auth-title">Welcome back</h1>
          <p className="auth-sub">
            Sign in to your workspace to generate and edit sites visually.
          </p>

          <ul className="auth-points">
            <li><span className="dot" /> Clean HTML export</li>
            <li><span className="dot" /> Live phone & laptop previews</li>
            <li><span className="dot" /> Lock sections across regenerations</li>
          </ul>
        </div>

        {/* Right form pane */}
        <div className="auth-right">
          <h2 className="auth-formTitle"><Lock size={18} aria-hidden/> Sign in</h2>

          <form onSubmit={doEmailSignIn} className="auth-form" autoComplete="on">
            <label className="auth-label">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={e=>setEmail(e.target.value)}
              className="input auth-input"
              placeholder="you@example.com"
              autoComplete="email"
            />

            <label className="auth-label">Password</label>
            <input
              type="password"
              required
              value={pass}
              onChange={e=>setPass(e.target.value)}
              className="input auth-input"
              placeholder="••••••••"
              autoComplete="current-password"
            />

            <button
              className="btn-cta auth-submit"
              type="submit"
              disabled={busy}
              title="Sign in with email"
            >
              {busy ? <Loader2 className="spin" size={16}/> : <Mail size={16}/>}
              Sign in with Email
            </button>

            {error && <div className="auth-error">{error}</div>}
          </form>

          <div className="auth-foot">
            <a href="/" className="link-quiet no-underline">Back to home</a>
          </div>
        </div>
      </section>
    </main>
  )
}
