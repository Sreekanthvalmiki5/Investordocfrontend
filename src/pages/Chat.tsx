import { useParams } from '@tanstack/react-router';
import { useEffect, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatInput } from '@/components/chat/ChatInput';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { useChatStore } from '@/store/chat.store';

export function ChatPage() {
  const { chatId } = useParams({ from: '/chat/$chatId' });
  const conversation = useChatStore((s) => s.conversations.find((c) => c.id === chatId));
  const selectConversation = useChatStore((s) => s.selectConversation);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatId) selectConversation(chatId);
  }, [chatId, selectConversation]);

  useEffect(() => {
    const el = scrollRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    if (el) el.scrollTop = el.scrollHeight;
  }, [conversation?.messages, scrollRef]);

  if (!conversation) {
    return (
      <div className="h-full grid place-items-center text-sm text-muted-foreground">
        Conversation not found.
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
              <p className="text-sm text-muted-foreground">Start a new conversation below.</p>
            </div>
          ) : (
            messages.map((m) => (
              <MessageBubble key={m.id} message={m} isLastAssistant={m.id === lastAssistantId} />
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
