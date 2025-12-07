/**
 * Utility functions for Malaysian IC (Identity Card) number processing
 */

/**
 * Extract date of birth from Malaysian IC number
 * Format: YYMMDD-PB-G### (e.g., 850101-01-1234)
 * 
 * @param icNumber - Malaysian IC number (with or without dashes)
 * @returns Date of birth as ISO string, or null if invalid
 */
export function extractDateOfBirthFromIC(icNumber: string | null | undefined): string | null {
  if (!icNumber) return null;

  // Remove all non-digit characters
  const cleaned = icNumber.replace(/\D/g, "");

  // Malaysian IC should be 12 digits
  if (cleaned.length !== 12) return null;

  // Extract YY, MM, DD
  const year = parseInt(cleaned.substring(0, 2), 10);
  const month = parseInt(cleaned.substring(2, 4), 10);
  const day = parseInt(cleaned.substring(4, 6), 10);

  // Validate month and day
  if (month < 1 || month > 12) return null;
  if (day < 1 || day > 31) return null;

  // Determine century: if YY is 00-30, assume 2000-2030, otherwise 1900-1999
  // This is a heuristic - adjust based on your use case
  const fullYear = year <= 30 ? 2000 + year : 1900 + year;

  // Validate the date
  const date = new Date(fullYear, month - 1, day);
  
  // Check if date is valid (handles invalid dates like Feb 30)
  if (
    date.getFullYear() !== fullYear ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  // Return ISO string
  return date.toISOString();
}

/**
 * Calculate age from date of birth
 * @param dateOfBirth - Date of birth as ISO string or Date object
 * @returns Age in years, or null if invalid
 */
export function calculateAge(dateOfBirth: string | Date | null | undefined): number | null {
  if (!dateOfBirth) return null;

  const dob = typeof dateOfBirth === "string" ? new Date(dateOfBirth) : dateOfBirth;
  if (isNaN(dob.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }

  return age;
}

/**
 * Check if a person is eligible to vote (18+ in Malaysia)
 * @param dateOfBirth - Date of birth as ISO string or Date object
 * @returns true if eligible to vote, false otherwise
 */
export function isEligibleToVote(dateOfBirth: string | Date | null | undefined): boolean {
  const age = calculateAge(dateOfBirth);
  return age !== null && age >= 18;
}

/**
 * Check if a person is a child (under 18)
 * @param dateOfBirth - Date of birth as ISO string or Date object
 * @returns true if child, false otherwise
 */
export function isChild(dateOfBirth: string | Date | null | undefined): boolean {
  const age = calculateAge(dateOfBirth);
  return age !== null && age < 18;
}

/**
 * Normalize IC number by removing dashes and spaces
 * @param icNumber - Malaysian IC number (with or without dashes/spaces)
 * @returns Normalized IC number (digits only), or empty string if invalid
 */
export function normalizeIcNumber(icNumber: string | null | undefined): string {
  if (!icNumber) return "";
  // Remove all non-digit characters
  return icNumber.replace(/\D/g, "");
}
