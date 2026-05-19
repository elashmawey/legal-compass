import { createFileRoute } from '@tanstack/react-router';
import { supabaseAdmin } from '@/integrations/supabase/client.server';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export const Route = createFileRoute('/api/public/law-stats')({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      GET: async () => {
        const { data, error } = await supabaseAdmin
          .from('legal_articles')
          .select('law_type');
        if (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...CORS },
          });
        }
        const counts: Record<string, number> = {};
        for (const r of data ?? []) counts[r.law_type] = (counts[r.law_type] || 0) + 1;
        return new Response(JSON.stringify({ counts }), {
          headers: { 'Content-Type': 'application/json', ...CORS },
        });
      },
    },
  },
});
