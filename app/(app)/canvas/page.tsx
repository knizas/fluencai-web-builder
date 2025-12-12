'use client'
export const dynamic = 'force-dynamic'
import React, { Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import {
    Download,
    MonitorSmartphone,
    ArrowLeft,
    Loader2,
    Check,
} from 'lucide-react'
import { applyStyleTokens } from '@/lib/theme-tokens'
import { getProject, upsertProject, newId, type Project } from '@/lib/projects'
import { authedFetch } from '@/lib/utils/authedFetch'
import { CanvasEditor } from './components/CanvasEditor'
import type { Node, Edge } from '@xyflow/react'
import { ToastContainer, showToast } from '@/components/Toast'

/* Device constants */
const PHONE_W = 375, PHONE_H = 812
const LAPTOP_W = 1280, LAPTOP_H = 800
const TITLE_H = 24, GAP = 10

function innerWidth(el: HTMLDivElement) {
    const s = getComputedStyle(el)
    return el.clientWidth - parseFloat(s.paddingLeft || '0') - parseFloat(s.paddingRight || '0')
}

/* Scaled frame */
function ScaledFrame({
    w, h, scale, children,
}: { w: number; h: number; scale: number; children: React.ReactNode }) {
    return (
        <div style={{ width: w * scale, height: h * scale, position: 'relative' }}>
            <div
                style={{
                    position: 'absolute',
                    top: 0,
                    left: '50%',
                    transform: `translateX(-50%) scale(${scale})`,
                    transformOrigin: 'top center',
                    width: w,
                    height: h,
                }}
            >
                {children}
            </div>
        </div>
    )
}

function CanvasWebGenPageInner() {
    const search = useSearchParams()
    const router = useRouter()
    const tokens = useMemo(
        () => ({
            palette: { primary: search.get('p') || '#000', secondary: search.get('s') || '#7C6CF0', background: search.get('b') || '#FFF' },
            glass: { opacity: .75, blur: 12 }
        }),
        [search]
    )
    useEffect(() => { applyStyleTokens(tokens) }, [tokens])

    /* Preview mode toggle for mobile */
    const [previewMode, setPreviewMode] = useState<'laptop' | 'phone'>('laptop')

    /* layout refs */
    const shellRef = useRef<HTMLDivElement>(null)
    const rowRef = useRef<HTMLDivElement>(null)
    const colPhoneRef = useRef<HTMLDivElement>(null)
    const colLaptopRef = useRef<HTMLDivElement>(null)
    const canvasPanelRef = useRef<HTMLElement>(null)

    /* device scaling state */
    const [pScale, setPScale] = useState(1), [pW, setPW] = useState(PHONE_W), [pH, setPH] = useState(PHONE_H)
    const [lScale, setLScale] = useState(1), [lW, setLW] = useState(LAPTOP_W), [lH, setLH] = useState(LAPTOP_H)

    /* iframe refs + load states */
    const phoneIframeRef = useRef<HTMLIFrameElement>(null)
    const laptopIframeRef = useRef<HTMLIFrameElement>(null)
    const [phoneLoaded, setPhoneLoaded] = useState(false)
    const [laptopLoaded, setLaptopLoaded] = useState(false)

    /* project saving state */
    const [projectId, setProjectId] = useState<string | null>(null)
    const [projectName, setProjectName] = useState<string>('Untitled project')
    const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle')

    /* generation state */
    const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
    const [error, setError] = useState<string | null>(null)
    const [html, setHtml] = useState('')
    const htmlSrcDoc = useMemo(() => html || '', [html])

    /* CREDIT DEDUCTION */
    async function deduct(amount: number, reason: string) {
        const res = await authedFetch('/api/credits/deduct', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount, reason }),
        })
        if (!res.ok) {
            const j = await res.json().catch(() => ({}))
            throw new Error(j.error || 'Not enough credits')
        }
    }

    /* Scale previews */
    useLayoutEffect(() => {
        const calc = () => {
            if (!rowRef.current || !colPhoneRef.current || !colLaptopRef.current) return
            const row = rowRef.current
            const rect = row.getBoundingClientRect()
            const availH = Math.max(360, rect.height - TITLE_H - GAP)

            const pw = innerWidth(colPhoneRef.current)
            const p_sH = Math.min(1, Math.max(.4, availH / PHONE_H))
            const p_sW = Math.min(1, Math.max(.4, pw / PHONE_W))
            const ps = Math.min(p_sH, p_sW)
            setPScale(ps); setPW(PHONE_W * ps); setPH(PHONE_H * ps)

            const lw = innerWidth(colLaptopRef.current)
            const l_sH = Math.min(1, Math.max(.25, availH / LAPTOP_H))
            const l_sW = Math.min(1, Math.max(.25, lw / LAPTOP_W))
            const ls = Math.min(l_sH, l_sW)
            setLScale(ls); setLW(LAPTOP_W * ls); setLH(LAPTOP_H * ls)
        }
        const roRow = new ResizeObserver(calc)
        const ro1 = new ResizeObserver(calc)
        const ro2 = new ResizeObserver(calc)
        if (rowRef.current) roRow.observe(rowRef.current)
        if (colPhoneRef.current) ro1.observe(colPhoneRef.current)
        if (colLaptopRef.current) ro2.observe(colLaptopRef.current)
        window.addEventListener('resize', calc); calc()
        return () => { roRow.disconnect(); ro1.disconnect(); ro2.disconnect(); window.removeEventListener('resize', calc) }
    }, [])

    /* Generate from nodes */
    async function handleGenerateFromNodes(nodes: Node[], edges: Edge[]) {
        if (status === 'loading') return
        setError(null)
        setPhoneLoaded(false)
        setLaptopLoaded(false)

        // Collect all prompt nodes
        const promptNodes = nodes.filter(n => n.type === 'promptNode')
        const combinedPrompt = promptNodes
            .map(n => (n.data.text as string) || '')
            .filter(t => t.trim())
            .join('\n\n')

        if (!combinedPrompt.trim()) {
            setError('Add at least one prompt node with text')
            setStatus('error')
            return
        }

        // Collect image nodes
        const imageNodes = nodes.filter(n => n.type === 'imageNode' && n.data.imageFile)

        try {
            await deduct(100, 'generate')
        } catch (e: any) {
            setError(e.message || 'Not enough credits')
            setStatus('error')
            return
        }

        setStatus('loading')
        try {
            const fd = new FormData()
            fd.append('prompt', combinedPrompt.slice(0, 8000))

            // Add images as assets
            imageNodes.forEach((node, idx) => {
                if (node.data.imageFile) {
                    fd.append('assets[]', node.data.imageFile as File, `image-${idx}.png`)
                }
            })

            const r = await fetch('/api/generate', { method: 'POST', body: fd })

            let j
            const text = await r.text()
            try {
                j = JSON.parse(text)
            } catch (e) {
                console.error('Failed to parse API response:', text)
                throw new Error(`Server error: ${text.slice(0, 100)}${text.length > 100 ? '...' : ''}`)
            }

            if (!r.ok) throw new Error(j?.error || 'Generation failed')
            setHtml(j.html || '')
            setStatus('done')
            showToast(`Generated successfully! (${(j.html || '').length} chars)`, 'success')
        } catch (err: any) {
            setStatus('error')
            setError(err.message || 'Generation failed. Please try again.')
            showToast(err.message || 'Generation failed', 'error')
        }
    }

    /* Save project */
    async function handleSave() {
        if (saveState === 'saving') return
        setSaveState('saving')

        try {
            const id = projectId || newId()
            if (!projectId) setProjectId(id)

            // Generate thumbnail from HTML
            let thumbnail: string | undefined
            if (html) {
                try {
                    // Create a temporary iframe to render the HTML
                    const iframe = document.createElement('iframe')
                    iframe.style.position = 'absolute'
                    iframe.style.left = '-9999px'
                    iframe.style.width = '1280px'
                    iframe.style.height = '800px'
                    document.body.appendChild(iframe)

                    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document
                    if (iframeDoc) {
                        iframeDoc.open()
                        iframeDoc.write(html)
                        iframeDoc.close()

                        // Wait for content to load
                        await new Promise(resolve => setTimeout(resolve, 500))

                        // Capture screenshot using canvas
                        const canvas = document.createElement('canvas')
                        canvas.width = 320
                        canvas.height = 200
                        const ctx = canvas.getContext('2d')

                        if (ctx && iframeDoc.body) {
                            // Simple screenshot by drawing iframe content
                            const data = new XMLSerializer().serializeToString(iframeDoc.documentElement)
                            const svgBlob = new Blob([`<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="800"><foreignObject width="100%" height="100%">${data}</foreignObject></svg>`], { type: 'image/svg+xml' })
                            const url = URL.createObjectURL(svgBlob)
                            const img = new Image()

                            await new Promise((resolve, reject) => {
                                img.onload = resolve
                                img.onerror = reject
                                img.src = url
                            })

                            ctx.drawImage(img, 0, 0, 320, 200)
                            thumbnail = canvas.toDataURL('image/png')
                            URL.revokeObjectURL(url)
                        }
                    }

                    document.body.removeChild(iframe)
                } catch (err) {
                    console.warn('Failed to generate thumbnail:', err)
                }
            }

            const project: Project = {
                id,
                name: projectName,
                html: html || '',
                thumbnail,
                updatedAt: Date.now()
            }

            upsertProject(project)
            setSaveState('saved')
            showToast('Project saved successfully!', 'success')

            // Reset to idle after 2 seconds
            setTimeout(() => setSaveState('idle'), 2000)
        } catch (err: any) {
            setSaveState('idle')
            showToast(err.message || 'Save failed', 'error')
        }
    }

    /* Download */
    async function onDownload() {
        try { await deduct(50, 'download-html') }
        catch (e: any) { alert(e.message || 'Not enough credits'); return }

        const blob = new Blob([html], { type: 'text/html' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url; a.download = 'generated.html'; a.click()
        URL.revokeObjectURL(url)
    }

    const phoneBusy = status === 'loading' || (!phoneLoaded && htmlSrcDoc !== '')
    const laptopBusy = status === 'loading' || (!laptopLoaded && htmlSrcDoc !== '')

    return (
        <main className="container page webgen" style={{ height: 'calc(100vh - 32px)', display: 'flex', flexDirection: 'column' }}>
            <div ref={shellRef} className="shell" style={{ overflow: 'visible', height: '100%', display: 'flex', flexDirection: 'column', padding: 0 }}>
                {/* FULL-SCREEN CANVAS PANEL */}
                <section ref={canvasPanelRef} className="panel-glass" style={{
                    padding: 0, borderRadius: 0,
                    flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column'
                }}>
                    <CanvasEditor
                        onGenerate={handleGenerateFromNodes}
                        generationStatus={status}
                        onSave={handleSave}
                        onBack={() => router.push('/')}
                        saveState={saveState}
                        initialTemplate={search.get('template') || undefined}
                        html={html || undefined}
                    />
                </section>

                {error && (
                    <div style={{
                        margin: 10, padding: '10px 14px', background: 'rgba(255,0,0,0.08)',
                        border: '1px solid rgba(255,0,0,0.2)', borderRadius: 12,
                        color: '#c00', fontSize: 13, fontWeight: 700,
                        flexShrink: 0
                    }}>
                        {error}
                    </div>
                )}
            </div>

            {/* Loading Overlay */}
            {status === 'loading' && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.7)',
                    backdropFilter: 'blur(8px)',
                    zIndex: 99999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column',
                    gap: 20
                }}>
                    <Loader2 size={64} color="#fff" className="spin" />
                    <div style={{ color: '#fff', fontSize: 20, fontWeight: 900 }}>Generating your website...</div>
                    <div style={{ color: '#fff', opacity: 0.8, fontSize: 14 }}>This may take a moment</div>
                </div>
            )}

            {/* Toast Notifications */}
            <ToastContainer />

            <style jsx global>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
        </main>
    )
}

const overlayStyle: React.CSSProperties = {
    position: 'absolute', inset: 0, display: 'grid', placeItems: 'center',
    background: '#fff', zIndex: 5
}
const overlayCard: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800,
    padding: '10px 14px', borderRadius: 12, border: '1px solid rgba(0,0,0,.08)',
    background: '#fff', boxShadow: '0 8px 24px rgba(0,0,0,.08)'
}

export default function CanvasWebGenPage() {
    return (
        <Suspense fallback={<main style={{ padding: 40 }}>Loading…</main>}>
            <CanvasWebGenPageInner />
        </Suspense>
    )
}
