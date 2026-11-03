// Minimal XML reader for WordprocessingML. Word writes machine-generated,
// well-formed XML, so a small tokenizer is enough and keeps the checker free
// of dependencies and runnable both in the browser and in Node tests.

export interface XNode {
  name: string
  attrs: Record<string, string>
  children: XNode[]
  /** Concatenated character data directly inside this element. */
  text: string
}

const ENTITY: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" }

function decode(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|\w+);/gi, (m, e: string) => {
    if (e[0] === '#') {
      const code = e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10)
      return Number.isFinite(code) ? String.fromCodePoint(code) : m
    }
    return ENTITY[e] ?? m
  })
}

const ATTR_RE = /([\w:.-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g

export function parseXml(src: string): XNode {
  const root: XNode = { name: '#root', attrs: {}, children: [], text: '' }
  const stack: XNode[] = [root]
  const tokenRe = /<!\[CDATA\[([\s\S]*?)\]\]>|<!--[\s\S]*?-->|<\?[\s\S]*?\?>|<!DOCTYPE[^>]*>|<(\/?)([\w:.-]+)((?:\s+[\w:.-]+\s*=\s*(?:"[^"]*"|'[^']*'))*)\s*(\/?)>|([^<]+)/g
  let m: RegExpExecArray | null
  while ((m = tokenRe.exec(src))) {
    const top = stack[stack.length - 1]
    if (m[1] !== undefined) {
      top.text += m[1]
    } else if (m[3] !== undefined) {
      if (m[2] === '/') {
        if (stack.length > 1) stack.pop()
        continue
      }
      const attrs: Record<string, string> = {}
      let a: RegExpExecArray | null
      ATTR_RE.lastIndex = 0
      while ((a = ATTR_RE.exec(m[4]))) attrs[a[1]] = decode(a[2] ?? a[3] ?? '')
      const node: XNode = { name: m[3], attrs, children: [], text: '' }
      top.children.push(node)
      if (m[5] !== '/') stack.push(node)
    } else if (m[6] !== undefined) {
      top.text += decode(m[6])
    }
  }
  return root
}

export function child(n: XNode | undefined, name: string): XNode | undefined {
  return n?.children.find((c) => c.name === name)
}

export function kids(n: XNode | undefined, name: string): XNode[] {
  return n ? n.children.filter((c) => c.name === name) : []
}

/** First descendant with the given name (depth-first). */
export function find(n: XNode | undefined, name: string): XNode | undefined {
  if (!n) return undefined
  for (const c of n.children) {
    if (c.name === name) return c
    const deep = find(c, name)
    if (deep) return deep
  }
  return undefined
}

export function val(n: XNode | undefined, attr = 'w:val'): string | undefined {
  return n?.attrs[attr]
}

/** OOXML on/off property: present without w:val means on. */
export function onOff(n: XNode | undefined): boolean | undefined {
  if (!n) return undefined
  const v = n.attrs['w:val']
  return v === undefined || !['0', 'false', 'off'].includes(v)
}
