import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { randomUUID } from 'crypto'
import path from 'path'
import { mkdir, writeFile } from 'fs/promises'
import { authOptions } from '@/lib/auth'
import { COVER_MAX_SIZE, COVER_URL_PREFIX, coverDir, sniffCoverExt } from '@/lib/blog-covers'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 })
  }

  try {
    const formData = await req.formData()
    const file = formData.get('file')
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Файл не передан' }, { status: 400 })
    }
    if (file.size > COVER_MAX_SIZE) {
      return NextResponse.json({ error: 'Файл слишком большой. Максимум 5 МБ' }, { status: 400 })
    }

    const buf = Buffer.from(await file.arrayBuffer())
    const ext = sniffCoverExt(buf)
    if (!ext) {
      return NextResponse.json({ error: 'Только PNG, JPG или WebP' }, { status: 400 })
    }

    const name = `${randomUUID()}.${ext}`
    const dir = coverDir()
    await mkdir(dir, { recursive: true })
    await writeFile(path.join(dir, name), buf)

    return NextResponse.json({ url: `${COVER_URL_PREFIX}${name}` })
  } catch (error) {
    console.error('Cover upload error:', error)
    return NextResponse.json({ error: 'Ошибка загрузки обложки' }, { status: 500 })
  }
}
