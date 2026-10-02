import path from 'path'
import { getPrivateUploadRoot } from '@/lib/private-file-storage'

// Blog covers live outside public/: `next start` only serves public files that
// existed at build time, so runtime uploads are streamed by /blog-covers/[name].
export const COVER_URL_PREFIX = '/blog-covers/'
export const COVER_MAX_SIZE = 5 * 1024 * 1024
export const COVER_NAME_RE = /^[0-9a-f-]{36}\.(png|jpg|webp)$/

export const COVER_MIME: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  webp: 'image/webp',
}

export function coverDir(): string {
  return path.join(getPrivateUploadRoot(), 'blog-covers')
}

/** Detect the image type from magic bytes; the browser-reported MIME is not trusted. */
export function sniffCoverExt(buf: Buffer): 'png' | 'jpg' | 'webp' | null {
  if (buf.length >= 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png'
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpg'
  if (buf.length >= 12 && buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') return 'webp'
  return null
}
