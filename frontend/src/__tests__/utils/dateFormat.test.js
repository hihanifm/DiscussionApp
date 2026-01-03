/**
 * Tests for dateFormat utility
 */

import { describe, test, expect } from 'vitest';
import { formatRelativeTime } from '../../utils/dateFormat';

describe('dateFormat utility', () => {
  const now = new Date();
  const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  describe('formatRelativeTime', () => {
    test('should return empty string for invalid timestamp', () => {
      expect(formatRelativeTime(null)).toBe('');
      expect(formatRelativeTime(undefined)).toBe('');
      expect(formatRelativeTime('')).toBe('');
    });

    test('should format time as "just now" for very recent times', () => {
      const result = formatRelativeTime(now.toISOString());
      expect(result).toBe('just now');
    });

    test('should format time in minutes', () => {
      const result = formatRelativeTime(oneMinuteAgo.toISOString());
      expect(result).toContain('minute');
      expect(result).toContain('ago');
    });

    test('should format time in hours', () => {
      const result = formatRelativeTime(oneHourAgo.toISOString());
      expect(result).toContain('hour');
      expect(result).toContain('ago');
    });

    test('should format time in days', () => {
      const result = formatRelativeTime(oneDayAgo.toISOString());
      expect(result).toContain('day');
      expect(result).toContain('ago');
    });

    test('should format time in weeks', () => {
      const result = formatRelativeTime(oneWeekAgo.toISOString());
      expect(result).toContain('week');
      expect(result).toContain('ago');
    });

    test('should handle singular vs plural correctly', () => {
      const oneMinute = new Date(now.getTime() - 60 * 1000);
      const twoMinutes = new Date(now.getTime() - 2 * 60 * 1000);
      
      const singular = formatRelativeTime(oneMinute.toISOString());
      const plural = formatRelativeTime(twoMinutes.toISOString());
      
      expect(singular).toContain('minute ago');
      expect(plural).toContain('minutes ago');
    });
  });
});
