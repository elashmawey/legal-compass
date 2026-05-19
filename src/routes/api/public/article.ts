import { createFileRoute } from '@tanstack/react-router';
import { supabaseAdmin } from '@/integrations/supabase/client.server';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export const Route = createFileRoute('/api/public/article')({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const law = url.searchParams.get('law');
        const num = url.searchParams.get('num');
        if (!law || !num) {
          return new Response(JSON.stringify({ error: 'law & num required' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...CORS },
          });
        }
        const { data, error } = await supabaseAdmin
          .from('legal_articles')
          .select('law_type, article_number, article_text, source_url')
          .eq('law_type', law)
          .eq('article_number', num)
          .maybeSingle();
        if (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...CORS },
          });
        }
        if (!data) {
          return new Response(JSON.stringify({ found: false }), {
            status: 404,
            headers: { 'Content-Type': 'application/json', ...CORS },
          });
        }
        return new Response(JSON.stringify({ found: true, ...data }), {
          headers: { 'Content-Type': 'application/json', ...CORS },
        });
      },
    },
  },
});
