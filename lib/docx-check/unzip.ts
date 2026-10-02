// Reads text entries from a .docx (zip) with the platform's DecompressionStream,
// so no zip library ships to the browser. ZIP64 and encrypted archives are not
// supported — student papers are far below 4 GB.

export class NotDocxError extends Error {}

async function inflateRaw(data: Uint8Array): Promise<Uint8Array> {
  const stream = new Blob([new Uint8Array(data)]).stream().pipeThrough(new DecompressionStream('deflate-raw'))
  return new Uint8Array(await new Response(stream).arrayBuffer())
}

export async function readZipText(buf: ArrayBuffer, want: (name: string) => boolean): Promise<Map<string, string>> {
  const bytes = new Uint8Array(buf)
  const view = new DataView(buf)
  const out = new Map<string, string>()

  let eocd = -1
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65557); i--) {
    if (view.getUint32(i, true) === 0x06054b50) { eocd = i; break }
  }
  if (eocd < 0) throw new NotDocxError('not a zip')

  const count = view.getUint16(eocd + 10, true)
  let p = view.getUint32(eocd + 16, true)
  const decoder = new TextDecoder('utf-8')

  for (let i = 0; i < count; i++) {
    if (p + 46 > bytes.length || view.getUint32(p, true) !== 0x02014b50) throw new NotDocxError('bad central directory')
    const method = view.getUint16(p + 10, true)
    const compSize = view.getUint32(p + 20, true)
    const nameLen = view.getUint16(p + 28, true)
    const extraLen = view.getUint16(p + 30, true)
    const commentLen = view.getUint16(p + 32, true)
    const localOffset = view.getUint32(p + 42, true)
    const name = decoder.decode(bytes.subarray(p + 46, p + 46 + nameLen))
    p += 46 + nameLen + extraLen + commentLen

    if (!want(name)) continue
    if (compSize === 0xffffffff || localOffset === 0xffffffff) throw new NotDocxError('zip64')
    if (view.getUint32(localOffset, true) !== 0x04034b50) throw new NotDocxError('bad local header')
    const start = localOffset + 30 + view.getUint16(localOffset + 26, true) + view.getUint16(localOffset + 28, true)
    const raw = bytes.subarray(start, start + compSize)
    const data = method === 0 ? raw : method === 8 ? await inflateRaw(raw) : null
    if (data) out.set(name, decoder.decode(data))
  }
  return out
}
