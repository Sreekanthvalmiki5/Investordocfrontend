import { useParams } from '@tanstack/react-router';
import { useEffect, useRef, useCallback } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { ChatInput } from '@/components/chat/ChatInput';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { useChatStore } from '@/store/chat.store';

export function ChatPage() {
  const { chatId } = useParams({ from: '/chat/$chatId' });
  const conversation = useChatStore((s) => s.conversations.find((c) => c.id === chatId));
  const selectConversation = useChatStore((s) => s.selectConversation);
  const loadMessages = useChatStore((s) => s.loadMessages);
  const loadingMessages = useChatStore((s) => s.loadingMessages);
  const errorMessages = useChatStore((s) => s.errorMessages);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Sync route param with store and load messages
  useEffect(() => {
    if (!chatId) return;
    selectConversation(chatId);
    loadMessages(chatId);
  }, [chatId, selectConversation, loadMessages]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    const el = scrollRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    if (el) el.scrollTop = el.scrollHeight;
  }, [conversation?.messages, scrollRef]);

  const handleRetry = useCallback(() => {
    if (chatId) loadMessages(chatId);
  }, [chatId, loadMessages]);

  // ── Loading state ──
  if (loadingMessages) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex-1 grid place-items-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Loading conversation...</p>
          </div>
        </div>
        <div className="shrink-0">
          <ChatInput showSuggestions={false} />
        </div>
      </div>
    );
  }

  // ── Error state ──
  if (errorMessages) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex-1 grid place-items-center">
          <div className="flex flex-col items-center gap-4 max-w-sm text-center">
            <p className="text-sm text-muted-foreground">{errorMessages}</p>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={handleRetry}>
              <RefreshCw className="size-3.5" /> Retry
            </Button>
          </div>
        </div>
        <div className="shrink-0">
          <ChatInput showSuggestions={false} />
        </div>
      </div>
    );
  }

  // ── Conversation not found ──
  if (!conversation) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex-1 grid place-items-center text-sm text-muted-foreground">
          Conversation not found.
        </div>
        <div className="shrink-0">
          <ChatInput showSuggestions={false} />
        </div>
      </div>
    );
  }

  const messages = conversation.messages;
  const lastAssistantId = [...messages].reverse().find((m) => m.role === 'assistant')?.id;

  return (
    <div className="h-full flex flex-col">
      <ScrollArea ref={scrollRef} className="flex-1 min-h-0 scrollbar-thin">
        <div className="max-w-3xl mx-auto py-4">
          {messages.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-sm text-muted-foreground">No messages in this conversation.</p>
            </div>
          ) : (
            messages.map((m) => (
              <MessageBubble
                key={m.id}
                message={m}
                isLastAssistant={m.id === lastAssistantId}
              />
            ))
          )}
        </div>
      </ScrollArea>
      <div className="shrink-0">
        <ChatInput showSuggestions={messages.length === 0} />
      </div>
    </div>
  );
}
