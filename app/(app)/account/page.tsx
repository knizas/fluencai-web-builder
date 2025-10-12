'use client'
import React, { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { updateProfile, deleteUser } from 'firebase/auth'
import { useAuth } from '@/lib/auth/AuthProvider'
import { firestore } from '@/lib/firebase/client'
import { authedFetch } from '@/lib/utils/authedFetch'

export default function AccountPage() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const db = useMemo(() => firestore(), [])
  const [loading, setLoading] = useState(true)
  const [credits, setCredits] = useState<number>(0)
  const [email, setEmail] = useState<string>('')
  const [name, setName] = useState<string>('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savedAt, setSavedAt] = useState<number | null>(null)

  useEffect(() => {
    if (!user) {
      router.replace('/signin?next=%2Faccount')
      return
    }

    setLoading(true)
    setError(null)

    ;(async () => {
      try {
        setEmail(user.email || '')
        const ref = doc(db, 'users', user.uid)
        const snap = await getDoc(ref)
        if (snap.exists()) {
          const data: any = snap.data() || {}
          setName(String(data.name ?? user.displayName ?? ''))
        } else {
          setName(user.displayName || '')
        }
        const res = await authedFetch('/api/credits/get', { method: 'GET' })
        const j = await res.json()
        setCredits(Number(j.credits ?? 0))
      } catch (e: any) {
        setError(e?.message || 'Failed to load account')
      } finally {
        setLoading(false)
      }
    })()
  }, [user, db, router])

  async function onSave() {
    if (!user) return
    setSaving(true)
    setError(null)
    try {
      if (name !== (user.displayName || '')) {
        await updateProfile(user, { displayName: name })
      }
      const ref = doc(db, 'users', user.uid)
      await setDoc(ref, { name }, { merge: true })
      setSavedAt(Date.now())
    } catch (e: any) {
      setError(e?.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  async function onDeleteAccount() {
    if (!user) return
    const ok = confirm('Delete your account permanently? This cannot be undone.')
    if (!ok) return
    try {
      await deleteUser(user)
      router.replace('/signin')
    } catch (e: any) {
      alert(e?.message || 'Failed to delete account (you may need to reauthenticate).')
    }
  }

  async function onSignOut() {
    try {
      await logout()
      router.replace('/signin')
    } catch {}
  }

  if (!user) return null

  return (
    <main className="account-wrap page">
      <section className="panel-glass account-card fade-in">
        {/* Header */}
        <header className="account-head">
          <div className="account-brand">
            <img src="/logo.svg" alt="Fluencai" width={28} height={28} className="account-logo" />
            <div>
              <div className="account-title">Account</div>
              <div className="account-sub">Manage your profile and credits</div>
            </div>
          </div>

          <div className="account-metrics">
            <div className="metric">
              <div className="metric-label">Credits</div>
              <div className="metric-value">{credits}</div>
            </div>
          </div>
        </header>

        {/* Content */}
        {loading ? (
          <div className="account-loading">Loading…</div>
        ) : (
          <div className="account-grid">
            <div className="account-panel">
              {error && <div className="account-error">{error}</div>}

              <label className="field">
                <span className="field-label">Email</span>
                <input value={email} readOnly className="input field-input" />
              </label>

              <label className="field">
                <span className="field-label">Name</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="input field-input"
                />
              </label>

              <div className="account-actions">
  <div className="action-left">
    <button className="btn-cta" onClick={onSave} disabled={saving}>
      {saving ? 'Saving…' : 'Save changes'}
    </button>
    <button className="btn-signout" onClick={onSignOut}>Sign out</button>
    {savedAt && !saving && <span className="saved-hint">Saved just now</span>}
  </div>

  <div className="action-right">
    <button className="btn-delete" onClick={onDeleteAccount}>Delete account</button>
  </div>
</div>

            </div>
          </div>
        )}
      </section>
    </main>
  )
}
