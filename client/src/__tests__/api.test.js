import { describe, test, expect, beforeEach, vi } from 'vitest';

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: vi.fn((key) => store[key] ?? null),
    setItem: vi.fn((key, value) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key) => {
      delete store[key];
    }),
    clear: () => {
      store = {};
    },
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('API module', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.resetModules();
  });

  test('exports an axios instance', async () => {
    const { default: api } = await import('../api');
    expect(api).toBeDefined();
    expect(api.defaults).toBeDefined();
  });

  test('has request interceptor for auth token', async () => {
    localStorageMock.setItem('token', 'test-token');
    const { default: api } = await import('../api');

    // Check that interceptors are registered
    expect(api.interceptors.request.handlers.length).toBeGreaterThan(0);
  });

  test('has response interceptor for 401', async () => {
    const { default: api } = await import('../api');
    expect(api.interceptors.response.handlers.length).toBeGreaterThan(0);
  });
});
