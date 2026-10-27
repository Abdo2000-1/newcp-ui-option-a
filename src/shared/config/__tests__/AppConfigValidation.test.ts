import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  DEFAULT_APP_CONFIG,
  validateAppConfig,
  loadAppConfig,
  saveAppConfig,
  resetAppConfig,
  getFeatureFlag,
  STORAGE_KEY,
} from '../appConfig';
import * as posthogModule from '@/shared/observability/posthog';

describe('Task 12: CMS AppConfig Validation & Runtime Engine', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('validateAppConfig', () => {
    it('accepts DEFAULT_APP_CONFIG as valid', () => {
      const result = validateAppConfig(DEFAULT_APP_CONFIG);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('rejects null, non-objects, or arrays', () => {
      expect(validateAppConfig(null).valid).toBe(false);
      expect(validateAppConfig('string').valid).toBe(false);
      expect(validateAppConfig([]).valid).toBe(false);
    });

    it('validates required branding and theme fields', () => {
      const invalidConfig = {
        branding: { appName: '' }, // missing version
        links: {},
        theme: {}, // missing primaryColor
      };
      const result = validateAppConfig(invalidConfig);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('rejects invalid features pageSize', () => {
      const badPageSize = {
        ...DEFAULT_APP_CONFIG,
        features: {
          ...DEFAULT_APP_CONFIG.features,
          defaultPageSize: -5,
        },
      };
      const result = validateAppConfig(badPageSize);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('defaultPageSize'))).toBe(true);
    });
  });

  describe('loadAppConfig and resetAppConfig', () => {
    it('returns DEFAULT_APP_CONFIG when localStorage is empty', () => {
      const config = loadAppConfig();
      expect(config.branding.appName).toBe(DEFAULT_APP_CONFIG.branding.appName);
    });

    it('loads valid overrides from localStorage', () => {
      const override = {
        ...DEFAULT_APP_CONFIG,
        branding: {
          ...DEFAULT_APP_CONFIG.branding,
          appName: 'Custom Clinic Portal',
        },
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(override));

      const loaded = loadAppConfig();
      expect(loaded.branding.appName).toBe('Custom Clinic Portal');
    });

    it('safely recovers to DEFAULT_APP_CONFIG when localStorage contains corrupt JSON', () => {
      localStorage.setItem(STORAGE_KEY, 'invalid-json{');
      const loaded = loadAppConfig();
      expect(loaded.branding.appName).toBe(DEFAULT_APP_CONFIG.branding.appName);
    });

    it('safely falls back to DEFAULT_APP_CONFIG when localStorage contains schema violations', () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ branding: { appName: '' } }));
      const loaded = loadAppConfig();
      expect(loaded.branding.appName).toBe(DEFAULT_APP_CONFIG.branding.appName);
    });

    it('resets configuration by clearing localStorage and firing update event', () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_APP_CONFIG));
      const eventSpy = vi.fn();
      window.addEventListener('app-config-updated', eventSpy);

      const reset = resetAppConfig();
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
      expect(reset.branding.appName).toBe(DEFAULT_APP_CONFIG.branding.appName);
      expect(eventSpy).toHaveBeenCalled();

      window.removeEventListener('app-config-updated', eventSpy);
    });
  });

  describe('PostHog Feature Flag Integration', () => {
    it('returns default value when PostHog is disabled or absent', () => {
      const flag = getFeatureFlag('beta_dark_mode', true);
      expect(flag).toBe(true);
    });

    it('queries PostHog adapter when available', () => {
      const mockIsFeatureEnabled = vi.fn().mockReturnValue(true);
      vi.spyOn(posthogModule, 'getPostHog').mockReturnValue({
        isFeatureEnabled: mockIsFeatureEnabled,
        isEnabled: () => true,
        capture: vi.fn(),
        capturePageView: vi.fn(),
        identify: vi.fn(),
        reset: vi.fn(),
      });

      const res = getFeatureFlag('new_kpi_dashboard', false);
      expect(res).toBe(true);
      expect(mockIsFeatureEnabled).toHaveBeenCalledWith('new_kpi_dashboard', false);
    });
  });
});
