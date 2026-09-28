// Safe, offline reproductions of four auth findings. Run: node docs/security/2026-09-28/auth-poc.cjs
// Only the four allowlisted source files below are read. All application imports are mocked.
'use strict'

const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const ts = require('typescript')

const root = path.resolve(__dirname, '..', '..', '..')
const sources = Object.freeze({
  adminUsers: path.join(root, 'app', 'api', 'admin', 'users', '[id]', 'route.ts'),
  profile: path.join(root, 'app', 'api', 'profile', 'route.ts'),
  auth: path.join(root, 'lib', 'auth.ts'),
  rateLimit: path.join(root, 'lib', 'rate-limit.ts'),
})

function loadSource(name, dependencies) {
  assert.ok(Object.hasOwn(sources, name), `Source is not allowlisted: ${name}`)
  const source = fs.readFileSync(sources[name], 'utf8')
  const compiled = ts.transpileModule(source, {
    fileName: sources[name],
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  }).outputText
  const module = { exports: {} }
  const context = vm.createContext({
    module,
    exports: module.exports,
    require(id) {
      if (!Object.hasOwn(dependencies, id)) throw new Error(`Unexpected import: ${id}`)
      return dependencies[id]
    },
    process: { env: { NODE_ENV: 'test' } },
    setInterval: () => 0,
    console: { error() {}, warn() {}, log() {} },
  })
  new vm.Script(compiled, { filename: sources[name] }).runInContext(context)
  return module.exports
}

const nextResponse = {
  json(body, options = {}) {
    return { status: options.status ?? 200, json: async () => body }
  },
}
const isSuperAdminEmail = (email) =>
  typeof email === 'string' && email.trim().toLowerCase() === 'support@studyassist.ru'

async function proveAdminHashDisclosure() {
  const rows = new Map([
    ['admin-id', { id: 'admin-id', email: 'admin@example.test', isAdmin: true }],
    ['super-id', {
      id: 'super-id',
      email: 'support@studyassist.ru',
      isAdmin: true,
      name: 'Super Admin',
      phone: null,
      telegramId: null,
      passwordHash: 'MOCK_BCRYPT_HASH',
    }],
  ])
  const prisma = {
    user: {
      findUnique: async ({ where }) => rows.get(where.id) ?? null,
      findFirst: async () => null,
      update: async ({ where, data }) => {
        const current = rows.get(where.id)
        assert.ok(current, 'Mock target must exist')
        const updated = { ...current }
        for (const [key, value] of Object.entries(data)) {
          if (value !== undefined) updated[key] = value
        }
        rows.set(where.id, updated)
        return updated // Prisma update without select returns all scalar columns.
      },
    },
  }
  const { PATCH } = loadSource('adminUsers', {
    'next/server': { NextResponse: nextResponse },
    'next-auth': { getServerSession: async () => ({ user: { id: 'admin-id', isAdmin: true } }) },
    '@/lib/prisma': { prisma },
    '@/lib/auth': { authOptions: {} },
    '@/lib/roles': { isSuperAdminEmail, requireSuperAdmin: async () => { throw new Error('Unexpected call') } },
  })
  const response = await PATCH(
    { json: async () => ({ name: 'Super Admin', phone: null, telegramId: null }) },
    { params: { id: 'super-id' } },
  )
  const body = await response.json()
  assert.equal(response.status, 200)
  assert.equal(body.user.passwordHash, 'MOCK_BCRYPT_HASH')
  assert.equal(body.user.isAdmin, true)
  console.log('PASS admin PATCH exposes the mocked super-admin password hash')
}

async function proveStaleJwtRole() {
  let dbReads = 0
  const prisma = { user: { findUnique: async () => { dbReads++; return { isAdmin: false } } } }
  const { authOptions } = loadSource('auth', {
    'next-auth/providers/credentials': { __esModule: true, default: (config) => config },
    '@auth/prisma-adapter': { PrismaAdapter: () => ({}) },
    '@/lib/prisma': { prisma },
    bcryptjs: { __esModule: true, default: { compare: async () => false } },
    '@/lib/roles': { isSuperAdminEmail },
  })
  const oldJwt = { id: 'demoted-id', email: 'demoted@example.test', isAdmin: true, isSuperAdmin: false }
  const jwtAfterDemotion = await authOptions.callbacks.jwt({ token: oldJwt })
  const session = await authOptions.callbacks.session({ session: { user: {} }, token: jwtAfterDemotion })
  assert.equal(dbReads, 0)
  assert.equal(jwtAfterDemotion.isAdmin, true)
  assert.equal(session.user.isAdmin, true)
  console.log('PASS existing JWT retains isAdmin after mocked database demotion')
}

async function proveDirectTelegramBinding() {
  let updatedData
  const zodField = () => ({ min() { return this }, optional() { return this }, nullable() { return this } })
  const z = {
    string: zodField,
    object: (shape) => ({
      safeParse: (value) => {
        assert.ok(Object.hasOwn(shape, 'telegramId'), 'The actual schema must admit telegramId')
        assert.equal(typeof value.telegramId, 'string')
        return { success: true, data: { telegramId: value.telegramId } }
      },
    }),
  }
  const { PATCH } = loadSource('profile', {
    'next/server': { NextResponse: nextResponse },
    'next-auth': { getServerSession: async () => ({ user: { id: 'ordinary-user-id' } }) },
    zod: { z },
    '@/lib/prisma': {
      prisma: {
        user: {
          update: async ({ where, data }) => {
            assert.equal(where.id, 'ordinary-user-id')
            updatedData = data
            return { id: where.id, telegramId: data.telegramId }
          },
        },
      },
    },
    '@/lib/auth': { authOptions: {} },
  })
  const response = await PATCH({ json: async () => ({ telegramId: '987654321' }) })
  assert.equal(response.status, 200)
  assert.equal(updatedData.telegramId, '987654321')
  console.log('PASS ordinary profile PATCH writes an arbitrary Telegram chat ID')
}

function proveForwardedIpBypass() {
  const { getIP, rateLimit } = loadSource('rateLimit', {
    'next/server': { NextResponse: nextResponse },
  })
  const request = (firstIp) => ({
    headers: {
      get(name) {
        if (name === 'x-forwarded-for') return `${firstIp}, 203.0.113.10`
        if (name === 'x-real-ip') return '203.0.113.10'
        return null
      },
    },
  })
  for (let i = 1; i <= 7; i++) {
    const ip = getIP(request(`198.51.100.${i}`))
    assert.equal(ip, `198.51.100.${i}`)
    assert.equal(rateLimit(`poc:${ip}`, 5, 60_000).allowed, true)
  }
  const fixedIp = getIP(request('198.51.100.100'))
  for (let i = 0; i < 5; i++) assert.equal(rateLimit(`poc:${fixedIp}`, 5, 60_000).allowed, true)
  assert.equal(rateLimit(`poc:${fixedIp}`, 5, 60_000).allowed, false)
  console.log('PASS rotating the first forwarded IP bypasses a five-request limit')
}

async function main() {
  await proveAdminHashDisclosure()
  await proveStaleJwtRole()
  await proveDirectTelegramBinding()
  proveForwardedIpBypass()
}

main().catch((error) => {
  console.error(error.message)
  process.exitCode = 1
})
