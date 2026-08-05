import { create } from 'zustand';
import type { AiModel, ChatMessage, Conversation, SourceCitation } from '@/types';
import { chatService } from '@/services/api';

interface ChatState {
  conversations: Conversation[];
  activeConversationId: string | null;
  selectedModel: AiModel;
  selectedCompanyId?: string;
  loadingConversations: boolean;
  /** True while fetching messages for the active conversation */
  loadingMessages: boolean;
  /** Error message when fetching messages fails, null if no error or succeeded */
  errorMessages: string | null;
  streaming: boolean;
  pendingCitation?: SourceCitation | null;
  init: () => Promise<void>;
  selectConversation: (id: string | null) => void;
  setMessages: (conversationId: string, messages: ChatMessage[]) => void;
  /** Fetch and replace messages for a conversation (caches to avoid re-fetch) */
  loadMessages: (conversationId: string) => Promise<void>;
  newConversation: () => Promise<string>;
  renameConversation: (id: string, title: string) => void;
  deleteConversation: (id: string) => void;
  pinConversation: (id: string) => void;
  archiveConversation: (id: string) => void;
  setModel: (model: AiModel) => void;
  setCompany: (companyId?: string) => void;
  findConversation: (id: string) => Conversation | undefined;
  getActiveConversation: () => Conversation | null;
  sendMessage: (content: string, onNewConversation?: (id: string) => void) => Promise<void>;
  /** Send a voice recording or an image through the RAG pipeline. */
  sendAttachment: (
    kind: 'voice' | 'image',
    file: Blob | File,
    question?: string,
    onNewConversation?: (id: string) => void
  ) => Promise<void>;
  regenerateLast: () => Promise<void>;
  setReaction: (messageId: string, liked: boolean | null) => void;
  openCitation: (source: SourceCitation) => void;
  clearPendingCitation: () => void;
  /** Reset all state — call on logout to clear stale data */
  reset: () => void;
}

function uid(prefix: string) {
  return prefix + '_' + Math.random().toString(36).slice(2, 9);
}

// Module-level cache: tracks which conversations have had their messages fetched.
// Persists across the session so revisiting a conversation doesn't re-fetch.
// Cleared on reset() to prevent stale data on logout/re-login.
let messagesCache = new Set<string>();

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  activeConversationId: null,
  selectedModel: 'gpt-5',
  selectedCompanyId: undefined,
  loadingConversations: false,
  loadingMessages: false,
  errorMessages: null,
  streaming: false,
  pendingCitation: null,

  reset: () => {
    messagesCache = new Set<string>();
    set({
      conversations: [],
      activeConversationId: null,
      streaming: false,
      loadingConversations: false,
      loadingMessages: false,
      errorMessages: null,
      pendingCitation: null,
    });
  },

  init: async () => {
    set({ loadingConversations: true });
    try {
      const apiConversations = await chatService.listConversations();
      set((state) => {
        // Build quick lookup of existing conversations
        const existingMap = new Map(state.conversations.map((c) => [c.id, c]));
        // Merge: use API data for metadata, but preserve existing messages
        const merged = apiConversations.map((apiConv) => {
          const existing = existingMap.get(apiConv.id);
          if (existing && existing.messages.length > 0) {
            return { ...apiConv, messages: existing.messages };
          }
          return apiConv;
        });
        // Preserve local-only conversations: ones with messages (actively being
        // streamed) and the active conversation (freshly created, still empty).
        const apiIds = new Set(apiConversations.map((c) => c.id));
        const localOnly = state.conversations.filter(
          (c) =>
            !apiIds.has(c.id) &&
            (c.messages.length > 0 || c.id === state.activeConversationId)
        );
        return { conversations: [...localOnly, ...merged], loadingConversations: false };
      });
    } catch {
      set({ loadingConversations: false });
    }
  },

  selectConversation: (id) => set({ activeConversationId: id }),

  setMessages: (conversationId: string, messages: ChatMessage[]) =>
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === conversationId
          ? { ...c, messages, messageCount: messages.length }
          : c
      ),
    })),

  loadMessages: async (conversationId: string) => {
    // Skip if already cached (messages already loaded for this conversation)
    if (messagesCache.has(conversationId)) return;

    set({ loadingMessages: true, errorMessages: null });
    try {
      const messages = await chatService.getMessages(conversationId);
      set((state) => {
        const exists = state.conversations.find((c) => c.id === conversationId);
        if (!exists) {
          // init() hasn't populated conversations yet — add it
          return {
            conversations: [
              ...state.conversations,
              {
                id: conversationId,
                title: 'Conversation',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                messages,
                messageCount: messages.length,
              },
            ],
            loadingMessages: false,
          };
        }

        // CRITICAL RACE CONDITION FIX:
        // When a new conversation is created and the first message is sent from
        // the Dashboard (or any page without an active conversation), sendMessage()
        // adds user+assistant messages to the store. Meanwhile loadMessages() runs
        // in the ChatPage useEffect and fetches messages from the API. Since the
        // backend hasn't saved the messages yet (they're still being streamed), the
        // API returns an empty array. If we blindly overwrite, the locally added
        // messages vanish and the streaming updates target an empty array.
        //
        // Solution: if the conversation already has messages locally and the API
        // returned nothing, trust the local state and skip the overwrite.
        if (exists.messages.length > 0 && messages.length === 0) {
          return { loadingMessages: false };
        }

        // Replace chat state with retrieved history — do NOT append.
        return {
          conversations: state.conversations.map((c) =>
            c.id === conversationId
              ? { ...c, messages, messageCount: messages.length }
              : c
          ),
          loadingMessages: false,
        };
      });
      // Only cache if we actually loaded messages, so subsequent visits re-fetch
      // for conversations that genuinely have nothing (e.g. brand new).
      if (messages.length > 0) messagesCache.add(conversationId);
    } catch {
      set({ loadingMessages: false, errorMessages: 'Unable to load conversation history.' });
    }
  },

  newConversation: async () => {
    try {
      const conv = await chatService.createConversation('New chat');
      set((s) => ({ conversations: [conv, ...s.conversations], activeConversationId: conv.id }));
      return conv.id;
    } catch {
      // Fallback: local-only conversation when backend is unavailable
      const id = uid('c');
      const conv: Conversation = {
        id,
        title: 'New chat',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: [],
        messageCount: 0,
      };
      set((s) => ({ conversations: [conv, ...s.conversations], activeConversationId: id }));
      return id;
    }
  },

  renameConversation: (id, title) => {
    set((s) => ({
      conversations: s.conversations.map((c) =>
        c.id === id ? { ...c, title, updatedAt: new Date().toISOString() } : c
      ),
    }));
    chatService.updateConversation(id, { title }).catch(() => {});
  },

  deleteConversation: (id) => {
    set((s) => ({
      conversations: s.conversations.filter((c) => c.id !== id),
      activeConversationId: s.activeConversationId === id ? null : s.activeConversationId,
    }));
    chatService.deleteConversation(id).catch(() => {});
  },

  pinConversation: (id) =>
    set((s) => ({
      conversations: s.conversations.map((c) => (c.id === id ? { ...c, pinned: !c.pinned } : c)),
    })),

  archiveConversation: (id) =>
    set((s) => ({
      conversations: s.conversations.map((c) => (c.id === id ? { ...c, archived: !c.archived } : c)),
    })),

  setModel: (model) => set({ selectedModel: model }),
  setCompany: (companyId) => set({ selectedCompanyId: companyId }),

  findConversation: (id) => get().conversations.find((c) => c.id === id),
  getActiveConversation: () => {
    const { conversations, activeConversationId } = get();
    return conversations.find((c) => c.id === activeConversationId) ?? null;
  },

  sendMessage: async (content, onNewConversation) => {
    const state = get();
    let convId = state.activeConversationId;
    if (!convId || convId === 'undefined') {
      convId = await get().newConversation();
      if (onNewConversation) onNewConversation(convId);
    }

    const userMsg: ChatMessage = {
      id: uid('m'),
      role: 'user',
      content,
      createdAt: new Date().toISOString(),
    };
    const assistantMsg: ChatMessage = {
      id: uid('m'),
      role: 'assistant',
      content: '',
      createdAt: new Date().toISOString(),
      model: state.selectedModel,
      streaming: true,
      liked: null,
    };

    set((s) => ({
      conversations: s.conversations.map((c) =>
        c.id === convId
          ? {
              ...c,
              title: c.messages.length === 0 ? content.slice(0, 40) : c.title,
              messages: [...c.messages, userMsg, assistantMsg],
              messageCount: c.messages.length + 2,
              updatedAt: new Date().toISOString(),
              companyId: c.companyId ?? s.selectedCompanyId,
            }
          : c
      ),
      streaming: true,
    }));

    console.log('📤 Sending message, conversation:', convId);
    const stream = chatService.streamResponse(
      content,
      state.selectedModel,
      state.selectedCompanyId,
      convId,
    );
    let acc = '';
    let sources: ChatMessage['sources'] | undefined;
    let chunkCount = 0;
    
    try {
      for await (const chunk of stream) {
        chunkCount++;
        console.log(`📨 Chunk ${chunkCount}:`, chunk);
        
        if (chunk.delta) {
          acc += chunk.delta;
          set((s) => ({
            conversations: s.conversations.map((c) =>
              c.id === convId
                ? { ...c, messages: c.messages.map((m) => (m.id === assistantMsg.id ? { ...m, content: acc } : m)) }
                : c
            ),
          }));
        }
        if (chunk.done) sources = chunk.sources;
      }
    } catch (err) {
      console.error('❌ Error in stream processing:', err);
    }

    console.log('✅ Stream completed, total chunks:', chunkCount, 'final content length:', acc.length);
    set((s) => ({
      conversations: s.conversations.map((c) =>
        c.id === convId
          ? {
              ...c,
              messages: c.messages.map((m) =>
                m.id === assistantMsg.id ? { ...m, content: acc, sources, streaming: false } : m
              ),
            }
          : c
      ),
      streaming: false,
    }));
    console.log(
      "✨ STORE MESSAGE:",
      get()
        .getActiveConversation()
        ?.messages.find((m) => m.id === assistantMsg.id)
    );
  },

  sendAttachment: async (kind, file, question, onNewConversation) => {
    const state = get();
    let convId = state.activeConversationId;
    if (!convId || convId === 'undefined') {
      convId = await get().newConversation();
      if (onNewConversation) onNewConversation(convId);
    }

    const userContent =
      kind === 'voice'
        ? '🎤 Voice query'
        : question && question.trim()
          ? `${question.trim()} 📎 (image attached)`
          : '📎 Image query';

    const userMsg: ChatMessage = {
      id: uid('m'),
      role: 'user',
      content: userContent,
      createdAt: new Date().toISOString(),
    };
    const assistantMsg: ChatMessage = {
      id: uid('m'),
      role: 'assistant',
      content: '',
      createdAt: new Date().toISOString(),
      model: state.selectedModel,
      streaming: true,
      liked: null,
    };

    set((s) => ({
      conversations: s.conversations.map((c) =>
        c.id === convId
          ? {
              ...c,
              title: c.messages.length === 0 ? (question || 'Voice query').slice(0, 40) : c.title,
              messages: [...c.messages, userMsg, assistantMsg],
              messageCount: c.messages.length + 2,
              updatedAt: new Date().toISOString(),
              companyId: c.companyId ?? s.selectedCompanyId,
            }
          : c
      ),
      streaming: true,
    }));

    try {
      const result =
        kind === 'voice'
          ? await chatService.sendVoice(file as Blob, (file as File).name || 'recording.webm', state.selectedCompanyId, convId)
          : await chatService.sendImage(file as File, question || '', state.selectedCompanyId, convId);

      const finalContent = result.content || '';
      set((s) => ({
        conversations: s.conversations.map((c) =>
          c.id === convId
            ? {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === assistantMsg.id ? { ...m, content: finalContent, streaming: false } : m
                ),
              }
            : c
        ),
        streaming: false,
      }));
    } catch (err) {
      const detail =
        (err as any)?.response?.data?.detail ||
        (err as Error)?.message ||
        'Failed to process attachment';
      set((s) => ({
        conversations: s.conversations.map((c) =>
          c.id === convId
            ? {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === assistantMsg.id ? { ...m, content: `⚠️ ${detail}`, streaming: false } : m
                ),
              }
            : c
        ),
        streaming: false,
      }));
      throw err;
    }
  },

  regenerateLast: async () => {
    const conv = get().getActiveConversation();
    if (!conv) return;
    const lastUser = [...conv.messages].reverse().find((m) => m.role === 'user');
    if (!lastUser) return;
    await get().sendMessage(lastUser.content);
  },

  setReaction: (messageId, liked) =>
    set((s) => ({
      conversations: s.conversations.map((c) => ({
        ...c,
        messages: c.messages.map((m) =>
          m.id === messageId ? { ...m, liked: m.liked === liked ? null : liked } : m
        ),
      })),
    })),

  openCitation: (source) => set({ pendingCitation: source }),
  clearPendingCitation: () => set({ pendingCitation: null }),
}));

