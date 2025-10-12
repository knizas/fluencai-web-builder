// lib/firebase/admin.ts
import { cert, getApps, initializeApp, type ServiceAccount } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'

if (!getApps().length) {
  const projectId = process.env.FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  let privateKey = process.env.FIREBASE_PRIVATE_KEY

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Missing Firebase Admin ENV: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY')
  }

  // allow "\n" from .env to become real newlines
  privateKey = privateKey.replace(/\\n/g, '\n')

  initializeApp({
    credential: cert({ projectId, clientEmail, privateKey } as ServiceAccount),
  })
}

export const adminAuth = getAuth()
export const db = getFirestore()
export const ServerTimestamp = FieldValue.serverTimestamp
