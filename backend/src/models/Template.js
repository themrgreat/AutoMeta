import mongoose from 'mongoose';

// A prompt template drives the AI generation. `instruction` is the natural
// language brief sent to Gemini and may contain {{variables}} that get
// substituted from each contact row before generation.
const templateSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    category: { type: String, default: 'Custom' },
    instruction: { type: String, required: true },
    tone: { type: String, default: 'Professional' },
    isSeed: { type: Boolean, default: false }, // built-in starter templates
  },
  { timestamps: true }
);

export const Template = mongoose.model('Template', templateSchema);

const SEED_TEMPLATES = [
  {
    name: 'Sales Outreach',
    category: 'Sales',
    tone: 'Professional',
    instruction:
      'Write a personalized B2B sales outreach email to {{contact_name}} at {{company_name}} ' +
      '({{website}}) in the {{industry}} industry, located in {{location}}. Focus on a clear ' +
      'business value proposition and end with a soft call-to-action to book a short call.',
  },
  {
    name: 'Lead Generation',
    category: 'Lead Gen',
    tone: 'Friendly',
    instruction:
      'Write a concise lead-generation email for {{company_name}} in {{location}}. ' +
      'Open with a relevant observation about their {{industry}} space and invite them to learn more.',
  },
  {
    name: 'Partnership Proposal',
    category: 'Partnership',
    tone: 'Professional',
    instruction:
      'Write a partnership proposal email to {{contact_name}} at {{company_name}}. ' +
      'Reference their work in {{industry}} and propose a mutually beneficial collaboration.',
  },
  {
    name: 'Product Introduction',
    category: 'Product',
    tone: 'Enthusiastic',
    instruction:
      'Write a product introduction email tailored to {{company_name}} in the {{industry}} sector. ' +
      'Explain how the product solves a problem relevant to them and include a clear next step.',
  },
  {
    name: 'Recruitment Outreach',
    category: 'Recruiting',
    tone: 'Warm',
    instruction:
      'Write a recruitment outreach email to {{contact_name}} highlighting an exciting opportunity ' +
      'relevant to their background. Keep it personable and end by inviting a conversation.',
  },
];

// Insert built-in templates once on first boot.
export async function seedTemplates() {
  const count = await Template.countDocuments({ isSeed: true });
  if (count === 0) {
    await Template.insertMany(SEED_TEMPLATES.map((t) => ({ ...t, isSeed: true })));
    console.log(`[seed] inserted ${SEED_TEMPLATES.length} starter templates`);
  }
}
