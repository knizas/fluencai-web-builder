'use client'
import React, { useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/AuthProvider'
import { Sparkles, MonitorSmartphone, Lock } from 'lucide-react'

export default function WelcomePage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) router.replace('/app')
  }, [loading, user, router])

  // Loading / redirecting
  if (loading || user) {
    return (
      <main
        className="container page"
        style={{ display: 'grid', placeItems: 'center', minHeight: '75vh' }}
      >
        <div className="loader-card">
          <div className="loader-top">
            <img src="/logo.svg" alt="" width={20} height={20} className="loader-logo" />
            <span className="loader-brand">Fluencai</span>
          </div>

          {/* Removed the spinning loader-ring */}

          <div className="loader-text">Loading your workspace…</div>

          <div className="loader-bar" aria-hidden="true">
            <span className="loader-bar-fill" />
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="welcome-wrap page" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '40px 20px', background: 'radial-gradient(circle at 50% 0%, rgba(124,108,240,0.15), transparent 70%), radial-gradient(circle at 80% 80%, rgba(124,108,240,0.08), transparent 50%)' }}>

      {/* Main Hero Card */}
      <section className="container" style={{ maxWidth: 1280, width: '100%', margin: '0 auto', height: '100%', maxHeight: 800 }}>
        <div className="glass-card" style={{
          padding: 0,
          borderRadius: 32,
          overflow: 'hidden',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          background: `
            radial-gradient(1200px 520px at 20% 10%, rgba(124, 108, 240, .20), rgba(124, 108, 240, 0) 70%),
            linear-gradient(180deg, rgba(124, 108, 240, .14), rgba(255, 255, 255, .75))
          `,
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.8)',
          boxShadow: '0 20px 80px -10px rgba(124,108,240,0.25), 0 0 0 1px rgba(255,255,255,0.5) inset',
          height: '100%'
        }}>

          {/* Left Content */}
          <div style={{ padding: '50px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <img src="/logo.svg" alt="Fluencai" width={32} height={32} style={{ borderRadius: 8 }} />
                <strong style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em', color: '#111' }}>Fluencai</strong>
              </div>
              <Link href="/signin?next=%2Fapp" className="link-quiet no-underline" style={{ fontWeight: 600, fontSize: 14 }}>
                Sign in
              </Link>
            </header>

            <div style={{ marginTop: 40, marginBottom: 40 }}>
              <h1 className="fade-in d1" style={{ fontSize: 48, lineHeight: 1, fontWeight: 800, letterSpacing: '-0.03em', color: '#000', marginBottom: 20 }}>
                Design &amp; build websites in minutes
              </h1>
              <p className="fade-in d2" style={{ fontSize: 16, lineHeight: 1.5, color: 'rgba(0,0,0,0.65)', fontWeight: 500, marginBottom: 28, maxWidth: 460 }}>
                Generate, edit visually, and export clean HTML — with live phone and laptop previews.
              </p>

              {/* List with Glass Pills */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 32 }}>
                {[
                  { icon: <Lock size={16} />, text: 'Lock sections', delay: 'd3' },
                  { icon: <Sparkles size={16} />, text: 'AI page builder', delay: 'd4' },
                  { icon: <MonitorSmartphone size={16} />, text: 'Live dual preview', delay: 'd5' }
                ].map((item, i) => (
                  <div key={i} className={`fade-in feature-pill ${item.delay}`} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 16px', background: 'rgba(255,255,255,0.5)',
                    borderRadius: 12, border: '1px solid rgba(255,255,255,0.6)', width: 'fit-content'
                  }}>
                    <div style={{ color: '#000' }}>{item.icon}</div>
                    <span style={{ fontSize: 14, color: '#222', fontWeight: 700 }}>
                      {item.text}
                    </span>
                  </div>
                ))}
              </div>

              <div className="fade-in d4" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <Link
                  href="/signin?next=%2Fapp"
                  className="btn-cta"
                  style={{
                    textDecoration: 'none',
                    background: '#000', color: '#fff',
                    padding: '14px 28px', fontSize: 15, borderRadius: 14,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
                  }}
                >
                  Get started
                </Link>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, opacity: 0.6, fontSize: 13, fontWeight: 600 }}>
                  <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#000' }} />
                  No credit card required
                </div>
              </div>
            </div>

            <div style={{ marginTop: 'auto' }} />
          </div>

          {/* Right Column: Video + How it Works */}
          <div style={{
            background: '#fff',
            borderLeft: '1px solid rgba(0,0,0,0.06)',
            display: 'flex', flexDirection: 'column',
          }}>

            {/* Top: Video Demo (Bigger) */}
            <div className="fade-in d3" style={{
              flex: '1', display: 'flex', alignItems: 'center', justifyContent: 'center',
              position: 'relative', overflow: 'hidden', padding: 30
            }}>
              <figure className="browser-shell float3d" style={{
                width: '100%', aspectRatio: '16/9', borderRadius: 14,
                boxShadow: '0 30px 60px -15px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.05)',
                background: '#fff', overflow: 'hidden'
              }}>
                <div className="browser-bar" style={{ background: '#f5f5f7', borderBottom: '1px solid #e5e5e5', padding: '8px 12px' }}>
                  <span className="b-dot red" style={{ width: 8, height: 8 }} />
                  <span className="b-dot yellow" style={{ width: 8, height: 8 }} />
                  <span className="b-dot green" style={{ width: 8, height: 8 }} />
                  <div className="b-addr" style={{ height: 20, fontSize: 11, background: '#fff' }}>fluencai.com</div>
                </div>
                <div className="browser-viewport" style={{ height: 'calc(100% - 37px)', width: '100%' }}>
                  <video
                    className="browser-video"
                    src="/App-Builder.mp4"
                    autoPlay muted loop playsInline
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
              </figure>
              {/* Decor Blob */}
              <div style={{ position: 'absolute', top: -50, right: -50, width: 300, height: 300, background: '#7C6CF0', borderRadius: '50%', filter: 'blur(100px)', opacity: 0.12, pointerEvents: 'none' }} />
            </div>

            {/* Bottom: How It Works Schemas (Adjusted Space) */}
            <div id="how-it-works" style={{
              flex: '0',
              minHeight: 220,
              borderTop: '1px solid rgba(0,0,0,0.06)',
              background: 'linear-gradient(180deg, rgba(0,0,0,0.02), rgba(0,0,0,0.05))',
              padding: '24px 32px',
              display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center'
            }}>
              <div style={{
                fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1,
                backgroundColor: '#000', color: '#fff', padding: '6px 14px', borderRadius: 20,
                marginBottom: 20, boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
              }}>
                How it works
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24, transform: 'scale(1.1)' }}>

                {/* Step 1: Inputs (Stacked Nodes) */}
                <div className="fade-in d4" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {/* Image Node */}
                  <div style={{
                    background: '#fff', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 10, padding: '10px 14px',
                    display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 4px 8px rgba(0,0,0,0.03)',
                    position: 'relative'
                  }}>
                    <div style={{ width: 8, height: 8, background: '#ddd', borderRadius: '50%', position: 'absolute', right: -5, top: '50%', transform: 'translateY(-50%)', border: '2px solid #fff' }} />
                    <div style={{ width: 28, height: 28, background: '#f4f4f6', borderRadius: 6, display: 'grid', placeItems: 'center' }}>
                      <div style={{ width: 14, height: 14, background: '#ccc', borderRadius: 3 }} />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#333' }}>Image</span>
                  </div>
                  {/* Prompt Node */}
                  <div style={{
                    background: '#fff', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 10, padding: '10px 14px',
                    display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 4px 8px rgba(0,0,0,0.03)',
                    position: 'relative'
                  }}>
                    <div style={{ width: 8, height: 8, background: '#ddd', borderRadius: '50%', position: 'absolute', right: -5, top: '50%', transform: 'translateY(-50%)', border: '2px solid #fff' }} />
                    <div style={{ width: 28, height: 28, background: '#f4f4f6', borderRadius: 6, display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 800, color: '#aaa' }}>T</div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#333' }}>Prompt</span>
                  </div>
                </div>

                {/* Connectors */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, height: 80, justifyContent: 'center' }}>
                  <svg width="24" height="60" style={{ overflow: 'visible' }}>
                    <path d="M0 10 C 12 10, 12 30, 24 30" fill="none" stroke="#ddd" strokeWidth="2" />
                    <path d="M0 50 C 12 50, 12 30, 24 30" fill="none" stroke="#ddd" strokeWidth="2" />
                  </svg>
                </div>

                {/* Step 2: Generate Node */}
                <div className="fade-in d5" style={{
                  background: '#fff', border: '1.5px solid #7C6CF0', borderRadius: 14, padding: '14px 20px',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                  boxShadow: '0 8px 24px rgba(124,108,240,0.2)', position: 'relative'
                }}>
                  <div style={{ width: 8, height: 8, background: '#7C6CF0', borderRadius: '50%', position: 'absolute', left: -5, top: '50%', transform: 'translateY(-50%)', border: '2px solid #fff' }} />
                  <div style={{ width: 8, height: 8, background: '#7C6CF0', borderRadius: '50%', position: 'absolute', right: -5, top: '50%', transform: 'translateY(-50%)', border: '2px solid #fff' }} />

                  <Sparkles size={20} color="#7C6CF0" />
                  <span style={{ fontSize: 13, fontWeight: 800, color: '#111' }}>Generate</span>
                </div>

                {/* Connector */}
                <svg width="24" height="2" style={{ overflow: 'visible' }}>
                  <path d="M0 1 L 24 1" fill="none" stroke="#ddd" strokeWidth="2" />
                </svg>

                {/* Step 3: Launch Node */}
                <div className="fade-in d6" style={{
                  background: '#000', borderRadius: 14, padding: '14px 20px',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.15)', position: 'relative'
                }}>
                  <div style={{ width: 8, height: 8, background: '#fff', borderRadius: '50%', position: 'absolute', left: -4, top: '50%', transform: 'translateY(-50%)' }} />

                  <MonitorSmartphone size={20} color="#fff" />
                  <span style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>Export</span>
                </div>

              </div>
            </div>

          </div>

        </div>
      </section>
    </main>
  )
}
