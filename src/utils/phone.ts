/**
 * Phone Number Utilities
 * 
 * Helper functions for phone number validation and formatting
 */

/**
 * Validate if a phone number is valid Rwandan or international format
 * @param phone - Phone number to validate
 */
export function isValidPhoneNumber(phone: string): boolean {
  if (!phone || typeof phone !== 'string') {
    return false;
  }

  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');

  // Rwandan phone numbers (8 digits after country code)
  // Or already with country code (250XXXXXXXX)
  const isValidRwandan = /^(2507[28]\d{7}|7[28]\d{7})$/.test(digits);
  
  // General international format (E.164)
  const isValidInternational = /^\+?[1-9]\d{6,14}$/.test(phone.replace(/\s/g, ''));

  return isValidRwandan || isValidInternational;
}

/**
 * Extract phone number digits only
 * @param phone - Phone number
 */
export function extractPhoneDigits(phone: string): string {
  return phone.replace(/\D/g, '');
}

/**
 * Format phone number for display
 * @param phone - Phone number
 * @param countryCode - Country code to add if missing
 */
export function formatPhoneForDisplay(phone: string, countryCode: string = '250'): string {
  const digits = extractPhoneDigits(phone);
  
  if (digits.startsWith(countryCode)) {
    return `+${digits}`;
  }
  
  if (digits.length === 8 && digits.startsWith('7')) {
    return `+${countryCode}${digits}`;
  }
  
  if (digits.length === 9 && digits.startsWith('0')) {
    return `+${countryCode}${digits.substring(1)}`;
  }

  return phone;
}

/**
 * Get phone without country code
 * @param phone - Phone number with country code
 */
export function getPhoneWithoutCountryCode(phone: string): string {
  const digits = extractPhoneDigits(phone);
  
  // Remove Rwanda country code
  if (digits.startsWith('250')) {
    return digits.substring(3);
  }
  
  return digits;
}
