/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Simple CSV Parser that handles Bengali unicode characters, quotes, and commas
export function parseCSV(text: string): string[][] {
  const lines: string[][] = [];
  let row: string[] = [];
  let inQuotes = false;
  let currentToken = '';

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentToken += '"';
        i++; // skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      row.push(currentToken.trim());
      currentToken = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++; // skip \n
      }
      row.push(currentToken.trim());
      if (row.length > 1 || row[0] !== '') {
        lines.push(row);
      }
      row = [];
      currentToken = '';
    } else {
      currentToken += char;
    }
  }

  if (currentToken !== '' || row.length > 0) {
    row.push(currentToken.trim());
    lines.push(row);
  }

  return lines;
}

// Convert JSON objects array to CSV download
export function downloadCSV<T extends Record<string, any>>(
  data: T[],
  headersMap: { key: keyof T; label: string }[],
  fileName: string
) {
  // Construct headers row
  const headerLine = headersMap.map(h => `"${String(h.label).replace(/"/g, '""')}"`).join(',');
  
  // Construct rows
  const rows = data.map(item => {
    return headersMap.map(h => {
      const val = item[h.key] !== undefined && item[h.key] !== null ? String(item[h.key]) : '';
      return `"${val.replace(/"/g, '""')}"`;
    }).join(',');
  });

  const csvContent = '\uFEFF' + [headerLine, ...rows].join('\n'); // Add BOM for Excel Bengali rendering support
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${fileName}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
