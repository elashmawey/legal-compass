// Types for the Legal Analysis App

export type ShaklyItem = {
  title: string;
  basis: string;
  conditions: string;
  discretion: string;
  effect: string;
  naqd_position: string;
};

export type MawdooItem = {
  title: string;
  missing_element: string;
  evidence: string;
  opponent_response: string;
  suggested_wording: string;
};

export type ThaghraItem = {
  title: string;
  description: string;
  proposed_amendment: string;
};

export type NaqdItem = {
  ref: string;
  text: string;
  source?: string;
};

export type Ta3liqItem = {
  title: string;
  content: string;
  category?: string;
};

export type RelatedItem = {
  number: string;
  law: string;
  relation: string;
};

export type Classification = {
  crime_type: string;
  category: string;
  elements: string[];
};

export type Penalty = {
  primary: string;
  complementary: string;
  aggravating: string[];
  mitigating: string[];
  statute_of_limitations: string;
};

export type AnalysisData = {
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

export type ClassifyResult = {
  summary: string;
  suggested_articles: Array<{
    number: string;
    title: string;
    reason: string;
    confidence: string;
  }>;
  warnings: string[];
  next_steps: string[];
};

export type HistItem = {
  num: string;
  title: string;
  at: number;
};

export const EMPTY_ANALYSIS: AnalysisData = {
  text: "",
  classification: { crime_type: "", category: "", elements: [] },
  penalty: {
    primary: "",
    complementary: "",
    aggravating: [],
    mitigating: [],
    statute_of_limitations: "",
  },
  shakly: [],
  mawdoo: [],
  thaghra: [],
  naqd: [],
  related: [],
  strategy: [],
  ta3liqat: [],
  muzakkira: "",
};
