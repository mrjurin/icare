/**
 * Utility functions for exporting report data
 */

export interface ExportData {
  [key: string]: any;
}

export interface ExportOptions {
  filename: string;
  format: 'csv' | 'json';
  data: ExportData[] | ExportData;
}

/**
 * Fix common character encoding issues in text
 */
function normalizeText(text: string | null | undefined): string {
  if (!text) return '';
  
  // Debug: Log if we find the specific issue
  if (text.includes('‚Äô')) {
    console.log('Found encoding issue in text:', text);
  }
  
  // Fix common UTF-8 encoding issues and Windows-1252 to UTF-8 conversion problems
  let normalized = text
    // Fix the specific issue: NO‚ÄôMAN -> NO'MAN
    .replace(/‚Äô/g, "'")     // This is the exact pattern from your example
    .replace(/‚Äò/g, "'")     // Left single quote
    .replace(/‚Äó/g, "'")     // Right single quote
    .replace(/‚Äú/g, '"')     // Left double quote
    .replace(/‚Äù/g, '"')     // Right double quote
    .replace(/‚Äî/g, '—')     // Em dash
    .replace(/‚Äì/g, '–')     // En dash
    // Additional patterns that might appear
    .replace(/â€™/g, "'")     // Another common apostrophe encoding
    .replace(/â€œ/g, '"')     // Another left quote encoding
    .replace(/â€/g, '"')      // Another right quote encoding
    .replace(/â€"/g, '—')     // Another em dash encoding
    .replace(/â€"/g, '–')     // Another en dash encoding
    // Windows-1252 to UTF-8 issues
    .replace(/Ã¡/g, 'á')      // a with acute
    .replace(/Ã©/g, 'é')      // e with acute
    .replace(/Ã­/g, 'í')      // i with acute
    .replace(/Ã³/g, 'ó')      // o with acute
    .replace(/Ãº/g, 'ú')      // u with acute
    .replace(/Ã±/g, 'ñ')      // n with tilde
    .replace(/Ã¼/g, 'ü')      // u with diaeresis
    .replace(/Ã¤/g, 'ä')      // a with diaeresis
    .replace(/Ã¶/g, 'ö')      // o with diaeresis
    .replace(/Ã /g, 'à')      // a with grave
    .replace(/Ã¨/g, 'è')      // e with grave
    .replace(/Ã¬/g, 'ì')      // i with grave
    .replace(/Ã²/g, 'ò')      // o with grave
    .replace(/Ã¹/g, 'ù')      // u with grave
    .replace(/Ã¢/g, 'â')      // a with circumflex
    .replace(/Ãª/g, 'ê')      // e with circumflex
    .replace(/Ã®/g, 'î')      // i with circumflex
    .replace(/Ã´/g, 'ô')      // o with circumflex
    .replace(/Ã»/g, 'û')      // u with circumflex
    .replace(/Ã£/g, 'ã')      // a with tilde
    .replace(/Ãµ/g, 'õ')      // o with tilde
    .replace(/Ã§/g, 'ç')      // c with cedilla
    .replace(/Ã¥/g, 'å')      // a with ring
    .replace(/Ã¦/g, 'æ')      // ae ligature
    .replace(/Ã¸/g, 'ø')      // o with stroke
    .replace(/Ã¿/g, 'ÿ')      // y with diaeresis
    .replace(/Ã½/g, 'ý')      // y with acute
    // Other common symbols
    .replace(/‚Ä¢/g, '¢')     // Cent sign
    .replace(/‚Ä£/g, '£')     // Pound sign
    .replace(/‚Ä¤/g, '¤')     // Currency sign
    .replace(/‚Ä¥/g, '¥')     // Yen sign
    .replace(/‚Ä¦/g, '¦')     // Broken bar
    .replace(/‚Ä§/g, '§')     // Section sign
    .replace(/‚Ä¨/g, '¨')     // Diaeresis
    .replace(/‚Ä©/g, '©')     // Copyright sign
    .replace(/‚Äª/g, 'ª')     // Feminine ordinal
    .replace(/‚Ä«/g, '«')     // Left guillemet
    .replace(/‚Ä¬/g, '¬')     // Not sign
    .replace(/‚Ä®/g, '®')     // Registered sign
    .replace(/‚Ä¯/g, '¯')     // Macron
    .replace(/‚Ä°/g, '°')     // Degree sign
    .replace(/‚Ä±/g, '±')     // Plus-minus sign
    .replace(/‚Ä²/g, '²')     // Superscript 2
    .replace(/‚Ä³/g, '³')     // Superscript 3
    .replace(/‚Ä´/g, '´')     // Acute accent
    .replace(/‚Äµ/g, 'µ')     // Micro sign
    .replace(/‚Ä¶/g, '¶')     // Pilcrow sign
    .replace(/‚Ä·/g, '·')     // Middle dot
    .replace(/‚Ä¸/g, '¸')     // Cedilla
    .replace(/‚Ä¹/g, '¹')     // Superscript 1
    .replace(/‚Äº/g, 'º')     // Masculine ordinal
    .replace(/‚Ä»/g, '»')     // Right guillemet
    .replace(/‚Ä¼/g, '¼')     // Fraction 1/4
    .replace(/‚Ä½/g, '½')     // Fraction 1/2
    .replace(/‚Ä¾/g, '¾')     // Fraction 3/4
    .replace(/‚Ä¿/g, '¿')     // Inverted question mark
    .trim();
  
  // Debug: Log the result if we made changes
  if (normalized !== text) {
    console.log('Normalized text:', text, '->', normalized);
  }
  
  return normalized;
}

/**
 * Convert data to CSV format
 */
function convertToCSV(data: ExportData[]): string {
  if (!data || data.length === 0) return '';
  
  // Get all unique headers from all objects
  const allHeaders = new Set<string>();
  data.forEach(row => {
    Object.keys(row).forEach(key => allHeaders.add(key));
  });
  
  const headers = Array.from(allHeaders).sort();
  
  // Create CSV header row with proper formatting
  const csvHeaders = headers.map(header => {
    // Convert snake_case to Title Case for better readability
    return header.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }).join(',');
  
  const csvRows = data.map(row => 
    headers.map(header => {
      const value = row[header];
      
      // Handle different data types
      if (value === null || value === undefined) {
        return '';
      }
      
      // Handle numbers - preserve precision for percentages and rates
      if (typeof value === 'number') {
        return value.toString();
      }
      
      // Handle strings that might contain commas, quotes, or newlines
      if (typeof value === 'string') {
        // Normalize text to fix encoding issues
        const normalizedValue = normalizeText(value);
        if (normalizedValue.includes(',') || normalizedValue.includes('"') || normalizedValue.includes('\n')) {
          return `"${normalizedValue.replace(/"/g, '""')}"`;
        }
        return normalizedValue;
      }
      
      // Handle other types (arrays, objects, etc.)
      if (typeof value === 'object') {
        const stringValue = JSON.stringify(value);
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      
      return value.toString();
    }).join(',')
  );
  
  return [csvHeaders, ...csvRows].join('\n');
}

/**
 * Download data as a file
 */
function downloadFile(content: string, filename: string, mimeType: string): void {
  // Add BOM for UTF-8 encoding to ensure proper display in Excel
  const BOM = '\uFEFF';
  const contentWithBOM = BOM + content;
  
  const blob = new Blob([contentWithBOM], { type: mimeType });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export data to file
 */
export function exportData({ filename, format, data }: ExportOptions): void {
  try {
    let content: string;
    let mimeType: string;
    let fileExtension: string;
    
    if (format === 'csv') {
      // Ensure data is an array for CSV export
      const arrayData = Array.isArray(data) ? data : [data];
      content = convertToCSV(arrayData);
      mimeType = 'text/csv;charset=utf-8;';
      fileExtension = 'csv';
    } else {
      // JSON format
      content = JSON.stringify(data, null, 2);
      mimeType = 'application/json;charset=utf-8;';
      fileExtension = 'json';
    }
    
    const fullFilename = filename.endsWith(`.${fileExtension}`) 
      ? filename 
      : `${filename}.${fileExtension}`;
    
    downloadFile(content, fullFilename, mimeType);
  } catch (error) {
    console.error('Export failed:', error);
    throw new Error('Failed to export data');
  }
}

/**
 * Generate timestamp for filename
 */
export function generateTimestamp(): string {
  const now = new Date();
  return now.toISOString().replace(/[:.]/g, '-').slice(0, -5);
}