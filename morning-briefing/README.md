# Today — a self-hosted daily news briefing

Pulls headlines from world, business, tech/AI, science, and culture RSS feeds,
sends them to Groq (free) to pick the 8 that matter most, explained in plain
language with no jargon, and shows them on a small website you can open like
any other page. Optionally emails you the same digest on a schedule.

## Structure

```
morning-briefing/
├── server.js              # Express server + /api/briefing endpoint
├── services/
│   ├── fetchNews.js         # Pulls and parses RSS feeds across topics
│   └── rankNews.js          # Sends headlines to Groq, gets back ranked JSON
├── public/
│   └── index.html           # The website itself
├── scripts/
│   └── send-email.js        # Optional: emails the digest, for scheduling
├── .env.example               # Copy this to .env and fill in your key
└── package.json
```

## Part 1: Run it locally first

You need [Node.js](https://nodejs.org) v18+ installed.

```bash
cd morning-briefing
npm install
cp .env.example .env
```

Get a **free** Groq API key (no credit card, ongoing free tier, not a trial):
1. Go to https://console.groq.com
2. Sign up, then go to **API Keys** and create one
3. Paste it into `.env` as `GROQ_API_KEY=gsk_...`

Then run it:

```bash
npm start
```

Open **http://localhost:3000** — confirm it loads and shows headlines before
moving to Part 2.

## Part 2: Get a real public URL (like opening any normal website)

Right now it only works on your own laptop. To make it a website you can open
from your phone, or bookmark like google.com, deploy it to **Render**, which
has a genuinely free tier for small apps like this (no credit card required).

1. **Put the code on GitHub** (Render deploys from a GitHub repo):
   - Create a free GitHub account if you don't have one: https://github.com
   - Create a new repository, e.g. `morning-briefing`
   - Upload this whole folder to it (drag-and-drop works on github.com, or
     use `git init && git add . && git commit -m "first" && git push` if
     you're comfortable with git)

2. **Connect Render:**
   - Go to https://render.com and sign up (free, no card needed)
   - Click **New +** → **Web Service**
   - Connect your GitHub account and select the `morning-briefing` repo

3. **Configure the service:**
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** Free

4. **Add your environment variable:**
   - In the same setup screen, find **Environment Variables**
   - Add `GROQ_API_KEY` with your real key as the value
   - (Don't put your real key in the GitHub repo itself — this is why `.env`
     is git-ignored and you set it directly in Render's dashboard instead)

5. **Deploy:**
   - Click **Create Web Service**
   - Render builds and starts it, takes a couple of minutes
   - You'll get a URL like `https://morning-briefing-xyz.onrender.com`
   - That's it — open that link from any device, bookmark it, done

**One quirk of Render's free tier:** the app "sleeps" after 15 minutes of no
visits, and the first load after sleeping takes ~30-50 seconds to wake back
up. Every visit after that is instant until it sleeps again. This is a
limitation of the free tier only, not something wrong with the app.

## Customizing

- **Change sources:** edit the `FEEDS` array in `services/fetchNews.js`.
  Any RSS feed URL works.
- **Change what "important" means or how it's explained:** edit the prompts
  in `services/rankNews.js`. This is where your personal taste lives, make
  it more specific if you want (e.g. always include a Hong Kong story if one
  exists, or weight AI news higher).
- **Change how many stories:** adjust "Pick the 8" in `rankNews.js` and
  `.slice(0, 6)` in `fetchNews.js` (how many raw headlines per feed feed
  into ranking).

## Part 3 (optional): Get it emailed to you every morning

Fill in the SMTP section of `.env`, test manually with `npm run email`, then
schedule it with cron (`crontab -e`, add `0 7 * * * cd /path/to/morning-briefing && npm run email`)
or Render's own **Cron Jobs** feature if you'd rather not rely on your laptop
being on.
