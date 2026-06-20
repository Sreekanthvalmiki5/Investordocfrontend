export type UserRole = 'analyst' | 'investor' | 'admin';

export interface AppUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  avatarUrl?: string;
  role: UserRole;
  plan: 'free' | 'pro' | 'enterprise';
  createdAt: string;
}

export type AiModel = 'gpt-5' | 'claude' | 'deepseek' | 'llama';

export interface ModelOption {
  id: AiModel;
  label: string;
  description: string;
  vendor: string;
}

export type MessageRole = 'user' | 'assistant' | 'system';

export interface SourceCitation {
  id: string;
  title: string;
  documentId: string;
  page: number;
  snippet?: string;
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: string;
  model?: AiModel;
  sources?: SourceCitation[];
  liked?: boolean | null;
  streaming?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  companyId?: string;
  createdAt: string;
  updatedAt: string;
  pinned?: boolean;
  archived?: boolean;
  messages: ChatMessage[];
  messageCount: number;
}

export type DocumentType =
  | 'annual_report'
  | 'quarterly_report'
  | 'investor_presentation'
  | 'earnings_call'
  | 'prospectus'
  | 'filing';

export interface DocumentItem {
  id: string;
  name: string;
  companyId: string;
  companyName: string;
  type: DocumentType;
  quarter?: string; // e.g. "Q1 FY2026"
  year: number;
  pageCount: number;
  sizeMb: number;
  uploadedAt: string;
  fileUrl: string;
  sourceUrl?: string;
  starred?: boolean;
}

export type Sector =
  | 'Technology'
  | 'Energy'
  | 'Finance'
  | 'Healthcare'
  | 'Consumer'
  | 'Industrial'
  | 'Materials';

export interface Company {
  id: string;
  name: string;
  ticker: string;
  logoUrl?: string;
  sector: Sector;
  industry: string;
  marketCapCr: number; // in crore INR
  description: string;
  latestFilingDate: string;
  totalReports: number;
  color: string; // brand accent
  metrics: FinancialMetrics;
}

export interface FinancialMetrics {
  revenue: { period: string; value: number }[];
  profit: { period: string; value: number }[];
  eps: { period: string; value: number }[];
  growth: { period: string; value: number }[];
}

export type InsightKind =
  | 'revenue_summary'
  | 'profit_summary'
  | 'key_risks'
  | 'growth_drivers'
  | 'management_commentary'
  | 'bullish_signals'
  | 'bearish_signals';

export interface AiInsight {
  id: string;
  companyId: string;
  kind: InsightKind;
  title: string;
  summary: string;
  details: string[];
  sentiment: 'positive' | 'negative' | 'neutral';
  confidence: number; // 0-1
}

export type BookmarkKind = 'message' | 'document' | 'company';

export interface Bookmark {
  id: string;
  kind: BookmarkKind;
  refId: string;
  title: string;
  subtitle?: string;
  createdAt: string;
}

export interface ChatSuggestion {
  id: string;
  prompt: string;
  companyId?: string;
}
