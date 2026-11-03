import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendWorkCompletedEmail } from '@/lib/email'
import { sendWorkCompletedNotification } from '@/lib/telegram'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { randomUUID } from 'crypto'
import { resolvePrivateUploadPath } from '@/lib/private-file-storage'

const MAX_FILES_PER_REQUEST = 10
const MAX_SINGLE_FILE_SIZE = 30 * 1024 * 1024
const MAX_TOTAL_SIZE = 50 * 1024 * 1024
const ALLOWED_EXTENSIONS = new Set(['.pdf', '.doc', '.docx', '.txt', '.zip', '.jpg', '.jpeg', '.png', '.rar', '.7z'])

export const maxDuration = 60
export const dynamic = 'force-dynamic'

async function saveFile(file: File, orderId: string): Promise<string> {
  const extension = path.extname(file.name).toLowerCase()
  const baseName = path.basename(file.name, path.extname(file.name))
  const safeName = baseName.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80) || 'file'
  const filename = `${randomUUID()}_${safeName}${extension}`
  const relativePath = `results/${orderId}/${filename}`
  const destination = resolvePrivateUploadPath(relativePath)
  if (!destination) throw new Error('Invalid result file path')

  await mkdir(path.dirname(destination), { recursive: true })
  await writeFile(destination, Buffer.from(await file.arrayBuffer()), { flag: 'wx' })
  return `/api/files/${relativePath}`
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
    const selectedFiles = files.filter((file) => file instanceof File && file.size > 0)

    if (selectedFiles.length === 0) {
      return NextResponse.json({ error: 'Файлы не переданы' }, { status: 400 })
    }
    if (selectedFiles.length > MAX_FILES_PER_REQUEST) {
      return NextResponse.json({ error: `Можно загрузить не более ${MAX_FILES_PER_REQUEST} файлов за раз` }, { status: 400 })
    }
    const invalidFile = selectedFiles.find((file) => !ALLOWED_EXTENSIONS.has(path.extname(file.name).toLowerCase()))
    if (invalidFile) {
      return NextResponse.json({ error: `Тип файла "${invalidFile.name}" не поддерживается` }, { status: 400 })
    }
    if (selectedFiles.some((file) => file.size > MAX_SINGLE_FILE_SIZE) || selectedFiles.reduce((size, file) => size + file.size, 0) > MAX_TOTAL_SIZE) {
      return NextResponse.json({ error: 'Размер файлов превышает допустимый предел' }, { status: 413 })
    }

    // Save files
    const savedPaths: string[] = []
    for (const file of selectedFiles) {
      const filePath = await saveFile(file, params.id)
      savedPaths.push(filePath)
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
