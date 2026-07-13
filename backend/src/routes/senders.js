import { Router } from 'express';

import { SenderAccount } from '../models/SenderAccount.js';
import { verifyAccount } from '../services/mailer.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

// GET /api/senders
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const accounts = await SenderAccount.find().sort({ isDefault: -1, createdAt: 1 });
    res.json(accounts.map((a) => a.toSafeJSON()));
  })
);

// POST /api/senders
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { senderName, email, smtpHost, smtpPort, username, password, dailyLimit, isDefault } = req.body;
    if (!senderName || !email || !username || !password) {
      throw Object.assign(new Error('senderName, email, username and password are required'), { status: 400 });
    }

    const account = new SenderAccount({
      senderName,
      email,
      smtpHost: smtpHost || process.env.DEFAULT_SMTP_HOST || 'smtp.zoho.com',
      smtpPort: smtpPort || Number(process.env.DEFAULT_SMTP_PORT) || 465,
      username,
      dailyLimit: dailyLimit || 100,
      isDefault: !!isDefault,
    });
    account.setPassword(password);

    if (isDefault) await SenderAccount.updateMany({}, { isDefault: false });
    await account.save();
    res.status(201).json(account.toSafeJSON());
  })
);

// PUT /api/senders/:id
router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const account = await SenderAccount.findById(req.params.id);
    if (!account) throw Object.assign(new Error('Sender account not found'), { status: 404 });

    const fields = ['senderName', 'email', 'smtpHost', 'smtpPort', 'username', 'dailyLimit', 'status'];
    for (const f of fields) if (req.body[f] !== undefined) account[f] = req.body[f];
    if (req.body.password) account.setPassword(req.body.password);
    if (req.body.isDefault) {
      await SenderAccount.updateMany({}, { isDefault: false });
      account.isDefault = true;
    }

    await account.save();
    res.json(account.toSafeJSON());
  })
);

// POST /api/senders/:id/verify  — test SMTP credentials
router.post(
  '/:id/verify',
  asyncHandler(async (req, res) => {
    const account = await SenderAccount.findById(req.params.id);
    if (!account) throw Object.assign(new Error('Sender account not found'), { status: 404 });
    try {
      await verifyAccount(account);
      account.lastVerifiedAt = new Date();
      account.status = 'active';
      await account.save();
      res.json({ ok: true, verifiedAt: account.lastVerifiedAt });
    } catch (err) {
      res.status(400).json({ ok: false, error: err.message });
    }
  })
);

// DELETE /api/senders/:id
router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await SenderAccount.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  })
);

export default router;
