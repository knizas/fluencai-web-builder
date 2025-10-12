'use client'
import { firebaseAuth } from '@/lib/firebase/client'

/**
 * Fetch with Firebase ID token header so server APIs can verify the user.
 * Throws if there is no signed-in user.
 */
export async function authedFetch(input: string | URL | Request, init: RequestInit = {}) {
  const auth = firebaseAuth()
  const user = auth.currentUser

  if (!user) {
    // Wait briefly in case auth has not hydrated yet
    await new Promise(r => setTimeout(r, 0))
  }

  const u = auth.currentUser
  if (!u) throw new Error('Not signed in')

  const token = await u.getIdToken(/* forceRefresh */ false)

  const headers = new Headers(init.headers || {})
  headers.set('Authorization', `Bearer ${token}`)

  return fetch(input, { ...init, headers, credentials: 'include' })
}
