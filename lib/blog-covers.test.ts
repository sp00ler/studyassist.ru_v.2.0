import { describe, expect, it } from 'vitest'
import { COVER_NAME_RE, sniffCoverExt } from './blog-covers'

describe('sniffCoverExt', () => {
  it('detects png, jpg and webp by magic bytes', () => {
    expect(sniffCoverExt(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0]))).toBe('png')
    expect(sniffCoverExt(Buffer.from([0xff, 0xd8, 0xff, 0xe0]))).toBe('jpg')
    expect(sniffCoverExt(Buffer.from('RIFF\0\0\0\0WEBPVP8 ', 'ascii'))).toBe('webp')
  })

  it('rejects svg, html and empty files whatever their name', () => {
    expect(sniffCoverExt(Buffer.from('<svg onload="alert(1)"></svg>'))).toBeNull()
    expect(sniffCoverExt(Buffer.from('<html></html>'))).toBeNull()
    expect(sniffCoverExt(Buffer.alloc(0))).toBeNull()
  })
})

describe('COVER_NAME_RE', () => {
  it('accepts only uuid names with an allowed extension', () => {
    expect(COVER_NAME_RE.test('11111111-2222-3333-4444-555555555555.webp')).toBe(true)
    expect(COVER_NAME_RE.test('../.env')).toBe(false)
    expect(COVER_NAME_RE.test('11111111-2222-3333-4444-555555555555.svg')).toBe(false)
  })
})
