/**
 * Test Setup Harness
 *
 * Configures the test environment, globals, and cleanup mocks
 * for unit and component testing.
 */

// Mock browser window.matchMedia if not present
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}

// Mock localStorage if needed in node environments
if (typeof window !== 'undefined' && !window.localStorage) {
  const store = new Map<string, string>();
  const mockStorage: Storage = {
    length: 0,
    clear: () => store.clear(),
    getItem: (key: string) => store.get(key) || null,
    key: (index: number) => Array.from(store.keys())[index] || null,
    removeItem: (key: string) => store.delete(key),
    setItem: (key: string, value: string) => store.set(key, value),
  };
  Object.defineProperty(window, 'localStorage', { value: mockStorage });
}
