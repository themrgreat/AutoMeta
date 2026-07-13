import { GoogleGenerativeAI } from '@google/generative-ai';

let client = null;

function getModel() {
  const key = process.env.GEMINI_API_KEY;
  if (!key || key === 'your-gemini-api-key-here') {
    throw Object.assign(
      new Error('GEMINI_API_KEY is not configured. Set it in backend/.env'),
      { status: 503 }
    );
  }
  if (!client) client = new GoogleGenerativeAI(key);
  return client.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-2.0-flash' });
}

// Replace {{variable}} tokens in a string using the contact row.
// Keys are matched case-insensitively and with spaces/underscores normalized,
// so {{company_name}} matches a "Company Name" column.
export function interpolate(text, row) {
  const norm = (s) => String(s).toLowerCase().replace(/[\s_-]+/g, '');
  const lookup = {};
  for (const [k, v] of Object.entries(row || {})) lookup[norm(k)] = v;
  return String(text).replace(/\{\{\s*([\w\s-]+?)\s*\}\}/g, (_, name) => {
    const val = lookup[norm(name)];
    return val === undefined || val === '' ? '' : String(val);
  });
}

// Build the full prompt and ask Gemini for a JSON {subject, body}.
export async function generateEmail({ instruction, tone, row }) {
  const model = getModel();
  const brief = interpolate(instruction, row);

  // Provide the raw contact data so the model can personalize beyond the brief.
  const contactContext = Object.entries(row)
    .filter(([, v]) => v !== '' && v != null)
    .map(([k, v]) => `- ${k}: ${v}`)
    .join('\n');

  const prompt = [
    'You are an expert B2B copywriter generating a personalized cold outreach email.',
    `Desired tone: ${tone || 'Professional'}.`,
    '',
    'Brief:',
    brief,
    '',
    'Contact data:',
    contactContext || '(no additional fields)',
    '',
    'Rules:',
    '- Personalize using the contact data; never invent facts not implied by it.',
    '- Keep the body under 150 words, with a clear opening line and a single call-to-action.',
    '- Do not include a signature block or placeholder like [Your Name].',
    '',
    'Respond with ONLY a JSON object of the form:',
    '{"subject": "...", "body": "..."}',
  ].join('\n');

  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { responseMimeType: 'application/json', temperature: 0.8 },
  });

  const text = result.response.text();
  return parseEmailJSON(text);
}

// Refine a rough user prompt into a stronger reusable template instruction.
export async function enhancePrompt(rawPrompt) {
  const model = getModel();
  const prompt = [
    'Rewrite the following email-generation instruction into a clearer, more effective brief',
    'for an AI copywriter. Keep any {{variables}} intact and you may add useful ones like',
    '{{company_name}}, {{industry}}, {{location}}, {{contact_name}}, {{website}}.',
    'Return ONLY the improved instruction text, no preamble.',
    '',
    `Instruction: ${rawPrompt}`,
  ].join('\n');

  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}

function parseEmailJSON(text) {
  try {
    const obj = JSON.parse(text);
    return { subject: String(obj.subject || '').trim(), body: String(obj.body || '').trim() };
  } catch {
    // Fallback: strip code fences / extract the first {...} block
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        const obj = JSON.parse(match[0]);
        return { subject: String(obj.subject || '').trim(), body: String(obj.body || '').trim() };
      } catch {
        /* fall through */
      }
    }
    // Last resort: treat the whole response as the body.
    return { subject: '(no subject generated)', body: text.trim() };
  }
}
