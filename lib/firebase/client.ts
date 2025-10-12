'use client'

import { initializeApp, getApps, FirebaseApp } from 'firebase/app'
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage' // 👈 add this

let app: FirebaseApp | undefined
let _auth: ReturnType<typeof getAuth> | undefined

export function getFirebaseApp() {
  if (!getApps().length) {
    const cfg = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
    }
    app = initializeApp(cfg)
  } else {
    app = getApps()[0]!
  }
  return app!
}

export const firebaseAuth = () => {
  if (!_auth) {
    _auth = getAuth(getFirebaseApp())
    // ensure session persists across reloads
    setPersistence(_auth, browserLocalPersistence).catch(() => {})
  }
  return _auth
}

export const firestore = () => getFirestore(getFirebaseApp())

// 👇 add this line so your /media page can use Firebase Storage
export const storage = () => getStorage(getFirebaseApp())
