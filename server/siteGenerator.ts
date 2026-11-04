/**
 * IMCH AI - Adaptive Project Generator
 *
 * ARQUITETURA:
 * 1. PLANNER: escolhe a tecnologia e define o projeto.
 * 2. CONFIGURATOR: cria automaticamente ficheiros estruturais.
 * 3. CODER: desenvolve os restantes ficheiros.
 * 4. VALIDATOR: verifica estrutura e conteúdo.
 *
 * TECNOLOGIAS:
 * - static-html
 * - react-vite
 *
 * IMPORTANTE:
 * - package.json não é gerado pelo modelo em React/Vite.
 * - vite.config.ts não é gerado pelo modelo.
 * - tsconfig.json não é gerado pelo modelo.
 * - A interface e o contrato generateSite() são preservados.
 */

export type ProjectTechnology = 'static-html' | 'react-vite';

export interface SiteColorPalette {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  accent: string;
}

export interface SiteFonts {
  heading: string;
  body: string;
}

export interface SiteSectionSpec {
  id: string;
  title: string;
  copy: string;
  details: string;
}

export interface SiteRoute {
  path: string;
  title: string;
  purpose: string;
}

export interface SiteSpec {
  siteName: string;
  language: string;
  description: string;
  palette: SiteColorPalette;
  fonts: SiteFonts;
  files: string[];
  sections: SiteSectionSpec[];
  projectType?: string;
  technologyStack?: ProjectTechnology;
  architectureSummary?: string;
  entryFile?: string;
  routes?: SiteRoute[];
  features?: string[];
  dependencies?: string[];
}

export interface SiteGeneratorOptions {
  briefing: string;
  model?: string;
  apiKey: string;
  onStep?: (event: {
    step: 'planning' | 'coding' | 'file_done' | 'warning' | 'done';
    message: string;
    file?: string;
    fileIndex?: number;
    totalFiles?: number;
    percent?: number;
    spec?: SiteSpec;
    fileData?: { path: string; content: string };
  }) => void;
}

export interface SiteGeneratorResult {
  spec: SiteSpec;
  files: Record<string, string>;
  warnings: string[];
  durationMs: number;
}

const OPENROUTER_URL =
  'https://openrouter.ai/api/v1/chat/completions';

const MAX_FILES = 60;
const MAX_BRIEFING_LENGTH = 30000;
const MAX_FILE_CONTENT_LENGTH = 250000;
const MAX_CONTEXT_LENGTH = 45000;
const REQUEST_TIMEOUT_MS = 120000;

const DEFAULT_PALETTE: SiteColorPalette = {
  primary: '#2563EB',
  secondary: '#1E293B',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  text: '#0F172A',
  accent: '#F59E0B',
};

const DEFAULT_FONTS: SiteFonts = {
  heading: 'Inter',
  body: 'Inter',
};

/**
 * Dependências adicionais reconhecidas.
 *
 * O gerador só adiciona pacotes conhecidos.
 * Não instala automaticamente nomes arbitrários enviados
 * pelo modelo no Planner.
 */
const KNOWN_DEPENDENCIES: Record<string, string> = {
  'lucide-react': '^0.468.0',
  'react-router-dom': '^6.28.1',
  'recharts': '^2.15.0',
  'date-fns': '^4.1.0',
  'framer-motion': '^11.15.0',
  'zustand': '^5.0.2',
  'react-hook-form': '^7.54.2',
  'zod': '^3.24.1',
  'sonner': '^1.7.1',
  'clsx': '^2.1.1',
  'tailwindcss': '^4.0.0',
  '@tailwindcss/vite': '^4.0.0',
  '@tanstack/react-query': '^5.62.0',
};

/**
 * Schema do Planner.
 */
const PLANNER_JSON_SCHEMA = {
  name: 'imch_adaptive_project_spec',
  strict: true,
  schema: {
    type: 'object',
    properties: {
      siteName: { type: 'string' },
      language: { type: 'string' },
      description: { type: 'string' },
      projectType: { type: 'string' },

      technologyStack: {
        type: 'string',
        enum: ['static-html', 'react-vite'],
      },

      architectureSummary: { type: 'string' },
      entryFile: { type: 'string' },

      palette: {
        type: 'object',
        properties: {
          primary: { type: 'string' },
          secondary: { type: 'string' },
          background: { type: 'string' },
          surface: { type: 'string' },
          text: { type: 'string' },
          accent: { type: 'string' },
        },
        required: [
          'primary',
          'secondary',
          'background',
          'surface',
          'text',
          'accent',
        ],
        additionalProperties: false,
      },

      fonts: {
        type: 'object',
        properties: {
          heading: { type: 'string' },
          body: { type: 'string' },
        },
        required: ['heading', 'body'],
        additionalProperties: false,
      },

      files: {
        type: 'array',
        items: { type: 'string' },
      },

      sections: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            title: { type: 'string' },
            copy: { type: 'string' },
            details: { type: 'string' },
          },
          required: ['id', 'title', 'copy', 'details'],
          additionalProperties: false,
        },
      },

      routes: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            path: { type: 'string' },
            title: { type: 'string' },
            purpose: { type: 'string' },
          },
          required: ['path', 'title', 'purpose'],
          additionalProperties: false,
        },
      },

      features: {
        type: 'array',
        items: { type: 'string' },
      },

      dependencies: {
        type: 'array',
        items: { type: 'string' },
      },
    },

    required: [
      'siteName',
      'language',
      'description',
      'projectType',
      'technologyStack',
      'architectureSummary',
      'entryFile',
      'palette',
      'fonts',
      'files',
      'sections',
      'routes',
      'features',
      'dependencies',
    ],

    additionalProperties: false,
  },
};

/**
 * Schema do Coder.
 */
const CODER_JSON_SCHEMA = {
  name: 'imch_project_file',
  strict: true,
  schema: {
    type: 'object',
    properties: {
      path: { type: 'string' },
      content: { type: 'string' },
    },
    required: ['path', 'content'],
    additionalProperties: false,
  },
};

/**
 * Erro padronizado.
 */
function createError(
  message: string,
  status = 500
): Error & { status: number } {
  const error = new Error(message) as Error & {
    status: number;
  };

  error.status = status;
  return error;
}

/**
 * Verifica placeholders e texto genérico.
 */
function containsForbiddenPlaceholders(text: string): boolean {
  const patterns = [
    /lorem ipsum/i,
    /texto de exemplo/i,
    /seu título aqui/i,
    /seu texto aqui/i,
    /placeholder text/i,
    /insira seu texto/i,
    /your text here/i,
    /insert text here/i,
    /sample text/i,
    /replace this text/i,
  ];

  return patterns.some((pattern) => pattern.test(text));
}

/**
 * Verifica se um caminho é relativo e seguro.
 */
function isSafeRelativePath(filePath: string): boolean {
  if (
    typeof filePath !== 'string' ||
    !filePath.trim() ||
    filePath.length > 240
  ) {
    return false;
  }

  const normalized = filePath.replace(/\\/g, '/');

  if (
    normalized.startsWith('/') ||
    /^[a-zA-Z]:/.test(normalized) ||
    normalized.includes('\0') ||
    normalized.includes('?') ||
    normalized.includes('#') ||
    normalized.split('/').some(
      (segment) =>
        segment === '..' ||
        segment === '.' ||
        segment.trim() === ''
    )
  ) {
    return false;
  }

  return /^[a-zA-Z0-9_\-./@+()]+$/.test(normalized);
}

/**
 * Normaliza caminhos.
 */
function normalizePath(filePath: string): string {
  return filePath.replace(/\\/g, '/').replace(/^\.\/+/, '');
}

/**
 * Obtém o nome do ficheiro.
 */
function getFileName(filePath: string): string {
  const normalized = normalizePath(filePath);
  return normalized.split('/').pop()?.toLowerCase() || '';
}

/**
 * Identifica pontos de entrada React.
 */
function isReactEntryFile(filePath: string): boolean {
  const name = getFileName(filePath);

  return (
    name === 'main.tsx' ||
    name === 'main.jsx' ||
    name === 'index.tsx' ||
    name === 'index.jsx'
  );
}

/**
 * Cria um slug seguro para o package.json.
 */
function createProjectSlug(siteName: string): string {
  const slug = siteName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);

  return slug || 'imch-project';
}

/**
 * Extrai dependências conhecidas da SPEC.
 */
function getProjectDependencies(
  spec: SiteSpec
): Record<string, string> {
  const dependencies: Record<string, string> = {
    react: '^19.0.0',
    'react-dom': '^19.0.0',
  };

  for (const item of spec.dependencies || []) {
    const packageName = item.trim();

    if (KNOWN_DEPENDENCIES[packageName]) {
      dependencies[packageName] =
        KNOWN_DEPENDENCIES[packageName];
    }
  }

  return dependencies;
}

/**
 * Gera package.json automaticamente.
 *
 * O modelo não participa na criação deste ficheiro.
 */
function generatePackageJson(spec: SiteSpec): string {
  const packageData = {
    name: createProjectSlug(spec.siteName),
    private: true,
    version: '1.0.0',
    type: 'module',

    scripts: {
      dev: 'vite',
      build: 'vite build',
      preview: 'vite preview',
    },

    dependencies: getProjectDependencies(spec),

    devDependencies: {
      '@vitejs/plugin-react': '^4.3.4',
      '@types/react': '^19.0.0',
      '@types/react-dom': '^19.0.0',
      typescript: '^5.7.2',
      vite: '^6.0.7',
    },
  };

  return JSON.stringify(packageData, null, 2);
}

/**
 * Gera vite.config.ts automaticamente.
 */
function generateViteConfig(): string {
  return `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
  },
  preview: {
    host: '0.0.0.0',
  },
});
`;
}

/**
 * Gera tsconfig.json automaticamente.
 */
function generateTsConfig(): string {
  const config = {
    compilerOptions: {
      target: 'ES2020',
      useDefineForClassFields: true,
      lib: ['ES2020', 'DOM', 'DOM.Iterable'],
      module: 'ESNext',
      skipLibCheck: true,
      moduleResolution: 'bundler',
      allowImportingTsExtensions: true,
      verbatimModuleSyntax: true,
      moduleDetection: 'force',
      noEmit: true,
      jsx: 'react-jsx',
      strict: true,
      noUnusedLocals: false,
      noUnusedParameters: false,
      noFallthroughCasesInSwitch: true,
      resolveJsonModule: true,
      isolatedModules: true,
    },
    include: ['src'],
  };

  return JSON.stringify(config, null, 2);
}

/**
 * Gera index.html padrão para React/Vite.
 */
function generateReactIndexHtml(spec: SiteSpec): string {
  const title = escapeHtml(spec.siteName);
  const description = escapeHtml(spec.description);

  return `<!doctype html>
<html lang="${escapeHtml(spec.language || 'pt-PT')}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="${description}" />
    <meta name="theme-color" content="${spec.palette.primary}" />
    <title>${title}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`;
}

/**
 * Escapa texto para utilização em HTML.
 */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Gera o ponto de entrada React padrão.
 */
function generateReactMain(): string {
  return `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('O elemento root não foi encontrado no index.html.');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
`;
}

/**
 * Garante que a estrutura React possui os ficheiros essenciais.
 */
function ensureReactStructure(spec: SiteSpec): void {
  const requiredFiles = [
    'index.html',
    'package.json',
    'vite.config.ts',
    'tsconfig.json',
    'src/main.tsx',
    'src/App.tsx',
    'src/index.css',
  ];

  for (const file of requiredFiles) {
    if (!spec.files.includes(file)) {
      spec.files.unshift(file);
    }
  }

  // O ponto de entrada principal de React/Vite é index.html.
  spec.entryFile = 'index.html';

  if (spec.files.length > MAX_FILES) {
    throw createError(
      `A estrutura React ultrapassa o limite de ${MAX_FILES} ficheiros, incluindo os ficheiros obrigatórios.`,
      422
    );
  }
}

/**
 * Valida conteúdo dos ficheiros.
 */
function validateFileContent(
  filePath: string,
  content: string,
  spec: SiteSpec
): string | null {
  if (!content || !content.trim()) {
    return 'O ficheiro foi gerado sem conteúdo.';
  }

  if (content.length > MAX_FILE_CONTENT_LENGTH) {
    return 'O conteúdo ultrapassa o limite permitido.';
  }

  const extension =
    filePath.split('.').pop()?.toLowerCase() || '';

  const fileName = getFileName(filePath);

  const isReact = spec.technologyStack === 'react-vite';

  if (
    ['html', 'htm'].includes(extension) &&
    fileName === 'index.html'
  ) {
    if (!/<html[\s>]/i.test(content)) {
      return 'O documento HTML principal não contém a estrutura HTML.';
    }

    if (!/<head[\s>]/i.test(content)) {
      return 'O documento HTML principal não contém a secção head.';
    }

    if (!/<body[\s>]/i.test(content)) {
      return 'O documento HTML principal não contém a secção body.';
    }

    if (isReact && !/id=["']root["']/.test(content)) {
      return 'O index.html do projeto React não contém o elemento root.';
    }
  }

  if (
    isReact &&
    ['tsx', 'jsx'].includes(extension) &&
    isReactEntryFile(filePath)
  ) {
    const hasReactMount =
      /createRoot\s*\(/.test(content) ||
      /hydrateRoot\s*\(/.test(content) ||
      /ReactDOM\s*\.\s*render\s*\(/.test(content);

    if (!hasReactMount) {
      return 'O ponto de entrada React não apresenta uma operação de montagem reconhecível.';
    }

    return null;
  }

  if (
    ['tsx', 'jsx'].includes(extension) &&
    !isReactEntryFile(filePath)
  ) {
    const hasExport =
      /\bexport\s+default\b/.test(content) ||
      /\bexport\s+(?:async\s+)?(?:function|const|class|let|var)\b/.test(content) ||
      /\bexport\s*\{/.test(content);

    if (!hasExport) {
      return 'O componente React não apresenta uma exportação reconhecível.';
    }
  }

  if (fileName === 'package.json') {
    try {
      const parsed = JSON.parse(content);

      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        return 'O package.json não contém um objeto JSON válido.';
      }

      if (!parsed.scripts || typeof parsed.scripts !== 'object') {
        return 'O package.json não define scripts de execução.';
      }

      if (isReact) {
        if (!parsed.scripts.dev || !parsed.scripts.build) {
          return 'O package.json React deve definir os scripts dev e build.';
        }

        if (!parsed.dependencies?.react || !parsed.dependencies?.['react-dom']) {
          return 'O package.json não declara React e ReactDOM.';
        }

        if (!parsed.devDependencies?.vite) {
          return 'O package.json não declara Vite nas dependências de desenvolvimento.';
        }
      }
    } catch (error: any) {
      return `O package.json contém JSON inválido: ${error.message || 'erro de sintaxe'}.`;
    }
  }

  if (extension === 'json') {
    try {
      JSON.parse(content);
    } catch (error: any) {
      return `O ficheiro JSON contém sintaxe inválida: ${error.message || 'erro de sintaxe'}.`;
    }
  }

  if (
    isReact &&
    ['tsx', 'jsx'].includes(extension) &&
    content.trim().length < 20
  ) {
    return 'O ficheiro React parece estar incompleto.';
  }

  return null;
}

/**
 * Extrai JSON das respostas do modelo.
 */
function parseJsonResponse(content: string): any {
  if (!content || typeof content !== 'string') {
    throw createError('A resposta do modelo está vazia.', 502);
  }

  const cleaned = content
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '');

  try {
    return JSON.parse(cleaned);
  } catch {
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');

    if (firstBrace < 0 || lastBrace <= firstBrace) {
      throw createError(
        'O modelo não devolveu um objeto JSON válido.',
        502
      );
    }

    try {
      return JSON.parse(
        cleaned.slice(firstBrace, lastBrace + 1)
      );
    } catch {
      throw createError(
        'Não foi possível interpretar o JSON devolvido pelo modelo.',
        502
      );
    }
  }
}

/**
 * Normaliza a SPEC do Planner.
 */
function normalizeSpec(raw: any): SiteSpec {
  if (!raw || typeof raw !== 'object') {
    throw createError('O Planner devolveu uma SPEC inválida.', 502);
  }

  const palette = {
    ...DEFAULT_PALETTE,
    ...(raw.palette || {}),
  };

  const fonts = {
    ...DEFAULT_FONTS,
    ...(raw.fonts || {}),
  };

  const technologyStack: ProjectTechnology =
    raw.technologyStack === 'react-vite'
      ? 'react-vite'
      : 'static-html';

  const files: string[] = Array.isArray(raw.files)
    ? (raw.files as unknown[])
        .filter((file): file is string => typeof file === 'string')
        .map((file: string) => normalizePath(file))
    : [];

  const uniqueFiles: string[] = [...new Set(files)];

  if (uniqueFiles.length === 0) {
    uniqueFiles.push(
      'index.html',
      ...(technologyStack === 'react-vite'
        ? ['src/main.tsx', 'src/App.tsx', 'src/index.css']
        : ['styles.css', 'app.js'])
    );
  }

  const entryFile = normalizePath(
    typeof raw.entryFile === 'string' && raw.entryFile.trim()
      ? raw.entryFile
      : 'index.html'
  );

  if (!isSafeRelativePath(entryFile)) {
    throw createError(
      'O ficheiro de entrada definido pelo Planner é inválido.',
      422
    );
  }

  if (!uniqueFiles.includes(entryFile)) {
    uniqueFiles.unshift(entryFile);
  }

  for (const file of uniqueFiles) {
    if (!isSafeRelativePath(file)) {
      throw createError(
        `O Planner definiu um caminho de ficheiro inválido: ${file}`,
        422
      );
    }
  }

  const sections: SiteSectionSpec[] = Array.isArray(raw.sections)
    ? raw.sections.map((section: any) => ({
        id: String(section.id || ''),
        title: String(section.title || ''),
        copy: String(section.copy || ''),
        details: String(section.details || ''),
      }))
    : [];

  const routes: SiteRoute[] = Array.isArray(raw.routes)
    ? raw.routes.map((route: any) => ({
        path: String(route.path || ''),
        title: String(route.title || ''),
        purpose: String(route.purpose || ''),
      }))
    : [];

  const spec: SiteSpec = {
    siteName: String(raw.siteName || 'Projeto IMCH'),
    language: String(raw.language || 'pt-PT'),
    description: String(raw.description || ''),
    palette,
    fonts,
    files: uniqueFiles,
    sections,

    projectType: String(raw.projectType || 'website'),
    technologyStack,
    architectureSummary: String(raw.architectureSummary || ''),
    entryFile,
    routes,
    features: Array.isArray(raw.features)
      ? raw.features.map(String)
      : [],
    dependencies: Array.isArray(raw.dependencies)
      ? raw.dependencies.map(String)
      : [],
  };

  if (technologyStack === 'react-vite') {
    ensureReactStructure(spec);
  }

  if (spec.files.length > MAX_FILES) {
    throw createError(
      `O Planner definiu mais de ${MAX_FILES} ficheiros.`,
      422
    );
  }

  return spec;
}

/**
 * Chamada padronizada à API OpenRouter.
 */
async function callOpenRouter(params: {
  apiKey: string;
  model: string;
  messages: Array<{ role: string; content: string }>;
  temperature: number;
  maxTokens: number;
  jsonSchema: {
    name: string;
    strict: boolean;
    schema: Record<string, any>;
  };
}): Promise<{
  content: string;
  finishReason: string;
  raw: any;
}> {
  const controller = new AbortController();

  const timeoutId = setTimeout(
    () => controller.abort(),
    REQUEST_TIMEOUT_MS
  );

  try {
    const response = await fetch(OPENROUTER_URL, {
      method: 'POST',

      headers: {
        Authorization: `Bearer ${params.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.APP_URL || 'https://imch.pt',
        'X-Title': 'IMCH AI Adaptive Project Generator',
      },

      signal: controller.signal,

      body: JSON.stringify({
        model: params.model,
        messages: params.messages,
        temperature: params.temperature,
        max_tokens: params.maxTokens,

        provider: {
          require_parameters: true,
        },

        response_format: {
          type: 'json_schema',
          json_schema: params.jsonSchema,
        },
      }),
    });

    if (!response.ok) {
      let errorBody = '';

      try {
        const errorJson = await response.json();

        errorBody =
          errorJson.error?.message ||
          JSON.stringify(errorJson);
      } catch {
        errorBody = response.statusText;
      }

      if (
        response.status === 402 &&
        params.model !== 'openrouter/free'
      ) {
        console.warn(
          `[IMCH] Modelo ${params.model} sem créditos. A tentar openrouter/free.`
        );

        return await callOpenRouter({
          ...params,
          model: 'openrouter/free',
        });
      }

      throw createError(
        response.status === 402
          ? 'A conta OpenRouter não possui créditos suficientes. Verifica o saldo ou utiliza um modelo gratuito compatível.'
          : `OpenRouter HTTP ${response.status}: ${errorBody}`,
        response.status
      );
    }

    const data = await response.json();
    const choice = data.choices?.[0];

    if (!choice) {
      throw createError(
        'O OpenRouter não devolveu uma escolha válida.',
        502
      );
    }

    const finishReason = choice.finish_reason || 'stop';

    if (finishReason === 'length') {
      throw createError(
        'A geração ultrapassou o limite máximo de tokens. Divide o projeto em módulos mais pequenos.',
        422
      );
    }

    const messageContent = choice.message?.content;

    if (
      typeof messageContent !== 'string' ||
      !messageContent.trim()
    ) {
      throw createError(
        'O modelo devolveu uma resposta vazia ou inválida.',
        502
      );
    }

    return {
      content: messageContent,
      finishReason,
      raw: data,
    };
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      throw createError(
        'O pedido ao modelo excedeu o tempo limite de 120 segundos.',
        504
      );
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Constrói o contexto geral do projeto.
 */
function buildProjectContext(spec: SiteSpec): string {
  return `
PROJETO: ${spec.siteName}

TIPO: ${spec.projectType}

TECNOLOGIA: ${spec.technologyStack}

IDIOMA: ${spec.language}

DESCRIÇÃO:
${spec.description}

ARQUITETURA:
${spec.architectureSummary}

FICHEIRO DE ENTRADA:
${spec.entryFile}

PALETA:
${JSON.stringify(spec.palette, null, 2)}

TIPOGRAFIA:
${JSON.stringify(spec.fonts, null, 2)}

ROTAS:
${JSON.stringify(spec.routes || [], null, 2)}

FUNCIONALIDADES:
${JSON.stringify(spec.features || [], null, 2)}

DEPENDÊNCIAS:
${JSON.stringify(spec.dependencies || [], null, 2)}

ESTRUTURA COMPLETA:
${spec.files.map((file) => `- ${file}`).join('\n')}

SECÇÕES E COPY:
${(spec.sections || [])
  .map(
    (section, index) => `
SECÇÃO ${index + 1}: ${section.id}
Título: ${section.title}
Copy: ${section.copy}
Detalhes: ${section.details}
`
  )
  .join('\n')}
`;
}

/**
 * Constrói contexto limitado dos ficheiros anteriores.
 */
function buildGeneratedContext(
  generatedFiles: Record<string, string>
): string {
  const entries = Object.entries(generatedFiles);

  if (entries.length === 0) {
    return 'Nenhum ficheiro gerado anteriormente.';
  }

  let result = '';
  let remaining = MAX_CONTEXT_LENGTH;

  for (const [path, content] of entries) {
    if (remaining <= 0) break;

    const header = `\n--- INÍCIO: ${path} ---\n`;
    const footer = `\n--- FIM: ${path} ---\n`;

    const available = remaining - header.length - footer.length;

    if (available <= 0) break;

    const fileContent =
      content.length > available
        ? content.slice(0, available) +
          '\n/* Conteúdo truncado para limitar o contexto. */'
        : content;

    const block = header + fileContent + footer;

    result += block;
    remaining -= block.length;
  }

  if (entries.length > 0 && remaining <= 0) {
    result += '\nAlguns ficheiros anteriores foram omitidos por limite de contexto.';
  }

  return result;
}

/**
 * Instruções específicas por ficheiro.
 */
function getFileInstructions(
  filePath: string,
  spec: SiteSpec
): string {
  const extension =
    filePath.split('.').pop()?.toLowerCase() || '';

  const lowerPath = filePath.toLowerCase();

  if (lowerPath.endsWith('package.json')) {
    return `
Este ficheiro é criado automaticamente pelo gerador.
Não deves gerar package.json.
`;
  }

  if (lowerPath.endsWith('vite.config.ts')) {
    return `
Este ficheiro é criado automaticamente pelo gerador.
Não deves gerar vite.config.ts.
`;
  }

  if (lowerPath.endsWith('tsconfig.json')) {
    return `
Este ficheiro é criado automaticamente pelo gerador.
Não deves gerar tsconfig.json.
`;
  }

  if (extension === 'html' || extension === 'htm') {
    if (
      spec.technologyStack === 'react-vite' &&
      getFileName(filePath) === 'index.html'
    ) {
      return `
Gera o documento HTML principal de uma aplicação React com Vite.

Inclui:
- HTML5 completo.
- Meta viewport.
- Título adequado.
- Descrição SEO.
- Elemento com id="root".
- Script module que carregue /src/main.tsx.

Não coloques a interface inteira diretamente neste ficheiro.
Não alteres o caminho do script principal.
`;
    }

    return `
Gera HTML5 semântico, acessível e responsivo.
Utiliza o idioma ${spec.language}.
Liga corretamente os ficheiros CSS e JavaScript previstos.
Inclui metadados e títulos adequados.
Não inventes referências a ficheiros inexistentes.
Utiliza conteúdo real definido na SPEC.
`;
  }

  if (extension === 'css') {
    return `
Gera CSS completo e organizado.
Utiliza as cores e tipografia definidas na SPEC.
Aplica design responsivo mobile-first.
Inclui estados hover, focus e active.
Evita estilos globais que possam quebrar outros componentes.
`;
  }

  if (extension === 'js') {
    return `
Gera JavaScript funcional e organizado.
Implementa as interações definidas na SPEC.
Trata eventos, validações e erros.
Não utilizes bibliotecas não declaradas na arquitetura.
`;
  }

  if (extension === 'tsx' || extension === 'jsx') {
    if (isReactEntryFile(filePath)) {
      return `
Este ficheiro é o ponto de entrada React.

Deve:
- Importar React quando necessário.
- Importar createRoot de react-dom/client ou utilizar alternativa válida.
- Importar o componente principal App.
- Encontrar o elemento root do index.html.
- Montar a aplicação.
- Importar os estilos globais necessários.
- Respeitar os caminhos reais dos ficheiros.

Não cries uma segunda aplicação.
Não inventes componentes que não existam na estrutura.
`;
    }

    return `
Gera um componente React completo.
Utiliza componentes reutilizáveis.
Respeita as importações e os caminhos da estrutura.
Utiliza TypeScript quando a extensão for .tsx.
Implementa estados e eventos funcionais.
Exporta o componente através de export default ou export nomeado.
Não utilizes APIs inexistentes.
`;
  }

  if (extension === 'ts') {
    return `
Gera TypeScript completo.
Define tipos explícitos quando apropriado.
Evita any desnecessário.
Respeita a arquitetura e as importações do projeto.
`;
  }

  if (extension === 'json') {
    return `
Gera JSON válido.
Não incluas comentários.
Não incluas Markdown.
Respeita a estrutura de dados necessária ao projeto.
`;
  }

  if (extension === 'md') {
    return `
Gera documentação clara e completa.
Explica a finalidade do módulo e como utilizá-lo.
`;
  }

  return `
Gera o conteúdo completo e funcional deste ficheiro.
Respeita a tecnologia e a arquitetura definidas na SPEC.
Não devolvas conteúdo genérico.
`;
}

/**
 * Verifica se um ficheiro é criado automaticamente.
 */
function isGeneratedConfigurationFile(
  filePath: string,
  spec: SiteSpec
): boolean {
  if (spec.technologyStack !== 'react-vite') {
    return false;
  }

  const name = normalizePath(filePath).toLowerCase();

  return [
    'package.json',
    'vite.config.ts',
    'tsconfig.json',
  ].includes(name);
}

/**
 * Gera ficheiros de configuração sem chamar o modelo.
 */
function generateConfigurationFile(
  filePath: string,
  spec: SiteSpec
): string | null {
  const name = normalizePath(filePath).toLowerCase();

  if (name === 'package.json') {
    return generatePackageJson(spec);
  }

  if (name === 'vite.config.ts') {
    return generateViteConfig();
  }

  if (name === 'tsconfig.json') {
    return generateTsConfig();
  }

  return null;
}

/**
 * Gera um ficheiro com contexto partilhado.
 */
async function generateProjectFile(params: {
  apiKey: string;
  model: string;
  spec: SiteSpec;
  filePath: string;
  generatedFiles: Record<string, string>;
}): Promise<string> {
  const {
    apiKey,
    model,
    spec,
    filePath,
    generatedFiles,
  } = params;

  /**
   * Ficheiros estruturais React/Vite.
   * São criados localmente e não dependem do modelo.
   */
  if (isGeneratedConfigurationFile(filePath, spec)) {
    const generated = generateConfigurationFile(filePath, spec);

    if (generated === null) {
      throw createError(
        `Não foi possível criar a configuração ${filePath}.`,
        500
      );
    }

    const validationError = validateFileContent(
      filePath,
      generated,
      spec
    );

    if (validationError) {
      throw createError(
        `A configuração automática ${filePath} é inválida: ${validationError}`,
        500
      );
    }

    return generated;
  }

  /**
   * O index.html React também pode ser criado automaticamente.
   * Isto garante a ligação correcta ao ponto de entrada.
   */
  if (
    spec.technologyStack === 'react-vite' &&
    normalizePath(filePath).toLowerCase() === 'index.html'
  ) {
    const generated = generateReactIndexHtml(spec);

    const validationError = validateFileContent(
      filePath,
      generated,
      spec
    );

    if (validationError) {
      throw createError(
        `O index.html automático é inválido: ${validationError}`,
        500
      );
    }

    return generated;
  }

  /**
   * O ponto de entrada React também é gerado automaticamente.
   */
  if (
    spec.technologyStack === 'react-vite' &&
    normalizePath(filePath).toLowerCase() === 'src/main.tsx'
  ) {
    const generated = generateReactMain();

    const validationError = validateFileContent(
      filePath,
      generated,
      spec
    );

    if (validationError) {
      throw createError(
        `O ponto de entrada React automático é inválido: ${validationError}`,
        500
      );
    }

    return generated;
  }

  const projectContext = buildProjectContext(spec);
  const previousFiles = buildGeneratedContext(generatedFiles);

  const fileInstructions = getFileInstructions(
    filePath,
    spec
  );

  const systemPrompt = `
Tu és o engenheiro de software principal do IMCH AI.

A tua missão é implementar um projeto real, completo e coerente.

Não estás a criar um exemplo genérico.
Estás a desenvolver um ficheiro dentro de um projeto com arquitetura definida.

CONTEXTO DO PROJETO:
${projectContext}

FICHEIROS JÁ GERADOS:
${previousFiles}

FICHEIRO ATUAL:
${filePath}

INSTRUÇÕES ESPECÍFICAS:
${fileInstructions}

REGRAS OBRIGATÓRIAS:

1. Devolve o ficheiro completo.
2. Respeita rigorosamente a arquitetura aprovada.
3. Mantém compatibilidade com os ficheiros já gerados.
4. Utiliza importações e caminhos corretos.
5. Não inventes funcionalidades fora do briefing.
6. Não utilizes lorem ipsum nem conteúdo genérico.
7. Não deixes código por implementar.
8. Não uses comentários como substituto de código.
9. Não omitas secções importantes.
10. Não alteres o caminho do ficheiro solicitado.
11. Mantém a copy da SPEC quando a utilizares.
12. Implementa funcionalidades de forma realista e funcional.
13. Não declares que uma funcionalidade funciona se apenas tiver uma interface visual.
14. Não inventes integrações externas, chaves ou credenciais.
15. Não coloques segredos no código do cliente.
16. Não importes ficheiros que não estejam previstos na estrutura.
17. Se precisares de comunicar com outro módulo, respeita a interface definida.
18. Não cries package.json, vite.config.ts ou tsconfig.json.
19. Não cries um segundo ponto de entrada React.
20. Não substituas a arquitetura definida pelo Planner.
21. Em ficheiros React, hooks (ex: useCart, useOrders) e componentes: exporta SEMPRE de forma nomeada (ex: export const useCart = ...) e também como default (export default useCart) para evitar conflitos de importação.

A saída deve ser exclusivamente JSON com:
{
  "path": "${filePath}",
  "content": "código completo"
}
`;

  const userPrompt = `
Implementa agora o ficheiro "${filePath}".

Antes de responder, verifica:
- Compatibilidade com a arquitetura.
- Importações.
- Dependências.
- Caminhos.
- Funcionalidade.
- Integridade do código.

Devolve apenas o JSON exigido pelo schema.
`;

  const firstCall = await callOpenRouter({
    apiKey,
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.1,
    maxTokens: 16000,
    jsonSchema: CODER_JSON_SCHEMA,
  });

  const parsedFirst = parseJsonResponse(firstCall.content);

  if (
    normalizePath(parsedFirst.path || '') !== filePath ||
    typeof parsedFirst.content !== 'string'
  ) {
    throw createError(
      `O modelo devolveu uma estrutura inválida para ${filePath}.`,
      502
    );
  }

  let content = parsedFirst.content;

  let validationError = validateFileContent(
    filePath,
    content,
    spec
  );

  const needsRetry =
    containsForbiddenPlaceholders(content) ||
    Boolean(validationError);

  if (needsRetry) {
    const retryCall = await callOpenRouter({
      apiKey,
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
        {
          role: 'assistant',
          content: firstCall.content,
        },
        {
          role: 'user',
          content: `
CORREÇÃO OBRIGATÓRIA.

O ficheiro anterior apresentou problemas:

${validationError || 'Contém texto genérico ou placeholders.'}

Gera novamente o ficheiro completo.
Corrige todos os problemas.
Não alteres o caminho.
Não omitas código.
Devolve apenas JSON válido.
`,
        },
      ],
      temperature: 0.1,
      maxTokens: 16000,
      jsonSchema: CODER_JSON_SCHEMA,
    });

    const parsedRetry = parseJsonResponse(retryCall.content);

    if (
      normalizePath(parsedRetry.path || '') !== filePath ||
      typeof parsedRetry.content !== 'string'
    ) {
      throw createError(
        `A tentativa de correção devolveu uma estrutura inválida em ${filePath}.`,
        502
      );
    }

    content = parsedRetry.content;

    validationError = validateFileContent(
      filePath,
      content,
      spec
    );
  }

  if (containsForbiddenPlaceholders(content)) {
    throw createError(
      `O ficheiro ${filePath} continua a conter texto genérico após a correção.`,
      422
    );
  }

  if (validationError) {
    throw createError(
      `O ficheiro ${filePath} continua inválido: ${validationError}`,
      422
    );
  }

  return content;
}

/**
 * Orquestrador principal.
 */
export async function generateSite(
  options: SiteGeneratorOptions
): Promise<SiteGeneratorResult> {
  const startTime = Date.now();

  const {
    briefing,
    apiKey,
    onStep,
  } = options;

  if (!apiKey || !apiKey.trim()) {
    throw createError(
      'Chave OPENROUTER_API_KEY não configurada no servidor.',
      500
    );
  }

  if (!briefing || !briefing.trim()) {
    throw createError(
      'O briefing do projeto não pode estar vazio.',
      400
    );
  }

  if (briefing.length > MAX_BRIEFING_LENGTH) {
    throw createError(
      `O briefing ultrapassa o limite de ${MAX_BRIEFING_LENGTH} caracteres.`,
      413
    );
  }

  const rawModel =
    options.model?.trim() || 'openrouter/free';

  const model =
    rawModel === 'openrouter/auto'
      ? 'openrouter/free'
      : rawModel;

  const warnings: string[] = [];

  // ==========================================================
  // ETAPA 1 — PLANNER
  // ==========================================================

  onStep?.({
    step: 'planning',
    message: 'A analisar o briefing e a planear a arquitetura do projeto...',
    percent: 10,
  });

  const plannerSystemPrompt = `
Tu és o ARQUITETO DE SOFTWARE do IMCH AI.

A tua responsabilidade é transformar briefings em planos técnicos completos.

Não assumes que todos os projetos são websites simples.

ANALISA O TIPO DE PROJETO:

A) static-html:
Escolhe esta arquitetura para:
- Websites institucionais.
- Landing pages.
- Portfólios.
- Restaurantes.
- Hotéis.
- Catálogos.
- Websites comerciais.
- Websites multipágina sem necessidade de uma aplicação React.

Estrutura habitual:
index.html
styles.css
app.js
ou pastas específicas para páginas, estilos e scripts.

B) react-vite:
Escolhe esta arquitetura para:
- Dashboards.
- Aplicações web interativas.
- Sistemas administrativos.
- Aplicações com muitos componentes.
- Sistemas com navegação complexa.
- Interfaces que necessitam de estados e componentes reutilizáveis.

Estrutura habitual:
index.html
package.json
vite.config.ts
tsconfig.json
src/main.tsx
src/App.tsx
src/index.css
src/components/
src/pages/

REGRAS DE ARQUITETURA:

1. Escolhe a tecnologia de acordo com o briefing.
2. Não escolhas React apenas por ser moderno.
3. Não escolhas HTML simples quando o projeto exige uma arquitetura de aplicação.
4. Planeia todos os ficheiros necessários.
5. Define páginas e componentes.
6. Define as rotas e páginas necessárias.
7. Define funcionalidades concretas.
8. Define dependências justificadas.
9. Evita ficheiros desnecessários.
10. Não ultrapasses 60 ficheiros.
11. Não inventes integrações que dependam de credenciais não fornecidas.
12. Não inventes preços, moradas, contactos ou testemunhos reais.
13. Quando faltarem dados comerciais, utiliza conteúdo institucional neutro.

FICHEIROS E CONFIGURAÇÕES:

Quando escolheres React/Vite:
- Inclui index.html.
- Inclui src/main.tsx.
- Inclui src/App.tsx.
- Inclui src/index.css.
- Podes definir outros ficheiros necessários.
- Não precisas de gerar package.json.
- Não precisas de gerar vite.config.ts.
- Não precisas de gerar tsconfig.json.
- Estes três ficheiros serão criados automaticamente pelo sistema.

COPY E CONTEÚDO:

- Escreve textos completos e naturais.
- Usa o idioma adequado ao público.
- Para português de Portugal, utiliza português europeu.
- Não uses lorem ipsum.
- Não uses placeholders.
- Não uses reticências para substituir conteúdo.
- Não inventes testemunhos de clientes.

DESIGN:

- Define uma paleta harmoniosa.
- Escolhe duas fontes adequadas.
- Cria uma identidade visual coerente.
- Planeia uma interface profissional.
- Considera desktop, tablet e telemóvel.

A resposta deve obedecer integralmente ao JSON Schema.
`;

  const plannerUserPrompt = `
Analisa este briefing integralmente.

Não o resumas nem elimines requisitos.

<briefing>
${briefing}
</briefing>

Cria a SPEC completa do projeto.

Escolhe a arquitetura mais adequada.
Define todos os ficheiros, páginas, rotas e funcionalidades necessárias.
`;

  let spec: SiteSpec;

  try {
    const plannerResult = await callOpenRouter({
      apiKey,
      model,
      messages: [
        {
          role: 'system',
          content: plannerSystemPrompt,
        },
        {
          role: 'user',
          content: plannerUserPrompt,
        },
      ],
      temperature: 0.3,
      maxTokens: 16000,
      jsonSchema: PLANNER_JSON_SCHEMA,
    });

    spec = normalizeSpec(
      parseJsonResponse(plannerResult.content)
    );
  } catch (error: any) {
    if (error.status) {
      throw error;
    }

    throw createError(
      `Falha ao processar a arquitetura do Planner: ${error.message}`,
      502
    );
  }

  if (spec.technologyStack === 'react-vite') {
    const warning =
      'O projeto utiliza React/Vite. Os ficheiros estruturais são criados automaticamente pelo IMCH AI. A execução e pré-visualização dependem de o ambiente disponibilizar instalação das dependências e compilação Vite.';

    warnings.push(warning);

    onStep?.({
      step: 'warning',
      message: warning,
    });
  }

  onStep?.({
    step: 'planning',
    message:
      `Arquitetura definida: ${spec.technologyStack}. ` +
      `${spec.files.length} ficheiros planeados para "${spec.siteName}".`,
    spec,
    percent: 25,
  });

  // ==========================================================
  // ETAPA 2 — CODER
  // ==========================================================

  const generatedFiles: Record<string, string> = {};

  const totalFiles = spec.files.length;

  for (let index = 0; index < totalFiles; index++) {
    const currentFilePath = spec.files[index];
    const fileIndex = index + 1;

    const currentPercent = Math.round(
      25 + (fileIndex / totalFiles) * 70
    );

    onStep?.({
      step: 'coding',
      message:
        `A desenvolver ${currentFilePath} ` +
        `(${fileIndex}/${totalFiles})...`,
      file: currentFilePath,
      fileIndex,
      totalFiles,
      percent: currentPercent,
    });

    try {
      const fileContent = await generateProjectFile({
        apiKey,
        model,
        spec,
        filePath: currentFilePath,
        generatedFiles,
      });

      generatedFiles[currentFilePath] = fileContent;

      onStep?.({
        step: 'file_done',
        message: `Ficheiro ${currentFilePath} gerado e validado.`,
        file: currentFilePath,
        fileIndex,
        totalFiles,
        fileData: {
          path: currentFilePath,
          content: fileContent,
        },
        percent: currentPercent,
      });
    } catch (error: any) {
      const warning =
        `Não foi possível gerar ${currentFilePath}: ${error.message}`;

      warnings.push(warning);

      onStep?.({
        step: 'warning',
        message: warning,
        file: currentFilePath,
        fileIndex,
        totalFiles,
        percent: currentPercent,
      });

      throw createError(
        `Geração interrompida no ficheiro ${currentFilePath}. ${error.message}`,
        error.status || 502
      );
    }
  }

  // ==========================================================
  // ETAPA 3 — VERIFICAÇÃO FINAL DA ESTRUTURA
  // ==========================================================

  const missingFiles = spec.files.filter(
    (file) => !generatedFiles[file]
  );

  if (missingFiles.length > 0) {
    throw createError(
      `O projeto ficou incompleto. Ficheiros em falta: ${missingFiles.join(', ')}`,
      422
    );
  }

  const durationMs = Date.now() - startTime;

  onStep?.({
    step: 'done',
    message:
      `Projeto "${spec.siteName}" gerado. ` +
      `${totalFiles} ficheiros processados em ` +
      `${(durationMs / 1000).toFixed(1)} segundos.`,
    spec,
    percent: 100,
  });

  return {
    spec,
    files: generatedFiles,
    warnings,
    durationMs,
  };
}