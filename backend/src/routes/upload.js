import { Router } from 'express';
import multer from 'multer';

import { Import } from '../models/Import.js';
import { Email } from '../models/Email.js';
import { parseSpreadsheet } from '../services/excelParser.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

// Hold the file in memory (we parse and discard; rows go to MongoDB).
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
  fileFilter: (req, file, cb) => {
    const ok = /\.(xlsx|xls|csv)$/i.test(file.originalname);
    cb(ok ? null : Object.assign(new Error('Only .xlsx, .xls, or .csv files are allowed'), { status: 400 }), ok);
  },
});

// POST /api/imports  — upload + parse a spreadsheet
router.post(
  '/',
  upload.single('file'),
  asyncHandler(async (req, res) => {
    if (!req.file) throw Object.assign(new Error('No file uploaded'), { status: 400 });

    const parsed = parseSpreadsheet(req.file.buffer);
    const doc = await Import.create({
      filename: req.file.originalname,
      ...parsed,
    });

    res.status(201).json({
      id: doc._id,
      filename: doc.filename,
      columns: doc.columns,
      rowCount: doc.rowCount,
      emailColumn: doc.emailColumn,
      validEmailCount: doc.validEmailCount,
      preview: doc.rows.slice(0, 20), // first 20 rows for the preview table
    });
  })
);

// GET /api/imports  — list past imports (newest first)
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const imports = await Import.find({}, 'filename columns rowCount emailColumn validEmailCount createdAt')
      .sort({ createdAt: -1 })
      .lean();
    res.json(imports);
  })
);

// GET /api/imports/:id  — full import with all rows
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const doc = await Import.findById(req.params.id).lean();
    if (!doc) throw Object.assign(new Error('Import not found'), { status: 404 });
    res.json(doc);
  })
);

// DELETE /api/imports/:id  — remove an import and its generated emails
router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await Email.deleteMany({ importId: req.params.id });
    await Import.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  })
);

export default router;
