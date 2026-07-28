import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export function Markdown({ content }: { content: string }) {
  return (
    <div className="prose-chat">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}

export function StreamingCaret() {
  return <span className="inline-block w-1.5 h-3.5 bg-primary animate-blink ml-0.5 align-middle" />;
}
