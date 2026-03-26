import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs'
import { writeFile, mkdir } from 'fs/promises'

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB
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

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const orderId = formData.get('orderId') as string
    const files = formData.getAll('files') as File[]

    if (!orderId) {
      return NextResponse.json({ error: 'orderId обязателен' }, { status: 400 })
    }

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'Файлы не выбраны' }, { status: 400 })
    }

    // Проверяем общий размер
    const totalSize = files.reduce((sum, f) => sum + f.size, 0)
    if (totalSize > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'Общий размер файлов не должен превышать 50МБ' },
        { status: 400 }
      )
    }

    // Создаём директорию для загрузок
    const uploadsBase = process.env.UPLOAD_DIR || path.join(process.cwd(), 'public', 'uploads')
    const uploadDir = path.join(uploadsBase, orderId)
    await mkdir(uploadDir, { recursive: true })

    const savedPaths: string[] = []
    const skipped: string[] = []

    for (const file of files) {
      const ext = path.extname(file.name).toLowerCase()

      // Если расширение неизвестно — проверяем MIME тип как запасной вариант
      const mimeOk = !file.type || ALLOWED_MIME_TYPES.includes(file.type) || file.type.startsWith('image/')
      if (!ALLOWED_EXTENSIONS.includes(ext) && !mimeOk) {
        skipped.push(file.name)
        continue
      }

      // Если нет расширения но MIME ok — пропускаем файл (небезопасно хранить без ext)
      if (!ext && !mimeOk) {
        skipped.push(file.name)
        continue
      }

      // Если MIME тип запрещён и расширение тоже не подходит — пропускаем
      if (file.type && !ALLOWED_MIME_TYPES.includes(file.type) && !file.type.startsWith('image/') && !ALLOWED_EXTENSIONS.includes(ext)) {
        skipped.push(file.name)
        continue
      }

      const safeExt = ALLOWED_EXTENSIONS.includes(ext) ? ext : ''
      const safeName = sanitizeFileName(path.basename(file.name, ext)) + '_' + Date.now() + safeExt
      const filePath = path.join(uploadDir, safeName)

      const bytes = await file.arrayBuffer()
      await writeFile(filePath, Buffer.from(bytes))

      savedPaths.push(`/uploads/${orderId}/${safeName}`)
    }

    return NextResponse.json({ files: savedPaths, skipped })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('Upload error:', msg)
    return NextResponse.json({ error: `Ошибка загрузки файлов: ${msg}` }, { status: 500 })
  }
}
