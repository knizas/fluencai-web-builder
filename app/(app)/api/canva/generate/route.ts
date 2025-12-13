import { NextRequest, NextResponse } from 'next/server'
import type { CanvaExportRequest, GenerateResponse } from '@/canva-integration/types/canva'
import { parseCanvaDesign } from '@/canva-integration/lib/canva-parser'
import { generateCompleteHTML } from '@/canva-integration/lib/html-generator'

/**
 * POST /api/canva/generate
 * 
 * Generates a complete multi-page website from Canva design
 * 
 * Input: { pages: CanvaPageExport[], designId: string, designTitle: string }
 * Output: { html: string, css: string, previewUrl: string, projectId: string }
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json() as CanvaExportRequest

        // Validate input
        if (!body.pages || !Array.isArray(body.pages) || body.pages.length === 0) {
            return NextResponse.json(
                { error: 'Invalid request: pages array is required' },
                { status: 400 }
            )
        }

        console.log(`[Canva Generate API] Processing ${body.pages.length} pages for design: ${body.designTitle}`)

        // Parse Canva design into sections and design tokens
        const { sections, designTokens } = parseCanvaDesign(body.pages)

        // Generate complete HTML
        const html = generateCompleteHTML(sections, designTokens, body.designTitle)

        // Extract just the CSS for separate download if needed
        const cssMatch = html.match(/<style>([\s\S]*?)<\/style>/)
        const css = cssMatch ? cssMatch[1] : ''

        // TODO: Save to database and generate preview URL
        // For now, return the HTML directly
        const projectId = `canva-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        const previewUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/canva/preview/${projectId}`

        const response: GenerateResponse = {
            html,
            css,
            previewUrl,
            projectId
        }

        console.log(`[Canva Generate API] Success! Generated ${html.length} chars of HTML`)

        return NextResponse.json(response, { status: 200 })

    } catch (error) {
        console.error('[Canva Generate API] Error:', error)

        return NextResponse.json(
            {
                error: 'Failed to generate website from Canva design',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        )
    }
}

// Support OPTIONS for CORS
export async function OPTIONS(req: NextRequest) {
    return new NextResponse(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
    })
}
