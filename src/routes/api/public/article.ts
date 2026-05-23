import { createFileRoute } from '@tanstack/react-router';
import { supabaseAdmin } from '@/integrations/supabase/client.server';
import { getCorsHeaders, corsResponse, jsonResponse } from '@/lib/cors';

export const Route = createFileRoute('/api/public/article')({
  server: {
    handlers: {
      OPTIONS: async ({ request }) => corsResponse(request),
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const law = url.searchParams.get('law');
        const num = url.searchParams.get('num');
        if (!law || !num) {
          return jsonResponse({ error: 'law & num required' }, 400, request);
        }
        const { data, error } = await supabaseAdmin
          .from('legal_articles')
          .select('law_type, article_number, article_text, source_url')
          .eq('law_type', law)
          .eq('article_number', num)
          .maybeSingle();
        if (error) {
          console.error('[article] db error:', error);
          return jsonResponse({ error: 'internal server error' }, 500, request);
        }
        if (!data) {
          return jsonResponse({ found: false }, 404, request);
        }
        return jsonResponse({ found: true, ...data }, 200, request);
      },
    },
  },
});
