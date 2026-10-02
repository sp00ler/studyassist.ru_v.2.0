import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import path from 'path'
import { COVER_MIME, COVER_NAME_RE, coverDir } from '@/lib/blog-covers'

export async function GET(_req: NextRequest, { params }: { params: { name: string } }) {
  // Strict name pattern: no path segments can reach outside the covers dir.
  if (!COVER_NAME_RE.test(params.name)) {
    return new NextResponse('Not found', { status: 404 })
  }

  try {
    const data = await readFile(path.join(coverDir(), params.name))
    const ext = params.name.split('.').pop() as string
    return new NextResponse(data, {
      headers: {
        'Content-Type': COVER_MIME[ext],
        // Names are random UUIDs and never reused, so the file can be cached forever.
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch {
    return new NextResponse('Not found', { status: 404 })
  }
}
