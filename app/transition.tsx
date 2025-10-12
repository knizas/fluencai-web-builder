'use client'
import { useEffect } from 'react'

export default function RouteTransitions() {
  useEffect(() => {
    const overlay = document.getElementById('transition-overlay')
    const clicker = (e: any) => {
      const target = e.target as HTMLElement
      const a = target.closest('a[data-transition]') as HTMLAnchorElement | null
      if (a && overlay) {
        e.preventDefault()
        overlay.classList.add('active')
        setTimeout(() => { window.location.href = a.href }, 200) // 200ms fade
      }
    }
    document.addEventListener('click', clicker)
    return () => document.removeEventListener('click', clicker)
  }, [])
  return null
}
