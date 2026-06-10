import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import path from 'path'
import { writeFile, mkdir } from 'fs/promises'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

const MAX_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const EXT_MAP: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'Файл не передан' }, { status: 400 })
    }

    if (!ALLOWED_MIME.includes(file.type)) {
      return NextResponse.json({ error: 'Только JPEG, PNG, WebP или GIF' }, { status: 400 })
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'Файл слишком большой. Максимум 5 МБ' }, { status: 400 })
    }

    const ext = EXT_MAP[file.type] ?? '.jpg'
    const filename = `${session.user.id}${ext}`
    const dir = path.join(process.cwd(), 'public', 'avatars', 'users')
    await mkdir(dir, { recursive: true })

    const bytes = await file.arrayBuffer()
    await writeFile(path.join(dir, filename), Buffer.from(bytes))

    const avatarUrl = `/avatars/users/${filename}`

    await prisma.user.update({
      where: { id: session.user.id },
      data: { avatar: avatarUrl },
    })

    return NextResponse.json({ avatar: avatarUrl })
  } catch (error) {
    console.error('Avatar upload error:', error)
    return NextResponse.json({ error: 'Ошибка загрузки аватара' }, { status: 500 })
  }
}
