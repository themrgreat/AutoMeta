import mongoose from 'mongoose';

// A single uploaded file: its detected columns and parsed rows.
// Rows are stored as free-form objects so any of the up-to-100 custom
// columns from the sheet are preserved verbatim.
const importSchema = new mongoose.Schema(
  {
    filename: { type: String, required: true },
    columns: { type: [String], default: [] },
    rows: { type: [mongoose.Schema.Types.Mixed], default: [] },
    rowCount: { type: Number, default: 0 },
    emailColumn: { type: String, default: null }, // best-guess email column
    validEmailCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Import = mongoose.model('Import', importSchema);
