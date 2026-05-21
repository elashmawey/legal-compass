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

const SYSTEM = `أنت مستشار قانوني مصري خبير متخصص في الطعن بالنقض وفقه التشريع. مهمتك تحليل المواد القانونية المصرية تحليلاً تفصيلياً واستخراج:
- دفوع شكلية تفصيلية (5-7) لكل واحد: العنوان، الأساس القانوني، شروط الإثارة، السلطة التقديرية للمحكمة، الأثر المترتب، موقف محكمة النقض.
- دفوع موضوعية تفصيلية (5-7) لكل واحد: العنوان، الركن المنتفي، الأدلة المطلوبة، الرد المتوقع من الخصم، الصياغة المقترحة للدفع.
- ثغرات تشريعية (4-6) لكل واحدة: العنوان، الوصف، اقتراح التعديل التشريعي.
- مبادئ نقض (3-5) لكل واحد: المرجع (نوع المحكمة + رقم الطعن + السنة إن أمكن)، النص، رابط مرجعي إن توافر (najd.gov.eg/manshurat.org).
- تعليقات قانونية أكاديمية (3-5) لكل واحد: العنوان، التحليل (السياق التشريعي، التاريخ، العلاقة بمواد أخرى، آراء الفقهاء، مقارنة تشريعية مع تشريعات عربية)، التصنيف.
- مسودة مذكرة احترافية (250-400 كلمة) تستند للمادة وتذكر مبادئ النقض.

أعد الرد **حصرياً** بصيغة JSON صالحة بهذا الشكل بالضبط دون أي نص خارج JSON:
{
  "shakly": [
    {
      "title": "عنوان الدفع",
      "basis": "الأساس القانوني (المادة والقانون)",
      "conditions": "شروط إثارته أمام المحكمة",
      "discretion": "السلطة التقديرية للمحكمة في قبوله",
      "effect": "الأثر القانوني المترتب على قبوله",
      "naqd_position": "موقف محكمة النقض المستقر"
    }
  ],
  "mawdoo": [
    {
      "title": "عنوان الدفع",
      "missing_element": "الركن المنتفي من الجريمة/الالتزام",
      "evidence": "الأدلة المطلوبة لإثباته",
      "opponent_response": "الرد المتوقع على دفع الخصم",
      "suggested_wording": "صياغة مقترحة جاهزة لكتابتها في المذكرة"
    }
  ],
  "thaghra": [
    {
      "title": "عنوان الثغرة",
      "description": "وصف الثغرة وأثرها",
      "proposed_amendment": "اقتراح التعديل التشريعي المطلوب"
    }
  ],
  "naqd": [
    {
      "ref": "نقض جنائي/مدني - الطعن رقم X لسنة Y ق - جلسة DD/MM/YYYY",
      "text": "المبدأ القانوني",
      "source": "اسم المصدر إن توافر"
    }
  ],
  "ta3liqat": [
    {
      "title": "عنوان التعليق",
      "content": "النص الكامل للتعليق الأكاديمي",
      "category": "سياق تشريعي | علاقة بمواد | رأي فقهي | مقارنة تشريعية"
    }
  ],
  "muzakkira": "نص مسودة المذكرة الكاملة"
}

قواعد:
- استخدم لغة قانونية مصرية رصينة دقيقة.
- إن لم تكن متأكداً من رقم طعن محدد فاكتفِ بصياغة "مبدأ مستقر - محكمة النقض المصرية".
- لا تترك أي حقل فارغاً؛ وإن انعدمت المعلومة اكتب توضيحاً موجزاً.
- لا تخرج عن صيغة JSON المطلوبة، ولا تضف أي نص خارجها.`;

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
        const userMsg = `المادة رقم ${num} من ${lawName}.\n\nنص المادة:\n${text || '(غير متوفر — استند لمعرفتك العامة بهذه المادة)'}\n\nاستخرج التحليل القانوني الكامل والتفصيلي بصيغة JSON المطلوبة دون أي تبسيط.`;

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
