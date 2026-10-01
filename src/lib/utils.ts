import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines class names using clsx and tailwind-merge.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Converts a string into a clean, URL-safe slug.
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/&/g, '-and-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

/**
 * Normalizes an Indian phone number to +91XXXXXXXXXX format.
 * Accepts 10-digit numbers, numbers with leading 0, or numbers with +91 prefix.
 * @throws Error if the phone number is invalid.
 */
export function normalizeIndianPhone(phone: string): string {
  if (!phone) {
    throw new Error('Phone number is required');
  }

  // Remove spaces, hyphens, parentheses
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');

  // Regex patterns for Indian phone numbers
  // 10 digits starting with 6, 7, 8, or 9
  const tenDigitRegex = /^[6-9]\d{9}$/;
  // 11 digits starting with 0 followed by 6, 7, 8, or 9
  const zeroPrefixedRegex = /^0([6-9]\d{9})$/;
  // +91 followed by 10 digits
  const countryCodeRegex = /^\+91([6-9]\d{9})$/;
  // 91 followed by 10 digits (without +)
  const plainCountryCodeRegex = /^91([6-9]\d{9})$/;

  if (tenDigitRegex.test(cleaned)) {
    return `+91${cleaned}`;
  }

  const zeroMatch = cleaned.match(zeroPrefixedRegex);
  if (zeroMatch && zeroMatch[1]) {
    return `+91${zeroMatch[1]}`;
  }

  const countryMatch = cleaned.match(countryCodeRegex);
  if (countryMatch) {
    return cleaned;
  }

  const plainCountryMatch = cleaned.match(plainCountryCodeRegex);
  if (plainCountryMatch && plainCountryMatch[1]) {
    return `+91${plainCountryMatch[1]}`;
  }

  throw new Error('Invalid Indian phone number format');
}
