import { createFileRoute } from '@tanstack/react-router';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const LAW_NAMES: Record<string, string> = {
  penal: 'قانون العقوبات المصري',
  criminal_proc: 'قانون الإجراءات الجنائية المصري',
  civil: 'القانون المدني المصري',
  civil_proc: 'قانون المرافعات المدنية والتجارية المصري',
  personal: 'قانون الأحوال الشخصية المصري',
};

const SYSTEM = `أنت مستشار قانوني مصري خبير متخصص في الطعن بالنقض. مهمتك تحليل المواد القانونية المصرية واستخراج الدفوع والثغرات وأحكام النقض المرتبطة، ثم صياغة مسودة مذكرة قانونية.

أعد الرد **حصرياً** بصيغة JSON صالحة بهذا الشكل بالضبط دون أي نص خارج JSON:
{
  "shakly": ["دفع شكلي 1", "دفع شكلي 2", "..."],
  "mawdoo": ["دفع موضوعي 1", "..."],
  "thaghra": ["ثغرة إجرائية أو موضوعية 1", "..."],
  "naqd": [{"ref": "نقض جنائي/مدني - الطعن رقم X لسنة Y ق", "text": "المبدأ القانوني"}],
  "muzakkira": "مسودة مذكرة قانونية احترافية (200-350 كلمة) تستند للمادة وتذكر مبادئ النقض"
}

قواعد:
- 3-5 دفوع شكلية، 3-5 دفوع موضوعية، 2-4 ثغرات، 2-4 أحكام نقض
- استخدم لغة قانونية مصرية رصينة
- إذا لم تكن متأكداً من رقم طعن نقض محدد فاكتفِ بصياغة "مبدأ مستقر - محكمة النقض المصرية"
- لا تخرج عن صيغة JSON المطلوبة`;

export const Route = createFileRoute('/api/public/analyze')({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      POST: async ({ request }) => {
        let body: { law?: string; num?: string; text?: string };
        try {
          body = await request.json();
        } catch {
          return json({ error: 'invalid json' }, 400);
        }
        const law = (body.law || '').trim();
        const num = (body.num || '').trim();
        const text = (body.text || '').trim();
        if (!law || !num) return json({ error: 'law & num required' }, 400);

        const apiKey = process.env.LOVABLE_API_KEY;
        if (!apiKey) return json({ error: 'LOVABLE_API_KEY missing' }, 500);

        const lawName = LAW_NAMES[law] || law;
        const userMsg = `المادة رقم ${num} من ${lawName}.\n\nنص المادة:\n${text || '(غير متوفر — استند لمعرفتك العامة بهذه المادة)'}\n\nاستخرج التحليل القانوني الكامل بصيغة JSON المطلوبة.`;

        const res = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              { role: 'system', content: SYSTEM },
              { role: 'user', content: userMsg },
            ],
            response_format: { type: 'json_object' },
          }),
        });

        if (!res.ok) {
          const t = await res.text();
          if (res.status === 429) return json({ error: 'rate_limit', detail: 'تم تجاوز حد الطلبات. حاول لاحقاً.' }, 429);
          if (res.status === 402) return json({ error: 'payment_required', detail: 'الرصيد غير كافٍ في AI Gateway.' }, 402);
          return json({ error: 'ai_failed', status: res.status, detail: t.slice(0, 300) }, 502);
        }
        const j = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
        const content = j.choices?.[0]?.message?.content || '';
        let parsed: unknown;
        try {
          parsed = JSON.parse(content);
        } catch {
          // try to extract JSON block
          const m = content.match(/\{[\s\S]*\}/);
          if (m) {
            try { parsed = JSON.parse(m[0]); } catch { /* noop */ }
          }
        }
        if (!parsed || typeof parsed !== 'object') {
          return json({ error: 'parse_failed', raw: content.slice(0, 500) }, 502);
        }
        return json({ ok: true, ...(parsed as object) });
      },
    },
  },
});

function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  });
}
