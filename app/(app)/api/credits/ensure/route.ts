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

const STARTER_CREDITS = 10

export async function POST(req: NextRequest) {
  try {
    const uid = await verify(req)
    const userRef = db.collection('users').doc(uid)
    const ledgerRef = userRef.collection('credit_ledger').doc()
    const result = await db.runTransaction(async tx => {
      const snap = await tx.get(userRef)
      if (!snap.exists) {
        const credits = STARTER_CREDITS
        tx.set(userRef, { credits, createdAt: ServerTimestamp(), updatedAt: ServerTimestamp() })
        if (credits > 0) {
          tx.set(ledgerRef, { type: 'credit', amount: credits, reason: 'starter', at: ServerTimestamp(), balance_after: credits })
        }
        return credits
      } else {
        const cur = Number(snap.data()?.credits ?? 0)
        return cur
      }
    })
    return NextResponse.json({ ok: true, credits: result })
  } catch (e: any) {
    const msg = e?.message || 'Ensure failed'
    const code = /Missing Authorization|Decod/.test(msg) ? 401 : 500
    return NextResponse.json({ error: msg }, { status: code })
  }
}
