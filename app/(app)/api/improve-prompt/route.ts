// app/api/improve-prompt/route.ts
import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
const MODEL =
  process.env.OPENAI_MODEL_IMPROVER ||
  process.env.OPENAI_MODEL ||
  'gpt-4o-mini'

const SCAFFOLD = `# Project Brief (fill in)

1) General
- Business / Project Name:
- One-liner (1–2 sentences):
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
- Target devices (iOS/Android/Web):
- Priorities (fast, accessible, HD visuals):
- Integrations (CRM/Analytics/CMS):
- Scalability needs:

7) Extra
- Competitors/inspo:
- Must-haves vs nice-to-haves:
- Don't do:
`

const SYSTEM = `You are a product designer who turns messy or short briefs into a precise, production-ready prompt for a website/app generator.

Rules:
- Output only the improved prompt text (no explanations).
- Keep it structured with clear headings and bullet points.
- Be concise but complete: pages, features, design system, content hints, CTAs, tech notes.
- Prefer mobile-first, accessible, responsive guidelines.
- If the user provided nothing or almost nothing, return a clean scaffold the user can fill.`

// helper: file -> data URL (for multimodal input)
async function fileToDataUrl(file: File): Promise<string> {
  const buf = Buffer.from(await file.arrayBuffer())
  const mime = file.type || 'application/octet-stream'
  return `data:${mime};base64,${buf.toString('base64')}`
}

export async function POST(req: NextRequest) {
  try {
    const ctype = req.headers.get('content-type') || ''
    let prompt = ''
    let referenceDataUrl: string | undefined

    if (ctype.includes('multipart/form-data')) {
      // New path: read prompt + optional image from FormData
      const form = await req.formData()
      prompt = String(form.get('prompt') || '')
      const reference = form.get('reference') as File | null
      if (reference) referenceDataUrl = await fileToDataUrl(reference)
    } else {
      // Back-compat: JSON body
      const body = await req.json().catch(() => ({} as any))
      prompt = String(body?.prompt || '')
      // no image in JSON mode
    }

    const userText =
      (prompt && prompt.trim().length > 10)
        ? `Current brief:\n${prompt.trim()}`
        : `No brief provided. Return a fill-in scaffold only.`

    // Build multimodal user content (text + optional image)
    const userContent: Array<any> = [{ type: 'text', text: userText }]
    if (referenceDataUrl) {
      userContent.push({
        type: 'image_url',
        image_url: { url: referenceDataUrl },
      })
    }

    const completion = await client.chat.completions.create({
      model: MODEL,
      temperature: 0.3,
      max_tokens: 800,
      messages: [
        { role: 'system', content: SYSTEM },
        { role: 'user', content: userContent as any }, // multimodal
      ],
    })

    const text =
      completion.choices?.[0]?.message?.content?.trim() ||
      (prompt?.trim() ? String(prompt) : SCAFFOLD)

    return NextResponse.json({ prompt: text })
  } catch (e: any) {
    console.error('improve-prompt error', e)
    // still return something usable so UI updates
    return NextResponse.json(
      { prompt: SCAFFOLD, error: e?.message },
      { status: 200 },
    )
  }
}
