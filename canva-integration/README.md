# Canva Integration

This folder contains the isolated Canva Apps SDK integration for Fluencai Website Builder.

## 🏗️ Architecture

```
canva-integration/
├── app/api/canva/         # API endpoints
│   ├── analyze/           # Extracts structure from Canva design
│   └── generate/          # Generates HTML from parsed design
├── lib/                   # Utilities
│   ├── canva-parser.ts    # Converts Canva JSON → Our format
│   └── html-generator.ts  # Generates production HTML
└── types/                 # TypeScript definitions
    └── canva.ts           # Canva API types
```

## 🚀 API Endpoints

### POST `/api/canva/analyze`
Analyzes Canva design structure and extracts design tokens.

**Input:**
```typescript
{
  pages: CanvaPageExport[],
  designId: string,
  designTitle: string
}
```

**Output:**
```typescript
{
  structure: {
    sections: ParsedSection[],
    designTokens: DesignTokens,
    metadata: { totalPages, designId, designTitle }
  }
}
```

### POST `/api/canva/generate`
Generates complete multi-page website from Canva design.

**Input:**
```typescript
{
  pages: CanvaPageExport[],
  designId: string,
  designTitle: string
}
```

**Output:**
```typescript
{
  html: string,
  css: string,
  previewUrl: string,
  projectId: string
}
```

## 🎨 Features

✅ **Multi-page support** - Converts Canva pages → HTML sections  
✅ **Design token extraction** - Auto-extracts colors, fonts, spacing  
✅ **Responsive design** - Mobile-first, fluid typography  
✅ **Lucide icons** - Professional icons (no emojis)  
✅ **Animated hovers** - Smooth transitions on all interactive elements  

## 🧪 Testing

```bash
# Test the analyze endpoint
curl -X POST http://localhost:3000/api/canva/analyze \
  -H "Content-Type: application/json" \
  -d '{"pages": [...], "designId": "test", "designTitle": "Test Design"}'

# Test the generate endpoint
curl -X POST http://localhost:3000/api/canva/generate \
  -H "Content-Type: application/json" \
  -d '{"pages": [...], "designId": "test", "designTitle": "Test Design"}'
```

## 📝 Next Steps

- [ ] Build the Canva App frontend (SDK integration)
- [ ] Add database persistence for generated sites
- [ ] Create preview page (`/canva/preview/[id]`)
- [ ] Add authentication for API endpoints
- [ ] Implement rate limiting

## ⚠️ Important

This integration is **isolated** from the main app to prevent breaking changes. It uses the same design principles but can evolve independently.
