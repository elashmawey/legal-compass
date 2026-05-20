import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";

export const Route = createFileRoute("/")({
  component: LegalApp,
  head: () => ({
    meta: [
      { title: "المحلل القانوني المصري | استخراج الدفوع والثغرات وأحكام النقض" },
      {
        name: "description",
        content:
          "أداة احترافية لتحليل المواد القانونية المصرية واستخراج الدفوع الشكلية والموضوعية والثغرات ومبادئ محكمة النقض وصياغة مسودة مذكرة جاهزة.",
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

const LAW_NAMES: Record<string, string> = {
  penal: "قانون العقوبات",
  criminal_proc: "قانون الإجراءات الجنائية",
  civil: "القانون المدني",
  civil_proc: "قانون المرافعات",
  personal: "قانون الأحوال الشخصية",
};

const LAW_LABEL_SHORT: Record<string, string> = {
  penal: "عقوبات",
  criminal_proc: "إجراءات",
  civil: "مدني",
  civil_proc: "مرافعات",
  personal: "أحوال شخصية",
};

const QUICK_EXAMPLES: Array<{ law: string; art: string; label: string }> = [
  { law: "penal", art: "17", label: "عقوبات 17" },
  { law: "penal", art: "234", label: "عقوبات 234" },
  { law: "criminal_proc", art: "304", label: "إجراءات 304" },
  { law: "criminal_proc", art: "206", label: "إجراءات 206" },
  { law: "civil", art: "163", label: "مدني 163" },
];

const PRESET_URLS: Array<{ law: string; url: string; label: string }> = [
  { law: "penal", url: "https://manshurat.org/node/14677", label: "عقوبات" },
  { law: "criminal_proc", url: "https://manshurat.org/node/14953", label: "إجراءات جنائية" },
  { law: "civil", url: "https://manshurat.org/node/14676", label: "مدني" },
  { law: "civil_proc", url: "https://manshurat.org/node/14674", label: "مرافعات" },
  { law: "personal", url: "https://manshurat.org/node/29447", label: "أحوال شخصية" },
];

type NaqdItem = { ref: string; text: string };
type AnalysisData = {
  text: string;
  shakly: string[];
  mawdoo: string[];
  thaghra: string[];
  naqd: NaqdItem[];
  muzakkira: string;
};

const EMPTY_ANALYSIS = (law: string, num: string): AnalysisData => ({
  text: `لم يتم العثور على المادة ${num} من ${LAW_NAMES[law]} في قاعدة البيانات المحلية. سيتم محاولة جلبها من المصدر الرسمي وتحليلها بالذكاء الاصطناعي.`,
  shakly: [],
  mawdoo: [],
  thaghra: [],
  naqd: [],
  muzakkira: "",
});

function LegalApp() {
  const [law, setLaw] = useState("penal");
  const [num, setNum] = useState("");
  const [data, setData] = useState<AnalysisData | null>(null);
  const [resultTitle, setResultTitle] = useState("");
  const [loadingArticle, setLoadingArticle] = useState(false);
  const [loadingAi, setLoadingAi] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [dbStatus, setDbStatus] = useState("جارٍ تحميل إحصاءات قاعدة البيانات...");

  // Admin panel
  const [adminOpen, setAdminOpen] = useState(false);
  const [ingestToken, setIngestToken] = useState("");
  const [ingestLaw, setIngestLaw] = useState("penal");
  const [ingestUrl, setIngestUrl] = useState("https://manshurat.org/node/14677");
  const [ingestBusy, setIngestBusy] = useState(false);
  const [ingestResult, setIngestResult] = useState("");

  const resultsRef = useRef<HTMLDivElement>(null);

  const loadStats = async () => {
    try {
      const res = await fetch("/api/public/law-stats");
      if (!res.ok) throw new Error();
      const { counts } = (await res.json()) as { counts: Record<string, number> };
      const total = Object.values(counts).reduce((a, b) => a + b, 0);
      if (total === 0) {
        setDbStatus("قاعدة البيانات فارغة. افتح لوحة الإدارة لاستيراد القوانين.");
        return;
      }
      const parts = Object.entries(counts).map(
        ([k, v]) => `${LAW_LABEL_SHORT[k] || k}: ${v}`,
      );
      setDbStatus(`📚 محفوظ: ${total} مادة (${parts.join(" • ")})`);
    } catch {
      setDbStatus("⚠️ تعذّر الاتصال بالخادم.");
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const analyze = async (lawArg?: string, numArg?: string) => {
    const lw = lawArg ?? law;
    const nm = (numArg ?? num).trim();
    if (!nm) return;

    setResultTitle(`المادة ${nm} - ${LAW_NAMES[lw]}`);
    setAiError(null);
    setLoadingArticle(true);
    setLoadingAi(true);
    setData({
      text: "جارٍ التحميل من قاعدة البيانات...",
      shakly: [],
      mawdoo: [],
      thaghra: [],
      naqd: [],
      muzakkira: "",
    });

    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);

    // 1) Official text
    let liveText: string | null = null;
    try {
      const res = await fetch(
        `/api/public/article?law=${encodeURIComponent(lw)}&num=${encodeURIComponent(nm)}`,
      );
      if (res.ok) {
        const j = (await res.json()) as { found?: boolean; article_text?: string };
        if (j.found && j.article_text) liveText = j.article_text;
      }
    } catch {
      /* offline */
    }

    const base = EMPTY_ANALYSIS(lw, nm);
    if (liveText) base.text = liveText;
    setData({ ...base });
    setLoadingArticle(false);

    // 2) AI
    try {
      const aiRes = await fetch("/api/public/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ law: lw, num: nm, text: liveText || base.text }),
      });
      const aj = await aiRes.json();
      if (!aiRes.ok || !aj.ok) {
        setAiError(aj.detail || aj.error || `HTTP ${aiRes.status}`);
        setLoadingAi(false);
        return;
      }
      const toStr = (x: unknown): string => {
        if (typeof x === "string") return x;
        if (x && typeof x === "object") {
          const o = x as Record<string, unknown>;
          return String(o.text ?? o.value ?? o.title ?? o.content ?? JSON.stringify(o));
        }
        return String(x ?? "");
      };
      const arr = (v: unknown): string[] =>
        Array.isArray(v) ? v.map(toStr).map((s) => s.trim()).filter((s) => s.length > 0) : [];
      const naqdArr: NaqdItem[] = Array.isArray(aj.naqd)
        ? aj.naqd
            .map((n: unknown): NaqdItem => {
              if (typeof n === "string") return { ref: "مبدأ مستقر - محكمة النقض المصرية", text: n };
              const o = (n || {}) as Record<string, unknown>;
              return {
                ref: String(o.ref ?? o.reference ?? o.source ?? "مبدأ مستقر - محكمة النقض المصرية").trim(),
                text: String(o.text ?? o.principle ?? o.content ?? "").trim(),
              };
            })
            .filter((n: NaqdItem) => n.text.length > 0)
        : [];
      setData({
        text: liveText || base.text,
        shakly: arr(aj.shakly),
        mawdoo: arr(aj.mawdoo),
        thaghra: arr(aj.thaghra),
        naqd: naqdArr,
        muzakkira: toStr(aj.muzakkira),
      });
    } catch (e) {
      setAiError(`خطأ شبكي: ${(e as Error).message}`);
    } finally {
      setLoadingAi(false);
    }
  };

  const runIngest = async () => {
    if (!ingestToken || !ingestUrl) {
      setIngestResult("يلزم إدخال الرمز والرابط.");
      return;
    }
    setIngestBusy(true);
    setIngestResult("⏳ جارٍ الكشط من المصدر وتحليل النصوص... قد يستغرق 30-90 ثانية.");
    try {
      const res = await fetch("/api/public/ingest-law", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-ingest-token": ingestToken },
        body: JSON.stringify({ lawType: ingestLaw, sourceUrl: ingestUrl }),
      });
      const j = await res.json();
      if (!res.ok) {
        setIngestResult(`❌ فشل (${res.status}): ${j.error || ""}\n${j.detail || j.preview || ""}`);
      } else {
        const sample = (j.sample || []).map((s: { number: string }) => `المادة ${s.number}`).join(", ");
        setIngestResult(`✅ تم استيراد ${j.count} مادة من ${LAW_LABEL_SHORT[ingestLaw]}.\nعينة: ${sample}`);
        loadStats();
      }
    } catch (e) {
      setIngestResult(`❌ خطأ شبكي: ${(e as Error).message}`);
    } finally {
      setIngestBusy(false);
    }
  };

  const buildMemoText = () => {
    if (!data) return "";
    return [
      "المحلل القانوني المصري",
      "=========================",
      resultTitle,
      `تاريخ الإصدار: ${new Date().toLocaleDateString("ar-EG")}`,
      "",
      "[نص المادة]",
      data.text,
      "",
      "[الدفوع الشكلية]",
      ...(data.shakly.length ? data.shakly.map((s) => "• " + s) : ["لا توجد."]),
      "",
      "[الدفوع الموضوعية]",
      ...(data.mawdoo.length ? data.mawdoo.map((s) => "• " + s) : ["لا توجد."]),
      "",
      "[الثغرات ونقاط الضعف]",
      ...(data.thaghra.length ? data.thaghra.map((s) => "• " + s) : ["لا توجد."]),
      "",
      "[مبادئ محكمة النقض]",
      ...(data.naqd.length
        ? data.naqd.flatMap((n) => [`— ${n.ref}`, `  ${n.text}`, ""])
        : ["لا توجد."]),
      "",
      "[مسودة المذكرة]",
      data.muzakkira || "—",
      "",
      "—",
      "أداة استرشادية لا تغني عن الرأي القانوني المتخصص.",
    ].join("\n");
  };

  const exportMemoTxt = () => {
    if (!data) return;
    const blob = new Blob([buildMemoText()], { type: "text/plain;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${resultTitle}.txt`;
    a.click();
  };

  const exportMemoPdf = () => {
    if (!data) return;
    const esc = (s: string) =>
      s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const list = (items: string[]) =>
      items.length
        ? `<ul>${items.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>`
        : `<p class="muted">لا توجد.</p>`;
    const html = `<!doctype html><html dir="rtl" lang="ar"><head><meta charset="utf-8">
<title>${esc(resultTitle)}</title>
<style>
  @page { size: A4; margin: 18mm; }
  body { font-family: 'Tajawal','Segoe UI',Tahoma,sans-serif; color:#111; line-height:1.8; }
  h1 { color:#1e3a8a; border-bottom:2px solid #d4af37; padding-bottom:.25rem; }
  h2 { color:#1e3a8a; margin-top:1.4rem; border-right:4px solid #d4af37; padding-right:.5rem; }
  .meta { color:#555; font-size:.85rem; margin-bottom:1rem; }
  .text { background:#faf7ee; border:1px solid #e6dcb8; padding:1rem; border-radius:.5rem; }
  ul { padding-right:1.25rem; }
  li { margin:.25rem 0; }
  .naqd { border-right:3px solid #d4af37; padding:.4rem .75rem; margin:.5rem 0; background:#fcfaf1; }
  .naqd .ref { color:#92651a; font-weight:700; font-size:.9rem; }
  .muzakkira { background:#f7f7fb; padding:1rem; border-right:4px solid #1e3a8a; border-radius:.5rem; white-space:pre-wrap; }
  .muted { color:#777; }
  footer { margin-top:2rem; font-size:.75rem; color:#888; border-top:1px solid #ddd; padding-top:.5rem; text-align:center; }
</style></head><body>
<h1>${esc(resultTitle)}</h1>
<div class="meta">المحلل القانوني المصري — ${new Date().toLocaleDateString("ar-EG")}</div>
<h2>نص المادة</h2>
<div class="text">${esc(data.text)}</div>
<h2>الدفوع الشكلية</h2>${list(data.shakly)}
<h2>الدفوع الموضوعية</h2>${list(data.mawdoo)}
<h2>الثغرات ونقاط الضعف</h2>${list(data.thaghra)}
<h2>مبادئ محكمة النقض</h2>
${data.naqd.length ? data.naqd.map((n) => `<div class="naqd"><div class="ref">${esc(n.ref)}</div><div>${esc(n.text)}</div></div>`).join("") : '<p class="muted">لا توجد.</p>'}
<h2>مسودة المذكرة</h2>
<div class="muzakkira">${esc(data.muzakkira || "—")}</div>
<footer>أداة استرشادية لا تغني عن الرأي القانوني المتخصص.</footer>
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
      <style>{`
        .legal-root{font-family:'Tajawal',sans-serif;background:radial-gradient(ellipse at top,#16294f 0%,#0a1428 60%);min-height:100vh;color:#f5f5f5}
        .legal-root .font-serif-ar{font-family:'Amiri',serif}
        .legal-root .gold-border{border:1px solid rgba(212,175,55,.3)}
        .legal-root .gold-glow{box-shadow:0 0 30px -10px rgba(212,175,55,.4)}
        .legal-root .card{background:linear-gradient(145deg,rgba(22,41,79,.7),rgba(15,29,58,.7));backdrop-filter:blur(10px)}
        .legal-root .card-header{background:linear-gradient(90deg,rgba(212,175,55,.15),transparent);border-bottom:1px solid rgba(212,175,55,.25)}
        .legal-root select,.legal-root input,.legal-root textarea{background:rgba(10,20,40,.6);color:#fff;border:1px solid rgba(212,175,55,.3);border-radius:.5rem;padding:.6rem .9rem;width:100%;font:inherit}
        .legal-root select:focus,.legal-root input:focus,.legal-root textarea:focus{outline:none;border-color:#d4af37;box-shadow:0 0 0 3px rgba(212,175,55,.2)}
        .legal-root .btn-gold{background:linear-gradient(to left,#b8901f,#d4af37);color:#0a1428;font-weight:700;padding:.75rem 1rem;border-radius:.5rem;cursor:pointer;border:0;transition:filter .15s}
        .legal-root .btn-gold:hover{filter:brightness(1.1)}
        .legal-root .btn-gold:disabled{opacity:.6;cursor:not-allowed}
        .legal-root .chip{padding:.25rem .75rem;border-radius:9999px;border:1px solid rgba(212,175,55,.3);font-size:.75rem;cursor:pointer;background:transparent;color:#f5f5f5;transition:background .15s}
        .legal-root .chip:hover{background:rgba(212,175,55,.1)}
        .legal-root .badge-shakly{background:rgba(59,130,246,.15);color:#93c5fd;border:1px solid rgba(59,130,246,.4)}
        .legal-root .badge-mawdoo{background:rgba(168,85,247,.15);color:#d8b4fe;border:1px solid rgba(168,85,247,.4)}
        .legal-root .badge-thaghra{background:rgba(239,68,68,.15);color:#fca5a5;border:1px solid rgba(239,68,68,.4)}
        .legal-root .badge-naqd{background:rgba(212,175,55,.15);color:#fcd34d;border:1px solid rgba(212,175,55,.4)}
        .legal-root .scale-icon{filter:drop-shadow(0 0 8px rgba(212,175,55,.5))}
        @keyframes legalFadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        .legal-root .fade-in{animation:legalFadeIn .4s ease-out}
        .legal-root a{color:#d4af37}
        .legal-root .container{max-width:80rem;margin:0 auto;padding:0 1.5rem}
        .legal-root .grid-12{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:.75rem}
        .legal-root .grid-results{display:grid;grid-template-columns:1fr;gap:1.25rem}
        @media (min-width:1024px){.legal-root .grid-results{grid-template-columns:repeat(2,1fr)}.legal-root .col-span-2{grid-column:span 2}}
        @media (max-width:768px){.legal-root .grid-12 > *{grid-column:span 12 !important}}
        .legal-root .col-4{grid-column:span 4}
        .legal-root .col-3{grid-column:span 3}
        .legal-root .col-5{grid-column:span 5}
        .legal-root .skeleton{background:linear-gradient(90deg,rgba(255,255,255,.05),rgba(255,255,255,.12),rgba(255,255,255,.05));background-size:200% 100%;animation:shimmer 1.4s infinite;border-radius:.4rem;height:1rem;margin:.4rem 0}
        @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
        .legal-root ul.bullets{list-style:disc;padding-right:1.25rem;margin:0}
        .legal-root ul.bullets li{margin:.4rem 0;line-height:1.8}
      `}</style>

      {/* HEADER */}
      <header
        style={{
          borderBottom: "1px solid rgba(212,175,55,.3)",
          background: "rgba(10,20,40,.8)",
          backdropFilter: "blur(8px)",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        <div className="container" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem 1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: ".75rem" }}>
            <svg className="scale-icon" width="40" height="40" viewBox="0 0 24 24" fill="#d4af37">
              <path d="M12 2L9 6h2v3H4v2h2.5l-3 7c0 1.66 2.01 3 4.5 3s4.5-1.34 4.5-3l-3-7H11V11h7v-2h-7V6h2l-1-4zM5.5 18l1.5-3.5L8.5 18h-3zm10 0l1.5-3.5L18.5 18h-3zm5.5-7h-2.5l3 7c0 1.66-2.01 3-4.5 3s-4.5-1.34-4.5-3l3-7" />
            </svg>
            <div>
              <h1 className="font-serif-ar" style={{ fontSize: "1.4rem", fontWeight: 700, color: "#d4af37", margin: 0 }}>
                المحلل القانوني المصري
              </h1>
              <p style={{ fontSize: ".75rem", color: "#9ca3af", margin: 0 }}>
                منصة استخراج الدفوع والثغرات وأحكام النقض
              </p>
            </div>
          </div>
          <span className="chip" style={{ cursor: "default" }}>تحديثات 2024 / 2025</span>
        </div>
      </header>

      <main className="container" style={{ padding: "2rem 1.5rem" }}>
        {/* SEARCH PANEL */}
        <section className="card gold-border gold-glow" style={{ borderRadius: "1rem", padding: "1.5rem", marginBottom: "2rem" }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#d4af37", marginBottom: "1rem" }}>
            🔍 محرك البحث القانوني
          </h2>
          <div className="grid-12">
            <div className="col-4">
              <label style={{ fontSize: ".85rem", color: "#d1d5db", display: "block", marginBottom: ".25rem" }}>فرع القانون</label>
              <select value={law} onChange={(e) => setLaw(e.target.value)}>
                {Object.entries(LAW_NAMES).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div className="col-4">
              <label style={{ fontSize: ".85rem", color: "#d1d5db", display: "block", marginBottom: ".25rem" }}>رقم المادة</label>
              <input
                type="text"
                placeholder="مثال: 304 أو 17"
                value={num}
                onChange={(e) => setNum(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") analyze(); }}
              />
            </div>
            <div className="col-4" style={{ display: "flex", alignItems: "flex-end" }}>
              <button className="btn-gold gold-glow" style={{ width: "100%" }} onClick={() => analyze()}>
                تحليل المادة
              </button>
            </div>
          </div>
          <div style={{ marginTop: "1rem", display: "flex", flexWrap: "wrap", gap: ".5rem", alignItems: "center" }}>
            <span style={{ fontSize: ".75rem", color: "#9ca3af" }}>أمثلة سريعة:</span>
            {QUICK_EXAMPLES.map((q) => (
              <button
                key={q.label}
                className="chip"
                onClick={() => { setLaw(q.law); setNum(q.art); analyze(q.law, q.art); }}
              >
                {q.label}
              </button>
            ))}
          </div>
          <div style={{ marginTop: ".75rem", fontSize: ".75rem", color: "#9ca3af" }}>{dbStatus}</div>
        </section>

        {/* ADMIN PANEL */}
        <section className="card gold-border" style={{ borderRadius: "1rem", padding: "1.5rem", marginBottom: "2rem" }}>
          <button
            onClick={() => setAdminOpen((v) => !v)}
            style={{ background: "transparent", border: 0, color: "#d4af37", fontWeight: 700, cursor: "pointer", fontSize: "1rem" }}
          >
            ⚙️ لوحة الإدارة - استيراد قانون كامل (Firecrawl) {adminOpen ? "▲" : "▼"}
          </button>
          {adminOpen && (
            <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: ".75rem", fontSize: ".9rem" }}>
              <p style={{ color: "#d1d5db", lineHeight: 1.8, margin: 0 }}>
                أدخل رمز الاستيراد السرّي (INGEST_TOKEN) ثم اختر القانون. سيتم جلب نصوصه كاملة من المصدر الرسمي وتخزينها في قاعدة بيانات Lovable Cloud.
              </p>
              <div className="grid-12">
                <input className="col-4" type="password" placeholder="رمز الاستيراد السرّي" value={ingestToken} onChange={(e) => setIngestToken(e.target.value)} />
                <select className="col-3" value={ingestLaw} onChange={(e) => setIngestLaw(e.target.value)}>
                  {Object.entries(LAW_NAMES).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
                <input className="col-5" type="url" placeholder="رابط المصدر" value={ingestUrl} onChange={(e) => setIngestUrl(e.target.value)} />
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: ".5rem" }}>
                {PRESET_URLS.map((p) => (
                  <button key={p.label} className="chip" onClick={() => { setIngestLaw(p.law); setIngestUrl(p.url); }}>
                    {p.label}
                  </button>
                ))}
              </div>
              <div>
                <button className="btn-gold" disabled={ingestBusy} onClick={runIngest}>
                  {ingestBusy ? "جارٍ الاستيراد..." : "بدء الاستيراد"}
                </button>
              </div>
              {ingestResult && (
                <pre style={{ color: "#d1d5db", whiteSpace: "pre-wrap", fontFamily: "inherit", margin: 0 }}>{ingestResult}</pre>
              )}
            </div>
          )}
        </section>

        {/* RESULTS */}
        {showResults ? (
          <section ref={resultsRef}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem", flexWrap: "wrap", gap: ".5rem" }}>
              <h2 className="font-serif-ar" style={{ fontSize: "1.5rem", fontWeight: 700, color: "#d4af37", margin: 0 }}>
                {resultTitle}
              </h2>
              <button className="chip" onClick={exportMemo} style={{ padding: ".5rem 1rem" }}>
                ⬇ تحميل المذكرة
              </button>
            </div>

            <div className="grid-results">
              <ResultCard title="📜 نص المادة" titleColor="#d4af37" className="col-span-2" serif large>
                {loadingArticle ? <Skeletons n={3} /> : <span>{data!.text}</span>}
              </ResultCard>

              <ResultCard title="الدفوع الشكلية" badge="شكلية" badgeClass="badge-shakly" titleColor="#93c5fd">
                <BulletList items={data!.shakly} loading={loadingAi} error={aiError} />
              </ResultCard>

              <ResultCard title="الدفوع الموضوعية" badge="موضوعية" badgeClass="badge-mawdoo" titleColor="#d8b4fe">
                <BulletList items={data!.mawdoo} loading={loadingAi} error={aiError} />
              </ResultCard>

              <ResultCard title="الثغرات ونقاط الضعف" badge="ثغرات" badgeClass="badge-thaghra" titleColor="#fca5a5">
                <BulletList items={data!.thaghra} loading={loadingAi} error={aiError} />
              </ResultCard>

              <ResultCard title="مبادئ محكمة النقض" badge="نقض" badgeClass="badge-naqd" titleColor="#d4af37">
                {loadingAi ? (
                  <Skeletons n={3} />
                ) : aiError ? (
                  <p style={{ color: "#fca5a5" }}>⚠️ {aiError}</p>
                ) : data!.naqd.length === 0 ? (
                  <p style={{ color: "#9ca3af" }}>لا توجد مبادئ نقض متاحة.</p>
                ) : (
                  <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: ".75rem" }}>
                    {data!.naqd.map((n, i) => (
                      <li key={i} style={{ borderRight: "3px solid #d4af37", paddingRight: ".75rem" }}>
                        <div style={{ color: "#fcd34d", fontWeight: 700, fontSize: ".85rem", marginBottom: ".25rem" }}>{n.ref}</div>
                        <div style={{ color: "#e5e7eb", lineHeight: 1.8 }}>{n.text}</div>
                      </li>
                    ))}
                  </ul>
                )}
              </ResultCard>

              <ResultCard title="✍️ مسودة مذكرة قانونية جاهزة للاقتباس" titleColor="#d4af37" className="col-span-2">
                {loadingAi ? (
                  <Skeletons n={6} />
                ) : aiError ? (
                  <p style={{ color: "#fca5a5" }}>⚠️ {aiError}</p>
                ) : (
                  <div
                    className="font-serif-ar"
                    style={{
                      background: "rgba(10,20,40,.4)",
                      borderRight: "4px solid #d4af37",
                      padding: "1.25rem",
                      borderRadius: ".5rem",
                      lineHeight: 2,
                      fontSize: "1.05rem",
                      color: "#f3f4f6",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {data!.muzakkira || "—"}
                  </div>
                )}
              </ResultCard>
            </div>
          </section>
        ) : (
          <section style={{ textAlign: "center", padding: "5rem 0" }}>
            <div
              style={{
                display: "inline-flex",
                padding: "1.5rem",
                borderRadius: "9999px",
                background: "rgba(212,175,55,.1)",
                border: "1px solid rgba(212,175,55,.3)",
                marginBottom: "1rem",
              }}
            >
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#d4af37" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#d4af37", marginBottom: ".5rem" }}>
              ابدأ بتحليل مادة قانونية
            </h3>
            <p style={{ color: "#9ca3af", maxWidth: "32rem", margin: "0 auto", lineHeight: 1.8 }}>
              اختر فرع القانون وأدخل رقم المادة لاستخراج النص الأصلي، الدفوع الشكلية والموضوعية، الثغرات الإجرائية، ومبادئ النقض مع مسودة مذكرة جاهزة.
            </p>
          </section>
        )}
      </main>

      <footer
        style={{
          borderTop: "1px solid rgba(212,175,55,.2)",
          marginTop: "3rem",
          padding: "1.5rem",
          textAlign: "center",
          fontSize: ".75rem",
          color: "#6b7280",
        }}
      >
        © 2025 المحلل القانوني المصري — أداة استرشادية لا تغني عن الرأي القانوني المتخصص
      </footer>
    </div>
  );
}

function ResultCard({
  title,
  titleColor,
  badge,
  badgeClass,
  children,
  className,
  serif,
  large,
}: {
  title: string;
  titleColor: string;
  badge?: string;
  badgeClass?: string;
  children: React.ReactNode;
  className?: string;
  serif?: boolean;
  large?: boolean;
}) {
  return (
    <div className={`card gold-border fade-in ${className || ""}`} style={{ borderRadius: ".75rem", overflow: "hidden" }}>
      <div className="card-header" style={{ padding: ".75rem 1.25rem", display: "flex", alignItems: "center", gap: ".5rem" }}>
        {badge && <span className={badgeClass} style={{ fontSize: ".7rem", padding: ".15rem .5rem", borderRadius: ".25rem" }}>{badge}</span>}
        <h3 style={{ fontWeight: 700, color: titleColor, margin: 0 }}>{title}</h3>
      </div>
      <div
        className={serif ? "font-serif-ar" : ""}
        style={{
          padding: "1.25rem",
          color: "#e5e7eb",
          lineHeight: large ? 2 : 1.8,
          fontSize: large ? "1.1rem" : "1rem",
        }}
      >
        {children}
      </div>
    </div>
  );
}

function BulletList({ items, loading, error }: { items: string[]; loading: boolean; error: string | null }) {
  if (loading) return <Skeletons n={4} />;
  if (error) return <p style={{ color: "#fca5a5" }}>⚠️ {error}</p>;
  if (!items.length) return <p style={{ color: "#9ca3af" }}>لا توجد بيانات.</p>;
  return (
    <ul className="bullets">
      {items.map((s, i) => <li key={i}>{s}</li>)}
    </ul>
  );
}

function Skeletons({ n }: { n: number }) {
  return (
    <>
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className="skeleton" style={{ width: `${60 + ((i * 13) % 35)}%` }} />
      ))}
    </>
  );
}
