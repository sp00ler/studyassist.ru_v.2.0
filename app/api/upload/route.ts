import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import os from 'os'
import { writeFile, mkdir, access, constants, readFile, rm } from 'fs/promises'

export const maxDuration = 60
export const dynamic = 'force-dynamic'

const MAX_TOTAL_SIZE = 50 * 1024 * 1024 // 50MB на все файлы в одном запросе
const MAX_SINGLE_FILE_SIZE = 30 * 1024 * 1024 // 30MB на 1 файл
const CHUNK_SIZE = 1 * 1024 * 1024 // 1MB
const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.txt', '.zip', '.jpg', '.jpeg', '.png', '.rar', '.7z']
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'application/zip',
  'application/x-zip-compressed',
  'image/jpeg',
  'image/png',
  'application/x-rar-compressed',
  'application/octet-stream',
]

function sanitizeFileName(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9а-яёА-ЯЁ._-]/g, '_')
    .replace(/_{2,}/g, '_')
    .slice(0, 100)
}

async function isWritable(dir: string): Promise<boolean> {
  try {
    await mkdir(dir, { recursive: true })
    await access(dir, constants.W_OK)
    return true
  } catch {
    return false
  }
}

async function getUploadDir(orderId: string): Promise<{ dir: string; publicPath: string }> {
  // Приоритет 1: переменная окружения UPLOAD_DIR
  if (process.env.UPLOAD_DIR) {
    const dir = path.join(process.env.UPLOAD_DIR, orderId)
    await mkdir(dir, { recursive: true })
    return { dir, publicPath: `/api/files/${orderId}` }
  }

  // Приоритет 2: public/uploads в cwd
  const publicDir = path.join(process.cwd(), 'public', 'uploads', orderId)
  if (await isWritable(publicDir)) {
    return { dir: publicDir, publicPath: `/api/files/${orderId}` }
  }

  // Приоритет 3: /tmp как fallback (всегда доступен для записи)
  const tmpDir = path.join(os.tmpdir(), 'studyassist-uploads', orderId)
  await mkdir(tmpDir, { recursive: true })
  console.warn(`Upload fallback to /tmp: ${tmpDir} (public/uploads not writable at ${process.cwd()})`)
  return { dir: tmpDir, publicPath: `/api/files/${orderId}` }
}

async function handleChunkUpload(formData: FormData, orderId: string) {
  const uploadId = (formData.get('uploadId') as string | null)?.trim()
  const fileName = (formData.get('fileName') as string | null)?.trim()
  const chunkIndexRaw = formData.get('chunkIndex')
  const totalChunksRaw = formData.get('totalChunks')
  const chunk = formData.get('chunk')

  if (!uploadId || !fileName || chunkIndexRaw === null || totalChunksRaw === null || !(chunk instanceof File)) {
    return NextResponse.json({ error: 'Некорректные данные chunk-загрузки' }, { status: 400 })
  }

  const chunkIndex = Number(chunkIndexRaw)
  const totalChunks = Number(totalChunksRaw)
  if (!Number.isInteger(chunkIndex) || !Number.isInteger(totalChunks) || chunkIndex < 0 || totalChunks < 1 || chunkIndex >= totalChunks) {
    return NextResponse.json({ error: 'Некорректные индексы chunk-загрузки' }, { status: 400 })
  }

  const ext = path.extname(fileName).toLowerCase()
  const mimeOk = !chunk.type || ALLOWED_MIME_TYPES.includes(chunk.type) || chunk.type.startsWith('image/')
  if (!ALLOWED_EXTENSIONS.includes(ext) && !mimeOk) {
    return NextResponse.json({ error: `Тип файла "${fileName}" не поддерживается` }, { status: 400 })
  }

  const chunkDir = path.join(os.tmpdir(), 'studyassist-upload-chunks', uploadId)
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

  const { dir: uploadDir, publicPath: uploadPublicPath } = await getUploadDir(orderId)
  const safeExt = ALLOWED_EXTENSIONS.includes(ext) ? ext : ''
  const safeName = sanitizeFileName(path.basename(fileName, ext)) + '_' + Date.now() + safeExt
  const filePath = path.join(uploadDir, safeName)
  await writeFile(filePath, fullBuffer)
  await rm(chunkDir, { recursive: true, force: true })

  return NextResponse.json({ files: [`${uploadPublicPath}/${safeName}`], skipped: [] })
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const orderId = formData.get('orderId') as string
    const files = formData.getAll('files') as File[]

    if (!orderId) {
      return NextResponse.json({ error: 'orderId обязателен' }, { status: 400 })
    }

    if (formData.get('uploadId')) {
      return await handleChunkUpload(formData, orderId)
    }

    if (!files || files.length === 0) {
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

    const { dir: uploadDir, publicPath: uploadPublicPath } = await getUploadDir(orderId)

    const savedPaths: string[] = []
    const skipped: string[] = []

    for (const file of files) {
      const ext = path.extname(file.name).toLowerCase()
      const mimeOk = !file.type || ALLOWED_MIME_TYPES.includes(file.type) || file.type.startsWith('image/')

      if (!ALLOWED_EXTENSIONS.includes(ext) && !mimeOk) {
        skipped.push(file.name)
        continue
      }
      if (!ext && !mimeOk) {
        skipped.push(file.name)
        continue
      }
      if (file.type && !ALLOWED_MIME_TYPES.includes(file.type) && !file.type.startsWith('image/') && !ALLOWED_EXTENSIONS.includes(ext)) {
        skipped.push(file.name)
        continue
      }

      const safeExt = ALLOWED_EXTENSIONS.includes(ext) ? ext : ''
      const safeName = sanitizeFileName(path.basename(file.name, ext)) + '_' + Date.now() + safeExt
      const filePath = path.join(uploadDir, safeName)

      const bytes = await file.arrayBuffer()
      await writeFile(filePath, Buffer.from(bytes))

      savedPaths.push(`${uploadPublicPath}/${safeName}`)
    }

    return NextResponse.json({ files: savedPaths, skipped })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('Upload error:', msg)

    const lower = msg.toLowerCase()
    if (lower.includes('body') && (lower.includes('too large') || lower.includes('size'))) {
      return NextResponse.json(
        { error: `Слишком большой запрос. Попробуйте загрузить файл частями (chunk upload, ${CHUNK_SIZE / (1024 * 1024)}MB).` },
        { status: 413 }
      )
    }

    if (lower.includes('multipart') || lower.includes('formdata')) {
      return NextResponse.json(
        { error: 'Не удалось обработать загружаемые файлы (multipart/form-data).' },
        { status: 400 }
      )
    }

    return NextResponse.json({ error: `Ошибка загрузки файлов: ${msg}` }, { status: 500 })
  }
}
