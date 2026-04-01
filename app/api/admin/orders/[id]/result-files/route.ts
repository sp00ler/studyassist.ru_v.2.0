import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendWorkCompletedEmail } from '@/lib/email'
import { sendWorkCompletedNotification } from '@/lib/telegram'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import os from 'os'

export const maxDuration = 60
export const dynamic = 'force-dynamic'

async function saveFile(file: File, orderId: string): Promise<string> {
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const timestamp = Date.now()
  const filename = `${timestamp}_${safeName}`

  // Try RESULT_DIR env, then public/uploads/results, fallback to /tmp
  if (process.env.RESULT_DIR) {
    const dir = path.join(process.env.RESULT_DIR, orderId)
    await mkdir(dir, { recursive: true })
    await writeFile(path.join(dir, filename), buffer)
    return `/api/files/results/${orderId}/${filename}`
  }

  const publicDir = path.join(process.cwd(), 'public', 'uploads', 'results', orderId)
  try {
    await mkdir(publicDir, { recursive: true })
    await writeFile(path.join(publicDir, filename), buffer)
    return `/api/files/results/${orderId}/${filename}`
  } catch {
    const tmpDir = path.join(os.tmpdir(), 'studyassist-results', orderId)
    await mkdir(tmpDir, { recursive: true })
    await writeFile(path.join(tmpDir, filename), buffer)
    return `/api/files/results/${orderId}/${filename}`
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || !session.user.isAdmin) {
      return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 })
    }

    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: { user: true },
    })

    if (!order) {
      return NextResponse.json({ error: 'Заявка не найдена' }, { status: 404 })
    }

    const formData = await req.formData()
    const files = formData.getAll('files') as File[]

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'Файлы не переданы' }, { status: 400 })
    }

    // Save files
    const savedPaths: string[] = []
    for (const file of files) {
      if (file instanceof File && file.size > 0) {
        const filePath = await saveFile(file, params.id)
        savedPaths.push(filePath)
      }
    }

    if (savedPaths.length === 0) {
      return NextResponse.json({ error: 'Не удалось сохранить файлы' }, { status: 500 })
    }

    // Merge with existing result files if any
    const existingFiles: string[] = order.resultFiles ? JSON.parse(order.resultFiles) : []
    const allResultFiles = [...existingFiles, ...savedPaths]

    // Update order: save result files + set status to 'completed'
    const updatedOrder = await prisma.order.update({
      where: { id: params.id },
      data: {
        resultFiles: JSON.stringify(allResultFiles),
        status: 'completed',
      },
    })

    // Notify client
    const clientEmail = order.user?.email || order.clientEmail
    const clientTelegramId = order.user?.telegramId

    if (clientEmail) {
      Promise.allSettled([
        sendWorkCompletedEmail(clientEmail, order.id, allResultFiles.length),
        clientTelegramId
          ? sendWorkCompletedNotification(clientTelegramId, order.id, allResultFiles.length)
          : Promise.resolve(),
      ]).catch(console.error)
    }

    return NextResponse.json({ order: updatedOrder, files: savedPaths })
  } catch (error) {
    console.error('Result files upload error:', error)
    return NextResponse.json({ error: 'Ошибка загрузки файлов' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || !session.user.isAdmin) {
      return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 })
    }

    const { fileIndex } = await req.json()

    const order = await prisma.order.findUnique({ where: { id: params.id } })
    if (!order) return NextResponse.json({ error: 'Заявка не найдена' }, { status: 404 })

    const files: string[] = order.resultFiles ? JSON.parse(order.resultFiles) : []
    if (fileIndex >= 0 && fileIndex < files.length) {
      files.splice(fileIndex, 1)
    }

    const updatedOrder = await prisma.order.update({
      where: { id: params.id },
      data: { resultFiles: JSON.stringify(files) },
    })

    return NextResponse.json({ order: updatedOrder })
  } catch (error) {
    console.error('Delete result file error:', error)
    return NextResponse.json({ error: 'Ошибка удаления файла' }, { status: 500 })
  }
}
