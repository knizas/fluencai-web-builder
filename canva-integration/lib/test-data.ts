/**
 * Test data for Canva integration
 * Use this to test the API endpoints without needing a real Canva design
 */

import type { CanvaPageExport, CanvaExportRequest } from '../types/canva'

export const mockCanvaPage: CanvaPageExport = {
    index: 0,
    name: 'Hero Section',
    png: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    dimensions: {
        width: 1200,
        height: 800
    },
    structure: [
        // Background shape
        {
            type: 'shape',
            id: 'bg-1',
            shapeType: 'rectangle',
            fill: '#6366F1',
            position: { x: 0, y: 0, width: 1200, height: 800 }
        },
        // Heading
        {
            type: 'text',
            id: 'heading-1',
            content: 'Build Websites in Minutes',
            font: {
                family: 'Inter',
                size: 48,
                weight: 'bold',
                style: 'normal'
            },
            color: '#FFFFFF',
            position: { x: 100, y: 200, width: 1000, height: 60 },
            alignment: 'center'
        },
        //Paragraph
        {
            type: 'text',
            id: 'subheading-1',
            content: 'Turn your Canva designs into professional websites with AI',
            font: {
                family: 'Inter',
                size: 20,
                weight: 'normal',
                style: 'normal'
            },
            color: '#F3F4F6',
            position: { x: 100, y: 280, width: 1000, height: 30 },
            alignment: 'center'
        },
        // CTA Button (text + shape)
        {
            type: 'shape',
            id: 'btn-bg',
            shapeType: 'rectangle',
            fill: '#FFFFFF',
            position: { x: 500, y: 350, width: 200, height: 50 },
            borderRadius: 8
        },
        {
            type: 'text',
            id: 'btn-text',
            content: 'Get Started',
            font: {
                family: 'Inter',
                size: 18,
                weight: 'bold',
                style: 'normal'
            },
            color: '#6366F1',
            position: { x: 550, y: 365, width: 100, height: 20 },
            alignment: 'center'
        }
    ]
}

export const mockCanvaRequest: CanvaExportRequest = {
    pages: [mockCanvaPage],
    designId: 'test-design-123',
    designTitle: 'My Test Website'
}

// Multi-page mockfor testing
export const mockMultiPageRequest: CanvaExportRequest = {
    pages: [
        mockCanvaPage,
        {
            ...mockCanvaPage,
            index: 1,
            name: 'Features Section',
            structure: [
                {
                    type: 'shape',
                    id: 'bg-2',
                    shapeType: 'rectangle',
                    fill: '#FFFFFF',
                    position: { x: 0, y: 0, width: 1200, height: 800 }
                },
                {
                    type: 'text',
                    id: 'features-heading',
                    content: 'Amazing Features',
                    font: {
                        family: 'Inter',
                        size: 36,
                        weight: 'bold',
                        style: 'normal'
                    },
                    color: '#1F2937',
                    position: { x: 100, y: 100, width: 1000, height: 50 },
                    alignment: 'center'
                }
            ]
        }
    ],
    designId: 'test-multipage-456',
    designTitle: 'Multi-Page Test'
}
