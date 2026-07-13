import * as XLSX from 'xlsx';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Column-name hints used to auto-detect which field holds the email address.
const EMAIL_HINTS = ['email', 'e-mail', 'mail', 'email address'];

export function isValidEmail(value) {
  return typeof value === 'string' && EMAIL_RE.test(value.trim());
}

// Parse an uploaded .xlsx/.xls/.csv buffer into { columns, rows, emailColumn, ... }.
// Missing cells become '' so downstream code can rely on every key existing.
export function parseSpreadsheet(buffer) {
  const wb = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = wb.SheetNames[0];
  if (!sheetName) throw Object.assign(new Error('The file has no sheets'), { status: 400 });

  const sheet = wb.Sheets[sheetName];
  // defval:'' keeps missing values as empty strings; raw:false stringifies numbers/dates predictably
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false });

  if (rows.length === 0) {
    throw Object.assign(new Error('The file contains no data rows'), { status: 400 });
  }

  // Union of all keys across rows preserves columns even if the first row is sparse.
  const columns = [];
  for (const row of rows) {
    for (const key of Object.keys(row)) {
      if (!columns.includes(key)) columns.push(key);
    }
  }

  const emailColumn = detectEmailColumn(columns, rows);
  let validEmailCount = 0;
  if (emailColumn) {
    for (const row of rows) {
      if (isValidEmail(row[emailColumn])) validEmailCount++;
    }
  }

  return {
    columns,
    rows,
    rowCount: rows.length,
    emailColumn,
    validEmailCount,
  };
}

// Prefer a column whose name looks like "email"; otherwise pick the column
// with the most valid-email-looking values.
function detectEmailColumn(columns, rows) {
  const byName = columns.find((c) => EMAIL_HINTS.includes(c.trim().toLowerCase()));
  if (byName) return byName;

  let best = null;
  let bestHits = 0;
  for (const col of columns) {
    let hits = 0;
    for (const row of rows) if (isValidEmail(row[col])) hits++;
    if (hits > bestHits) {
      bestHits = hits;
      best = col;
    }
  }
  return bestHits > 0 ? best : null;
}
