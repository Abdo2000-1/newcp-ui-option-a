import { describe, it, expect } from 'vitest';
import {
  sanitizeProperties,
  stripQueryString,
  isSensitiveKey,
  containsSensitiveValuePattern,
} from '../posthog/sanitizer';

describe('OBS-001: Telemetry Property Sanitizer', () => {
  describe('stripQueryString', () => {
    it('removes query strings and URL fragments from paths', () => {
      expect(stripQueryString('/flow?task=flow&param=123')).toBe('/flow');
      expect(stripQueryString('/order-details?id=101#section-b')).toBe('/order-details');
      expect(stripQueryString('/dashboard')).toBe('/dashboard');
      expect(stripQueryString('')).toBe('');
    });
  });

  describe('isSensitiveKey', () => {
    it('identifies sensitive credential and authentication keys', () => {
      expect(isSensitiveKey('password')).toBe(true);
      expect(isSensitiveKey('token')).toBe(true);
      expect(isSensitiveKey('access_token')).toBe(true);
      expect(isSensitiveKey('bearer')).toBe(true);
      expect(isSensitiveKey('api_key')).toBe(true);
      expect(isSensitiveKey('authorization')).toBe(true);
      expect(isSensitiveKey('cookie')).toBe(true);
      expect(isSensitiveKey('session_token')).toBe(true);
    });

    it('identifies PHI and clinical keys', () => {
      expect(isSensitiveKey('patient_name')).toBe(true);
      expect(isSensitiveKey('patient_id')).toBe(true);
      expect(isSensitiveKey('doctor_name')).toBe(true);
      expect(isSensitiveKey('clinical_notes')).toBe(true);
      expect(isSensitiveKey('prescription')).toBe(true);
      expect(isSensitiveKey('dr_special_request')).toBe(true);
      expect(isSensitiveKey('mrn')).toBe(true);
      expect(isSensitiveKey('ssn')).toBe(true);
    });

    it('identifies financial keys', () => {
      expect(isSensitiveKey('amount')).toBe(true);
      expect(isSensitiveKey('price')).toBe(true);
      expect(isSensitiveKey('charge')).toBe(true);
      expect(isSensitiveKey('revenue')).toBe(true);
      expect(isSensitiveKey('invoice_total')).toBe(true);
      expect(isSensitiveKey('override_price')).toBe(true);
    });

    it('drops email unless trackEmail is explicitly true', () => {
      expect(isSensitiveKey('email', false)).toBe(true);
      expect(isSensitiveKey('email', true)).toBe(false);
    });

    it('allows benign telemetry properties', () => {
      expect(isSensitiveKey('route_name')).toBe(false);
      expect(isSensitiveKey('route_path')).toBe(false);
      expect(isSensitiveKey('module')).toBe(false);
      expect(isSensitiveKey('environment')).toBe(false);
      expect(isSensitiveKey('user_id')).toBe(false);
      expect(isSensitiveKey('tenant_id')).toBe(false);
      expect(isSensitiveKey('navigation_key')).toBe(false);
      expect(isSensitiveKey('report_key')).toBe(false);
    });
  });

  describe('containsSensitiveValuePattern', () => {
    it('detects Bearer tokens and JWT values', () => {
      expect(containsSensitiveValuePattern('Bearer secret-token-xyz')).toBe(true);
      expect(containsSensitiveValuePattern('Basic dXNlcjpwYXNz')).toBe(true);
      expect(containsSensitiveValuePattern('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoiSm9obiJ9.signature')).toBe(true);
      expect(containsSensitiveValuePattern('Orders Flow')).toBe(false);
      expect(containsSensitiveValuePattern('usr-cs-001')).toBe(false);
    });
  });

  describe('sanitizeProperties', () => {
    it('strips all sensitive keys from event payload', () => {
      const dirty = {
        route_name: 'Order Details',
        route_path: '/order-details?orderId=1001',
        module: 'Orders',
        password: 'super-secret-password',
        token: 'auth-jwt-xyz',
        patient_name: 'John Doe',
        doctor_name: 'Dr. Smith',
        clinical_notes: 'Urgent crown fabrication',
        amount: 250.0,
        price: 199.99,
        email: 'user@3ddx.com',
      };

      const clean = sanitizeProperties(dirty, { trackEmail: false });

      expect(clean).toEqual({
        route_name: 'Order Details',
        route_path: '/order-details', // query string stripped
        module: 'Orders',
      });
      expect(clean.password).toBeUndefined();
      expect(clean.token).toBeUndefined();
      expect(clean.patient_name).toBeUndefined();
      expect(clean.doctor_name).toBeUndefined();
      expect(clean.clinical_notes).toBeUndefined();
      expect(clean.amount).toBeUndefined();
      expect(clean.price).toBeUndefined();
      expect(clean.email).toBeUndefined();
    });

    it('redacts string values containing sensitive token patterns', () => {
      const payload = {
        module: 'Authentication',
        customHeader: 'Bearer my-bearer-token-12345',
        description: 'Normal description text',
      };

      const clean = sanitizeProperties(payload);
      expect(clean.customHeader).toBe('[REDACTED]');
      expect(clean.description).toBe('Normal description text');
    });

    it('sanitizes nested objects and arrays recursively', () => {
      const complex = {
        module: 'Reports',
        filters: {
          report_key: 'quarter_targets',
          price: 500,
          nestedDetails: {
            safeKey: 'valid',
            patient_id: 12345,
          },
        },
        items: [
          { safeField: 'ok', secretToken: 'Bearer 123' },
          { cleanField: 'fine' },
        ],
      };

      const clean = sanitizeProperties(complex) as any;
      expect(clean.module).toBe('Reports');
      expect(clean.filters.report_key).toBe('quarter_targets');
      expect(clean.filters.price).toBeUndefined();
      expect(clean.filters.nestedDetails.safeKey).toBe('valid');
      expect(clean.filters.nestedDetails.patient_id).toBeUndefined();
      expect(clean.items[0].safeField).toBe('ok');
      expect(clean.items[0].secretToken).toBeUndefined();
    });
  });
});
