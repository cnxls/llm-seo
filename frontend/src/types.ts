export interface RunSummaryData {
  name: string;
  query_count: number;
  has_analysis: boolean;
}

export interface BrandStat {
  brand: string;
  is_target: boolean;
  mentions: number;
  found_in: number;
  avg_score: number;
  wins: number;
}

export interface RunSummary {
  brands: BrandStat[];
  target: string;
  total_queries: number;
  total_completions: number;
}

export interface ProvidersData {
  providers: string[];
  mentions: number[];
  avg_scores: number[];
  wins: number[];
  found_in: number[];
}

export interface CategoriesData {
  categories: string[];
  win_rates: number[];
  total_queries: number[];
  target_wins: number[];
}

export interface BrandDetails {
  brand: string;
  is_target: boolean;
  count: number;
  found: boolean;
  score: number;
}

export interface QueryProviderData {
  brands: BrandDetails[];
  winner: string | null;
}

export interface QueryData {
  question_id: number;
  category: string;
  question: string;
  providers: Record<string, QueryProviderData>;
}

export interface ProviderResponseTokenInfo {
  input: number;
  output: number;
  total: number;
}

export interface ProviderResponse {
  text: string;
  model: string;
  tokens: ProviderResponseTokenInfo;
}

export interface QueryRawData {
  id: number;
  question: string;
  category: string;
  response: Record<string, ProviderResponse | null>;
}

export interface CompareData {
  run_a: {
    name: string;
    summary: RunSummary;
    providers: ProvidersData;
    categories: CategoriesData;
  };
  run_b: {
    name: string;
    summary: RunSummary;
    providers: ProvidersData;
    categories: CategoriesData;
  };
}

export interface PreviewQuery {
  id: number;
  query: string;
  category: string;
}

export interface PreviewResponse {
  queries: PreviewQuery[];
  total: number;
}

export interface SSEMessage {
  running: boolean;
  run_name: string;
  total: number;
  completed: number;
  current_query: string;
  error: string | null;
  cancel_requested: boolean;
}

export interface BrandsConfig {
  target: string;
  target_aliases: string[];
  competitors: string[];
  competitor_aliases: Record<string, string[]>;
}

export interface TemplatesConfig {
  metadata?: any;
  placeholders?: any;
  templates: Record<string, string[]>;
}

export interface ConfigItem {
  name: string;
  created: string;
}

export interface FullConfig {
  name: string;
  created: string;
  brands: BrandsConfig;
  templates: TemplatesConfig;
}

export interface OnboardRequest {
  brand_name: string;
  description: string;
  language: string;
}

export interface BrandEntry {
  name: string;
  aliases: string[];
}

export interface OnboardConfig {
  brand_name: string;
  description: string;
  language: string;
  placeholders: {
    category: string;
    category_noun: string;
    category_plural: string;
    use_cases: string[];
  };
  target: BrandEntry;
  competitors: BrandEntry[];
}
