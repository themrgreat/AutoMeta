import { Router } from 'express';

import { Import } from '../models/Import.js';
import { Template } from '../models/Template.js';
import { Email } from '../models/Email.js';
import { generateEmail, interpolate } from '../services/gemini.js';
import { isValidEmail } from '../services/excelParser.js';
import { pMap } from '../utils/pMap.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

// Pull a likely value for a logical field (company/contact) from a row by
// trying a list of candidate column names case-insensitively.
function pick(row, candidates) {
  const norm = (s) => String(s).toLowerCase().replace(/[\s_-]+/g, '');
  const map = {};
  for (const [k, v] of Object.entries(row)) map[norm(k)] = v;
  for (const c of candidates) {
    const v = map[norm(c)];
    if (v) return String(v);
  }
  return '';
}

// POST /api/generate
// body: { importId, templateId, rowIndexes? (optional subset) }
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { importId, templateId, rowIndexes } = req.body;

    const [imp, template] = await Promise.all([
      Import.findById(importId).lean(),
      Template.findById(templateId).lean(),
    ]);
    if (!imp) throw Object.assign(new Error('Import not found'), { status: 404 });
    if (!template) throw Object.assign(new Error('Template not found'), { status: 404 });
    if (!imp.emailColumn) {
      throw Object.assign(new Error('No email column detected in this import'), { status: 400 });
    }

    // Resolve which rows to process; default to all rows with a valid email.
    const selected =
      Array.isArray(rowIndexes) && rowIndexes.length
        ? rowIndexes.map((i) => imp.rows[i]).filter(Boolean)
        : imp.rows;

    const targets = selected.filter((row) => isValidEmail(row[imp.emailColumn]));
    if (targets.length === 0) {
      throw Object.assign(new Error('No rows with a valid email address to generate'), { status: 400 });
    }

    let failures = 0;
    const docs = await pMap(
      targets,
      async (row) => {
        const base = {
          importId,
          templateId,
          recipientEmail: String(row[imp.emailColumn]).trim(),
          company: pick(row, ['company_name', 'company', 'organization', 'business']),
          contactName: pick(row, ['contact_name', 'name', 'first_name', 'full_name']),
          rowData: row,
        };
        try {
          const { subject, body } = await generateEmail({
            instruction: template.instruction,
            tone: template.tone,
            row,
          });
          return { ...base, subject, body, status: 'generated' };
        } catch (err) {
          failures++;
          return {
            ...base,
            subject: interpolate('Outreach to {{company_name}}', row) || 'Outreach',
            body: '',
            status: 'failed',
            error: err.message,
          };
        }
      },
      4 // concurrency
    );

    const created = await Email.insertMany(docs);
    res.status(201).json({
      generated: created.filter((e) => e.status === 'generated').length,
      failed: failures,
      total: created.length,
    });
  })
);

export default router;
