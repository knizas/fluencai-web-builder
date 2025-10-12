'use client'

import React from 'react'
import PersistentLeftBanner, { BANNER_W } from '@/components/PersistentLeftBanner'
import { AuthProvider } from '@/lib/auth/AuthProvider'

export default function ShellLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <PersistentLeftBanner />
      <div style={{ paddingLeft: BANNER_W as any }}>
        {children}
      </div>
    </AuthProvider>
  )
}
