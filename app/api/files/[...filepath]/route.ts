import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import path from 'path'
import os from 'os'

// Отдаём файлы из public/uploads или /tmp/studyassist-uploads (fallback)
export async function GET(
  _req: NextRequest,
  { params }: { params: { filepath: string[] } }
) {
  const filePath = params.filepath.join('/')

  // Запрет path traversal
  if (filePath.includes('..') || filePath.includes('\0')) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  const candidates = [
    path.join(process.cwd(), 'public', 'uploads', filePath),
    path.join(os.tmpdir(), 'studyassist-uploads', filePath),
    path.join(os.tmpdir(), 'studyassist-results', filePath.replace(/^results\//, '')),
    ...(process.env.UPLOAD_DIR ? [path.join(process.env.UPLOAD_DIR, filePath)] : []),
    ...(process.env.RESULT_DIR ? [path.join(process.env.RESULT_DIR, filePath)] : []),
  ]

  for (const fullPath of candidates) {
    try {
      const buffer = await readFile(fullPath)
      const ext = path.extname(filePath).toLowerCase()
      const contentType = getContentType(ext)
      const filename = path.basename(filePath)

      return new NextResponse(buffer, {
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `inline; filename="${encodeURIComponent(filename)}"`,
          'Cache-Control': 'private, max-age=3600',
        },
      })
    } catch {
      // попробуем следующий путь
    }
  }

  return new NextResponse('File not found', { status: 404 })
}

function getContentType(ext: string): string {
  const map: Record<string, string> = {
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.txt': 'text/plain; charset=utf-8',
    '.zip': 'application/zip',
    '.rar': 'application/x-rar-compressed',
    '.7z': 'application/x-7z-compressed',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
  }
  return map[ext] || 'application/octet-stream'
}
