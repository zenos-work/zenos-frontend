import { beforeEach, describe, expect, it, vi } from 'vitest'

let requestHandler: ((config: { headers?: Record<string, string> }) => unknown) | undefined
let responseSuccessHandler: ((response: unknown) => unknown) | undefined
let responseErrorHandler: ((error: {
  response: { status: number }
  config: { headers: Record<string, string> }
}) => Promise<unknown>) | undefined

const axiosInstance = {
  interceptors: {
    request: {
      use: vi.fn((onFulfilled: typeof requestHandler) => {
        requestHandler = onFulfilled
      }),
    },
    response: {
      use: vi.fn((onFulfilled: typeof responseSuccessHandler, onRejected: typeof responseErrorHandler) => {
        responseSuccessHandler = onFulfilled
        responseErrorHandler = onRejected
      }),
    },
  },
}

const axiosMock = Object.assign(vi.fn(), {
  create: vi.fn(() => axiosInstance),
  post: vi.fn(),
})

vi.mock('axios', () => ({
  default: axiosMock,
}))

describe('api client', () => {
  beforeEach(async () => {
    requestHandler = undefined
    responseSuccessHandler = undefined
    responseErrorHandler = undefined
    sessionStorage.clear()
    vi.clearAllMocks()
    vi.unstubAllEnvs()
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.zenos.test')
    vi.resetModules()
    await import('../../src/lib/api')
  })

  it('creates the axios client with the configured base URL', () => {
    expect(axiosMock.create).toHaveBeenCalledWith({
      baseURL: 'https://api.zenos.test',
    })
  })

  it('adds the bearer token to outgoing requests when present', async () => {
    sessionStorage.setItem('access_token', 'token-123')

    const config = await requestHandler?.({ headers: {} })

    expect(config).toEqual({
      headers: {
        Authorization: 'Bearer token-123',
      },
    })
  })

  it('passes successful responses through unchanged', () => {
    const response = { data: { ok: true } }
    expect(responseSuccessHandler?.(response)).toBe(response)
  })

  it('refreshes tokens on 401 responses and retries the request', async () => {
    sessionStorage.setItem('refresh_token', 'refresh-123')
    axiosMock.post.mockResolvedValue({
      data: { access_token: 'new-access-token' },
    })
    axiosMock.mockResolvedValue({ data: { ok: true } })

    const error = {
      response: { status: 401 },
      config: { headers: {} },
    }

    const result = await responseErrorHandler?.(error)

    expect(axiosMock.post).toHaveBeenCalledWith(
      'https://api.zenos.test/auth/refresh',
      { refresh_token: 'refresh-123' },
    )
    expect(sessionStorage.getItem('access_token')).toBe('new-access-token')
    expect(error.config.headers.Authorization).toBe('Bearer new-access-token')
    expect(axiosMock).toHaveBeenCalledWith(error.config)
    expect(result).toEqual({ data: { ok: true } })
  })

  it('rejects the original error when token refresh fails', async () => {
    sessionStorage.setItem('refresh_token', 'refresh-123')
    axiosMock.post.mockRejectedValue(new Error('refresh failed'))
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const error = {
      response: { status: 401 },
      config: { headers: {} },
    }

    await expect(responseErrorHandler?.(error)).rejects.toBe(error)
    expect(errorSpy).toHaveBeenCalledWith('Token refresh failed:', expect.any(Error))

    errorSpy.mockRestore()
  })
})
