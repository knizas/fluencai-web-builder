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
      <main className="container page" style={{ display: 'grid', placeItems: 'center', minHeight: '70vh' }}>
        <div className="panel-glass" style={{ padding: 20, borderRadius: 16 }}>Loading projects…</div>
      </main>
    )
  }

  return (
    <main className="container page">
      <div className="shell">
        <section className="hero" style={{ padding: '32px 36px', alignItems: 'center', background: 'var(--surface-white)', borderBottom: '1px solid var(--line)' }}>
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
                <div style={{ color: '#fff', fontWeight: 900, fontSize: 24 }}>P</div>
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ink)', opacity: 0.6, marginBottom: 4 }}>Dashboard</div>
                <h1 style={{ margin: 0, fontSize: 36, fontWeight: 900, color: 'var(--ink)', letterSpacing: '-0.02em', lineHeight: 1 }}>
                  Projects
                </h1>
              </div>
            </div>

            <Link
              href="/webgen"
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
                transition: 'transform 0.1s ease'
              }}
            >
              <Plus size={20} />
              <span>New Project</span>
            </Link>
          </div>
        </section>

        <section style={{ padding: '32px 40px' }}>
          {/* Toolbar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 32, flexWrap: 'wrap' }}>
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
                placeholder="Search projects..."
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
              aria-label="Sort projects"
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
              <option value="updated">Recently updated</option>
              <option value="name">Name (A–Z)</option>
            </select>
          </div>

          {/* Project list */}
          {filtered.length === 0 ? <EmptyState /> : (
            <div style={{ display: 'grid', gap: 20 }}>
              {filtered.map((p) => (
                <div
                  key={p.id}
                  style={{
                    background: '#fff',
                    border: '1px solid rgba(0,0,0,0.06)',
                    borderRadius: 20,
                    padding: '24px 28px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.02)',
                    transition: 'all 0.2s ease',
                    cursor: 'default'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.06)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.02)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1 }}>
                    <div style={{
                      width: 48,
                      height: 48,
                      borderRadius: 12,
                      background: 'linear-gradient(135deg, #f3f4f6, #e5e7eb)',
                      display: 'grid',
                      placeItems: 'center'
                    }}>
                      <div style={{ fontWeight: 800, color: '#9ca3af', fontSize: 20 }}>{p.name.charAt(0).toUpperCase()}</div>
                    </div>
                    <div style={{ flex: 1 }}>
                      {editingId === p.id ? (
                        <input
                          autoFocus
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => stopEditing(true)}
                          onKeyDown={(e) => e.key === 'Enter' && stopEditing(true)}
                          style={{
                            fontWeight: 800,
                            fontSize: 18,
                            border: '1px solid var(--line-dark)',
                            borderRadius: 8,
                            padding: '4px 8px',
                            outline: 'none',
                            width: '100%',
                            maxWidth: 300
                          }}
                        />
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div
                            style={{ fontWeight: 800, fontSize: 18, color: '#111', cursor: 'pointer' }}
                            onClick={() => startEditing(p)}
                          >
                            {p.name}
                          </div>
                          <Pencil
                            size={14}
                            style={{ opacity: 0.3, cursor: 'pointer', transition: 'opacity 0.2s' }}
                            onClick={() => startEditing(p)}
                            onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                            onMouseLeave={e => e.currentTarget.style.opacity = '0.3'}
                          />
                        </div>
                      )}
                      <div style={{ opacity: 0.5, fontSize: 13, fontWeight: 600, marginTop: 4 }}>
                        Last updated {new Date(p.updatedAt).toLocaleDateString()} at {new Date(p.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>

                  <Link
                    href={`/webgen?project=${encodeURIComponent(p.id)}`}
                    style={{
                      textDecoration: 'none',
                      fontWeight: 700,
                      borderRadius: 12,
                      padding: '10px 20px',
                      background: '#f3f4f6',
                      color: '#000',
                      transition: 'background 0.2s',
                      fontSize: 14
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#e5e7eb'}
                    onMouseLeave={e => e.currentTarget.style.background = '#f3f4f6'}
                  >
                    Open Editor
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}

/* ---------- Empty State ---------- */
function EmptyState() {
  return (
    <section style={{ margin: '40px 0' }}>
      <div
        style={{
          width: '100%',
          borderRadius: 24,
          border: '1px dashed rgba(0,0,0,0.1)',
          background: 'rgba(255,255,255,0.5)',
          padding: '40px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16
        }}
      >
        <div style={{ background: '#fff', padding: 16, borderRadius: '50%', boxShadow: '0 8px 16px rgba(0,0,0,0.05)' }}>
          <Plus size={32} color="#000" />
        </div>
        <div>
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: '#000' }}>No projects yet</h2>
          <p style={{ margin: '8px 0 0', opacity: 0.6, fontSize: 16, maxWidth: 400 }}>
            Start your first project to create amazing designs using our AI-powered canvas editor.
          </p>
        </div>
        <Link
          href="/webgen"
          className="btn"
          style={{
            marginTop: 16,
            textDecoration: 'none',
            padding: '14px 28px',
            fontWeight: 800,
            borderRadius: 16,
            background: '#000',
            color: '#fff',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: '0 8px 20px rgba(0,0,0,0.15)'
          }}
        >
          <Plus size={18} />
          Create first project
        </Link>
      </div>
    </section>
  )
}
