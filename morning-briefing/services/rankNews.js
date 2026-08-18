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

Write every explanation in plain, warm, conversational language, like you're catching a friend up over coffee. If a story involves a financial, technical, or political term someone might not know, quietly explain it in the same sentence instead of assuming it's understood. Never sound like a press release or a textbook.`;

function buildUserPrompt(items) {
  return `Here are today's raw headlines from a mix of world, business, tech/AI, science, and culture sources, each with a number:

${formatItems(items)}

Pick the 8 stories that matter most today, across different topics, not all from one category. Skip celebrity gossip or pure filler.

For each story you pick, write two things:
- "why": one short, punchy sentence, this is the teaser someone sees before clicking
- "summary": a fuller explanation, 3 to 4 sentences (keep it tight), that tells the story: what happened, who's involved, and why it matters. Someone reading only this should feel like they understand the story.

Respond with ONLY valid JSON, no markdown fences, no preamble, in exactly this shape:
{
  "picks": [
    {"number": 3, "why": "one short punchy sentence", "summary": "3-4 sentence plain-language explanation"}
  ]
}

"number" must be the exact number from the list above. Do not invent titles, links, or sources, just reference the number.`;
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
      temperature: 0.4,
      max_tokens: 2048,
      response_format: { type: 'json_object' }
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

  let parsed;
  try {
    parsed = JSON.parse(clean);
  } catch (err) {
    throw new Error('Model did not return valid JSON. Raw response: ' + clean.slice(0, 300));
  }

  const picks = parsed.picks || [];

  // Map each pick's number back to the REAL item data (title, link, source, topic)
  // pulled from our own fetched RSS data, never from what the model typed back.
  // This is what guarantees "Read the original article" always points somewhere real.
  const stories = picks
    .map(pick => {
      const item = items[pick.number - 1];
      if (!item) return null;
      return {
        title: item.title,
        link: item.link,
        source: item.source,
        topic: item.topic,
        why: pick.why,
        summary: pick.summary
      };
    })
    .filter(Boolean);

  return { stories };
}

module.exports = { rankHeadlines };
