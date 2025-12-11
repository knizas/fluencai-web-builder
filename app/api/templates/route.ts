import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const template = searchParams.get('template')

    if (!template) {
        return NextResponse.json({ error: 'Template slug required' }, { status: 400 })
    }

    // Map slugs to filenames
    const templateMap: Record<string, string> = {
        'fitness': 'fitness-app.html',
        'ecommerce': 'e-commerce-app.html',
        'events': 'booking-app.html',
        'food': 'delivery-app.html',
        'social': 'social-app.html',
        'learning': 'education-app.html',
        'finance': 'finance-app.html',
        'health': 'wellness-app.html',
        'travel': 'travel-app.html',
        'music': 'music-app.html',
        'realestate': 'real-estate-app.html',
        'marketplace': 'marketplace-app.html',
        'streaming': 'streaming-app.html',
        'gaming': 'gaming-app.html',
        'productivity': 'productivity-app.html',
        'notes': 'notes-app.html',
        'weather': 'weather-app.html'
    }

    const filename = templateMap[template]

    if (!filename) {
        return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    try {
        const templatePath = join(process.cwd(), 'templates', filename)
        const html = await readFile(templatePath, 'utf-8')

        return NextResponse.json({ html })
    } catch (error) {
        console.error('Error reading template:', error)
        return NextResponse.json({ error: 'Failed to load template' }, { status: 500 })
    }
}
