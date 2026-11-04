import Prism from 'prismjs';

// Import essential language grammars
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-markdown';

export const getLanguageFromPath = (filePath: string, fallbackLang?: string): string => {
  const lower = (filePath || '').toLowerCase();
  if (lower.endsWith('.html') || lower.endsWith('.htm') || lower.endsWith('.svg') || fallbackLang === 'html') {
    return 'markup';
  }
  if (lower.endsWith('.css') || lower.endsWith('.scss') || fallbackLang === 'css') {
    return 'css';
  }
  if (lower.endsWith('.tsx')) {
    return 'tsx';
  }
  if (lower.endsWith('.jsx')) {
    return 'jsx';
  }
  if (lower.endsWith('.ts') || fallbackLang === 'typescript') {
    return 'typescript';
  }
  if (lower.endsWith('.js') || lower.endsWith('.mjs') || fallbackLang === 'javascript') {
    return 'javascript';
  }
  if (lower.endsWith('.json') || fallbackLang === 'json') {
    return 'json';
  }
  if (lower.endsWith('.md') || fallbackLang === 'markdown') {
    return 'markdown';
  }
  return 'markup';
};

export const getLanguageBadgeLabel = (filePath: string, fallbackLang?: string): string => {
  const lang = getLanguageFromPath(filePath, fallbackLang);
  switch (lang) {
    case 'markup':
      return 'HTML';
    case 'css':
      return 'CSS';
    case 'typescript':
      return 'TypeScript';
    case 'tsx':
      return 'React TSX';
    case 'jsx':
      return 'React JSX';
    case 'javascript':
      return 'JavaScript';
    case 'json':
      return 'JSON';
    case 'markdown':
      return 'Markdown';
    default:
      return (fallbackLang || 'Código').toUpperCase();
  }
};

export const highlightCode = (code: string, filePathOrLang: string): string => {
  if (!code) return '';
  const langKey = getLanguageFromPath(filePathOrLang);
  const grammar = Prism.languages[langKey] || Prism.languages.javascript || Prism.languages.markup;

  try {
    return Prism.highlight(code, grammar, langKey);
  } catch {
    return escapeHtml(code);
  }
};

const escapeHtml = (text: string): string => {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
};
