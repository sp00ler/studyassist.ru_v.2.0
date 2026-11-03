import fs from 'fs'
import os from 'os'
import path from 'path'
import { getPrivateUploadRoot, resolvePrivateUploadPath } from '@/lib/private-file-storage'

const API_FILES_PREFIX = '/api/files/'
const UPLOADS_PREFIX = '/uploads/'

function getSafeRelativePath(storedPath: string): string | null {
  if (typeof storedPath !== 'string' || storedPath.includes('\0') || storedPath.includes('\\')) return null
  const relativePath = storedPath.startsWith(API_FILES_PREFIX)
    ? storedPath.slice(API_FILES_PREFIX.length)
    : storedPath.startsWith(UPLOADS_PREFIX)
      ? storedPath.slice(UPLOADS_PREFIX.length)
      : storedPath.replace(/^\/+/, '')
  if (!relativePath || path.posix.isAbsolute(relativePath) || path.win32.isAbsolute(relativePath)) return null

  const segments = relativePath.split('/')
  if (segments.some((segment) => !segment || segment === '.' || segment === '..')) return null
  return segments.join('/')
}

function isContained(root: string, candidate: string): boolean {
  const relative = path.relative(root, candidate)
  return relative !== '' && relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative)
}

function addCandidate(candidates: Array<{ root: string; file: string }>, root: string, relativePath: string) {
  const resolvedRoot = path.resolve(root)
  const file = path.resolve(resolvedRoot, ...relativePath.split('/'))
  if (isContained(resolvedRoot, file)) candidates.push({ root: resolvedRoot, file })
}

export function resolveStoredFileAbsolutePath(storedPath: string): string | null {
  const relativePath = getSafeRelativePath(storedPath)
  if (!relativePath) return null

  const candidates: Array<{ root: string; file: string }> = []
  const privatePath = resolvePrivateUploadPath(relativePath)
  if (privatePath) candidates.push({ root: getPrivateUploadRoot(), file: privatePath })

  // Legacy roots remain readable for existing order notifications during migration.
  const publicUploadsRoot = path.join(process.cwd(), 'public', 'uploads')
  const oldUploadRoot = path.join(os.tmpdir(), 'studyassist-uploads')
  addCandidate(candidates, publicUploadsRoot, relativePath)
  addCandidate(candidates, oldUploadRoot, relativePath)

  const [category, ...rest] = relativePath.split('/')
  if ((category === 'results' || category === 'revisions') && rest.length >= 2) {
    const categoryRelativePath = rest.join('/')
    const categoryRoot = path.join(os.tmpdir(), category === 'results' ? 'studyassist-results' : 'studyassist-revisions')
    addCandidate(candidates, categoryRoot, categoryRelativePath)
    if (category === 'results' && process.env.RESULT_DIR?.trim()) {
      addCandidate(candidates, process.env.RESULT_DIR, categoryRelativePath)
    }
  }
  if (category === 'tg-orders' && rest.length === 1) {
    const telegramRoot = path.join(os.tmpdir(), 'tg-orders')
    addCandidate(candidates, telegramRoot, rest[0])
  }

  for (const candidate of candidates) {
    try {
      const realRoot = fs.realpathSync(candidate.root)
      const realFile = fs.realpathSync(candidate.file)
      if (isContained(realRoot, realFile) && fs.statSync(realFile).isFile()) return realFile
    } catch {
      // Try next known storage root.
    }
  }

  return null
}
