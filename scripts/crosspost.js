// scripts/crosspost.js
// Posts blog notes from content/blog to the Telegram channel and the VK community
// once their date has come. Run by cron on the server every 10 minutes:
//   */10 * * * * cd /path/to/site && /path/to/node scripts/crosspost.js >> ~/crosspost.log 2>&1
// Env (.env): TELEGRAM_BOT_TOKEN, TELEGRAM_CHANNEL_ID, VK_WALL_TOKEN, VK_GROUP_ID, NEXTAUTH_URL.
// A network with missing env is skipped. What was posted is kept in ~/.studyassist-crossposted.json.
const fs = require('fs')
const os = require('os')
const path = require('path')

const DIR = path.join(__dirname, '..', 'content', 'blog')
const STATE = path.join(os.homedir(), '.studyassist-crossposted.json')
// Only notes dated within this window are posted, so a lost state file can't flood the channels.
const WINDOW_MS = 2 * 24 * 60 * 60 * 1000

function loadEnv(filePath) {
  try {
    for (const line of fs.readFileSync(filePath, 'utf8').split('\n')) {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
      if (!m) continue
      let v = m[2].trim()
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1)
      if (!process.env[m[1]]) process.env[m[1]] = v
    }
  } catch (err) {
    console.error('[crosspost] loadEnv error:', err.message)
  }
}

// ponytail: same header format as lib/blog-files.ts parseNote (checked by lib/blog-files.test.ts).
function parseHeader(raw) {
  const m = raw.match(/^\s*<!--([\s\S]*?)-->/)
  if (!m) return null
  const meta = {}
  for (const line of m[1].split('\n')) {
    const i = line.indexOf(':')
    if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim()
  }
  const date = new Date(meta.date)
  if (!meta.title || isNaN(date.getTime())) return null
  return { title: meta.title, excerpt: meta.excerpt || '', date }
}

function dueNotes(now, state) {
  let names = []
  try { names = fs.readdirSync(DIR) } catch { return [] }
  return names
    .filter((n) => /^[a-z0-9-]+\.html$/.test(n))
    .map((n) => ({ slug: n.slice(0, -5), ...parseHeader(fs.readFileSync(path.join(DIR, n), 'utf8')) }))
    .filter((n) => n.title && n.date <= now && now - n.date < WINDOW_MS)
    .filter((n) => !(state[n.slug] && state[n.slug].tg && state[n.slug].vk))
}

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

async function postTelegram(note, url) {
  const { TELEGRAM_BOT_TOKEN: token, TELEGRAM_CHANNEL_ID: chat } = process.env
  const text = `<b>${esc(note.title)}</b>\n\n${esc(note.excerpt)}\n\n${url}`
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chat, text, parse_mode: 'HTML' }),
  })
  const data = await res.json()
  if (!data.ok) throw new Error(data.description)
}

async function postVk(note, url) {
  const body = new URLSearchParams({
    owner_id: `-${process.env.VK_GROUP_ID}`,
    from_group: '1',
    message: `${note.title}\n\n${note.excerpt}\n\n${url}`,
    attachments: url,
    access_token: process.env.VK_WALL_TOKEN,
    v: '5.199',
  })
  const res = await fetch('https://api.vk.com/method/wall.post', { method: 'POST', body })
  const data = await res.json()
  if (data.error) throw new Error(data.error.error_msg)
}

async function main() {
  loadEnv(path.join(__dirname, '..', '.env'))
  const env = process.env
  const base = (env.NEXTAUTH_URL || 'https://studyassist.ru').replace(/\/$/, '')
  const nets = {
    tg: env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHANNEL_ID ? postTelegram : null,
    vk: env.VK_WALL_TOKEN && env.VK_GROUP_ID ? postVk : null,
  }
  let state = {}
  try { state = JSON.parse(fs.readFileSync(STATE, 'utf8')) } catch {}

  for (const note of dueNotes(new Date(), state)) {
    const done = (state[note.slug] = state[note.slug] || {})
    const url = `${base}/blog/${note.slug}`
    for (const [net, post] of Object.entries(nets)) {
      if (done[net]) continue
      if (!post) { done[net] = 'skipped'; continue }
      try {
        await post(note, url)
        done[net] = true
        console.log(`[crosspost] ${net} ok: ${note.slug}`)
      } catch (err) {
        console.error(`[crosspost] ${net} failed: ${note.slug}: ${err.message}`) // retried next run
      }
    }
    fs.writeFileSync(STATE, JSON.stringify(state, null, 2))
  }
}

if (require.main === module) main()
module.exports = { parseHeader }
