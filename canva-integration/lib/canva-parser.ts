import type {
    CanvaLayer,
    CanvaTextLayer,
    CanvaImageLayer,
    CanvaShapeLayer,
    CanvaPageExport,
    ParsedElement,
    ParsedSection,
    DesignTokens,
    ElementType
} from '../types/canva'

/**
 * Canva Parser - Converts Canva structured data into our internal format
 */

// ============= Type Guards =============

function isTextLayer(layer: CanvaLayer): layer is CanvaTextLayer {
    return layer.type === 'text'
}

function isImageLayer(layer: CanvaLayer): layer is CanvaImageLayer {
    return layer.type === 'image'
}

function isShapeLayer(layer: CanvaLayer): layer is CanvaShapeLayer {
    return layer.type === 'shape'
}

// ============= Element Type Detection =============

function detectElementType(layer: CanvaLayer): ElementType {
    if (isTextLayer(layer)) {
        const fontSize = layer.font.size
        const weight = layer.font.weight
        const isBold = weight === 'bold' || (typeof weight === 'number' && weight >= 600)

        // Detect heading vs paragraph vs button
        if (fontSize >= 24 && isBold) return 'heading'
        if (fontSize <= 16) return 'paragraph'

        // If text is short and has a background shape nearby, it might be a button
        if (layer.content.length < 30 && isBold) return 'button'

        return 'paragraph'
    }

    if (isImageLayer(layer)) {
        // Detect if small square image = icon, else regular image
        const { width, height } = layer.position
        if (width <= 100 && height <= 100 && Math.abs(width - height) < 20) {
            return 'icon'
        }
        return 'image'
    }

    if (isShapeLayer(layer)) {
        // Shapes are usually containers or cards
        return 'card'
    }

    return 'container'
}

// ============= Section Type Detection =============

export function detectSectionType(pageName: string, layers: CanvaLayer[]): ParsedSection['type'] {
    const name = pageName.toLowerCase()

    if (name.includes('header') || name.includes('nav')) return 'header'
    if (name.includes('hero') || name.includes('banner')) return 'hero'
    if (name.includes('feature') || name.includes('service')) return 'features'
    if (name.includes('pricing') || name.includes('plan')) return 'pricing'
    if (name.includes('testimonial') || name.includes('review')) return 'testimonials'
    if (name.includes('footer') || name.includes('contact')) return 'footer'

    // Heuristic: If first layer is large bold text + image, likely hero
    if (layers.length > 0) {
        const firstText = layers.find(isTextLayer)
        if (firstText && firstText.font.size >= 32) return 'hero'
    }

    return 'custom'
}

// ============= Design Token Extraction =============

export function extractDesignTokens(pages: CanvaPageExport[]): DesignTokens {
    const allColors: string[] = []
    const allFonts: string[] = []

    pages.forEach(page => {
        page.structure.forEach(layer => {
            if (isTextLayer(layer)) {
                allColors.push(layer.color)
                allFonts.push(layer.font.family)
            }
            if (isShapeLayer(layer)) {
                allColors.push(layer.fill)
            }
        })
    })

    // Extract most common colors
    const colorFrequency = countFrequency(allColors)
    const sortedColors = Object.entries(colorFrequency)
        .sort((a, b) => b[1] - a[1])
        .map(([color]) => color)

    const [primary = '#6366F1', secondary = '#8B5CF6', accent = '#EC4899'] = sortedColors

    // Extract most common fonts
    const fontFrequency = countFrequency(allFonts)
    const sortedFonts = Object.entries(fontFrequency)
        .sort((a, b) => b[1] - a[1])
        .map(([font]) => font)

    const [headingFont = 'Inter', bodyFont = 'Inter'] = sortedFonts

    // Get background from first page
    const backgroundColor = pages[0]?.structure.find(isShapeLayer)?.fill || '#FFFFFF'

    return {
        'color-primary': primary,
        'color-secondary': secondary,
        'color-accent': accent,
        'color-text': '#1F2937',
        'color-background': backgroundColor,
        'font-heading': headingFont,
        'font-body': bodyFont,
        'space-xs': 'clamp(0.5rem, 1vw, 0.75rem)',
        'space-sm': 'clamp(0.75rem, 2vw, 1rem)',
        'space-md': 'clamp(1rem, 3vw, 1.5rem)',
        'space-lg': 'clamp(1.5rem, 4vw, 2.5rem)',
        'space-xl': 'clamp(2rem, 6vw, 4rem)',
        'radius-sm': '0.25rem',
        'radius-md': '0.5rem',
        'radius-lg': '1rem'
    }
}

// ============= Layer to Element Conversion =============

export function parseLayer(layer: CanvaLayer): ParsedElement {
    const elementType = detectElementType(layer)

    const baseElement: ParsedElement = {
        type: elementType,
        position: layer.position,
        styles: {}
    }

    if (isTextLayer(layer)) {
        baseElement.content = layer.content
        baseElement.styles = {
            color: layer.color,
            fontSize: `${layer.font.size}px`,
            fontFamily: layer.font.family,
            fontWeight: layer.font.weight,
        }
    }

    if (isImageLayer(layer)) {
        baseElement.content = layer.url
        baseElement.styles = {
            width: `${layer.position.width}px`,
            height: `${layer.position.height}px`,
        }
    }

    if (isShapeLayer(layer)) {
        baseElement.styles = {
            backgroundColor: layer.fill,
            borderRadius: layer.borderRadius ? `${layer.borderRadius}px` : undefined,
            width: `${layer.position.width}px`,
            height: `${layer.position.height}px`,
        }

        if (layer.stroke) {
            baseElement.styles.color = layer.stroke.color
        }
    }

    return baseElement
}

// ============= Page to Section Conversion =============

export function parseCanvaPage(page: CanvaPageExport): ParsedSection {
    const sectionType = detectSectionType(page.name, page.structure)

    // Sort layers by vertical position (top to bottom)
    const sortedLayers = [...page.structure].sort((a, b) => a.position.y - b.position.y)

    const elements = sortedLayers.map(parseLayer)

    // Detect background color
    const backgroundShape = page.structure.find(
        layer => isShapeLayer(layer) && layer.position.width >= page.dimensions.width * 0.8
    ) as CanvaShapeLayer | undefined

    const backgroundColor = backgroundShape?.fill || '#FFFFFF'

    return {
        type: sectionType,
        pageName: page.name,
        elements,
        backgroundColor,
        minHeight: 'min-h-screen'
    }
}

// ============= Utility Functions =============

function countFrequency<T extends string>(items: T[]): Record<T, number> {
    return items.reduce((acc, item) => {
        acc[item] = (acc[item] || 0) + 1
        return acc
    }, {} as Record<T, number>)
}

// ============= Complete Design Parsing =============

export function parseCanvaDesign(pages: CanvaPageExport[]) {
    const sections = pages.map(parseCanvaPage)
    const designTokens = extractDesignTokens(pages)

    return {
        sections,
        designTokens,
        metadata: {
            totalPages: pages.length,
            designId: '',
            designTitle: ''
        }
    }
}
