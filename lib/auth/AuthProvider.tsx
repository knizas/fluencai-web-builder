'use client'
import React, { createContext, useContext, useEffect, useState } from 'react'
import { firebaseAuth } from '@/lib/firebase/client'
import {
  OAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  User
} from 'firebase/auth'
import { authedFetch } from '@/lib/utils/authedFetch'

type AuthCtx = {
  user: User | null
  loading: boolean
  signInWithApple: () => Promise<void>
  signInWithEmail: (email: string, pass: string) => Promise<void>
  signUpWithEmail: (email: string, pass: string) => Promise<void>
  logout: () => Promise<void>
}

const Ctx = createContext<AuthCtx>({
  user: null,
  loading: true,
  signInWithApple: async () => {},
  signInWithEmail: async () => {},
  signUpWithEmail: async () => {},
  logout: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User|null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    return onAuthStateChanged(firebaseAuth(), async (u) => {
      setUser(u)
      setLoading(false)
      if (u) {
        try { await authedFetch('/api/credits/ensure', { method: 'POST' }) } catch {}
      }
    })
  }, [])

  async function signInWithApple() {
    const provider = new OAuthProvider('apple.com')
    provider.addScope('email')
    provider.addScope('name')
    await signInWithPopup(firebaseAuth(), provider)
  }

  async function signInWithEmail(email: string, pass: string) {
    await signInWithEmailAndPassword(firebaseAuth(), email, pass)
  }

  async function signUpWithEmail(email: string, pass: string) {
    await createUserWithEmailAndPassword(firebaseAuth(), email, pass)
  }

  async function logout() { await signOut(firebaseAuth()) }

  return (
    <Ctx.Provider value={{ user, loading, signInWithApple, signInWithEmail, signUpWithEmail, logout }}>
      {children}
    </Ctx.Provider>
  )
}

export const useAuth = () => useContext(Ctx)
