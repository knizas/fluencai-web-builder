import { NextRequest, NextResponse } from 'next/server'
import { adminAuth, db, ServerTimestamp } from '@/lib/firebase/admin'

export const runtime = 'nodejs'

async function verify(req: NextRequest) {
  const authz = req.headers.get('authorization') || ''
  const token = authz.startsWith('Bearer ') ? authz.slice(7) : ''
  if (!token) throw new Error('Missing Authorization header')
  const decoded = await adminAuth.verifyIdToken(token)
  return decoded.uid
}

export async function GET(req: NextRequest) {
  try {
    const uid = await verify(req)
    const ref = db.collection('users').doc(uid)
    const snap = await ref.get()
    if (!snap.exists) {
      await ref.set(
        { credits: 0, createdAt: ServerTimestamp(), updatedAt: ServerTimestamp() },
        { merge: true }
      )
      return NextResponse.json({ credits: 0 })
    }
    const data = snap.data() || {}
    return NextResponse.json({ credits: Number(data.credits || 0) })
  } catch (e: any) {
    const msg = e?.message || 'Auth failed'
    const code = /Missing Authorization|Decod/.test(msg) ? 401 : 500
    return NextResponse.json({ error: msg }, { status: code })
  }
}
