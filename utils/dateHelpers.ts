
/**
 * Shared date helpers for event dates
 * CRITICAL: All dates are treated as plain local dates (no timezone shifting)
 * This ensures the date shown always matches the date from the API
 */

/**
 * Parse event date from ACF field as a plain local date
 * Handles both "YYYYMMDD" format and natural language dates like "March 28, 2026"
 * Returns null for invalid dates
 */
export const parseEventDate = (dateString: string | undefined): Date | null => {
  if (!dateString) {
    console.log('[DateHelper] Empty date string, returning null');
    return null;
  }

  // Handle YYYYMMDD format (8 digits)
  if (dateString.match(/^\d{8}$/)) {
    const year = parseInt(dateString.substring(0, 4), 10);
    const month = parseInt(dateString.substring(4, 6), 10) - 1; // Month is 0-indexed
    const day = parseInt(dateString.substring(6, 8), 10);
    
    // Create date using local date constructor (no timezone shifting)
    const date = new Date(year, month, day);
    
    if (!isNaN(date.getTime())) {
      console.log(`[DateHelper] Parsed YYYYMMDD "${dateString}" to local date: ${date.toDateString()}`);
      return date;
    }
  }

  // Handle natural language dates (e.g., "March 28, 2026")
  // Parse and extract components to create a plain local date
  const tempDate = new Date(dateString);
  if (!isNaN(tempDate.getTime())) {
    // Extract date components and create a new date at midnight local time
    const year = tempDate.getFullYear();
    const month = tempDate.getMonth();
    const day = tempDate.getDate();
    const date = new Date(year, month, day);
    
    console.log(`[DateHelper] Parsed natural date "${dateString}" to local date: ${date.toDateString()}`);
    return date;
  }

  // Fallback for unparseable dates
  console.warn(`[DateHelper] Could not parse date "${dateString}", returning null`);
  return null;
};

/**
 * Format date for badge display as "MMM D" (e.g., "Mar 28")
 * Uses local timezone (no shifting)
 */
export const formatDateBadge = (date: Date | null): string => {
  if (!date) return '';
  
  try {
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    const day = date.toLocaleDateString('en-US', { day: 'numeric' });
    return `${month} ${day}`;
  } catch {
    return '';
  }
};

/**
 * Format date for full display as "MMMM D, YYYY" (e.g., "March 28, 2026")
 * Uses local timezone (no shifting)
 */
export const formatDateFull = (date: Date | null): string => {
  if (!date) return '';
  
  try {
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
  } catch {
    return '';
  }
};
