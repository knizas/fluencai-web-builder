'use client'

import React from 'react'
import { AuthProvider } from '@/lib/auth/AuthProvider'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  // No sidebar here intentionally
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  )
}
