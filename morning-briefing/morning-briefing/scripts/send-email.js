// Sends today's briefing to your inbox. Run manually with `npm run email`,
// or schedule it (see README) to run automatically every morning.
require('dotenv').config();
const nodemailer = require('nodemailer');
const { gatherAll } = require('../services/fetchNews');
const { rankHeadlines } = require('../services/rankNews');

function buildHtml(stories) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <p style="color: #888; font-size: 12px; letter-spacing: 1px; text-transform: uppercase;">Today — ${new Date().toLocaleDateString()}</p>
      ${(stories || []).map((it, i) => `
        <div style="margin-bottom: 18px;">
          <span style="font-size: 10px; letter-spacing: 0.05em; text-transform: uppercase; color: #999;">${it.topic}</span><br>
          <a href="${it.link}" style="font-size: 16px; font-weight: bold; color: #16243a; text-decoration: none;">
            ${i + 1}. ${it.title}
          </a>
          <p style="margin: 4px 0 0; color: #444; font-size: 14px; font-weight: 600;">${it.why}</p>
          <p style="margin: 6px 0 0; color: #555; font-size: 13px; line-height: 1.6;">${it.summary || ''}</p>
          <p style="margin: 6px 0 0; color: #888; font-size: 12px;">${it.source}</p>
        </div>
      `).join('')}
    </div>
  `;
}

async function main() {
  console.log('Gathering headlines...');
  const items = await gatherAll();

  console.log('Ranking with Groq...');
  const ranked = await rankHeadlines(items);

  console.log('Sending email...');
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
  });

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: process.env.EMAIL_TO,
    subject: `Today's Briefing — ${new Date().toLocaleDateString()}`,
    html: buildHtml(ranked.stories)
  });

  console.log('Sent.');
}

main().catch(err => {
  console.error('Failed to send briefing email:', err.message);
  process.exit(1);
});
