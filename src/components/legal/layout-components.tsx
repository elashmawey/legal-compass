"use client";

import { OFFICIAL_SOURCES } from "./constants";

export function Header() {
  return (
    <header className="lg-header">
      <div className="container lg-header-inner">
        <div style={{ display: "flex", alignItems: "center", gap: ".75rem" }}>
          <svg className="scale-icon" width="44" height="44" viewBox="0 0 24 24" fill="#d4af37">
            <path d="M12 2L9 6h2v3H4v2h2.5l-3 7c0 1.66 2.01 3 4.5 3s4.5-1.34 4.5-3l-3-7H11V6h2l-1-4zM5.5 18l1.5-3.5L8.5 18h-3zm10 0l1.5-3.5L18.5 18h-3z" />
          </svg>
          <div>
            <h1
              className="font-serif-ar"
              style={{ fontSize: "1.4rem", fontWeight: 700, color: "#d4af37", margin: 0 }}
            >
              موسوعة قانون العقوبات المصري
            </h1>
            <p style={{ fontSize: ".75rem", color: "#9ca3af", margin: 0 }}>
              المحلل الجنائي الاحترافي — قانون رقم 58 لسنة 1937 وتعديلاته
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: ".5rem", alignItems: "center" }}>
          <span className="chip-gold" style={{ cursor: "default" }}>
            {"✦"} نسخة احترافية
          </span>
          <span className="chip" style={{ cursor: "default" }}>
            تحديثات 2025
          </span>
        </div>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="lg-footer">
      <div className="container">
        <div className="footer-sources">
          {OFFICIAL_SOURCES.map((s) => (
            <a key={s.url} href={s.url} target="_blank" rel="noreferrer" style={{ color: s.color }}>
              {s.name}
            </a>
          ))}
        </div>
        <div style={{ marginTop: ".5rem" }}>
          © {new Date().getFullYear()} موسوعة قانون العقوبات المصري — أداة استرشادية لا تغني عن الرأي
          القانوني المتخصص
        </div>
      </div>
    </footer>
  );
}

export function OfficialSources() {
  return (
    <section
      className="card gold-border"
      style={{ borderRadius: "1rem", padding: "1.5rem", marginTop: "2.5rem" }}
    >
      <h2 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#d4af37", marginBottom: "1rem" }}>
        {"🏛️"} المصادر الرسمية المصرية
      </h2>
      <div className="sources-grid">
        {OFFICIAL_SOURCES.map((s) => (
          <a
            key={s.url}
            href={s.url}
            target="_blank"
            rel="noreferrer"
            className="source-card"
            style={{ borderRightColor: s.color }}
          >
            <div className="source-name" style={{ color: s.color }}>
              {"🔗"} {s.name}
            </div>
            <div className="source-desc">{s.desc}</div>
          </a>
        ))}
      </div>
    </section>
  );
}

export function EmptyState() {
  return (
    <section style={{ textAlign: "center", padding: "5rem 0" }}>
      <div className="hero-icon">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#d4af37" strokeWidth="1.5">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
          />
        </svg>
      </div>
      <h3 style={{ fontSize: "1.35rem", fontWeight: 700, color: "#d4af37", marginBottom: ".5rem" }}>
        ابدأ بتحليل مادة من قانون العقوبات
      </h3>
      <p style={{ color: "#9ca3af", maxWidth: "36rem", margin: "0 auto", lineHeight: 1.9 }}>
        أدخل رقم المادة لتحصل على: تكييف الجريمة، العقوبة المقررة، الظروف المشددة والمخففة، الدفوع
        الشكلية والموضوعية، مبادئ النقض، المواد المرتبطة، استراتيجية دفاع كاملة، ومسودة مذكرة جنائية
        جاهزة للطباعة بصيغة PDF.
      </p>
      <div className="value-strip">
        <div className="value-pill">{"⚖️"} تكييف وعقوبة</div>
        <div className="value-pill">{"🛡️"} 10+ دفوع تفصيلية</div>
        <div className="value-pill">{"📚"} مبادئ نقض</div>
        <div className="value-pill">{"🎯"} استراتيجية دفاع</div>
        <div className="value-pill">{"📝"} مذكرة PDF</div>
      </div>
    </section>
  );
}
