import React, { useState } from 'react';
import { Copy, Check, Code2 } from 'lucide-react';
import { highlightCode, getLanguageBadgeLabel } from '../utils/prismHighlighter';

interface FormattedMessageContentProps {
  content: string;
}

export const FormattedMessageContent: React.FC<FormattedMessageContentProps> = ({ content }) => {
  const [copiedSnippetIndex, setCopiedSnippetIndex] = useState<number | null>(null);

  if (!content) return null;

  // Split content by markdown code blocks: ```lang ... ```
  const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let snippetCount = 0;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    const textBefore = content.substring(lastIndex, match.index);
    if (textBefore) {
      parts.push(
        <span key={`text-${lastIndex}`} className="whitespace-pre-wrap leading-relaxed">
          {renderInlineFormatting(textBefore)}
        </span>
      );
    }

    const language = match[1] || 'markup';
    const code = match[2] || '';
    const currentIndex = snippetCount;
    snippetCount++;

    const highlighted = highlightCode(code, language);
    const badge = getLanguageBadgeLabel(language, language);

    parts.push(
      <div
        key={`code-${match.index}`}
        className="my-2.5 rounded-xl overflow-hidden border border-[#2d2d2d] bg-[#1e1e1e] shadow-lg font-mono text-xs"
      >
        <div className="flex items-center justify-between px-3 py-1.5 bg-[#181818] border-b border-[#2d2d2d] text-[11px] text-neutral-400 select-none">
          <div className="flex items-center gap-2">
            <Code2 className="w-3.5 h-3.5 text-sky-400" />
            <span className="font-semibold text-neutral-300">{badge}</span>
            <span className="text-[9px] px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-400 uppercase">
              VS Code
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(code);
              setCopiedSnippetIndex(currentIndex);
              setTimeout(() => setCopiedSnippetIndex(null), 2000);
            }}
            className="flex items-center gap-1 px-2 py-0.5 rounded hover:bg-[#282828] text-neutral-400 hover:text-white transition-colors cursor-pointer"
            title="Copiar código"
          >
            {copiedSnippetIndex === currentIndex ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400 text-[10px]">Copiado</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3 text-neutral-400" />
                <span className="text-[10px]">Copiar</span>
              </>
            )}
          </button>
        </div>

        <pre className={`p-3 overflow-x-auto text-[12px] leading-5 font-mono m-0 bg-[#1e1e1e] language-${language}`}>
          <code
            className={`language-${language}`}
            dangerouslySetInnerHTML={{ __html: highlighted }}
          />
        </pre>
      </div>
    );

    lastIndex = match.index + match[0].length;
  }

  const remainingText = content.substring(lastIndex);
  if (remainingText) {
    parts.push(
      <span key={`text-end`} className="whitespace-pre-wrap leading-relaxed">
        {renderInlineFormatting(remainingText)}
      </span>
    );
  }

  return <div className="space-y-1">{parts}</div>;
};

// Basic inline markdown: bold (**text**) and inline code (`code`)
function renderInlineFormatting(text: string): React.ReactNode {
  const inlineRegex = /(`[^`]+`|\*\*[^*]+\*\*)/g;
  const parts = text.split(inlineRegex);

  return parts.map((part, index) => {
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      const codeText = part.slice(1, -1);
      return (
        <code
          key={index}
          className="px-1.5 py-0.5 rounded bg-neutral-800/80 text-amber-300 font-mono text-[11px] border border-neutral-700/60"
        >
          {codeText}
        </code>
      );
    }
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <strong key={index} className="font-bold text-neutral-100">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}
