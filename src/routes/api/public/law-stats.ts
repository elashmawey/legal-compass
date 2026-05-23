import { createFileRoute } from '@tanstack/react-router';
import { supabaseAdmin } from '@/integrations/supabase/client.server';
import { corsResponse, jsonResponse } from '@/lib/cors';

export const Route = createFileRoute('/api/public/law-stats')({
  server: {
    handlers: {
      OPTIONS: async ({ request }) => corsResponse(request),
      GET: async ({ request }) => {
        const { data, error } = await supabaseAdmin
          .from('legal_articles')
          .select('law_type');
        if (error) {
          console.error('[law-stats] db error:', error);
          return jsonResponse({ error: 'internal server error' }, 500, request);
        }
        const counts: Record<string, number> = {};
        for (const r of data ?? []) counts[r.law_type] = (counts[r.law_type] || 0) + 1;
        return jsonResponse({ counts }, 200, request);
      },
    },
  },
});
