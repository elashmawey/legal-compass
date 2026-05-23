import { createFileRoute } from '@tanstack/react-router';
import { supabaseAdmin } from '@/integrations/supabase/client.server';
import { createHash } from 'crypto';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function hashFacts(s: string): string {
  return createHash('sha256').update(s.trim().toLowerCase().replace(/\s+/g, ' ')).digest('hex').slice(0, 32);
}


const SYSTEM = `أنت كبير مستشاري قانون العقوبات المصري، خبير في فقه الجريمة والعقوبة والطعن بالنقض الجنائي. مهمتك تقديم تحليل احترافي تفصيلي لمواد قانون العقوبات المصري رقم 58 لسنة 1937 وتعديلاته.

أعد الرد **حصرياً** بصيغة JSON صالحة بالشكل التالي بالضبط دون أي نص خارج JSON:
{
  "classification": {
    "crime_type": "نوع الجريمة (جناية/جنحة/مخالفة)",
    "category": "تصنيف الجريمة (ضد الأشخاص/الأموال/الشرف/الأمن العام...)",
    "elements": ["الركن المادي بالتفصيل", "الركن المعنوي بالتفصيل", "الركن الشرعي"]
  },
  "penalty": {
    "primary": "العقوبة الأصلية المنصوص عليها بالتفصيل",
    "complementary": "العقوبات التكميلية والتبعية إن وجدت",
    "aggravating": ["ظرف مشدد 1 مع المادة المرجعية", "ظرف 2", "ظرف 3"],
    "mitigating": ["ظرف مخفف 1 مع المادة (مثل المادة 17)", "ظرف 2", "ظرف 3"],
    "statute_of_limitations": "مدة تقادم الدعوى الجنائية والعقوبة"
  },
  "shakly": [
    {
      "title": "عنوان الدفع الشكلي",
      "basis": "الأساس القانوني (المادة والقانون)",
      "conditions": "شروط إثارته أمام المحكمة",
      "discretion": "السلطة التقديرية للمحكمة",
      "effect": "الأثر القانوني المترتب",
      "naqd_position": "موقف محكمة النقض المستقر"
    }
  ],
  "mawdoo": [
    {
      "title": "عنوان الدفع الموضوعي",
      "missing_element": "الركن المنتفي من الجريمة",
      "evidence": "الأدلة المطلوبة لإثباته",
      "opponent_response": "الرد المتوقع على دفع النيابة",
      "suggested_wording": "صياغة جاهزة للمذكرة"
    }
  ],
  "thaghra": [
    {
      "title": "عنوان الثغرة التشريعية",
      "description": "وصف الثغرة وأثرها العملي",
      "proposed_amendment": "اقتراح التعديل التشريعي"
    }
  ],
  "naqd": [
    {
      "ref": "نقض جنائي - الطعن رقم X لسنة Y ق - جلسة DD/MM/YYYY",
      "text": "المبدأ القانوني المستخرج",
      "source": "اسم المصدر إن توافر"
    }
  ],
  "related_articles": [
    {"number": "رقم المادة", "law": "قانون العقوبات", "relation": "علاقتها بالمادة محل التحليل"}
  ],
  "defense_strategy": [
    "الخطوة 1: التحقق من الإجراءات والمواعيد",
    "الخطوة 2: مهاجمة الركن المادي/المعنوي",
    "الخطوة 3: استدعاء الشهود والدفوع المتعلقة",
    "الخطوة 4: طلب تطبيق المادة 17 أو وقف التنفيذ",
    "الخطوة 5: إعداد المذكرة الختامية"
  ],
  "ta3liqat": [
    {
      "title": "عنوان التعليق الفقهي",
      "content": "التعليق (السياق التشريعي، التاريخ، آراء الفقهاء، مقارنة تشريعية)",
      "category": "تاريخي | فقهي | مقارن | اجتهادي"
    }
  ],
  "muzakkira": "نص مسودة المذكرة الجنائية الكاملة (300-500 كلمة) بصياغة احترافية تستند للمادة وتذكر مبادئ النقض والدفوع الجوهرية"
}

قواعد صارمة:
- 5-7 دفوع شكلية، 5-7 دفوع موضوعية، 4-6 ثغرات، 3-5 مبادئ نقض، 3-5 مواد مرتبطة، 5-7 خطوات دفاع، 3-5 تعليقات.
- استخدم لغة قانونية مصرية رصينة.
- إن لم تتأكد من رقم طعن محدد فاكتفِ بـ "مبدأ مستقر - محكمة النقض المصرية - الدائرة الجنائية".
- لا تترك حقلاً فارغاً.
- لا تخرج عن صيغة JSON.`;

const CLASSIFY_SYSTEM = `أنت خبير في التكييف القانوني لقانون العقوبات المصري. سيقدم لك المستخدم وصفاً لواقعة، وعليك اقتراح المواد المنطبقة من قانون العقوبات المصري.

أعد JSON بهذا الشكل بالضبط:
{
  "summary": "تلخيص قانوني للواقعة في 2-3 جمل",
  "suggested_articles": [
    {
      "number": "رقم المادة",
      "title": "عنوان الجريمة",
      "reason": "لماذا تنطبق هذه المادة على الواقعة",
      "confidence": "عالية | متوسطة | منخفضة"
    }
  ],
  "warnings": ["تنبيهات أو نقاط ضعف في التكييف"],
  "next_steps": ["خطوة 1", "خطوة 2", "خطوة 3"]
}

قدم 3-6 مواد مرتبة من الأكثر انطباقاً، واستند فقط لقانون العقوبات المصري رقم 58 لسنة 1937.`;

const MAX_FACTS_LEN = 4000;
const MAX_TEXT_LEN = 8000;
const MAX_NUM_LEN = 32;

// In-memory IP rate limiter (best-effort; per worker instance).
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60_000;
const rateBuckets = new Map<string, { count: number; reset: number }>();

function rateLimit(ip: string): boolean {
  const now = Date.now();
  const b = rateBuckets.get(ip);
  if (!b || now > b.reset) {
    rateBuckets.set(ip, { count: 1, reset: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (b.count >= RATE_LIMIT_MAX) return false;
  b.count++;
  return true;
}

export const Route = createFileRoute('/api/public/analyze')({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      POST: async ({ request }) => {
        const ip =
          request.headers.get('cf-connecting-ip') ||
          request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
          'unknown';
        if (!rateLimit(ip)) {
          return json({ error: 'rate_limit', detail: 'تم تجاوز حد الطلبات. حاول لاحقاً.' }, 429);
        }

        let body: { mode?: string; num?: string; text?: string; facts?: string };
        try {
          body = await request.json();
        } catch {
          return json({ error: 'invalid json' }, 400);
        }

        const apiKey = process.env.LOVABLE_API_KEY;
        if (!apiKey) {
          console.error('[analyze] LOVABLE_API_KEY missing');
          return json({ error: 'internal server error' }, 500);
        }

        const mode = (body.mode || 'article').trim();
        let system = SYSTEM;
        let userMsg = '';
        let cacheKey = '';

        if (mode === 'classify') {
          const facts = (body.facts || '').trim();
          if (!facts) return json({ error: 'facts required' }, 400);
          if (facts.length > MAX_FACTS_LEN) {
            return json({ error: 'facts too long', limit: MAX_FACTS_LEN }, 400);
          }
          system = CLASSIFY_SYSTEM;
          userMsg = `الواقعة:\n${facts}\n\nاستخرج التكييف القانوني والمواد المنطبقة من قانون العقوبات المصري بصيغة JSON المطلوبة.`;
          cacheKey = hashFacts(facts);
        } else {
          const num = (body.num || '').trim();
          const text = (body.text || '').trim();
          if (!num) return json({ error: 'num required' }, 400);
          if (num.length > MAX_NUM_LEN) return json({ error: 'num too long' }, 400);
          if (text.length > MAX_TEXT_LEN) {
            return json({ error: 'text too long', limit: MAX_TEXT_LEN }, 400);
          }
          userMsg = `المادة رقم ${num} من قانون العقوبات المصري.\n\nنص المادة:\n${text || '(غير متوفر — استند لمعرفتك العامة بهذه المادة)'}\n\nاستخرج التحليل الجنائي الكامل والتفصيلي بصيغة JSON المطلوبة دون أي تبسيط.`;
          cacheKey = num;
        }

        // --- Cache lookup ---
        try {
          const { data: cached } = await supabaseAdmin
            .from('analysis_cache')
            .select('result, hit_count')
            .eq('mode', mode)
            .eq('cache_key', cacheKey)
            .maybeSingle();
          if (cached?.result) {
            // Increment hit counter (best-effort, fire-and-forget)
            supabaseAdmin
              .from('analysis_cache')
              .update({ hit_count: (cached.hit_count || 0) + 1, updated_at: new Date().toISOString() })
              .eq('mode', mode)
              .eq('cache_key', cacheKey)
              .then(() => {}, (e) => console.error('[analyze] cache hit-count update failed:', e));
            return json({ ok: true, cached: true, ...(cached.result as object) });
          }
        } catch (e) {
          console.error('[analyze] cache lookup failed:', e);
        }

        const res = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              { role: 'system', content: system },
              { role: 'user', content: userMsg },
            ],
            response_format: { type: 'json_object' },
          }),
        });

        if (!res.ok) {
          const t = await res.text().catch(() => '');
          console.error('[analyze] ai gateway error', res.status, t.slice(0, 500));
          if (res.status === 429) return json({ error: 'rate_limit', detail: 'تم تجاوز حد الطلبات. حاول لاحقاً.' }, 429);
          if (res.status === 402) return json({ error: 'payment_required', detail: 'الرصيد غير كافٍ.' }, 402);
          return json({ error: 'ai_failed' }, 502);
        }
        const j = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
        const content = j.choices?.[0]?.message?.content || '';
        let parsed: unknown;
        try {
          parsed = JSON.parse(content);
        } catch {
          const m = content.match(/\{[\s\S]*\}/);
          if (m) {
            try { parsed = JSON.parse(m[0]); } catch { /* noop */ }
          }
        }
        if (!parsed || typeof parsed !== 'object') {
          console.error('[analyze] parse failed:', content.slice(0, 500));
          return json({ error: 'parse_failed' }, 502);
        }

        // --- Cache write ---
        try {
          await supabaseAdmin
            .from('analysis_cache')
            .upsert(
              { mode, cache_key: cacheKey, result: parsed as object, updated_at: new Date().toISOString() },
              { onConflict: 'mode,cache_key' },
            );
        } catch (e) {
          console.error('[analyze] cache write failed:', e);
        }

        return json({ ok: true, cached: false, ...(parsed as object) });

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
