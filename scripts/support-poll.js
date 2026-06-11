// scripts/support-poll.js
// Polls support bot updates via getUpdates and forwards to local webhook handler.
// Replaces webhook delivery (broken due to Telegram DC routing issue for this bot token).
const path = require('path')
const fs = require('fs')
const http = require('http')
const TelegramBot = require('node-telegram-bot-api')

function loadEnv(filePath) {
  try {
    const lines = fs.readFileSync(filePath, 'utf8').split('\n')
    for (const line of lines) {
      const match = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
      if (!match) continue
      const key = match[1]
      let value = match[2].trim()
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1)
      }
      if (!process.env[key]) process.env[key] = value
    }
  } catch (err) {
    console.error('[support-poll] loadEnv error:', err.message)
  }
}

loadEnv(path.join(__dirname, '..', '.env'))

const token = process.env.SUPPORT_BOT_TOKEN
if (!token) {
  console.error('[support-poll] SUPPORT_BOT_TOKEN not set — exit')
  process.exit(1)
}

const bot = new TelegramBot(token, { polling: false })
let offset = 0

function forwardToWebhook(update) {
  return new Promise((resolve) => {
    const body = JSON.stringify(update)
    const req = http.request(
      {
        hostname: 'localhost',
        port: 3000,
        path: '/api/telegram/webhook',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
      },
      (res) => {
        console.log('[support-poll] update_id=%d → status %d', update.update_id, res.statusCode)
        res.resume()
        resolve()
      }
    )
    req.on('error', (err) => {
      console.error('[support-poll] forward error:', err.message)
      resolve()
    })
    req.write(body)
    req.end()
  })
}

async function ensureNoWebhook() {
  try {
    const info = await bot.getWebHookInfo()
    if (info.url) {
      console.log('[support-poll] webhook active (%s), deleting', info.url)
      await bot.deleteWebHook()
      console.log('[support-poll] webhook deleted')
    }
  } catch (err) {
    console.error('[support-poll] ensureNoWebhook error:', err.message)
  }
}

async function poll() {
  try {
    const updates = await bot.getUpdates({ offset, limit: 10, timeout: 25 })
    for (const update of updates) {
      offset = update.update_id + 1
      await forwardToWebhook(update)
    }
  } catch (err) {
    const msg = err.message || ''
    if (msg.includes('Conflict') || msg.includes('webhook')) {
      console.warn('[support-poll] webhook conflict — deleting webhook')
      await ensureNoWebhook()
    } else {
      console.error('[support-poll] getUpdates error:', msg)
    }
  }
  setTimeout(poll, 3000)
}

async function main() {
  console.log('[support-poll] starting — forwarding to http://localhost:3000/api/telegram/webhook')
  await ensureNoWebhook()
  poll()
}

main()
