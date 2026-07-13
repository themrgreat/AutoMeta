import mongoose from 'mongoose';
import { encrypt, decrypt } from '../utils/crypto.js';

// A Zoho Mail account used to send outreach. The SMTP password is stored
// encrypted at rest and never returned to the client (see toSafeJSON).
const senderAccountSchema = new mongoose.Schema(
  {
    senderName: { type: String, required: true },
    email: { type: String, required: true },
    smtpHost: { type: String, default: 'smtp.zoho.com' },
    smtpPort: { type: Number, default: 465 },
    username: { type: String, required: true },
    passwordEnc: { type: String, required: true }, // encrypted app password
    dailyLimit: { type: Number, default: 100 },
    sentToday: { type: Number, default: 0 },
    sentCountResetAt: { type: Date, default: Date.now },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    isDefault: { type: Boolean, default: false },
    lastVerifiedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Set/replace the plaintext password — encrypts before persisting.
senderAccountSchema.methods.setPassword = function (plain) {
  this.passwordEnc = encrypt(plain);
};

// Decrypt for use by the mailer (never exposed over the API).
senderAccountSchema.methods.getPassword = function () {
  return decrypt(this.passwordEnc);
};

// Roll the daily counter over at the start of a new day.
senderAccountSchema.methods.maybeResetDailyCount = function () {
  const last = this.sentCountResetAt || new Date(0);
  const now = new Date();
  if (last.toDateString() !== now.toDateString()) {
    this.sentToday = 0;
    this.sentCountResetAt = now;
  }
};

// Client-safe projection — strips the encrypted password entirely.
senderAccountSchema.methods.toSafeJSON = function () {
  const o = this.toObject();
  delete o.passwordEnc;
  return o;
};

export const SenderAccount = mongoose.model('SenderAccount', senderAccountSchema);
