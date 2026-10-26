import { describe, it, expect } from 'vitest';
import { scrubSentryData, scrubBreadcrumb } from '../sentry/sentryScrubber';

describe('OBS-002: Sentry Data Scrubber', () => {
  it('strips credentials, tokens, PHI, clinical notes, and financial amounts', () => {
    const dirty = {
      route: '/flow?search=active',
      patient_id: 'PT-1002',
      doctor_name: 'Dr. Jane Doe',
      clinical_notes: 'Urgent crown preparation',
      token: 'jwt-secret-xyz',
      password: 'password123',
      amount: 1500,
      price: 250,
      invoice_id: 'INV-2026',
      safeMetric: 'latency',
      metricValue: 120,
    };

    const clean = scrubSentryData(dirty, { trackEmail: false });

    expect(clean).toEqual({
      route: '/flow', // query string stripped
      safeMetric: 'latency',
      metricValue: 120,
    });
    expect(clean.patient_id).toBeUndefined();
    expect(clean.doctor_name).toBeUndefined();
    expect(clean.clinical_notes).toBeUndefined();
    expect(clean.token).toBeUndefined();
    expect(clean.password).toBeUndefined();
    expect(clean.amount).toBeUndefined();
    expect(clean.price).toBeUndefined();
  });

  it('scrubs breadcrumb messages and data fields', () => {
    const breadcrumb = {
      category: 'navigation',
      message: 'User navigated to /orders?task=flow&param=1',
      data: {
        rawUrl: 'https://app.3ddx.com/orders?auth=token123',
        authHeader: 'Bearer secret-jwt-token',
        validKey: 'safe-info',
      },
    };

    const scrubbed = scrubBreadcrumb(breadcrumb);
    expect(scrubbed.message).toBe('User navigated to /orders');
    expect(scrubbed.data?.validKey).toBe('safe-info');
    expect(scrubbed.data?.authHeader).toBeUndefined(); // dropped because key contains 'auth'
  });

  it('drops email unless trackEmail option is explicitly true', () => {
    const withEmail = {
      user_id: 'usr-1',
      email: 'test@3ddx.com',
    };

    const withoutEmailScrubbed = scrubSentryData(withEmail, { trackEmail: false });
    expect(withoutEmailScrubbed.email).toBeUndefined();

    const withEmailAllowed = scrubSentryData(withEmail, { trackEmail: true });
    expect(withEmailAllowed.email).toBe('test@3ddx.com');
  });
});
