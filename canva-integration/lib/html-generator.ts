import type { ParsedSection, DesignTokens, ParsedElement } from '../types/canva'

/**
 * HTML Generator - Converts parsed Canva sections into production-ready HTML
 */

// ============= Design Token CSS Generation =============

export function generateDesignTokenCSS(tokens: DesignTokens): string {
    return `
:root {
  /* Colors */
  --color-primary: ${tokens['color-primary']};
  --color-secondary: ${tokens['color-secondary']};
  --color-accent: ${tokens['color-accent']};
  --color-text: ${tokens['color-text']};
  --color-background: ${tokens['color-background']};
  
  /* Typography */
  --font-heading: ${tokens['font-heading']}, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-body: ${tokens['font-body']}, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  
  /* Spacing (Fluid) */
  --space-xs: ${tokens['space-xs']};
  --space-sm: ${tokens['space-sm']};
  --space-md: ${tokens['space-md']};
  --space-lg: ${tokens['space-lg']};
  --space-xl: ${tokens['space-xl']};
  
  /* Border Radius */
  --radius-sm: ${tokens['radius-sm']};
  --radius-md: ${tokens['radius-md']};
  --radius-lg: ${tokens['radius-lg']};
}
`.trim()
}

// ============= Global Styles =============

export function generateGlobalStyles(): string {
    return `
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
}

body {
  font-family: var(--font-body);
  color: var(--color-text);
  background-color: var(--color-background);
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

section {
  padding: var(--space-xl) var(--space-lg);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

@media (max-width: 767px) {
  section {
    padding: var(--space-lg) var(--space-md);
    min-height: auto;
  }
}

/* Typography */
h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-heading);
  line-height: 1.2;
  margin-bottom: var(--space-sm);
}

h1 { font-size: clamp(2rem, 5vw, 3.5rem); }
h2 { font-size: clamp(1.5rem, 4vw, 2.5rem); }
h3 { font-size: clamp(1.25rem, 3vw, 2rem); }

p {
  margin-bottom: var(--space-sm);
  font-size: clamp(1rem, 2vw, 1.125rem);
}

/* Links & Buttons */
a {
  color: var(--color-primary);
  text-decoration: none;
  transition: all 0.3s ease;
}

a:hover {
  color: var(--color-secondary);
}

button, .btn {
  padding: var(--space-sm) var(--space-md);
  background-color: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-block;
  min-height: 44px; /* Touch target */
}

button:hover, .btn:hover {
  background-color: var(--color-secondary);
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
}

/* Images */
img {
  max-width: 100%;
  height: auto;
  display: block;
}

/* Cards */
.card {
  background: white;
  border-radius: var(--radius-lg);
  padding: var(--space-md);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
}

/* Utility Classes */
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--space-md);
}

.flex {
  display: flex;
  gap: var(--space-md);
}

.grid {
  display: grid;
  gap: var(--space-md);
}

@media (min-width: 768px) {
  .grid { grid-template-columns: repeat(2, 1fr); }
}

@media (min-width: 1024px) {
  .grid { grid-template-columns: repeat(3, 1fr); }
}
`.trim()
}

// ============= Element to HTML Conversion =============

function elementToHTML(element: ParsedElement, index: number): string {
    const { type, content, styles } = element

    // Build inline styles
    const styleStr = Object.entries(styles)
        .filter(([_, value]) => value !== undefined)
        .map(([key, value]) => `${camelToKebab(key)}: ${value}`)
        .join('; ')

    const styleAttr = styleStr ? ` style="${styleStr}"` : ''

    switch (type) {
        case 'heading':
            const level = styles.fontSize && parseInt(styles.fontSize) >= 32 ? 'h1' : 'h2'
            return `<${level}${styleAttr}>${content || ''}</${level}>`

        case 'paragraph':
            return `<p${styleAttr}>${content || ''}</p>`

        case 'button':
            return `<button class="btn"${styleAttr}>${content || 'Click Me'}</button>`

        case 'image':
            return `<img src="${content || 'https://placehold.co/600x400/EEE/31343C?text=Image'}" alt="Image ${index}"${styleAttr} />`

        case 'icon':
            // Use Lucide icons
            const iconName = 'star' // Default, would need logic to map
            return `<i data-lucide="${iconName}"${styleAttr}></i>`

        case 'card':
            return `<div class="card"${styleAttr}>${element.children?.map((child, i) => elementToHTML(child, i)).join('\n') || ''}</div>`

        default:
            return `<div${styleAttr}>${content || ''}</div>`
    }
}

// ============= Section to HTML Conversion =============

function sectionToHTML(section: ParsedSection, index: number): string {
    const sectionId = section.type === 'custom' ? `section-${index}` : section.type
    const bgStyle = section.backgroundColor !== '#FFFFFF' ? ` style="background-color: ${section.backgroundColor}"` : ''

    const elementsHTML = section.elements.map((el, i) => elementToHTML(el, i)).join('\n    ')

    return `
<section id="${sectionId}"${bgStyle}>
  <div class="container">
    ${elementsHTML}
  </div>
</section>
`.trim()
}

// ============= Complete HTML Generation =============

export function generateCompleteHTML(sections: ParsedSection[], tokens: DesignTokens, title: string = 'My Website'): string {
    const sectionsHTML = sections.map((section, i) => sectionToHTML(section, i)).join('\n\n')

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="Professional website built with Fluencai">
  <title>${title}</title>
  
  <!-- Lucide Icons -->
  <script src="https://unpkg.com/lucide@latest"></script>
  
  <style>
    ${generateDesignTokenCSS(tokens)}
    
    ${generateGlobalStyles()}
  </style>
</head>
<body>
  ${sectionsHTML}
  
  <script>
    // Initialize Lucide icons
    lucide.createIcons();
    
    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
          target.scrollIntoView({ behavior: 'smooth' });
        }
      });
    });
  </script>
</body>
</html>`
}

// ============= Utility Functions =============

function camelToKebab(str: string): string {
    return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
}
