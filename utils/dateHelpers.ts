
/**
 * Parse event date from ACF field
 * Handles both "YYYYMMDD" format and natural language dates like "March 28, 2026"
 */
export const parseEventDate = (dateString: string | undefined): Date => {
  if (!dateString) {
    console.log('[DateHelper] Empty date string, returning epoch');
    return new Date(0); // Treat invalid/empty dates as very old
  }

  // Handle YYYYMMDD format (8 digits)
  if (dateString.match(/^\d{8}$/)) {
    const year = dateString.substring(0, 4);
    const month = dateString.substring(4, 6);
    const day = dateString.substring(6, 8);
    const isoDate = `${year}-${month}-${day}`;
    const parsedDate = new Date(isoDate);
    
    if (!isNaN(parsedDate.getTime())) {
      console.log(`[DateHelper] Parsed YYYYMMDD "${dateString}" to ${parsedDate.toISOString()}`);
      return parsedDate;
    }
  }

  // Handle other formats (e.g., "March 28, 2026")
  const parsedDate = new Date(dateString);
  if (!isNaN(parsedDate.getTime())) {
    console.log(`[DateHelper] Parsed natural date "${dateString}" to ${parsedDate.toISOString()}`);
    return parsedDate;
  }

  // Fallback for unparseable dates
  console.warn(`[DateHelper] Could not parse date "${dateString}", returning epoch`);
  return new Date(0);
};

/**
 * Format date for display as "Month Day" (e.g., "Mar 28")
 */
export const formatDateBadge = (date: Date): string => {
  try {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  } catch {
    return '';
  }
};

/**
 * Format date for display as "Month Day, Year" (e.g., "March 28, 2026")
 */
export const formatDateFull = (date: Date): string => {
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
