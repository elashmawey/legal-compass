// Constants for the Legal Analysis App

export const LAW = "penal";
export const LAW_NAME = "قانون العقوبات المصري";
export const HISTORY_KEY = "penal_history_v1";

export const QUICK_EXAMPLES: Array<{ art: string; label: string; note: string }> = [
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

export const OFFICIAL_SOURCES: Array<{ name: string; url: string; desc: string; color: string }> = [
  { name: "منشورات قانونية", url: "https://manshurat.org", desc: "نص قانون العقوبات الكامل", color: "#60a5fa" },
  { name: "محكمة النقض المصرية", url: "https://www.cc.gov.eg", desc: "أحكام ومبادئ النقض الجنائي", color: "#fb7185" },
  { name: "وزارة العدل المصرية", url: "https://moj.gov.eg", desc: "البوابة الرسمية للوزارة", color: "#34d399" },
  { name: "المحكمة الدستورية العليا", url: "https://www.sccourt.gov.eg", desc: "الأحكام الدستورية", color: "#f472b6" },
  { name: "الجريدة الرسمية", url: "https://www.idsc.gov.eg", desc: "نشر التشريعات الجنائية", color: "#fbbf24" },
  { name: "بوابة التشريعات المصرية", url: "https://www.egypt.gov.eg", desc: "البوابة الحكومية", color: "#a78bfa" },
];
