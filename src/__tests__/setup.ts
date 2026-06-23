import '@testing-library/jest-dom'

if (typeof global.Request === 'undefined') {
  // @ts-ignore
  global.Request = globalThis.Request
  // @ts-ignore
  global.Response = globalThis.Response
  // @ts-ignore
  global.Headers = globalThis.Headers
}

// ── Mock next/navigation ─────────────────────────────────────
jest.mock('next/navigation', () => ({
  useRouter:       () => ({ push: jest.fn(), replace: jest.fn(), prefetch: jest.fn() }),
  useSearchParams: () => ({ get: jest.fn().mockReturnValue(null) }),
  usePathname:     () => '/',
  redirect:        jest.fn(),
}))

// ── Mock next/headers ─────────────────────────────────────────
jest.mock('next/headers', () => ({
  cookies: () => ({
    getAll:  () => [],
    set:     jest.fn(),
    get:     jest.fn(),
    delete:  jest.fn(),
  }),
}))

// ── Mock Supabase client ──────────────────────────────────────
const mockSupabaseClient = {
  auth: {
    getUser:              jest.fn().mockResolvedValue({ data: { user: { id: 'test-user-id', email: 'test@iilm.edu' } }, error: null }),
    getSession:           jest.fn().mockResolvedValue({ data: { session: { access_token: 'mock-token' } }, error: null }),
    onAuthStateChange:    jest.fn().mockReturnValue({ data: { subscription: { unsubscribe: jest.fn() } } }),
    exchangeCodeForSession: jest.fn().mockResolvedValue({ error: null }),
    signOut:              jest.fn().mockResolvedValue({ error: null }),
  },
  from: jest.fn().mockReturnValue({
    select:   jest.fn().mockReturnThis(),
    insert:   jest.fn().mockReturnThis(),
    update:   jest.fn().mockReturnThis(),
    delete:   jest.fn().mockReturnThis(),
    eq:       jest.fn().mockReturnThis(),
    neq:      jest.fn().mockReturnThis(),
    in:       jest.fn().mockReturnThis(),
    not:      jest.fn().mockReturnThis(),
    or:       jest.fn().mockReturnThis(),
    order:    jest.fn().mockReturnThis(),
    limit:    jest.fn().mockReturnThis(),
    single:   jest.fn().mockResolvedValue({ data: null, error: null }),
    maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
  }),
  rpc: jest.fn().mockResolvedValue({ data: null, error: null }),
  storage: {
    from: jest.fn().mockReturnValue({
      upload:          jest.fn().mockResolvedValue({ data: { path: 'test/path.pdf' }, error: null }),
      getPublicUrl:    jest.fn().mockReturnValue({ data: { publicUrl: 'https://storage.example.com/test.pdf' } }),
      createSignedUrl: jest.fn().mockResolvedValue({ data: { signedUrl: 'https://storage.example.com/signed.jpg' }, error: null }),
    }),
  },
  functions: {
    invoke: jest.fn().mockResolvedValue({ data: { success: true, url: 'https://storage.example.com/file.pdf' }, error: null }),
  },
  channel: jest.fn().mockReturnValue({
    on:          jest.fn().mockReturnThis(),
    subscribe:   jest.fn().mockReturnValue(undefined),
  }),
  removeChannel: jest.fn(),
}

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabaseClient,
}))

jest.mock('@/lib/supabase/server', () => ({
  createClient: async () => mockSupabaseClient,
}))

// ── Mock react-hot-toast ──────────────────────────────────────
jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error:   jest.fn(),
    loading: jest.fn(),
    dismiss: jest.fn(),
  },
  toast: {
    success: jest.fn(),
    error:   jest.fn(),
  },
}))

// ── Suppress console.error in tests unless explicitly testing it ──
const originalError = console.error
beforeAll(() => {
  console.error = (...args: any[]) => {
    if (typeof args[0] === 'string' && args[0].includes('Warning:')) return
    originalError(...args)
  }
})
afterAll(() => { console.error = originalError })

// Export mock for use in individual tests
export { mockSupabaseClient }
