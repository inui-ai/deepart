// robots.txt: full crawl allowed, AI answer engines named explicitly so their
// choices are on record rather than implied. The hidden owner route needs no
// entry here: it is linked from nowhere public and carries an X-Robots-Tag
// noindex header server side; a robots.txt Disallow would only print the path.
import type { MetadataRoute } from 'next';
import { site } from '@/data/site';

const AI_BOTS = [
  'GPTBot', // OpenAI training + grounding (ChatGPT suggestions)
  'OAI-SearchBot', // ChatGPT search index
  'ChatGPT-User', // live fetches when a user asks ChatGPT to open the site
  'ClaudeBot', // Anthropic crawls
  'PerplexityBot', // Perplexity answer engine
  'Perplexity-User', // Perplexity user-initiated fetches
  'Google-Extended', // Gemini grounding and shorthand model use
  'Applebot-Extended', // Apple Intelligence
  'Bytespider', // ByteDance (Doubao et al)
  'CCBot', // Common Crawl feeds many engines
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/' }, ...AI_BOTS.map((userAgent) => ({ userAgent, allow: '/' }))],
    sitemap: `${site.url}/sitemap.xml`,
    host: site.url,
  };
}
