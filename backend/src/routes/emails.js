import { Router } from 'express';

import { Email } from '../models/Email.js';
import { Template } from '../models/Template.js';
import { SenderAccount } from '../models/SenderAccount.js';
import { sendEmail } from '../services/mailer.js';
import { generateEmail } from '../services/gemini.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

// GET /api/emails?importId=&status=&search=
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { importId, status, search } = req.query;
    const q = {};
    if (importId) q.importId = importId;
    if (status && status !== 'all') q.status = status;
    if (search) {
      const re = new RegExp(search, 'i');
      q.$or = [{ recipientEmail: re }, { company: re }, { contactName: re }, { subject: re }];
    }
    const emails = await Email.find(q).sort({ createdAt: -1 }).limit(2000).lean();
    res.json(emails);
  })
);

// GET /api/emails/stats?importId=  — status counts for dashboards
router.get(
  '/stats',
  asyncHandler(async (req, res) => {
    const match = req.query.importId ? { importId: req.query.importId } : {};
    const rows = await Email.aggregate([
      { $match: match },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    const stats = Object.fromEntries(rows.map((r) => [r._id, r.count]));
    res.json(stats);
  })
);

// PATCH /api/emails/:id  — edit subject/body/cc/bcc/status
router.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const allowed = ['subject', 'body', 'cc', 'bcc', 'status'];
    const update = {};
    for (const f of allowed) if (req.body[f] !== undefined) update[f] = req.body[f];
    const doc = await Email.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!doc) throw Object.assign(new Error('Email not found'), { status: 404 });
    res.json(doc);
  })
);

// POST /api/emails/bulk-status  — approve/reject many at once
// body: { ids: [], status: 'approved'|'rejected'|'generated' }
router.post(
  '/bulk-status',
  asyncHandler(async (req, res) => {
    const { ids, status } = req.body;
    if (!Array.isArray(ids) || !status) {
      throw Object.assign(new Error('ids[] and status are required'), { status: 400 });
    }
    const result = await Email.updateMany({ _id: { $in: ids } }, { status });
    res.json({ modified: result.modifiedCount });
  })
);

// POST /api/emails/:id/regenerate  — re-run AI for one email
router.post(
  '/:id/regenerate',
  asyncHandler(async (req, res) => {
    const email = await Email.findById(req.params.id);
    if (!email) throw Object.assign(new Error('Email not found'), { status: 404 });
    const template = await Template.findById(email.templateId).lean();
    if (!template) throw Object.assign(new Error('Source template no longer exists'), { status: 400 });

    const { subject, body } = await generateEmail({
      instruction: template.instruction,
      tone: template.tone,
      row: email.rowData,
    });
    email.subject = subject;
    email.body = body;
    email.status = 'generated';
    email.error = null;
    await email.save();
    res.json(email);
  })
);

// Choose the next active sender account with remaining daily quota.
// Rotates by sending the least-recently-used (lowest sentToday) first.
async function pickSender() {
  const accounts = await SenderAccount.find({ status: 'active' });
  const available = [];
  for (const acc of accounts) {
    acc.maybeResetDailyCount();
    if (acc.sentToday < acc.dailyLimit) available.push(acc);
  }
  if (available.length === 0) return null;
  available.sort((a, b) => a.sentToday - b.sentToday);
  return available[0];
}

// POST /api/emails/send  — send one or many emails by id
// body: { ids: [] }
router.post(
  '/send',
  asyncHandler(async (req, res) => {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      throw Object.assign(new Error('ids[] is required'), { status: 400 });
    }

    const emails = await Email.find({ _id: { $in: ids }, status: { $in: ['generated', 'approved', 'failed'] } });
    const results = [];

    for (const email of emails) {
      const sender = await pickSender();
      if (!sender) {
        email.status = 'failed';
        email.error = 'No active sender account with remaining daily quota';
        await email.save();
        results.push({ id: email._id, ok: false, error: email.error });
        continue;
      }

      email.status = 'sending';
      await email.save();
      try {
        await sendEmail(sender, {
          to: email.recipientEmail,
          subject: email.subject,
          body: email.body,
          cc: email.cc,
          bcc: email.bcc,
        });
        email.status = 'sent';
        email.sentAt = new Date();
        email.senderAccountId = sender._id;
        email.error = null;
        await email.save();

        sender.maybeResetDailyCount();
        sender.sentToday += 1;
        await sender.save();

        results.push({ id: email._id, ok: true });
      } catch (err) {
        email.status = 'failed';
        email.error = err.message;
        await email.save();
        results.push({ id: email._id, ok: false, error: err.message });
      }
    }

    res.json({
      sent: results.filter((r) => r.ok).length,
      failed: results.filter((r) => !r.ok).length,
      results,
    });
  })
);

export default router;
