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
  AdminUser,
  AiInsight,
  AiModel,
  AppUser,
  Bookmark,
  BookmarkKind,
  ChatMessage,
  Company,
  Conversation,
  DocumentItem,
  ModelOption,
  SourceCitation,
} from '@/types';

// ─── HTTP client ─────────────────────────────────────────────────────────────

export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

export const httpClient = axios.create({
  baseURL: API_URL,
  timeout: 30000,
});
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

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
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

    // In dev without a Google client ID, keep the local demo fallback so the
    // UI remains usable without external keys.
    if (!clientId) {
      if (import.meta.env.DEV) {
        console.warn('VITE_GOOGLE_CLIENT_ID not set — falling back to demo user (dev only)');
       
      }
      // Production: fall back to the server-side Google redirect flow.
      window.location.href = `${API_URL}/api/auth/google/login`;
      // The page reloads; the /google-callback route completes the sign-in.
      return new Promise<AppUser>(() => {});
    }

    // Primary flow: Google Identity Services popup -> ID token -> backend.
    const credential = await getGoogleCredential(clientId);
    if (!credential) {
      // Popup unavailable/cancelled/timed out — use the server redirect flow.
      window.location.href = `${API_URL}/api/auth/google/login`;
      return new Promise<AppUser>(() => {});
    }

    try {
      const { data } = await httpClient.post('/api/auth/google', { id_token: credential });
      const payload = data.data ?? data;
      const user: AppUser = mapApiUser(payload.user ?? payload);
      const token: string = payload.access_token ?? payload.token ?? '';
      localStorage.setItem('idf_user', JSON.stringify(user));
      if (token) localStorage.setItem('idf_token', token);
      return user;
    } catch (err: any) {
      throw new Error(
        err.response?.data?.detail ||
        err.response?.data?.message ||
        'Google sign-in failed'
      );
    }
  },

  async verifyEmail(token: string): Promise<void> {
    const { data } = await httpClient.post('/api/auth/verify-email', { token });
    if (data && data.success === false) {
      throw new Error(data.message || 'Email verification failed');
    }
  },

  async resendVerification(email: string): Promise<void> {
    await httpClient.post('/api/auth/resend-verification', { email });
  },

  /** Exchange a JWT (from the Google redirect callback) for the user profile. */
  async fetchCurrentUser(token: string): Promise<AppUser> {
    const { data } = await httpClient.get('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const payload = data.data ?? data;
    const user: AppUser = mapApiUser(payload);
    localStorage.setItem('idf_user', JSON.stringify(user));
    localStorage.setItem('idf_token', token);
    return user;
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
          // console.log("Sending token:", token);

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

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await httpClient.post('/api/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
    });
  },
};

// ─── Conversation service ─────────────────────────────────────────────────────

export const chatService = {
  async listConversations(): Promise<Conversation[]> {
    try {
      const { data } = await httpClient.get<{ success: boolean; items?: ApiConversation[]; data?: ApiConversation[] }>('/api/conversations');
      // Backend wraps list responses in { success, page, limit, total, items: [...] }
      const list: ApiConversation[] = data.items ?? data.data ?? (Array.isArray(data) ? data : []);
      return list.map(mapApiConversation);
    } catch {
      return [];
    }
  },

async createConversation(title: string): Promise<Conversation> {
  const { data } = await httpClient.post<ApiResponse<ApiConversation>>(
    "/api/conversations",
    { title }
  );

  return mapApiConversation(data.data);
},
  async updateConversation(id: string, patch: { title?: string }): Promise<Conversation> {
    const { data } = await httpClient.patch<ApiResponse<ApiConversation>>(`/api/conversations/${id}`, patch);
   return mapApiConversation(data.data);
  },

  async deleteConversation(id: string): Promise<void> {
    await httpClient.delete(`/api/conversations/${id}`);
  },

  async getMessages(conversationId: string): Promise<ChatMessage[]> {
    try {
      const { data } = await httpClient.get<unknown>(
        `/api/messages/conversation/${conversationId}`
      );
      // Handle multiple response shapes:
      //   { success, items: [...] }   — paginated list format
      //   { success, data: [...] }    — wrapped array format
      //   { messages: [...] }         — keyed by "messages"
      //   [ ... ]                     — bare array
      const raw = data as Record<string, unknown>;
      let list: ApiMessageResponse[] | undefined;

      if (Array.isArray(data)) {
        list = data as ApiMessageResponse[];
      } else if (Array.isArray(raw?.items)) {
        list = raw.items as ApiMessageResponse[];
      } else if (Array.isArray(raw?.data)) {
        list = raw.data as ApiMessageResponse[];
      } else if (Array.isArray(raw?.messages)) {
        list = raw.messages as ApiMessageResponse[];
      }

      return (list ?? []).map(mapApiMessageResponse);
    } catch {
      return [];
    }
  },

  async deleteMessage(msgId: string): Promise<void> {
    await httpClient.delete(`/api/conversations/${msgId}`);
  },

  models: MODELS as ModelOption[],
  suggestions: SUGGESTIONS,

  /**
   * Transcribe a voice recording (wav / mp3 / m4a / webm) and run it through
   * the RAG pipeline. POST /api/chat/voice (multipart).
   */
  async sendVoice(
    audioBlob: Blob,
    filename: string,
    companyId?: string,
    conversationId?: string,
  ): Promise<{ conversationId: string; content: string }> {
    const form = new FormData();
    form.append('file', audioBlob, filename);
    if (companyId) form.append('company_id', companyId);
    if (conversationId && conversationId !== 'undefined') {
      form.append('conversation_id', conversationId);
    }

    const { data } = await httpClient.post('/api/chat/voice', form, { timeout: 120000 });
    const payload = data?.data ?? data;
    return {
      conversationId: String(payload?.conversation_id ?? payload?.conversationId ?? conversationId ?? ''),
      content: String(payload?.content ?? ''),
    };
  },

  /**
   * Analyze an uploaded image together with the retrieved document context.
   * POST /api/chat/image (multipart).
   */
  async sendImage(
    file: File,
    question: string,
    companyId?: string,
    conversationId?: string,
  ): Promise<{ conversationId: string; content: string }> {
    const form = new FormData();
    form.append('file', file);
    form.append('message', question);
    if (companyId) form.append('company_id', companyId);
    if (conversationId && conversationId !== 'undefined') {
      form.append('conversation_id', conversationId);
    }

    const { data } = await httpClient.post('/api/chat/image', form, { timeout: 120000 });
    const payload = data?.data ?? data;
    return {
      conversationId: String(payload?.conversation_id ?? payload?.conversationId ?? conversationId ?? ''),
      content: String(payload?.content ?? ''),
    };
  },

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
      // console.log('🚀 Sending chat request to:', `${API_URL}/api/chat`);
      const response = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(localStorage.getItem('idf_token')
            ? { Authorization: `Bearer ${localStorage.getItem('idf_token')}` }
            : {}),
        },
        body: JSON.stringify({ message: prompt, model, company_id: companyId, conversation_id: conversationId }),
      });

      // // console.log('📡 Response status:', response.status, 'ok:', response.ok, 'hasBody:', !!response.body);

      if (!response.ok) {
        console.error('❌ Response not ok, status:', response.status);
        const errorText = await response.text();
        console.error('❌ Error response:', errorText);
        yield* _mockStream(prompt, companyId);
        return;
      }

      if (!response.body) {
        console.error('❌ No response body');
        yield* _mockStream(prompt, companyId);
        return;
      }

      const contentType = response.headers.get('content-type') ?? '';
      // console.log('📝 Content-Type:', contentType);

      if (contentType.includes('text/event-stream')) {
        // console.log('📨 Streaming SSE response');
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
        // console.log('📄 Parsing JSON response');
        // Plain JSON response — yield full text at once
        const json = await response.json();
        // console.log('✅ Parsed JSON:', JSON.stringify(json).slice(0, 200) + '...');
        
        // Handle OpenAI/OpenRouter response format
        let text: string = '';
        if (json?.choices?.[0]?.message) {
          const message = json.choices[0].message;
          // Try content first, then reasoning (for extended thinking models)
          text = message.content ?? message.reasoning ?? '';
          // console.log('✨ Extracted text from choices[0].message, length:', text.length);
        } else {
          // Fallback to other formats
          text =
            json?.data?.content ??
            json.content ??
            json.message ??
            json.response ??
            '';
          // console.log('⚠️ Using fallback format, text length:', text.length);
        }
        
        if (!text) {
          // console.error('❌ No text extracted from response');
          // console.error('Full response:', JSON.stringify(json));
        }

        const sources = json?.data?.sources ?? json?.sources;
        // Split into tokens preserving ALL whitespace (newlines, spaces, etc.)
        // so markdown structure is maintained during streaming.
        const tokens = text.split(/(\s+)/);
        // console.log('📊 Token count:', tokens.length);
        
        for (const token of tokens) {
          await new Promise((r) => setTimeout(r, 18 + Math.random() * 22));
          yield { delta: token, done: false };
        }
        yield { delta: '', done: true, sources };
      }
    } catch (error) {
      // console.error('🔴 Error in streamResponse:', error);
      // console.error('Stack:', error instanceof Error ? error.stack : '');
      yield* _mockStream(prompt, companyId);
    }
  },
};

// ─── Bookmark service ─────────────────────────────────────────────────────────

export const bookmarkService = {
  async list(): Promise<Bookmark[]> {
    try {
      const { data } = await httpClient.get<{ success: boolean; items?: ApiBookmark[]; data?: ApiBookmark[] }>('/api/bookmarks');
      // Backend wraps list responses in { success, page, limit, total, items: [...] }
      const list: ApiBookmark[] = data.items ?? data.data ?? (Array.isArray(data) ? data : []);
      return list.map(mapApiBookmark);
    } catch {
      return BOOKMARKS;
    }
  },

  async toggle(bookmark: Omit<Bookmark, 'id' | 'createdAt'>): Promise<Bookmark> {
    try {
      const { data } = await httpClient.post<ApiResponse<ApiBookmark>>('/api/bookmarks', toSnakeCase(bookmark as unknown as Record<string, unknown>));
      return mapApiBookmark(data.data ?? data);
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

// ─── User service ───────────────────────────────────────────────────────────

export interface UserListParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  plan?: string;
  sort_by?: string;
  sort_order?: string;
}

export interface UserListResponse {
  items: AdminUser[];
  total: number;
  page: number;
  limit: number;
}

export const userService = {
  async listUsers(params: UserListParams = {}): Promise<UserListResponse> {
    const queryParams: Record<string, string | number> = {};
    if (params.page) queryParams.page = params.page;
    if (params.limit) queryParams.limit = params.limit;
    if (params.search) queryParams.search = params.search;
    if (params.role && params.role !== 'all') queryParams.role = params.role;
    if (params.plan && params.plan !== 'all') queryParams.plan = params.plan;
    if (params.sort_by) queryParams.sort_by = params.sort_by;
    if (params.sort_order) queryParams.sort_order = params.sort_order;

    const { data } = await httpClient.get<unknown>('/api/users', { params: queryParams });
    return normalizeUserListResponse(data);
  },

  async getUser(id: string): Promise<AdminUser> {
    const { data } = await httpClient.get<unknown>(`/api/users/${id}`);
    return normalizeUserPayload(data);
  },

  async updateUser(id: string, updates: Partial<AdminUser>): Promise<AdminUser> {
    const body = toSnakeCase(updates as unknown as Record<string, unknown>);
    const { data } = await httpClient.patch<unknown>(`/api/users/${id}`, body);
    return normalizeUserPayload(data);
  },

  async deleteUser(id: string): Promise<void> {
    await httpClient.delete(`/api/users/${id}`);
  },
};

function normalizeUserListResponse(payload: unknown): UserListResponse {
  if (!payload || typeof payload !== 'object') {
    return { items: [], total: 0, page: 1, limit: 20 };
  }
  const rec = payload as Record<string, unknown>;
  const wrapper = rec.data && typeof rec.data === 'object' ? (rec.data as Record<string, unknown>) : rec;
  const items = wrapper.items ?? wrapper.users ?? wrapper.results ?? [];
  const list: AdminUser[] = Array.isArray(items) ? items.map((i: unknown) => normalizeUserPayload(i)).filter(Boolean) as AdminUser[] : [];
  return {
    items: list,
    total: toNumber(wrapper.total ?? wrapper.count ?? list.length),
    page: toNumber(wrapper.page ?? 1),
    limit: toNumber(wrapper.limit ?? 20),
  };
}

function normalizeUserPayload(payload: unknown): AdminUser {
  const rec = (payload && typeof payload === 'object')
    ? ((payload as Record<string, unknown>).data && typeof (payload as Record<string, unknown>).data === 'object'
        ? (payload as Record<string, unknown>).data as Record<string, unknown>
        : (payload as Record<string, unknown>))
    : {};
  const id = String(rec.id ?? '');
  const firstName = String(rec.firstName ?? rec.first_name ?? '');
  const lastName = String(rec.lastName ?? rec.last_name ?? '');
  return {
    id,
    email: String(rec.email ?? ''),
    firstName,
    lastName,
    fullName: String(rec.fullName ?? rec.full_name ?? `${firstName} ${lastName}`.trim()),
    avatarUrl: rec.avatarUrl as string | undefined ?? rec.avatar_url as string | undefined,
    role: (rec.role as AdminUser['role']) ?? 'user',
    plan: (rec.plan as AdminUser['plan']) ?? 'free',
    createdAt: String(rec.createdAt ?? rec.created_at ?? rec.createdAt ?? new Date().toISOString()),
    lastActiveAt: rec.lastActiveAt as string | undefined ?? rec.last_active_at as string | undefined,
    documentCount: toNumber(rec.documentCount ?? rec.document_count ?? 0),
    conversationCount: toNumber(rec.conversationCount ?? rec.conversation_count ?? 0),
  };
}

// ─── Company / document / insight services ────────────────────────────────────

export const companyService = {
  async list(): Promise<Company[]> {
    try {
      const { data } = await httpClient.get<unknown>('/api/companies');
      return normalizeCompanyListResponse(data);
    } catch {
      return COMPANIES;
    }
  },

  async get(id: string): Promise<Company | undefined> {
    try {
      const { data } = await httpClient.get<unknown>(`/api/companies/${id}`);
      return normalizeCompanyPayload(data);
    } catch {
      return COMPANIES.find((c) => c.id === id);
    }
  },

  async searchCompanies(query: string, sector?: Company['sector'] | 'all'): Promise<Company[]> {
    try {
      const params: Record<string, string> = {};
      const q = query.trim();
      if (q) params.search = q;
      if (sector && sector !== 'all') params.sector = sector;

      const { data } = await httpClient.get<unknown>('/api/companies/search', { params });
      return normalizeCompanyListResponse(data);
    } catch {
      const q = query.trim().toLowerCase();
      return COMPANIES.filter((c) => {
        const matchesQuery = !q || c.name.toLowerCase().includes(q) || c.ticker.toLowerCase().includes(q);
        const matchesSector = !sector || sector === 'all' || c.sector === sector;
        return matchesQuery && matchesSector;
      });
    }
  },

  async create(data: {
    name: string;
    ticker: string;
    sector: string;
    industry: string;
    marketCapCr?: number;
    description?: string;
    color?: string;
  }): Promise<Company> {
    const body = toSnakeCase(data as unknown as Record<string, unknown>);
    const { data: response } = await httpClient.post<unknown>('/api/companies', body);
    const company = normalizeCompanyPayload(response);
    if (!company) throw new Error('Failed to create company');
    return company;
  },

  async update(
    id: string,
    data: Partial<{
      name: string;
      ticker: string;
      sector: string;
      industry: string;
      marketCapCr: number;
      description: string;
      color: string;
    }>
  ): Promise<Company> {
    const body = toSnakeCase(data as unknown as Record<string, unknown>);
    const { data: response } = await httpClient.put<unknown>(`/api/companies/${id}`, body);
    const company = normalizeCompanyPayload(response);
    if (!company) throw new Error('Failed to update company');
    return company;
  },

  async delete(id: string): Promise<void> {
    await httpClient.delete(`/api/companies/${id}`);
  },
};

export const documentService = {
  async list(page = 1, limit = 20): Promise<{ items: DocumentItem[]; total: number }> {
    try {
      const params = { page, limit };
      const { data } = await httpClient.get<unknown>('/api/documents', { params });
      const items = normalizeDocumentListResponse(data);
      const total = extractTotalCount(data) ?? items.length;
      return { items, total };
    } catch {
      return { items: DOCUMENTS, total: DOCUMENTS.length };
    }
  },

  async get(id: string): Promise<DocumentItem | undefined> {
    try {
      const { data } = await httpClient.get<unknown>(`/api/documents/${id}`);
      return normalizeDocumentPayload(data);
    } catch {
      return DOCUMENTS.find((d) => d.id === id);
    }
  },

  async getByCompany(companyId: string, page = 1, limit = 20): Promise<{ items: DocumentItem[]; total: number }> {
    try {
      const params = { page, limit };
      const { data } = await httpClient.get<unknown>(`/api/documents/company/${companyId}`, { params });
      const items = normalizeDocumentListResponse(data);
      const total = extractTotalCount(data) ?? items.length;
      return { items, total };
    } catch {
      const items = DOCUMENTS.filter((d) => d.companyId === companyId);
      return { items, total: items.length };
    }
  },

  async filter(opts: {
    query?: string;
    companyId?: string | 'all';
    type?: DocumentItem['type'] | 'all';
    year?: number | 'all';
    quarter?: string | 'all';
    page?: number;
    limit?: number;
  }): Promise<{ items: DocumentItem[]; total: number }> {
    try {
      const params: Record<string, string | number> = {};
      if (opts.query) params.search = opts.query;
      if (opts.companyId && opts.companyId !== 'all') params.company_id = opts.companyId;
      if (opts.type && opts.type !== 'all') params.report_type = opts.type;
      if (opts.year && opts.year !== 'all') params.year = opts.year;
      if (opts.quarter && opts.quarter !== 'all') params.quarter = opts.quarter;
      params.page = opts.page ?? 1;
      params.limit = opts.limit ?? 20;

      const { data } = await httpClient.get<unknown>('/api/documents', { params });
      const items = normalizeDocumentListResponse(data);
      const total = extractTotalCount(data) ?? items.length;
      return { items, total };
    } catch {
      const q = (opts.query ?? '').trim().toLowerCase();
      const filtered = DOCUMENTS.filter((d) => {
        const mq = !q || d.name.toLowerCase().includes(q) || d.companyName.toLowerCase().includes(q);
        const mc = !opts.companyId || opts.companyId === 'all' || d.companyId === opts.companyId;
        const mt = !opts.type || opts.type === 'all' || d.type === opts.type;
        const my = !opts.year || opts.year === 'all' || d.year === opts.year;
        const mq2 = !opts.quarter || opts.quarter === 'all' || d.quarter === opts.quarter;
        return mq && mc && mt && my && mq2;
      });
      const page = opts.page ?? 1;
      const limit = opts.limit ?? 20;
      const start = (page - 1) * limit;
      return { items: filtered.slice(start, start + limit), total: filtered.length };
    }
  },

  async upload(formData: FormData): Promise<DocumentItem> {
    try {
      const { data } = await httpClient.post('/api/documents/upload', formData);
      const payload = data.data ?? data;
      return normalizeDocumentPayload(payload) as DocumentItem;
    } catch (err) {
      throw err;
    }
  },

  async update(id: string, patch: Partial<DocumentItem>): Promise<DocumentItem | undefined> {
    try {
      const { data } = await httpClient.put(`/api/documents/${id}`, toSnakeCase(patch));
      return normalizeDocumentPayload(data);
    } catch {
      return undefined;
    }
  },

  async remove(id: string): Promise<boolean> {
    try {
      await httpClient.delete(`/api/documents/${id}`);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Get a presigned preview URL for a document.
   * GET /api/documents/{id}/preview
   * Returns { success, preview_url, expires_in }
   */
  async preview(id: string): Promise<{ url: string; expiresIn: number } | null> {
    try {
      const { data } = await httpClient.get<Record<string, unknown>>(`/api/documents/${id}/preview`);
      const rec = (data?.data as Record<string, unknown>) ?? data;
      const url = (rec?.preview_url as string) ?? null;
      const expiresIn = (rec?.expires_in as number) ?? 3600;
      return url ? { url, expiresIn } : null;
    } catch {
      return null;
    }
  },

  /**
   * Get a presigned download URL for a document.
   * GET /api/documents/{id}/download
   * Returns { success, download_url, expires_in }
   */
  async download(id: string): Promise<{ url: string; expiresIn: number } | null> {
    try {
      const { data } = await httpClient.get<Record<string, unknown>>(`/api/documents/${id}/download`);
      const rec = (data?.data as Record<string, unknown>) ?? data;
      const url = (rec?.download_url as string) ?? null;
      const expiresIn = (rec?.expires_in as number) ?? 3600;
      return url ? { url, expiresIn } : null;
    } catch {
      return null;
    }
  },

  /**
   * Trigger the embedding scheduler to process pending documents.
   * POST /api/documents/scheduler/run
   */
  async runScheduler(): Promise<{ processed: number }> {
    const { data } = await httpClient.post<{ success: boolean; processed: number }>('/api/documents/scheduler/run');
    return { processed: data?.processed ?? 0 };
  },
};

function normalizeDocumentListResponse(payload: unknown): DocumentItem[] {
  if (Array.isArray(payload)) return payload.map((p) => normalizeDocumentPayload(p)).filter(Boolean) as DocumentItem[];
  if (payload && typeof payload === 'object') {
    const rec = payload as Record<string, unknown>;
    const list = rec.items ?? rec.data ?? rec.documents ?? rec.results;
    if (Array.isArray(list)) return list.map((p) => normalizeDocumentPayload(p)).filter(Boolean) as DocumentItem[];
    // maybe single object wrapper
    const single = rec.data && typeof rec.data === 'object' ? rec.data : rec;
    const doc = normalizeDocumentPayload(single);
    return doc ? [doc] : [];
  }
  return [];
}

function normalizeDocumentPayload(payload: unknown): DocumentItem | undefined {
  if (!payload || typeof payload !== 'object') return undefined;
  const rec = (payload as Record<string, unknown>).data && typeof (payload as Record<string, unknown>).data === 'object'
    ? (payload as Record<string, unknown>).data as Record<string, unknown>
    : (payload as Record<string, unknown>);

  const id = String(rec.id ?? rec.document_id ?? rec.documentId ?? '');
  if (!id) return undefined;

  return {
    id,
    name: String(rec.name ?? rec.title ?? ''),
    companyId: String(rec.company_id ?? rec.companyId ?? rec.company ?? ''),
    companyName: String(rec.company_name ?? rec.companyName ?? rec.company_name ?? ''),
    type: (rec.type as DocumentItem['type']) ?? 'filing',
    quarter: rec.quarter ? String(rec.quarter) : undefined,
    year: toNumber(rec.year ?? rec.fiscal_year ?? 0),
    pageCount: toNumber(rec.page_count ?? rec.pageCount ?? rec.pages ?? 0),
    sizeMb: toNumber(rec.size_mb ?? rec.sizeMb ?? 0),
    uploadedAt: String(rec.uploaded_at ?? rec.uploadedAt ?? rec.created_at ?? new Date().toISOString()),
    fileUrl: String(rec.file_url ?? rec.fileUrl ?? rec.url ?? ''),
    sourceUrl: rec.source_url ? String(rec.source_url) : rec.sourceUrl ? String(rec.sourceUrl) : undefined,
    starred: Boolean(rec.starred ?? rec.starred_at ?? false),
  } as DocumentItem;
}

function extractTotalCount(payload: unknown): number | undefined {
  if (!payload || typeof payload !== 'object') return undefined;
  const rec = payload as Record<string, unknown>;
  return toNumber(rec.total ?? rec.count ?? rec.total_count ?? rec.totalDocuments ?? undefined);
}

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
  sources?: SourceCitation[];
}

// Response shape from GET /api/messages/conversation/{id}
interface ApiMessageResponse {
  id: string | number;
  role: 'user' | 'assistant';
  content: string;
  model?: string;
  liked?: boolean;
  created_at: string;
  sources?: { document_id?: string; title?: string; page?: number }[];
}

interface ApiBookmark {
  id: string | number;
  kind?: BookmarkKind;
  ref_id?: string;
  title?: string;
  subtitle?: string;
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

function mapApiMessageResponse(m: ApiMessageResponse): ChatMessage {
  return {
    id: String(m.id),
    role: m.role,
    content: m.content,
    createdAt: m.created_at ?? new Date().toISOString(),
    model: m.model ? (m.model as AiModel) : undefined,
    liked: m.liked ?? null,
    sources: (m.sources ?? []).map((s, i) => ({
      id: `src_${i}`,
      title: s.title ?? 'Untitled',
      documentId: s.document_id ?? '',
      page: s.page ?? 1,
    })),
  };
}

function mapApiBookmark(b: ApiBookmark): Bookmark {
  return {
    id: String(b.id),
    kind: b.kind ?? 'document',
    refId: b.ref_id ?? String(b.id),
    title: b.title ?? '',
    subtitle: b.subtitle ?? b.note,
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
    emailVerified: Boolean(d.email_verified ?? d.emailVerified ?? true),
    authProvider: (d.auth_provider ?? d.authProvider ?? 'email') as AppUser['authProvider'],
    googleId: (d.google_id as string | undefined) ?? (d.googleId as string | undefined),
    lastLogin: (d.last_login as string | undefined) ?? (d.lastLogin as string | undefined),
  };
}

function toSnakeCase(obj: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [
      k.replace(/([A-Z])/g, '_$1').toLowerCase(),
      v,
    ])
  );
}

function normalizeCompanyListResponse(payload: unknown): Company[] {
  if (Array.isArray(payload)) {
    return payload.map((item) => normalizeCompanyPayload(item)).filter((company): company is Company => Boolean(company));
  }

  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>;
    const listCandidate = record.items ?? record.data ?? record.companies ?? record.results;

    if (Array.isArray(listCandidate)) {
      return listCandidate
        .map((item) => normalizeCompanyPayload(item))
        .filter((company): company is Company => Boolean(company));
    }

    const singleCandidate = record.data && typeof record.data === 'object' && !Array.isArray(record.data)
      ? (record.data as Record<string, unknown>)
      : record;
    const company = normalizeCompanyPayload(singleCandidate);
    return company ? [company] : [];
  }

  return [];
}

function normalizeCompanyPayload(payload: unknown, fallback?: Company): Company | undefined {
  if (!payload || typeof payload !== 'object') return fallback;

  const record = payload as Record<string, unknown>;

  // The API wraps create/update responses in { success, message, data: {...} }
  // The GET /{id} wraps in { success, data: {...} }
  // The GET /list wraps in { success, page, limit, total, items: [...] }
  // Handle the { data: {...} } wrapper for single-object responses
  const nested =
    record.data && typeof record.data === 'object' && !Array.isArray(record.data) && !('items' in record)
      ? (record.data as Record<string, unknown>)
      : record;

  const id = String(nested.id ?? nested.company_id ?? nested.companyId ?? fallback?.id ?? '');
  if (!id) return fallback;

  const metrics = nested.metrics && typeof nested.metrics === 'object' ? nested.metrics as Record<string, unknown> : undefined;

  return {
    id,
    name: String(nested.name ?? nested.company_name ?? nested.companyName ?? fallback?.name ?? 'Unnamed company'),
    ticker: String(nested.ticker ?? nested.symbol ?? nested.company_ticker ?? fallback?.ticker ?? ''),
    sector: normalizeSector(nested.sector ?? nested.industry_sector ?? fallback?.sector),
    industry: String(nested.industry ?? nested.sub_sector ?? nested.business ?? fallback?.industry ?? ''),
    marketCapCr: toNumber(nested.market_cap_cr ?? nested.marketCapCr ?? nested.market_cap ?? fallback?.marketCapCr),
    description: String(nested.description ?? nested.about ?? nested.summary ?? fallback?.description ?? ''),
    latestFilingDate: String(nested.latest_filing_date ?? nested.latestFilingDate ?? nested.latest_filing ?? fallback?.latestFilingDate ?? new Date().toISOString()),
    totalReports: toNumber(nested.total_reports ?? nested.totalReports ?? nested.report_count ?? fallback?.totalReports),
    color: String(nested.color ?? fallback?.color ?? '#2563EB'),
    metrics: {
      revenue: normalizeMetricSeries(metrics?.revenue, fallback?.metrics?.revenue),
      profit: normalizeMetricSeries(metrics?.profit, fallback?.metrics?.profit),
      eps: normalizeMetricSeries(metrics?.eps, fallback?.metrics?.eps),
      growth: normalizeMetricSeries(metrics?.growth, fallback?.metrics?.growth),
    },
  };
}

function normalizeMetricSeries(value: unknown, fallback?: Company['metrics']['revenue']): Company['metrics']['revenue'] {
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        const record = item as Record<string, unknown> | undefined;
        return {
          period: String(record?.period ?? record?.label ?? record?.name ?? ''),
          value: toNumber(record?.value ?? record?.amount ?? record?.metric ?? 0),
        };
      })
      .filter((entry) => Boolean(entry.period));
  }

  return fallback ?? [];
}

function normalizeSector(value: unknown, fallback?: Company['sector']): Company['sector'] {
  const safe = String(value ?? fallback ?? 'Technology');
  const allowed: Company['sector'][] = ['Technology', 'Energy', 'Finance', 'Healthcare', 'Consumer', 'Industrial', 'Materials'];
  return allowed.includes(safe as Company['sector']) ? (safe as Company['sector']) : 'Technology';
}

function toNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
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

/**
 * Request a Google credential (ID token) via Google Identity Services.
 *
 * Injects the GIS script on demand, opens the account-chooser popup, and
 * resolves with the credential, or null when the popup is cancelled, times
 * out, or fails to load.
 */
function getGoogleCredential(clientId: string): Promise<string | null> {
  return new Promise((resolve) => {
    const TIMEOUT_MS = 90_000;
    let settled = false;
    const finish = (credential: string | null) => {
      if (settled) return;
      settled = true;
      resolve(credential);
    };

    const finishInit = () => {
      const gis = (window as any).google?.accounts?.id;
      if (!gis) {
        finish(null);
        return;
      }
      try {
        gis.initialize({
          client_id: clientId,
          callback: (resp: { credential?: string }) => finish(resp?.credential ?? null),
        });
        gis.prompt();
      } catch {
        finish(null);
      }
    };

    if ((window as any).google?.accounts?.id) {
      finishInit();
    } else {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = finishInit;
      script.onerror = () => finish(null);
      document.head.appendChild(script);
    }

    window.setTimeout(() => finish(null), TIMEOUT_MS);
  });
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
