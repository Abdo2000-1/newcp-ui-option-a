import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// Automatically unmount and clean up DOM after each test
afterEach(() => {
  cleanup();
});

// Mock window.matchMedia for responsive/theme hooks
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

// Mock HTMLMediaElement & Web Audio API
class MockAudioContext {
  state = 'running';
  currentTime = 0;
  createOscillator() {
    return {
      type: 'sine',
      frequency: { setValueAtTime: () => {} },
      connect: () => {},
      start: () => {},
      stop: () => {},
    };
  }
  createGain() {
    return {
      gain: {
        setValueAtTime: () => {},
        exponentialRampToValueAtTime: () => {},
      },
      connect: () => {},
    };
  }
  resume() {
    return Promise.resolve();
  }
  close() {
    return Promise.resolve();
  }
}

// Attach mock AudioContext
// @ts-expect-error Mock AudioContext in JSDOM
window.AudioContext = MockAudioContext;
// @ts-expect-error Mock webkitAudioContext in JSDOM
window.webkitAudioContext = MockAudioContext;

// Mock global fetch for local relative JSON paths in JSDOM environment
const originalFetch = globalThis.fetch;
globalThis.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = typeof input === 'string' ? input : input.toString();
  if (url.startsWith('/') || url.includes('.json')) {
    return {
      ok: true,
      status: 200,
      json: async () => [],
      text: async () => '[]',
      headers: new Headers(),
    } as Response;
  }
  if (originalFetch) {
    return originalFetch(input, init);
  }
  return {
    ok: true,
    status: 200,
    json: async () => ({}),
    text: async () => '{}',
    headers: new Headers(),
  } as Response;
});
