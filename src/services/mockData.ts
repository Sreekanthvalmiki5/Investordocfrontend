import type {
  AiInsight,
  Bookmark,
  ChatSuggestion,
  Company,
  Conversation,
  DocumentItem,
  ModelOption,
  AdminDocument,
} from '@/types';

export const MODELS: ModelOption[] = [
  { id: 'gpt-5', label: 'GPT-5', description: 'OpenAI flagship multimodal', vendor: 'OpenAI' },
  { id: 'claude', label: 'Claude', description: 'Anthropic Sonnet — long context', vendor: 'Anthropic' },
  { id: 'deepseek', label: 'DeepSeek', description: 'Cost-efficient reasoning', vendor: 'DeepSeek' },
  { id: 'llama', label: 'Llama', description: 'Open weights, self-hostable', vendor: 'Meta' },
];

export const COMPANIES: Company[] = [
  
];

export const DOCUMENTS: DocumentItem[] = [
  
];

function makeConversation(
  id: string,
  title: string,
  companyId: string,
  minutesAgo: number,
  messages: Conversation['messages']
): Conversation {
  const createdAt = new Date(Date.now() - minutesAgo * 60 * 1000).toISOString();
  return {
    id,
    title,
    companyId,
    createdAt,
    updatedAt: createdAt,
    messages,
    messageCount: messages.length,
    pinned: false,
    archived: false,
  };
}

export const CONVERSATIONS: Conversation[] = [
  makeConversation('conv_1', 'Infosys Q4 revenue analysis', 'c_infy', 30, []),
  makeConversation('conv_2', 'TCS vs Infosys margin comparison', 'c_tcs', 120, []),
  makeConversation('conv_3', 'Banking sector outlook FY26', 'c_hdfc', 240, []),
  makeConversation('conv_4', 'Reliance Jio subscriber growth', 'c_reliance', 480, []),
];

export const INSIGHTS: AiInsight[] = [
  {
    id: 'ins_1',
    companyId: 'c_infy',
    kind: 'revenue_summary',
    title: 'Revenue Growth Trajectory',
    summary: 'Infosys has shown consistent sequential revenue growth of 2-3% over the last four quarters.',
    details: [
      'Q4 FY25 revenue grew 1.3% QoQ to Rs 42,308 Cr',
      'Full year revenue grew 8.1% YoY in constant currency',
      'Digital revenue now constitutes 62% of total revenue',
    ],
    sentiment: 'positive',
    confidence: 0.92,
  },
  {
    id: 'ins_2',
    companyId: 'c_tcs',
    kind: 'profit_summary',
    title: 'Margin Resilience',
    summary: 'TCS maintained industry-leading margins above 24% despite wage inflation pressures.',
    details: [
      'Operating margin remained stable at 24.5%',
      'Strong cost optimisation offset wage hikes',
      'Subsidiaries showed improved profitability',
    ],
    sentiment: 'positive',
    confidence: 0.88,
  },
  {
    id: 'ins_3',
    companyId: 'c_reliance',
    kind: 'key_risks',
    title: 'Regulatory & Market Risks',
    summary: 'Reliance faces regulatory headwinds in telecom sector and volatility in refining margins.',
    details: [
      'Potential spectrum auction costs in FY26',
      'Global refining margin compression',
      'Retail business facing increased competition',
    ],
    sentiment: 'negative',
    confidence: 0.75,
  },
  {
    id: 'ins_4',
    companyId: 'c_hdfc',
    kind: 'growth_drivers',
    title: 'Loan Growth Momentum',
    summary: 'HDFC Bank continues to outpace industry loan growth with strong retail focus.',
    details: [
      'Retail loan growth of 18% YoY',
      'CASA ratio improved to 38.5%',
      'Asset quality remains best-in-class with GNPA at 1.12%',
    ],
    sentiment: 'positive',
    confidence: 0.95,
  },
];

export const SUGGESTIONS: ChatSuggestion[] = [
  { id: 's_1', prompt: 'Show me the latest quarterly results for Infosys', companyId: 'c_infy' },
  { id: 's_2', prompt: 'Compare revenue growth of TCS and Infosys over last 4 quarters' },
  { id: 's_3', prompt: 'What are the key risks mentioned in Reliance annual report?' },
  { id: 's_4', prompt: 'Summarize HDFC Banks Q4 performance and outlook' },
  { id: 's_5', prompt: 'Show me the earnings call transcript for ICICI Bank' },
];

export const BOOKMARKS: Bookmark[] = [
  {
    id: 'bm_1',
    kind: 'document',
    refId: 'd_001',
    title: 'Infosys Annual Report FY25',
    subtitle: 'Annual Report',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'bm_2',
    kind: 'document',
    refId: 'd_003',
    title: 'Reliance Q3 Investor Presentation',
    subtitle: 'Investor Presentation',
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: 'bm_3',
    kind: 'company',
    refId: 'c_tcs',
    title: 'Tata Consultancy Services',
    subtitle: 'Technology - IT Services',
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
  },
];

export function formatCurrencyCr(value: number): string {
  if (value >= 100000) return `₹${(value / 100000).toFixed(2)}L Cr`;
  return `₹${value.toLocaleString('en-IN')} Cr`;
}

// Admin mock data
export const ADMIN_DOCUMENTS: AdminDocument[] = [
  
];
