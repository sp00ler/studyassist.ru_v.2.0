// Turns the XML parts of a .docx into a flat model of what the reader sees:
// paragraphs with their *effective* formatting (document defaults → style
// chain → direct formatting) and page sections.

import { child, find, kids, onOff, parseXml, val, type XNode } from './xml'

export type ParaKind = 'body' | 'heading' | 'toc' | 'caption' | 'list' | 'title' | 'table' | 'empty'

export interface Run {
  text: string
  font?: string
  /** Points. */
  size: number
  bold: boolean
}

export interface Para {
  kind: ParaKind
  text: string
  runs: Run[]
  styleName?: string
  /** 'both' | 'left' | 'center' | 'right' */
  align: string
  /** First-line indent in cm; negative for a hanging indent. */
  firstLineCm: number
  /** Line spacing as a multiple when lineRule is auto. */
  lineMultiple?: number
  /** Fixed line spacing in points (lineRule exact / atLeast). */
  lineFixedPt?: number
  hasDrawing: boolean
  /** Paragraph contains or ends with a page/section break. */
  breaksPage: boolean
  /** Paragraph starts on a new page (pageBreakBefore). */
  breakBefore: boolean
}

export interface Section {
  pageWmm: number
  pageHmm: number
  margins: { top: number; right: number; bottom: number; left: number }
  titlePg: boolean
  /** Where a PAGE field is present for the regular (non-first) pages. */
  pageNumber: { top: boolean; bottom: boolean }
  /** PAGE field present on the first page of the section. */
  firstPageNumbered: boolean
}

export interface DocModel {
  paras: Para[]
  sections: Section[]
  hasToc: boolean
}

const TWIP_MM = 25.4 / 1440
const TWIP_CM = 2.54 / 1440

interface PProps {
  jc?: string
  firstLine?: number
  line?: number
  lineRule?: string
  outline?: number
  numbered?: boolean
}

interface RProps {
  ascii?: string
  hAnsi?: string
  asciiTheme?: string
  hAnsiTheme?: string
  sz?: number
  b?: boolean
  vanish?: boolean
}

interface StyleDef {
  type: string
  name: string
  basedOn?: string
  pPr?: XNode
  rPr?: XNode
}

function readP(pPr: XNode | undefined, into: PProps) {
  if (!pPr) return
  const jc = val(child(pPr, 'w:jc'))
  if (jc) into.jc = jc
  const ind = child(pPr, 'w:ind')
  if (ind) {
    if (ind.attrs['w:firstLine'] !== undefined) into.firstLine = Number(ind.attrs['w:firstLine'])
    if (ind.attrs['w:hanging'] !== undefined) into.firstLine = -Number(ind.attrs['w:hanging'])
  }
  const sp = child(pPr, 'w:spacing')
  if (sp?.attrs['w:line'] !== undefined) {
    into.line = Number(sp.attrs['w:line'])
    into.lineRule = sp.attrs['w:lineRule'] ?? 'auto'
  }
  const ol = val(child(pPr, 'w:outlineLvl'))
  if (ol !== undefined) into.outline = Number(ol)
  if (child(pPr, 'w:numPr')) into.numbered = true
}

function readR(rPr: XNode | undefined, into: RProps) {
  if (!rPr) return
  const f = child(rPr, 'w:rFonts')
  if (f) {
    // An explicit font name overrides a theme reference and vice versa.
    if (f.attrs['w:ascii']) { into.ascii = f.attrs['w:ascii']; into.asciiTheme = undefined }
    if (f.attrs['w:hAnsi']) { into.hAnsi = f.attrs['w:hAnsi']; into.hAnsiTheme = undefined }
    if (f.attrs['w:asciiTheme']) into.asciiTheme = f.attrs['w:asciiTheme']
    if (f.attrs['w:hAnsiTheme']) into.hAnsiTheme = f.attrs['w:hAnsiTheme']
  }
  const sz = val(child(rPr, 'w:sz'))
  if (sz) into.sz = Number(sz)
  const b = onOff(child(rPr, 'w:b'))
  if (b !== undefined) into.b = b
  const vanish = onOff(child(rPr, 'w:vanish'))
  if (vanish !== undefined) into.vanish = vanish
}

function headerHasPage(xml: string | undefined): boolean {
  if (!xml) return false
  return /<w:instrText[^>]*>[^<]*\bPAGE\b/.test(xml) || /w:instr="[^"]*\bPAGE\b/.test(xml)
}

export function buildModel(files: Map<string, string>): DocModel {
  const docXml = files.get('word/document.xml')
  if (!docXml) throw new Error('word/document.xml missing')
  const doc = parseXml(docXml)
  const body = find(doc, 'w:body')
  if (!body) throw new Error('w:body missing')

  // Theme fonts
  const themeXml = Array.from(files.entries()).find(([n]) => /^word\/theme\/theme\d*\.xml$/.test(n))?.[1] ?? ''
  const themeFont = (which: 'minor' | 'major') =>
    new RegExp(`<a:${which}Font>\\s*<a:latin typeface="([^"]*)"`).exec(themeXml)?.[1]
  const resolveTheme = (t?: string) => (t ? themeFont(t.startsWith('major') ? 'major' : 'minor') : undefined)

  // Styles
  const stylesRoot = files.get('word/styles.xml') ? parseXml(files.get('word/styles.xml')!) : undefined
  const styles = new Map<string, StyleDef>()
  let defaultPara: string | undefined
  for (const s of kids(find(stylesRoot, 'w:styles'), 'w:style')) {
    const id = s.attrs['w:styleId']
    if (!id) continue
    styles.set(id, {
      type: s.attrs['w:type'] ?? 'paragraph',
      name: val(child(s, 'w:name')) ?? id,
      basedOn: val(child(s, 'w:basedOn')),
      pPr: child(s, 'w:pPr'),
      rPr: child(s, 'w:rPr'),
    })
    if (s.attrs['w:type'] === 'paragraph' && ['1', 'true', 'on'].includes(s.attrs['w:default'] ?? '')) defaultPara = id
  }
  const docDefaults = find(stylesRoot, 'w:docDefaults')
  const defP = find(docDefaults, 'w:pPr')
  const defR = find(docDefaults, 'w:rPr')

  const chain = (id?: string): StyleDef[] => {
    const out: StyleDef[] = []
    const seen = new Set<string>()
    while (id && styles.has(id) && !seen.has(id)) {
      seen.add(id)
      const s = styles.get(id)!
      out.unshift(s)
      id = s.basedOn
    }
    return out
  }

  // Header/footer parts by relationship id
  const rels = new Map<string, string>()
  for (const m of Array.from((files.get('word/_rels/document.xml.rels') ?? '').matchAll(/<Relationship\b[^>]*>/g))) {
    const id = /Id="([^"]+)"/.exec(m[0])?.[1]
    const target = /Target="([^"]+)"/.exec(m[0])?.[1]
    if (id && target) rels.set(id, 'word/' + target.replace(/^\/?word\//, '').replace(/^\.\//, ''))
  }
  const partHasPage = (rid?: string) => (rid ? headerHasPage(files.get(rels.get(rid) ?? '')) : false)

  const sections: Section[] = []
  // Header/footer references are inherited from the previous section when absent.
  const inherited: Record<string, string | undefined> = {}
  const readSection = (sp: XNode) => {
    const refs: Record<string, string | undefined> = { ...inherited }
    for (const r of [...kids(sp, 'w:headerReference'), ...kids(sp, 'w:footerReference')]) {
      const kind = r.name === 'w:headerReference' ? 'h' : 'f'
      refs[`${kind}:${r.attrs['w:type'] ?? 'default'}`] = r.attrs['r:id']
    }
    Object.assign(inherited, refs)
    const sz = child(sp, 'w:pgSz')
    const mar = child(sp, 'w:pgMar')
    const n = (node: XNode | undefined, a: string) => Number(node?.attrs[a] ?? 0) * TWIP_MM
    const titlePg = onOff(child(sp, 'w:titlePg')) ?? false
    const top = partHasPage(refs['h:default'])
    const bottom = partHasPage(refs['f:default'])
    sections.push({
      pageWmm: n(sz, 'w:w'),
      pageHmm: n(sz, 'w:h'),
      margins: { top: n(mar, 'w:top'), right: n(mar, 'w:right'), bottom: n(mar, 'w:bottom'), left: n(mar, 'w:left') },
      titlePg,
      pageNumber: { top, bottom },
      firstPageNumbered: titlePg ? partHasPage(refs['h:first']) || partHasPage(refs['f:first']) : top || bottom,
    })
  }

  const paras: Para[] = []
  let hasToc = /<w:instrText[^>]*>\s*TOC\b/.test(docXml) || /w:instr="\s*TOC\b/.test(docXml) || /w:docPartGallery w:val="Table of Contents"/.test(docXml)

  const collectRuns = (n: XNode, pStyleR: RProps, out: Run[], flags: { drawing: boolean; pageBreak: boolean }) => {
    for (const c of n.children) {
      if (c.name === 'w:r') {
        const r: RProps = { ...pStyleR }
        const rPr = child(c, 'w:rPr')
        const rStyle = val(child(rPr, 'w:rStyle'))
        for (const s of chain(rStyle)) readR(s.rPr, r)
        readR(rPr, r)
        let text = ''
        for (const rc of c.children) {
          if (rc.name === 'w:t') text += rc.text
          else if (rc.name === 'w:tab') text += '\t'
          else if (rc.name === 'w:br' && rc.attrs['w:type'] === 'page') flags.pageBreak = true
          else if (rc.name === 'w:drawing' || rc.name === 'w:pict' || rc.name === 'w:object') flags.drawing = true
        }
        if (r.vanish || !text) continue
        out.push({
          text,
          font: r.hAnsi ?? r.ascii ?? resolveTheme(r.hAnsiTheme ?? r.asciiTheme),
          size: (r.sz ?? 20) / 2,
          bold: r.b ?? false,
        })
      } else if (['w:hyperlink', 'w:ins', 'w:smartTag', 'w:fldSimple', 'w:customXml'].includes(c.name)) {
        collectRuns(c, pStyleR, out, flags)
      } else if (c.name === 'w:sdt') {
        const content = child(c, 'w:sdtContent')
        if (content) collectRuns(content, pStyleR, out, flags)
      }
    }
  }

  const readPara = (p: XNode, inTable: boolean) => {
    const pPr = child(p, 'w:pPr')
    const styleId = val(child(pPr, 'w:pStyle')) ?? defaultPara
    const styleChain = chain(styleId)
    const pp: PProps = {}
    readP(defP, pp)
    for (const s of styleChain) readP(s.pPr, pp)
    readP(pPr, pp)
    const rr: RProps = {}
    readR(defR, rr)
    for (const s of styleChain) readR(s.rPr, rr)

    const runs: Run[] = []
    const flags = { drawing: false, pageBreak: false }
    collectRuns(p, rr, runs, flags)
    const text = runs.map((r) => r.text).join('')
    const styleName = styleChain.length ? styleChain[styleChain.length - 1].name : undefined
    const sn = (styleName ?? '').toLowerCase()
    const sectPr = child(pPr, 'w:sectPr')

    let kind: ParaKind
    if (inTable) kind = 'table'
    else if (!text.trim()) kind = 'empty'
    else if (/^toc \d|^оглавление \d/.test(sn) || sn === 'toc heading') kind = 'toc'
    else if ((pp.outline !== undefined && pp.outline < 9) || /^heading \d|^title$|^заголовок/.test(sn)) kind = 'heading'
    else if (/caption|название объекта/.test(sn)) kind = 'caption'
    else if (pp.numbered) kind = 'list'
    else kind = 'body'

    const lineRule = pp.lineRule ?? 'auto'
    paras.push({
      kind,
      text,
      runs,
      styleName,
      align: pp.jc === 'start' ? 'left' : pp.jc === 'end' ? 'right' : pp.jc === 'distribute' ? 'both' : pp.jc ?? 'left',
      firstLineCm: (pp.firstLine ?? 0) * TWIP_CM,
      lineMultiple: lineRule === 'auto' ? (pp.line ?? 240) / 240 : undefined,
      lineFixedPt: lineRule === 'auto' ? undefined : (pp.line ?? 0) / 20,
      hasDrawing: flags.drawing,
      breaksPage: flags.pageBreak || !!sectPr,
      breakBefore: onOff(child(pPr, 'w:pageBreakBefore')) === true,
    })
    if (sectPr) readSection(sectPr)
  }

  const walk = (n: XNode, inTable: boolean) => {
    for (const c of n.children) {
      if (c.name === 'w:p') readPara(c, inTable)
      else if (c.name === 'w:tbl') walk(c, true)
      else if (c.name === 'w:tr' || c.name === 'w:tc') walk(c, inTable)
      else if (c.name === 'w:sdt') {
        const gallery = val(find(c, 'w:docPartGallery'))
        if (gallery === 'Table of Contents') hasToc = true
        const content = child(c, 'w:sdtContent')
        if (content) walk(content, inTable)
      } else if (c.name === 'w:customXml') walk(c, inTable)
    }
  }
  walk(body, false)
  const finalSect = child(body, 'w:sectPr')
  if (finalSect) readSection(finalSect)

  // Title page: everything before the first page break, if it comes early.
  const firstBreak = paras.findIndex((p, i) => p.breaksPage || (i > 0 && p.breakBefore))
  const titleEnd = firstBreak < 0 ? -1 : paras[firstBreak].breaksPage ? firstBreak : firstBreak - 1
  if (titleEnd >= 0 && titleEnd < 60) {
    for (let i = 0; i <= titleEnd; i++) if (paras[i].kind !== 'empty' && paras[i].kind !== 'table') paras[i].kind = 'title'
  }

  return { paras, sections, hasToc }
}
