import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Copy, 
  Check, 
  FileCode, 
  Code2, 
  WrapText,
  FileCheck
} from 'lucide-react';
import { ProjectFile } from '../types';
import { highlightCode, getLanguageBadgeLabel, getLanguageFromPath } from '../utils/prismHighlighter';

interface CodeEditorProps {
  file: ProjectFile | null;
  onChangeContent: (newContent: string) => void;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({ file, onChangeContent }) => {
  const [copied, setCopied] = useState(false);
  const [wordWrap, setWordWrap] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);

  // Synchronize scrolling between textarea, highlighted pre block, and line numbers gutter
  const handleScroll = () => {
    if (!textareaRef.current) return;
    const { scrollTop, scrollLeft } = textareaRef.current;

    if (preRef.current) {
      preRef.current.scrollTop = scrollTop;
      preRef.current.scrollLeft = scrollLeft;
    }
    if (gutterRef.current) {
      gutterRef.current.scrollTop = scrollTop;
    }
  };

  // Reset scroll position on active file change
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.scrollTop = 0;
      textareaRef.current.scrollLeft = 0;
    }
    if (preRef.current) {
      preRef.current.scrollTop = 0;
      preRef.current.scrollLeft = 0;
    }
    if (gutterRef.current) {
      gutterRef.current.scrollTop = 0;
    }
  }, [file?.path]);

  // Handle Tab and smart Enter indentation like VS Code
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!file) return;

    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const value = target.value;

      const newValue = value.substring(0, start) + '  ' + value.substring(end);
      onChangeContent(newValue);

      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + 2;
      }, 0);
    } else if (e.key === 'Enter') {
      const target = e.currentTarget;
      const start = target.selectionStart;
      const value = target.value;

      // Extract indentation of the current line
      const lineStart = value.lastIndexOf('\n', start - 1) + 1;
      const currentLine = value.substring(lineStart, start);
      const match = currentLine.match(/^[ \t]+/);
      const indent = match ? match[0] : '';

      // If line ends with opening bracket or brace, add extra 2 spaces
      const extraIndent = /[{(\[]\s*$/.test(currentLine) ? '  ' : '';
      const totalIndent = indent + extraIndent;

      if (totalIndent.length > 0) {
        e.preventDefault();
        const end = target.selectionEnd;
        const insertText = '\n' + totalIndent;
        const newValue = value.substring(0, start) + insertText + value.substring(end);
        onChangeContent(newValue);

        setTimeout(() => {
          target.selectionStart = target.selectionEnd = start + insertText.length;
        }, 0);
      }
    }
  };

  const handleCopy = () => {
    if (!file) return;
    navigator.clipboard.writeText(file.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Generate syntax highlighted HTML with VS Code colors using Prism.js
  const highlightedHtml = useMemo(() => {
    if (!file) return '';
    return highlightCode(file.content, file.path);
  }, [file?.content, file?.path]);

  const lines = useMemo(() => {
    return (file?.content || '').split('\n');
  }, [file?.content]);

  if (!file) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#0d0d11] text-neutral-500 p-8 text-center select-none">
        <Code2 className="w-10 h-10 mb-3 opacity-30 text-neutral-400" />
        <p className="text-sm font-semibold text-neutral-300">Projeto em branco</p>
        <p className="text-xs text-neutral-500 max-w-sm mt-1 leading-relaxed">
          Nenhum ficheiro criado ainda. Peça à IA no chat à esquerda para gerar o website ou crie um ficheiro manualmente.
        </p>
      </div>
    );
  }

  const prismLang = getLanguageFromPath(file.path, file.language);
  const badgeLabel = getLanguageBadgeLabel(file.path, file.language);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#1e1e1e] text-neutral-200 overflow-hidden font-mono text-xs select-text">
      {/* Editor Sub-header Info (VS Code Dark+ Style) */}
      <div className="h-9 px-4 bg-[#181818] border-b border-[#2d2d2d] flex items-center justify-between text-[11px] text-neutral-400 select-none shrink-0">
        <div className="flex items-center gap-2.5">
          <FileCode className="w-4 h-4 text-sky-400" />
          <span className="font-semibold text-neutral-200 text-xs font-mono">{file.path}</span>
          <span className="text-[10px] px-2 py-0.5 rounded bg-[#252526] text-neutral-300 border border-[#3c3c3c] font-sans font-medium">
            {badgeLabel}
          </span>
          <div className="hidden sm:flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-emerald-950/40 text-emerald-400 border border-emerald-800/40">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>VS Code Dark+</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-neutral-400">{lines.length} linhas</span>
          <span className="text-neutral-500">{(file.content.length / 1024).toFixed(1)} KB</span>

          <button
            type="button"
            onClick={() => setWordWrap((prev) => !prev)}
            className={`p-1 rounded hover:bg-[#2a2a2a] transition-colors cursor-pointer ${
              wordWrap ? 'text-sky-400 bg-[#252526]' : 'text-neutral-400'
            }`}
            title="Quebra de linha automática (Word Wrap)"
          >
            <WrapText className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#252526] hover:bg-[#323233] text-neutral-300 hover:text-white border border-[#3c3c3c] transition-colors cursor-pointer"
            title="Copiar código formatado"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-medium">Copiado</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-neutral-400" />
                <span>Copiar</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Editor Workspace: Line Numbers + Dual-Layer Syntax Highlighted Editor */}
      <div className="flex-1 flex overflow-hidden relative bg-[#1e1e1e]">
        {/* Line Numbers Column */}
        <div
          ref={gutterRef}
          className="w-12 py-3 bg-[#1e1e1e] border-r border-[#2d2d2d] text-right pr-3 text-[#858585] select-none overflow-hidden shrink-0 font-mono text-[13px] leading-[22px]"
          aria-hidden="true"
        >
          {lines.map((_, i) => (
            <div key={i} className="hover:text-neutral-300 transition-colors">
              {i + 1}
            </div>
          ))}
        </div>

        {/* Code Canvas Container */}
        <div className="flex-1 relative h-full overflow-hidden">
          {/* Layer 1: Syntax Highlighted Code (VS Code Colors via Prism) */}
          <pre
            ref={preRef}
            className={`absolute inset-0 m-0 py-3 px-4 bg-transparent font-mono text-[13px] leading-[22px] pointer-events-none select-none overflow-hidden language-${prismLang} ${
              wordWrap ? 'whitespace-pre-wrap break-words' : 'whitespace-pre'
            }`}
            aria-hidden="true"
          >
            <code
              className={`language-${prismLang}`}
              dangerouslySetInnerHTML={{ __html: highlightedHtml + '\n' }}
            />
          </pre>

          {/* Layer 2: Interactive Textarea overlaid on top for editing, selection, and typing */}
          <textarea
            ref={textareaRef}
            value={file.content}
            onChange={(e) => onChangeContent(e.target.value)}
            onKeyDown={handleKeyDown}
            onScroll={handleScroll}
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
            autoCorrect="off"
            className={`absolute inset-0 w-full h-full py-3 px-4 bg-transparent text-transparent caret-white font-mono text-[13px] leading-[22px] resize-none focus:outline-none overflow-auto vscode-editor-selection ${
              wordWrap ? 'whitespace-pre-wrap break-words' : 'whitespace-pre'
            }`}
            style={{
              tabSize: 2,
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
            }}
          />
        </div>
      </div>

      {/* VS Code Status Bar Footnote */}
      <div className="h-6 px-3 bg-[#007acc]/10 border-t border-[#2d2d2d] flex items-center justify-between text-[10px] text-neutral-400 font-mono select-none shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-neutral-300 flex items-center gap-1">
            <FileCheck className="w-3 h-3 text-emerald-400" />
            <span>UTF-8</span>
          </span>
          <span>Espaços: 2</span>
        </div>
        <div className="flex items-center gap-2 text-neutral-400">
          <span>{badgeLabel}</span>
          <span>·</span>
          <span>Destaque de sintaxe ativo</span>
        </div>
      </div>
    </div>
  );
};
