import { describe, it, expect } from 'vitest';
import { formatDate, timeAgo, formatCurrency, getInitials, truncate, cn } from '../format';

describe('format utilities', () => {
  describe('formatDate', () => {
    it('formats ISO string to short date by default', () => {
      const formatted = formatDate('2026-03-15T10:30:00Z');
      expect(formatted).toMatch(/Mar 15, 26/);
    });

    it('includes time when includeTime is true', () => {
      const formatted = formatDate('2026-03-15T14:30:00Z', true);
      expect(formatted).toMatch(/Mar 15, 26/);
      expect(formatted).toMatch(/\d{1,2}:\d{2}\s?(AM|PM)/i);
    });
  });

  describe('timeAgo', () => {
    it('returns "just now" for dates within seconds', () => {
      const now = new Date().toISOString();
      expect(timeAgo(now)).toBe('just now');
    });

    it('returns minute format for recent intervals', () => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      expect(timeAgo(fiveMinutesAgo)).toBe('5m ago');
    });

    it('returns hour format for today intervals', () => {
      const threeHoursAgo = new Date(Date.now() - 3 * 3600 * 1000).toISOString();
      expect(timeAgo(threeHoursAgo)).toBe('3h ago');
    });

    it('returns days format for past week intervals', () => {
      const fourDaysAgo = new Date(Date.now() - 4 * 86400 * 1000).toISOString();
      expect(timeAgo(fourDaysAgo)).toBe('4d ago');
    });
  });

  describe('formatCurrency', () => {
    it('formats positive dollar values as currency', () => {
      expect(formatCurrency(1250)).toBe('$1,250');
    });

    it('formats zero correctly', () => {
      expect(formatCurrency(0)).toBe('$0');
    });
  });

  describe('getInitials', () => {
    it('extracts two initials from full name', () => {
      expect(getInitials('John Doe')).toBe('JD');
    });

    it('extracts up to two characters for single word name', () => {
      expect(getInitials('Sarah')).toBe('S');
    });

    it('handles multiple name parts and converts to uppercase', () => {
      expect(getInitials('ahmed hassan ali')).toBe('AH');
    });
  });

  describe('truncate', () => {
    it('returns original string if within max length', () => {
      expect(truncate('Hello', 10)).toBe('Hello');
    });

    it('appends ellipsis when string exceeds max length', () => {
      expect(truncate('Very long patient notes description', 10)).toBe('Very long…');
    });
  });

  describe('cn (classNames helper)', () => {
    it('joins truthy class names with spaces', () => {
      expect(cn('btn', 'btn-primary', 'active')).toBe('btn btn-primary active');
    });

    it('filters out falsy, null, and undefined values', () => {
      const condition = false;
      expect(cn('base', condition ? 'hidden' : undefined, null, undefined, 'visible')).toBe('base visible');
    });
  });
});
