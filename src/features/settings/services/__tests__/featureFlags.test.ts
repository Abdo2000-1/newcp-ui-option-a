import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import {
  resolveCmsFeatureFlag,
  useCmsFeatureFlag,
  getLocalCmsFlags,
  setLocalCmsFlags,
  CMS_FLAG_KEYS,
  DEFAULT_CMS_FLAGS,
  CMS_STORAGE_KEY,
} from '../featureFlags';
import * as observability from '@/shared/observability';

type PostHogMock = ReturnType<typeof observability.getPostHog> & {
  isInitialized?: ReturnType<typeof vi.fn>;
};

function createPostHogMock(overrides: Partial<PostHogMock> = {}): ReturnType<typeof observability.getPostHog> {
  return {
    isFeatureEnabled: vi.fn((_key, fallback) => fallback ?? false),
    capture: vi.fn(),
    capturePageView: vi.fn(),
    identify: vi.fn(),
    reset: vi.fn(),
    isEnabled: vi.fn().mockReturnValue(false),
    isInitialized: vi.fn().mockReturnValue(false),
    ...overrides,
  } as unknown as ReturnType<typeof observability.getPostHog>;
}

describe('OBS-001: CMS Feature Flags & PostHog Boundary Integration', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('Local CMS Flag Storage', () => {
    it('returns factory defaults when localStorage is empty', () => {
      const flags = getLocalCmsFlags();
      expect(flags).toEqual(DEFAULT_CMS_FLAGS);
      expect(flags.batchQueue).toBe(true);
      expect(flags.meshInspection).toBe(false);
    });

    it('persists and restores updated local flags', () => {
      setLocalCmsFlags({
        ...DEFAULT_CMS_FLAGS,
        batchQueue: false,
        meshInspection: true,
      });

      const restored = getLocalCmsFlags();
      expect(restored.batchQueue).toBe(false);
      expect(restored.meshInspection).toBe(true);
    });
  });

  describe('PostHog Feature Flag Resolution & Fallback Matrix', () => {
    it('1. returns local fallback when PostHog is disabled or Noop adapter is active', () => {
      vi.spyOn(observability, 'getPostHog').mockReturnValue(createPostHogMock());

      expect(resolveCmsFeatureFlag(CMS_FLAG_KEYS.BATCH_QUEUE, true)).toBe(true);
      expect(resolveCmsFeatureFlag(CMS_FLAG_KEYS.MESH_INSPECTION, false)).toBe(false);
    });

    it('2. returns remote feature flag value when PostHog provider returns true', () => {
      vi.spyOn(observability, 'getPostHog').mockReturnValue(createPostHogMock({
        isFeatureEnabled: vi.fn().mockReturnValue(true),
        isEnabled: vi.fn().mockReturnValue(true),
        isInitialized: vi.fn().mockReturnValue(true),
      }));

      // Even if local fallback is false, remote true wins
      expect(resolveCmsFeatureFlag(CMS_FLAG_KEYS.MESH_INSPECTION, false)).toBe(true);
    });

    it('3. returns remote feature flag value when PostHog provider returns false', () => {
      vi.spyOn(observability, 'getPostHog').mockReturnValue(createPostHogMock({
        isFeatureEnabled: vi.fn().mockReturnValue(false),
        isEnabled: vi.fn().mockReturnValue(true),
        isInitialized: vi.fn().mockReturnValue(true),
      }));

      // Even if local fallback is true, remote false wins
      expect(resolveCmsFeatureFlag(CMS_FLAG_KEYS.BATCH_QUEUE, true)).toBe(false);
    });

    it('4. falls back to deterministic local value when PostHog client throws (provider down)', () => {
      vi.spyOn(observability, 'getPostHog').mockReturnValue(createPostHogMock({
        isFeatureEnabled: vi.fn().mockImplementation(() => {
          throw new Error('PostHog 503 Provider Network Timeout');
        }),
        isEnabled: vi.fn().mockReturnValue(true),
        isInitialized: vi.fn().mockReturnValue(true),
      }));

      expect(resolveCmsFeatureFlag(CMS_FLAG_KEYS.BATCH_QUEUE, true)).toBe(true);
      expect(resolveCmsFeatureFlag(CMS_FLAG_KEYS.MESH_INSPECTION, false)).toBe(false);
    });

    it('5. useCmsFeatureFlag hook reflects resolved flag value', () => {
      vi.spyOn(observability, 'getPostHog').mockReturnValue(createPostHogMock());

      const { result } = renderHook(() =>
        useCmsFeatureFlag(CMS_FLAG_KEYS.BATCH_QUEUE, true)
      );

      expect(result.current).toBe(true);
    });
  });
});
