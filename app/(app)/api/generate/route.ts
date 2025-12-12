import OpenAI from 'openai'
import type { NextRequest } from 'next/server'

export const runtime = 'nodejs'  // ok in dev & prod

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

/** ---- helpers ---- **/

async function fileToDataUrl(file: File): Promise<string> {
  const buf = Buffer.from(await file.arrayBuffer())
  const mime = file.type || 'application/octet-stream'
  const b64 = buf.toString('base64')
  return `data:${mime};base64,${b64}`
}

/** Replace ``` fences, trim, remove <script>, inject baseline CSS, mobile drawer, inline assets, and markers. */
function postProcessHTML(raw: string, assetsMap: Record<string, string>): string {
  let html = (raw || '')
    .replace(/^[\s\S]*?```(?:html)?/i, '')     // remove starting fences
    .replace(/```[\s\S]*$/i, '')               // remove trailing fences
    .trim()

  // Remove scripts entirely for safety in the preview
  html = html.replace(/<script\b[\s\S]*?<\/script>/gi, '')

  // Ensure we have a minimal document shell
  if (!/<!doctype html>/i.test(html)) {
    html = `<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1"/>\n<title>Generated Site</title>\n</head>\n<body>\n${html}\n</body>\n</html>`
  } else {
    // Make sure viewport exists
    if (!/name=["']viewport["']/i.test(html)) {
      html = html.replace(/<\/head>/i, `<meta name="viewport" content="width=device-width, initial-scale=1"/>\n</head>`)
    }
  }

  // Inject/augment baseline CSS (gallery-safe + centered media)
  html = ensureResponsive(html)

  // Inject mobile drawer (safe pointer-events so phone preview scrolls)
  html = ensureMobileDrawer(html)

  // Inline uploaded assets (logo.png, hero.jpg, etc.)
  html = inlineAssets(html, assetsMap)

  // Auto-inject data-edit markers for common elements (text, links, images)
  html = autoAddDataEditMarkers(html)

  return html
}

/** Strong mobile-first hardening injected into <head> (gallery-safe + centered media). */
function ensureResponsive(html: string): string {
  const baseline = `
/* --- Baseline responsive reset + hardening (gallery-safe + centered media) --- */
*, *::before, *::after { box-sizing: border-box; }
html, body { height: 100%; margin: 0; }
body {
  font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, Arial;
  -webkit-overflow-scrolling: touch;   /* smooth scroll on phone preview */
  overflow-y: auto;                    /* allow vertical scroll */
}

/* Media scale and center by default */
img, picture img, figure img, svg, video {
  display: block;
  max-width: 100%;
  height: auto;
  object-position: center !important;
}

/* Figures/pictures play nice */
picture, figure { display:block; }
figure > img { width:100%; height:auto; display:block; }

/* Background images: centered and covered (no tiling) */
[style*="background-image"] {
  background-position: center !important;
  background-size: cover;
  background-repeat: no-repeat;
}

/* Prevent sideways scroll, but do NOT clamp widths globally (lets cards/layout work) */
html, body { overflow-x: hidden; }

/* Containers */
.container, .wrap, main, header, section, footer { width:100%; }
.container, .wrap, main { max-width:1200px; margin:0 auto; padding:16px; }

/* Type that scales */
h1 { font-size: clamp(24px, 6vw, 40px); margin: 0 0 8px; }
h2 { font-size: clamp(20px, 4.5vw, 28px); margin: 0 0 6px; }
p  { font-size: clamp(14px, 3vw, 16px); line-height: 1.5; }

/* Generic grid helpers (opt-in) */
.grid, [class*="grid"], [class*="row"], [style*="grid-template-columns"] { display:grid; gap:14px; }
.grid.cols-2 { grid-template-columns: 1fr; }
.grid.cols-3 { grid-template-columns: 1fr; }
@media (min-width:640px){ .grid.cols-2 { grid-template-columns: 1fr 1fr; } }
@media (min-width:960px){ .grid.cols-3 { grid-template-columns: 1fr 1fr 1fr; } }

/* Phone: stack multi-col patterns */
@media (max-width:420px){
  [style*="grid-template-columns"] { grid-template-columns: 1fr !important; }
  [style*="display:flex"] { flex-wrap: wrap !important; }
  [class*="product"], [class*="card"], [class*="item"] { width:100% !important; }
  section, header, footer, .container, .wrap, main { padding-left:14px; padding-right:14px; }
}

/* Buttons + cards */
.btn { display:inline-block; padding:10px 16px; border-radius:999px; font-weight:800; text-decoration:none; cursor:pointer }
.card { border:1px solid #eee; border-radius:12px; padding:16px; background:#fff }

/* Thin, pretty scrollbars */
html { scrollbar-width: thin; scrollbar-color: rgba(0,0,0,.35) transparent; }
::-webkit-scrollbar { width: 8px; height: 8px; }
::-webkit-scrollbar-thumb { background: rgba(0,0,0,.35); border-radius: 999px; }
::-webkit-scrollbar-track { background: transparent; }

/* ============================
   SMART, NON-DISTORTING GALLERIES
   ============================ */

/* Common gallery class names from the model */
.image-grid, .images-grid, .gallery, .grid-images {
  display:grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap:16px;
  align-items:start;
}

/* Heuristic: any container that has many direct image children becomes a gallery */
section:has(> img + img), div:has(> img + img),
section:has(> picture + picture), div:has(> picture + picture),
section:has(> figure + figure),  div:has(> figure + figure) {
  display:grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap:16px;
}

/* Inside these galleries, images never distort; centered by default */
.image-grid img, .images-grid img, .gallery img, .grid-images img,
section:has(> img + img) > img,
div:has(> img + img) > img,
section:has(> picture + picture) picture > img,
div:has(> picture + picture) picture > img,
section:has(> figure + figure) figure > img,
div:has(> figure + figure) figure > img {
  width:100%;
  height:auto;
  object-fit:contain;
  object-position:center !important;
  border-radius:12px;
}

/* If you (or the model) explicitly want square thumbs, opt-in: */
.thumb img, [data-thumb] img { aspect-ratio:1/1; object-fit:cover; object-position:center; }
`.trim()

  if (/<style[^>]*id=["']fl-baseline["'][^>]*>[\s\S]*?<\/style>/i.test(html)) {
    return html.replace(
      /<style[^>]*id=["']fl-baseline["'][^>]*>[\s\S]*?<\/style>/i,
      `<style id="fl-baseline">${baseline}</style>`
    )
  }
  return html.replace(/<\/head>/i, `<style id="fl-baseline">${baseline}</style>\n</head>`)
}

/* ---------- Drawer (safe pointer-events so previews scroll) ---------- */

function ensureMobileDrawer(html: string): string {
  if (!/<body/i.test(html)) return html
  if (/\bid=["']fl-layer["']/.test(html)) return html

  const brandColor = detectBrandColor(html)
  const fg = contrastOn(brandColor)
  const brand = extractBrand(html)
  const menu = extractMenuItems(html)

  const linksMarkup = menu.map(li => `<a href="${li.href}">${escapeHtml(li.text)}</a>`).join('\n      ')

  const css = `
/* --- Auto-injected phone drawer --- */
:root{
  --fl-brand:${brandColor};
  --fl-drawer-bg:${brandColor};
  --fl-drawer-fg:${fg};
  --fl-drawer-scrim: rgba(0,0,0,.32);
}
/* The layer covers the screen, but must NOT eat events */
#fl-layer{ position:fixed; inset:0; pointer-events:none; z-index:2147483000; }
#fl-mobile-drawer-wrap{ display:none; }

/* Only visible UI gets pointer events */
#fl-mobile-drawer, #fl-scrim, #fl-drawer { pointer-events:auto; }

#fl-mobile-drawer{
  position:sticky; top:0; z-index:1; display:flex; align-items:center; gap:10px;
  padding:12px 14px; background: rgba(255,255,255,.92); backdrop-filter: blur(8px);
  border-bottom: 1px solid rgba(0,0,0,.06);
}
#fl-mobile-drawer .brand{font-weight:800;color:#111;text-decoration:none}
#fl-mobile-drawer .hamb{ margin-left:auto;width:40px;height:40px;border:0;border-radius:10px;background:#111;display:grid;place-items:center;cursor:pointer }
#fl-mobile-drawer .hamb span{display:block;width:18px;height:2px;background:#fff;margin:2px 0;border-radius:2px}
#fl-navchk{ display:none }
#fl-scrim{ position:fixed; inset:0; background:var(--fl-drawer-scrim); opacity:0; pointer-events:none; transition:opacity .25s ease; z-index:2147483001; }
#fl-drawer{
  position:fixed; top:0; bottom:0; right:0; width:min(82vw,320px);
  transform:translateX(100%); background:var(--fl-drawer-bg); color:var(--fl-drawer-fg);
  box-shadow:-12px 0 32px rgba(0,0,0,.28); padding:16px 14px; display:flex; flex-direction:column; gap:6px; transition:transform .28s ease;
  z-index:2147483002;
}
#fl-drawer a{ color:var(--fl-drawer-fg); text-decoration:none; border-radius:10px; padding:12px 10px; display:block }
#fl-drawer a:hover{ background: rgba(255,255,255,.18) }
#fl-drawer .close { margin-left:auto; font-size:28px; cursor:pointer; padding:4px 8px; border-radius:8px; color:var(--fl-drawer-fg); }
#fl-drawer .close:hover { background: rgba(255,255,255,.18); }
/* open states */
#fl-navchk:checked ~ #fl-scrim{ opacity:1; pointer-events:auto }
#fl-navchk:checked ~ #fl-drawer{ transform: translateX(0) }

@media (min-width:768px){ #fl-mobile-drawer-wrap{ display:none !important } }
@media (max-width:767px){
  header nav, nav:not(#fl-mobile-drawer){ display:none !important }
  #fl-mobile-drawer-wrap{ display:block }
}
`.trim()

  const layerMarkup = `
<div id="fl-layer" aria-hidden="false">
  <div id="fl-mobile-drawer-wrap">
    <nav id="fl-mobile-drawer" aria-label="Mobile">
      <a class="brand" href="#">${escapeHtml(brand)}</a>
      <label class="hamb" for="fl-navchk" aria-controls="fl-drawer" aria-expanded="false" aria-label="Open menu">
        <span></span><span></span><span></span>
      </label>
    </nav>

    <input type="checkbox" id="fl-navchk" />
    <div id="fl-scrim" aria-hidden="true"></div>
    <aside id="fl-drawer" role="dialog" aria-modal="true" aria-label="Menu">
      <label for="fl-navchk" class="close" aria-label="Close menu">&times;</label>
      ${linksMarkup}
    </aside>
  </div>
</div>`.trim()

  let out = html.replace(/<body[^>]*>/i, (m) => `${m}\n${layerMarkup}\n`)
  out = out.replace(/<\/head>/i, `<style id="fl-mobile-drawer-css">${css}</style>\n</head>`)
  return out
}

/* ---- brand + menu extraction ---- */
function extractBrand(html: string): string {
  const meta = html.match(/<meta[^>]*name=["']application-name["'][^>]*content=["']([^"']+)["'][^>]*>/i)
  if (meta?.[1]) return meta[1].trim()
  const title = html.match(/<title[^>]*>([^<]+)<\/title>/i)
  if (title?.[1]) return title[1].trim()
  const brand =
    html.match(/<a[^>]*class=["'][^"']*(brand|logo)[^"']*["'][^>]*>([\s\S]*?)<\/a>/i) ||
    html.match(/<div[^>]*class=["'][^"']*(brand|logo)[^"']*["'][^>]*>([\s\S]*?)<\/div>/i)
  if ((brand as any)?.[2]) return stripTags((brand as any)[2]).trim()
  return 'Brand'
}

function extractMenuItems(html: string): Array<{ text: string; href: string }> {
  const navMatch = html.match(/<nav[^>]*>[\s\S]*?<\/nav>/i)
  if (navMatch) {
    const links = [...navMatch[0].matchAll(/<a[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)]
      .map(m => ({ href: m[1], text: stripTags(m[2]).trim() }))
      .filter(x => x.text && x.href)
    if (links.length) return dedupeByText(links)
  }
  const sections = [...html.matchAll(/<(h1|h2|h3)\b[^>]*id=["']([^"']+)["'][^>]*>([\s\S]*?)<\/\1>/gi)]
    .map(m => ({ href: `#${m[2]}`, text: stripTags(m[3]).trim() }))
    .filter(x => x.text)
  if (sections.length) return dedupeByText(sections)
  return [
    { text: 'Home', href: '#home' },
    { text: 'About', href: '#about' },
    { text: 'Contact', href: '#contact' },
  ]
}

/* ---- color heuristics ---- */
function detectBrandColor(html: string): string {
  const meta = html.match(/<meta[^>]*name=["']theme-color["'][^>]*content=["']([^"']+)["'][^>]*>/i)
  if (meta?.[1]) return normalizeColor(meta[1])
  const varMatch = html.match(/--(?:brand|primary)[^:]*:\s*([^;]+);/i)
  if (varMatch?.[1]) return normalizeColor(varMatch[1])
  const hex = html.match(/#([0-9a-fA-F]{3,8})\b/)
  if (hex?.[0]) return normalizeColor(hex[0])
  return '#111111'
}
function normalizeColor(s: string): string { return s.trim().replace(/["']/g, '') }
function contrastOn(bg: string): string {
  const m = bg.replace('#', '').slice(0, 6)
  const r = parseInt(m.slice(0, 2) || '00', 16)
  const g = parseInt(m.slice(2, 4) || '00', 16)
  const b = parseInt(m.slice(4, 6) || '00', 16)
  const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
  return lum > 0.5 ? '#111' : '#fff'
}

/* ---- misc utils ---- */
function stripTags(s: string) { return s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim() }
function dedupeByText(items: Array<{ text: string; href: string }>) {
  const seen = new Set<string>()
  return items.filter(x => { const k = x.text.toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true })
}
function escapeHtml(s: string) {
  return s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;')
}

/** Replace src/href pointing to uploaded filenames with data URLs. */
function inlineAssets(html: string, assets: Record<string, string>): string {
  let out = html
  for (const [filename, dataurl] of Object.entries(assets)) {
    const esc = filename.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const re = new RegExp(`(src|href)=["'](?:\\.\\/|\\/)?${esc}["']`, 'gi')
    out = out.replace(re, (_m, attr) => `${attr}="${dataurl}"`)
  }
  return out
}

/** Build a simple manifest list text for the model (file names only). */
function buildAssetsManifest(assets: Record<string, string>): string {
  if (!assets || !Object.keys(assets).length) return 'No assets provided.'
  const lines = Object.keys(assets).map(k => `- ${k}`)
  return `Assets you may use (reference by filename in <img src="...">):\n${lines.join('\n')}\n\nUse these filenames exactly; do not invent new ones.`
}

/** ---- inject data-edit markers for common elements ---- */
function autoAddDataEditMarkers(html: string): string {
  try {
    const tags = ['h1', 'h2', 'h3', 'p', 'img', 'button', 'a'] as const
    const counters: Record<string, number> = { h1: 0, h2: 0, h3: 0, p: 0, img: 0, button: 0, a: 0 }
    for (const tag of tags) {
      // Add data-edit if missing; keep existing attributes
      const re = new RegExp(`<${tag}\\b(?![^>]*\\bdata-edit=)([^>]*?)(\\/?)>`, 'gi')
      html = html.replace(re, (_m, attrs: string, selfClose: string) => {
        counters[tag]++
        return `<${tag} data-edit="${tag}-${counters[tag]}"${attrs}${selfClose}>`
      })
    }
    return html
  } catch {
    return html
  }
}

/** ---- route ---- **/
export async function POST(req: NextRequest) {
  try {
    const form = await req.formData()
    const prompt = (form.get('prompt') as string || '').slice(0, 8000)
    const reference = form.get('reference') as File | null

    // 🔒 Locks from client
    const locksJson = form.get('locks') as string | null
    const locks: { id: string; label: string; html: string }[] = locksJson ? JSON.parse(locksJson) : []

    // Assets (multiple)
    const assetsFiles = form.getAll('assets[]') as File[]
    const assetsMap: Record<string, string> = {}
    for (const f of assetsFiles) {
      const name =
        (f.name || 'asset.png')
          .replace(/[^\w.\-]/g, '_')
          .replace(/\.(jpeg|jpg)$/i, '.jpg')
      assetsMap[name] = await fileToDataUrl(f)
    }

    // Convert reference to data URL for vision if present
    let referenceDataUrl: string | undefined
    if (reference) {
      referenceDataUrl = await fileToDataUrl(reference)
    }

    // System & user messages as Responses API content lists
    const lockIntro = locks.length
      ? `\n\nLOCKS:\n${locks.map(l => `- id:${l.id} • label:${l.label}`).join('\n')}\n\nREQUIREMENT: Your output MUST include the exact placeholder tokens, in order: ${locks.map(l => `<!--WG_LOCK:${l.id}-->`).join(' ')}.\nInsert each token where its section belongs based on the label. Do NOT modify these tokens.`
      : ''

    const systemText =
      `You generate ONE complete responsive HTML document (no JS required).

Hard rules:
- Always return a full HTML document (<!doctype html> ...).
- DO NOT wrap your answer in markdown fences.
- Respect 100% of the user's requested business type, style, layout, theme, colors, fonts, icons, and vibe.
- Mobile-first: it must look great at 375px wide. Avoid fixed widths. Stack gracefully on smaller screens.
- Keep it semantic and accessible (use <header>, <main>, <section>, <footer>, .container, .grid).
- No external CDNs, frameworks, or <script> tags. Inline all CSS in <style>.
- If assets are provided, reference them exactly by filename in <img src="..."> (they will be inlined later).
- Ensure forms and buttons are large/tappable on mobile.
- Do not invent extra sections beyond what the user described.${lockIntro}
`

    const instructionsText =
      `Brief:
${prompt || '(no brief provided)'}

${buildAssetsManifest(assetsMap)}

Output: HTML only. Include basic brandable CSS in a <style> block in <head>. Make sure content stacks gracefully on mobile and forms/buttons are large enough to tap.
${locks.length ? `\nInsert these placeholders verbatim:\n${locks.map(l => `  <!--WG_LOCK:${l.id}-->  (${l.label})`).join('\n')}\n` : ''}`

    // Build user content: prompt + images
    const userContent: Array<any> = [{ type: 'input_text', text: instructionsText }]
    if (referenceDataUrl) userContent.push({ type: 'input_image', image_url: referenceDataUrl })
    for (const dataurl of Object.values(assetsMap)) userContent.push({ type: 'input_image', image_url: dataurl })

    // Call Responses API with gpt-5-nano
    const response = await client.responses.create({
      model: 'gpt-5-nano',
      input: [
        { role: 'system', content: [{ type: 'input_text', text: systemText }] },
        { role: 'user', content: userContent },
      ],
    })

    const raw = response.output_text || ''
    let html = postProcessHTML(raw, assetsMap)

    // 🔒 Replace lock placeholders with original HTML (fallback: append to end of body)
    if (locks.length) {
      for (const l of locks) {
        const token = `<!--WG_LOCK:${l.id}-->`
        if (html.includes(token)) {
          html = html.replaceAll(token, l.html)
        } else {
          html = html.replace(/<\/body>/i, `${l.html}\n</body>`)
        }
      }
    }

    return new Response(JSON.stringify({ html }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })
  } catch (e: any) {
    console.error('Generate error', e)
    const msg = e?.message || 'Generation failed'
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    })
  }
}
