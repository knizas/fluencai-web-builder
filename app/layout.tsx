import './globals.css'
import React from 'react'
import { AuthProvider } from '@/lib/auth/AuthProvider'

// import your existing transition component
// If transition.tsx is in `app/`, this path is correct.
// If it's in `components/`, use: import RouteTransitions from '@/components/transition'
import RouteTransitions from './transition'

// Splash wrapper (new)
function Splash({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* simple one-time splash using sessionStorage */}
      <div id="splash-root" />
      <div className="page">{children}</div>
      {/* overlay for click-to-fade */}
      <div id="transition-overlay" aria-hidden="true" />
    </>
  )
}

export const metadata = {
  title: 'Fluencai',
  description: 'Fluencai App',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="icon" href="/favicon.png" type="image/png" />
        <title>Fluencai</title>
      </head>
      <body>
        <AuthProvider>
          <Splash>{children}</Splash>
        </AuthProvider>

        {/* Mount your existing transition handler */}
        <RouteTransitions />
      </body>
    </html>
  )
}
