const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { pool } = require('../config/db');
const { requireUploader } = require('../middleware/auth');

// Setup multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.resolve(__dirname, '../../uploads');
    if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit per SRS
});

// Image upload storage
const imageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.resolve(__dirname, '../../uploads/games');
    if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const imageUpload = multer({
  storage: imageStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only image files (JPEG, PNG, GIF, WebP) are allowed'), false);
  }
});

// Extract text from uploaded file
const extractText = async (filePath, ext) => {
  if (ext === '.json') {
    const content = fs.readFileSync(filePath, 'utf-8');
    return { type: 'json', data: JSON.parse(content) };
  }

  if (ext === '.txt') {
    const text = fs.readFileSync(filePath, 'utf-8');
    return { type: 'text', data: text };
  }

  if (ext === '.pdf') {
    try {
      const pdfParse = require('pdf-parse');
      const dataBuffer = fs.readFileSync(filePath);
      const pdfData = await pdfParse(dataBuffer);
      return { type: 'text', data: pdfData.text };
    } catch (err) {
      console.error('PDF parse error:', err);
      throw new Error('Could not extract text from PDF. Please ensure the PDF contains selectable text.');
    }
  }

  if (ext === '.docx') {
    try {
      const mammoth = require('mammoth');
      const result = await mammoth.extractRawText({ path: filePath });
      return { type: 'text', data: result.value };
    } catch (err) {
      console.error('DOCX parse error:', err);
      throw new Error('Could not extract text from DOCX file.');
    }
  }

  throw new Error('Unsupported file format. Please upload TXT, PDF, DOCX, or JSON files.');
};

// Parse structured text files
const parseStructuredText = (text) => {
  const lines = text.split('\n');
  const questions = [];
  let currentQ = null;

  for (let line of lines) {
    line = line.trim();
    if (!line) continue;

    // Detect question start (supports Question:, Q:, Pertanyaan:)
    // We make sure it doesn't match Question_EN
    if (line.match(/^(Question|Q|Pertanyaan)\s*:/i) && !line.match(/_(EN|ENG)/i)) {
      if (currentQ && currentQ.question_text) {
        questions.push(currentQ);
      }
      currentQ = {
        question_text: line.replace(/^(Question|Q|Pertanyaan)\s*:\s*/i, '').trim(),
        question_text_en: '',
        option_a: '',
        option_a_en: '',
        option_b: '',
        option_b_en: '',
        option_c: '',
        option_c_en: '',
        option_d: '',
        option_d_en: '',
        correct_option: 'A'
      };
    } else if (currentQ) {
      if (line.match(/^(Question_EN|Q_EN|Pertanyaan_EN)\s*:/i)) {
        currentQ.question_text_en = line.replace(/^(Question_EN|Q_EN|Pertanyaan_EN)\s*:\s*/i, '').trim();
      } else if (line.match(/^A_EN\s*:/i)) {
        currentQ.option_a_en = line.replace(/^A_EN\s*:\s*/i, '').trim();
      } else if (line.match(/^A\s*:/i)) {
        currentQ.option_a = line.replace(/^A\s*:\s*/i, '').trim();
      } else if (line.match(/^B_EN\s*:/i)) {
        currentQ.option_b_en = line.replace(/^B_EN\s*:\s*/i, '').trim();
      } else if (line.match(/^B\s*:/i)) {
        currentQ.option_b = line.replace(/^B\s*:\s*/i, '').trim();
      } else if (line.match(/^C_EN\s*:/i)) {
        currentQ.option_c_en = line.replace(/^C_EN\s*:\s*/i, '').trim();
      } else if (line.match(/^C\s*:/i)) {
        currentQ.option_c = line.replace(/^C\s*:\s*/i, '').trim();
      } else if (line.match(/^D_EN\s*:/i)) {
        currentQ.option_d_en = line.replace(/^D_EN\s*:\s*/i, '').trim();
      } else if (line.match(/^D\s*:/i)) {
        currentQ.option_d = line.replace(/^D\s*:\s*/i, '').trim();
      } else if (line.match(/^(Answer|Kunci|Ans|Jawaban)\s*:/i)) {
        currentQ.correct_option = line.replace(/^(Answer|Kunci|Ans|Jawaban)\s*:\s*/i, '').trim().toUpperCase().charAt(0);
      } else if (line.match(/^(Image|Gambar|Img)\s*:/i)) {
        currentQ.image_url = line.replace(/^(Image|Gambar|Img)\s*:\s*/i, '').trim();
      }
    }
  }
  if (currentQ && currentQ.question_text) {
    questions.push(currentQ);
  }
  return questions;
};

// Auto-generate questions using Groq API
const generateQuestionsWithAI = async (text, numQuestions = 5) => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return generateFallbackQuestions(text, numQuestions);
  }

  try {
    const Groq = require('groq-sdk');
    const groq = new Groq({ apiKey });

    const truncatedText = text.substring(0, 3000); // Limit input

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are a quiz generator for a game guessing platform called GameGuessr. 
Generate multiple-choice questions based on the provided game description/content.
Each question should test knowledge about games mentioned in the text.
Return ONLY a valid JSON array with no extra text. Each object must have:
{"question_text":"...","option_a":"...","option_b":"...","option_c":"...","option_d":"...","correct_option":"A|B|C|D"}`
        },
        {
          role: 'user',
          content: `Generate ${numQuestions} multiple-choice questions from this content:\n\n${truncatedText}`
        }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3,
      max_tokens: 2000,
      response_format: { type: 'json_object' }
    });

    const responseText = completion.choices[0]?.message?.content || '';

    try {
      const parsed = JSON.parse(responseText);
      // Handle both array and object with array property
      const questions = Array.isArray(parsed) ? parsed : (parsed.questions || parsed.mcqs || Object.values(parsed)[0]);

      if (Array.isArray(questions) && questions.length > 0) {
        return questions.map(q => ({
          question_text: q.question_text || q.question || '',
          option_a: q.option_a || q.options?.a || q.options?.[0] || '',
          option_b: q.option_b || q.options?.b || q.options?.[1] || '',
          option_c: q.option_c || q.options?.c || q.options?.[2] || '',
          option_d: q.option_d || q.options?.d || q.options?.[3] || '',
          correct_option: (q.correct_option || q.correct || q.answer || 'A').toUpperCase().charAt(0)
        }));
      }
    } catch (parseErr) {
      console.error('AI response parse error:', parseErr);
    }

    return generateFallbackQuestions(text, numQuestions);
  } catch (err) {
    console.error('Groq API error:', err);
    return generateFallbackQuestions(text, numQuestions);
  }
};

// Fallback question generation without AI
const generateFallbackQuestions = (text, numQuestions) => {
  const sentences = text.split(/[.!?\n]+/).filter(s => s.trim().length > 20);
  const questions = [];

  for (let i = 0; i < Math.min(numQuestions, sentences.length, 10); i++) {
    const sentence = sentences[i].trim();
    const words = sentence.split(/\s+/).filter(w => w.length > 3);
    const keyword = words[Math.floor(words.length / 2)] || words[0] || 'this';

    questions.push({
      question_text: `Based on the text: "${sentence.substring(0, 100)}..." - What is being described?`,
      option_a: keyword,
      option_b: 'None of the above',
      option_c: 'All of the above',
      option_d: 'Not mentioned',
      correct_option: 'A'
    });
  }

  if (questions.length === 0) {
    questions.push({
      question_text: 'What game is described in the uploaded content?',
      option_a: 'The game from the document',
      option_b: 'A different game',
      option_c: 'Not a game',
      option_d: 'None of the above',
      correct_option: 'A'
    });
  }

  return questions;
};

// POST /api/upload/document - Upload and parse document
router.post('/document', requireUploader, upload.single('document'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ status: 'error', error: { code: 'UPLOAD_001', message: 'No file uploaded' } });
  }

  const filePath = req.file.path;
  const ext = path.extname(req.file.originalname).toLowerCase();

  try {
    const extracted = await extractText(filePath, ext);

    let questions;
    if (extracted.type === 'json') {
      questions = Array.isArray(extracted.data) ? extracted.data : (extracted.data.questions || []);
    } else {
      const parsedStructured = parseStructuredText(extracted.data);
      if (parsedStructured.length > 0) {
        questions = parsedStructured;
      } else {
        const numQuestions = parseInt(req.body.num_questions) || 5;
        questions = await generateQuestionsWithAI(extracted.data, numQuestions);
      }
    }

    // Cleanup uploaded file
    try { fs.unlinkSync(filePath); } catch (e) { /* ignore */ }

    res.json({
      status: 'success',
      data: {
        extracted_text: extracted.type === 'text' ? extracted.data.substring(0, 500) : null,
        questions
      },
      message: 'Document processed successfully. Questions generated!'
    });
  } catch (err) {
    try { fs.unlinkSync(filePath); } catch (e) { /* ignore */ }
    console.error('Document processing error:', err);
    res.status(500).json({ status: 'error', error: { code: 'UPLOAD_002', message: err.message || 'Error processing document' } });
  }
});

// POST /api/upload/image - Upload game image
router.post('/image', requireUploader, imageUpload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ status: 'error', error: { code: 'UPLOAD_003', message: 'No image uploaded' } });
  }

  const imageUrl = `/uploads/games/${req.file.filename}`;
  res.json({
    status: 'success',
    data: { image_url: imageUrl },
    message: 'Image uploaded successfully!'
  });
});

// POST /api/upload/create-quiz - Create and publish quiz
router.post('/create-quiz', requireUploader, async (req, res) => {
  const { title, title_en, description, description_en, category_tags, time_limit, questions } = req.body;
  const userId = req.user.id;

  if (!title || !questions || questions.length === 0) {
    return res.status(400).json({ status: 'error', error: { code: 'UPLOAD_004', message: 'A quiz must have a title and at least one question.' } });
  }

  if (title.length > 100) {
    return res.status(400).json({ status: 'error', error: { code: 'UPLOAD_005', message: 'Quiz title must be 100 characters or less.' } });
  }

  try {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const [quizResult] = await conn.query(
        `INSERT INTO quizzes (title, title_en, description, description_en, category_tags, time_limit, created_by, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'published')`,
        [title, title_en || null, description || null, description_en || null, category_tags || null, time_limit || 30, userId]
      );
      const quizId = quizResult.insertId;

      for (const q of questions) {
        await conn.query(
          `INSERT INTO questions (quiz_id, question_text, question_text_en, image_url, option_a, option_a_en, option_b, option_b_en, option_c, option_c_en, option_d, option_d_en, correct_option) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            quizId,
            q.question_text,
            q.question_text_en || null,
            q.image_url || null,
            q.option_a,
            q.option_a_en || null,
            q.option_b,
            q.option_b_en || null,
            q.option_c,
            q.option_c_en || null,
            q.option_d,
            q.option_d_en || null,
            q.correct_option || 'A'
          ]
        );
      }

      await conn.commit();

      res.status(201).json({
        status: 'success',
        data: { quizId },
        message: 'Quiz created and published successfully!'
      });
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error('Quiz creation error:', err);
    res.status(500).json({ status: 'error', error: { code: 'UPLOAD_099', message: 'Failed to create quiz' } });
  }
});

// POST /api/upload/generate - Generate questions from text (without file upload)
router.post('/generate', requireUploader, async (req, res) => {
  const { text, num_questions } = req.body;

  if (!text || text.trim().length < 50) {
    return res.status(400).json({ status: 'error', error: { code: 'GEN_001', message: 'Please provide at least 50 characters of text.' } });
  }

  try {
    const questions = await generateQuestionsWithAI(text, num_questions || 5);
    res.json({
      status: 'success',
      data: { questions },
      message: 'Questions generated successfully!'
    });
  } catch (err) {
    console.error('Question generation error:', err);
    res.status(500).json({ status: 'error', error: { code: 'GEN_099', message: 'Failed to generate questions' } });
  }
});

module.exports = router;
