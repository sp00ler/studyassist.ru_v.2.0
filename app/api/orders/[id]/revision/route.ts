import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendRevisionRequestEmail } from '@/lib/email'
import { sendRevisionRequestNotification } from '@/lib/telegram'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import os from 'os'

async function saveFile(file: File, orderId: string): Promise<string> {
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const timestamp = Date.now()
  const filename = `${timestamp}_${safeName}`

  const publicDir = path.join(process.cwd(), 'public', 'uploads', 'revisions', orderId)
  try {
    await mkdir(publicDir, { recursive: true })
    await writeFile(path.join(publicDir, filename), buffer)
    return `/uploads/revisions/${orderId}/${filename}`
  } catch {
    const tmpDir = path.join(os.tmpdir(), 'studyassist-revisions', orderId)
    await mkdir(tmpDir, { recursive: true })
    await writeFile(path.join(tmpDir, filename), buffer)
    return `/uploads/revisions/${orderId}/${filename}`
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: { user: true },
    })

    if (!order) {
      return NextResponse.json({ error: 'Заявка не найдена' }, { status: 404 })
    }

    // Only the order owner (or admin) can request revision
    if (!session.user.isAdmin && order.userId !== session.user.id) {
      return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 })
    }

    // Only allowed when work is completed
    if (!session.user.isAdmin && order.status !== 'completed') {
      return NextResponse.json({ error: 'Доработка доступна только для завершённых заявок' }, { status: 400 })
    }

    const formData = await req.formData()
    const note = (formData.get('note') as string) || ''
    const files = formData.getAll('files') as File[]

    if (!note.trim() && (!files || files.every(f => !(f instanceof File) || f.size === 0))) {
      return NextResponse.json({ error: 'Укажите текст замечаний или прикрепите файлы' }, { status: 400 })
    }

    // Save revision files
    const savedPaths: string[] = []
    for (const file of files) {
      if (file instanceof File && file.size > 0) {
        const filePath = await saveFile(file, params.id)
        savedPaths.push(filePath)
      }
    }

    // Update order
    const updatedOrder = await prisma.order.update({
      where: { id: params.id },
      data: {
        status: 'revision',
        revisionNote: note.trim() || null,
        revisionFiles: savedPaths.length > 0 ? JSON.stringify(savedPaths) : null,
      },
    })

    // Notify admins
    const clientName = order.user?.name || order.clientName || 'Клиент'
    const clientEmail = order.user?.email || order.clientEmail || ''

    Promise.allSettled([
      sendRevisionRequestEmail(order.id, clientName, clientEmail, note, savedPaths.length),
      sendRevisionRequestNotification(order.id, clientName, clientEmail, note),
    ]).catch(console.error)

    return NextResponse.json({ order: updatedOrder })
  } catch (error) {
    console.error('Revision request error:', error)
    return NextResponse.json({ error: 'Ошибка отправки запроса на доработку' }, { status: 500 })
  }
}
