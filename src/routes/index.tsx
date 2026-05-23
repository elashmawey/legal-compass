import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  // Types
  type AnalysisData,
  type ClassifyResult,
  type HistItem,
  EMPTY_ANALYSIS,
  // Constants
  LAW,
  LAW_NAME,
  QUICK_EXAMPLES,
  // Utils
  toStr,
  arr,
  normClassification,
  normPenalty,
  normShakly,
  normMawdoo,
  normThaghra,
  normNaqd,
  normRelated,
  normTa3liqat,
  readHistory,
  pushHistory,
  // UI Components
  Skeletons,
  ErrMsg,
  EmptyMsg,
  CopyBtn,
  DField,
  ResultCard,
  // Layout Components
  Header,
  Footer,
  OfficialSources,
  EmptyState,
  // Styles
  legalStyles,
} from "@/components/legal";

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
        setDbStatus("قاعدة بيانات قانون العقوبات فارغة — افتح لوحة الإدارة لاستيرادها.");
        return;
      }
      setDbStatus(`محفوظ في قاعدة البيانات: ${penalCount} مادة من قانون العقوبات`);
    } catch {
      setDbStatus("تعذّر الاتصال بالخادم.");
    }
  };

  useEffect(() => {
    loadStats();
    setHistory(readHistory());
  }, []);

  const analyze = async (numArg?: string) => {
    const nm = (numArg ?? num).trim();
    if (!nm) return;

    setResultTitle(`المادة ${nm} — ${LAW_NAME}`);
    setAiError(null);
    setLoadingArticle(true);
    setLoadingAi(true);
    setData({ ...EMPTY_ANALYSIS, text: "جارٍ التحميل من قاعدة البيانات..." });

    setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);

    let liveText: string | null = null;
    try {
      const res = await fetch(`/api/public/article?law=${LAW}&num=${encodeURIComponent(nm)}`);
      if (res.ok) {
        const j = (await res.json()) as { found?: boolean; article_text?: string };
        if (j.found && j.article_text) liveText = j.article_text;
      }
    } catch {
      /* noop */
    }

    const baseText =
      liveText ||
      `لم يتم العثور على المادة ${nm} في قاعدة البيانات المحلية. سيتم التحليل بناءً على المعرفة العامة بقانون العقوبات.`;
    setData({ ...EMPTY_ANALYSIS, text: baseText });
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
    if (f.length < 20) {
      setClassifyError("يرجى وصف الواقعة بتفصيل أكبر (20 حرفًا على الأقل).");
      return;
    }
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
          suggested_articles: Array.isArray(j.suggested_articles)
            ? j.suggested_articles.map((a: Record<string, unknown>) => ({
                number: toStr(a.number),
                title: toStr(a.title),
                reason: toStr(a.reason),
                confidence: toStr(a.confidence) || "متوسطة",
              }))
            : [],
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
    if (!ingestToken || !ingestUrl) {
      setIngestResult("يلزم إدخال الرمز والرابط.");
      return;
    }
    setIngestBusy(true);
    setIngestResult("جارٍ الكشط من المصدر... قد يستغرق 30-90 ثانية.");
    try {
      const res = await fetch("/api/public/ingest-law", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-ingest-token": ingestToken },
        body: JSON.stringify({ lawType: LAW, sourceUrl: ingestUrl }),
      });
      const j = await res.json();
      if (!res.ok) {
        setIngestResult(`فشل (${res.status}): ${j.error || ""}\n${j.detail || j.preview || ""}`);
      } else {
        const sample = (j.sample || []).map((s: { number: string }) => `م.${s.number}`).join(", ");
        setIngestResult(`تم استيراد ${j.count} مادة.\nعينة: ${sample}`);
        loadStats();
      }
    } catch (e) {
      setIngestResult(`خطأ شبكي: ${(e as Error).message}`);
    } finally {
      setIngestBusy(false);
    }
  };

  // --- exporters ---
  const memoText = useMemo(() => {
    if (!data) return "";
    const sh = data.shakly.length
      ? data.shakly
          .map(
            (s, i) =>
              `${i + 1}. ${s.title}\n   - الأساس: ${s.basis}\n   - الشروط: ${s.conditions}\n   - السلطة: ${s.discretion}\n   - الأثر: ${s.effect}\n   - النقض: ${s.naqd_position}`
          )
          .join("\n\n")
      : "—";
    const mw = data.mawdoo.length
      ? data.mawdoo
          .map(
            (s, i) =>
              `${i + 1}. ${s.title}\n   - الركن المنتفي: ${s.missing_element}\n   - الأدلة: ${s.evidence}\n   - رد الخصم: ${s.opponent_response}\n   - الصياغة: ${s.suggested_wording}`
          )
          .join("\n\n")
      : "—";
    const th = data.thaghra.length
      ? data.thaghra
          .map(
            (t, i) =>
              `${i + 1}. ${t.title}\n   ${t.description}\n   - تعديل مقترح: ${t.proposed_amendment}`
          )
          .join("\n\n")
      : "—";
    const nq = data.naqd.length ? data.naqd.map((n) => `— ${n.ref}\n  ${n.text}`).join("\n\n") : "—";
    const tl = data.ta3liqat.length
      ? data.ta3liqat
          .map((t, i) => `${i + 1}. ${t.title}${t.category ? ` [${t.category}]` : ""}\n   ${t.content}`)
          .join("\n\n")
      : "—";
    const rel = data.related.length
      ? data.related.map((r) => `- المادة ${r.number} (${r.law}): ${r.relation}`).join("\n")
      : "—";
    const str = data.strategy.length ? data.strategy.map((s, i) => `${i + 1}. ${s}`).join("\n") : "—";

    return [
      "موسوعة قانون العقوبات المصري — المحلل الجنائي الاحترافي",
      "================================================================",
      resultTitle,
      `تاريخ الإصدار: ${new Date().toLocaleDateString("ar-EG")}`,
      "",
      "[نص المادة]",
      data.text,
      "",
      "[التكييف القانوني]",
      `نوع الجريمة: ${data.classification.crime_type}`,
      `التصنيف: ${data.classification.category}`,
      "الأركان:",
      data.classification.elements.map((e, i) => `  ${i + 1}. ${e}`).join("\n") || "—",
      "",
      "[العقوبة]",
      `الأصلية: ${data.penalty.primary}`,
      `التكميلية: ${data.penalty.complementary}`,
      `التقادم: ${data.penalty.statute_of_limitations}`,
      "الظروف المشددة:",
      data.penalty.aggravating.map((a) => `  + ${a}`).join("\n") || "—",
      "الظروف المخففة:",
      data.penalty.mitigating.map((m) => `  - ${m}`).join("\n") || "—",
      "",
      "[الدفوع الشكلية التفصيلية]",
      sh,
      "",
      "[الدفوع الموضوعية التفصيلية]",
      mw,
      "",
      "[الثغرات التشريعية واقتراحات التعديل]",
      th,
      "",
      "[مبادئ محكمة النقض]",
      nq,
      "",
      "[مواد ذات صلة]",
      rel,
      "",
      "[استراتيجية الدفاع]",
      str,
      "",
      "[تعليقات فقهية]",
      tl,
      "",
      "[مسودة المذكرة الجنائية]",
      data.muzakkira || "—",
      "",
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
    const esc = (s: string) =>
      s
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\n/g, "<br/>");
    const block = (label: string, val: string) =>
      val ? `<div class="row"><span class="lbl">${esc(label)}:</span> ${esc(val)}</div>` : "";
    const list = (items: string[]) =>
      items.length
        ? `<ul>${items.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>`
        : '<p class="muted">—</p>';

    const shHtml = data.shakly.length
      ? data.shakly
          .map(
            (s, i) => `<div class="item">
        <div class="t">${i + 1}. ${esc(s.title)}</div>
        ${block("الأساس القانوني", s.basis)}${block("شروط الإثارة", s.conditions)}
        ${block("السلطة التقديرية", s.discretion)}${block("الأثر المترتب", s.effect)}
        ${block("موقف النقض", s.naqd_position)}</div>`
          )
          .join("")
      : '<p class="muted">—</p>';
    const mwHtml = data.mawdoo.length
      ? data.mawdoo
          .map(
            (s, i) => `<div class="item">
        <div class="t">${i + 1}. ${esc(s.title)}</div>
        ${block("الركن المنتفي", s.missing_element)}${block("الأدلة المطلوبة", s.evidence)}
        ${block("الرد على الخصم", s.opponent_response)}${block("الصياغة المقترحة", s.suggested_wording)}</div>`
          )
          .join("")
      : '<p class="muted">—</p>';
    const thHtml = data.thaghra.length
      ? data.thaghra
          .map(
            (t, i) => `<div class="item">
        <div class="t">${i + 1}. ${esc(t.title)}</div><div>${esc(t.description)}</div>
        ${t.proposed_amendment ? `<div class="amend"><b>◈ اقتراح التعديل:</b><br/>${esc(t.proposed_amendment)}</div>` : ""}</div>`
          )
          .join("")
      : '<p class="muted">—</p>';
    const nqHtml = data.naqd.length
      ? data.naqd
          .map((n) => `<div class="naqd"><div class="ref">${esc(n.ref)}</div><div>${esc(n.text)}</div></div>`)
          .join("")
      : '<p class="muted">—</p>';
    const tlHtml = data.ta3liqat.length
      ? data.ta3liqat
          .map(
            (t, i) => `<div class="item">
        <div class="t">${i + 1}. ${esc(t.title)}${t.category ? ` <span class="cat">[${esc(t.category)}]</span>` : ""}</div>
        <div>${esc(t.content)}</div></div>`
          )
          .join("")
      : '<p class="muted">—</p>';
    const relHtml = data.related.length
      ? `<ul>${data.related.map((r) => `<li><b>المادة ${esc(r.number)}</b> — ${esc(r.relation)}</li>`).join("")}</ul>`
      : '<p class="muted">—</p>';

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
    if (!w) {
      alert("يرجى السماح بالنوافذ المنبثقة لتصدير PDF.");
      return;
    }
    w.document.open();
    w.document.write(html);
    w.document.close();
  };

  const showResults = data !== null;

  return (
    <div dir="rtl" lang="ar" className="legal-root">
      <style>{legalStyles}</style>

      <Header />

      <main className="container" style={{ padding: "2rem 1.5rem" }}>
        {/* TABS */}
        <div className="tabs">
          <button
            className={`tab ${tab === "article" ? "tab-active" : ""}`}
            onClick={() => setTab("article")}
          >
            تحليل مادة برقمها
          </button>
          <button
            className={`tab ${tab === "classify" ? "tab-active" : ""}`}
            onClick={() => setTab("classify")}
          >
            تكييف واقعة (اقتراح المواد المنطبقة)
          </button>
        </div>

        {tab === "article" ? (
          <ArticleSearchSection
            num={num}
            setNum={setNum}
            analyze={analyze}
            history={history}
            dbStatus={dbStatus}
          />
        ) : (
          <ClassifySection
            facts={facts}
            setFacts={setFacts}
            classifyLoading={classifyLoading}
            classifyError={classifyError}
            classifyResult={classifyResult}
            classifyRef={classifyRef}
            runClassify={runClassify}
            setClassifyResult={setClassifyResult}
            setClassifyError={setClassifyError}
            setTab={setTab}
            setNum={setNum}
            analyze={analyze}
          />
        )}

        {/* ADMIN */}
        <AdminSection
          adminOpen={adminOpen}
          setAdminOpen={setAdminOpen}
          ingestToken={ingestToken}
          setIngestToken={setIngestToken}
          ingestUrl={ingestUrl}
          setIngestUrl={setIngestUrl}
          ingestBusy={ingestBusy}
          ingestResult={ingestResult}
          runIngest={runIngest}
        />

        {/* RESULTS */}
        {showResults ? (
          <ResultsSection
            resultsRef={resultsRef}
            resultTitle={resultTitle}
            data={data!}
            memoText={memoText}
            loadingArticle={loadingArticle}
            loadingAi={loadingAi}
            aiError={aiError}
            exportMemoTxt={exportMemoTxt}
            exportMemoPdf={exportMemoPdf}
            setNum={setNum}
            analyze={analyze}
          />
        ) : (
          tab === "article" && <EmptyState />
        )}

        <OfficialSources />
      </main>

      <Footer />
    </div>
  );
}

// --- Sub-components ---

function ArticleSearchSection({
  num,
  setNum,
  analyze,
  history,
  dbStatus,
}: {
  num: string;
  setNum: (v: string) => void;
  analyze: (numArg?: string) => void;
  history: HistItem[];
  dbStatus: string;
}) {
  return (
    <section
      className="card gold-border gold-glow"
      style={{ borderRadius: "1rem", padding: "1.5rem", marginBottom: "2rem" }}
    >
      <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#d4af37", marginBottom: "1rem" }}>
        ابحث برقم المادة
      </h2>
      <div className="grid-12">
        <div className="col-9">
          <label className="lbl-form">رقم المادة من قانون العقوبات</label>
          <input
            type="text"
            placeholder="مثال: 230 (القتل العمد) أو 17 (الرأفة)"
            value={num}
            onChange={(e) => setNum(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") analyze();
            }}
          />
        </div>
        <div className="col-3" style={{ display: "flex", alignItems: "flex-end" }}>
          <button className="btn-gold gold-glow" style={{ width: "100%" }} onClick={() => analyze()}>
            تحليل احترافي
          </button>
        </div>
      </div>
      <div
        style={{ marginTop: "1rem", display: "flex", flexWrap: "wrap", gap: ".4rem", alignItems: "center" }}
      >
        <span style={{ fontSize: ".75rem", color: "#9ca3af" }}>مواد شهيرة:</span>
        {QUICK_EXAMPLES.map((q) => (
          <button
            key={q.art}
            className="chip"
            title={q.note}
            onClick={() => {
              setNum(q.art);
              analyze(q.art);
            }}
          >
            {q.label} <span style={{ color: "#9ca3af", fontSize: ".65rem" }}>({q.note})</span>
          </button>
        ))}
      </div>
      {history.length > 0 && (
        <div
          style={{ marginTop: ".75rem", display: "flex", flexWrap: "wrap", gap: ".4rem", alignItems: "center" }}
        >
          <span style={{ fontSize: ".75rem", color: "#9ca3af" }}>آخر بحثك:</span>
          {history.slice(0, 8).map((h) => (
            <button
              key={h.num + h.at}
              className="chip"
              onClick={() => {
                setNum(h.num);
                analyze(h.num);
              }}
            >
              م.{h.num}
            </button>
          ))}
        </div>
      )}
      <div style={{ marginTop: ".75rem", fontSize: ".75rem", color: "#9ca3af" }}>{dbStatus}</div>
    </section>
  );
}

function ClassifySection({
  facts,
  setFacts,
  classifyLoading,
  classifyError,
  classifyResult,
  classifyRef,
  runClassify,
  setClassifyResult,
  setClassifyError,
  setTab,
  setNum,
  analyze,
}: {
  facts: string;
  setFacts: (v: string) => void;
  classifyLoading: boolean;
  classifyError: string | null;
  classifyResult: ClassifyResult | null;
  classifyRef: React.RefObject<HTMLDivElement | null>;
  runClassify: () => void;
  setClassifyResult: (v: ClassifyResult | null) => void;
  setClassifyError: (v: string | null) => void;
  setTab: (v: "article" | "classify") => void;
  setNum: (v: string) => void;
  analyze: (numArg?: string) => void;
}) {
  return (
    <section
      className="card gold-border gold-glow"
      style={{ borderRadius: "1rem", padding: "1.5rem", marginBottom: "2rem" }}
    >
      <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#d4af37", marginBottom: ".5rem" }}>
        تكييف الواقعة قانونًا
      </h2>
      <p style={{ color: "#d1d5db", fontSize: ".88rem", marginBottom: "1rem" }}>
        صف الواقعة بأسلوب موضوعي (الزمان، المكان، الأطراف، الأفعال، الأدوات، النتيجة) وسأقترح لك المواد
        المنطبقة من قانون العقوبات.
      </p>
      <textarea
        rows={6}
        value={facts}
        onChange={(e) => setFacts(e.target.value)}
        placeholder="مثال: قام شخص بالدخول ليلاً إلى منزل آخر عن طريق كسر الباب الخارجي واستولى على مبلغ مالي وهاتف محمول..."
      />
      <div style={{ marginTop: ".75rem", display: "flex", gap: ".5rem", flexWrap: "wrap" }}>
        <button className="btn-gold gold-glow" disabled={classifyLoading} onClick={runClassify}>
          {classifyLoading ? "جارٍ التكييف..." : "اقترح المواد المنطبقة"}
        </button>
        <button
          className="chip"
          onClick={() => {
            setFacts("");
            setClassifyResult(null);
            setClassifyError(null);
          }}
        >
          مسح
        </button>
      </div>
      <div ref={classifyRef} style={{ marginTop: "1.25rem" }}>
        {classifyError && <ErrMsg msg={classifyError} />}
        {classifyLoading && <Skeletons n={5} />}
        {classifyResult && (
          <div className="stack">
            {classifyResult.summary && (
              <div className="defense-item" style={{ borderRight: "3px solid #d4af37" }}>
                <div className="defense-title">ملخص الواقعة قانونيًا</div>
                <div>{classifyResult.summary}</div>
              </div>
            )}
            {classifyResult.suggested_articles.length > 0 && (
              <div>
                <div style={{ color: "#d4af37", fontWeight: 700, marginBottom: ".5rem" }}>
                  المواد المقترحة
                </div>
                <div className="stack">
                  {classifyResult.suggested_articles.map((a, i) => (
                    <div key={i} className="defense-item defense-shakly">
                      <div
                        className="defense-title"
                        style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: ".5rem" }}
                      >
                        <span>
                          المادة {a.number} — {a.title}
                        </span>
                        <span className={`conf-${a.confidence}`}>{a.confidence}</span>
                      </div>
                      <div style={{ marginBottom: ".5rem" }}>{a.reason}</div>
                      <button
                        className="chip"
                        onClick={() => {
                          setTab("article");
                          setNum(a.number);
                          analyze(a.number);
                        }}
                      >
                        افتح تحليل المادة {a.number}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {classifyResult.warnings.length > 0 && (
              <div className="amend-box">
                <div className="amend-head">تنبيهات</div>
                <ul style={{ margin: 0, paddingRight: "1.2rem" }}>
                  {classifyResult.warnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>
            )}
            {classifyResult.next_steps.length > 0 && (
              <div className="defense-item" style={{ borderRight: "3px solid #2dd4bf" }}>
                <div className="defense-title" style={{ color: "#5eead4" }}>
                  الخطوات المقترحة
                </div>
                <ol style={{ margin: 0, paddingRight: "1.2rem", lineHeight: 1.9 }}>
                  {classifyResult.next_steps.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function AdminSection({
  adminOpen,
  setAdminOpen,
  ingestToken,
  setIngestToken,
  ingestUrl,
  setIngestUrl,
  ingestBusy,
  ingestResult,
  runIngest,
}: {
  adminOpen: boolean;
  setAdminOpen: (v: boolean) => void;
  ingestToken: string;
  setIngestToken: (v: string) => void;
  ingestUrl: string;
  setIngestUrl: (v: string) => void;
  ingestBusy: boolean;
  ingestResult: string;
  runIngest: () => void;
}) {
  return (
    <section
      className="card gold-border"
      style={{ borderRadius: "1rem", padding: "1.5rem", marginBottom: "2rem" }}
    >
      <button
        onClick={() => setAdminOpen((v) => !v)}
        style={{
          background: "transparent",
          border: 0,
          color: "#d4af37",
          fontWeight: 700,
          cursor: "pointer",
          fontSize: "1rem",
        }}
      >
        لوحة الإدارة — استيراد قانون العقوبات (Firecrawl) {adminOpen ? "▲" : "▼"}
      </button>
      {adminOpen && (
        <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: ".75rem", fontSize: ".9rem" }}>
          <p style={{ color: "#d1d5db", lineHeight: 1.8, margin: 0 }}>
            أدخل رمز الاستيراد السري (INGEST_TOKEN) ورابط المصدر الرسمي لقانون العقوبات.
          </p>
          <div className="grid-12">
            <input
              className="col-5"
              type="password"
              placeholder="رمز الاستيراد السرّي"
              value={ingestToken}
              onChange={(e) => setIngestToken(e.target.value)}
            />
            <input
              className="col-7"
              type="url"
              placeholder="رابط المصدر"
              value={ingestUrl}
              onChange={(e) => setIngestUrl(e.target.value)}
            />
          </div>
          <div>
            <button className="chip" onClick={() => setIngestUrl("https://manshurat.org/node/14677")}>
              قانون العقوبات (منشورات)
            </button>
          </div>
          <div>
            <button className="btn-gold" disabled={ingestBusy} onClick={runIngest}>
              {ingestBusy ? "جارٍ الاستيراد..." : "بدء الاستيراد"}
            </button>
          </div>
          {ingestResult && (
            <pre style={{ color: "#d1d5db", whiteSpace: "pre-wrap", fontFamily: "inherit", margin: 0 }}>
              {ingestResult}
            </pre>
          )}
        </div>
      )}
    </section>
  );
}

function ResultsSection({
  resultsRef,
  resultTitle,
  data,
  memoText,
  loadingArticle,
  loadingAi,
  aiError,
  exportMemoTxt,
  exportMemoPdf,
  setNum,
  analyze,
}: {
  resultsRef: React.RefObject<HTMLDivElement | null>;
  resultTitle: string;
  data: AnalysisData;
  memoText: string;
  loadingArticle: boolean;
  loadingAi: boolean;
  aiError: string | null;
  exportMemoTxt: () => void;
  exportMemoPdf: () => void;
  setNum: (v: string) => void;
  analyze: (numArg?: string) => void;
}) {
  return (
    <section ref={resultsRef}>
      <div className="results-toolbar">
        <h2 className="font-serif-ar" style={{ fontSize: "1.5rem", fontWeight: 700, color: "#d4af37", margin: 0 }}>
          {resultTitle}
        </h2>
        <div style={{ display: "flex", gap: ".5rem", flexWrap: "wrap" }}>
          <CopyBtn text={memoText} label="نسخ كامل" />
          <button className="chip" onClick={exportMemoTxt} style={{ padding: ".5rem 1rem" }}>
            TXT
          </button>
          <button className="btn-gold" onClick={exportMemoPdf} style={{ padding: ".5rem 1rem", fontSize: ".85rem" }}>
            تصدير PDF
          </button>
        </div>
      </div>

      <div className="grid-results">
        {/* نص المادة */}
        <ResultCard title="نص المادة" titleColor="#d4af37" className="col-span-2" copyText={data.text} serif large>
          {loadingArticle ? <Skeletons n={3} /> : <span>{data.text}</span>}
        </ResultCard>

        {/* التكييف القانوني */}
        <ResultCard
          title="التكييف القانوني للجريمة"
          badge="تكييف"
          badgeClass="badge-class"
          titleColor="#fcd34d"
          copyText={`النوع: ${data.classification.crime_type}\nالتصنيف: ${data.classification.category}\nالأركان:\n${data.classification.elements.map((e, i) => `${i + 1}. ${e}`).join("\n")}`}
        >
          {loadingAi ? (
            <Skeletons n={4} />
          ) : aiError ? (
            <ErrMsg msg={aiError} />
          ) : (
            <div className="stack">
              <DField label="نوع الجريمة" value={data.classification.crime_type} highlight />
              <DField label="التصنيف" value={data.classification.category} />
              {data.classification.elements.length > 0 && (
                <div>
                  <div className="d-field-lbl" style={{ marginBottom: ".4rem" }}>
                    الأركان القانونية:
                  </div>
                  <ol style={{ margin: 0, paddingRight: "1.2rem", lineHeight: 1.9, color: "#e5e7eb" }}>
                    {data.classification.elements.map((e, i) => (
                      <li key={i}>{e}</li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          )}
        </ResultCard>

        {/* العقوبة */}
        <ResultCard
          title="العقوبة والظروف"
          badge="عقوبة"
          badgeClass="badge-penalty"
          titleColor="#fca5a5"
          copyText={`الأصلية: ${data.penalty.primary}\nالتكميلية: ${data.penalty.complementary}\nالتقادم: ${data.penalty.statute_of_limitations}\nمشددة: ${data.penalty.aggravating.join("؛ ")}\nمخففة: ${data.penalty.mitigating.join("؛ ")}`}
        >
          {loadingAi ? (
            <Skeletons n={5} />
          ) : aiError ? (
            <ErrMsg msg={aiError} />
          ) : (
            <div className="stack">
              <DField label="العقوبة الأصلية" value={data.penalty.primary} highlight />
              <DField label="العقوبات التكميلية" value={data.penalty.complementary} />
              <DField label="التقادم" value={data.penalty.statute_of_limitations} />
              {data.penalty.aggravating.length > 0 && (
                <div className="penalty-box penalty-up">
                  <div className="penalty-head">ظروف مشددة</div>
                  <ul>
                    {data.penalty.aggravating.map((a, i) => (
                      <li key={i}>{a}</li>
                    ))}
                  </ul>
                </div>
              )}
              {data.penalty.mitigating.length > 0 && (
                <div className="penalty-box penalty-down">
                  <div className="penalty-head">ظروف مخففة</div>
                  <ul>
                    {data.penalty.mitigating.map((m, i) => (
                      <li key={i}>{m}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </ResultCard>

        {/* شكلية */}
        <ResultCard
          title="الدفوع الشكلية التفصيلية"
          badge="شكلية"
          badgeClass="badge-shakly"
          titleColor="#93c5fd"
          copyText={data.shakly
            .map(
              (s, i) =>
                `${i + 1}. ${s.title}\n- الأساس: ${s.basis}\n- الشروط: ${s.conditions}\n- السلطة: ${s.discretion}\n- الأثر: ${s.effect}\n- النقض: ${s.naqd_position}`
            )
            .join("\n\n")}
        >
          {loadingAi ? (
            <Skeletons n={5} />
          ) : aiError ? (
            <ErrMsg msg={aiError} />
          ) : data.shakly.length === 0 ? (
            <EmptyMsg />
          ) : (
            <div className="stack">
              {data.shakly.map((s, i) => (
                <div key={i} className="defense-item defense-shakly">
                  <div className="defense-title">
                    {i + 1}. {s.title}
                  </div>
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
        <ResultCard
          title="الدفوع الموضوعية التفصيلية"
          badge="موضوعية"
          badgeClass="badge-mawdoo"
          titleColor="#d8b4fe"
          copyText={data.mawdoo
            .map(
              (s, i) =>
                `${i + 1}. ${s.title}\n- الركن: ${s.missing_element}\n- الأدلة: ${s.evidence}\n- رد الخصم: ${s.opponent_response}\n- الصياغة: ${s.suggested_wording}`
            )
            .join("\n\n")}
        >
          {loadingAi ? (
            <Skeletons n={5} />
          ) : aiError ? (
            <ErrMsg msg={aiError} />
          ) : data.mawdoo.length === 0 ? (
            <EmptyMsg />
          ) : (
            <div className="stack">
              {data.mawdoo.map((s, i) => (
                <div key={i} className="defense-item defense-mawdoo">
                  <div className="defense-title">
                    {i + 1}. {s.title}
                  </div>
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
        <ResultCard
          title="استراتيجية الدفاع المتكاملة"
          badge="خطة"
          badgeClass="badge-strategy"
          titleColor="#5eead4"
          copyText={data.strategy.map((s, i) => `${i + 1}. ${s}`).join("\n")}
        >
          {loadingAi ? (
            <Skeletons n={5} />
          ) : aiError ? (
            <ErrMsg msg={aiError} />
          ) : data.strategy.length === 0 ? (
            <EmptyMsg />
          ) : (
            <ol className="strategy-list">
              {data.strategy.map((s, i) => (
                <li key={i} className="strategy-li">
                  <span className="strategy-num">{i + 1}</span>
                  <span>{s}</span>
                </li>
              ))}
            </ol>
          )}
        </ResultCard>

        {/* مواد ذات صلة */}
        <ResultCard
          title="مواد ذات صلة"
          badge="صلة"
          badgeClass="badge-related"
          titleColor="#a78bfa"
          copyText={data.related.map((r) => `المادة ${r.number} (${r.law}): ${r.relation}`).join("\n")}
        >
          {loadingAi ? (
            <Skeletons n={3} />
          ) : aiError ? (
            <ErrMsg msg={aiError} />
          ) : data.related.length === 0 ? (
            <EmptyMsg />
          ) : (
            <div className="stack">
              {data.related.map((r, i) => (
                <div key={i} className="defense-item" style={{ borderRight: "3px solid #a78bfa" }}>
                  <div
                    className="defense-title"
                    style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap" }}
                  >
                    <span>المادة {r.number}</span>
                    <button
                      className="chip"
                      onClick={() => {
                        setNum(r.number);
                        analyze(r.number);
                      }}
                    >
                      افتح
                    </button>
                  </div>
                  <div style={{ color: "#9ca3af", fontSize: ".8rem", marginBottom: ".3rem" }}>{r.law}</div>
                  <div>{r.relation}</div>
                </div>
              ))}
            </div>
          )}
        </ResultCard>

        {/* ثغرات */}
        <ResultCard
          title="الثغرات التشريعية ونقاط الضعف"
          badge="ثغرات"
          badgeClass="badge-thaghra"
          titleColor="#fca5a5"
          className="col-span-2"
          copyText={data.thaghra
            .map((t, i) => `${i + 1}. ${t.title}\n${t.description}\n- اقتراح: ${t.proposed_amendment}`)
            .join("\n\n")}
        >
          {loadingAi ? (
            <Skeletons n={4} />
          ) : aiError ? (
            <ErrMsg msg={aiError} />
          ) : data.thaghra.length === 0 ? (
            <EmptyMsg />
          ) : (
            <div className="stack">
              {data.thaghra.map((t, i) => (
                <div key={i} className="defense-item defense-thaghra">
                  <div className="defense-title" style={{ color: "#fca5a5" }}>
                    {i + 1}. {t.title}
                  </div>
                  <div style={{ marginBottom: ".5rem" }}>{t.description}</div>
                  {t.proposed_amendment && (
                    <div className="amend-box">
                      <div className="amend-head">اقتراح التعديل التشريعي</div>
                      <div>{t.proposed_amendment}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </ResultCard>

        {/* نقض */}
        <ResultCard
          title="مبادئ محكمة النقض الجنائي"
          badge="نقض"
          badgeClass="badge-naqd"
          titleColor="#d4af37"
          copyText={data.naqd.map((n) => `${n.ref}\n${n.text}`).join("\n\n")}
        >
          {loadingAi ? (
            <Skeletons n={3} />
          ) : aiError ? (
            <ErrMsg msg={aiError} />
          ) : data.naqd.length === 0 ? (
            <EmptyMsg label="لا توجد مبادئ نقض." />
          ) : (
            <ul className="naqd-list">
              {data.naqd.map((n, i) => (
                <li key={i} className="naqd-li">
                  <div className="naqd-ref">{n.ref}</div>
                  <div style={{ color: "#e5e7eb", lineHeight: 1.8 }}>{n.text}</div>
                  {n.source && (
                    <a href={n.source} target="_blank" rel="noreferrer" className="naqd-src">
                      المصدر
                    </a>
                  )}
                </li>
              ))}
            </ul>
          )}
        </ResultCard>

        {/* تعليقات */}
        <ResultCard
          title="تعليقات فقهية أكاديمية"
          badge="فقه"
          badgeClass="badge-ta3liq"
          titleColor="#5eead4"
          copyText={data.ta3liqat.map((t, i) => `${i + 1}. ${t.title}\n${t.content}`).join("\n\n")}
        >
          {loadingAi ? (
            <Skeletons n={4} />
          ) : aiError ? (
            <ErrMsg msg={aiError} />
          ) : data.ta3liqat.length === 0 ? (
            <EmptyMsg label="لا توجد تعليقات." />
          ) : (
            <div className="stack">
              {data.ta3liqat.map((t, i) => (
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
        <ResultCard title="مسودة مذكرة جنائية احترافية" titleColor="#d4af37" className="col-span-2" copyText={data.muzakkira}>
          {loadingAi ? (
            <Skeletons n={6} />
          ) : aiError ? (
            <ErrMsg msg={aiError} />
          ) : (
            <div className="font-serif-ar muzakkira-box">{data.muzakkira || "—"}</div>
          )}
        </ResultCard>
      </div>
    </section>
  );
}
