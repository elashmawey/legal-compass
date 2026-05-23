"use client";

import { useState } from "react";

// --- Skeleton Loader ---
export function Skeletons({ n }: { n: number }) {
  return (
    <>
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className="skeleton" style={{ width: `${60 + ((i * 13) % 35)}%` }} />
      ))}
    </>
  );
}

// --- Error Message ---
export function ErrMsg({ msg }: { msg: string }) {
  return <p style={{ color: "#fca5a5" }}>{"⚠️"} {msg}</p>;
}

// --- Empty Message ---
export function EmptyMsg({ label }: { label?: string }) {
  return <p style={{ color: "#9ca3af" }}>{label || "لا توجد بيانات."}</p>;
}

// --- Copy Button ---
export function CopyBtn({
  text,
  label,
  compact,
}: {
  text: string;
  label?: string;
  compact?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const onClick = async () => {
    try {
      await navigator.clipboard.writeText(text || "");
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* noop */
    }
  };

  return (
    <button
      onClick={onClick}
      className="chip copy-btn"
      disabled={!text}
      title="نسخ"
      style={compact ? { padding: ".2rem .55rem", fontSize: ".7rem" } : { padding: ".5rem 1rem" }}
    >
      {copied ? "✓ تم النسخ" : label || "📋 نسخ"}
    </button>
  );
}

// --- Display Field ---
export function DField({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  if (!value || !value.trim()) return null;
  return (
    <div className={`d-field${highlight ? " d-field-hl" : ""}`}>
      <span className="d-field-lbl">{label}:</span> <span>{value}</span>
    </div>
  );
}

// --- Result Card ---
export function ResultCard({
  title,
  titleColor,
  badge,
  badgeClass,
  children,
  className,
  serif,
  large,
  copyText,
}: {
  title: string;
  titleColor: string;
  badge?: string;
  badgeClass?: string;
  children: React.ReactNode;
  className?: string;
  serif?: boolean;
  large?: boolean;
  copyText?: string;
}) {
  return (
    <div
      className={`card gold-border fade-in ${className || ""}`}
      style={{ borderRadius: ".75rem", overflow: "hidden" }}
    >
      <div
        className="card-header"
        style={{ padding: ".75rem 1.25rem", display: "flex", alignItems: "center", gap: ".5rem" }}
      >
        {badge && (
          <span
            className={badgeClass}
            style={{ fontSize: ".7rem", padding: ".15rem .5rem", borderRadius: ".25rem" }}
          >
            {badge}
          </span>
        )}
        <h3 style={{ fontWeight: 700, color: titleColor, margin: 0, flex: 1 }}>{title}</h3>
        {copyText !== undefined && <CopyBtn text={copyText} compact />}
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
