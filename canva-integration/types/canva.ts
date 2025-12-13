/**
 * TypeScript type definitions for Canva Apps SDK integration
 */

// ============= Canva Design Data Types =============

export interface CanvaPosition {
    x: number
    y: number
    width: number
    height: number
}

export interface CanvaTextLayer {
    type: 'text'
    id: string
    content: string
    font: {
        family: string
        size: number
        weight: 'normal' | 'bold' | 'light' | number
        style: 'normal' | 'italic'
    }
    color: string // hex format
    position: CanvaPosition
    alignment: 'left' | 'center' | 'right' | 'justify'
}

export interface CanvaImageLayer {
    type: 'image'
    id: string
    url: string
    position: CanvaPosition
    filters?: {
        brightness?: number
        contrast?: number
        saturation?: number
    }
}

export interface CanvaShapeLayer {
    type: 'shape'
    id: string
    shapeType: 'rectangle' | 'circle' | 'ellipse' | 'polygon'
    fill: string // hex color
    stroke?: {
        color: string
        width: number
    }
    position: CanvaPosition
    borderRadius?: number
}

export type CanvaLayer = CanvaTextLayer | CanvaImageLayer | CanvaShapeLayer

export interface CanvaPage {
    id: string
    name: string
    backgroundColor: string
    width: number
    height: number
    layers: CanvaLayer[]
}

export interface CanvaDesign {
    id: string
    title: string
    pages: CanvaPage[]
}

// ============= Export Data from Canva App =============

export interface CanvaPageExport {
    index: number
    name: string
    png: string // base64 encoded
    structure: CanvaLayer[]
    dimensions: {
        width: number
        height: number
    }
}

export interface CanvaExportRequest {
    pages: CanvaPageExport[]
    designId: string
    designTitle: string
}

// ============= Parsed/Normalized Types for Our System =============

export type ElementType = 'heading' | 'paragraph' | 'button' | 'image' | 'icon' | 'card' | 'container'

export interface ParsedElement {
    type: ElementType
    content?: string
    styles: {
        color?: string
        backgroundColor?: string
        fontSize?: string
        fontFamily?: string
        fontWeight?: string | number
        padding?: string
        margin?: string
        borderRadius?: string
        width?: string
        height?: string
    }
    position: {
        x: number
        y: number
        width: number
        height: number
    }
    children?: ParsedElement[]
}

export interface ParsedSection {
    type: 'header' | 'hero' | 'features' | 'pricing' | 'testimonials' | 'footer' | 'custom'
    pageName: string
    elements: ParsedElement[]
    backgroundColor: string
    minHeight: string
}

export interface DesignTokens {
    'color-primary': string
    'color-secondary': string
    'color-accent': string
    'color-text': string
    'color-background': string
    'font-heading': string
    'font-body': string
    'space-xs': string
    'space-sm': string
    'space-md': string
    'space-lg': string
    'space-xl': string
    'radius-sm': string
    'radius-md': string
    'radius-lg': string
}

export interface AnalyzedDesign {
    sections: ParsedSection[]
    designTokens: DesignTokens
    metadata: {
        totalPages: number
        designId: string
        designTitle: string
    }
}

// ============= API Response Types =============

export interface AnalyzeResponse {
    structure: AnalyzedDesign
}

export interface GenerateResponse {
    html: string
    css: string
    previewUrl: string
    projectId: string
}
