const axios = require('axios');

// gpt-oss-120b is Groq's current recommended general-purpose model
// (llama-3.3-70b-versatile was deprecated on the free tier in mid-2026).
const MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';

function formatItems(items) {
  return items
    .map((it, i) => `${i + 1}. [${it.topic} | ${it.source}] ${it.title} — ${it.description}`)
    .join('\n');
}

const SYSTEM_PROMPT = `You are a friendly, sharp news editor picking today's most important stories for a smart, busy person who does not want jargon or a wall of text.

Write every "why" explanation in plain, warm, conversational language, like you're catching a friend up over coffee. If a story involves a financial, technical, or political term someone might not know, quietly explain it in the same sentence instead of assuming it's understood. Never sound like a press release or a textbook.`;

function buildUserPrompt(items) {
  return `Here are today's raw headlines from a mix of world, business, tech/AI, science, and culture sources:

${formatItems(items)}

Pick the 8 stories that matter most today, across different topics, not all from one category. Skip celebrity gossip or pure filler.

Respond with ONLY valid JSON, no markdown fences, no preamble, in exactly this shape:
{
  "stories": [
    {"title": "...", "why": "one or two warm, plain-language sentences on why this matters", "source": "...", "link": "...", "topic": "World | Business | Tech & AI | Science | Culture"}
  ]
}

Use the original article title, link, source, and topic from the list above for each item you pick.`;
}

async function rankHeadlines(items) {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not set. Copy .env.example to .env and add your free Groq key from console.groq.com.');
  }

  const response = await axios.post(
    'https://api.groq.com/openai/v1/chat/completions',
    {
      model: MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildUserPrompt(items) }
      ],
      temperature: 0.4
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      }
    }
  );

  const text = response.data.choices?.[0]?.message?.content;
  if (!text) throw new Error('No text content returned by the model.');

  const clean = text.replace(/```json|```/g, '').trim();

  try {
    return JSON.parse(clean);
  } catch (err) {
    throw new Error('Model did not return valid JSON. Raw response: ' + clean.slice(0, 300));
  }
}

module.exports = { rankHeadlines };
