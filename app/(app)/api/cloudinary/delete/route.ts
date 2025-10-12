import { NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function POST(req: Request) {
  try {
    const { publicId } = await req.json() as { publicId?: string }
    if (!publicId) {
      return NextResponse.json({ error: 'Missing publicId' }, { status: 400 })
    }

    // If your library includes videos / raw files, you can use resource_type: 'auto'
    const result = await cloudinary.uploader.destroy(publicId, {
      invalidate: true,
      resource_type: 'image',
    })

    // result.result can be 'ok', 'not found', 'error'
    if (result.result !== 'ok' && result.result !== 'not found') {
      return NextResponse.json({ error: 'Cloudinary delete failed', result }, { status: 500 })
    }

    return NextResponse.json({ ok: true, result })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 })
  }
}
