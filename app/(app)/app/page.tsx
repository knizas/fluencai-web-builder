'use client'
import React from 'react'
import Link from 'next/link'
import {
  Search, Activity, ShoppingBag, CalendarDays, Truck, MessagesSquare, GraduationCap, CreditCard,
  HeartPulse, Plane, Utensils, Music, Building2, Store, PlayCircle, Gamepad2, ListChecks, FileText,
  CloudSun, Plus, Trash2, Coins
} from 'lucide-react'
import RouteTransitions from '../../transition'
import { useRouter } from 'next/navigation'
import { listProjects, deleteProject, updateProjectName, type Project } from '@/lib/projects'
import { authedFetch } from '@/lib/utils/authedFetch'
import { useAuth } from '@/lib/auth/AuthProvider'

function scaffoldBrief(args: {
  name: string; purpose: string; pages: string[]; features: string[]; audience?: string
}) {
  const { name, purpose, pages, features, audience = '' } = args
  return `Project Brief (fill in)

1) General
- Business / Project Name: ${name}
- One-liner (1–2 sentences):
- Target audience: ${audience}
- Main purpose (sell, book, showcase, community): ${purpose}

2) Pages / Screens
${pages.map(p => `- ${p}`).join('\n')}

3) Features
- Pick: ${features.join(', ')}.

4) Design
- Style (modern/luxury/playful/etc.):
- Colors / theme:
- Typography:
- Layout (grid/card/full-bleed):
- Brand assets (logo, images/links):

5) Content
- Tone (friendly/professional/playful):
- CTA phrases:
- SEO keywords (optional):

6) Technical
- Target devices (Web):
- Priorities (fast, accessible, HD visuals):
- Integrations (CRM/Analytics/CMS):
- Scalability needs:

7) Extra
- Competitors/inspo:
- Must-haves vs nice-to-haves:
- Don't do:`
}

function briefFromFreeText(text: string) {
  return `Project Brief (fill in)

1) General
- Business / Project Name:
- One-liner (1–2 sentences): ${text}
- Target audience:
- Main purpose (sell, book, showcase, community):

2) Pages / Screens
- List pages and what's on each (Hero, CTA, product grid, about, contact, etc.)

3) Features
- Pick: auth, search/filters, cart/booking, payment (Stripe/PayPal), notifications, multilingual, social links.

4) Design
- Style (modern/luxury/playful/etc.):
- Colors / theme:
- Typography:
- Layout (grid/card/full-bleed):
- Brand assets (logo, images/links):

5) Content
- Tone (friendly/professional/playful):
- CTA phrases:
- SEO keywords (optional):

6) Technical
- Target devices (Web):
- Priorities (fast, accessible, HD visuals):
- Integrations (CRM/Analytics/CMS):
- Scalability needs:

7) Extra
- Competitors/inspo:
- Must-haves vs nice-to-haves:
- Don't do:`
}

const TEMPLATE_STARTERS: Record<string, string> = {
  fitness: scaffoldBrief({
    name: 'Fitness Coaching Website',
    purpose: 'sell programs & book sessions',
    audience: 'individuals seeking training or classes',
    pages: [
      'Home (hero, USP, program highlights, CTA)',
      'Programs (grid, filters, pricing)',
      'Coaches (bios, certifications, social links)',
      'Schedule (calendar, booking widget)',
      'Testimonials', 'About', 'Contact'
    ],
    features: ['auth', 'booking', 'payments (Stripe)', 'search/filters', 'notifications', 'multilingual', 'social links']
  }),
  ecommerce: scaffoldBrief({
    name: 'Online Store Website',
    purpose: 'sell products',
    audience: 'shoppers looking for curated products',
    pages: [
      'Home (hero, featured collection, CTA)',
      'Catalog (filters, sort, pagination)',
      'Product (gallery, reviews, add-to-cart)',
      'Cart', 'Checkout', 'About', 'Contact'
    ],
    features: ['search/filters', 'cart', 'payments (Stripe/PayPal)', 'auth', 'notifications', 'multilingual', 'SEO']
  }),
  travel: scaffoldBrief({
    name: 'Travel Agency Website',
    purpose: 'showcase trips & capture bookings',
    audience: 'travelers seeking curated itineraries',
    pages: [
      'Home (hero, destinations, CTA)',
      'Destinations (grid, filters, map)',
      'Itinerary detail (gallery, schedule, inclusions)',
      'Booking (form/checkout)', 'About', 'Contact'
    ],
    features: ['booking', 'search/filters', 'map', 'payments', 'multilingual', 'social links', 'newsletter']
  }),
  food: scaffoldBrief({
    name: 'Restaurant / Delivery Website',
    purpose: 'order online & reservations',
    audience: 'local diners and returning customers',
    pages: [
      'Home (hero, specials, CTA)',
      'Menu (categories, modifiers, dietary filters)',
      'Item detail (options, upsells)',
      'Cart', 'Checkout (pickup/delivery)', 'About', 'Contact'
    ],
    features: ['cart', 'payments', 'booking (reservations)', 'notifications', 'multilingual', 'social links']
  }),
  finance: scaffoldBrief({
    name: 'Financial Services Website',
    purpose: 'showcase services & capture leads',
    audience: 'SMBs and individuals seeking advice',
    pages: [
      'Home (hero, services overview, CTA)',
      'Services (grid, details, pricing tiers)',
      'Case studies / Testimonials', 'Resources / Blog', 'About', 'Contact (lead form)'
    ],
    features: ['lead capture forms', 'blog/SEO', 'multilingual', 'analytics', 'social links']
  }),
  health: scaffoldBrief({
    name: 'Wellness & Mindfulness Website',
    purpose: 'promote programs & subscriptions',
    audience: 'people seeking wellness guidance',
    pages: [
      'Home (hero, benefits, CTA)',
      'Programs (grid, details)', 'Instructors (bios)', 'Schedule (calendar)',
      'Testimonials', 'About', 'Contact'
    ],
    features: ['auth', 'subscriptions', 'booking', 'payments', 'notifications', 'multilingual']
  }),
  news: scaffoldBrief({
    name: 'News & Magazine Website',
    purpose: 'publish articles & grow subscribers',
    audience: 'readers by topic/interests',
    pages: [
      'Home (top stories, sections, CTA)',
      'Topic listing (filters, pagination)',
      'Article page (reading UX, share, related)',
      'Newsletter signup', 'About', 'Contact'
    ],
    features: ['search/filters', 'newsletter', 'SEO', 'social share', 'auth (subscriptions)', 'multilingual']
  }),
  music: scaffoldBrief({
    name: 'Music Portfolio Website',
    purpose: 'showcase tracks & events',
    audience: 'fans, promoters, collaborators',
    pages: [
      'Home (hero, featured tracks, CTA)',
      'Music (player, playlists)',
      'Events (calendar, tickets link)', 'Gallery', 'About', 'Contact'
    ],
    features: ['audio player', 'events', 'social links', 'newsletter', 'SEO']
  }),
  learning: scaffoldBrief({
    name: 'Learning / Course Website',
    purpose: 'sell courses & manage students',
    audience: 'learners and professionals',
    pages: [
      'Home (hero, featured courses, CTA)',
      'Courses (grid, filters)',
      'Course detail (curriculum, instructor, reviews)',
      'Checkout', 'About', 'Contact'
    ],
    features: ['auth', 'payments', 'search/filters', 'progress (CMS/LMS)', 'multilingual', 'notifications']
  }),
  events: scaffoldBrief({
    name: 'Events / Booking Website',
    purpose: 'list events & sell tickets',
    audience: 'attendees and organizers',
    pages: [
      'Home (hero, upcoming highlights, CTA)',
      'Events (calendar + list, filters)',
      'Event detail (schedule, venue map, ticket tiers)',
      'Checkout', 'About', 'Contact'
    ],
    features: ['booking/tickets', 'payments', 'calendar', 'search/filters', 'notifications', 'multilingual']
  }),
  photos: scaffoldBrief({
    name: 'Photography Portfolio Website',
    purpose: 'showcase work & capture inquiries',
    audience: 'clients and art directors',
    pages: [
      'Home (hero, featured shoots, CTA)',
      'Portfolio (galleries, filters)',
      'Project detail (gallery, story)',
      'About', 'Contact (inquiry form)'
    ],
    features: ['galleries', 'lightbox', 'SEO', 'social links', 'CMS integration']
  }),
  realestate: scaffoldBrief({
    name: 'Real Estate Listings Website',
    purpose: 'promote properties & capture leads',
    audience: 'buyers/renters',
    pages: [
      'Home (hero, featured, CTA)',
      'Listings (filters: price, type, beds, map)',
      'Property detail (gallery, specs, floorplans, map)',
      'Agents (bios, contact)', 'About', 'Contact'
    ],
    features: ['search/filters', 'map', 'lead forms', 'multilingual', 'analytics', 'SEO']
  }),
  social: scaffoldBrief({
    name: 'Community / Social Website',
    purpose: 'share posts & connect members',
    audience: 'niche community',
    pages: [
      'Home (feed, trending)', 'Topics / Groups', 'Profile', 'About', 'Contact / Support'
    ],
    features: ['auth', 'posts/feed', 'comments', 'notifications', 'moderation', 'social links']
  }),
  marketplace: scaffoldBrief({
    name: 'Marketplace Website',
    purpose: 'listings & transactions between users',
    audience: 'buyers and sellers',
    pages: [
      'Home (hero, featured categories, CTA)',
      'Listings (filters, sort)',
      'Listing detail (gallery, description, seller)',
      'Post listing (form)', 'Cart/Checkout', 'About', 'Contact'
    ],
    features: ['auth', 'search/filters', 'cart/payments', 'messaging/contact', 'notifications', 'moderation']
  }),
  streaming: scaffoldBrief({
    name: 'Media Streaming Website',
    purpose: 'browse content & watch',
    audience: 'subscribers and visitors',
    pages: [
      'Home (hero, categories, CTA)',
      'Browse (filters, search)',
      'Content detail (player, metadata, related)',
      'Account', 'About'
    ],
    features: ['video player', 'search/filters', 'auth', 'subscriptions/payments', 'watchlist', 'SEO']
  }),
  gaming: scaffoldBrief({
    name: 'Gaming Hub Website',
    purpose: 'catalog & community',
    audience: 'players and enthusiasts',
    pages: [
      'Home (hero, featured, CTA)',
      'Games (filters, platforms)',
      'Game detail (gallery, reviews, links)',
      'News/Blog', 'About', 'Contact'
    ],
    features: ['search/filters', 'reviews/comments', 'auth', 'newsletter', 'SEO', 'social links']
  }),
  productivity: scaffoldBrief({
    name: 'Productivity Tool Website',
    purpose: 'promote app & capture signups',
    audience: 'professionals and teams',
    pages: [
      'Home (hero, benefits, demo, CTA)',
      'Features', 'Pricing', 'Blog/Resources', 'About', 'Contact'
    ],
    features: ['auth (for app CTA)', 'newsletter', 'pricing tiers', 'SEO', 'analytics']
  }),
  notes: scaffoldBrief({
    name: 'Notes App Landing Website',
    purpose: 'showcase features & convert',
    audience: 'students and professionals',
    pages: [
      'Home (hero, features, CTA)',
      'Templates / Use cases', 'Pricing', 'About', 'Contact'
    ],
    features: ['newsletter', 'SEO', 'analytics', 'social links']
  }),
  weather: scaffoldBrief({
    name: 'Weather Information Website',
    purpose: 'inform users & acquire traffic',
    audience: 'general audience',
    pages: [
      'Home (current conditions, locations)',
      'Forecast (5–10 day, hourly)', 'Maps', 'About', 'Contact'
    ],
    features: ['search/locations', 'multilingual', 'SEO', 'analytics', 'notifications (optional)']
  })
}

// Separate component for project card to avoid hooks in map
function ProjectCard({ project, onOpen, onDelete }: { project: Project; onOpen: (p: Project) => void; onDelete: (e: React.MouseEvent, p: Project) => void }) {
  const [isEditing, setIsEditing] = React.useState(false)
  const [editName, setEditName] = React.useState(project.name || 'Untitled')

  return (
    <div style={{ display: 'grid', gap: 6 }}>
      {/* Card */}
      <div
        className="card"
        style={{ overflow: 'hidden', cursor: 'pointer', position: 'relative' }}
        onClick={() => onOpen(project)}
        role="button"
      >
        {/* Delete */}
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(e, project) }}
          title="Delete project"
          aria-label="Delete project"
          style={{
            position: 'absolute', top: 8, right: 8, zIndex: 2,
            border: '1px solid #eee', background: '#fff', borderRadius: 8, padding: 6,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center'
          }}
        >
          <Trash2 size={14} />
        </button>

        {/* Thumbnail */}
        <div style={{
          width: '100%', height: 120, display: 'grid', placeItems: 'center',
          background: '#fff', border: '1px solid #eee'
        }}>
          {project.thumbnail
            ? <img src={project.thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <div style={{ opacity: .5, fontSize: 12 }}>No preview</div>}
        </div>
      </div>

      {/* Name BELOW (outside the card) - Editable */}
      {isEditing ? (
        <input
          type="text"
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          onBlur={() => {
            setIsEditing(false)
            if (editName.trim() && editName !== project.name) {
              updateProjectName(project.id, editName)
            } else {
              setEditName(project.name || 'Untitled')
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              (e.target as HTMLInputElement).blur()
            }
          }}
          autoFocus
          style={{
            fontSize: 12, fontWeight: 700, textAlign: 'center',
            padding: '4px 6px', border: '1px solid #7C6CF0',
            borderRadius: 6, outline: 'none', width: '100%'
          }}
        />
      ) : (
        <div
          onClick={(e) => {
            e.stopPropagation()
            setIsEditing(true)
          }}
          title="Click to edit name"
          style={{
            fontSize: 12, fontWeight: 700, textAlign: 'center',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            padding: '4px 6px', cursor: 'text', borderRadius: 6,
            transition: 'background 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(124,108,240,0.08)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        >
          {project.name || 'Untitled project'}
        </div>
      )}
    </div>
  )
}

export default function HomePage() {
  const router = useRouter()
  const { user, loading } = useAuth()

  // --- All hooks at top, before any conditional return ---
  const [q, setQ] = React.useState('')
  const [recents, setRecents] = React.useState<Project[]>([])
  const [idx, setIdx] = React.useState(0)
  const [display, setDisplay] = React.useState('')

  const templates = React.useMemo(() => [
    { slug: 'fitness', name: 'Fitness', desc: 'Programs, workouts, progress tracking' },
    { slug: 'ecommerce', name: 'E-commerce', desc: 'Catalog, cart, checkout' },
    { slug: 'travel', name: 'Travel', desc: 'Trips, itineraries, bookings' },
    { slug: 'food', name: 'Food Delivery', desc: 'Menus, checkout, couriers' },
    { slug: 'finance', name: 'Finance', desc: 'Budgets, expenses, insights' },
    { slug: 'health', name: 'Health & Wellness', desc: 'Habits, mindfulness, tracking' },
    { slug: 'news', name: 'News', desc: 'Feeds, topics, bookmarks' },
    { slug: 'music', name: 'Music', desc: 'Playlists, player, library' },
    { slug: 'learning', name: 'Learning', desc: 'Courses, progress, quizzes' },
    { slug: 'events', name: 'Events', desc: 'Calendar, RSVPs, tickets' },
    { slug: 'photos', name: 'Photography', desc: 'Galleries, albums, share' },
    { slug: 'realestate', name: 'Real Estate', desc: 'Listings, maps, favorites' },
    { slug: 'social', name: 'Social', desc: 'Feeds, messages, profile' },
    { slug: 'marketplace', name: 'Marketplace', desc: 'Listings, cart, orders' },
    { slug: 'streaming', name: 'Streaming', desc: 'Home, browse, player' },
    { slug: 'gaming', name: 'Gaming', desc: 'Library, store, profile' },
    { slug: 'productivity', name: 'Productivity', desc: 'Tasks, calendar, projects' },
    { slug: 'notes', name: 'Notes', desc: 'Notes, folders, search' },
    { slug: 'weather', name: 'Weather', desc: 'Today, forecast, locations' }
  ], [])

  React.useEffect(() => { try { setRecents(listProjects()) } catch { } }, [])

  const words = ['What do you want to create?'] as const
  React.useEffect(() => {
    const phrase = words[idx]
    let i = 0
    setDisplay('')
    const t = setInterval(() => {
      i++
      setDisplay(phrase.slice(0, i))
      if (i >= phrase.length) clearInterval(t)
    }, 30)
    return () => clearInterval(t)
  }, [idx])

  React.useEffect(() => {
    if (!loading && !user) router.replace('/welcome')
  }, [loading, user, router])

  if (loading || !user) {
    return (
      <main className="container page" style={{ display: 'grid', placeItems: 'center', minHeight: '60vh' }}>
        <div className="panel-glass" style={{ padding: 16, borderRadius: 12 }}>Loading…</div>
      </main>
    )
  }

  function onOpenProject(p: Project) {
    router.push(`/webgen?project=${encodeURIComponent(p.id)}`)
  }
  function onDeleteProject(e: React.MouseEvent, p: Project) {
    e.preventDefault(); e.stopPropagation()
    const ok = window.confirm(`Delete "${p.name}"? This cannot be undone.`)
    if (!ok) return
    deleteProject(p.id)
    setRecents(prev => prev.filter(x => x.id !== p.id))
  }

  async function onGo() {
    const raw = q.trim()
    if (!raw) { alert('Please describe your project.'); return }
    const desc = briefFromFreeText(raw)
    try {
      const res = await authedFetch('/api/credits/deduct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: 10, reason: 'starter-description' })
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        alert(j.error || 'Not enough credits'); return
      }
      router.push(`/webgen?starter=1&prompt=${encodeURIComponent(desc)}`)
    } catch (e: any) {
      alert(e?.message || 'Please sign in to continue.')
    }
  }

  function onPickTemplate(slug: string) {
    router.push(`/canvas?template=${slug}`)
  }

  return (
    <>
      <RouteTransitions />
      <main className="container page">
        <div className="shell">
          <section className="hero">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <img src="/logo.svg" alt="Fluencai" width={34} height={34} style={{ borderRadius: 8 }} />
                <h1 style={{ margin: 0, fontSize: 'var(--text-4xl)', lineHeight: 1.15, color: 'var(--ink)', fontWeight: 900 }}>{display}<span style={{ opacity: .4 }}>▌</span></h1>
              </div>
              <Link href="/canvas" className="btn-cta" data-transition style={{ textDecoration: 'none', background: '#000 !important', backgroundColor: '#000', color: '#fff' }}>New Canvas Project</Link>
            </div>

            <div className="tabs">
              <button className="tab">Your designs</button>
              <button className="tab active">Templates</button>
            </div>

            <div className="searchWrap" style={{ marginTop: 'var(--space-6)' }}>
              <Search size={18} style={{ opacity: .7 }} />
              <input
                value={q}
                onChange={(e) => setQ((e.target as HTMLInputElement).value)}
                placeholder="Describe your project..."
                style={{ border: 'none', outline: 'none', flex: 1, fontSize: 'var(--text-base)', fontWeight: 500 }}
                onKeyDown={(e) => e.key === 'Enter' && onGo()}
              />
              <button type="button" className="btn-cta" onClick={onGo} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#000', backgroundColor: '#000', color: '#fff' }}>Go (10 <Coins size={14} />)</button>
            </div>

            <div className="quickRow" style={{ marginTop: 'var(--space-6)' }}>
              {[
                { slug: 'fitness', label: 'Fitness', icon: <Activity size={18} color="#000" /> },
                { slug: 'ecommerce', label: 'E-commerce', icon: <ShoppingBag size={18} color="#000" /> },
                { slug: 'events', label: 'Booking', icon: <CalendarDays size={18} color="#000" /> },
                { slug: 'food', label: 'Delivery', icon: <Truck size={18} color="#000" /> },
                { slug: 'social', label: 'Social', icon: <MessagesSquare size={18} color="#000" /> },
                { slug: 'learning', label: 'Education', icon: <GraduationCap size={18} color="#000" /> },
                { slug: 'finance', label: 'Finance', icon: <CreditCard size={18} color="#000" /> },
                { slug: 'health', label: 'Wellness', icon: <HeartPulse size={18} color="#000" /> },
                { slug: 'travel', label: 'Travel', icon: <Plane size={18} color="#000" /> },
                { slug: 'music', label: 'Music', icon: <Music size={18} color="#000" /> },
                { slug: 'realestate', label: 'Real Estate', icon: <Building2 size={18} color="#000" /> },
                { slug: 'marketplace', label: 'Marketplace', icon: <Store size={18} color="#000" /> },
                { slug: 'streaming', label: 'Streaming', icon: <PlayCircle size={18} color="#000" /> },
                { slug: 'gaming', label: 'Gaming', icon: <Gamepad2 size={18} color="#000" /> },
                { slug: 'productivity', label: 'Productivity', icon: <ListChecks size={18} color="#000" /> },
                { slug: 'notes', label: 'Notes', icon: <FileText size={18} color="#000" /> },
                { slug: 'weather', label: 'Weather', icon: <CloudSun size={18} color="#000" /> },
              ].map((item, i) => (
                <button
                  key={i}
                  type="button"
                  className="quick"
                  data-transition
                  onClick={() => onPickTemplate(item.slug)}
                  style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer' }}
                  aria-label={`Start with ${item.label} template`}
                >
                  <div className="dot" style={{ background: 'rgba(124,108,240,0.1)', marginBottom: 6 }}>{item.icon}</div>
                  <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, textAlign: 'center', color: 'var(--ink)' }}>{item.label}</div>
                </button>
              ))}
            </div>
          </section>

          <section style={{ marginTop: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900 }}>Recent designs</h2>
              <Link href="/canvas" className="btn-outline" data-transition style={{ textDecoration: 'none' }}>New</Link>
            </div>

            <div className="grid">
              {/* Start New Project Card */}
              <div
                onClick={() => router.push('/canvas')}
                className="glass-card"
                style={{
                  padding: '16px',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  minHeight: '120px',
                  border: '2px dashed rgba(124,108,240,0.3)',
                  background: 'linear-gradient(135deg, rgba(124,108,240,0.08), rgba(124,108,240,0.02))',
                  position: 'relative',
                  transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
                  boxShadow: 'none'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-4px)'
                  e.currentTarget.style.borderColor = 'rgba(124,108,240,0.6)'
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(124,108,240,0.15), rgba(124,108,240,0.05))'
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(124,108,240,0.15)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.borderColor = 'rgba(124,108,240,0.3)'
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(124,108,240,0.08), rgba(124,108,240,0.02))'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 40,
                    height: 40,
                    borderRadius: '12px',
                    background: 'rgba(124,108,240,0.1)',
                    display: 'grid',
                    placeItems: 'center',
                    flexShrink: 0
                  }}>
                    <Plus size={20} color="#7C6CF0" strokeWidth={3} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: 15, fontWeight: 900, marginBottom: 4, color: '#111' }}>Start New Project</h3>
                    <p style={{ fontSize: 12, opacity: 0.7, lineHeight: 1.3, fontWeight: 500, margin: 0 }}>
                      Create with AI templates
                    </p>
                  </div>
                </div>
              </div>

              {recents.map((p) => (
                <ProjectCard
                  key={p.id}
                  project={p}
                  onOpen={onOpenProject}
                  onDelete={onDeleteProject}
                />
              ))}

            </div>
          </section>
        </div >
      </main >
    </>
  )
}
