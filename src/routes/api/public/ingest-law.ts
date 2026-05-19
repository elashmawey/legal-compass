import { createFileRoute } from '@tanstack/react-router';
import { supabaseAdmin } from '@/integrations/supabase/client.server';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-ingest-token',
};

// Parses Firecrawl markdown of a manshurat.org law page into individual articles.
// Articles are introduced by a line containing "المادة <number>" (number may include Arabic digits or "مكرراً").
function parseArticles(markdown: string): { number: string; text: string }[] {
  const lines = markdown.split('\n');
  // Regex: line that IS just "المادة N" optionally followed by مكرر/مكررا/مكرراً and digits/letters
  const headerRe = /^\s*\**\s*المادة\s+([\u0660-\u0669\u06F0-\u06F90-9]+(?:\s*مكرر[اًآى]?)?(?:\s*\([^)]+\)?)?)\s*\**\s*$/;
  const out: { number: string; text: string }[] = [];
  let current: { number: string; buf: string[] } | null = null;
  const flush = () => {
    if (current) {
      const text = current.buf.join('\n').trim();
      if (text) out.push({ number: normalizeNumber(current.number), text });
    }
  };
  for (const raw of lines) {
    const m = raw.match(headerRe);
    if (m) {
      flush();
      current = { number: m[1].trim(), buf: [] };
    } else if (current) {
      current.buf.push(raw);
    }
  }
  flush();
  // Dedupe — keep longest text per number
  const map = new Map<string, string>();
  for (const a of out) {
    const prev = map.get(a.number);
    if (!prev || a.text.length > prev.length) map.set(a.number, a.text);
  }
  return Array.from(map.entries()).map(([number, text]) => ({ number, text }));
}

function normalizeNumber(n: string): string {
  const ar = '٠١٢٣٤٥٦٧٨٩';
  const fa = '۰۱۲۳۴۵۶۷۸۹';
  let s = n.replace(/\s+/g, ' ').trim();
  s = s.replace(/[٠-٩]/g, (d) => String(ar.indexOf(d)));
  s = s.replace(/[۰-۹]/g, (d) => String(fa.indexOf(d)));
  return s;
}

export const Route = createFileRoute('/api/public/ingest-law')({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      POST: async ({ request }) => {
        const token = request.headers.get('x-ingest-token');
        const expected = process.env.INGEST_TOKEN;
        if (!expected || token !== expected) {
          return new Response(JSON.stringify({ error: 'unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json', ...CORS },
          });
        }
        let body: { lawType?: string; sourceUrl?: string };
        try {
          body = await request.json();
        } catch {
          return new Response(JSON.stringify({ error: 'invalid json' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...CORS },
          });
        }
        const lawType = (body.lawType || '').trim();
        const sourceUrl = (body.sourceUrl || '').trim();
        if (!lawType || !sourceUrl) {
          return new Response(JSON.stringify({ error: 'lawType & sourceUrl required' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...CORS },
          });
        }
        const apiKey = process.env.FIRECRAWL_API_KEY;
        if (!apiKey) {
          return new Response(JSON.stringify({ error: 'FIRECRAWL_API_KEY missing' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...CORS },
          });
        }

        // Call Firecrawl v2 scrape
        const fcRes = await fetch('https://api.firecrawl.dev/v2/scrape', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            url: sourceUrl,
            formats: ['markdown'],
            onlyMainContent: true,
          }),
        });
        if (!fcRes.ok) {
          const t = await fcRes.text();
          return new Response(JSON.stringify({ error: 'firecrawl failed', status: fcRes.status, body: t }), {
            status: 502,
            headers: { 'Content-Type': 'application/json', ...CORS },
          });
        }
        const fc = (await fcRes.json()) as { data?: { markdown?: string }; markdown?: string };
        const markdown = fc.data?.markdown ?? fc.markdown ?? '';
        if (!markdown) {
          return new Response(JSON.stringify({ error: 'no markdown returned' }), {
            status: 502,
            headers: { 'Content-Type': 'application/json', ...CORS },
          });
        }

        const articles = parseArticles(markdown);
        if (articles.length === 0) {
          return new Response(
            JSON.stringify({ error: 'no articles parsed', preview: markdown.slice(0, 500) }),
            { status: 422, headers: { 'Content-Type': 'application/json', ...CORS } },
          );
        }

        // Upsert in batches of 500
        const rows = articles.map((a) => ({
          law_type: lawType,
          article_number: a.number,
          article_text: a.text,
          source_url: sourceUrl,
          scraped_at: new Date().toISOString(),
        }));
        let inserted = 0;
        for (let i = 0; i < rows.length; i += 500) {
          const batch = rows.slice(i, i + 500);
          const { error } = await supabaseAdmin
            .from('legal_articles')
            .upsert(batch, { onConflict: 'law_type,article_number' });
          if (error) {
            return new Response(
              JSON.stringify({ error: 'upsert failed', detail: error.message, insertedSoFar: inserted }),
              { status: 500, headers: { 'Content-Type': 'application/json', ...CORS } },
            );
          }
          inserted += batch.length;
        }

        return new Response(
          JSON.stringify({ ok: true, lawType, count: inserted, sample: articles.slice(0, 3) }),
          { headers: { 'Content-Type': 'application/json', ...CORS } },
        );
      },
    },
  },
});
