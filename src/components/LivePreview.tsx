import React, { useState, useEffect, useRef } from 'react';
import { 
  RotateCcw, 
  Smartphone, 
  Tablet, 
  Monitor, 
  Eye, 
  ArrowLeft,
  Plus,
  FileCode,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { Project } from '../types';

interface LivePreviewProps {
  project: Project;
  isDragging?: boolean;
  workspaceLayout?: 'split' | 'code-only' | 'preview-only';
  onSelectLayout?: (layout: 'split' | 'code-only' | 'preview-only') => void;
  onExitPreview?: () => void;
  onToggleFullPreview?: () => void;
}

export const LivePreview: React.FC<LivePreviewProps> = ({ 
  project, 
  isDragging = false,
  workspaceLayout = 'split',
  onSelectLayout,
  onExitPreview,
  onToggleFullPreview,
}) => {
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [refreshKey, setRefreshKey] = useState(0);
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const [isBundling, setIsBundling] = useState(false);
  const [bundleError, setBundleError] = useState<string | null>(null);

  const files = project.files || {};
  const hasFiles = Object.keys(files).length > 0;
  const entryPath = project.entryFile || 'index.html';
  const entryFile = files[entryPath] || files['index.html'] || Object.values(files)[0];

  const bundleTimeoutRef = useRef<any>(null);

  useEffect(() => {
    if (!hasFiles || !entryFile) {
      setPreviewHtml('');
      setBundleError(null);
      return;
    }

    clearTimeout(bundleTimeoutRef.current);

    // Debounce to allow user to type without bundling every keystroke
    bundleTimeoutRef.current = setTimeout(async () => {
      // 1. Check if the project is a React/TSX/JSX project
      const filePaths = Object.keys(files);
      const isReact = filePaths.some((p) => /\.(tsx|jsx)$/i.test(p)) ||
        'src/main.tsx' in files ||
        'src/App.tsx' in files ||
        'src/App.jsx' in files;

      if (isReact) {
        setIsBundling(true);
        setBundleError(null);

        try {
          const fileMap: Record<string, string> = {};
          Object.entries(files).forEach(([p, f]) => {
            fileMap[p] = f.content;
          });

          const reactEntry = (project.entryFile && !project.entryFile.endsWith('.html') && !project.entryFile.endsWith('.htm'))
            ? project.entryFile
            : ('src/main.tsx' in files ? 'src/main.tsx' : 'src/App.tsx' in files ? 'src/App.tsx' : undefined);

          const res = await fetch('/api/preview-bundle', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              files: fileMap,
              entryPoint: reactEntry,
            }),
          });

          const data = await res.json();

          if (data.success && data.bundledJs) {
            const html = `<!doctype html>
<html lang="pt" class="h-full">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(project.name || 'Aplicação React')}</title>
  <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
  <script type="importmap">
  {
    "imports": {
      "react": "https://esm.sh/react@19",
      "react/": "https://esm.sh/react@19/",
      "react/jsx-runtime": "https://esm.sh/react@19/jsx-runtime",
      "react-dom": "https://esm.sh/react-dom@19",
      "react-dom/": "https://esm.sh/react-dom@19/",
      "react-dom/client": "https://esm.sh/react-dom@19/client",
      "lucide-react": "https://esm.sh/lucide-react@0.468.0",
      "clsx": "https://esm.sh/clsx@2.1.1",
      "date-fns": "https://esm.sh/date-fns@4.1.0"
    }
  }
  </script>
  <style>
    ${data.bundledCss || ''}
  </style>
</head>
<body class="bg-neutral-950 text-neutral-100 min-h-screen antialiased">
  <div id="root"></div>
  <script type="module">
    ${data.bundledJs}
  </script>
</body>
</html>`;
            setPreviewHtml(html);
            setBundleError(null);
          } else if (data.error) {
            setBundleError(data.error);
          }
        } catch (err: any) {
          console.error('[LivePreview Bundle Error]', err);
          setBundleError(err.message || 'Falha ao compilar projeto React.');
        } finally {
          setIsBundling(false);
        }
        return;
      }

      // 2. Pure Static HTML/CSS/JS Project
      setBundleError(null);
      let html = entryFile.content || '';

      // Fallback wrapper if non-HTML entry
      if (!entryFile.path.endsWith('.html')) {
        if (entryFile.path.endsWith('.css')) {
          html = `<!doctype html><html><head><style>${entryFile.content}</style></head><body style="padding: 2rem; font-family: sans-serif; background: #0f172a; color: #f8fafc;"><h1>Folha de Estilos: ${entryFile.path}</h1><p>Estilos carregados no ambiente de teste.</p></body></html>`;
        } else {
          html = `<!doctype html><html><head><meta charset="utf-8"/><title>${escapeHtml(project.name)}</title></head><body style="padding: 2rem; font-family: monospace; background: #0f172a; color: #f8fafc;"><h2>Script (${entryFile.path}):</h2><pre>${escapeHtml(entryFile.content)}</pre></body></html>`;
        }
        setPreviewHtml(html);
        return;
      }

      // CRITICAL ANTI-RECURSION: Remove any script referencing host /src/main.tsx or host scripts
      html = html.replace(/<script[^>]+src=["']\/?(src\/)?main\.(tsx|jsx|ts|js)["'][^>]*>\s*<\/script>/gi, '');
      html = html.replace(/<script[^>]+src=["']\/?src\/[^"']+["'][^>]*>\s*<\/script>/gi, '');

      // Embed CSS files referenced in project
      Object.entries(files).forEach(([path, file]) => {
        if (path.endsWith('.css') && file.content) {
          const fileName = path.split('/').pop() || path;
          const linkTagRegex = new RegExp(`<link[^>]+href=["'](\\./|/)??(${escapeRegex(path)}|${escapeRegex(fileName)})["'][^>]*>`, 'gi');
          if (linkTagRegex.test(html)) {
            html = html.replace(linkTagRegex, `<style>/* ${path} */\n${file.content}\n</style>`);
          } else if (!html.includes(file.content)) {
            html = html.replace('</head>', `<style>/* ${path} */\n${file.content}\n</style></head>`);
          }
        }
      });

      // Embed JS files referenced in project
      Object.entries(files).forEach(([path, file]) => {
        if (path.endsWith('.js') && file.content) {
          const fileName = path.split('/').pop() || path;
          const scriptTagRegex = new RegExp(`<script[^>]+src=["'](\\./|/)??(${escapeRegex(path)}|${escapeRegex(fileName)})["'][^>]*>\\s*</script>`, 'gi');
          if (scriptTagRegex.test(html)) {
            html = html.replace(scriptTagRegex, `<script>/* ${path} */\n${file.content}\n</script>`);
          } else if (!html.includes(file.content)) {
            html = html.replace('</body>', `<script>/* ${path} */\n${file.content}\n</script></body>`);
          }
        }
      });

      // Ensure Tailwind CSS browser CDN is included if not present
      if (!html.includes('tailwindcss')) {
        html = html.replace('</head>', '<script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script></head>');
      }

      setPreviewHtml(html);
    }, 150);

    return () => clearTimeout(bundleTimeoutRef.current);
  }, [project.files, project.entryFile, entryFile, refreshKey]);

  const deviceWidthClass = {
    desktop: 'w-full',
    tablet: 'w-[768px] max-w-full',
    mobile: 'w-[375px] max-w-full',
  }[device];

  return (
    <div className="flex-1 flex flex-col h-full bg-neutral-100 dark:bg-[#07070a] overflow-hidden select-none">
      {/* Top Controls Toolbar */}
      {/* Live Preview Toolbar: In preview-only mode, displays the Voltar button to return */}
      <div className="h-11 px-3 bg-white dark:bg-[#0e0e12] border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-xs shrink-0 z-10 gap-2">
        {/* Left Side: Show Voltar ONLY in preview-only mode as requested */}
        <div className="flex items-center gap-2">
          {workspaceLayout === 'preview-only' && onExitPreview && (
            <button
              type="button"
              onClick={onExitPreview}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-white font-semibold text-xs shadow-xs transition-all cursor-pointer"
              title="Voltar ao Editor"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar</span>
            </button>
          )}
        </div>

        {/* Center: Device Switcher */}
        <div className="flex items-center gap-1 p-0.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
          <button
            onClick={() => setDevice('desktop')}
            className={`p-1.5 rounded transition-colors cursor-pointer ${
              device === 'desktop'
                ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs font-semibold'
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
            }`}
            title="Ecrã Desktop (100%)"
          >
            <Monitor className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setDevice('tablet')}
            className={`p-1.5 rounded transition-colors cursor-pointer ${
              device === 'tablet'
                ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs font-semibold'
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
            }`}
            title="Ecrã Tablet (768px)"
          >
            <Tablet className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setDevice('mobile')}
            className={`p-1.5 rounded transition-colors cursor-pointer ${
              device === 'mobile'
                ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs font-semibold'
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
            }`}
            title="Ecrã Móvel (375px)"
          >
            <Smartphone className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right Side: Reload Preview Button */}
        <div className="flex items-center gap-1.5">
          {isBundling && (
            <div className="flex items-center gap-1 text-[11px] text-neutral-400 font-mono">
              <Loader2 className="w-3 h-3 animate-spin text-neutral-400" />
              <span className="hidden sm:inline">A compilar...</span>
            </div>
          )}
          <button
            onClick={() => setRefreshKey((prev) => prev + 1)}
            className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            title="Recarregar Pré-visualização"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Frame Container */}
      <div className="flex-1 flex items-center justify-center p-2 sm:p-4 bg-neutral-200/60 dark:bg-[#050507] overflow-auto relative">
        {/* Overlay while dragging dividers to prevent iframe capturing pointer events */}
        {isDragging && <div className="absolute inset-0 z-50 bg-transparent" />}

        {!hasFiles || !entryFile ? (
          <div className="max-w-md w-full p-8 rounded-2xl bg-white dark:bg-[#111116] border border-neutral-300 dark:border-neutral-800 shadow-xl text-center space-y-4 animate-in fade-in">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-300 flex items-center justify-center">
              <FileCode className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                Nenhum ficheiro para pré-visualizar
              </h3>
              <p className="text-xs text-neutral-500 leading-relaxed">
                O projeto está em branco. Escreva no chat da IA à esquerda para gerar o seu website ou adicione novos ficheiros.
              </p>
            </div>

            {onExitPreview && (
              <div className="flex items-center justify-center pt-2">
                <button
                  type="button"
                  onClick={onExitPreview}
                  className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 font-semibold text-xs transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Voltar ao Editor</span>
                </button>
              </div>
            )}
          </div>
        ) : bundleError ? (
          <div className="max-w-lg w-full p-6 rounded-2xl bg-neutral-900 border border-red-900/60 shadow-2xl text-left space-y-3 font-mono">
            <div className="flex items-center gap-2 text-red-400 text-sm font-bold">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Erro de compilação na pré-visualização</span>
            </div>
            <p className="text-xs text-neutral-300 whitespace-pre-wrap bg-neutral-950 p-3 rounded-lg border border-neutral-800 overflow-x-auto max-h-60">
              {bundleError}
            </p>
            <div className="flex items-center justify-between text-[11px] text-neutral-400 pt-1 font-sans">
              <span>Edite os ficheiros no centro ou solicite correção ao assistente.</span>
              <button
                type="button"
                onClick={() => setRefreshKey((k) => k + 1)}
                className="px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-white font-medium cursor-pointer"
              >
                Tentar novamente
              </button>
            </div>
          </div>
        ) : (
          <div
            className={`${deviceWidthClass} h-full bg-white rounded-xl shadow-lg border border-neutral-300 dark:border-neutral-800 overflow-hidden transition-all duration-200 flex flex-col`}
          >
            <iframe
              key={refreshKey}
              title="Live Preview"
              srcDoc={previewHtml}
              className="w-full h-full border-0 bg-white"
              sandbox="allow-scripts allow-modals allow-same-origin allow-forms"
            />
          </div>
        )}
      </div>
    </div>
  );
};

function escapeHtml(str: string): string {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
