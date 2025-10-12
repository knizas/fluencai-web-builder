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

export async function POST(req: NextRequest) {
  try {
    const uid = await verify(req)
    const { amount = 0, reason = 'grant' } = await req.json().catch(() => ({}))
    const n = Number(amount)
    if (!Number.isFinite(n) || n <= 0) return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
    const userRef = db.collection('users').doc(uid)
    const ledgerRef = userRef.collection('credit_ledger').doc()
    const credits = await db.runTransaction(async (tx) => {
      const snap = await tx.get(userRef)
      const cur = Number(snap.exists ? (snap.data()?.credits ?? 0) : 0)
      const next = cur + n
      if (!snap.exists) {
        tx.set(userRef, { credits: next, createdAt: ServerTimestamp(), updatedAt: ServerTimestamp() })
      } else {
        tx.update(userRef, { credits: next, updatedAt: ServerTimestamp() })
      }
      tx.set(ledgerRef, { type: 'credit', amount: n, reason, at: ServerTimestamp(), balance_after: next })
      return next
    })
    return NextResponse.json({ ok: true, credits })
  } catch (e: any) {
    const msg = e?.message || 'Grant failed'
    const code = /Missing Authorization|Decod/.test(msg) ? 401 : 500
    return NextResponse.json({ error: msg }, { status: code })
  }
}
