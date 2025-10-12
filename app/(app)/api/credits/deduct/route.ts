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
    const body = await req.json().catch(() => ({}))
    const amount = Number(body?.amount)
    const reason = String(body?.reason || 'unspecified')
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
    }
    const userRef = db.collection('users').doc(uid)
    const ledgerRef = userRef.collection('credit_ledger').doc()
    const result = await db.runTransaction(async (tx) => {
      const snap = await tx.get(userRef)
      const cur = Number(snap.exists ? (snap.data()?.credits ?? 0) : 0)
      if (!snap.exists) {
        tx.set(userRef, { credits: 0, createdAt: ServerTimestamp(), updatedAt: ServerTimestamp() }, { merge: true })
      }
      if (cur < amount) throw new Error('Not enough credits')
      const next = cur - amount
      tx.update(userRef, { credits: next, updatedAt: ServerTimestamp() })
      tx.set(ledgerRef, {
        type: 'debit',
        amount,
        reason,
        at: ServerTimestamp(),
        balance_after: next,
      })
      return next
    })
    return NextResponse.json({ ok: true, credits: result })
  } catch (e: any) {
    const msg = e?.message || 'Deduction failed'
    const code = msg === 'Not enough credits' ? 402 : /Missing Authorization|Decod/.test(msg) ? 401 : 500
    return NextResponse.json({ error: msg }, { status: code })
  }
}
