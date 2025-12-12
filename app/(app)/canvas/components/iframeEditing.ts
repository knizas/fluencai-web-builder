// Inject editing capabilities into iframe
export function injectEditing(iframeDoc: Document) {
    if (!iframeDoc || iframeDoc.querySelector('#wg-injected-editing')) return

    const marker = iframeDoc.createElement('div')
    marker.id = 'wg-injected-editing'
    marker.style.display = 'none'
    iframeDoc.body.appendChild(marker)

    // Add styles
    const style = iframeDoc.createElement('style')
    style.textContent = `
    [data-edit]{ cursor:text; transition: outline .15s; }
    [data-edit]:hover{ outline:1px dashed rgba(124,108,240,.4); outline-offset:2px; }
    [data-edit]:focus{ outline:2px solid rgba(124,108,240,.7); outline-offset:2px; }
    [data-edit-img], [data-edit-bg]{ cursor:pointer; position:relative; transition: outline .15s; }
    [data-edit-img]:hover, [data-edit-bg]:hover{
      outline:2px dashed rgba(100,200,255,.6); outline-offset:2px;
    }
    [data-wg-lock]{ position:relative; outline:2px solid rgba(180,120,80,.55); outline-offset:2px; }
    [data-wg-lock]::after{
      content:"🔒 Locked"; position:absolute; top:6px; right:6px; font-size:11px;
      background:rgba(0,0,0,.75); color:#fff; border-radius:6px; padding:4px 8px;
      pointer-events: none; font-weight:700; letter-spacing:0.3px;
    }
    #wg-help-tip{
      position:fixed; bottom:20px; right:20px; z-index:999999;
      background:rgba(124,108,240,0.95); color:#fff; padding:12px 16px;
      border-radius:12px; font-size:13px; font-weight:700;
      box-shadow:0 8px 24px rgba(0,0,0,0.2);
      backdrop-filter:blur(10px);
    }
  `.trim()
    iframeDoc.head.appendChild(style)

    // Mark editable elements
    iframeDoc.querySelectorAll<HTMLElement>('h1,h2,h3,p,button,a').forEach(el => {
        if (!el.hasAttribute('data-edit')) el.setAttribute('data-edit', '')
    })
    iframeDoc.querySelectorAll<HTMLElement>('img,picture,figure,svg').forEach(el => {
        if (!el.hasAttribute('data-edit-img')) el.setAttribute('data-edit-img', '')
    })

    // Make text editable
    const makeEditable = (el: HTMLElement) => {
        el.setAttribute('contenteditable', 'true')
        if (!el.textContent || !el.textContent.trim()) {
            el.setAttribute('data-placeholder', 'Type text…')
        }
    }

    iframeDoc.querySelectorAll<HTMLElement>('h1[data-edit],h2[data-edit],h3[data-edit],p[data-edit],button[data-edit],a[data-edit]')
        .forEach(makeEditable)

    // Lock/unlock with Alt+click
    const findRegionRoot = (el: HTMLElement): HTMLElement => {
        return (el.closest('section, article, header, footer, main, aside, nav, div') as HTMLElement) || el
    }

    let lockCounter = iframeDoc.querySelectorAll('[data-wg-lock]').length

    iframeDoc.addEventListener('click', (e) => {
        if (!e.altKey) return
        e.preventDefault()
        e.stopPropagation()
        const el = e.target as HTMLElement
        const region = findRegionRoot(el)
        if (region.hasAttribute('data-wg-lock')) {
            region.removeAttribute('data-wg-lock')
        } else {
            lockCounter += 1
            region.setAttribute('data-wg-lock', `L${lockCounter}`)
        }
    }, true)

    // Image editing
    iframeDoc.addEventListener('click', (ev) => {
        if ((ev as MouseEvent).altKey) return
        const el = ev.target as HTMLElement
        if (el.closest('[contenteditable="true"]')) return

        const imgCand = el.closest('[data-edit-img]') as HTMLElement | null
        if (!imgCand) return

        ev.preventDefault()
        ev.stopPropagation()

        const input = iframeDoc.createElement('input')
        input.type = 'file'
        input.accept = 'image/*'
        input.onchange = () => {
            const file = input.files?.[0]
            if (!file) return
            const reader = new FileReader()
            reader.onload = (e) => {
                const dataUrl = e.target?.result as string

                // Fix: Check if the candidate itself is an image
                if (imgCand.tagName === 'IMG') {
                    (imgCand as HTMLImageElement).src = dataUrl
                } else {
                    const img = imgCand.querySelector('img')
                    if (img) {
                        img.src = dataUrl
                    } else {
                        imgCand.style.backgroundImage = `url(${dataUrl})`
                        imgCand.style.backgroundSize = 'cover'
                        imgCand.style.backgroundPosition = 'center'
                    }
                }
            }
            reader.readAsDataURL(file)
        }
        input.click()
    })

    // Add permanent help tip with icon
    const helpTip = iframeDoc.createElement('div')
    helpTip.id = 'wg-help-tip'
    helpTip.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;margin-right:6px">
      <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"></path>
      <path d="M9 18h6"></path>
      <path d="M10 22h4"></path>
    </svg>
    <strong>Alt+Click</strong> to lock/unlock sections
  `
    iframeDoc.body.appendChild(helpTip)
}

// Collect locked sections for preservation
export function collectLockedSections(iframeDoc: Document) {
    const locks: { id: string; label: string; html: string }[] = []
    const nodes = Array.from(iframeDoc.querySelectorAll<HTMLElement>('[data-wg-lock]'))
    nodes.forEach((el, i) => {
        const id = el.getAttribute('data-wg-lock') || `L${i + 1}`
        const label = el.querySelector('h1,h2,h3')?.textContent?.slice(0, 40) ||
            el.textContent?.slice(0, 40) ||
            `Section ${i + 1}`
        locks.push({ id, label, html: el.outerHTML })
    })
    return locks
}
