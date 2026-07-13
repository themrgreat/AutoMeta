import mongoose from 'mongoose';

// One generated email tied to a single contact row. Moves through the
// review workflow via `status`.
export const EMAIL_STATUSES = [
  'generated', // AI produced it, awaiting review
  'approved', // user approved, ready to send
  'rejected', // user rejected
  'sending', // handed to the mailer
  'sent', // delivered to SMTP successfully
  'failed', // send failed
];

const emailSchema = new mongoose.Schema(
  {
    importId: { type: mongoose.Schema.Types.ObjectId, ref: 'Import', required: true },
    templateId: { type: mongoose.Schema.Types.ObjectId, ref: 'Template' },
    senderAccountId: { type: mongoose.Schema.Types.ObjectId, ref: 'SenderAccount' },

    recipientEmail: { type: String, required: true },
    company: { type: String, default: '' },
    contactName: { type: String, default: '' },
    rowData: { type: mongoose.Schema.Types.Mixed, default: {} }, // original sheet row

    subject: { type: String, default: '' },
    body: { type: String, default: '' },

    cc: { type: [String], default: [] },
    bcc: { type: [String], default: [] },

    status: { type: String, enum: EMAIL_STATUSES, default: 'generated' },
    error: { type: String, default: null },
    sentAt: { type: Date, default: null },
  },
  { timestamps: true }
);

emailSchema.index({ importId: 1, status: 1 });

export const Email = mongoose.model('Email', emailSchema);
