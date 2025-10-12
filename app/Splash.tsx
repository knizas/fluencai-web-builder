'use client'
import { useEffect, useState } from 'react'

export default function Splash({ children }: { children: React.ReactNode }) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const seen = sessionStorage.getItem('fluencai_seen_splash')
    if (seen) return
    setShow(true)
    const t = setTimeout(() => {
      sessionStorage.setItem('fluencai_seen_splash', '1')
      setShow(false)
    }, 1200) // ~1.2s splash
    return () => clearTimeout(t)
  }, [])

  return (
    <>
      {show && (
        <div className="splash" aria-hidden="true">
          <div className="splash-card">
            <img src="/logo.svg" alt="" width={40} height={40} />
            <div className="splash-wordmark">Fluencai</div>
          </div>
        </div>
      )}
      <div className={show ? 'app-hidden' : 'app-visible'}>
        {children}
      </div>
    </>
  )
}
