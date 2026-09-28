// Read-only, isolated regression evidence for three commerce/file findings.
// Run: node docs/security/2026-09-28/commerce-poc.cjs
// Only the three allowlisted TypeScript source files are read from this repo.
// Application fs, Prisma, payment provider, and Next modules are all mocks.

const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const ts = require('typescript')

const repoRoot = path.resolve(__dirname, '../../..')
const sourceFiles = new Set([
  'app/api/upload/route.ts',
  'app/api/payments/webhook/route.ts',
  'lib/file-storage.ts',
])

// Exercise both production-style POSIX and Windows paths with synthetic roots.
const virtualProfiles = [
  { name: 'POSIX', path: path.posix, cwd: '/audit-app', tmp: '/audit-tmp' },
  { name: 'Windows', path: path.win32, cwd: 'C:\\audit-app', tmp: 'C:\\audit-tmp' },
]

function loadActualSource(relativePath, imports, profile = virtualProfiles[0]) {
  assert.ok(sourceFiles.has(relativePath), `Source is not allowlisted: ${relativePath}`)
  const sourcePath = path.join(repoRoot, ...relativePath.split('/'))
  const source = fs.readFileSync(sourcePath, 'utf8')
  const compiled = ts.transpileModule(source, {
    fileName: sourcePath,
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  }).outputText

  const module = { exports: {} }
  const sandbox = {
    module,
    exports: module.exports,
    require(specifier) {
      assert.ok(Object.hasOwn(imports, specifier), `Unexpected import: ${specifier}`)
      return imports[specifier]
    },
    process: Object.freeze({ cwd: () => profile.cwd, env: Object.freeze({}) }),
    Buffer,
    File: MockFile,
    console: Object.freeze({ log() {}, warn() {}, error() {} }),
  }
  vm.runInNewContext(compiled, sandbox, { filename: relativePath, timeout: 1000 })
  return module.exports
}

class MockFile {
  constructor(name, type, bytes) {
    this.name = name
    this.type = type
    this.bytes = Uint8Array.from(bytes)
    this.size = this.bytes.length
  }

  async arrayBuffer() {
    return this.bytes.slice().buffer
  }
}

const NextResponse = {
  json(body, options = {}) {
    return { status: options.status || 200, body }
  },
}

async function checkUploadTraversal(profile) {
  const virtualPath = profile.path
  const virtualTmp = profile.tmp
  const files = new Map()
  const removed = []
  const fsPromises = {
    constants: { W_OK: 2 },
    async mkdir() {},
    async access() {},
    async writeFile(filename, bytes) {
      files.set(virtualPath.normalize(filename), Buffer.from(bytes))
    },
    async readFile(filename) {
      const contents = files.get(virtualPath.normalize(filename))
      if (!contents) throw new Error('Mock chunk missing')
      return contents
    },
    async rm(filename, options) {
      removed.push({ filename: virtualPath.normalize(filename), options })
    },
  }
  const route = loadActualSource('app/api/upload/route.ts', {
    'next/server': { NextResponse },
    path: virtualPath,
    os: { tmpdir: () => virtualTmp },
    'fs/promises': fsPromises,
    '@/lib/rate-limit': {
      getIP: () => 'mock-client',
      rateLimit: () => ({ allowed: true }),
      rateLimitResponse: () => { throw new Error('Unexpected rate limit') },
    },
  }, profile)

  const fields = new Map([
    ['orderId', 'aaaaaaaaaa'],
    ['uploadId', '../victim-dir'],
    ['fileName', 'note.txt'],
    ['chunkIndex', '0'],
    ['totalChunks', '1'],
    ['chunk', new MockFile('chunk', 'text/plain', [0x78])],
  ])
  const response = await route.POST({
    formData: async () => ({
      get: (key) => fields.get(key) ?? null,
      getAll: () => [],
    }),
  })

  const chunkRoot = virtualPath.join(virtualTmp, 'studyassist-upload-chunks')
  const victimDir = virtualPath.join(virtualTmp, 'victim-dir')
  assert.equal(response.status, 200)
  assert.equal(removed.length, 1)
  assert.equal(removed[0].filename, victimDir)
  assert.equal(removed[0].options.recursive, true)
  assert.equal(removed[0].options.force, true)
  assert.ok(virtualPath.relative(chunkRoot, victimDir).startsWith('..'))
  assert.ok(files.has(virtualPath.join(victimDir, '0.part')))
  console.log(`PASS upload (${profile.name}): real route called mocked recursive, forced rm outside chunk root`)
}

async function checkPaymentOrderSwap() {
  const ownPayment = { yukassaId: 'own-succeeded-payment', orderId: 'own-order', amount: 100, status: 'pending' }
  const target = { id: 'target-order', price: 10000, status: 'awaiting_payment' }
  let paymentUpdates = 0
  let orderUpdates = 0
  let providerLookups = 0
  const prisma = {
    payment: {
      async updateMany({ where, data }) {
        paymentUpdates++
        if (where.yukassaId === ownPayment.yukassaId) {
          ownPayment.status = data.status
          return { count: 1 }
        }
        return { count: 0 }
      },
    },
    order: {
      async update({ where, data }) {
        orderUpdates++
        assert.equal(where.id, target.id)
        Object.assign(target, data)
        return target
      },
    },
  }
  const route = loadActualSource('app/api/payments/webhook/route.ts', {
    'next/server': { NextResponse },
    '@/lib/prisma': { prisma },
    '@/lib/yukassa': {
      getPaymentStatus: async (id) => {
        providerLookups++
        return id === ownPayment.yukassaId ? 'succeeded' : 'canceled'
      },
    },
  })
  const response = await route.POST({
    text: async () => JSON.stringify({
      type: 'payment.succeeded',
      object: { id: ownPayment.yukassaId, metadata: { orderId: target.id } },
    }),
  })

  assert.equal(response.status, 200)
  assert.equal(ownPayment.orderId, 'own-order')
  assert.equal(ownPayment.amount, 100)
  assert.equal(ownPayment.status, 'succeeded')
  assert.equal(target.price, 10000)
  assert.equal(target.status, 'paid')
  console.log('PASS payment: real webhook marks another, higher-priced order paid')

  const providerShapedResponse = await route.POST({
    text: async () => JSON.stringify({
      type: 'notification',
      event: 'payment.succeeded',
      object: { id: ownPayment.yukassaId, metadata: { orderId: target.id } },
    }),
  })
  assert.equal(providerShapedResponse.status, 200)
  assert.equal(paymentUpdates, 1)
  assert.equal(orderUpdates, 1)
  assert.equal(providerLookups, 1)
  console.log('PASS payment: provider-shaped notification is acknowledged without an update')

  const forgedCancelResponse = await route.POST({
    text: async () => JSON.stringify({
      type: 'payment.canceled',
      object: { id: ownPayment.yukassaId },
    }),
  })
  assert.equal(forgedCancelResponse.status, 200)
  assert.equal(ownPayment.status, 'cancelled')
  assert.equal(paymentUpdates, 2)
  assert.equal(providerLookups, 1)
  console.log('PASS payment: forged cancellation changes payment without provider lookup')
}

function checkStoredPathEscape(profile) {
  const virtualPath = profile.path
  const virtualCwd = profile.cwd
  const virtualTmp = profile.tmp
  const privateFile = virtualPath.join(virtualCwd, 'private.txt')
  const uploadRoot = virtualPath.join(virtualCwd, 'public', 'uploads')
  const storage = loadActualSource('lib/file-storage.ts', {
    fs: { existsSync: (filename) => virtualPath.normalize(filename) === privateFile },
    os: { tmpdir: () => virtualTmp },
    path: virtualPath,
  }, profile)
  const resolved = storage.resolveStoredFileAbsolutePath('../../private.txt')
  assert.equal(resolved, privateFile)
  assert.ok(virtualPath.relative(uploadRoot, resolved).startsWith('..'))
  console.log(`PASS storage (${profile.name}): real resolver accepts a synthetic file outside uploads`)
}

async function main() {
  for (const profile of virtualProfiles) {
    await checkUploadTraversal(profile)
    checkStoredPathEscape(profile)
  }
  await checkPaymentOrderSwap()
  console.log('All checks used mocks; no application file, database, or network mutation occurred.')
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
