// Utility functions for the Legal Analysis App

import type {
  Classification,
  Penalty,
  ShaklyItem,
  MawdooItem,
  ThaghraItem,
  NaqdItem,
  RelatedItem,
  Ta3liqItem,
  HistItem,
} from "./types";
import { HISTORY_KEY } from "./constants";

// --- Normalizers ---
export const toStr = (x: unknown): string => {
  if (x == null) return "";
  if (typeof x === "string") return x;
  if (typeof x === "object") {
    const o = x as Record<string, unknown>;
    return String(o.text ?? o.value ?? o.title ?? o.content ?? JSON.stringify(o));
  }
  return String(x);
};

export const obj = (x: unknown): Record<string, unknown> =>
  x && typeof x === "object" ? (x as Record<string, unknown>) : {};

export const arr = (x: unknown): string[] =>
  Array.isArray(x)
    ? x
        .map(toStr)
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

export function normClassification(v: unknown): Classification {
  const o = obj(v);
  return {
    crime_type: toStr(o.crime_type),
    category: toStr(o.category),
    elements: arr(o.elements),
  };
}

export function normPenalty(v: unknown): Penalty {
  const o = obj(v);
  return {
    primary: toStr(o.primary),
    complementary: toStr(o.complementary),
    aggravating: arr(o.aggravating),
    mitigating: arr(o.mitigating),
    statute_of_limitations: toStr(o.statute_of_limitations ?? o.limitations),
  };
}

export function normShakly(v: unknown): ShaklyItem[] {
  if (!Array.isArray(v)) return [];
  return v
    .map((it) => {
      if (typeof it === "string")
        return { title: it, basis: "", conditions: "", discretion: "", effect: "", naqd_position: "" };
      const o = obj(it);
      return {
        title: toStr(o.title ?? "دفع شكلي"),
        basis: toStr(o.basis ?? o.legal_basis),
        conditions: toStr(o.conditions),
        discretion: toStr(o.discretion),
        effect: toStr(o.effect),
        naqd_position: toStr(o.naqd_position ?? o.naqd),
      };
    })
    .filter((x) => x.title.trim().length > 0);
}

export function normMawdoo(v: unknown): MawdooItem[] {
  if (!Array.isArray(v)) return [];
  return v
    .map((it) => {
      if (typeof it === "string")
        return { title: it, missing_element: "", evidence: "", opponent_response: "", suggested_wording: "" };
      const o = obj(it);
      return {
        title: toStr(o.title ?? "دفع موضوعي"),
        missing_element: toStr(o.missing_element),
        evidence: toStr(o.evidence),
        opponent_response: toStr(o.opponent_response),
        suggested_wording: toStr(o.suggested_wording),
      };
    })
    .filter((x) => x.title.trim().length > 0);
}

export function normThaghra(v: unknown): ThaghraItem[] {
  if (!Array.isArray(v)) return [];
  return v
    .map((it) => {
      if (typeof it === "string") return { title: it, description: "", proposed_amendment: "" };
      const o = obj(it);
      return {
        title: toStr(o.title ?? "ثغرة"),
        description: toStr(o.description),
        proposed_amendment: toStr(o.proposed_amendment ?? o.amendment),
      };
    })
    .filter((x) => x.title.trim() || x.description.trim());
}

export function normNaqd(v: unknown): NaqdItem[] {
  if (!Array.isArray(v)) return [];
  return v
    .map((it) => {
      if (typeof it === "string") return { ref: "مبدأ مستقر - محكمة النقض المصرية", text: it };
      const o = obj(it);
      return {
        ref: toStr(o.ref ?? "مبدأ مستقر - محكمة النقض المصرية").trim(),
        text: toStr(o.text ?? o.principle).trim(),
        source: toStr(o.source_link ?? o.url ?? o.link ?? "").trim() || undefined,
      };
    })
    .filter((n) => n.text.length > 0);
}

export function normRelated(v: unknown): RelatedItem[] {
  if (!Array.isArray(v)) return [];
  return v
    .map((it) => {
      const o = obj(it);
      return {
        number: toStr(o.number ?? o.article ?? "").trim(),
        law: toStr(o.law ?? "قانون العقوبات").trim(),
        relation: toStr(o.relation ?? o.reason ?? o.note).trim(),
      };
    })
    .filter((r) => r.number.length > 0);
}

export function normTa3liqat(v: unknown): Ta3liqItem[] {
  if (!Array.isArray(v)) return [];
  return v
    .map((it) => {
      if (typeof it === "string") return { title: "تعليق", content: it };
      const o = obj(it);
      return {
        title: toStr(o.title ?? "تعليق"),
        content: toStr(o.content ?? o.text),
        category: toStr(o.category ?? "") || undefined,
      };
    })
    .filter((x) => x.content.trim().length > 0);
}

// --- History Management ---
export const readHistory = (): HistItem[] => {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
  } catch {
    return [];
  }
};

export const pushHistory = (h: HistItem) => {
  try {
    const list = readHistory().filter((x) => x.num !== h.num);
    list.unshift(h);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(list.slice(0, 20)));
  } catch {
    /* noop */
  }
};
