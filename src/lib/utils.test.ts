import { describe, it, expect } from 'vitest';
import { cn, slugify, normalizeIndianPhone } from './utils';

describe('cn utility', () => {
  it('combines class names correctly', () => {
    expect(cn('bg-red-500', 'text-white')).toBe('bg-red-500 text-white');
  });

  it('handles conditional class names', () => {
    expect(cn('btn', true && 'btn-active', false && 'btn-disabled')).toBe('btn btn-active');
  });

  it('merges tailwind conflicting classes', () => {
    expect(cn('p-4', 'p-8')).toBe('p-8');
    expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500');
  });
});

describe('slugify utility', () => {
  it('converts strings to lowercase kebab-case', () => {
    expect(slugify('Building Construction')).toBe('building-construction');
    expect(slugify('PMC & Turnkey Project Development')).toBe('pmc-and-turnkey-project-development');
  });

  it('strips special characters and trims spaces', () => {
    expect(slugify('  Structural Repairs / Rehabilitation!  ')).toBe('structural-repairs-rehabilitation');
  });

  it('handles multiple consecutive spaces and dashes', () => {
    expect(slugify('Waterproofing---Solutions  Extra')).toBe('waterproofing-solutions-extra');
  });
});

describe('normalizeIndianPhone utility', () => {
  it('normalizes valid 10-digit Indian numbers', () => {
    expect(normalizeIndianPhone('9821502956')).toBe('+919821502956');
    expect(normalizeIndianPhone('9359895322')).toBe('+919359895322');
  });

  it('normalizes numbers with spaces, hyphens, and leading zero', () => {
    expect(normalizeIndianPhone('098215 02956')).toBe('+919821502956');
    expect(normalizeIndianPhone('0935-989-5322')).toBe('+919359895322');
  });

  it('handles numbers already formatted with +91 or 91', () => {
    expect(normalizeIndianPhone('+919821502956')).toBe('+919821502956');
    expect(normalizeIndianPhone('919821502956')).toBe('+919821502956');
  });

  it('throws an error for invalid phone numbers', () => {
    expect(() => normalizeIndianPhone('')).toThrow('Phone number is required');
    expect(() => normalizeIndianPhone('12345')).toThrow('Invalid Indian phone number format');
    expect(() => normalizeIndianPhone('1234567890')).toThrow('Invalid Indian phone number format'); // Doesn't start with 6-9
    expect(() => normalizeIndianPhone('abcdefghij')).toThrow('Invalid Indian phone number format');
  });
});
