// scripts/crosspost.js — run every 10 min by scripts/blog-auto.sh on the server.
// 1. Open PR into blog-content on GitHub (weekly content) → once, a link to the owner's Telegram chat.
// 2. Blog note (content/blog/<slug>.html) whose date has come → announced in the Telegram channel and VK.
// 3. Social post (content/social/<YYYY-MM-DD>.txt) whose date has come → posted to the Telegram channel and VK.
// Env (.env): TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, TELEGRAM_CHANNEL_ID, VK_WALL_TOKEN, VK_GROUP_ID, NEXTAUTH_URL.
// A network with missing env is skipped. State is kept in ~/.studyassist-crossposted.json.
//
// Social post file:
//   date: 2026-10-15T06:30:00+03:00
//   link: /gid/kak-napisat-otchet-po-praktike      (optional, path on the site)
//   ---
//   Text of the post (plain text, no HTML).
const fs = require('fs')
const os = require('os')
const path = require('path')

const REPO = 'sp00ler/studyassist.ru_v.2.0'
const BRANCH = 'blog-content'
// Same roots as lib/blog-files.ts: the repo itself + the blog-content clone next to the site.
const ROOTS = [path.join(__dirname, '..'), path.join(__dirname, '..', '..', 'studyassist-blog')]
const STATE = path.join(os.homedir(), '.studyassist-crossposted.json')
// Only items dated within this window are posted, so a lost state file can't flood the channels.
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

function readMeta(block) {
  const meta = {}
  for (const line of block.split('\n')) {
    const i = line.indexOf(':')
    if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim()
  }
  return meta
}

// ponytail: same header format as lib/blog-files.ts parseNote (checked by lib/blog-files.test.ts).
function parseHeader(raw) {
  const m = raw.match(/^\s*<!--([\s\S]*?)-->/)
  if (!m) return null
  const meta = readMeta(m[1])
  const date = new Date(meta.date)
  if (!meta.title || isNaN(date.getTime())) return null
  return { title: meta.title, excerpt: meta.excerpt || '', date }
}

function parseSocial(raw) {
  const i = raw.indexOf('\n---')
  if (i < 0) return null
  const meta = readMeta(raw.slice(0, i))
  const text = raw.slice(raw.indexOf('\n', i + 1) + 1).trim()
  const date = new Date(meta.date)
  if (!text || isNaN(date.getTime())) return null
  return { date, link: meta.link || '', text }
}

// Files from all roots, first root wins on a name clash.
function readItems(sub, re, parse) {
  const byName = new Map()
  for (const root of ROOTS) {
    let names = []
    try { names = fs.readdirSync(path.join(root, sub)) } catch { continue }
    for (const n of names) {
      if (!re.test(n) || byName.has(n)) continue
      const file = path.join(root, sub, n)
      const item = parse(fs.readFileSync(file, 'utf8'))
      const poster = file.replace(/\.\w+$/, '.png')
      if (item) byName.set(n, { ...item, key: `${sub}/${n}`, poster: fs.existsSync(poster) ? poster : '' })
    }
  }
  return Array.from(byName.values())
}

function allItems(base) {
  const notes = readItems('content/blog', /^[a-z0-9-]+\.html$/, parseHeader).map((n) => {
    const url = `${base}/blog/${path.basename(n.key, '.html')}`
    return { key: n.key, date: n.date, url, text: `${n.title}\n\n${n.excerpt}`, bold: n.title, poster: n.poster }
  })
  const social = readItems('content/social', /^\d{4}-\d{2}-\d{2}\.txt$/, parseSocial).map((s) => ({
    key: s.key, date: s.date, url: s.link ? base + s.link : '', text: s.text, poster: s.poster,
  }))
  return [...notes, ...social]
}

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

async function sendTelegram(chat, html) {
  const res = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chat, text: html, parse_mode: 'HTML' }),
  })
  const data = await res.json()
  if (!data.ok) throw new Error(data.description)
}

const pngBlob = (file) => new Blob([fs.readFileSync(file)], { type: 'image/png' })

// Telegram photo captions are limited to 1024 chars: a longer post goes as photo + separate message.
async function postTelegram(item) {
  const chat = process.env.TELEGRAM_CHANNEL_ID
  let html = esc(item.text)
  if (item.bold) html = html.replace(esc(item.bold), `<b>${esc(item.bold)}</b>`)
  if (item.url) html += `\n\n${item.url}`
  if (!item.poster) return sendTelegram(chat, html)

  const form = new FormData()
  form.append('chat_id', chat)
  form.append('photo', pngBlob(item.poster), 'poster.png')
  const fits = html.length <= 1024
  if (fits) {
    form.append('caption', html)
    form.append('parse_mode', 'HTML')
  }
  const res = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendPhoto`, { method: 'POST', body: form })
  const data = await res.json()
  if (!data.ok) throw new Error(data.description)
  if (!fits) await sendTelegram(chat, html)
}

async function vk(method, params) {
  const body = new URLSearchParams({ ...params, access_token: process.env.VK_WALL_TOKEN, v: '5.199' })
  const res = await fetch(`https://api.vk.com/method/${method}`, { method: 'POST', body })
  const data = await res.json()
  if (data.error) throw new Error(`${method}: ${data.error.error_msg}`)
  return data.response
}

// Wall photo: get upload URL → upload the file → save → attach as photo<owner>_<id>.
async function vkWallPhoto(file) {
  const group_id = process.env.VK_GROUP_ID
  const { upload_url } = await vk('photos.getWallUploadServer', { group_id })
  const form = new FormData()
  form.append('photo', pngBlob(file), 'poster.png')
  const up = await (await fetch(upload_url, { method: 'POST', body: form })).json()
  const [photo] = await vk('photos.saveWallPhoto', { group_id, server: up.server, photo: up.photo, hash: up.hash })
  return `photo${photo.owner_id}_${photo.id}`
}

async function postVk(item) {
  const attachments = item.poster ? await vkWallPhoto(item.poster) : item.url
  await vk('wall.post', {
    owner_id: `-${process.env.VK_GROUP_ID}`,
    from_group: '1',
    message: item.url ? `${item.text}\n\n${item.url}` : item.text,
    ...(attachments ? { attachments } : {}),
  })
}

// Public repo: unauthenticated GitHub API (60 req/h) is enough for one call per 10 min.
async function notifyOpenPrs(state) {
  const res = await fetch(`https://api.github.com/repos/${REPO}/pulls?base=${BRANCH}&state=open`, {
    headers: { 'User-Agent': 'studyassist-crosspost', Accept: 'application/vnd.github+json' },
  })
  if (!res.ok) throw new Error(`GitHub ${res.status}`)
  state.prs = state.prs || {}
  for (const pr of await res.json()) {
    if (state.prs[pr.number]) continue
    await sendTelegram(process.env.TELEGRAM_CHAT_ID, [
      `📝 <b>Контент на неделю готов</b> — PR #${pr.number}`,
      esc(pr.title),
      `Посмотрите и нажмите <b>Merge pull request</b> до среды 06:30 МСК:\n${pr.html_url}`,
      'После слияния всё выйдет само: заметка на сайте в среду, посты в Telegram и VK — каждый день.',
    ].join('\n\n'))
    state.prs[pr.number] = true
    console.log(`[crosspost] PR notice sent: #${pr.number}`)
  }
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
  state.posted = state.posted || {}
  const save = () => fs.writeFileSync(STATE, JSON.stringify(state, null, 2))

  if (env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID) {
    try { await notifyOpenPrs(state) } catch (err) { console.error(`[crosspost] PR check failed: ${err.message}`) }
    save()
  }

  const now = new Date()
  const due = allItems(base)
    .filter((it) => it.date <= now && now - it.date < WINDOW_MS)
    .sort((a, b) => a.date - b.date)
  for (const item of due) {
    const done = (state.posted[item.key] = state.posted[item.key] || {})
    for (const [net, post] of Object.entries(nets)) {
      if (done[net]) continue
      if (!post) { done[net] = 'skipped'; continue }
      try {
        await post(item)
        done[net] = true
        console.log(`[crosspost] ${net} ok: ${item.key}`)
      } catch (err) {
        console.error(`[crosspost] ${net} failed: ${item.key}: ${err.message}`) // retried next run
      }
    }
    save()
  }
}

if (require.main === module) main()
module.exports = { parseHeader, parseSocial }
