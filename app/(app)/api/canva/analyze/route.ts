import { NextRequest, NextResponse } from 'next/server'
import type { CanvaExportRequest, AnalyzeResponse, AnalyzedDesign } from '@/canva-integration/types/canva'
import { parseCanvaDesign } from '@/canva-integration/lib/canva-parser'

/**
 * POST /api/canva/analyze
 * 
 * Analyzes Canva design structure and extracts:
 * - Sections (header, hero, features, etc.)
 * - Design tokens (colors, fonts, spacing)
 * - Parsed elements with normalized styles
 * 
 * Input: { pages: CanvaPageExport[], designId: string, designTitle: string }
 * Output: { structure: AnalyzedDesign }
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

        // Parse the Canva design
        const parsed = parseCanvaDesign(body.pages)

        // Add metadata from request
        const structure: AnalyzedDesign = {
            ...parsed,
            metadata: {
                totalPages: body.pages.length,
                designId: body.designId,
                designTitle: body.designTitle
            }
        }

        const response: AnalyzeResponse = { structure }

        return NextResponse.json(response, { status: 200 })

    } catch (error) {
        console.error('[Canva Analyze API] Error:', error)

        return NextResponse.json(
            {
                error: 'Failed to analyze Canva design',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        )
    }
}

// Support OPTIONS for CORS (if Canva App is on different domain)
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
