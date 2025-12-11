'use client'
import React, { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { updateProfile, deleteUser } from 'firebase/auth'
import { useAuth } from '@/lib/auth/AuthProvider'
import { firestore } from '@/lib/firebase/client'
import { authedFetch } from '@/lib/utils/authedFetch'
import { User, Coins, Save, LogOut, Trash2 } from 'lucide-react'

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

      ; (async () => {
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
    } catch { }
  }

  if (!user) return null

  return (
    <main className="container page">
      <div className="shell">
        <section className="hero" style={{ padding: '32px 36px', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
              <div style={{
                width: 72,
                height: 72,
                borderRadius: 18,
                background: '#000',
                display: 'grid',
                placeItems: 'center',
                boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
              }}>
                <User size={36} color="#fff" strokeWidth={2.5} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ink)', opacity: 0.6, marginBottom: 4 }}>Account</div>
                <h1 style={{ margin: 0, fontSize: 36, fontWeight: 900, color: 'var(--ink)', letterSpacing: '-0.02em', lineHeight: 1 }}>
                  {name || 'Your Profile'}
                </h1>
              </div>
            </div>

            <div style={{
              background: '#000',
              borderRadius: 16,
              padding: '12px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              color: '#fff',
              boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
            }}>
              <Coins size={20} className="text-purple-300" />
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Credits</div>
                <div style={{ fontSize: 20, fontWeight: 800, lineHeight: 1 }}>{credits}</div>
              </div>
            </div>
          </div>
        </section>

        <section style={{ padding: '32px 40px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40, opacity: 0.6, fontWeight: 600 }}>Loading details...</div>
          ) : (
            <div style={{ display: 'grid', gap: 24 }}>
              {error && (
                <div style={{ padding: 16, background: '#fee2e2', color: '#991b1b', borderRadius: 12, fontSize: 14, fontWeight: 600 }}>
                  {error}
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 8, color: '#444' }}>EMAIL</label>
                <div style={{
                  background: 'rgba(255,255,255,0.5)',
                  border: '1px solid rgba(0,0,0,0.05)',
                  padding: '16px 20px',
                  borderRadius: 16,
                  fontSize: 16,
                  fontWeight: 600,
                  color: '#666'
                }}>
                  {email}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 8, color: '#000' }}>DISPLAY NAME</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your Name"
                  style={{
                    width: '100%',
                    background: '#fff',
                    border: '1px solid #e5e7eb',
                    padding: '16px 20px',
                    borderRadius: 16,
                    fontSize: 16,
                    fontWeight: 600,
                    color: '#000',
                    outline: 'none',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
                    transition: 'all 0.2s ease'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#000';
                    e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e5e7eb';
                    e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.02)';
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 12, flexWrap: 'wrap' }}>
                <button
                  onClick={onSave}
                  disabled={saving}
                  style={{
                    flex: 1,
                    minWidth: '140px',
                    background: '#000',
                    color: '#fff',
                    border: 'none',
                    padding: '16px 24px',
                    borderRadius: 16,
                    fontSize: 15,
                    fontWeight: 800,
                    cursor: saving ? 'not-allowed' : 'pointer',
                    opacity: saving ? 0.7 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    transition: 'transform 0.1s ease'
                  }}
                >
                  <Save size={18} />
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={onSignOut}
                  style={{
                    minWidth: '120px',
                    background: '#fff',
                    color: '#000',
                    border: '1px solid #e5e7eb',
                    padding: '16px 24px',
                    borderRadius: 16,
                    fontSize: 15,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8
                  }}
                >
                  <LogOut size={18} />
                  Sign Out
                </button>
                <button
                  onClick={onDeleteAccount}
                  style={{
                    minWidth: '120px',
                    background: 'transparent',
                    color: '#ef4444',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    padding: '16px 24px',
                    borderRadius: 16,
                    fontSize: 15,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8
                  }}
                >
                  <Trash2 size={18} />
                  Delete
                </button>
              </div>

              {savedAt && !saving && (
                <div style={{ textAlign: 'center', color: '#059669', fontSize: 13, fontWeight: 700, marginTop: 8 }}>
                  Changes saved successfully!
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
