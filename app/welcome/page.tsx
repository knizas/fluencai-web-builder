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
    <main className="welcome-wrap page">
      <section className="panel-glass welcome-box fade-in d0">
        {/* Top bar */}
        <header className="welcome-top fade-in d1">
          <div className="welcome-brand">
            <img src="/logo.svg" alt="Fluencai" width={26} height={26} className="welcome-logo" />
            <strong className="welcome-name">Fluencai</strong>
          </div>
          <Link href="/signin?next=%2Fapp" data-transition className="link-quiet no-underline">
            Sign in
          </Link>
        </header>

        {/* Grid */}
        <div className="welcome-grid">
          {/* Left: copy */}
          <div className="welcome-copy">
            <h1 className="welcome-title fade-in d2">Design &amp; build websites in minutes</h1>
            <p className="welcome-sub fade-in d3">
              Generate, edit visually, and export clean HTML — with live phone and laptop previews.
            </p>

            <ul className="welcome-list fade-in d4">
              <li>
                <Sparkles size={18} aria-hidden="true" />
                <span>
                  <strong>AI page builder</strong> for instant layouts
                </span>
              </li>
              <li>
                <MonitorSmartphone size={18} aria-hidden="true" />
                <span>
                  <strong>Live dual preview</strong> (phone &amp; laptop)
                </span>
              </li>
              <li>
                <Lock size={18} aria-hidden="true" />
                <span>
                  <strong>Lock sections</strong> across regenerations
                </span>
              </li>
            </ul>

            <div className="welcome-ctas fade-in d5">
              <Link
                href="/signin?next=%2Fapp"
                data-transition
                className="btn btn-cta no-underline"
              >
                Get started
              </Link>
              <a
                href="https://www.fluencai.com/app-builder"
                target="_blank"
                rel="noreferrer"
                className="btn-outline no-underline"
              >
                Learn more
              </a>
            </div>

            <p className="welcome-foot fade-in d6">
              No credit card required. You can change or export any page at any time.
            </p>
          </div>

          {/* Right: BIG computer with perfect-fit video + 3D float */}
          <div className="welcome-media">
            <figure className="browser-shell float3d fade-in d4">
              <div className="browser-bar">
                <span className="b-dot red" />
                <span className="b-dot yellow" />
                <span className="b-dot green" />
                <div className="b-addr">fluencai.com</div>
              </div>

              {/* IMPORTANT: viewport manages the bar height so the video fits 100% */}
              <div className="browser-viewport">
                <video
                  className="browser-video"
                  src="/App-Builder.mp4"
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  poster="/poster.jpg"
                />
              </div>
            </figure>
          </div>
        </div>
      </section>
    </main>
  )
}
