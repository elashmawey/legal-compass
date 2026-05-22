import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";

export const Route = createFileRoute("/")({
  component: PenalApp,
  head: () => ({
    meta: [
      { title: "موسوعة قانون العقوبات المصري | المحلل الجنائي الاحترافي" },
      {
        name: "description",
        content:
          "أداة احترافية متخصصة في قانون العقوبات المصري: تحليل المواد، استخراج الدفوع، تكييف الوقائع، حساب العقوبة، الظروف المشددة والمخففة، مبادئ النقض الجنائي، واستراتيجية الدفاع الكاملة.",
      },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;900&family=Amiri:wght@700&display=swap",
      },
    ],
  }),
});

const LAW = "penal";
const LAW_NAME = "قانون العقوبات المصري";

const QUICK_EXAMPLES: Array<{ art: string; label: string; note: string }> = [
  { art: "17", label: "م.17", note: "الرأفة" },
  { art: "32", label: "م.32", note: "الارتباط" },
  { art: "45", label: "م.45", note: "الشروع" },
  { art: "230", label: "م.230", note: "القتل العمد" },
  { art: "234", label: "م.234", note: "القتل بسبق إصرار" },
  { art: "240", label: "م.240", note: "الجرح" },
  { art: "267", label: "م.267", note: "اغتصاب" },
  { art: "306", label: "م.306", note: "السب" },
  { art: "308", label: "م.308", note: "القذف" },
  { art: "311", label: "م.311", note: "السرقة" },
  { art: "336", label: "م.336", note: "النصب" },
  { art: "341", label: "م.341", note: "خيانة الأمانة" },
];

const OFFICIAL_SOURCES: Array<{ name: string; url: string; desc: string; color: string }> = [
  { name: "منشورات قانونية", url: "https://manshurat.org", desc: "نص قانون العقوبات الكامل", color: "#60a5fa" },
  { name: "محكمة النقض المصرية", url: "https://www.cc.gov.eg", desc: "أحكام ومبادئ النقض الجنائي", color: "#fb7185" },
  { name: "وزارة العدل المصرية", url: "https://moj.gov.eg", desc: "البوابة الرسمية للوزارة", color: "#34d399" },
  { name: "المحكمة الدستورية العليا", url: "https://www.sccourt.gov.eg", desc: "الأحكام الدستورية", color: "#f472b6" },
  { name: "الجريدة الرسمية", url: "https://www.idsc.gov.eg", desc: "نشر التشريعات الجنائية", color: "#fbbf24" },
  { name: "بوابة التشريعات المصرية", url: "https://www.egypt.gov.eg", desc: "البوابة الحكومية", color: "#a78bfa" },
];

// --- types ---------------------------------------------------------------
type ShaklyItem = { title: string; basis: string; conditions: string; discretion: string; effect: string; naqd_position: string };
type MawdooItem = { title: string; missing_element: string; evidence: string; opponent_response: string; suggested_wording: string };
type ThaghraItem = { title: string; description: string; proposed_amendment: string };
type NaqdItem = { ref: string; text: string; source?: string };
type Ta3liqItem = { title: string; content: string; category?: string };
type RelatedItem = { number: string; law: string; relation: string };
type Classification = { crime_type: string; category: string; elements: string[] };
type Penalty = { primary: string; complementary: string; aggravating: string[]; mitigating: string[]; statute_of_limitations: string };

type AnalysisData = {
  text: string;
  classification: Classification;
  penalty: Penalty;
  shakly: ShaklyItem[];
  mawdoo: MawdooItem[];
  thaghra: ThaghraItem[];
  naqd: NaqdItem[];
  related: RelatedItem[];
  strategy: string[];
  ta3liqat: Ta3liqItem[];
  muzakkira: string;
};

const EMPTY: AnalysisData = {
  text: "",
  classification: { crime_type: "", category: "", elements: [] },
  penalty: { primary: "", complementary: "", aggravating: [], mitigating: [], statute_of_limitations: "" },
  shakly: [], mawdoo: [], thaghra: [], naqd: [], related: [], strategy: [], ta3liqat: [], muzakkira: "",
};

type ClassifyResult = {
  summary: string;
  suggested_articles: Array<{ number: string; title: string; reason: string; confidence: string }>;
  warnings: string[];
  next_steps: string[];
};

// --- normalizers ---------------------------------------------------------
const toStr = (x: unknown): string => {
  if (x == null) return "";
  if (typeof x === "string") return x;
  if (typeof x === "object") {
    const o = x as Record<string, unknown>;
    return String(o.text ?? o.value ?? o.title ?? o.content ?? JSON.stringify(o));
  }
  return String(x);
};
const obj = (x: unknown): Record<string, unknown> => (x && typeof x === "object" ? (x as Record<string, unknown>) : {});
const arr = (x: unknown): string[] => (Array.isArray(x) ? x.map(toStr).map((s) => s.trim()).filter(Boolean) : []);

function normClassification(v: unknown): Classification {
  const o = obj(v);
  return { crime_type: toStr(o.crime_type), category: toStr(o.category), elements: arr(o.elements) };
}
function normPenalty(v: unknown): Penalty {
  const o = obj(v);
  return {
    primary: toStr(o.primary),
    complementary: toStr(o.complementary),
    aggravating: arr(o.aggravating),
    mitigating: arr(o.mitigating),
    statute_of_limitations: toStr(o.statute_of_limitations ?? o.limitations),
  };
}
function normShakly(v: unknown): ShaklyItem[] {
  if (!Array.isArray(v)) return [];
  return v.map((it) => {
    if (typeof it === "string") return { title: it, basis: "", conditions: "", discretion: "", effect: "", naqd_position: "" };
    const o = obj(it);
    return {
      title: toStr(o.title ?? "دفع شكلي"),
      basis: toStr(o.basis ?? o.legal_basis),
      conditions: toStr(o.conditions),
      discretion: toStr(o.discretion),
      effect: toStr(o.effect),
      naqd_position: toStr(o.naqd_position ?? o.naqd),
    };
  }).filter((x) => x.title.trim().length > 0);
}
function normMawdoo(v: unknown): MawdooItem[] {
  if (!Array.isArray(v)) return [];
  return v.map((it) => {
    if (typeof it === "string") return { title: it, missing_element: "", evidence: "", opponent_response: "", suggested_wording: "" };
    const o = obj(it);
    return {
      title: toStr(o.title ?? "دفع موضوعي"),
      missing_element: toStr(o.missing_element),
      evidence: toStr(o.evidence),
      opponent_response: toStr(o.opponent_response),
      suggested_wording: toStr(o.suggested_wording),
    };
  }).filter((x) => x.title.trim().length > 0);
}
function normThaghra(v: unknown): ThaghraItem[] {
  if (!Array.isArray(v)) return [];
  return v.map((it) => {
    if (typeof it === "string") return { title: it, description: "", proposed_amendment: "" };
    const o = obj(it);
    return {
      title: toStr(o.title ?? "ثغرة"),
      description: toStr(o.description),
      proposed_amendment: toStr(o.proposed_amendment ?? o.amendment),
    };
  }).filter((x) => x.title.trim() || x.description.trim());
}
function normNaqd(v: unknown): NaqdItem[] {
  if (!Array.isArray(v)) return [];
  return v.map((it) => {
    if (typeof it === "string") return { ref: "مبدأ مستقر - محكمة النقض المصرية", text: it };
    const o = obj(it);
    return {
      ref: toStr(o.ref ?? "مبدأ مستقر - محكمة النقض المصرية").trim(),
      text: toStr(o.text ?? o.principle).trim(),
      source: toStr(o.source_link ?? o.url ?? o.link ?? "").trim() || undefined,
    };
  }).filter((n) => n.text.length > 0);
}
function normRelated(v: unknown): RelatedItem[] {
  if (!Array.isArray(v)) return [];
  return v.map((it) => {
    const o = obj(it);
    return {
      number: toStr(o.number ?? o.article ?? "").trim(),
      law: toStr(o.law ?? "قانون العقوبات").trim(),
      relation: toStr(o.relation ?? o.reason ?? o.note).trim(),
    };
  }).filter((r) => r.number.length > 0);
}
function normTa3liqat(v: unknown): Ta3liqItem[] {
  if (!Array.isArray(v)) return [];
  return v.map((it) => {
    if (typeof it === "string") return { title: "تعليق", content: it };
    const o = obj(it);
    return {
      title: toStr(o.title ?? "تعليق"),
      content: toStr(o.content ?? o.text),
      category: toStr(o.category ?? "") || undefined,
    };
  }).filter((x) => x.content.trim().length > 0);
}

// --- printable history key ------------------------------------------------
const HISTORY_KEY = "penal_history_v1";
type HistItem = { num: string; title: string; at: number };
const readHistory = (): HistItem[] => {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]"); } catch { return []; }
};
const pushHistory = (h: HistItem) => {
  try {
    const list = readHistory().filter((x) => x.num !== h.num);
    list.unshift(h);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(list.slice(0, 20)));
  } catch { /* noop */ }
};

function PenalApp() {
  const [tab, setTab] = useState<"article" | "classify">("article");
  const [num, setNum] = useState("");
  const [data, setData] = useState<AnalysisData | null>(null);
  const [resultTitle, setResultTitle] = useState("");
  const [loadingArticle, setLoadingArticle] = useState(false);
  const [loadingAi, setLoadingAi] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [dbStatus, setDbStatus] = useState("جارٍ تحميل إحصاءات قاعدة البيانات...");
  const [history, setHistory] = useState<HistItem[]>([]);

  // classify
  const [facts, setFacts] = useState("");
  const [classifyResult, setClassifyResult] = useState<ClassifyResult | null>(null);
  const [classifyLoading, setClassifyLoading] = useState(false);
  const [classifyError, setClassifyError] = useState<string | null>(null);

  // admin
  const [adminOpen, setAdminOpen] = useState(false);
  const [ingestToken, setIngestToken] = useState("");
  const [ingestUrl, setIngestUrl] = useState("https://manshurat.org/node/14677");
  const [ingestBusy, setIngestBusy] = useState(false);
  const [ingestResult, setIngestResult] = useState("");

  const resultsRef = useRef<HTMLDivElement>(null);
  const classifyRef = useRef<HTMLDivElement>(null);

  const loadStats = async () => {
    try {
      const res = await fetch("/api/public/law-stats");
      if (!res.ok) throw new Error();
      const { counts } = (await res.json()) as { counts: Record<string, number> };
      const penalCount = counts.penal || 0;
      if (penalCount === 0) {
        setDbStatus("📭 قاعدة بيانات قانون العقوبات فارغة — افتح لوحة الإدارة لاستيرادها.");
        return;
      }
      setDbStatus(`📚 محفوظ في قاعدة البيانات: ${penalCount} مادة من قانون العقوبات`);
    } catch {
      setDbStatus("⚠️ تعذّر الاتصال بالخادم.");
    }
  };

  useEffect(() => { loadStats(); setHistory(readHistory()); }, []);

  const analyze = async (numArg?: string) => {
    const nm = (numArg ?? num).trim();
    if (!nm) return;

    setResultTitle(`المادة ${nm} — ${LAW_NAME}`);
    setAiError(null);
    setLoadingArticle(true);
    setLoadingAi(true);
    setData({ ...EMPTY, text: "جارٍ التحميل من قاعدة البيانات..." });

    setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);

    let liveText: string | null = null;
    try {
      const res = await fetch(`/api/public/article?law=${LAW}&num=${encodeURIComponent(nm)}`);
      if (res.ok) {
        const j = (await res.json()) as { found?: boolean; article_text?: string };
        if (j.found && j.article_text) liveText = j.article_text;
      }
    } catch { /* noop */ }

    const baseText = liveText ||
      `لم يتم العثور على المادة ${nm} في قاعدة البيانات المحلية. سيتم التحليل بناءً على المعرفة العامة بقانون العقوبات.`;
    setData({ ...EMPTY, text: baseText });
    setLoadingArticle(false);

    try {
      const aiRes = await fetch("/api/public/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "article", num: nm, text: liveText || baseText }),
      });
      const aj = await aiRes.json();
      if (!aiRes.ok || !aj.ok) {
        setAiError(aj.detail || aj.error || `HTTP ${aiRes.status}`);
        setLoadingAi(false);
        return;
      }
      setData({
        text: baseText,
        classification: normClassification(aj.classification),
        penalty: normPenalty(aj.penalty),
        shakly: normShakly(aj.shakly),
        mawdoo: normMawdoo(aj.mawdoo),
        thaghra: normThaghra(aj.thaghra),
        naqd: normNaqd(aj.naqd),
        related: normRelated(aj.related_articles ?? aj.related),
        strategy: arr(aj.defense_strategy),
        ta3liqat: normTa3liqat(aj.ta3liqat),
        muzakkira: toStr(aj.muzakkira),
      });
      pushHistory({ num: nm, title: `المادة ${nm}`, at: Date.now() });
      setHistory(readHistory());
    } catch (e) {
      setAiError(`خطأ شبكي: ${(e as Error).message}`);
    } finally {
      setLoadingAi(false);
    }
  };

  const runClassify = async () => {
    const f = facts.trim();
    if (f.length < 20) { setClassifyError("يرجى وصف الواقعة بتفصيل أكبر (20 حرفًا على الأقل)."); return; }
    setClassifyError(null);
    setClassifyLoading(true);
    setClassifyResult(null);
    setTimeout(() => classifyRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    try {
      const res = await fetch("/api/public/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "classify", facts: f }),
      });
      const j = await res.json();
      if (!res.ok || !j.ok) {
        setClassifyError(j.detail || j.error || `HTTP ${res.status}`);
      } else {
        setClassifyResult({
          summary: toStr(j.summary),
          suggested_articles: Array.isArray(j.suggested_articles) ? j.suggested_articles.map((a: Record<string, unknown>) => ({
            number: toStr(a.number),
            title: toStr(a.title),
            reason: toStr(a.reason),
            confidence: toStr(a.confidence) || "متوسطة",
          })) : [],
          warnings: arr(j.warnings),
          next_steps: arr(j.next_steps),
        });
      }
    } catch (e) {
      setClassifyError(`خطأ شبكي: ${(e as Error).message}`);
    } finally {
      setClassifyLoading(false);
    }
  };

  const runIngest = async () => {
    if (!ingestToken || !ingestUrl) { setIngestResult("يلزم إدخال الرمز والرابط."); return; }
    setIngestBusy(true);
    setIngestResult("⏳ جارٍ الكشط من المصدر... قد يستغرق 30-90 ثانية.");
    try {
      const res = await fetch("/api/public/ingest-law", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-ingest-token": ingestToken },
        body: JSON.stringify({ lawType: LAW, sourceUrl: ingestUrl }),
      });
      const j = await res.json();
      if (!res.ok) {
        setIngestResult(`❌ فشل (${res.status}): ${j.error || ""}\n${j.detail || j.preview || ""}`);
      } else {
        const sample = (j.sample || []).map((s: { number: string }) => `م.${s.number}`).join(", ");
        setIngestResult(`✅ تم استيراد ${j.count} مادة.\nعينة: ${sample}`);
        loadStats();
      }
    } catch (e) {
      setIngestResult(`❌ خطأ شبكي: ${(e as Error).message}`);
    } finally {
      setIngestBusy(false);
    }
  };

  // --- exporters ---------------------------------------------------------
  const memoText = useMemo(() => {
    if (!data) return "";
    const sh = data.shakly.length ? data.shakly.map((s, i) =>
      `${i + 1}. ${s.title}\n   • الأساس: ${s.basis}\n   • الشروط: ${s.conditions}\n   • السلطة: ${s.discretion}\n   • الأثر: ${s.effect}\n   • النقض: ${s.naqd_position}`).join("\n\n") : "—";
    const mw = data.mawdoo.length ? data.mawdoo.map((s, i) =>
      `${i + 1}. ${s.title}\n   • الركن المنتفي: ${s.missing_element}\n   • الأدلة: ${s.evidence}\n   • رد الخصم: ${s.opponent_response}\n   • الصياغة: ${s.suggested_wording}`).join("\n\n") : "—";
    const th = data.thaghra.length ? data.thaghra.map((t, i) =>
      `${i + 1}. ${t.title}\n   ${t.description}\n   ◈ تعديل مقترح: ${t.proposed_amendment}`).join("\n\n") : "—";
    const nq = data.naqd.length ? data.naqd.map((n) => `— ${n.ref}\n  ${n.text}`).join("\n\n") : "—";
    const tl = data.ta3liqat.length ? data.ta3liqat.map((t, i) => `${i + 1}. ${t.title}${t.category ? ` [${t.category}]` : ""}\n   ${t.content}`).join("\n\n") : "—";
    const rel = data.related.length ? data.related.map((r) => `• المادة ${r.number} (${r.law}): ${r.relation}`).join("\n") : "—";
    const str = data.strategy.length ? data.strategy.map((s, i) => `${i + 1}. ${s}`).join("\n") : "—";

    return [
      "موسوعة قانون العقوبات المصري — المحلل الجنائي الاحترافي",
      "================================================================",
      resultTitle,
      `تاريخ الإصدار: ${new Date().toLocaleDateString("ar-EG")}`,
      "",
      "[نص المادة]", data.text, "",
      "[التكييف القانوني]",
      `نوع الجريمة: ${data.classification.crime_type}`,
      `التصنيف: ${data.classification.category}`,
      "الأركان:", data.classification.elements.map((e, i) => `  ${i + 1}. ${e}`).join("\n") || "—", "",
      "[العقوبة]",
      `الأصلية: ${data.penalty.primary}`,
      `التكميلية: ${data.penalty.complementary}`,
      `التقادم: ${data.penalty.statute_of_limitations}`,
      "الظروف المشددة:", data.penalty.aggravating.map((a) => `  + ${a}`).join("\n") || "—",
      "الظروف المخففة:", data.penalty.mitigating.map((m) => `  - ${m}`).join("\n") || "—", "",
      "[الدفوع الشكلية التفصيلية]", sh, "",
      "[الدفوع الموضوعية التفصيلية]", mw, "",
      "[الثغرات التشريعية واقتراحات التعديل]", th, "",
      "[مبادئ محكمة النقض]", nq, "",
      "[مواد ذات صلة]", rel, "",
      "[استراتيجية الدفاع]", str, "",
      "[تعليقات فقهية]", tl, "",
      "[مسودة المذكرة الجنائية]", data.muzakkira || "—", "",
      "—",
      "أداة استرشادية لا تغني عن الرأي القانوني المتخصص.",
    ].join("\n");
  }, [data, resultTitle]);

  const exportMemoTxt = () => {
    if (!data) return;
    const blob = new Blob([memoText], { type: "text/plain;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${resultTitle}.txt`;
    a.click();
  };

  const exportMemoPdf = () => {
    if (!data) return;
    const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br/>");
    const block = (label: string, val: string) =>
      val ? `<div class="row"><span class="lbl">${esc(label)}:</span> ${esc(val)}</div>` : "";
    const list = (items: string[]) => items.length ? `<ul>${items.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : '<p class="muted">—</p>';

    const shHtml = data.shakly.length ? data.shakly.map((s, i) => `<div class="item">
        <div class="t">${i + 1}. ${esc(s.title)}</div>
        ${block("الأساس القانوني", s.basis)}${block("شروط الإثارة", s.conditions)}
        ${block("السلطة التقديرية", s.discretion)}${block("الأثر المترتب", s.effect)}
        ${block("موقف النقض", s.naqd_position)}</div>`).join("") : '<p class="muted">—</p>';
    const mwHtml = data.mawdoo.length ? data.mawdoo.map((s, i) => `<div class="item">
        <div class="t">${i + 1}. ${esc(s.title)}</div>
        ${block("الركن المنتفي", s.missing_element)}${block("الأدلة المطلوبة", s.evidence)}
        ${block("الرد على الخصم", s.opponent_response)}${block("الصياغة المقترحة", s.suggested_wording)}</div>`).join("") : '<p class="muted">—</p>';
    const thHtml = data.thaghra.length ? data.thaghra.map((t, i) => `<div class="item">
        <div class="t">${i + 1}. ${esc(t.title)}</div><div>${esc(t.description)}</div>
        ${t.proposed_amendment ? `<div class="amend"><b>◈ اقتراح التعديل:</b><br/>${esc(t.proposed_amendment)}</div>` : ""}</div>`).join("") : '<p class="muted">—</p>';
    const nqHtml = data.naqd.length ? data.naqd.map((n) => `<div class="naqd"><div class="ref">${esc(n.ref)}</div><div>${esc(n.text)}</div></div>`).join("") : '<p class="muted">—</p>';
    const tlHtml = data.ta3liqat.length ? data.ta3liqat.map((t, i) => `<div class="item">
        <div class="t">${i + 1}. ${esc(t.title)}${t.category ? ` <span class="cat">[${esc(t.category)}]</span>` : ""}</div>
        <div>${esc(t.content)}</div></div>`).join("") : '<p class="muted">—</p>';
    const relHtml = data.related.length ? `<ul>${data.related.map((r) => `<li><b>المادة ${esc(r.number)}</b> — ${esc(r.relation)}</li>`).join("")}</ul>` : '<p class="muted">—</p>';

    const html = `<!doctype html><html dir="rtl" lang="ar"><head><meta charset="utf-8">
<title>${esc(resultTitle)}</title>
<style>
  @page { size: A4; margin: 16mm; }
  body { font-family: 'Tajawal','Segoe UI',Tahoma,sans-serif; color:#111; line-height:1.75; font-size:11pt; }
  h1 { color:#1e3a8a; border-bottom:2px solid #d4af37; padding-bottom:.25rem; }
  h2 { color:#1e3a8a; margin-top:1.4rem; border-right:4px solid #d4af37; padding-right:.5rem; }
  .meta { color:#555; font-size:.8rem; margin-bottom:1rem; }
  .text { background:#faf7ee; border:1px solid #e6dcb8; padding:1rem; border-radius:.5rem; }
  .item { border:1px solid #ddd; border-radius:.5rem; padding:.75rem; margin:.5rem 0; background:#fafafa; page-break-inside:avoid; }
  .item .t { font-weight:700; color:#1e3a8a; margin-bottom:.4rem; }
  .row { margin:.2rem 0; } .row .lbl { color:#92651a; font-weight:700; }
  .amend { margin-top:.5rem; background:#fff8e1; border-right:4px solid #d4af37; padding:.5rem .75rem; border-radius:.4rem; color:#5b4419; }
  .naqd { border-right:3px solid #d4af37; padding:.4rem .75rem; margin:.5rem 0; background:#fcfaf1; }
  .naqd .ref { color:#92651a; font-weight:700; font-size:.9rem; }
  .cat { color:#777; font-weight:400; font-size:.8rem; }
  .muzakkira { background:#f7f7fb; padding:1rem; border-right:4px solid #1e3a8a; border-radius:.5rem; white-space:pre-wrap; }
  .muted { color:#777; } ul { padding-right:1.2rem; }
  .penalty-grid { display:grid; grid-template-columns:1fr 1fr; gap:.5rem; }
  .penalty-card { background:#fff8e1; border:1px solid #d4af37; padding:.6rem; border-radius:.4rem; }
  footer { margin-top:2rem; font-size:.75rem; color:#888; border-top:1px solid #ddd; padding-top:.5rem; text-align:center; }
</style></head><body>
<h1>${esc(resultTitle)}</h1>
<div class="meta">موسوعة قانون العقوبات المصري — ${new Date().toLocaleDateString("ar-EG")}</div>
<h2>نص المادة</h2><div class="text">${esc(data.text)}</div>
<h2>التكييف القانوني</h2>
${block("نوع الجريمة", data.classification.crime_type)}
${block("التصنيف", data.classification.category)}
<div><b>الأركان:</b>${list(data.classification.elements)}</div>
<h2>العقوبة والظروف</h2>
${block("العقوبة الأصلية", data.penalty.primary)}
${block("العقوبات التكميلية", data.penalty.complementary)}
${block("التقادم", data.penalty.statute_of_limitations)}
<div class="penalty-grid">
  <div class="penalty-card"><b>الظروف المشددة:</b>${list(data.penalty.aggravating)}</div>
  <div class="penalty-card"><b>الظروف المخففة:</b>${list(data.penalty.mitigating)}</div>
</div>
<h2>الدفوع الشكلية</h2>${shHtml}
<h2>الدفوع الموضوعية</h2>${mwHtml}
<h2>الثغرات التشريعية</h2>${thHtml}
<h2>مبادئ محكمة النقض</h2>${nqHtml}
<h2>مواد ذات صلة</h2>${relHtml}
<h2>استراتيجية الدفاع</h2>${list(data.strategy)}
<h2>تعليقات فقهية أكاديمية</h2>${tlHtml}
<h2>مسودة المذكرة الجنائية</h2><div class="muzakkira">${esc(data.muzakkira || "—")}</div>
<footer>أداة استرشادية لا تغني عن الرأي القانوني المتخصص — ${new Date().getFullYear()}</footer>
<script>window.onload=()=>{setTimeout(()=>window.print(),300)};</script>
</body></html>`;
    const w = window.open("", "_blank");
    if (!w) { alert("يرجى السماح بالنوافذ المنبثقة لتصدير PDF."); return; }
    w.document.open(); w.document.write(html); w.document.close();
  };

  const showResults = data !== null;

  return (
    <div dir="rtl" lang="ar" className="legal-root">
      <style>{styles}</style>

      {/* HEADER */}
      <header className="lg-header">
        <div className="container lg-header-inner">
          <div style={{ display: "flex", alignItems: "center", gap: ".75rem" }}>
            <svg className="scale-icon" width="44" height="44" viewBox="0 0 24 24" fill="#d4af37">
              <path d="M12 2L9 6h2v3H4v2h2.5l-3 7c0 1.66 2.01 3 4.5 3s4.5-1.34 4.5-3l-3-7H11V11h7v-2h-7V6h2l-1-4zM5.5 18l1.5-3.5L8.5 18h-3zm10 0l1.5-3.5L18.5 18h-3z" />
            </svg>
            <div>
              <h1 className="font-serif-ar" style={{ fontSize: "1.4rem", fontWeight: 700, color: "#d4af37", margin: 0 }}>
                موسوعة قانون العقوبات المصري
              </h1>
              <p style={{ fontSize: ".75rem", color: "#9ca3af", margin: 0 }}>
                المحلل الجنائي الاحترافي — قانون رقم 58 لسنة 1937 وتعديلاته
              </p>
            </div>
          </div>
          <div style={{ display: "flex", gap: ".5rem", alignItems: "center" }}>
            <span className="chip-gold" style={{ cursor: "default" }}>✦ نسخة احترافية</span>
            <span className="chip" style={{ cursor: "default" }}>تحديثات 2025</span>
          </div>
        </div>
      </header>

      <main className="container" style={{ padding: "2rem 1.5rem" }}>
        {/* TABS */}
        <div className="tabs">
          <button className={`tab ${tab === "article" ? "tab-active" : ""}`} onClick={() => setTab("article")}>
            📜 تحليل مادة برقمها
          </button>
          <button className={`tab ${tab === "classify" ? "tab-active" : ""}`} onClick={() => setTab("classify")}>
            🧭 تكييف واقعة (اقتراح المواد المنطبقة)
          </button>
        </div>

        {tab === "article" ? (
          <section className="card gold-border gold-glow" style={{ borderRadius: "1rem", padding: "1.5rem", marginBottom: "2rem" }}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#d4af37", marginBottom: "1rem" }}>🔍 ابحث برقم المادة</h2>
            <div className="grid-12">
              <div className="col-9">
                <label className="lbl-form">رقم المادة من قانون العقوبات</label>
                <input type="text" placeholder="مثال: 230 (القتل العمد) أو 17 (الرأفة)" value={num}
                  onChange={(e) => setNum(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") analyze(); }} />
              </div>
              <div className="col-3" style={{ display: "flex", alignItems: "flex-end" }}>
                <button className="btn-gold gold-glow" style={{ width: "100%" }} onClick={() => analyze()}>تحليل احترافي ⚖️</button>
              </div>
            </div>
            <div style={{ marginTop: "1rem", display: "flex", flexWrap: "wrap", gap: ".4rem", alignItems: "center" }}>
              <span style={{ fontSize: ".75rem", color: "#9ca3af" }}>مواد شهيرة:</span>
              {QUICK_EXAMPLES.map((q) => (
                <button key={q.art} className="chip" title={q.note}
                  onClick={() => { setNum(q.art); analyze(q.art); }}>
                  {q.label} <span style={{ color: "#9ca3af", fontSize: ".65rem" }}>({q.note})</span>
                </button>
              ))}
            </div>
            {history.length > 0 && (
              <div style={{ marginTop: ".75rem", display: "flex", flexWrap: "wrap", gap: ".4rem", alignItems: "center" }}>
                <span style={{ fontSize: ".75rem", color: "#9ca3af" }}>🕘 آخر بحثك:</span>
                {history.slice(0, 8).map((h) => (
                  <button key={h.num + h.at} className="chip" onClick={() => { setNum(h.num); analyze(h.num); }}>
                    م.{h.num}
                  </button>
                ))}
              </div>
            )}
            <div style={{ marginTop: ".75rem", fontSize: ".75rem", color: "#9ca3af" }}>{dbStatus}</div>
          </section>
        ) : (
          <section className="card gold-border gold-glow" style={{ borderRadius: "1rem", padding: "1.5rem", marginBottom: "2rem" }}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#d4af37", marginBottom: ".5rem" }}>🧭 تكييف الواقعة قانوناً</h2>
            <p style={{ color: "#d1d5db", fontSize: ".88rem", marginBottom: "1rem" }}>
              صف الواقعة بأسلوب موضوعي (الزمان، المكان، الأطراف، الأفعال، الأدوات، النتيجة) وسأقترح لك المواد المنطبقة من قانون العقوبات.
            </p>
            <textarea rows={6} value={facts} onChange={(e) => setFacts(e.target.value)}
              placeholder="مثال: قام شخص بالدخول ليلاً إلى منزل آخر عن طريق كسر الباب الخارجي واستولى على مبلغ مالي وهاتف محمول..." />
            <div style={{ marginTop: ".75rem", display: "flex", gap: ".5rem", flexWrap: "wrap" }}>
              <button className="btn-gold gold-glow" disabled={classifyLoading} onClick={runClassify}>
                {classifyLoading ? "جارٍ التكييف..." : "اقترح المواد المنطبقة 🧭"}
              </button>
              <button className="chip" onClick={() => { setFacts(""); setClassifyResult(null); setClassifyError(null); }}>مسح</button>
            </div>
            <div ref={classifyRef} style={{ marginTop: "1.25rem" }}>
              {classifyError && <ErrMsg msg={classifyError} />}
              {classifyLoading && <Skeletons n={5} />}
              {classifyResult && (
                <div className="stack">
                  {classifyResult.summary && (
                    <div className="defense-item" style={{ borderRight: "3px solid #d4af37" }}>
                      <div className="defense-title">📌 ملخص الواقعة قانونياً</div>
                      <div>{classifyResult.summary}</div>
                    </div>
                  )}
                  {classifyResult.suggested_articles.length > 0 && (
                    <div>
                      <div style={{ color: "#d4af37", fontWeight: 700, marginBottom: ".5rem" }}>⚖️ المواد المقترحة</div>
                      <div className="stack">
                        {classifyResult.suggested_articles.map((a, i) => (
                          <div key={i} className="defense-item defense-shakly">
                            <div className="defense-title" style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: ".5rem" }}>
                              <span>المادة {a.number} — {a.title}</span>
                              <span className={`conf-${a.confidence}`}>{a.confidence}</span>
                            </div>
                            <div style={{ marginBottom: ".5rem" }}>{a.reason}</div>
                            <button className="chip" onClick={() => { setTab("article"); setNum(a.number); analyze(a.number); }}>
                              ↩ افتح تحليل المادة {a.number}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {classifyResult.warnings.length > 0 && (
                    <div className="amend-box">
                      <div className="amend-head">⚠️ تنبيهات</div>
                      <ul style={{ margin: 0, paddingRight: "1.2rem" }}>{classifyResult.warnings.map((w, i) => <li key={i}>{w}</li>)}</ul>
                    </div>
                  )}
                  {classifyResult.next_steps.length > 0 && (
                    <div className="defense-item" style={{ borderRight: "3px solid #2dd4bf" }}>
                      <div className="defense-title" style={{ color: "#5eead4" }}>🗺️ الخطوات المقترحة</div>
                      <ol style={{ margin: 0, paddingRight: "1.2rem", lineHeight: 1.9 }}>
                        {classifyResult.next_steps.map((s, i) => <li key={i}>{s}</li>)}
                      </ol>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
        )}

        {/* ADMIN */}
        <section className="card gold-border" style={{ borderRadius: "1rem", padding: "1.5rem", marginBottom: "2rem" }}>
          <button onClick={() => setAdminOpen((v) => !v)}
            style={{ background: "transparent", border: 0, color: "#d4af37", fontWeight: 700, cursor: "pointer", fontSize: "1rem" }}>
            ⚙️ لوحة الإدارة — استيراد قانون العقوبات (Firecrawl) {adminOpen ? "▲" : "▼"}
          </button>
          {adminOpen && (
            <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: ".75rem", fontSize: ".9rem" }}>
              <p style={{ color: "#d1d5db", lineHeight: 1.8, margin: 0 }}>
                أدخل رمز الاستيراد السري (INGEST_TOKEN) ورابط المصدر الرسمي لقانون العقوبات.
              </p>
              <div className="grid-12">
                <input className="col-5" type="password" placeholder="رمز الاستيراد السرّي" value={ingestToken} onChange={(e) => setIngestToken(e.target.value)} />
                <input className="col-7" type="url" placeholder="رابط المصدر" value={ingestUrl} onChange={(e) => setIngestUrl(e.target.value)} />
              </div>
              <div>
                <button className="chip" onClick={() => setIngestUrl("https://manshurat.org/node/14677")}>قانون العقوبات (منشورات)</button>
              </div>
              <div><button className="btn-gold" disabled={ingestBusy} onClick={runIngest}>{ingestBusy ? "جارٍ الاستيراد..." : "بدء الاستيراد"}</button></div>
              {ingestResult && (<pre style={{ color: "#d1d5db", whiteSpace: "pre-wrap", fontFamily: "inherit", margin: 0 }}>{ingestResult}</pre>)}
            </div>
          )}
        </section>

        {/* RESULTS */}
        {showResults ? (
          <section ref={resultsRef}>
            <div className="results-toolbar">
              <h2 className="font-serif-ar" style={{ fontSize: "1.5rem", fontWeight: 700, color: "#d4af37", margin: 0 }}>{resultTitle}</h2>
              <div style={{ display: "flex", gap: ".5rem", flexWrap: "wrap" }}>
                <CopyBtn text={memoText} label="📋 نسخ كامل" />
                <button className="chip" onClick={exportMemoTxt} style={{ padding: ".5rem 1rem" }}>⬇ TXT</button>
                <button className="btn-gold" onClick={exportMemoPdf} style={{ padding: ".5rem 1rem", fontSize: ".85rem" }}>🖨 تصدير PDF</button>
              </div>
            </div>

            <div className="grid-results">
              {/* نص المادة */}
              <ResultCard title="📜 نص المادة" titleColor="#d4af37" className="col-span-2" copyText={data!.text} serif large>
                {loadingArticle ? <Skeletons n={3} /> : <span>{data!.text}</span>}
              </ResultCard>

              {/* التكييف القانوني */}
              <ResultCard title="🏛️ التكييف القانوني للجريمة" badge="تكييف" badgeClass="badge-class" titleColor="#fcd34d"
                copyText={`النوع: ${data!.classification.crime_type}\nالتصنيف: ${data!.classification.category}\nالأركان:\n${data!.classification.elements.map((e, i) => `${i + 1}. ${e}`).join("\n")}`}>
                {loadingAi ? <Skeletons n={4} /> : aiError ? <ErrMsg msg={aiError} /> : (
                  <div className="stack">
                    <DField label="نوع الجريمة" value={data!.classification.crime_type} highlight />
                    <DField label="التصنيف" value={data!.classification.category} />
                    {data!.classification.elements.length > 0 && (
                      <div>
                        <div className="d-field-lbl" style={{ marginBottom: ".4rem" }}>الأركان القانونية:</div>
                        <ol style={{ margin: 0, paddingRight: "1.2rem", lineHeight: 1.9, color: "#e5e7eb" }}>
                          {data!.classification.elements.map((e, i) => <li key={i}>{e}</li>)}
                        </ol>
                      </div>
                    )}
                  </div>
                )}
              </ResultCard>

              {/* العقوبة */}
              <ResultCard title="⚖️ العقوبة والظروف" badge="عقوبة" badgeClass="badge-penalty" titleColor="#fca5a5"
                copyText={`الأصلية: ${data!.penalty.primary}\nالتكميلية: ${data!.penalty.complementary}\nالتقادم: ${data!.penalty.statute_of_limitations}\nمشددة: ${data!.penalty.aggravating.join("؛ ")}\nمخففة: ${data!.penalty.mitigating.join("؛ ")}`}>
                {loadingAi ? <Skeletons n={5} /> : aiError ? <ErrMsg msg={aiError} /> : (
                  <div className="stack">
                    <DField label="العقوبة الأصلية" value={data!.penalty.primary} highlight />
                    <DField label="العقوبات التكميلية" value={data!.penalty.complementary} />
                    <DField label="التقادم" value={data!.penalty.statute_of_limitations} />
                    {data!.penalty.aggravating.length > 0 && (
                      <div className="penalty-box penalty-up">
                        <div className="penalty-head">⬆ ظروف مشددة</div>
                        <ul>{data!.penalty.aggravating.map((a, i) => <li key={i}>{a}</li>)}</ul>
                      </div>
                    )}
                    {data!.penalty.mitigating.length > 0 && (
                      <div className="penalty-box penalty-down">
                        <div className="penalty-head">⬇ ظروف مخففة</div>
                        <ul>{data!.penalty.mitigating.map((m, i) => <li key={i}>{m}</li>)}</ul>
                      </div>
                    )}
                  </div>
                )}
              </ResultCard>

              {/* شكلية */}
              <ResultCard title="الدفوع الشكلية التفصيلية" badge="شكلية" badgeClass="badge-shakly" titleColor="#93c5fd"
                copyText={data!.shakly.map((s, i) => `${i + 1}. ${s.title}\n- الأساس: ${s.basis}\n- الشروط: ${s.conditions}\n- السلطة: ${s.discretion}\n- الأثر: ${s.effect}\n- النقض: ${s.naqd_position}`).join("\n\n")}>
                {loadingAi ? <Skeletons n={5} /> : aiError ? <ErrMsg msg={aiError} /> :
                  data!.shakly.length === 0 ? <EmptyMsg /> : (
                    <div className="stack">
                      {data!.shakly.map((s, i) => (
                        <div key={i} className="defense-item defense-shakly">
                          <div className="defense-title">{i + 1}. {s.title}</div>
                          <DField label="الأساس القانوني" value={s.basis} />
                          <DField label="شروط الإثارة" value={s.conditions} />
                          <DField label="السلطة التقديرية" value={s.discretion} />
                          <DField label="الأثر المترتب" value={s.effect} />
                          <DField label="موقف محكمة النقض" value={s.naqd_position} />
                        </div>
                      ))}
                    </div>
                  )}
              </ResultCard>

              {/* موضوعية */}
              <ResultCard title="الدفوع الموضوعية التفصيلية" badge="موضوعية" badgeClass="badge-mawdoo" titleColor="#d8b4fe"
                copyText={data!.mawdoo.map((s, i) => `${i + 1}. ${s.title}\n- الركن: ${s.missing_element}\n- الأدلة: ${s.evidence}\n- رد الخصم: ${s.opponent_response}\n- الصياغة: ${s.suggested_wording}`).join("\n\n")}>
                {loadingAi ? <Skeletons n={5} /> : aiError ? <ErrMsg msg={aiError} /> :
                  data!.mawdoo.length === 0 ? <EmptyMsg /> : (
                    <div className="stack">
                      {data!.mawdoo.map((s, i) => (
                        <div key={i} className="defense-item defense-mawdoo">
                          <div className="defense-title">{i + 1}. {s.title}</div>
                          <DField label="الركن المنتفي" value={s.missing_element} />
                          <DField label="الأدلة المطلوبة" value={s.evidence} />
                          <DField label="الرد على الخصم" value={s.opponent_response} />
                          <DField label="الصياغة المقترحة" value={s.suggested_wording} highlight />
                        </div>
                      ))}
                    </div>
                  )}
              </ResultCard>

              {/* استراتيجية الدفاع */}
              <ResultCard title="🎯 استراتيجية الدفاع المتكاملة" badge="خطة" badgeClass="badge-strategy" titleColor="#5eead4"
                copyText={data!.strategy.map((s, i) => `${i + 1}. ${s}`).join("\n")}>
                {loadingAi ? <Skeletons n={5} /> : aiError ? <ErrMsg msg={aiError} /> :
                  data!.strategy.length === 0 ? <EmptyMsg /> : (
                    <ol className="strategy-list">
                      {data!.strategy.map((s, i) => (
                        <li key={i} className="strategy-li">
                          <span className="strategy-num">{i + 1}</span>
                          <span>{s}</span>
                        </li>
                      ))}
                    </ol>
                  )}
              </ResultCard>

              {/* مواد ذات صلة */}
              <ResultCard title="🔗 مواد ذات صلة" badge="صلة" badgeClass="badge-related" titleColor="#a78bfa"
                copyText={data!.related.map((r) => `المادة ${r.number} (${r.law}): ${r.relation}`).join("\n")}>
                {loadingAi ? <Skeletons n={3} /> : aiError ? <ErrMsg msg={aiError} /> :
                  data!.related.length === 0 ? <EmptyMsg /> : (
                    <div className="stack">
                      {data!.related.map((r, i) => (
                        <div key={i} className="defense-item" style={{ borderRight: "3px solid #a78bfa" }}>
                          <div className="defense-title" style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap" }}>
                            <span>المادة {r.number}</span>
                            <button className="chip" onClick={() => { setNum(r.number); analyze(r.number); }}>↩ افتح</button>
                          </div>
                          <div style={{ color: "#9ca3af", fontSize: ".8rem", marginBottom: ".3rem" }}>{r.law}</div>
                          <div>{r.relation}</div>
                        </div>
                      ))}
                    </div>
                  )}
              </ResultCard>

              {/* ثغرات */}
              <ResultCard title="الثغرات التشريعية ونقاط الضعف" badge="ثغرات" badgeClass="badge-thaghra" titleColor="#fca5a5" className="col-span-2"
                copyText={data!.thaghra.map((t, i) => `${i + 1}. ${t.title}\n${t.description}\n◈ اقتراح: ${t.proposed_amendment}`).join("\n\n")}>
                {loadingAi ? <Skeletons n={4} /> : aiError ? <ErrMsg msg={aiError} /> :
                  data!.thaghra.length === 0 ? <EmptyMsg /> : (
                    <div className="stack">
                      {data!.thaghra.map((t, i) => (
                        <div key={i} className="defense-item defense-thaghra">
                          <div className="defense-title" style={{ color: "#fca5a5" }}>{i + 1}. {t.title}</div>
                          <div style={{ marginBottom: ".5rem" }}>{t.description}</div>
                          {t.proposed_amendment && (
                            <div className="amend-box">
                              <div className="amend-head">◈ اقتراح التعديل التشريعي</div>
                              <div>{t.proposed_amendment}</div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
              </ResultCard>

              {/* نقض */}
              <ResultCard title="مبادئ محكمة النقض الجنائي" badge="نقض" badgeClass="badge-naqd" titleColor="#d4af37"
                copyText={data!.naqd.map((n) => `${n.ref}\n${n.text}`).join("\n\n")}>
                {loadingAi ? <Skeletons n={3} /> : aiError ? <ErrMsg msg={aiError} /> :
                  data!.naqd.length === 0 ? <EmptyMsg label="لا توجد مبادئ نقض." /> : (
                    <ul className="naqd-list">
                      {data!.naqd.map((n, i) => (
                        <li key={i} className="naqd-li">
                          <div className="naqd-ref">{n.ref}</div>
                          <div style={{ color: "#e5e7eb", lineHeight: 1.8 }}>{n.text}</div>
                          {n.source && (<a href={n.source} target="_blank" rel="noreferrer" className="naqd-src">🔗 المصدر</a>)}
                        </li>
                      ))}
                    </ul>
                  )}
              </ResultCard>

              {/* تعليقات */}
              <ResultCard title="📚 تعليقات فقهية أكاديمية" badge="فقه" badgeClass="badge-ta3liq" titleColor="#5eead4"
                copyText={data!.ta3liqat.map((t, i) => `${i + 1}. ${t.title}\n${t.content}`).join("\n\n")}>
                {loadingAi ? <Skeletons n={4} /> : aiError ? <ErrMsg msg={aiError} /> :
                  data!.ta3liqat.length === 0 ? <EmptyMsg label="لا توجد تعليقات." /> : (
                    <div className="stack">
                      {data!.ta3liqat.map((t, i) => (
                        <div key={i} className="defense-item defense-ta3liq">
                          <div className="defense-title" style={{ color: "#5eead4" }}>
                            {i + 1}. {t.title}
                            {t.category && <span className="cat-pill">{t.category}</span>}
                          </div>
                          <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.9 }}>{t.content}</div>
                        </div>
                      ))}
                    </div>
                  )}
              </ResultCard>

              {/* مذكرة */}
              <ResultCard title="✍️ مسودة مذكرة جنائية احترافية" titleColor="#d4af37" className="col-span-2" copyText={data!.muzakkira}>
                {loadingAi ? <Skeletons n={6} /> : aiError ? <ErrMsg msg={aiError} /> : (
                  <div className="font-serif-ar muzakkira-box">{data!.muzakkira || "—"}</div>
                )}
              </ResultCard>
            </div>
          </section>
        ) : tab === "article" && (
          <section style={{ textAlign: "center", padding: "5rem 0" }}>
            <div className="hero-icon">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#d4af37" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 style={{ fontSize: "1.35rem", fontWeight: 700, color: "#d4af37", marginBottom: ".5rem" }}>ابدأ بتحليل مادة من قانون العقوبات</h3>
            <p style={{ color: "#9ca3af", maxWidth: "36rem", margin: "0 auto", lineHeight: 1.9 }}>
              أدخل رقم المادة لتحصل على: تكييف الجريمة، العقوبة المقررة، الظروف المشددة والمخففة، الدفوع الشكلية والموضوعية،
              مبادئ النقض، المواد المرتبطة، استراتيجية دفاع كاملة، ومسودة مذكرة جنائية جاهزة للطباعة بصيغة PDF.
            </p>
            <div className="value-strip">
              <div className="value-pill">⚖️ تكييف وعقوبة</div>
              <div className="value-pill">🛡️ 10+ دفوع تفصيلية</div>
              <div className="value-pill">📚 مبادئ نقض</div>
              <div className="value-pill">🎯 استراتيجية دفاع</div>
              <div className="value-pill">📝 مذكرة PDF</div>
            </div>
          </section>
        )}

        {/* OFFICIAL SOURCES */}
        <section className="card gold-border" style={{ borderRadius: "1rem", padding: "1.5rem", marginTop: "2.5rem" }}>
          <h2 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#d4af37", marginBottom: "1rem" }}>
            🏛️ المصادر الرسمية المصرية
          </h2>
          <div className="sources-grid">
            {OFFICIAL_SOURCES.map((s) => (
              <a key={s.url} href={s.url} target="_blank" rel="noreferrer" className="source-card"
                style={{ borderRightColor: s.color }}>
                <div className="source-name" style={{ color: s.color }}>🔗 {s.name}</div>
                <div className="source-desc">{s.desc}</div>
              </a>
            ))}
          </div>
        </section>
      </main>

      <footer className="lg-footer">
        <div className="container">
          <div className="footer-sources">
            {OFFICIAL_SOURCES.map((s) => (
              <a key={s.url} href={s.url} target="_blank" rel="noreferrer" style={{ color: s.color }}>{s.name}</a>
            ))}
          </div>
          <div style={{ marginTop: ".5rem" }}>
            © {new Date().getFullYear()} موسوعة قانون العقوبات المصري — أداة استرشادية لا تغني عن الرأي القانوني المتخصص
          </div>
        </div>
      </footer>
    </div>
  );
}

// ---------- Components ----------
function ResultCard({
  title, titleColor, badge, badgeClass, children, className, serif, large, copyText,
}: {
  title: string; titleColor: string; badge?: string; badgeClass?: string;
  children: React.ReactNode; className?: string; serif?: boolean; large?: boolean; copyText?: string;
}) {
  return (
    <div className={`card gold-border fade-in ${className || ""}`} style={{ borderRadius: ".75rem", overflow: "hidden" }}>
      <div className="card-header" style={{ padding: ".75rem 1.25rem", display: "flex", alignItems: "center", gap: ".5rem" }}>
        {badge && <span className={badgeClass} style={{ fontSize: ".7rem", padding: ".15rem .5rem", borderRadius: ".25rem" }}>{badge}</span>}
        <h3 style={{ fontWeight: 700, color: titleColor, margin: 0, flex: 1 }}>{title}</h3>
        {copyText !== undefined && <CopyBtn text={copyText} compact />}
      </div>
      <div className={serif ? "font-serif-ar" : ""}
        style={{ padding: "1.25rem", color: "#e5e7eb", lineHeight: large ? 2 : 1.8, fontSize: large ? "1.1rem" : "1rem" }}>
        {children}
      </div>
    </div>
  );
}

function DField({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  if (!value || !value.trim()) return null;
  return (
    <div className={`d-field${highlight ? " d-field-hl" : ""}`}>
      <span className="d-field-lbl">{label}:</span> <span>{value}</span>
    </div>
  );
}

function CopyBtn({ text, label, compact }: { text: string; label?: string; compact?: boolean }) {
  const [copied, setCopied] = useState(false);
  const onClick = async () => {
    try { await navigator.clipboard.writeText(text || ""); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* noop */ }
  };
  return (
    <button onClick={onClick} className="chip copy-btn" disabled={!text} title="نسخ"
      style={compact ? { padding: ".2rem .55rem", fontSize: ".7rem" } : { padding: ".5rem 1rem" }}>
      {copied ? "✓ تم النسخ" : (label || "📋 نسخ")}
    </button>
  );
}

function ErrMsg({ msg }: { msg: string }) { return <p style={{ color: "#fca5a5" }}>⚠️ {msg}</p>; }
function EmptyMsg({ label }: { label?: string }) { return <p style={{ color: "#9ca3af" }}>{label || "لا توجد بيانات."}</p>; }
function Skeletons({ n }: { n: number }) {
  return (<>{Array.from({ length: n }).map((_, i) => (<div key={i} className="skeleton" style={{ width: `${60 + ((i * 13) % 35)}%` }} />))}</>);
}

// ---------- Styles ----------
const styles = `
.legal-root{font-family:'Tajawal',sans-serif;background:radial-gradient(ellipse at top,#16294f 0%,#0a1428 60%);min-height:100vh;color:#f5f5f5}
.legal-root .font-serif-ar{font-family:'Amiri',serif}
.legal-root .gold-border{border:1px solid rgba(212,175,55,.3)}
.legal-root .gold-glow{box-shadow:0 0 30px -10px rgba(212,175,55,.4)}
.legal-root .card{background:linear-gradient(145deg,rgba(22,41,79,.7),rgba(15,29,58,.7));backdrop-filter:blur(10px)}
.legal-root .card-header{background:linear-gradient(90deg,rgba(212,175,55,.15),transparent);border-bottom:1px solid rgba(212,175,55,.25)}
.legal-root select,.legal-root input,.legal-root textarea{background:rgba(10,20,40,.6);color:#fff;border:1px solid rgba(212,175,55,.3);border-radius:.5rem;padding:.6rem .9rem;width:100%;font:inherit}
.legal-root textarea{resize:vertical;min-height:120px}
.legal-root select:focus,.legal-root input:focus,.legal-root textarea:focus{outline:none;border-color:#d4af37;box-shadow:0 0 0 3px rgba(212,175,55,.2)}
.legal-root .lbl-form{font-size:.85rem;color:#d1d5db;display:block;margin-bottom:.25rem}
.legal-root .btn-gold{background:linear-gradient(to left,#b8901f,#d4af37);color:#0a1428;font-weight:700;padding:.75rem 1rem;border-radius:.5rem;cursor:pointer;border:0;transition:filter .15s}
.legal-root .btn-gold:hover{filter:brightness(1.1)} .legal-root .btn-gold:disabled{opacity:.6;cursor:not-allowed}
.legal-root .chip{padding:.25rem .75rem;border-radius:9999px;border:1px solid rgba(212,175,55,.3);font-size:.75rem;cursor:pointer;background:transparent;color:#f5f5f5;transition:background .15s}
.legal-root .chip:hover{background:rgba(212,175,55,.1)} .legal-root .chip:disabled{opacity:.5;cursor:not-allowed}
.legal-root .chip-gold{padding:.3rem .8rem;border-radius:9999px;font-size:.7rem;font-weight:700;background:linear-gradient(to left,#b8901f,#d4af37);color:#0a1428}
.legal-root .copy-btn{white-space:nowrap}
.legal-root .badge-shakly{background:rgba(59,130,246,.15);color:#93c5fd;border:1px solid rgba(59,130,246,.4)}
.legal-root .badge-mawdoo{background:rgba(168,85,247,.15);color:#d8b4fe;border:1px solid rgba(168,85,247,.4)}
.legal-root .badge-thaghra{background:rgba(239,68,68,.15);color:#fca5a5;border:1px solid rgba(239,68,68,.4)}
.legal-root .badge-naqd{background:rgba(212,175,55,.15);color:#fcd34d;border:1px solid rgba(212,175,55,.4)}
.legal-root .badge-ta3liq{background:rgba(45,212,191,.15);color:#5eead4;border:1px solid rgba(45,212,191,.4)}
.legal-root .badge-class{background:rgba(252,211,77,.15);color:#fcd34d;border:1px solid rgba(252,211,77,.4)}
.legal-root .badge-penalty{background:rgba(239,68,68,.15);color:#fca5a5;border:1px solid rgba(239,68,68,.4)}
.legal-root .badge-strategy{background:rgba(45,212,191,.15);color:#5eead4;border:1px solid rgba(45,212,191,.4)}
.legal-root .badge-related{background:rgba(167,139,250,.15);color:#c4b5fd;border:1px solid rgba(167,139,250,.4)}
.legal-root .scale-icon{filter:drop-shadow(0 0 8px rgba(212,175,55,.5))}
@keyframes legalFadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
.legal-root .fade-in{animation:legalFadeIn .4s ease-out}
.legal-root a{color:#d4af37}
.legal-root .container{max-width:80rem;margin:0 auto;padding:0 1.5rem}
.legal-root .grid-12{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:.75rem}
.legal-root .grid-results{display:grid;grid-template-columns:1fr;gap:1.25rem}
@media (min-width:1024px){.legal-root .grid-results{grid-template-columns:repeat(2,1fr)}.legal-root .col-span-2{grid-column:span 2}}
@media (max-width:768px){.legal-root .grid-12 > *{grid-column:span 12 !important}}
.legal-root .col-3{grid-column:span 3} .legal-root .col-4{grid-column:span 4} .legal-root .col-5{grid-column:span 5} .legal-root .col-7{grid-column:span 7} .legal-root .col-9{grid-column:span 9}
.legal-root .skeleton{background:linear-gradient(90deg,rgba(255,255,255,.05),rgba(255,255,255,.12),rgba(255,255,255,.05));background-size:200% 100%;animation:shimmer 1.4s infinite;border-radius:.4rem;height:1rem;margin:.4rem 0}
@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
.legal-root .stack{display:flex;flex-direction:column;gap:.85rem}
.legal-root .defense-item{background:rgba(10,20,40,.5);border:1px solid rgba(212,175,55,.15);border-radius:.6rem;padding:.85rem 1rem}
.legal-root .defense-shakly{border-right:3px solid #3b82f6}
.legal-root .defense-mawdoo{border-right:3px solid #a855f7}
.legal-root .defense-thaghra{border-right:3px solid #ef4444}
.legal-root .defense-ta3liq{border-right:3px solid #2dd4bf}
.legal-root .defense-title{font-weight:700;color:#fcd34d;margin-bottom:.5rem;font-size:1.02rem;line-height:1.6}
.legal-root .d-field{margin:.3rem 0;line-height:1.85;color:#e5e7eb;font-size:.95rem}
.legal-root .d-field-lbl{color:#fcd34d;font-weight:700;margin-left:.3rem}
.legal-root .d-field-hl{background:rgba(212,175,55,.08);border-right:2px solid #d4af37;padding:.4rem .6rem;border-radius:.35rem;margin-top:.5rem}
.legal-root .amend-box{margin-top:.65rem;background:linear-gradient(135deg,rgba(212,175,55,.15),rgba(184,144,31,.1));border:1px solid rgba(212,175,55,.45);border-right:4px solid #d4af37;padding:.75rem 1rem;border-radius:.5rem;color:#fde68a}
.legal-root .amend-head{color:#d4af37;font-weight:700;margin-bottom:.35rem;font-size:.95rem}
.legal-root .naqd-list{list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:.85rem}
.legal-root .naqd-li{border-right:3px solid #d4af37;padding-right:.85rem;background:rgba(10,20,40,.4);border-radius:.4rem;padding-top:.5rem;padding-bottom:.5rem}
.legal-root .naqd-ref{color:#fcd34d;font-weight:700;font-size:.88rem;margin-bottom:.3rem}
.legal-root .naqd-src{display:inline-block;margin-top:.35rem;font-size:.78rem;color:#93c5fd;text-decoration:underline}
.legal-root .cat-pill{display:inline-block;margin-right:.5rem;font-size:.7rem;background:rgba(45,212,191,.18);color:#5eead4;padding:.1rem .55rem;border-radius:9999px;font-weight:400;vertical-align:middle}
.legal-root .muzakkira-box{background:rgba(10,20,40,.4);border-right:4px solid #d4af37;padding:1.25rem;border-radius:.5rem;line-height:2;font-size:1.05rem;color:#f3f4f6;white-space:pre-wrap}
.legal-root .results-toolbar{display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem;flex-wrap:wrap;gap:.5rem}
.legal-root .lg-header{border-bottom:1px solid rgba(212,175,55,.3);background:rgba(10,20,40,.8);backdrop-filter:blur(8px);position:sticky;top:0;z-index:50}
.legal-root .lg-header-inner{display:flex;align-items:center;justify-content:space-between;padding:1rem 1.5rem;flex-wrap:wrap;gap:.5rem}
.legal-root .hero-icon{display:inline-flex;padding:1.5rem;border-radius:9999px;background:rgba(212,175,55,.1);border:1px solid rgba(212,175,55,.3);margin-bottom:1rem}
.legal-root .sources-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:.75rem}
.legal-root .source-card{display:block;background:rgba(10,20,40,.5);border:1px solid rgba(212,175,55,.2);border-right:4px solid #d4af37;padding:.85rem 1rem;border-radius:.5rem;text-decoration:none;transition:transform .15s,background .15s}
.legal-root .source-card:hover{transform:translateY(-2px);background:rgba(10,20,40,.75)}
.legal-root .source-name{font-weight:700;font-size:.95rem;margin-bottom:.25rem}
.legal-root .source-desc{font-size:.75rem;color:#9ca3af}
.legal-root .lg-footer{border-top:1px solid rgba(212,175,55,.2);margin-top:3rem;padding:1.5rem;text-align:center;font-size:.78rem;color:#9ca3af}
.legal-root .footer-sources{display:flex;flex-wrap:wrap;gap:.85rem;justify-content:center}
.legal-root .footer-sources a{text-decoration:none;font-size:.78rem}
.legal-root .footer-sources a:hover{text-decoration:underline}
.legal-root .tabs{display:flex;gap:.5rem;margin-bottom:1.5rem;flex-wrap:wrap}
.legal-root .tab{padding:.7rem 1.2rem;background:rgba(10,20,40,.5);border:1px solid rgba(212,175,55,.3);color:#d1d5db;border-radius:.5rem;cursor:pointer;font-size:.9rem;font-weight:500;font-family:inherit;transition:all .15s}
.legal-root .tab:hover{background:rgba(212,175,55,.1)}
.legal-root .tab-active{background:linear-gradient(to left,#b8901f,#d4af37);color:#0a1428;font-weight:700;border-color:#d4af37}
.legal-root .penalty-box{margin-top:.5rem;padding:.65rem .85rem;border-radius:.4rem;border-right:3px solid}
.legal-root .penalty-up{background:rgba(239,68,68,.1);border-color:#ef4444}
.legal-root .penalty-down{background:rgba(45,212,191,.1);border-color:#2dd4bf}
.legal-root .penalty-head{font-weight:700;margin-bottom:.35rem;font-size:.9rem}
.legal-root .penalty-up .penalty-head{color:#fca5a5}
.legal-root .penalty-down .penalty-head{color:#5eead4}
.legal-root .penalty-box ul{margin:0;padding-right:1.2rem;line-height:1.9;color:#e5e7eb;font-size:.9rem}
.legal-root .strategy-list{list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:.6rem;counter-reset:strat}
.legal-root .strategy-li{display:flex;gap:.75rem;align-items:flex-start;background:rgba(45,212,191,.06);border:1px solid rgba(45,212,191,.25);padding:.7rem .85rem;border-radius:.5rem;line-height:1.8}
.legal-root .strategy-num{flex-shrink:0;width:1.8rem;height:1.8rem;border-radius:50%;background:linear-gradient(135deg,#2dd4bf,#0d9488);color:#0a1428;font-weight:700;display:inline-flex;align-items:center;justify-content:center;font-size:.85rem}
.legal-root .conf-عالية{font-size:.7rem;padding:.15rem .55rem;border-radius:9999px;background:rgba(34,197,94,.2);color:#86efac;font-weight:600}
.legal-root .conf-متوسطة{font-size:.7rem;padding:.15rem .55rem;border-radius:9999px;background:rgba(212,175,55,.2);color:#fcd34d;font-weight:600}
.legal-root .conf-منخفضة{font-size:.7rem;padding:.15rem .55rem;border-radius:9999px;background:rgba(156,163,175,.2);color:#d1d5db;font-weight:600}
.legal-root .value-strip{display:flex;flex-wrap:wrap;gap:.5rem;justify-content:center;margin-top:1.5rem}
.legal-root .value-pill{padding:.5rem 1rem;background:rgba(212,175,55,.1);border:1px solid rgba(212,175,55,.3);color:#fcd34d;border-radius:9999px;font-size:.85rem;font-weight:600}
`;
