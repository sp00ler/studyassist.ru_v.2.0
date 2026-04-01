import fs from 'fs'
import os from 'os'
import path from 'path'

const API_FILES_PREFIX = '/api/files/'
const UPLOADS_PREFIX = '/uploads/'

function normalizeStoredPath(storedPath: string): string {
  return storedPath.replace(/^\/+/, '')
}

function removeKnownPrefix(storedPath: string): string {
  if (storedPath.startsWith(API_FILES_PREFIX)) {
    return storedPath.slice(API_FILES_PREFIX.length)
  }
  if (storedPath.startsWith(UPLOADS_PREFIX)) {
    return storedPath.slice(UPLOADS_PREFIX.length)
  }
  return normalizeStoredPath(storedPath)
}

export function resolveStoredFileAbsolutePath(storedPath: string): string | null {
  const relativePath = removeKnownPrefix(storedPath)
  const candidates = [
    path.join(process.cwd(), 'public', 'uploads', relativePath),
    path.join(os.tmpdir(), 'studyassist-uploads', relativePath),
    ...(process.env.UPLOAD_DIR ? [path.join(process.env.UPLOAD_DIR, relativePath)] : []),
  ]

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate
  }

  return null
}
