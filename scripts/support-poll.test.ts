/// <reference types="vitest/globals" />
import { createRequire } from 'node:module'
import { EventEmitter } from 'node:events'
import http from 'node:http'

const require = createRequire(import.meta.url)
// require.main guard keeps imports offline and never loads .env.
const { pollOnce, forwardToWebhook } = require('./support-poll.js')

describe('support polling acknowledgement', () => {
  test('retries the failed update before later updates, advances only after success', async () => {
    const first = { update_id: 10 }
    const second = { update_id: 11 }
    const third = { update_id: 12 }
    const client = { getUpdates: vi.fn()
      .mockResolvedValueOnce([first, second, third])
      .mockResolvedValueOnce([second, third])
      .mockResolvedValueOnce([]) }
    const forward = vi.fn().mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('handler HTTP 403'))
      .mockResolvedValue(undefined)

    await expect(pollOnce(client, forward)).rejects.toThrow('HTTP 403')
    expect(forward.mock.calls.map(call => call[0].update_id)).toEqual([10, 11])
    await pollOnce(client, forward)
    expect(client.getUpdates.mock.calls[1][0].offset).toBe(11)
    expect(forward.mock.calls.map(call => call[0].update_id)).toEqual([10, 11, 11, 12])
    await pollOnce(client, forward)
    expect(client.getUpdates.mock.calls[2][0].offset).toBe(13)
  })

  test('sends support auth to its own endpoint and rejects non-2xx / connection errors', async () => {
    let status = 403
    let connectionError = false
    const request = vi.spyOn(http, 'request').mockImplementation(((options: unknown, callback: Function) => {
      const req = new EventEmitter() as EventEmitter & Record<string, any>
      req.setTimeout = vi.fn()
      req.write = vi.fn()
      req.end = () => {
        if (connectionError) req.emit('error', new Error('connection refused'))
        else callback({ statusCode: status, resume: vi.fn() })
      }
      return req
    }) as any)
    const log = vi.spyOn(console, 'log').mockImplementation(() => {})
    try {
      await expect(forwardToWebhook({ update_id: 1 }, 'test-secret')).rejects.toThrow('HTTP 403')
      expect(request.mock.calls[0][0]).toMatchObject({
        hostname: '127.0.0.1', path: '/api/telegram/support',
        headers: { 'X-Telegram-Bot-Api-Secret-Token': 'test-secret' },
      })
      status = 500
      await expect(forwardToWebhook({ update_id: 1 }, 'test-secret')).rejects.toThrow('HTTP 500')
      connectionError = true
      await expect(forwardToWebhook({ update_id: 1 }, 'test-secret')).rejects.toThrow('connection refused')
      connectionError = false
      status = 200
      await expect(forwardToWebhook({ update_id: 1 }, 'test-secret')).resolves.toBeUndefined()
    } finally {
      request.mockRestore()
      log.mockRestore()
    }
  })
})
