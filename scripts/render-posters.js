// scripts/render-posters.js — renders poster SVGs to PNG (1080×1080) for Telegram/VK.
//   node scripts/render-posters.js [dir ...]     default: content/social
// For every <name>.svg writes <name>.png next to it. Fonts come only from scripts/poster-fonts
// (Press Start 2P, Tiny5, JetBrains Mono — all with Cyrillic), so the result is the same everywhere.
// Exits with code 1 if an SVG fails to render.
const fs = require('fs')
const path = require('path')
const { Resvg } = require('@resvg/resvg-js')

const FONT_DIR = path.join(__dirname, 'poster-fonts')
const fontFiles = fs.readdirSync(FONT_DIR).filter((f) => f.endsWith('.ttf')).map((f) => path.join(FONT_DIR, f))

function render(svgPath) {
  const svg = fs.readFileSync(svgPath, 'utf8')
  const png = new Resvg(svg, {
    fitTo: { mode: 'width', value: 1080 },
    font: { fontFiles, loadSystemFonts: false, defaultFontFamily: 'JetBrains Mono' },
  }).render().asPng()
  const out = svgPath.replace(/\.svg$/, '.png')
  fs.writeFileSync(out, png)
  return out
}

if (require.main === module) {
  const dirs = process.argv.slice(2).length ? process.argv.slice(2) : [path.join(__dirname, '..', 'content', 'social')]
  let failed = false
  for (const dir of dirs) {
    let names = []
    try { names = fs.readdirSync(dir) } catch { continue }
    for (const n of names.filter((n) => n.endsWith('.svg'))) {
      try {
        console.log('ok', render(path.join(dir, n)))
      } catch (err) {
        failed = true
        console.error('FAIL', n, err.message)
      }
    }
  }
  process.exit(failed ? 1 : 0)
}

module.exports = { render }
