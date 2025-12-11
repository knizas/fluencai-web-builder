'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/AuthProvider'
import { firestore } from '@/lib/firebase/client'
import {
  collection, addDoc, onSnapshot, query, serverTimestamp, doc, deleteDoc, where
} from 'firebase/firestore'
import { Download, Trash2, Link as LinkIcon, UploadCloud, Plus, Search } from 'lucide-react'

type MediaItem = {
  id: string
  name: string
  size?: number
  contentType?: string
  downloadURL?: string       // Cloudinary secure_url
  publicId?: string          // Cloudinary public_id
  ownerUid?: string
  createdAt?: any
  kind: 'file' | 'canva'
  canvaUrl?: string
}

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME as string
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET as string
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`

export default function MediaPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const db = React.useMemo(() => firestore(), [])

  // Gate
  React.useEffect(() => {
    if (!loading && !user) router.replace('/signin?next=/media')
  }, [loading, user, router])

  const [items, setItems] = React.useState<MediaItem[]>([])
  const [busy, setBusy] = React.useState(false)
  const [err, setErr] = React.useState<string | null>(null)

  // UI state
  const [search, setSearch] = React.useState('')
  const [sort, setSort] = React.useState<'recent' | 'name'>('recent')
  const [canvaUrl, setCanvaUrl] = React.useState('')

  // Live list (scoped to user)
  React.useEffect(() => {
    if (!user) return
    const qy = query(
      collection(db, 'media'),
      where('ownerUid', '==', user.uid)
    )
    const unsub = onSnapshot(
      qy,
      (snap) => {
        const rows: MediaItem[] = []
        snap.forEach(d => rows.push({ id: d.id, ...(d.data() as any) }))
        setItems(rows)
      },
      (error) => {
        console.error('onSnapshot error:', error)
        setErr(error?.message || 'Could not load media.')
      }
    )
    return unsub
  }, [db, user])

  async function onPickFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || !files.length || !user) return
    await uploadFiles(Array.from(files))
    e.currentTarget.value = '' // allow re-select same file
  }

  async function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    if (!user) return

    const fromItems = Array.from(e.dataTransfer.items || [])
      .filter(i => i.kind === 'file')
      .map(i => i.getAsFile())
      .filter(Boolean) as File[]

    const fromFiles = Array.from(e.dataTransfer.files || [])
    const files = (fromItems.length ? fromItems : fromFiles)
    if (!files.length) return

    await uploadFiles(files)
  }
  function onDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy'
  }

  async function uploadFiles(files: File[]) {
    setErr(null)
    setBusy(true)
    try {
      for (const file of files) {
        // Upload directly to Cloudinary (unsigned)
        const fd = new FormData()
        fd.append('file', file)
        fd.append('upload_preset', UPLOAD_PRESET)
        // Optional: place into a folder
        // fd.append('folder', 'user-uploads')

        const res = await fetch(CLOUDINARY_UPLOAD_URL, { method: 'POST', body: fd })
        const j = await res.json()
        if (!res.ok || !j.secure_url) {
          throw new Error(j?.error?.message || 'Cloudinary upload failed')
        }

        // Save metadata to Firestore (same as before)
        await addDoc(collection(db, 'media'), {
          name: file.name || j.original_filename || 'Upload',
          size: file.size ?? j.bytes ?? null,
          contentType: file.type || j.format || null,
          downloadURL: j.secure_url,   // use this as the display & download url
          publicId: j.public_id,       // useful later if you add server-side deletion
          ownerUid: user!.uid,
          createdAt: serverTimestamp(),
          kind: 'file',
          provider: 'cloudinary',
        })
      }
    } catch (e: any) {
      console.error('Upload failed:', e)
      setErr(e?.message || 'Upload failed')
    } finally {
      setBusy(false)
    }
  }

  async function onAddCanvaLink(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !canvaUrl.trim()) return
    setErr(null); setBusy(true)
    try {
      await addDoc(collection(db, 'media'), {
        name: 'Canva Design',
        canvaUrl: canvaUrl.trim(),
        ownerUid: user.uid,
        createdAt: serverTimestamp(),
        kind: 'canva',
      })
      setCanvaUrl('')
    } catch (e: any) {
      console.error('Add Canva link failed:', e)
      setErr(e?.message || 'Could not save link')
    } finally {
      setBusy(false)
    }
  }

  async function onDelete(item: MediaItem) {
    const ok = confirm(`Delete "${item.name}"?`)
    if (!ok) return

    try {
      // 1️⃣ Delete from Cloudinary if this item has a publicId
      if (item.kind === 'file' && item.publicId) {
        const res = await fetch('/api/cloudinary/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ publicId: item.publicId }),
        })
        if (!res.ok) {
          const j = await res.json().catch(() => ({}))
          console.warn('Cloudinary delete failed:', j)
          // Non-fatal: continue deleting from Firestore
        }
      }

      // 2️⃣ Remove from Firestore
      await deleteDoc(doc(db, 'media', item.id))
    } catch (e) {
      console.error(e)
      alert('Failed to delete.')
    }
  }


  function onOpen(item: MediaItem) {
    if (item.kind === 'file' && item.downloadURL) window.open(item.downloadURL, '_blank')
    else if (item.kind === 'canva' && item.canvaUrl) window.open(item.canvaUrl, '_blank')
  }

  const filtered = React.useMemo(() => {
    const s = search.trim().toLowerCase()
    const vis = s
      ? items.filter(i =>
        (i.name || '').toLowerCase().includes(s) ||
        (i.contentType || '').toLowerCase().includes(s))
      : items
    return [...vis].sort((a, b) => {
      if (sort === 'name') return (a.name || '').localeCompare(b.name || '')
      const at = a.createdAt?.toMillis?.() ?? 0
      const bt = b.createdAt?.toMillis?.() ?? 0
      return bt - at
    })
  }, [items, search, sort])

  if (loading || !user) {
    return (
      <main className="container page" style={{ display: 'grid', placeItems: 'center', minHeight: '70vh' }}>
        <div className="panel-glass" style={{ padding: 20, borderRadius: 16 }}>Loading media…</div>
      </main>
    )
  }

  return (
    <main className="container page">
      <div className="shell">
        <section className="hero" style={{ padding: '32px 36px', alignItems: 'center', background: 'linear-gradient(135deg, rgba(124,108,240,0.12), rgba(124,108,240,0.06))' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
              <div style={{
                width: 64,
                height: 64,
                borderRadius: 16,
                background: '#000',
                display: 'grid',
                placeItems: 'center',
                boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
              }}>
                <div style={{ color: '#fff', fontWeight: 900, fontSize: 24 }}>M</div>
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ink)', opacity: 0.6, marginBottom: 4 }}>Dashboard</div>
                <h1 style={{ margin: 0, fontSize: 36, fontWeight: 900, color: 'var(--ink)', letterSpacing: '-0.02em', lineHeight: 1 }}>
                  Media
                </h1>
              </div>
            </div>

            <label
              className="btn-cta"
              style={{
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: '#000',
                color: '#fff',
                padding: '12px 24px',
                borderRadius: 14,
                fontWeight: 800,
                boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
                transition: 'transform 0.1s ease',
                cursor: 'pointer'
              }}
            >
              <Plus size={20} />
              <span>Upload Media</span>
              <input type="file" multiple onChange={onPickFiles} style={{ display: 'none' }} />
            </label>
          </div>
        </section>

        <section style={{ padding: '32px 40px' }}>
          {/* Toolbar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                border: '1px solid rgba(0,0,0,0.08)',
                borderRadius: 16,
                padding: '14px 20px',
                background: '#fff',
                maxWidth: '100%',
                boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
              }}
            >
              <Search size={18} style={{ opacity: 0.4 }} />
              <input
                type="text"
                placeholder="Search media (name or type)..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  border: 'none',
                  outline: 'none',
                  flex: 1,
                  fontSize: 15,
                  fontWeight: 600,
                  background: 'transparent',
                  color: '#000'
                }}
              />
            </div>

            <select
              value={sort}
              onChange={e => setSort(e.target.value as any)}
              aria-label="Sort media"
              style={{
                border: '1px solid rgba(0,0,0,0.08)',
                borderRadius: 16,
                padding: '14px 42px 14px 20px',
                background: '#fff',
                fontSize: 14,
                fontWeight: 700,
                color: '#333',
                appearance: 'none',
                WebkitAppearance: 'none',
                MozAppearance: 'none',
                backgroundImage:
                  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'/></svg>\")",
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 16px center',
                backgroundSize: '16px 16px',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
                outline: 'none'
              }}
            >
              <option value="recent">Recently added</option>
              <option value="name">Name (A–Z)</option>
            </select>
          </div>

          {/* Wrapper for side-by-side Upload Areas */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24, marginBottom: 32 }}>
            {/* 1. Drag & Drop Zone */}
            <div
              onDrop={onDrop}
              onDragOver={onDragOver}
              aria-busy={busy}
              style={{
                border: '2px dashed rgba(0,0,0,0.1)',
                borderRadius: 20,
                padding: '32px',
                display: 'grid',
                placeItems: 'center',
                textAlign: 'center',
                background: busy ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.5)',
                transition: 'all 0.2s',
                minHeight: 180
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(0,0,0,0.2)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(0,0,0,0.1)'}
            >
              <div style={{ pointerEvents: 'none' }}>
                <div style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  background: '#f3f4f6',
                  display: 'grid',
                  placeItems: 'center',
                  margin: '0 auto 16px'
                }}>
                  <UploadCloud size={24} color="#666" />
                </div>
                {busy ? (
                  <div style={{ fontWeight: 700, fontSize: 16 }}>Uploading...</div>
                ) : (
                  <>
                    <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 4 }}>Drag & Drop files here</div>
                    <div style={{ fontSize: 13, opacity: 0.5, fontWeight: 600 }}>or click "Upload Media" above</div>
                  </>
                )}
                {err && <div style={{ color: '#ef4444', fontWeight: 700, marginTop: 12, fontSize: 14 }}>{err}</div>}
              </div>
            </div>

            {/* 2. Canva Integration Card */}
            <form
              onSubmit={onAddCanvaLink}
              style={{
                background: '#fff',
                borderRadius: 20,
                padding: 24,
                border: '1px solid rgba(0,0,0,0.06)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <LinkIcon size={18} color="#000" />
                <div style={{ fontWeight: 800, fontSize: 15 }}>Add Canva Link</div>
              </div>
              <input
                placeholder="https://canva.com/..."
                value={canvaUrl}
                onChange={e => setCanvaUrl(e.target.value)}
                style={{
                  width: '100%',
                  marginBottom: 12,
                  padding: '12px 16px',
                  borderRadius: 12,
                  border: '1px solid #e5e7eb',
                  fontSize: 14,
                  outline: 'none',
                  background: '#f9fafb'
                }}
              />
              <button
                type="submit"
                disabled={busy || !canvaUrl.trim()}
                style={{
                  background: '#000',
                  color: '#fff',
                  padding: '10px',
                  borderRadius: 12,
                  fontWeight: 700,
                  fontSize: 14,
                  border: 'none',
                  cursor: busy ? 'not-allowed' : 'pointer',
                  opacity: (busy || !canvaUrl.trim()) ? 0.6 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6
                }}
              >
                <Plus size={16} />
                Save Link
              </button>
            </form>
          </div>

          {/* Media Items Grid */}
          {filtered.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', opacity: 0.5, fontWeight: 600 }}>
              {search ? 'No matches found.' : 'No media items yet.'}
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: 24
            }}>
              {filtered.map(item => (
                <div
                  key={item.id}
                  style={{
                    position: 'relative',
                    background: '#fff',
                    borderRadius: 20,
                    overflow: 'hidden',
                    border: '1px solid rgba(0,0,0,0.06)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
                    transition: 'transform 0.2s',
                    aspectRatio: '1/1',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  {/* Thumbnail / Preview Area */}
                  <div
                    onClick={() => onOpen(item)}
                    style={{
                      flex: 1,
                      background: '#f9fafb',
                      cursor: 'pointer',
                      position: 'relative',
                      display: 'grid',
                      placeItems: 'center',
                      overflow: 'hidden'
                    }}
                  >
                    {item.kind === 'file' && item.contentType?.startsWith('image/') ? (
                      <img
                        src={item.downloadURL}
                        alt={item.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : item.kind === 'canva' ? (
                      <div style={{
                        background: 'linear-gradient(135deg, #7e22ce, #a855f7)',
                        width: '100%', height: '100%',
                        display: 'grid', placeItems: 'center', color: '#fff'
                      }}>
                        <LinkIcon size={32} />
                        <div style={{ fontSize: 12, fontWeight: 700, marginTop: 8 }}>Canva Design</div>
                      </div>
                    ) : (
                      <div style={{ opacity: 0.3 }}>
                        <Download size={32} />
                      </div>
                    )}
                  </div>

                  {/* Item Footer */}
                  <div style={{
                    padding: '12px 14px',
                    borderTop: '1px solid #f3f4f6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: '#fff'
                  }}>
                    <div style={{ overflow: 'hidden' }}>
                      <div style={{ fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#111' }} title={item.name}>
                        {item.name}
                      </div>
                      <div style={{ fontSize: 11, opacity: 0.5, fontWeight: 600 }}>
                        {item.kind === 'canva' ? 'Link' : item.size ? `${Math.round(item.size / 1024)} KB` : 'File'}
                      </div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); onDelete(item); }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#ef4444',
                        cursor: 'pointer',
                        padding: 6,
                        borderRadius: 8,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#fee2e2'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Tiny toast/spinner while busy */}
      {busy && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: 'fixed',
            right: 16,
            bottom: 16,
            background: '#111',
            color: '#fff',
            padding: '8px 12px',
            borderRadius: 10,
            fontSize: 13,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: '0 8px 24px rgba(0,0,0,.25)',
            opacity: .95
          }}
        >
          <span
            aria-hidden="true"
            style={{
              width: 10, height: 10, borderRadius: '50%',
              border: '2px solid #fff', borderTopColor: 'transparent',
              display: 'inline-block',
              animation: 'spin 0.9s linear infinite'
            }}
          />
          Uploading…
          <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
      )}
    </main>
  )
}

/* --------- Empty state to match Projects style --------- */
function EmptyState() {
  return (
    <section style={{ margin: '8px 0 24px' }}>
      <div
        style={{
          width: '100%',
          borderRadius: 16,
          border: '1px solid #eee',
          background: '#fff',
          padding: '28px 28px',
          boxShadow: '0 8px 26px rgba(0,0,0,.05)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 18, flexWrap: 'wrap' }}>
          <div style={{ display: 'grid', gap: 8, minWidth: 280 }}>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900 }}>No media yet</h2>
            <p style={{ margin: 0, opacity: .7 }}>Upload files or attach a Canva design link to get started.</p>
            <ul style={{ margin: '8px 0 0', paddingLeft: 18, opacity: .8, fontSize: 13 }}>
              <li>Drag & drop uploads</li>
              <li>Image previews when available</li>
              <li>Open or download anytime</li>
            </ul>
          </div>
          <div style={{ opacity: .7, fontSize: 13 }}>
            Tip: You can drop files anywhere inside the dashed box above.
          </div>
        </div>
      </div>
    </section>
  )
}
