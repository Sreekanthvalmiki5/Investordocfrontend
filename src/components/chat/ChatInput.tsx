import { useEffect, useRef, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { ArrowUp, ImagePlus, Mic, Square, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useChatStore } from '@/store/chat.store';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const MAX_IMAGE_MB = 10;

export function ChatInput({ showSuggestions: _showSuggestions }: { showSuggestions?: boolean }) {
  const [value, setValue] = useState('');
  const streaming = useChatStore((s) => s.streaming);
  const sendMessage = useChatStore((s) => s.sendMessage);
  const sendAttachment = useChatStore((s) => s.sendAttachment);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const navigate = useNavigate();

  // ── Voice recording state ────────────────────────────────────────────────
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // ── Image attachment state ───────────────────────────────────────────────
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Resize textarea to fit content whenever value changes
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 200) + 'px';
  }, [value]);

  // Revoke object URLs when the preview changes / unmounts
  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  const pickImage = (file: File | undefined | null) => {
    if (!file) return;
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      toast.error('Unsupported image format. Please use PNG, JPG, JPEG, or WebP.');
      return;
    }
    if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
      toast.error(`Image is too large. Maximum size is ${MAX_IMAGE_MB} MB.`);
      return;
    }
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview(null);
  };

  const toggleRecording = async () => {
    if (recording) {
      mediaRecorderRef.current?.stop();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        setRecording(false);
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        if (blob.size < 1000) {
          toast.error('Recording was too short. Please try again.');
          return;
        }
        await sendAttachment('voice', blob, undefined, (newId) => {
          navigate({ to: '/chat/$chatId', params: { chatId: newId } });
        });
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecording(true);
    } catch {
      toast.error('Microphone access was denied. Check your browser permissions and try again.');
    }
  };

  const submit = async () => {
    if (streaming) return;

    // Image attached — require a question, then run image + RAG analysis.
    if (imageFile) {
      const question = value.trim();
      if (!question) {
        toast.error('Ask a question about the image, e.g. "What is EBITDA?"');
        return;
      }
      const file = imageFile;
      setValue('');
      removeImage();
      await sendAttachment('image', file, question, (newId) => {
        navigate({ to: '/chat/$chatId', params: { chatId: newId } });
      });
      return;
    }

    const text = value.trim();
    if (!text) return;
    setValue('');
    void sendMessage(text, (newId) => {
      navigate({ to: '/chat/$chatId', params: { chatId: newId } });
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const canSend = (value.trim().length > 0 || imageFile !== null) && !streaming && !recording;

  return (
    <div className="border-t border-border bg-background/80 backdrop-blur-sm px-4 py-3">
      <div className="max-w-3xl mx-auto">
        {/* Recording indicator */}
        {recording && (
          <div className="flex items-center gap-2 px-3 py-1.5 mb-2 rounded-lg bg-destructive/10 text-destructive text-xs font-medium">
            <span className="relative flex size-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
              <span className="relative inline-flex rounded-full size-2.5 bg-destructive" />
            </span>
            Recording… click the mic to stop
          </div>
        )}

        {/* Image preview */}
        {imagePreview && (
          <div className="flex items-center gap-3 mb-2 rounded-xl border border-border bg-card p-2 pr-3">
            <img
              src={imagePreview}
              alt="Attachment preview"
              className="size-12 rounded-lg object-cover border border-border"
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{imageFile?.name ?? 'image'}</p>
              <p className="text-[11px] text-muted-foreground">Attached image — will be analyzed with your question</p>
            </div>
            <button
              type="button"
              onClick={removeImage}
              aria-label="Remove image"
              className="size-7 grid place-items-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition"
            >
              <X className="size-4" />
            </button>
          </div>
        )}

        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            pickImage(e.dataTransfer.files?.[0]);
          }}
          className={cn(
            'flex items-end gap-2 rounded-xl border border-border bg-card px-3 py-2 transition-colors',
            'focus-within:border-primary/50',
            dragOver && 'border-primary/60 ring-2 ring-primary/20',
            imagePreview && 'border-primary/40'
          )}
        >
          {/* Image attach */}
          <button
            className="shrink-0 size-8 grid place-items-center rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition"
            aria-label="Attach image"
            type="button"
            onClick={() => fileInputRef.current?.click()}
          >
            <ImagePlus className="size-4" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => { pickImage(e.target.files?.[0]); e.target.value = ''; }}
          />

          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              imageFile
                ? 'Ask about this image, e.g. "What is EBITDA?"…'
                : 'Ask about any company, filing, or financial metric…'
            }
            rows={1}
            className="flex-1 resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none min-h-[32px] max-h-[200px] py-1"
          />

          {/* Mic */}
          <button
            className={cn(
              'shrink-0 size-8 grid place-items-center rounded-md transition',
              recording
                ? 'bg-destructive/15 text-destructive animate-pulse'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
            )}
            aria-label={recording ? 'Stop recording' : 'Record voice query'}
            type="button"
            disabled={streaming}
            onClick={toggleRecording}
          >
            {recording ? <Square className="size-3.5" /> : <Mic className="size-4" />}
          </button>

          <Button
            onClick={canSend ? submit : undefined}
            size="icon"
            disabled={!canSend}
            className={cn(
              'shrink-0 size-8 rounded-lg transition',
              streaming ? 'bg-destructive hover:bg-destructive/90' : 'bg-primary hover:bg-primary/90',
              !canSend && 'opacity-50 cursor-not-allowed'
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
