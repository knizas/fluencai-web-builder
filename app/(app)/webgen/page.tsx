'use client'
export const dynamic = 'force-dynamic'
import React, { Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  Download,
  MonitorSmartphone,
  ArrowLeft,
  Image as ImageIcon,
  Images,
  Sparkles,
  Loader2,
  Check,
} from 'lucide-react'
import { applyStyleTokens } from '@/lib/theme-tokens'
import { getProject, upsertProject, newId, type Project } from '@/lib/projects'
import { authedFetch } from '@/lib/utils/authedFetch'


/* ---- Device constants ---- */
const PHONE_W = 375, PHONE_H = 812
const LAPTOP_W = 1280, LAPTOP_H = 800
const TITLE_H = 24, GAP = 10

function innerWidth(el: HTMLDivElement){
  const s = getComputedStyle(el)
  return el.clientWidth - parseFloat(s.paddingLeft||'0') - parseFloat(s.paddingRight||'0')
}

/* ---- Scaled frame: keeps real viewport, scales visually ---- */
function ScaledFrame({
  w, h, scale, children,
}: { w:number; h:number; scale:number; children:React.ReactNode }) {
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

/* ---- Pretty, slim file picker ---- */
function FilePicker({
  icon,
  label,
  multiple,
  accept,
  onChange,
  helper,
}: {
  icon: React.ReactNode
  label: string
  multiple?: boolean
  accept?: string
  onChange?: (files: FileList | null) => void
  helper?: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [names, setNames] = useState<string>('No file chosen')

  return (
    <div className="wg-field" style={{ marginBottom: 10 }}>
      <div className="wg-label" style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, fontWeight:700, color:'var(--ink-soft)' }}>
        {icon} {label}
      </div>

      <div
        className="wg-picker"
        role="button"
        tabIndex={0}
        onClick={()=> inputRef.current?.click()}
        onKeyDown={(e)=> (e.key === 'Enter' || e.key === ' ') && inputRef.current?.click()}
        style={{
          display:'grid',
          gridTemplateColumns:'auto 1fr',
          alignItems:'center',
          gap:8,
          border:'1px solid var(--line-grey)',
          background:'#fff',
          borderRadius:12,
          padding:'6px 8px',
        }}
      >
        <div className="wg-pill" style={{ padding:'6px 10px', borderRadius:999, fontWeight:800, background:'var(--brand-primary)', color:'#fff', fontSize:12 }}>
          Browse
        </div>
        <div className="wg-filename" title={names} style={{ fontSize:12, opacity:.7, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
          {names}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        className="wg-nativeFile"
        accept={accept}
        multiple={multiple}
        onChange={(e)=>{
          const fs = e.currentTarget.files
          setNames(
            !fs || fs.length === 0
              ? 'No file chosen'
              : fs.length === 1
                ? fs[0].name
                : `${fs.length} files selected`
          )
          onChange?.(fs)
        }}
        style={{ display:'none' }}
      />

      {helper ? <div className="wg-help" style={{ marginTop:6, fontSize:11, opacity:.6 }}>{helper}</div> : null}
    </div>
  )
}

function WebGenPageInner(){
  /* theme tokens via URL ?p,?s,?b */
  const search = useSearchParams()
  const router = useRouter()
  const tokens = useMemo(
    () => ({
      palette:{ primary: search.get('p') || '#000', secondary: search.get('s') || '#7C6CF0', background: search.get('b') || '#FFF' },
      glass:{ opacity:.75, blur:12 }
    }),
    [search]
  )
  useEffect(()=>{ applyStyleTokens(tokens) }, [tokens])

  /* layout refs */
  const shellRef  = useRef<HTMLDivElement>(null)
  const panelRef  = useRef<HTMLElement>(null)
  const rowRef = useRef<HTMLDivElement>(null)
  const colPhoneRef = useRef<HTMLDivElement>(null)
  const colLaptopRef = useRef<HTMLDivElement>(null)

  /* device scaling state */
  const [pScale, setPScale] = useState(1), [pW, setPW] = useState(PHONE_W), [pH, setPH] = useState(PHONE_H)
  const [lScale, setLScale] = useState(1), [lW, setLW] = useState(LAPTOP_W), [lH, setLH] = useState(LAPTOP_H)

  /* iframe refs + load states (for overlay) */
  const phoneIframeRef = useRef<HTMLIFrameElement>(null)
  const laptopIframeRef = useRef<HTMLIFrameElement>(null)
  const [phoneLoaded, setPhoneLoaded] = useState(false)
  const [laptopLoaded, setLaptopLoaded] = useState(false)
  const autoStartedRef = useRef(false)


  /* project saving state */
  const [projectId, setProjectId] = useState<string | null>(null)
  const [projectName, setProjectName] = useState<string>('Untitled project')
  const autosaveTimer = useRef<number | null>(null)
  const [saveState, setSaveState] = useState<'idle'|'saving'|'saved'>('idle')

  /* ---- CREDIT DEDUCTION HELPER ---- */
  async function deduct(amount: number, reason: string) {
    const res = await authedFetch('/api/credits/deduct', {
      method: 'POST',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({ amount, reason }),
    })
    if (!res.ok) {
      const j = await res.json().catch(()=>({}))
      throw new Error(j.error || 'Not enough credits')
    }
  }

  /* scale previews to fit row while keeping real viewport inside */
  useLayoutEffect(()=>{
    const calc = () => {
      if(!rowRef.current || !colPhoneRef.current || !colLaptopRef.current) return
      const row = rowRef.current
      const rect = row.getBoundingClientRect()
      const availH = Math.max(360, rect.height - TITLE_H - GAP)

      // PHONE scale
      const pw = innerWidth(colPhoneRef.current)
      const p_sH = Math.min(1, Math.max(.4, availH / PHONE_H))
      const p_sW = Math.min(1, Math.max(.4, pw / PHONE_W))
      const ps = Math.min(p_sH, p_sW)
      setPScale(ps); setPW(PHONE_W*ps); setPH(PHONE_H*ps)

      // LAPTOP
      const lw = innerWidth(colLaptopRef.current)
      const l_sH = Math.min(1, Math.max(.25, availH / LAPTOP_H))
      const l_sW = Math.min(1, Math.max(.25, lw / LAPTOP_W))
      const ls = Math.min(l_sH, l_sW)
      setLScale(ls); setLW(LAPTOP_W*ls); setLH(LAPTOP_H*ls)
    }
    const roRow = new ResizeObserver(calc)
    const ro1 = new ResizeObserver(calc)
    const ro2 = new ResizeObserver(calc)
    if(rowRef.current) roRow.observe(rowRef.current)
    if(colPhoneRef.current) ro1.observe(colPhoneRef.current)
    if(colLaptopRef.current) ro2.observe(colLaptopRef.current)
    window.addEventListener('resize', calc); calc()
    return ()=>{ roRow.disconnect(); ro1.disconnect(); ro2.disconnect(); window.removeEventListener('resize', calc) }
  }, [])

  /* make the bottom panel fill the remaining viewport height inside the shell */
  useLayoutEffect(()=>{
    const calcPanelMin = () => {
      if (!shellRef.current || !rowRef.current || !panelRef.current) return

      const shell = shellRef.current
      const header = shell.querySelector('.shell-header') as HTMLElement | null
      const shellStyles = getComputedStyle(shell)
      const padTop = parseFloat(shellStyles.paddingTop||'0')
      const padBot = parseFloat(shellStyles.paddingBottom||'0')
      const headerH = header ? header.getBoundingClientRect().height : 0
      const previewsH = rowRef.current.getBoundingClientRect().height

      const viewportH = window.innerHeight
      const remaining = viewportH - (padTop + padBot + headerH + previewsH + 10)

      panelRef.current!.style.minHeight = Math.max(220, remaining) + 'px'
    }

    const roShell = new ResizeObserver(calcPanelMin)
    const roRow   = new ResizeObserver(calcPanelMin)
    if (shellRef.current) roShell.observe(shellRef.current)
    if (rowRef.current)   roRow.observe(rowRef.current)
    window.addEventListener('resize', calcPanelMin, { passive:true })
    calcPanelMin()

    return () => {
      roShell.disconnect(); roRow.disconnect()
      window.removeEventListener('resize', calcPanelMin)
    }
  }, [])

  /* generation state */
  const [prompt, setPrompt] = useState('')
  const styleFileRef  = useRef<FileList | null>(null)
  const assetFilesRef = useRef<FileList | null>(null)
  const [status, setStatus] = useState<'idle'|'loading'|'done'|'error'>('idle')
  const [error, setError] = useState<string|null>(null)
  const [html, setHtml] = useState('')
  const htmlSrcDoc = useMemo(()=> html || '', [html])

  const sp = useSearchParams()
  useEffect(() => {
    if (autoStartedRef.current) return
    if (sp.get('starter') !== '1') return

    const seed = sp.get('prompt') || ''
    if (!seed) return

    autoStartedRef.current = true          // run only once
    setPrompt(seed)                        // keep prompt visible in the UI
    onGenerate(seed)                       // pass the seed directly (don’t wait for setState)
    // already charged 10 on Home; we do NOT charge again here

    // clean URL so future clicks aren't treated as starter
try {
  const u = new URL(window.location.href)
  u.searchParams.delete('starter')
  u.searchParams.delete('prompt')
  router.replace(u.pathname + (u.searchParams.toString() ? `?${u.searchParams.toString()}` : ''))
} catch {}

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sp])

  /* Load existing project by ?project= */
  useEffect(() => {
    const pid = search.get('project')
    if (!pid) return
    const p = getProject(pid)
    if (p) {
      setProjectId(p.id)
      setProjectName(p.name || 'Untitled project')
      setHtml(p.html || '')
      setPrompt(p.prompt || '')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

async function onGenerate(promptOverride?: string){
  if (status === 'loading') return;   // ← prevent double-calls
  setError(null)
  const usedPrompt = (promptOverride ?? prompt).trim()
  if(!usedPrompt){ setError('Please describe the site.'); return }


    // credit: 100 per generate (skip if starter=1)
    const isStarter = sp.get('starter') === '1'
    if (!isStarter) {
      try { await deduct(100, 'generate') }
      catch (e:any) { setError(e.message || 'Not enough credits'); setStatus('error'); return }
    }

    // reset iframe load states so overlay shows until new content paints
    setPhoneLoaded(false); setLaptopLoaded(false)

    setStatus('loading')
    try{
      const fd = new FormData()
fd.append('prompt', usedPrompt.slice(0,8000))

      // 🔒 include current locked sections (if any)
      const snapDoc = laptopIframeRef.current?.contentDocument
      if (snapDoc) {
        const locks = collectLockedSections(snapDoc)
        if (locks.length) fd.append('locks', JSON.stringify(locks))
      }

      const s = styleFileRef.current
      if (s && s[0]) {
        const png = await normalizeToPng(s[0])
        fd.append('reference', png, 'reference.png')
      }

      const a = assetFilesRef.current
      if (a && a.length) {
        for (let i = 0; i < a.length; i++) {
          const png = await normalizeToPng(a[i])
          fd.append('assets[]', png, a[i].name.replace(/\.[^.]+$/,'') + '.png')
        }
      }

      const r = await fetch('/api/generate', { method: 'POST', body: fd })
      const j = await r.json()
      if(!r.ok) throw new Error(j?.error || 'Generation failed')
      setHtml(j.html || '')
      setStatus('done')
    }catch(e:any){
      setError(e.message || 'Something went wrong')
      setStatus('error')
    }
  }

  // now async because we deduct before creating the blob
  async function onDownload(){
    try { await deduct(50, 'download-html') }
    catch (e:any) { alert(e.message || 'Not enough credits'); return }

    const doc = laptopIframeRef.current?.contentDocument
    if (doc) {
      const cleaned = serializeCleanHTML(doc)
      const blob = new Blob([cleaned], { type: 'text/html' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = 'generated.html'; a.click()
      URL.revokeObjectURL(url)
      return
    }
    // Fallback if iframe not ready
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'generated.html'; a.click()
    URL.revokeObjectURL(url)
  }

  /* ---- Prompt improver ---- */
  const [improving, setImproving] = useState(false)
  const improveStartedAt = useRef<number>(0)

  async function onImprovePrompt(){
    try{
      improveStartedAt.current = performance.now()
      setImproving(true)

      // credit: 5 per improve
      try { await deduct(5, 'improve-prompt') }
      catch (e:any) { alert(e.message || 'Not enough credits'); setImproving(false); return }

      const fd = new FormData()
      fd.append('prompt', (prompt || '').slice(0, 8000))

      // If a style image is present, include it; otherwise ignored server-side
      const s = styleFileRef.current
      if (s && s[0]) {
        const png = await normalizeToPng(s[0])
        fd.append('reference', png, 'reference.png')
      }

      const r = await fetch('/api/improve-prompt', { method: 'POST', body: fd })
      const j = await r.json()
      if(!r.ok) throw new Error(j?.error || 'Failed to improve prompt')

      setPrompt(j.prompt || '')

      // subtle minimum spinner duration
      const elapsed = performance.now() - improveStartedAt.current
      const minMs = 500
      const remaining = Math.max(0, minMs - elapsed)
      setTimeout(() => {
        requestAnimationFrame(() => setImproving(false))
      }, remaining)
    }catch(e:any){
      alert(e.message || 'Failed to improve prompt')
      setImproving(false)
    }
  }

  /* === In-iframe editing bootstrap (LAPTOP ONLY) === */
  function initIframeEditing(iframe: HTMLIFrameElement | null){
    if (!iframe) return
    const doc = iframe.contentDocument
    if (!doc) return
    if ((doc.documentElement as any)._wgInited) return
    ;(doc.documentElement as any)._wgInited = true

    // Inject lightweight editing CSS (once) — ONLY in laptop doc
    if (!doc.getElementById('wg-edit-style')) {
      const style = doc.createElement('style')
      style.id = 'wg-edit-style'
      style.textContent = `
        [contenteditable="true"] { outline: 2px dashed rgba(0,170,170,.65); outline-offset: 2px; }
        [contenteditable="true"]:focus { outline-color: #0aa; }
        [data-edit-img], [data-edit-bg] { outline: 2px dashed rgba(0,170,170,.35); outline-offset: 2px; cursor: pointer; }
        [contenteditable="true"][data-placeholder]:empty::before {
          content: attr(data-placeholder);
          opacity: .5;
        }
        #wg-link-bubble{
          position: fixed;
          z-index: 2147483600;
          min-width: 260px;
          max-width: 94vw;
          background: rgba(0,0,0,.78);
          color: #fff;
          border: 1px solid rgba(255,255,255,.15);
          border-radius: 12px;
          box-shadow: 0 12px 28px rgba(0,0,0,.35);
          padding: 10px;
          display: none;
          backdrop-filter: blur(8px); /* ← fixed */
        }
        #wg-link-drag{ height: 10px; margin: -6px -6px 6px -6px; cursor: move; border-top-left-radius: 12px; border-top-right-radius: 12px; }
        #wg-link-bubble .row{ display:grid; grid-template-columns: 1fr; gap:6px; margin-bottom:8px; }
        #wg-link-bubble label{ font-size:11px; opacity:.85 }
        #wg-link-bubble input{
          width:100%; padding:8px 10px; border-radius:8px; border:1px solid rgba(255,255,255,.18);
          background: rgba(255,255,255,.08); color:#fff;
        }
        #wg-link-bubble .actions{ display:flex; gap:8px; justify-content:flex-end }
        #wg-link-bubble button{
          padding:8px 10px; border-radius:8px; border:1px solid rgba(255,255,255,.18);
          background:#0aa; color:#001; font-weight:800; cursor:pointer;
        }
        #wg-link-bubble button.secondary{ background: rgba(255,255,255,.08); color:#fff }
        #wg-title-btn{
          position: fixed; top: 10px; right: 10px; z-index: 2147483600;
          background: rgba(0,0,0,.78); color:#fff; border:1px solid rgba(255,255,255,.18);
          border-radius:10px; padding:6px 10px; font-size:12px; cursor:pointer; backdrop-filter: blur(8px);
        }
        [data-wg-lock]{ position:relative; outline:2px solid rgba(180,120,80,.55); outline-offset:2px; }
        [data-wg-lock]::after{
          content:"🔒"; position:absolute; top:6px; right:6px; font-size:14px;
          background:rgba(0,0,0,.65); color:#fff; border-radius:6px; padding:2px 6px;
        }
      `.trim()
      doc.head.appendChild(style)
    }

    const makeEditable = (el: HTMLElement) => {
      el.setAttribute('contenteditable','true')
      el.setAttribute('aria-label','Editable text')
      if (!el.textContent || !el.textContent.trim()) el.setAttribute('data-placeholder','Type text…')
    }

    ;(function ensureRuntimeMarkers(){
      doc.querySelectorAll<HTMLElement>('h1,h2,h3,p,button,a').forEach(el=>{
        if(!el.hasAttribute('data-edit')) el.setAttribute('data-edit','')
      })
      doc.querySelectorAll<HTMLElement>('img,picture,figure,svg').forEach(el=>{
        if(!el.hasAttribute('data-edit-img')) el.setAttribute('data-edit-img','')
      })
      doc.querySelectorAll<HTMLElement>('[class*="logo"],[class*="avatar"],[class*="brand"]').forEach(el=>{
        if ((el.querySelector('img,svg'))) el.setAttribute('data-edit-img','')
      })
      const bgCands = Array.from(doc.querySelectorAll<HTMLElement>('[style*="background-image"],[class*="hero"],[class*="banner"],[class*="cover"]'))
      bgCands.forEach(el=>{
        const cs = doc.defaultView?.getComputedStyle(el)
        if (cs && cs.backgroundImage && cs.backgroundImage !== 'none') {
          el.setAttribute('data-edit-bg','')
        }
      })
    })()

    const textSel = 'h1[data-edit],h2[data-edit],h3[data-edit],p[data-edit],button[data-edit],a[data-edit]'
    doc.querySelectorAll<HTMLElement>(textSel).forEach(makeEditable)

    const findRegionRoot = (el: HTMLElement): HTMLElement => {
      return (el.closest('section, article, header, footer, main, aside, nav, div') as HTMLElement) || el
    }
    let lockCounter = doc.querySelectorAll('[data-wg-lock]').length
    doc.addEventListener('click',(e)=>{
      if(!e.altKey) return
      e.preventDefault()
      e.stopPropagation()
      const el = e.target as HTMLElement
      const region = findRegionRoot(el)
      if (region.hasAttribute('data-wg-lock')) {
        region.removeAttribute('data-wg-lock')
      } else {
        lockCounter += 1
        region.setAttribute('data-wg-lock', `L${lockCounter}`)
      }
    }, true)

    doc.addEventListener('click', (ev) => {
      if ((ev as MouseEvent).altKey) return

      const el = ev.target as HTMLElement
      if (el.closest('#wg-link-bubble')) return
      if (el.closest('[contenteditable="true"]')) return

      const inEditableLink = el.closest('a[data-edit]') as HTMLAnchorElement | null
      const mediaNode = el.closest('img,picture,figure,svg,source') as HTMLElement | null
      if (inEditableLink && !mediaNode) return

      let target: HTMLElement | null = null

      const imgCand = el.closest('[data-edit-img]') as HTMLElement | null
      if (imgCand && (mediaNode || el === imgCand)) {
        target = imgCand
      }

      if (!target) {
        const bgCand = el.closest('[data-edit-bg]') as HTMLElement | null
        if (bgCand) {
          const cs = doc.defaultView?.getComputedStyle(bgCand)
          const hasBg = !!cs && cs.backgroundImage && cs.backgroundImage !== 'none'
          if (hasBg) target = bgCand
        }
      }

      if (!target) return

      ev.preventDefault()
      ev.stopPropagation()

      const input = doc.createElement('input')
      input.type = 'file'
      input.accept = 'image/*'
      input.style.display = 'none'
      input.onchange = () => {
        const file = input.files?.[0]
        if (!file) return
        const fr = new FileReader()
        fr.onload = () => {
          const dataUrl = String(fr.result || '')
          applyImageToTarget(target!, dataUrl)
        }
        fr.readAsDataURL(file)
        input.remove()
      }
      doc.body.appendChild(input)
      input.click()
    })

    const bubble = doc.getElementById('wg-link-bubble') || (() => {
      const b = doc.createElement('div')
      b.id = 'wg-link-bubble'
      b.innerHTML = `
        <div id="wg-link-drag"></div>
        <div class="row">
          <label>Text</label>
          <input id="wg-link-text" type="text" />
        </div>
        <div class="row">
          <label>URL</label>
          <input id="wg-link-url" type="url" placeholder="https://..." />
        </div>
        <div class="actions">
          <button class="secondary" id="wg-link-cancel">Close</button>
          <button id="wg-link-save">Save</button>
        </div>
      `
      doc.body.appendChild(b)
      return b
    })()
    const textInput = bubble.querySelector<HTMLInputElement>('#wg-link-text')!
    const urlInput  = bubble.querySelector<HTMLInputElement>('#wg-link-url')!
    const btnSave   = bubble.querySelector<HTMLButtonElement>('#wg-link-save')!
    const btnCancel = bubble.querySelector<HTMLButtonElement>('#wg-link-cancel')!
    const dragBar   = bubble.querySelector<HTMLDivElement>('#wg-link-drag')!

    let currentLink: HTMLAnchorElement | null = null
    let bubblePinned = false

    function clampToViewport(left:number, top:number){
      const vw = doc.defaultView!
      const maxLeft = vw.innerWidth - bubble.clientWidth - 8
      const maxTop  = vw.innerHeight - bubble.clientHeight - 8
      return {
        left: Math.max(8, Math.min(left, maxLeft)),
        top:  Math.max(8, Math.min(top,  maxTop)),
      }
    }

    function showLinkBubble(a: HTMLAnchorElement){
      currentLink = a
      textInput.value = a.textContent || ''
      urlInput.value = a.getAttribute('href') || ''
      bubble.style.display = 'block'
      bubblePinned = false
      positionBubble(a)
      textInput.focus()
    }
    function hideLinkBubble(){
      bubble.style.display = 'none'
      currentLink = null
      bubblePinned = false
    }
    function positionBubble(a: HTMLAnchorElement){
      const rect = a.getBoundingClientRect()
      const top  = Math.max(8, rect.bottom + 6)
      let left   = rect.left
      const cl   = clampToViewport(left, top)
      bubble.style.top  = cl.top + 'px'
      bubble.style.left = cl.left + 'px'
      bubble.style.display = 'block'
    }
    btnSave.onclick = () => {
      if (!currentLink) return
      currentLink.textContent = textInput.value
      currentLink.setAttribute('href', urlInput.value.trim())
      hideLinkBubble()
    }
    btnCancel.onclick = hideLinkBubble

    doc.addEventListener('scroll', () => { if (currentLink && !bubblePinned) positionBubble(currentLink) }, { passive:true })
    doc.defaultView?.addEventListener('resize', () => { if (currentLink && !bubblePinned) positionBubble(currentLink) })

    dragBar.addEventListener('mousedown', (e)=>{
      e.preventDefault()
      e.stopPropagation()
      bubblePinned = true
      const startX = e.clientX
      const startY = e.clientY
      const startLeft = parseFloat(bubble.style.left || '0')
      const startTop  = parseFloat(bubble.style.top  || '0')

      const onMove = (ev: MouseEvent) => {
        const dx = ev.clientX - startX
        const dy = ev.clientY - startY
        const cl = clampToViewport(startLeft + dx, startTop + dy)
        bubble.style.left = cl.left + 'px'
        bubble.style.top  = cl.top  + 'px'
      }
      const onUp = () => {
        doc.removeEventListener('mousemove', onMove)
        doc.removeEventListener('mouseup', onUp)
      }
      doc.addEventListener('mousemove', onMove)
      doc.addEventListener('mouseup', onUp)
    })

    doc.addEventListener('click', (e) => {
      const el = e.target as HTMLElement
      const a = el.closest('a[data-edit]') as HTMLAnchorElement | null
      if (a) {
        e.preventDefault()
        e.stopPropagation()
        makeEditable(a)
        showLinkBubble(a)
      }
    })

    doc.addEventListener('keydown', (e) => {
      const t = e.target as HTMLElement | null
      if (!t) return
      const isLink = t.tagName.toLowerCase() === 'a' && t.hasAttribute('data-edit')
      const combo = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k'
      if (isLink && combo) {
        e.preventDefault()
        showLinkBubble(t as HTMLAnchorElement)
      }
    }, { passive:false })

    if (!doc.getElementById('wg-title-btn')) {
      const btn = doc.createElement('button')
      btn.id = 'wg-title-btn'
      btn.textContent = '✎ Page title'
      btn.onclick = () => {
        const cur = doc.title || ''
        const nxt = (doc.defaultView?.prompt('Page <title> (browser tab title):', cur) ?? cur).trim()
        if (nxt !== null) doc.title = nxt
      }
      doc.body.appendChild(btn)
    }

    function applyImageToTarget(target: Element, dataUrl: string){
      const tag = target.tagName.toLowerCase()

      const figImg = tag === 'figure' ? (target.querySelector('img') as HTMLImageElement | null) : null
      if (figImg) {
        figImg.src = dataUrl
        figImg.srcset = ''
        return
      }

      if (tag === 'img') {
        const im = target as HTMLImageElement
        im.src = dataUrl
        im.srcset = ''
        return
      }

      if (tag === 'picture') {
        const pic = target as HTMLPictureElement
        pic.querySelectorAll('source').forEach(s => { (s as HTMLSourceElement).srcset = dataUrl })
        const im = pic.querySelector('img')
        if (im) { (im as HTMLImageElement).src = dataUrl; (im as HTMLImageElement).srcset = '' }
        return
      }

      if (tag === 'svg') {
        const img = (target.ownerDocument || document).createElement('img')
        img.src = dataUrl
        const w = (target as Element).getAttribute('width')
        const h = (target as Element).getAttribute('height')
        if (w) img.setAttribute('width', w)
        if (h) img.setAttribute('height', h)
        const style = (target as Element).getAttribute('style') || ''
        if (style) img.setAttribute('style', style)
        const parent = target.parentNode
        if (parent) parent.replaceChild(img, target)
        return
      }

      const nestedImg = (target as HTMLElement).querySelector?.('img') as HTMLImageElement | null
      if (nestedImg) {
        nestedImg.src = dataUrl
        nestedImg.srcset = ''
        return
      }

      const el = target as HTMLElement
      if (el && el.style) {
        el.style.backgroundImage = `url('${dataUrl}')`
        if (!el.style.backgroundSize) el.style.backgroundSize = 'cover'
        if (!el.style.backgroundPosition) el.style.backgroundPosition = 'center'
      }
    }
  }

  // Save current edited DOM from laptop iframe back to state (and keep previews in sync)
  function onSaveEdits(){
    const doc = laptopIframeRef.current?.contentDocument
    if (!doc) return
    const cleaned = serializeCleanHTML(doc)
    setHtml(cleaned)
    saveProject(false)
  }

  // Remove editor artifacts before saving/downloading
  function serializeCleanHTML(doc: Document): string {
    const cloned = doc.documentElement.cloneNode(true) as HTMLElement
    const q = (sel: string) => cloned.querySelectorAll(sel)

    q('#wg-edit-style').forEach(n => n.remove())
    q('#wg-link-bubble').forEach(n => n.remove())
    q('#wg-title-btn').forEach(n => n.remove())

    q('[contenteditable]').forEach(n => (n as HTMLElement).removeAttribute('contenteditable'))
    q('[data-placeholder]').forEach(n => (n as HTMLElement).removeAttribute('data-placeholder'))
    q('[data-edit]').forEach(n => (n as HTMLElement).removeAttribute('data-edit'))
    q('[data-edit-img]').forEach(n => (n as HTMLElement).removeAttribute('data-edit-img'))
    q('[data-edit-bg]').forEach(n => (n as HTMLElement).removeAttribute('data-edit-bg'))
    q('[data-wg-lock]').forEach(n => (n as HTMLElement).removeAttribute('data-wg-lock'))

    return '<!doctype html>\n' + cloned.outerHTML
  }

  /* html2canvas injection + thumbnail capture + saving */
  async function ensureHtml2Canvas(iframe: HTMLIFrameElement | null): Promise<any | null> {
    if (!iframe || !iframe.contentWindow || !iframe.contentDocument) return null
    const w = iframe.contentWindow as any
    if (w.html2canvas) return w.html2canvas
    await new Promise<void>((resolve) => {
      const s = iframe.contentDocument!.createElement('script')
      s.src = 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js'
      s.onload = () => resolve()
      s.onerror = () => resolve()
      iframe.contentDocument!.head.appendChild(s)
    })
    return (iframe.contentWindow as any).html2canvas || null
  }

  async function captureThumbnail(): Promise<string | null> {
    const iframe = laptopIframeRef.current
    if (!iframe || !iframe.contentDocument) return null
    try {
      const html2canvas = await ensureHtml2Canvas(iframe)
      if (!html2canvas) return null
      const doc = iframe.contentDocument
      const target = doc.body || doc.documentElement
      const canvas: HTMLCanvasElement = await html2canvas(target, {
        backgroundColor: '#ffffff',
        width: 1280,
        height: 800,
        windowWidth: 1280,
        windowHeight: 800,
        scale: 1,
        useCORS: true,
      })
      const outW = 640, outH = 400
      const out = document.createElement('canvas')
      out.width = outW; out.height = outH
      const ctx = out.getContext('2d')!
      ctx.drawImage(canvas, 0, 0, outW, outH)
      return out.toDataURL('image/png', 0.9)
    } catch {
      return null
    }
  }

  async function saveProject(forceAskName = false) {
    if (saveState === 'saving') return
    setSaveState('saving')

    if (!html.trim() && !prompt.trim()) {
      setSaveState('idle')
      alert('Nothing to save yet. Add a prompt or generate first.')
      return
    }

    try {
      let name = (projectName || '').trim() || 'Untitled project'
      if (!projectId && forceAskName) {
        const input = window.prompt('Project name:', name)
        if (input === null) { setSaveState('idle'); return }
        name = input.trim() || 'Untitled project'
        setProjectName(name)
      }

      const id = projectId || newId()
      const thumbnail = await captureThumbnail() ?? undefined

      const p: Project = {
        id,
        name,
        html,
        prompt,
        thumbnail,
        updatedAt: Date.now(),
      }
      upsertProject(p)

      if (!projectId) {
        setProjectId(id)
        const u = new URL(window.location.href)
        u.searchParams.set('project', id)
        router.replace(u.pathname + '?' + u.searchParams.toString())
      }

      setSaveState('saved')
      setTimeout(()=> setSaveState('idle'), 1200)
    } catch {
      setSaveState('idle')
      alert('Failed to save. Please try again.')
    }
  }

  /* Debounced autosave whenever html/prompt changes */
  useEffect(() => {
    if (autosaveTimer.current) window.clearTimeout(autosaveTimer.current)
    autosaveTimer.current = window.setTimeout(() => {
      if (html.trim()) {
        saveProject(false)
      }
    }, 1200) as unknown as number

    return () => {
      if (autosaveTimer.current) window.clearTimeout(autosaveTimer.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [html, prompt])

  /* Helper to decide overlay visibility */
  const phoneBusy = status === 'loading' || (!phoneLoaded && htmlSrcDoc !== '')
  const laptopBusy = status === 'loading' || (!laptopLoaded && htmlSrcDoc !== '')

  /* ---- UI ---- */
  return (
    <main className="container page webgen">
      <div ref={shellRef} className="shell" style={{ overflow:'visible', maxHeight:'none', padding:18 }}>
        {/* Header */}
        <div
          className="shell-header"
          style={{
            display:'flex',
            alignItems:'center',
            gap:10,
            marginBottom:10,
            position:'relative',
            zIndex: 10,
          }}
        >
          <img src="/logo.svg" alt="Fluencai" width={28} height={28} style={{borderRadius:8}}/>
          <div style={{fontWeight:900,display:'flex',alignItems:'center',gap:8}}>
            <MonitorSmartphone size={18}/> <span>Laptop + Phone preview</span>
          </div>
          <div style={{flex:1}}/>
          <button
            type="button"
            className="btn-outline"
            data-transition
            onClick={()=>saveProject(true)}
            disabled={saveState==='saving'}
            aria-busy={saveState==='saving'}
            style={{
              display:'inline-flex',
              alignItems:'center',
              gap:6,
              background:'#000',
              color:'#fff',
              border:'3px solid #000', /* ← fixed */
              padding:'6px 10px',
              borderRadius:999,
              position:'relative',
              zIndex: 20,
              pointerEvents:'auto',
              opacity: saveState==='saving' ? .85 : 1
            }}
            title="Save project"
          >
            {saveState==='saving' ? <Loader2 size={14} className="spin" /> :
            saveState==='saved'  ? <Check size={14} /> : null}
            {saveState==='saving' ? 'Saving…' :
            saveState==='saved'  ? 'Saved' : 'Save project'}
          </button>
          <Link
            href="/"
            className="btn-outline"
            data-transition
            style={{
              display:'inline-flex',
              alignItems:'center',
              gap:6,
              background:'#000',
              color:'#fff',
              border:'2px solid #000',
              fontSize:14,
              padding:'6px 10px',
              borderRadius:999
            }}
          >
            <ArrowLeft size={14}/> Back
          </Link>
        </div>

        {/* PREVIEWS ROW */}
        <div
          ref={rowRef}
          className="previewsRow"
          style={{
            display:'grid',
            gridTemplateColumns:'1fr 1fr',
            gap:24,
            alignItems:'start',
            minHeight:'56vh',
            marginBottom:10
          }}
        >
          {/* PHONE (READ-ONLY) */}
          <div ref={colPhoneRef} style={{display:'grid', placeItems:'start'}}>
            <div className="previewLabel" style={{ width: pW, margin:'0 auto 6px', textAlign:'center' }}>Phone (375×812)</div>
            <div className="preview-shadow" style={{ width: pW, height: pH, margin:'0 auto', position:'relative' }}>
              <ScaledFrame w={PHONE_W} h={PHONE_H} scale={pScale}>
                <div style={{ position:'relative', width: PHONE_W, height: PHONE_H }}>
                  <div className="phoneBezel" />
                  <div className="phoneNotch" />
                  <div className="phoneScreen">
                    <iframe
                      ref={phoneIframeRef}
                      title="phone"
                      srcDoc={htmlSrcDoc}
                      onLoad={()=>{
                        setPhoneLoaded(true)
                        initPhonePreviewGuards(phoneIframeRef.current)
                      }}
                      style={{ width:'100%', height:'100%', border:0, background:'transparent' }}
                    />
                    {phoneBusy && (
                      <div style={overlayStyle}>
                        <div style={overlayCard}>
                          <Loader2 className="spin" size={18} />
                          <span>Building your site…</span>
                        </div>
                        <div style={progressWrap}><div className="wg-bar" /></div>
                      </div>
                    )}
                  </div>
                </div>
              </ScaledFrame>
            </div>
          </div>

          {/* LAPTOP (EDITABLE) */}
          <div ref={colLaptopRef}>
            <div className="previewLabel" style={{textAlign:'center'}}>Laptop (1280×800)</div>
            <div className="preview-shadow" style={{ width: lW, height: lH, margin:'0 auto', position:'relative' }}>
              <ScaledFrame w={LAPTOP_W} h={LAPTOP_H} scale={lScale}>
                <div className="frame" style={{ width: LAPTOP_W, height: LAPTOP_H }}>
                  <div className="laptopChrome">
                    <div className="dot red" /><div className="dot yellow" /><div className="dot green" />
                    <div className="addr" />
                  </div>
                  <div className="laptopViewport" style={{ height: LAPTOP_H - 36, position:'relative' }}>
                    <iframe
                      ref={laptopIframeRef}
                      title="laptop"
                      srcDoc={htmlSrcDoc}
                      onLoad={()=>{
                        setLaptopLoaded(true)
                        initIframeEditing(laptopIframeRef.current)
                      }}
                      style={{ width:'100%', height:'100%', border:0, background:'transparent' }}
                    />
                    {laptopBusy && (
                      <div style={overlayStyle}>
                        <div style={overlayCard}>
                          <Loader2 className="spin" size={18} />
                          <span>Building your site…</span>
                        </div>
                        <div style={progressWrap}><div className="wg-bar" /></div>
                      </div>
                    )}
                  </div>
                </div>
              </ScaledFrame>
            </div>
          </div>
        </div>

        {/* FORM PANEL */}
        <section
          ref={panelRef}
          className="panel-glass wg-panel"
          style={{ padding:12 }}
        >
          <div className="wg-panelInner" style={{ maxWidth:1200, margin:'0 auto' }}>
            <div className="wg-panelHead" style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:6 }}>
              <div className="wg-title" style={{ fontWeight:900, fontSize:18 }}>Generate Website</div>
              <div className="wg-sub" style={{ opacity:.65, fontSize:12 }}>Fast preview • Alt-click a section to lock/unlock</div>
            </div>

            <div className="wg-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1.2fr', gap:12 }}>
              {/* Left pickers */}
              <div className="wg-leftCol">
                <FilePicker
                  icon={<ImageIcon size={16}/>}
                  label="Style reference (inspiration)"
                  accept="image/*"
                  onChange={(files)=> (styleFileRef.current = files)}
                  helper="Optional. Guides the vibe (colors/layout). Not embedded by default."
                />
                <FilePicker
                  icon={<Images size={16}/>}
                  label="Site assets (logo, hero, products)"
                  accept="image/*"
                  multiple
                  onChange={(files)=> (assetFilesRef.current = files)}
                  helper="Optional. Can be embedded inline as data URLs in the generated HTML."
                />
              </div>

              {/* Right prompt + buttons */}
              <div className="wg-rightCol" style={{ display:'grid', gridTemplateRows:'auto auto', gap:8 }}>
                <div>
                  <div
                    className="wg-label"
                    style={{ fontSize:13, fontWeight:700, color:'var(--ink-soft)', marginBottom:6, display:'flex', alignItems:'center', justifyContent:'space-between' }}
                  >
                    <span>Your prompt</span>
                    <button
                      type="button"
                      onClick={onImprovePrompt}
                      disabled={improving || !prompt.trim()}
                      title="Improve prompt"
                      style={{
                        border:'none',
                        background:'transparent',
                        cursor: improving ? 'wait' : 'pointer',
                        display:'inline-flex',
                        alignItems:'center',
                        gap:6,
                        padding:0,
                        opacity: improving ? .6 : .9
                      }}
                    >
                      {improving ? <Loader2 size={16} className="spin" /> : <Sparkles size={16} />}
                      <span style={{fontSize:12}}>{improving ? 'Improving…' : 'Improve'}</span>
                    </button>
                  </div>
                  <textarea
                    rows={4}
                    className="textarea wg-textarea"
                    style={{ fontSize:13, padding:'.55rem .65rem', resize:'vertical', minHeight:90, opacity: improving ? .7 : 1 }}
                    placeholder={improving ? 'Improving your prompt…' : 'Describe the business, vibe, sections, CTAs…'}
                    value={prompt}
                    onChange={e=>setPrompt(e.target.value)}
                    readOnly={improving}
                    aria-busy={improving}
                  />
                </div>

                <div className="wg-actions" style={{ display:'flex', gap:10, justifyContent:'flex-start', alignItems:'center', flexWrap:'wrap', paddingTop:4 }}>
<button
  className="btn-cta"
  onClick={() => onGenerate()}
  disabled={!prompt.trim() || status==='loading' || improving}  // ← added !prompt.trim()
>
                    {status==='loading'?'Generating…':'Generate'}
                  </button>
                  <button className="btn" onClick={onSaveEdits} disabled={!html || improving}>
                    Save edits
                  </button>
                  <button className="btn" onClick={onDownload} disabled={!html || improving}>
                    <Download size={16}/> Download HTML
                  </button>
                  {status==='error' && <div style={{color:'#c00',fontSize:12,alignSelf:'center'}}>{error}</div>}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* tiny spinner & progress bar helper */}
      <style jsx global>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        .wg-progress { position: relative; height: 3px; width: 120px; overflow: hidden; border-radius: 999px; background: rgba(0,0,0,.08); }
        .wg-progress .wg-bar { position:absolute; top:0; left:-40%; width:40%; height:100%; background: rgba(0,0,0,.35); animation: slide 1.1s ease-in-out infinite; border-radius:999px; }
        @keyframes slide {
          0%   { left: -40%; width: 40%; }
          50%  { left: 20%;  width: 60%; }
          100% { left: 100%; width: 30%; }
        }
      `}</style>
    </main>
  )
}

/* Overlay styles (kept inline for clarity) */
const overlayStyle: React.CSSProperties = {
  position:'absolute',
  inset:0,
  display:'grid',
  placeItems:'center',
  background:'#fff',
  zIndex:5
}
const overlayCard: React.CSSProperties = {
  display:'flex',
  alignItems:'center',
  gap:8,
  fontWeight:800,
  padding:'10px 14px',
  borderRadius:12,
  border:'1px solid rgba(0,0,0,.08)',
  background:'#fff',
  boxShadow:'0 8px 24px rgba(0,0,0,.08)'
}
const progressWrap: React.CSSProperties = {
  position:'absolute',
  bottom:14,
  left:'50%',
  transform:'translateX(-50%)',
  width:140,
  height:3,
  borderRadius:999,
  background:'rgba(0,0,0,.06)',
  overflow:'hidden'
}

/* -------- utils: normalize image to PNG for vision models -------- */
async function normalizeToPng(file: File): Promise<File> {
  const dataUrl = await fileToDataUrl(file); const img = await loadImage(dataUrl)
  const canvas = document.createElement('canvas'); canvas.width = img.width; canvas.height = img.height
  const ctx = canvas.getContext('2d')!; ctx.drawImage(img, 0, 0)
  const pngUrl = canvas.toDataURL('image/png'); const blob = dataURLtoBlob(pngUrl)
  return new File([blob], 'reference.png', { type: 'image/png' })
}
function fileToDataUrl(file: File){return new Promise<string>((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result as string);r.onerror=rej;r.readAsDataURL(file)})}
function loadImage(src: string){return new Promise<HTMLImageElement>((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=rej;i.src=src})}
function dataURLtoBlob(dataurl: string){const arr=dataurl.split(','),mime=arr[0].match(/:(.*?);/)![1];const bstr=atob(arr[1]);let n=bstr.length;const u8=new Uint8Array(n);while(n--)u8[n]=bstr.charCodeAt(n);return new Blob([u8],{type:mime})}

/* Phone preview: never navigate or submit forms */
function initPhonePreviewGuards(iframe: HTMLIFrameElement | null){
  if (!iframe) return
  const doc = iframe.contentDocument
  if (!doc || (doc as any)._wgPhoneGuarded) return
  ;(doc as any)._wgPhoneGuarded = true

  doc.addEventListener('click', (e) => {
    const el = e.target as HTMLElement | null
    const a = el?.closest('a') as HTMLAnchorElement | null
    if (!a) return
    const href = a.getAttribute('href') || ''

    if (!href || href === '#' || href.startsWith('#')) {
      e.preventDefault()
      return
    }

    e.preventDefault()
    try {
      window.open(href, '_blank', 'noopener,noreferrer')
    } catch {}
  }, { capture:true })

  doc.addEventListener('submit', (e) => e.preventDefault(), { capture:true })

  doc.querySelectorAll<HTMLAnchorElement>('a[href]').forEach(a => {
    const href = a.getAttribute('href') || ''
    if (href && !href.startsWith('#') && !href.startsWith('mailto:') && !href.startsWith('tel:')) {
      a.setAttribute('target', '_blank')
      a.setAttribute('rel', 'noopener noreferrer')
    }
  })
}

/* 🔒 Collect locked sections to preserve across generations */
function collectLockedSections(doc: Document){
  const locks: { id:string; label:string; html:string }[] = []
  const nodes = Array.from(doc.querySelectorAll<HTMLElement>('[data-wg-lock]'))
  nodes.forEach((el, i) => {
    const id = el.getAttribute('data-wg-lock') || `L${i+1}`
    const h = el.querySelector('h1,h2,h3')
    const label =
      h?.textContent?.trim() ||
      (el.id ? `#${el.id}` : '') ||
      (el.className ? '.' + String(el.className).split(' ').slice(0,2).join('.') : '') ||
      el.tagName.toLowerCase()
    locks.push({ id, label, html: el.outerHTML })
  })
  return locks
}
export default function WebGenPage() {
  return (
    <Suspense fallback={<main style={{ padding: 40 }}>Loading…</main>}>
      <WebGenPageInner />
    </Suspense>
  )
}
