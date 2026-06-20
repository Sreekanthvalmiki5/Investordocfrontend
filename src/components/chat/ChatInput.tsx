import { useEffect, useRef, useState } from 'react';
import { Paperclip, ArrowUp, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useChatStore } from '@/store/chat.store';
import { cn } from '@/lib/utils';

export function ChatInput({ showSuggestions: _showSuggestions }: { showSuggestions?: boolean }) {
  const [value, setValue] = useState('');
  const streaming = useChatStore((s) => s.streaming);
  const sendMessage = useChatStore((s) => s.sendMessage);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Resize textarea to fit content whenever value changes
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 200) + 'px';
  }, [value]);

  const submit = () => {
    const text = value.trim();
    if (!text || streaming) return;
    setValue('');
    void sendMessage(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="border-t border-border bg-background/80 backdrop-blur-sm px-4 py-3">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-end gap-2 rounded-xl border border-border bg-card px-3 py-2 focus-within:border-primary/50 transition-colors">
          <button
            className="shrink-0 size-8 grid place-items-center rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition"
            aria-label="Attach file"
            type="button"
          >
            <Paperclip className="size-4" />
          </button>

          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about any company, filing, or financial metric…"
            rows={1}
            className="flex-1 resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none min-h-[32px] max-h-[200px] py-1"
          />

          <Button
            onClick={streaming ? undefined : submit}
            size="icon"
            className={cn(
              'shrink-0 size-8 rounded-lg transition',
              streaming ? 'bg-destructive hover:bg-destructive/90' : 'bg-primary hover:bg-primary/90'
            )}
            aria-label={streaming ? 'Stop' : 'Send'}
          >
            {streaming ? <Square className="size-3.5" /> : <ArrowUp className="size-3.5" />}
          </Button>
        </div>
        <p className="text-center text-[10px] text-muted-foreground mt-2">
          InvestorDocs AI may make mistakes. Always verify against source filings.
        </p>
      </div>
    </div>
  );
}
