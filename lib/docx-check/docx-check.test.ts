import { readFileSync } from 'fs'
import path from 'path'
import { describe, expect, it } from 'vitest'
import { analyzeDocx, checkDocument } from './index'
import { buildModel } from './model'
import { parseXml } from './xml'

const W = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"'

const STYLES = `<?xml version="1.0" encoding="UTF-8"?><w:styles ${W}>
<w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:asciiTheme="minorHAnsi" w:hAnsiTheme="minorHAnsi"/><w:sz w:val="22"/></w:rPr></w:rPrDefault>
<w:pPrDefault><w:pPr><w:spacing w:after="160" w:line="259" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>
<w:style w:type="paragraph" w:default="1" w:styleId="a"><w:name w:val="Normal"/><w:pPr><w:spacing w:after="0" w:line="360" w:lineRule="auto"/><w:ind w:firstLine="709"/><w:jc w:val="both"/></w:pPr><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="28"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="1"><w:name w:val="heading 1"/><w:basedOn w:val="a"/><w:pPr><w:ind w:firstLine="0"/><w:jc w:val="center"/><w:outlineLvl w:val="0"/></w:pPr><w:rPr><w:b/></w:rPr></w:style>
</w:styles>`

const THEME = '<a:theme><a:minorFont><a:latin typeface="Calibri"/></a:minorFont></a:theme>'

const SECT = `<w:sectPr><w:headerReference w:type="default" r:id="rIdH"/><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="850" w:bottom="1134" w:left="1701"/><w:titlePg/></w:sectPr>`

const HEADER = `<w:hdr ${W}><w:p><w:r><w:fldChar w:fldCharType="begin"/></w:r><w:r><w:instrText xml:space="preserve"> PAGE   \\* MERGEFORMAT </w:instrText></w:r></w:p></w:hdr>`

const p = (text: string, pPr = '', rPr = '') => `<w:p><w:pPr>${pPr}</w:pPr><w:r><w:rPr>${rPr}</w:rPr><w:t xml:space="preserve">${text}</w:t></w:r></w:p>`
const long = 'Основной текст работы, достаточно длинный, чтобы не считаться короткой строкой или заголовком.'

function doc(bodyXml: string) {
  return new Map([
    ['word/document.xml', `<w:document ${W}><w:body>${bodyXml}${SECT}</w:body></w:document>`],
    ['word/styles.xml', STYLES],
    ['word/theme/theme1.xml', THEME],
    ['word/_rels/document.xml.rels', '<Relationships><Relationship Id="rIdH" Target="header1.xml"/></Relationships>'],
    ['word/header1.xml', HEADER],
  ])
}

const GOST = {
  marginTop: 20, marginRight: 15, marginBottom: 20, marginLeft: 30,
  font: 'Times New Roman', size: 14, line: 1.5, indent: 1.25, align: 'both' as const,
  pageNumber: 'top' as const, noNumberOnTitle: true,
}

describe('parseXml', () => {
  it('reads attributes, nesting and entities', () => {
    const root = parseXml('<?xml version="1.0"?><a x="1 &amp; 2"><b/><c>т&lt;т</c></a>')
    const a = root.children[0]
    expect(a.attrs.x).toBe('1 & 2')
    expect(a.children.map((c) => c.name)).toEqual(['b', 'c'])
    expect(a.children[1].text).toBe('т<т')
  })
})

describe('buildModel + checkDocument', () => {
  it('a document matching the requirements has no issues', () => {
    const toc = '<w:p><w:r><w:instrText xml:space="preserve"> TOC \o "1-3" \h </w:instrText></w:r></w:p>'
    const r = checkDocument(buildModel(doc(toc + p('ВВЕДЕНИЕ', '<w:pStyle w:val="1"/>') + p(long) + p(long))), GOST)
    expect(r.issues).toEqual([])
    expect(r.checkedParagraphs).toBe(2)
  })

  it('finds pasted Arial text, wrong size and wrong spacing with the paragraph snippet', () => {
    const body = p(long) + p('Текст из интернета со своим шрифтом и размером, вставленный как есть.', '<w:spacing w:line="240" w:lineRule="auto"/>', '<w:rFonts w:ascii="Arial" w:hAnsi="Arial"/><w:sz w:val="24"/>')
    const r = checkDocument(buildModel(doc(body)), GOST)
    const titles = r.issues.map((i) => i.title)
    expect(titles).toContain('Шрифт «Arial» вместо «Times New Roman»')
    expect(titles).toContain('Размер шрифта 12 пт вместо 14 пт')
    expect(titles).toContain('Междустрочный интервал 1 вместо 1,5')
    expect(r.issues[0].where[0]).toMatch(/^Текст из интернета/)
  })

  it('resolves theme fonts from document defaults', () => {
    const body = `<w:p><w:pPr><w:pStyle w:val="none"/></w:pPr><w:r><w:rPr><w:rFonts w:asciiTheme="minorHAnsi" w:hAnsiTheme="minorHAnsi"/></w:rPr><w:t>${long}</w:t></w:r></w:p>`
    const r = checkDocument(buildModel(doc(body)), { font: 'Times New Roman' })
    expect(r.issues.map((i) => i.title)).toContain('Шрифт «Calibri» вместо «Times New Roman»')
  })

  it('checks only the fields the student filled in', () => {
    const body = p(long, '<w:jc w:val="left"/><w:ind w:firstLine="0"/>', '<w:rFonts w:ascii="Arial" w:hAnsi="Arial"/>')
    expect(checkDocument(buildModel(doc(body)), {}).issues).toEqual([])
  })

  it('reports wrong margins, page number position and a numbered title page', () => {
    const files = doc(p(long))
    files.set('word/document.xml', files.get('word/document.xml')!.replace('<w:titlePg/>', '').replace('w:right="850"', 'w:right="567"'))
    const titles = checkDocument(buildModel(files), { ...GOST, pageNumber: 'bottom' }).issues.map((i) => i.title)
    expect(titles).toContain('Правое поле 10 мм, требуется 15 мм')
    expect(titles).toContain('Номер страницы вверху, требуется внизу')
    expect(titles).toContain('На титульном листе будет стоять номер страницы')
  })

  it('flags empty-line spacing, leading spaces, double spaces and fake headings', () => {
    const body =
      p(long) + p('') + p('') + p('') +
      p('   Абзац с отступом пробелами и достаточно длинным текстом для проверки.') +
      p('Текст  с двойным пробелом внутри и достаточно длинный для основного текста.') +
      p('ГЛАВА 2. АНАЛИЗ', '<w:jc w:val="center"/>', '<w:b/>')
    const r = checkDocument(buildModel(doc(body)), {})
    const titles = r.issues.map((i) => i.title)
    expect(titles).toContain('Несколько пустых строк подряд (страница «добита» Enter\'ами)')
    expect(titles).toContain('Отступ в начале абзаца сделан пробелами или табуляцией')
    expect(titles).toContain('Двойные пробелы внутри текста')
    expect(titles.some((t) => t.startsWith('Похоже на заголовок'))).toBe(true)
  })

  it('skips the title page before the first page break', () => {
    const title = p('МИНИСТЕРСТВО НАУКИ', '<w:jc w:val="center"/>', '<w:rFonts w:ascii="Arial" w:hAnsi="Arial"/>') +
      '<w:p><w:r><w:br w:type="page"/></w:r></w:p>'
    const r = checkDocument(buildModel(doc(title + p(long))), GOST)
    expect(r.issues).toEqual([])
    expect(r.notes.join(' ')).toMatch(/Титульный лист/)
  })
})

describe('analyzeDocx on the real «Чистый лист» template', () => {
  it('unzips and reads the template page setup', async () => {
    const buf = readFileSync(path.join(__dirname, '../../public/templates/chistyy-list-word-po-gostu.docx'))
    const model = await analyzeDocx(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength))
    const s = model.sections[model.sections.length - 1]
    expect(Math.round(s.margins.left)).toBe(30)
    expect(Math.round(s.margins.right)).toBe(10)
    expect(s.pageNumber.top).toBe(true)
    expect(s.firstPageNumbered).toBe(false)
    const r = checkDocument(model, { marginLeft: 30, marginRight: 10, marginTop: 20, marginBottom: 20, pageNumber: 'top', noNumberOnTitle: true })
    expect(r.issues).toEqual([])
  })

  it('rejects files that are not zip archives', async () => {
    await expect(analyzeDocx(new TextEncoder().encode('{\\rtf1 not a docx}').buffer)).rejects.toThrow()
  })
})
