'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Search, Plus, Pencil } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { listProjects, upsertProject, type Project } from '@/lib/projects'
import { useAuth } from '@/lib/auth/AuthProvider'

export default function ProjectsPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<'updated' | 'name'>('updated')

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  useEffect(() => {
    if (!loading && !user) router.replace('/signin?next=/projects')
    else if (user) {
      try {
        const p = listProjects()
        setProjects(p)
      } catch (err) {
        console.error(err)
      }
    }
  }, [loading, user, router])

  const filtered = projects
    .filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) =>
      sort === 'updated'
        ? new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        : a.name.localeCompare(b.name)
    )

  function startEditing(p: Project) {
    setEditingId(p.id)
    setEditValue(p.name)
  }

  function stopEditing(save = false) {
    if (save && editingId) {
      const newName = editValue.trim() || 'Untitled'
      const updated = projects.map(p =>
        p.id === editingId ? { ...p, name: newName, updatedAt: Date.now() } : p
      )
      setProjects(updated)
      const updatedProj = updated.find(p => p.id === editingId)
      if (updatedProj) upsertProject(updatedProj)
    }
    setEditingId(null)
    setEditValue('')
  }

  if (loading || !user) {
    return (
      <main className="container page" style={{ display:'grid', placeItems:'center', minHeight:'70vh' }}>
        <div className="panel-glass" style={{ padding:20, borderRadius:16 }}>Loading projects…</div>
      </main>
    )
  }

  return (
    <main className="container page" style={{ padding:'32px 40px', maxWidth:1080, margin:'0 auto' }}>
      <header style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20, flexWrap:'wrap', gap:12 }}>
        <div>
          <div style={{ fontSize:12, fontWeight:800, letterSpacing:0.5, opacity:.6 }}>DASHBOARD</div>
          <h1 style={{ margin:'2px 0 0', fontSize:30, fontWeight:900 }}>Projects</h1>
        </div>
        <Link
          href="/webgen"
          className="btn"
          style={{
            textDecoration:'none',
            display:'inline-flex',
            alignItems:'center',
            gap:6,
            padding:'10px 16px',
            fontWeight:800,
            borderRadius:12
          }}
        >
          <Plus size={16}/> New
        </Link>
      </header>

      {/* Toolbar */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:10, marginBottom:24, flexWrap:'wrap' }}>
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
            placeholder="Search projects"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              border:'none',
              outline:'none',
              flex:1,
              fontSize:14,
              background:'transparent'
            }}
          />
        </div>

        <select
          value={sort}
          onChange={e => setSort(e.target.value as any)}
          aria-label="Sort projects"
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
          <option value="updated">Recently updated</option>
          <option value="name">Name (A–Z)</option>
        </select>
      </div>

      {/* Project list */}
      {filtered.length === 0 ? <EmptyState /> : (
        <div style={{ display:'grid', gap:20 }}>
          {filtered.map((p) => (
            <div
              key={p.id}
              style={{
                background:'#fff',
                border:'1px solid #eee',
                borderRadius:14,
                padding:'16px 18px',
                display:'flex',
                justifyContent:'space-between',
                alignItems:'center',
                boxShadow:'0 4px 16px rgba(0,0,0,.04)',
                transition:'all .15s ease-in-out',
              }}
            >
              <div style={{ display:'flex', alignItems:'center', gap:8, flex:1 }}>
                {editingId === p.id ? (
                  <input
                    autoFocus
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={() => stopEditing(true)}
                    onKeyDown={(e) => e.key === 'Enter' && stopEditing(true)}
                    style={{
                      fontWeight:800,
                      fontSize:16,
                      border:'1px solid #ddd',
                      borderRadius:8,
                      padding:'4px 8px',
                      outline:'none',
                      flex:1,
                    }}
                  />
                ) : (
                  <>
                    <div
                      style={{ fontWeight:800, fontSize:16, cursor:'pointer', flex:1 }}
                      onClick={() => startEditing(p)}
                    >
                      {p.name}
                    </div>
                    <Pencil
  size={14}
  style={{ opacity:.5, cursor:'pointer', flexShrink:0 }}
  onClick={() => startEditing(p)}
  {...({ title: "Rename project" } as any)}
/>
                  </>
                )}
              </div>

              <div style={{ opacity:.6, fontSize:13, marginRight:20, whiteSpace:'nowrap' }}>
                Updated {new Date(p.updatedAt).toLocaleString()}
              </div>

              <Link
                href={`/webgen?project=${encodeURIComponent(p.id)}`}
                className="btn-outline"
                style={{
                  textDecoration:'none',
                  fontWeight:700,
                  borderRadius:10,
                  padding:'8px 12px',
                  flexShrink:0
                }}
              >
                Open
              </Link>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}

/* ---------- Empty State ---------- */
function EmptyState() {
  return (
    <section style={{ margin: '20px 0 24px' }}>
      <div
        style={{
          width: '100%',
          borderRadius: 16,
          border: '1px solid #eee',
          background: '#fff',
          padding: '28px 28px',
          boxShadow: '0 8px 26px rgba(0,0,0,.05)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 18,
            justifyContent: 'space-between',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'grid', gap: 8, minWidth: 280 }}>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900 }}>No projects yet</h2>
            <p style={{ margin: 0, opacity: .7 }}>
              Create your first design. Edit visually and export clean HTML.
            </p>
            <ul style={{ margin: '8px 0 0', paddingLeft: 18, opacity: .8, fontSize: 13 }}>
              <li>Starter templates & AI scaffolds</li>
              <li>Phone + laptop preview</li>
              <li>Lock sections across regenerations</li>
            </ul>
          </div>

          <Link
            href="/webgen"
            className="btn"
            style={{
              textDecoration: 'none',
              padding: '12px 16px',
              fontWeight: 900,
              borderRadius: 12,
              whiteSpace: 'nowrap',
            }}
          >
            Create first project
          </Link>
        </div>
      </div>
    </section>
  )
}
