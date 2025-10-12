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
    } catch (e:any) {
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
      <main className="container page" style={{ display:'grid', placeItems:'center', minHeight:'70vh' }}>
        <div className="panel-glass" style={{ padding:20, borderRadius:16 }}>Loading media…</div>
      </main>
    )
  }

  return (
    <main className="container page" style={{ padding:'32px 40px', maxWidth:1080, margin:'0 auto' }}>
      {/* Header */}
      <header style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20, flexWrap:'wrap', gap:12 }}>
        <div>
          <div style={{ fontSize:12, fontWeight:800, letterSpacing:0.5, opacity:.6 }}>DASHBOARD</div>
          <h1 style={{ margin:'2px 0 0', fontSize:30, fontWeight:900 }}>Media</h1>
        </div>

        <label
          className="btn"
          style={{
            textDecoration:'none',
            display:'inline-flex',
            alignItems:'center',
            gap:6,
            padding:'10px 16px',
            fontWeight:800,
            borderRadius:12,
            cursor:'pointer'
          }}
        >
          <Plus size={16}/> Upload
          <input type="file" multiple onChange={onPickFiles} style={{ display:'none' }} />
        </label>
      </header>

      {/* Toolbar */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:10, marginBottom:16, flexWrap:'wrap' }}>
        <div
          style={{
            flex:1,
            display:'flex',
            alignItems:'center',
            gap:8,
            border:'1px solid #e7e7e7',
            borderRadius:12,
            padding:'8px 12px',
            background:'#fff',
            maxWidth:'100%'
          }}
        >
          <Search size={16} style={{ opacity:.6 }}/>
          <input
            type="text"
            placeholder="Search media (name or type)"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ border:'none', outline:'none', flex:1, fontSize:14, background:'transparent' }}
          />
        </div>

        <select
          value={sort}
          onChange={e => setSort(e.target.value as any)}
          aria-label="Sort media"
          style={{
            border: '1px solid #e7e7e7',
            borderRadius: 12,
            padding: '10px 34px 10px 12px',
            background: '#fff',
            fontSize: 14,
            appearance: 'none' as any,
            WebkitAppearance: 'none',
            MozAppearance: 'none',
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'/></svg>\")",
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 10px center',
            backgroundSize: '14px 14px',
            cursor: 'pointer',
          }}
        >
          <option value="recent">Recently added</option>
          <option value="name">Name (A–Z)</option>
        </select>
      </div>

      {/* Drop zone */}
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        aria-busy={busy}
        style={{
          border:'1px dashed #e0e0e0',
          borderRadius:14,
          padding:18,
          display:'grid',
          placeItems:'center',
          marginBottom:14,
          background:'#fff',
          opacity: busy ? 0.6 : 1,
          pointerEvents: busy ? 'none' as const : 'auto'
        }}
      >
        <div style={{display:'flex',alignItems:'center',gap:8,opacity:.8}}>
          <UploadCloud size={18}/> Drag & drop files here
        </div>
      </div>

      {/* Canva link */}
      <form
        onSubmit={onAddCanvaLink}
        style={{
          display:'flex', gap:8, alignItems:'center',
          border:'1px solid #e7e7e7', background:'#fff',
          padding:12, borderRadius:12, marginBottom:20, flexWrap:'wrap'
        }}
      >
        <div style={{display:'inline-flex', alignItems:'center', gap:8, opacity:.75}}>
          <LinkIcon size={16}/> Canva link
        </div>
        <input
          value={canvaUrl}
          onChange={e=>setCanvaUrl(e.target.value)}
          placeholder="Paste a Canva design share link (view or edit)"
          style={{
            flex:1, minWidth:220,
            border:'1px solid #e7e7e7', borderRadius:8, padding:'8px 10px'
          }}
        />
        <button
          className="btn-outline"
          type="submit"
          disabled={busy || !canvaUrl.trim()}
          style={{ borderRadius:10, padding:'10px 14px', fontWeight:800 }}
        >
          Add link
        </button>
      </form>

      {err && <div style={{color:'#b00020', marginBottom:12}}>{err}</div>}

      {/* Grid or empty state */}
      {filtered.length ? (
        <div
          style={{
            display:'grid',
            gridTemplateColumns:'repeat(auto-fill, minmax(240px, 1fr))',
            gap:16
          }}
        >
          {filtered.map(item => (
            <div
              key={item.id}
              style={{
                background:'#fff',
                border:'1px solid #eee',
                borderRadius:14,
                overflow:'hidden',
                boxShadow:'0 4px 16px rgba(0,0,0,.04)'
              }}
            >
              <div
                style={{
                  width:'100%',
                  height:150,
                  display:'grid',
                  placeItems:'center',
                  background:'#fff',
                  borderBottom:'1px solid #f1f1f1'
                }}
              >
                {item.kind === 'file'
                  ? item.downloadURL && /^image\//.test(item.contentType || '')
                    ? <img src={item.downloadURL} alt={item.name} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                    : <div style={{opacity:.6, fontSize:12}}>{item.contentType || 'File'}</div>
                  : <div style={{opacity:.85, fontWeight:800}}>Canva Design</div>}
              </div>

              <div style={{padding:'10px 12px', display:'grid', gap:8}}>
                <div
                  style={{
                    fontWeight:800, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'
                  }}
                  title={item.name}
                >
                  {item.name}
                </div>

                <div style={{opacity:.6, fontSize:12}}>
                  {item.kind === 'file'
                    ? (item.size ?? 0) > 0
                      ? `${Math.round((item.size!/1024/1024)*10)/10} MB`
                      : ''
                    : item.canvaUrl}
                </div>

                <div style={{display:'flex', gap:8}}>
                  <button
                    className="btn-outline"
                    onClick={()=>onOpen(item)}
                    style={{display:'inline-flex',alignItems:'center',gap:6, borderRadius:10, padding:'8px 10px'}}
                  >
                    <Download size={14}/> {item.kind === 'file' ? 'Download' : 'Open'}
                  </button>
                  <button
                    className="btn-outline"
                    onClick={()=>onDelete(item)}
                    style={{display:'inline-flex',alignItems:'center',gap:6, borderRadius:10, padding:'8px 10px'}}
                  >
                    <Trash2 size={14}/> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState />
      )}

      {/* Tiny toast/spinner while busy */}
      {busy && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position:'fixed',
            right:16,
            bottom:16,
            background:'#111',
            color:'#fff',
            padding:'8px 12px',
            borderRadius:10,
            fontSize:13,
            display:'inline-flex',
            alignItems:'center',
            gap:8,
            boxShadow:'0 8px 24px rgba(0,0,0,.25)',
            opacity:.95
          }}
        >
          <span
            aria-hidden="true"
            style={{
              width:10, height:10, borderRadius:'50%',
              border:'2px solid #fff', borderTopColor:'transparent',
              display:'inline-block',
              animation:'spin 0.9s linear infinite'
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
    <section style={{ margin:'8px 0 24px' }}>
      <div
        style={{
          width:'100%',
          borderRadius:16,
          border:'1px solid #eee',
          background:'#fff',
          padding:'28px 28px',
          boxShadow:'0 8px 26px rgba(0,0,0,.05)'
        }}
      >
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:18, flexWrap:'wrap' }}>
          <div style={{ display:'grid', gap:8, minWidth:280 }}>
            <h2 style={{ margin:0, fontSize:20, fontWeight:900 }}>No media yet</h2>
            <p style={{ margin:0, opacity:.7 }}>Upload files or attach a Canva design link to get started.</p>
            <ul style={{ margin:'8px 0 0', paddingLeft:18, opacity:.8, fontSize:13 }}>
              <li>Drag & drop uploads</li>
              <li>Image previews when available</li>
              <li>Open or download anytime</li>
            </ul>
          </div>
          <div style={{ opacity:.7, fontSize:13 }}>
            Tip: You can drop files anywhere inside the dashed box above.
          </div>
        </div>
      </div>
    </section>
  )
}
