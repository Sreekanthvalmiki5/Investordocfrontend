import { useState } from 'react';
import { Copy, Check, ThumbsUp, ThumbsDown, RefreshCw, BarChart3 } from 'lucide-react';
import type { ChatMessage } from '@/types';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Markdown, StreamingCaret } from '@/components/chat/Markdown';
import { SourceCitations } from '@/components/chat/SourceCitations';
import { useChatStore } from '@/store/chat.store';
import { MODELS } from '@/services/mockData';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Props {
  message: ChatMessage;
  isLastAssistant?: boolean;
}

export function MessageBubble({ message, isLastAssistant }: Props) {
  const isUser = message.role === 'user';
  const setReaction = useChatStore((s) => s.setReaction);
  const regenerate = useChatStore((s) => s.regenerateLast);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 1500);
  };

  if (isUser) {
    return (
      <div className="flex justify-end px-4 md:px-6 py-3 animate-fade-in-up">
        <div className="max-w-[78%] bg-primary text-primary-foreground rounded-2xl rounded-br-sm px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap">
          {message.content}
        </div>
      </div>
    );
  }

  const model = MODELS.find((m) => m.id === message.model);

  return (
    <div className="px-4 md:px-6 py-4 animate-fade-in-up">
      <div className="flex gap-3 max-w-3xl">
        <Avatar className="size-8 rounded-md border border-border shrink-0">
          <AvatarFallback className="bg-primary/15 text-primary rounded-md size-8">
            <BarChart3 className="size-4" />
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold">InvestorDocs AI</span>
            {model && <span className="text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">{model.label}</span>}
          </div>

          {message.content ? (
            <Markdown content={message.content} />
          ) : (
            <TypingIndicator />
          )}
          {message.streaming && message.content && <StreamingCaret />}

          {!message.streaming && message.content && (
            <>
              <SourceCitations sources={message.sources ?? []} />

              <div className="flex items-center gap-1 mt-3 -ml-2">
                <ActionButton onClick={copy} title="Copy">
                  {copied ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5" />}
                </ActionButton>
                {isLastAssistant && (
                  <ActionButton onClick={() => regenerate()} title="Regenerate">
                    <RefreshCw className="size-3.5" />
                  </ActionButton>
                )}
                <ActionButton
                  onClick={() => setReaction(message.id, true)}
                  title="Good response"
                  active={message.liked === true}
                >
                  <ThumbsUp className={cn('size-3.5', message.liked === true && 'text-success')} />
                </ActionButton>
                <ActionButton
                  onClick={() => setReaction(message.id, false)}
                  title="Bad response"
                  active={message.liked === false}
                >
                  <ThumbsDown className={cn('size-3.5', message.liked === false && 'text-destructive')} />
                </ActionButton>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ActionButton({
  children,
  onClick,
  title,
  active,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  title: string;
  active?: boolean;
}) {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      title={title}
      className={cn('size-7 hover:bg-secondary', active && 'bg-secondary')}
    >
      {children}
    </Button>
  );
}

export function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 py-2">
      <span className="size-2 rounded-full bg-muted-foreground/60 typing-dot" style={{ animationDelay: '0ms' }} />
      <span className="size-2 rounded-full bg-muted-foreground/60 typing-dot" style={{ animationDelay: '160ms' }} />
      <span className="size-2 rounded-full bg-muted-foreground/60 typing-dot" style={{ animationDelay: '320ms' }} />
    </div>
  );
}
