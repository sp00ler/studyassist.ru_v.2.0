#!/usr/bin/env node
'use strict'

// Safe regression/behavior harness for the Telegram webhook trust boundary.
// Loads the repository's actual TypeScript route and handler, while stubbing
// Prisma, Telegram, filesystem, date utilities, and every other dependency.
// It never reads environment files, contacts external services, or writes data.

const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const ts = require('typescript')

const root = path.resolve(__dirname, '../../..')
const sourceAllowlist = new Set([
  'lib/telegram-handler.ts',
  'app/api/telegram/webhook/route.ts',
])
const createdMessages = []
const telegramCalls = []

const prismaStub = {
  chatMessage: {
    async create(args) {
      createdMessages.push(args)
      return { id: 'synthetic-message', ...args.data, createdAt: new Date(0) }
    },
  },
  user: { async findFirst() { return null } },
  order: {},
}

class TelegramBotStub {
  constructor(token, options) {
    assert.equal(token, 'synthetic-test-token')
    assert.equal(options.polling, false)
    assert.equal(Object.keys(options).length, 1)
  }
  async sendMessage(...args) { telegramCalls.push(args); return { message_id: 1 } }
  async answerCallbackQuery(...args) { telegramCalls.push(args) }
}

const dependencyStubs = new Map([
  ['node-telegram-bot-api', { __esModule: true, default: TelegramBotStub }],
  ['@/lib/prisma', { prisma: prismaStub }],
  ['@/lib/utils', {
    formatOrderId: value => String(value),
    getStatusLabel: value => String(value),
    getOrderTypeLabel: value => String(value),
  }],
  ['@/lib/email', {
    sendNewOrderEmail: async () => {}, sendStatusUpdateEmail: async () => {},
    sendPaymentLinkEmail: async () => {}, sendWorkCompletedEmail: async () => {},
  }],
  ['@/lib/telegram', {
    sendNewOrderNotification: async () => {}, sendStatusUpdateNotification: async () => {},
    sendPaymentLinkNotification: async () => {}, sendWorkCompletedNotification: async () => {},
  }],
  ['@/lib/yukassa', { createPayment: async () => ({}) }],
  ['date-fns', {
    format: () => 'date', parse: () => new Date(0), isValid: () => false,
    addDays: () => new Date(0),
  }],
  ['date-fns/locale', { ru: {} }],
  ['fs/promises', {
    async writeFile() { throw new Error('filesystem access denied by harness') },
    async mkdir() { throw new Error('filesystem access denied by harness') },
  }],
  ['path', { __esModule: true, default: { join() { throw new Error('path use denied by harness') } } }],
  ['os', { __esModule: true, default: { tmpdir() { throw new Error('OS temp path denied by harness') } } }],
])

function loadActualTs(relativePath, extraStubs = new Map()) {
  if (!sourceAllowlist.has(relativePath)) {
    throw new Error(`Harness denied source outside allowlist: ${relativePath}`)
  }
  const source = fs.readFileSync(path.join(root, relativePath), 'utf8')
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText
  const module = { exports: {} }
  const allowedStubs = new Map([...dependencyStubs, ...extraStubs])
  const safeRequire = name => {
    if (!allowedStubs.has(name)) throw new Error(`Harness denied unrecognized import: ${name}`)
    return allowedStubs.get(name)
  }
  const isolatedProcess = { env: { TELEGRAM_BOT_TOKEN: 'synthetic-test-token' } }
  const sandbox = vm.createContext({
    require: safeRequire,
    module,
    exports: module.exports,
    process: isolatedProcess,
    console: Object.freeze({ log() {}, info() {}, warn() {}, error() {} }),
  })
  assert.equal(vm.runInContext('typeof fetch', sandbox), 'undefined', 'source VM must not expose fetch')
  new vm.Script(compiled, { filename: relativePath }).runInContext(sandbox, { timeout: 1000 })
  return module.exports
}

async function main() {
  const handler = loadActualTs('lib/telegram-handler.ts')
  const nextServerStub = {
    NextResponse: { json(body, init = {}) { return { body, status: init.status ?? 200 } } },
  }
  const route = loadActualTs('app/api/telegram/webhook/route.ts', new Map([
    ['next/server', nextServerStub],
    ['@/lib/telegram-handler', handler],
  ]))

  const syntheticUpdate = {
    update_id: 424242,
    message: {
      message_id: 7,
      date: 0,
      chat: { id: -100123456, type: 'supergroup' },
      from: { id: 987654321, is_bot: false, first_name: 'Synthetic non-admin' },
      reply_to_message: { message_id: 6, text: 'Support thread [session:synthetic-session]' },
      text: 'Synthetic forged support reply',
    },
  }

  const requestWithoutTelegramSecret = {
    headers: { get() { return null } },
    async json() { return syntheticUpdate },
  }
  const response = await route.POST(requestWithoutTelegramSecret)
  await new Promise(resolve => setImmediate(resolve))

  assert.equal(response.status, 200)
  assert.equal(JSON.stringify(response.body), JSON.stringify({ ok: true }))
  assert.equal(createdMessages.length, 1)
  assert.equal(JSON.stringify(createdMessages[0].data), JSON.stringify({
    sessionId: 'synthetic-session',
    text: 'Synthetic forged support reply',
    fromAdmin: true,
  }))
  assert.equal(telegramCalls.length, 0, 'the fake update must not send Telegram API messages')

  console.log('PASS: actual webhook accepted a synthetic update with no Telegram secret header.')
  console.log('PASS: actual handler persisted its reply as fromAdmin=true for the marker session.')
  console.log('LIMIT: in-memory stubs only; no real database, Telegram, network, or production data used.')
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
