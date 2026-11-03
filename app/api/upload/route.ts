import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getPrivateUploadRoot } from '@/lib/private-file-storage'
import path from 'path'
import os from 'os'
import { writeFile, mkdir, readFile, rm, readdir, stat } from 'fs/promises'
import { getIP, rateLimit, rateLimitResponse } from '@/lib/rate-limit'

const VALID_UPLOAD_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export const maxDuration = 60
export const dynamic = 'force-dynamic'

const MAX_TOTAL_SIZE = 50 * 1024 * 1024 // 50MB на все файлы в одном запросе
const MAX_SINGLE_FILE_SIZE = 30 * 1024 * 1024 // 30MB на 1 файл
const CHUNK_TTL_MS = 60 * 60 * 1000

const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.txt', '.zip', '.jpg', '.jpeg', '.png', '.rar', '.7z']
function matchesFileSignature(extension: string, data: Buffer): boolean {
  if (extension === '.pdf') return data.subarray(0, 5).toString('ascii') === '%PDF-'
  if (extension === '.doc') return data.subarray(0, 8).equals(Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]))
  if (extension === '.docx' || extension === '.zip') return data.subarray(0, 2).toString('ascii') === 'PK'
  if (extension === '.jpg' || extension === '.jpeg') return data.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))
  if (extension === '.png') return data.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  if (extension === '.rar') return data.subarray(0, 7).toString('ascii') === 'Rar!\x1a\x07'
  if (extension === '.7z') return data.subarray(0, 6).equals(Buffer.from([0x37, 0x7a, 0xbc, 0xaf, 0x27, 0x1c]))
  if (extension === '.txt') return !data.includes(0)
  return false
}

function sanitizeFileName(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9а-яёА-ЯЁ._-]/g, '_')
    .replace(/_{2,}/g, '_')
    .slice(0, 100)
}

async function cleanupExpiredChunks(ownerId: string): Promise<void> {
  const ownerChunkRoot = path.join(os.tmpdir(), 'studyassist-upload-chunks', ownerId)
  let entries: string[]
  try {
    entries = await readdir(ownerChunkRoot)
  } catch {
    return
  }

  const now = Date.now()
  await Promise.all(entries.map(async (entry) => {
    const uploadDir = path.join(ownerChunkRoot, entry)
    try {
      const info = await stat(uploadDir)
      if (info.isDirectory() && now - info.mtimeMs > CHUNK_TTL_MS) {
        await rm(uploadDir, { recursive: true, force: true })
      }
    } catch {
      // A concurrent upload or cleanup may remove the entry.
    }
  }))
}

async function handleChunkUpload(formData: FormData, ownerId: string) {
  const uploadId = (formData.get('uploadId') as string | null)?.trim()
  const fileName = (formData.get('fileName') as string | null)?.trim()
  const chunkIndexRaw = formData.get('chunkIndex')
  const totalChunksRaw = formData.get('totalChunks')
  const chunk = formData.get('chunk')

  if (!uploadId || !VALID_UPLOAD_ID.test(uploadId) || !fileName || chunkIndexRaw === null || totalChunksRaw === null || !(chunk instanceof File)) {
    return NextResponse.json({ error: 'Некорректные данные chunk-загрузки' }, { status: 400 })
  }

  const chunkIndex = Number(chunkIndexRaw)
  const totalChunks = Number(totalChunksRaw)
  if (!Number.isInteger(chunkIndex) || !Number.isInteger(totalChunks) || chunkIndex < 0 || totalChunks < 1 || totalChunks > 120 || chunkIndex >= totalChunks || chunk.size > 256 * 1024) {
    return NextResponse.json({ error: 'Некорректные индексы chunk-загрузки' }, { status: 400 })
  }

  const ext = path.extname(fileName).toLowerCase()
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return NextResponse.json({ error: `Тип файла "${fileName}" не поддерживается` }, { status: 400 })
  }

  const chunkDir = path.join(os.tmpdir(), 'studyassist-upload-chunks', ownerId, uploadId)
  await cleanupExpiredChunks(ownerId)
  await mkdir(chunkDir, { recursive: true })
  const chunkPath = path.join(chunkDir, `${chunkIndex}.part`)
  const chunkBuffer = Buffer.from(await chunk.arrayBuffer())
  await writeFile(chunkPath, chunkBuffer)

  if (chunkIndex < totalChunks - 1) {
    return NextResponse.json({ chunkReceived: true, chunkIndex })
  }

  const buffers: Buffer[] = []
  for (let i = 0; i < totalChunks; i++) {
    const partPath = path.join(chunkDir, `${i}.part`)
    buffers.push(await readFile(partPath))
  }

  const fullBuffer = Buffer.concat(buffers)
  if (fullBuffer.length > MAX_SINGLE_FILE_SIZE) {
    await rm(chunkDir, { recursive: true, force: true })
    return NextResponse.json({ error: `Файл "${fileName}" превышает 30МБ` }, { status: 400 })
  }

  if (!matchesFileSignature(ext, fullBuffer)) {
    await rm(chunkDir, { recursive: true, force: true })
    return NextResponse.json({ error: 'Содержимое файла не соответствует его расширению' }, { status: 400 })
  }

  const uploadDir = path.join(getPrivateUploadRoot(), 'orders', ownerId, uploadId)
  await mkdir(uploadDir, { recursive: true })
  const safeExt = ALLOWED_EXTENSIONS.includes(ext) ? ext : ''
  const safeName = sanitizeFileName(path.basename(fileName, ext)) + '_' + Date.now() + safeExt
  const filePath = path.join(uploadDir, safeName)
  await writeFile(filePath, fullBuffer)
  await rm(chunkDir, { recursive: true, force: true })

  return NextResponse.json({ files: [`/api/files/orders/${ownerId}/${uploadId}/${safeName}`], skipped: [] })
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Войдите, чтобы загрузить файлы' }, { status: 401 })
    }

    const ownerId = session.user.id
    const ip = getIP(req)
    const formData = await req.formData()
    const uploadId = formData.get('uploadId') as string | null
    const files = formData.getAll('files') as File[]

    if (!uploadId || !VALID_UPLOAD_ID.test(uploadId)) {
      return NextResponse.json({ error: 'Некорректный uploadId' }, { status: 400 })
    }

    const isChunk = formData.get('chunk') !== null
    // 140 requests allow a complete 30 MiB upload in 256 KiB chunks.
    const userRl = rateLimit(`upload-requests:${ownerId}`, 140, 10 * 60 * 1000)
    if (!userRl.allowed) return rateLimitResponse(userRl.resetAt)
    const ipRl = rateLimit(`upload-ip-requests:${ip}`, 140, 10 * 60 * 1000)
    if (!ipRl.allowed) return rateLimitResponse(ipRl.resetAt)

    if (isChunk) {
      if (formData.get('chunkIndex') === '0') {
        const uploadRl = rateLimit(`upload-files:${ownerId}`, 10, 10 * 60 * 1000)
        if (!uploadRl.allowed) return rateLimitResponse(uploadRl.resetAt)
        const uploadIpRl = rateLimit(`upload-ip-files:${ip}`, 10, 10 * 60 * 1000)
        if (!uploadIpRl.allowed) return rateLimitResponse(uploadIpRl.resetAt)
      }
      return await handleChunkUpload(formData, ownerId)
    }

    const uploadRl = rateLimit(`upload-files:${ownerId}`, 10, 10 * 60 * 1000)
    if (!uploadRl.allowed) return rateLimitResponse(uploadRl.resetAt)
    const uploadIpRl = rateLimit(`upload-ip-files:${ip}`, 10, 10 * 60 * 1000)
    if (!uploadIpRl.allowed) return rateLimitResponse(uploadIpRl.resetAt)

    if (!files || files.length === 0 || files.length > 10) {
      return NextResponse.json({ error: 'Файлы не выбраны' }, { status: 400 })
    }

    // Проверяем общий размер
    const totalSize = files.reduce((sum, f) => sum + f.size, 0)
    if (totalSize > MAX_TOTAL_SIZE) {
      return NextResponse.json(
        { error: 'Общий размер файлов не должен превышать 50МБ' },
        { status: 400 }
      )
    }

    const tooLarge = files.find((f) => f.size > MAX_SINGLE_FILE_SIZE)
    if (tooLarge) {
      return NextResponse.json(
        { error: `Файл "${tooLarge.name}" превышает 30МБ` },
        { status: 400 }
      )
    }

    const uploadDir = path.join(getPrivateUploadRoot(), 'orders', ownerId, uploadId)
    await mkdir(uploadDir, { recursive: true })

    const savedPaths: string[] = []
    const skipped: string[] = []

    for (const file of files) {
      const ext = path.extname(file.name).toLowerCase()
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        skipped.push(file.name)
        continue
      }

      const safeExt = ALLOWED_EXTENSIONS.includes(ext) ? ext : ''
      const safeName = sanitizeFileName(path.basename(file.name, ext)) + '_' + Date.now() + safeExt
      const filePath = path.join(uploadDir, safeName)

      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      if (!matchesFileSignature(ext, buffer)) {
        skipped.push(file.name)
        continue
      }
      await writeFile(filePath, buffer)

      savedPaths.push(`/api/files/orders/${ownerId}/${uploadId}/${safeName}`)
    }

    return NextResponse.json({ files: savedPaths, skipped })
  } catch (error) {
    console.error('Upload error:', error instanceof Error ? error.name : 'unknown')
    return NextResponse.json({ error: 'Не удалось загрузить файлы' }, { status: 500 })
  }
}
