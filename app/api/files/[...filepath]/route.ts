import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { readFile, realpath } from 'fs/promises'
import os from 'os'
import path from 'path'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getPrivateUploadRoot, resolvePrivateUploadPath } from '@/lib/private-file-storage'

function parseFileList(value: string | null): string[] {
  if (!value) return []
  try {
    const parsed: unknown = JSON.parse(value)
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : []
  } catch {
    return []
  }
}

function storedResourcePath(value: string): string | null {
  const rawPath = value.startsWith('/api/files/')
    ? value.slice('/api/files/'.length)
    : value.startsWith('/uploads/')
      ? value.slice('/uploads/'.length)
      : null
  if (!rawPath || rawPath.includes('\\') || rawPath.includes('\0')) return null
  const parts = rawPath.split('/')
  if (parts.some((part) => !part || part === '.' || part === '..')) return null
  return parts.join('/')
}

function isValidFileName(value: string): boolean {
  return value.length <= 191 && /^[a-zA-Z0-9а-яёА-ЯЁ._-]+$/.test(value) && value !== '.' && value !== '..'
}

function isWithin(root: string, candidate: string): boolean {
  const relative = path.relative(root, candidate)
  return relative !== '' && relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative)
}

async function readContainedFile(candidate: string, allowedRoot: string): Promise<Buffer | null> {
  try {
    const [realCandidate, realRoot] = await Promise.all([realpath(candidate), realpath(allowedRoot)])
    if (!isWithin(realRoot, realCandidate)) return null
    return await readFile(realCandidate)
  } catch {
    return null
  }
}

async function readPrivateOrLegacyFile(relativePath: string): Promise<Buffer | null> {
  const privateRoot = getPrivateUploadRoot()
  const privatePath = resolvePrivateUploadPath(relativePath)
  if (!privatePath) return null

  const currentFile = await readContainedFile(privatePath, privateRoot)
  if (currentFile) return currentFile

  // Read pre-migration files only from known storage roots, after authorization above.
  const fileName = relativePath.split('/').pop()!
  const segments = relativePath.split('/')
  const category = segments[0]
  const orderPath = segments.slice(1, -1).join(path.sep)
  const legacyCandidates: Array<{ file: string; root: string }> = []
  const uploadsRoot = path.join(process.cwd(), 'public', 'uploads')
  const legacyUploadsRoot = path.join(os.tmpdir(), 'studyassist-uploads')

  // Old initial-order uploads used an unscoped `<uploadId>/<file>` URL.
  if (category !== 'results' && category !== 'revisions') {
    legacyCandidates.push(
      { root: uploadsRoot, file: path.join(uploadsRoot, ...segments) },
      { root: legacyUploadsRoot, file: path.join(legacyUploadsRoot, ...segments) },
    )
  }

  if (category === 'revisions') {
    const revisionRoot = path.join(osTmp(), 'studyassist-revisions')
    legacyCandidates.push(
      { root: uploadsRoot, file: path.join(uploadsRoot, 'revisions', orderPath, fileName) },
      { root: revisionRoot, file: path.join(revisionRoot, orderPath, fileName) },
    )
  } else if (category === 'results') {
    const resultsRoot = path.join(osTmp(), 'studyassist-results')
    legacyCandidates.push(
      { root: uploadsRoot, file: path.join(uploadsRoot, 'results', orderPath, fileName) },
      { root: resultsRoot, file: path.join(resultsRoot, orderPath, fileName) },
    )
    if (process.env.RESULT_DIR?.trim()) {
      const configuredRoot = path.resolve(process.env.RESULT_DIR)
      legacyCandidates.push({ root: configuredRoot, file: path.join(configuredRoot, orderPath, fileName) })
    }
  } else if (category === 'tg-orders' && segments.length === 2) {
    const telegramRoot = path.join(osTmp(), 'tg-orders')
    legacyCandidates.push({ root: telegramRoot, file: path.join(telegramRoot, fileName) })
  }

  for (const candidate of legacyCandidates) {
    const contents = await readContainedFile(candidate.file, candidate.root)
    if (contents) return contents
  }

  return null
}

function osTmp(): string {
  return os.tmpdir()
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { filepath: string[] } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
  }

  const segments = params.filepath
  if (!Array.isArray(segments) || segments.some((segment) => !segment || segment === '.' || segment === '..' || segment.includes('\\') || segment.includes('\0'))) {
    return new NextResponse('Not found', { status: 404 })
  }

  const [category, ...rest] = segments
  let relativePath: string
  let matchingFiles: string[]
  let ownerId: string | null = null
  let resourceOwnerIds: string[] = []

  if (category === 'orders' && rest.length === 3) {
    const [pathOwnerId, uploadId, fileName] = rest
    if (!/^[a-zA-Z0-9_-]{1,191}$/.test(pathOwnerId) || !/^[a-zA-Z0-9_-]{1,191}$/.test(uploadId) || !isValidFileName(fileName)) {
      return new NextResponse('Not found', { status: 404 })
    }
    ownerId = pathOwnerId
    relativePath = segments.join('/')
    const requestedPath = `/api/files/${segments.join('/')}`
    const matchingOrders = await prisma.order.findMany({
      where: { userId: ownerId, files: { contains: requestedPath } },
      select: { files: true, userId: true },
    })
    matchingFiles = matchingOrders.flatMap((order) => parseFileList(order.files))
    resourceOwnerIds = [ownerId]
  } else if ((category === 'results' || category === 'revisions') && rest.length === 2) {
    const [orderId, fileName] = rest
    if (!/^[a-zA-Z0-9_-]{1,191}$/.test(orderId) || !isValidFileName(fileName)) {
      return new NextResponse('Not found', { status: 404 })
    }
    const order = await prisma.order.findUnique({ where: { id: orderId } })
    if (!order) return new NextResponse('Not found', { status: 404 })
    resourceOwnerIds = order.userId ? [order.userId] : []
    relativePath = segments.join('/')
    matchingFiles = parseFileList(category === 'results' ? order.resultFiles : order.revisionFiles)
  } else {
    // Legacy paths are allowed only when the exact resource is still listed on an order.
    if (segments.length < 2 || segments.length > 8 || !segments.every(isValidFileName)) {
      return new NextResponse('Not found', { status: 404 })
    }
    relativePath = segments.join('/')
    const requestedPath = `/api/files/${relativePath}`
    const matchingOrders = await prisma.order.findMany({
      where: {
        OR: [
          { files: { contains: requestedPath } },
          { files: { contains: `/uploads/${relativePath}` } },
        ],
      },
      select: { files: true, userId: true },
    })
    matchingFiles = matchingOrders.flatMap((order) => parseFileList(order.files))
    resourceOwnerIds = matchingOrders
      .filter((order) => parseFileList(order.files).some((storedPath) => storedResourcePath(storedPath) === relativePath))
      .flatMap((order) => order.userId ? [order.userId] : [])
  }

  const requestedResourcePath = segments.join('/')
  const isListedOnOrder = matchingFiles.some((storedPath) => storedResourcePath(storedPath) === requestedResourcePath)
  if (!isListedOnOrder) return new NextResponse('Not found', { status: 404 })

  if (!session.user.isAdmin && !resourceOwnerIds.includes(session.user.id)) {
    return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 })
  }

  const buffer = await readPrivateOrLegacyFile(relativePath)
  if (!buffer) return new NextResponse('File not found', { status: 404 })

  const extension = path.extname(relativePath).toLowerCase()
  const contentType = getContentType(extension)
  const filename = path.basename(relativePath).replace(/[^a-zA-Z0-9._-]/g, '_')
  const body = new Uint8Array(buffer.byteLength)
  body.set(buffer)
  return new NextResponse(body, {
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  })
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
