const Parser = require('rss-parser');
const parser = new Parser({ timeout: 8000 });

// Add or remove feeds here freely. Each entry is [topic label, url].
const FEEDS = [
  ['World', 'https://feeds.bbci.co.uk/news/world/rss.xml'],
  ['World', 'https://feeds.npr.org/1004/rss.xml'],
  ['Business', 'https://feeds.content.dowjones.io/public/rss/RSSMarketsMain'],
  ['Tech & AI', 'https://techcrunch.com/feed/'],
  ['Tech & AI', 'https://venturebeat.com/category/ai/feed/'],
  ['Science', 'https://feeds.bbci.co.uk/news/science_and_environment/rss.xml'],
  ['Culture', 'https://feeds.npr.org/1008/rss.xml']
];

function stripHtml(str) {
  return (str || '').replace(/<[^>]*>/g, '').trim();
}

async function fetchOneFeed(topic, url) {
  try {
    const feed = await parser.parseURL(url);
    return (feed.items || []).slice(0, 6).map(item => ({
      title: item.title || '',
      description: stripHtml(item.contentSnippet || item.content || '').slice(0, 220),
      link: item.link || '',
      source: feed.title || new URL(url).hostname,
      topic,
      pubDate: item.pubDate || item.isoDate || ''
    }));
  } catch (err) {
    console.error(`[fetchNews] Failed to fetch ${url}: ${err.message}`);
    return [];
  }
}

async function gatherAll() {
  const results = await Promise.all(FEEDS.map(([topic, url]) => fetchOneFeed(topic, url)));
  return results.flat();
}

module.exports = { gatherAll, FEEDS };
