import { createFileRoute } from '@tanstack/react-router';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

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

export const Route = createFileRoute('/api/public/analyze')({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      POST: async ({ request }) => {
        let body: { mode?: string; num?: string; text?: string; facts?: string };
        try {
          body = await request.json();
        } catch {
          return json({ error: 'invalid json' }, 400);
        }

        const apiKey = process.env.LOVABLE_API_KEY;
        if (!apiKey) return json({ error: 'LOVABLE_API_KEY missing' }, 500);

        const mode = (body.mode || 'article').trim();
        let system = SYSTEM;
        let userMsg = '';

        if (mode === 'classify') {
          const facts = (body.facts || '').trim();
          if (!facts) return json({ error: 'facts required' }, 400);
          system = CLASSIFY_SYSTEM;
          userMsg = `الواقعة:\n${facts}\n\nاستخرج التكييف القانوني والمواد المنطبقة من قانون العقوبات المصري بصيغة JSON المطلوبة.`;
        } else {
          const num = (body.num || '').trim();
          const text = (body.text || '').trim();
          if (!num) return json({ error: 'num required' }, 400);
          userMsg = `المادة رقم ${num} من قانون العقوبات المصري.\n\nنص المادة:\n${text || '(غير متوفر — استند لمعرفتك العامة بهذه المادة)'}\n\nاستخرج التحليل الجنائي الكامل والتفصيلي بصيغة JSON المطلوبة دون أي تبسيط.`;
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
