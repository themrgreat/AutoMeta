import { Router } from 'express';

import { Template } from '../models/Template.js';
import { enhancePrompt } from '../services/gemini.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

// GET /api/templates
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const templates = await Template.find().sort({ isSeed: -1, name: 1 }).lean();
    res.json(templates);
  })
);

// POST /api/templates
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { name, category, instruction, tone } = req.body;
    if (!name || !instruction) {
      throw Object.assign(new Error('name and instruction are required'), { status: 400 });
    }
    const doc = await Template.create({ name, category, instruction, tone });
    res.status(201).json(doc);
  })
);

// PUT /api/templates/:id
router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const { name, category, instruction, tone } = req.body;
    const doc = await Template.findByIdAndUpdate(
      req.params.id,
      { name, category, instruction, tone },
      { new: true, runValidators: true }
    );
    if (!doc) throw Object.assign(new Error('Template not found'), { status: 404 });
    res.json(doc);
  })
);

// POST /api/templates/:id/clone
router.post(
  '/:id/clone',
  asyncHandler(async (req, res) => {
    const src = await Template.findById(req.params.id).lean();
    if (!src) throw Object.assign(new Error('Template not found'), { status: 404 });
    const doc = await Template.create({
      name: `${src.name} (copy)`,
      category: src.category,
      instruction: src.instruction,
      tone: src.tone,
    });
    res.status(201).json(doc);
  })
);

// DELETE /api/templates/:id
router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await Template.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  })
);

// POST /api/templates/enhance  — AI-refine a raw prompt
router.post(
  '/enhance',
  asyncHandler(async (req, res) => {
    const { prompt } = req.body;
    if (!prompt) throw Object.assign(new Error('prompt is required'), { status: 400 });
    const enhanced = await enhancePrompt(prompt);
    res.json({ enhanced });
  })
);

export default router;
