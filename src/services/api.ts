import axios from 'axios';
import {
  BOOKMARKS,
  COMPANIES,
  DOCUMENTS,
  INSIGHTS,
  MODELS,
  SUGGESTIONS,
} from './mockData';
import type {
  AiInsight,
  AiModel,
  AppUser,
  Bookmark,
  ChatMessage,
  Company,
  Conversation,
  DocumentItem,
  ModelOption,
} from '@/types';

// ─── HTTP client ─────────────────────────────────────────────────────────────

export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

export const httpClient = axios.create({
  baseURL: API_URL,
  timeout: 30000,
});

httpClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('idf_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─── Auth service ─────────────────────────────────────────────────────────────
// Hits POST /api/auth/login (or /api/auth/register) and stores the JWT.
// Falls back to a local demo user if the endpoint returns a 404 (dev mode).

export const authService = {
  async getCurrentUser(): Promise<AppUser | null> {
    const raw = localStorage.getItem('idf_user');
    if (!raw) return null;
    return JSON.parse(raw) as AppUser;
  },

  async signInWithPassword(email: string, password: string): Promise<AppUser> {
    try {
      const { data } = await httpClient.post('/api/auth/login', { email, password });
      const payload = data.data ?? data;
      const user: AppUser = mapApiUser(payload.user ?? payload);
      const token: string = payload.access_token ?? payload.token ?? '';
      localStorage.setItem('idf_user', JSON.stringify(user));
      if (token) localStorage.setItem('idf_token', token);
      return user;
    } catch (err: any) {
      // If server responded with a non-404 error (e.g. 401 Unauthorized), propagate it
      if (err.response && err.response.status !== 404) {
        throw new Error(
          err.response.data?.detail ||
          err.response.data?.message ||
          'Invalid email or password'
        );
      }
      // Fallback: build a local demo user so the UI still works without auth backend (e.g. server down or returns 404)
      return _demoSignIn(email);
    }
  },

  async signUpWithEmail(email: string, password: string, firstName: string, lastName: string): Promise<AppUser> {
    try {
      const { data } = await httpClient.post('/api/auth/register', {
        email,
        password,
        first_name: firstName,
        last_name: lastName,
      });
      const payload = data.data ?? data;
      const user: AppUser = mapApiUser(payload.user ?? payload);
      const token: string = payload.access_token ?? payload.token ?? '';
      localStorage.setItem('idf_user', JSON.stringify(user));
      if (token) localStorage.setItem('idf_token', token);
      return user;
    } catch(err:any) {
      throw new Error(
        err.response?.data?.detail ||
        "Registration failed"
      );
    }
  },

  async signInWithGoogle(): Promise<AppUser> {
    // Redirect-based OAuth — for now fall back to demo user.
    return _demoSignIn('demo@investor.ai', 'Demo', 'Investor');
  },

  async requestPasswordReset(email: string): Promise<void> {
    try {
      await httpClient.post('/api/auth/forgot-password', { email });
    } catch {
      console.info('Password reset requested for', email);
    }
  },
        async resetPassword(
            token: string,
            password: string,
        ): Promise<void> {
          console.log("Sending token:", token);

            await httpClient.post(
                "/api/auth/reset-password",
                {
                    token,
                    password,
                }
            );
        },

  async signOut(): Promise<void> {
    try { await httpClient.post('/api/auth/logout'); } catch { /* ignore */ }
    localStorage.removeItem('idf_user');
    localStorage.removeItem('idf_token');
  },

  async updateProfile(patch: Partial<AppUser>): Promise<AppUser> {
    try {
      const { data } = await httpClient.patch('/api/auth/profile', toSnakeCase(patch));
      const user = mapApiUser(data);
      localStorage.setItem('idf_user', JSON.stringify(user));
      return user;
    } catch {
      const raw = localStorage.getItem('idf_user');
      if (!raw) throw new Error('Not authenticated');
      const user = { ...JSON.parse(raw) as AppUser, ...patch };
      user.fullName = `${user.firstName} ${user.lastName}`;
      localStorage.setItem('idf_user', JSON.stringify(user));
      return user;
    }
  },
};

// ─── Conversation service ─────────────────────────────────────────────────────

export const chatService = {
  async listConversations(): Promise<Conversation[]> {
    try {
      const { data } = await httpClient.get<ApiConversation[]>('/api/conversations');
      return data.map(mapApiConversation);
    } catch {
      return [];
    }
  },

  async createConversation(title: string): Promise<Conversation> {
    const { data } = await httpClient.post<ApiConversation>('/api/conversations', { title });
    return mapApiConversation(data);
  },

  async updateConversation(id: string, patch: { title?: string }): Promise<Conversation> {
    const { data } = await httpClient.patch<ApiConversation>(`/api/conversations/${id}`, patch);
    return mapApiConversation(data);
  },

  async deleteConversation(id: string): Promise<void> {
    await httpClient.delete(`/api/conversations/${id}`);
  },

  async getMessages(conversationId: string): Promise<ChatMessage[]> {
    try {
      const { data } = await httpClient.get<ApiMessage[]>(
        `/api/conversations/${conversationId}/messages`
      );
      return data.map(mapApiMessage);
    } catch {
      return [];
    }
  },

  async deleteMessage(msgId: string): Promise<void> {
    await httpClient.delete(`/api/conversations/${msgId}`);
  },

  models: MODELS as ModelOption[],
  suggestions: SUGGESTIONS,

  // Streams an SSE response from POST /api/conversations/{id}/messages.
  // Falls back to a token-by-token mock if the server doesn't support SSE.
  async *streamResponse(
    prompt: string,
    model: AiModel,
    companyId?: string,
    conversationId?: string,
  ): AsyncGenerator<{ delta: string; done: boolean; sources?: ChatMessage['sources'] }> {
    if (!conversationId) {
      yield* _mockStream(prompt, companyId);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(localStorage.getItem('idf_token')
            ? { Authorization: `Bearer ${localStorage.getItem('idf_token')}` }
            : {}),
        },
        body: JSON.stringify({ content: prompt, model, company_id: companyId }),
      });

      if (!response.ok || !response.body) {
        yield* _mockStream(prompt, companyId);
        return;
      }

      const contentType = response.headers.get('content-type') ?? '';

      if (contentType.includes('text/event-stream')) {
        // SSE streaming
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let sources: ChatMessage['sources'] | undefined;

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';
          for (const line of lines) {
            if (!line.startsWith('data:')) continue;
            const raw = line.slice(5).trim();
            if (raw === '[DONE]') { yield { delta: '', done: true, sources }; return; }
            try {
              const json = JSON.parse(raw);
              if (json.delta) yield { delta: json.delta, done: false };
              if (json.sources) sources = json.sources;
            } catch { /* skip malformed */ }
          }
        }
        yield { delta: '', done: true, sources };
      } else {
        // Plain JSON response — yield full text at once
        const json = await response.json();
        const text: string = json.content ?? json.message ?? json.response ?? '';
        const tokens = text.split(/(\s+)/);
        for (const token of tokens) {
          await new Promise((r) => setTimeout(r, 18 + Math.random() * 22));
          yield { delta: token, done: false };
        }
        yield { delta: '', done: true, sources: json.sources };
      }
    } catch {
      yield* _mockStream(prompt, companyId);
    }
  },
};

// ─── Bookmark service ─────────────────────────────────────────────────────────

export const bookmarkService = {
  async list(): Promise<Bookmark[]> {
    try {
      const { data } = await httpClient.get<ApiBookmark[]>('/api/bookmarks');
      return data.map(mapApiBookmark);
    } catch {
      return BOOKMARKS;
    }
  },

  async toggle(bookmark: Omit<Bookmark, 'id' | 'createdAt'>): Promise<Bookmark> {
    try {
      const { data } = await httpClient.post<ApiBookmark>('/api/bookmarks', toSnakeCase(bookmark as unknown as Record<string, unknown>));
      return mapApiBookmark(data);
    } catch {
      return { ...bookmark, id: 'b_' + Date.now(), createdAt: new Date().toISOString() };
    }
  },

  async remove(id: string): Promise<void> {
    try {
      await httpClient.delete(`/api/bookmarks/${id}`);
    } catch { /* ignore */ }
  },
};

// ─── Company / document / insight services (mock only) ───────────────────────

export const companyService = {
  async list(): Promise<Company[]> {
    return COMPANIES;
  },
  async get(id: string): Promise<Company | undefined> {
    return COMPANIES.find((c) => c.id === id);
  },
  async searchCompanies(query: string, sector?: Company['sector'] | 'all'): Promise<Company[]> {
    const q = query.trim().toLowerCase();
    return COMPANIES.filter((c) => {
      const matchesQuery = !q || c.name.toLowerCase().includes(q) || c.ticker.toLowerCase().includes(q);
      const matchesSector = !sector || sector === 'all' || c.sector === sector;
      return matchesQuery && matchesSector;
    });
  },
};

export const documentService = {
  async list(): Promise<DocumentItem[]> {
    return DOCUMENTS;
  },
  async get(id: string): Promise<DocumentItem | undefined> {
    return DOCUMENTS.find((d) => d.id === id);
  },
  async filter(opts: {
    query?: string;
    companyId?: string | 'all';
    type?: DocumentItem['type'] | 'all';
    year?: number | 'all';
    quarter?: string | 'all';
  }): Promise<DocumentItem[]> {
    const q = (opts.query ?? '').trim().toLowerCase();
    return DOCUMENTS.filter((d) => {
      const mq = !q || d.name.toLowerCase().includes(q) || d.companyName.toLowerCase().includes(q);
      const mc = !opts.companyId || opts.companyId === 'all' || d.companyId === opts.companyId;
      const mt = !opts.type || opts.type === 'all' || d.type === opts.type;
      const my = !opts.year || opts.year === 'all' || d.year === opts.year;
      const mq2 = !opts.quarter || opts.quarter === 'all' || d.quarter === opts.quarter;
      return mq && mc && mt && my && mq2;
    });
  },
};

export const insightService = {
  async forCompany(companyId: string): Promise<AiInsight[]> {
    return INSIGHTS.filter((i) => i.companyId === companyId);
  },
};

// ─── API shape mappers ────────────────────────────────────────────────────────

interface ApiConversation {
  id: string | number;
  title?: string;
  created_at?: string;
  updated_at?: string;
  messages?: ApiMessage[];
  message_count?: number;
  company_id?: string;
  pinned?: boolean;
  archived?: boolean;
}

interface ApiMessage {
  id: string | number;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at?: string;
  model?: AiModel;
  sources?: ChatMessage['sources'];
}

interface ApiBookmark {
  id: string | number;
  title?: string;
  document_id?: string;
  company_id?: string;
  note?: string;
  created_at?: string;
}

function mapApiConversation(d: ApiConversation): Conversation {
  return {
    id: String(d.id),
    title: d.title ?? 'Untitled',
    createdAt: d.created_at ?? new Date().toISOString(),
    updatedAt: d.updated_at ?? new Date().toISOString(),
    messages: (d.messages ?? []).map(mapApiMessage),
    messageCount: d.message_count ?? d.messages?.length ?? 0,
    companyId: d.company_id,
    pinned: d.pinned,
    archived: d.archived,
  };
}

function mapApiMessage(m: ApiMessage): ChatMessage {
  return {
    id: String(m.id),
    role: m.role,
    content: m.content,
    createdAt: m.created_at ?? new Date().toISOString(),
    model: m.model,
    sources: m.sources,
    liked: null,
  };
}

function mapApiBookmark(b: ApiBookmark): Bookmark {
  return {
    id: String(b.id),
    kind: 'document',
    refId: b.document_id ?? b.company_id ?? String(b.id),
    title: b.title ?? '',
    subtitle: b.note,
    createdAt: b.created_at ?? new Date().toISOString(),
  };
}

function mapApiUser(d: Record<string, unknown>): AppUser {
  const firstName = (d.first_name ?? d.firstName ?? '') as string;
  const lastName = (d.last_name ?? d.lastName ?? '') as string;
  return {
    id: String(d.id ?? d.user_id ?? ''),
    email: String(d.email ?? ''),
    firstName,
    lastName,
    fullName: (d.full_name as string | undefined) ?? `${firstName} ${lastName}`.trim(),
    role: (d.role as AppUser['role']) ?? 'user',
    plan: (d.plan as AppUser['plan']) ?? 'free',
    avatarUrl: (d.avatar_url as string | undefined) ?? (d.avatarUrl as string | undefined),
    createdAt: String(d.created_at ?? d.createdAt ?? new Date().toISOString()),
  };
}

function toSnakeCase(obj: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [
      k.replace(/([A-Z])/g, (c) => `_${c.toLowerCase()}`),
      v,
    ])
  );
}

// ─── Mock stream fallback ─────────────────────────────────────────────────────

async function* _mockStream(
  prompt: string,
  companyId?: string
): AsyncGenerator<{ delta: string; done: boolean; sources?: ChatMessage['sources'] }> {
  const company = companyId ? COMPANIES.find((c) => c.id === companyId) : undefined;
  const lc = prompt.toLowerCase();

  let text: string;
  if (lc.includes('revenue') && company) {
    const series = company.metrics.revenue;
    const last = series[series.length - 1];
    const prev = series[series.length - 2];
    const yoy = (((last.value - prev.value) / prev.value) * 100).toFixed(1);
    text = `Here is the revenue trend for **${company.name}**:\n\n| Period | Revenue (Rs Cr) |\n|---|---|\n${series
      .map((s) => `| ${s.period} | ${s.value.toLocaleString('en-IN')} |`)
      .join('\n')}\n\nMost recently, **${last.period}** revenue stood at **Rs ${last.value.toLocaleString('en-IN')} Cr**, reflecting approximately **${yoy}% sequential change**.`;
  } else if (lc.includes('risk')) {
    text = `Key risks identified across recent filings:\n\n1. **Margin pressure** from wage inflation across IT services firms.\n2. **Regulatory exposure** in telecom and banking segments.\n3. **Commodity-price volatility** for energy majors.\n4. **FX sensitivity** as a meaningful share of revenue is USD-linked.`;
  } else if ((lc.includes('quarter') || lc.includes('results')) && company) {
    const last = company.metrics.revenue[company.metrics.revenue.length - 1];
    const profit = company.metrics.profit[company.metrics.profit.length - 1];
    const eps = company.metrics.eps[company.metrics.eps.length - 1];
    text = `**${company.name} — ${last.period}** snapshot:\n\n| Metric | Value |\n|---|---|\n| Revenue | Rs ${last.value.toLocaleString('en-IN')} Cr |\n| Net Profit | Rs ${profit.value.toLocaleString('en-IN')} Cr |\n| EPS | Rs ${eps.value} |\n\nMargins remained stable despite a tougher demand environment.`;
  } else {
    text = `I analyzed the available filings${company ? ` for **${company.name}**` : ''}. Based on the most recent reports, key themes emerging are:\n\n- Steady **revenue momentum** led by discretionary recovery.\n- **Margin resilience** despite wage hikes.\n- Strong **order book** and book-to-bill above 1.0.\n\nAsk me to compare quarters or surface specific risks.`;
  }

  const sources: ChatMessage['sources'] = companyId
    ? DOCUMENTS.filter((d) => d.companyId === companyId).slice(0, 2).map((d, i) => ({
        id: 'src_' + i,
        title: d.name,
        documentId: d.id,
        page: 5 + i * 4,
      }))
    : undefined;

  const tokens = text.split(/(\s+)/);
  for (const token of tokens) {
    await new Promise((r) => setTimeout(r, 18 + Math.random() * 22));
    yield { delta: token, done: false };
  }
  yield { delta: '', done: true, sources };
}

function _demoSignIn(email: string, firstName?: string, lastName?: string): AppUser {
  const fn = firstName ?? (email.split('@')[0].slice(0, 1).toUpperCase() + email.split('@')[0].slice(1));
  const ln = lastName ?? 'Investor';
  const isAdmin = email.toLowerCase().includes('admin');
  const user: AppUser = {
    id: 'u_demo_' + Date.now(),
    email,
    firstName: fn,
    lastName: ln,
    fullName: `${fn} ${ln}`,
    role: isAdmin ? 'admin' : 'user',
    plan: isAdmin ? 'enterprise' : 'pro',
    createdAt: new Date().toISOString(),
  };
  localStorage.setItem('idf_user', JSON.stringify(user));
  localStorage.setItem('idf_token', 'demo_' + Date.now());
  return user;
}
