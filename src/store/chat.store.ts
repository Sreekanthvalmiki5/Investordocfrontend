import { create } from 'zustand';
import type { AiModel, ChatMessage, Conversation, SourceCitation } from '@/types';
import { chatService } from '@/services/api';

interface ChatState {
  conversations: Conversation[];
  activeConversationId: string | null;
  selectedModel: AiModel;
  selectedCompanyId?: string;
  loadingConversations: boolean;
  streaming: boolean;
  pendingCitation?: SourceCitation | null;
  init: () => Promise<void>;
  selectConversation: (id: string | null) => void;
  newConversation: () => Promise<string>;
  renameConversation: (id: string, title: string) => void;
  deleteConversation: (id: string) => void;
  pinConversation: (id: string) => void;
  archiveConversation: (id: string) => void;
  setModel: (model: AiModel) => void;
  setCompany: (companyId?: string) => void;
  findConversation: (id: string) => Conversation | undefined;
  getActiveConversation: () => Conversation | null;
  sendMessage: (content: string) => Promise<void>;
  regenerateLast: () => Promise<void>;
  setReaction: (messageId: string, liked: boolean | null) => void;
  openCitation: (source: SourceCitation) => void;
  clearPendingCitation: () => void;
}

function uid(prefix: string) {
  return prefix + '_' + Math.random().toString(36).slice(2, 9);
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  activeConversationId: null,
  selectedModel: 'gpt-5',
  selectedCompanyId: undefined,
  loadingConversations: false,
  streaming: false,
  pendingCitation: null,

  init: async () => {
    set({ loadingConversations: true });
    const conversations = await chatService.listConversations();
    set({ conversations, loadingConversations: false });
  },

  selectConversation: (id) => set({ activeConversationId: id }),

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

  sendMessage: async (content) => {
    const state = get();
    let convId = state.activeConversationId;
    if (!convId) convId = await get().newConversation();

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

    const stream = chatService.streamResponse(
      content,
      state.selectedModel,
      state.selectedCompanyId,
      convId,
    );
    let acc = '';
    let sources: ChatMessage['sources'] | undefined;
    for await (const chunk of stream) {
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
