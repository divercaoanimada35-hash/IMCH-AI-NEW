import React, { useState } from 'react';
import { 
  Sparkles, 
  Globe, 
  Code2, 
  ArrowRight, 
  CheckCircle2, 
  Layers, 
  Palette, 
  Type, 
  FileCode, 
  AlertCircle, 
  Loader2, 
  Cpu, 
  MonitorPlay,
  RotateCcw
} from 'lucide-react';
import { apiService } from '../services/api';

interface SiteGeneratorViewProps {
  selectedModel: string;
  onOpenModelModal: () => void;
  onSelectModel: (model: string) => void;
  onOpenInDeveloper: (project: {
    name: string;
    description: string;
    files: Record<string, any>;
  }) => void;
}

const BRIEFING_TEMPLATES = [
  {
    title: 'SaaS Empresarial Cloud',
    description: 'Plataforma SaaS para gestão de faturas e pagamentos com dashboard analítico e planos de preços.',
    prompt: 'Website completo para uma plataforma SaaS chamada NovaCloud Finance. Inclui Hero com headline impactante, grelha de funcionalidades com ícones, secção de preços transparente com alternador mensal/anual, depoimentos de clientes e formulário de contacto profissional.'
  },
  {
    title: 'Agência de Soluções Digitais',
    description: 'Site institucional corporativo para consultoria de software, transformação digital e IA.',
    prompt: 'Website de ponta para a IMCH Soluções Digitais. Destaque serviços de desenvolvimento web personalizado, integração de inteligência artificial, automação em nuvem, métricas de sucesso com contador numérico e chamada para ação para agendamento de diagnóstico.'
  },
  {
    title: 'Clínica Médica de Saúde',
    description: 'Portal de clínica médica com marcação de consultas online, especialidades e equipa médica.',
    prompt: 'Website moderno para a Clínica Vitalis Care. Inclui catálogo de especialidades médicas (Cardiologia, Pediatria, Dermatologia), secção sobre o corpo clínico qualificado, testemunhos reais de pacientes e sistema visual de agendamento de consultas com horários disponíveis.'
  },
  {
    title: 'E-Commerce de Moda & Design',
    description: 'Loja virtual elegante com montra de produtos, carrinho interativo e catálogo.',
    prompt: 'Website elegante de moda contemporânea para a marca Atelier Urbano. Inclui slider de coleções sazonais, grelha de produtos com filtro de categorias, carrinho de compras interativo, política de envios rápidos e formulário de newsletter com oferta de boas-vindas.'
  }
];

export const SiteGeneratorView: React.FC<SiteGeneratorViewProps> = ({
  selectedModel,
  onOpenModelModal,
  onOpenInDeveloper,
}) => {
  const [briefing, setBriefing] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState<'idle' | 'planning' | 'coding' | 'done'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);
  const [generatedResult, setGeneratedResult] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [selectedFile, setSelectedFile] = useState<string>('index.html');
  const [error, setError] = useState<string | null>(null);

  const handleStartGeneration = async (customBriefing?: string) => {
    const textToGenerate = (customBriefing || briefing).trim();
    if (!textToGenerate) {
      setError('Por favor, descreva o website que pretende criar.');
      return;
    }

    setError(null);
    setIsGenerating(true);
    setCurrentStep('planning');
    setStatusMessage('Etapa 1: A planear especificações, paleta de cores e arquitetura de ficheiros...');
    setProgressPercent(20);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          briefing: textToGenerate,
          model: selectedModel,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Erro do servidor (${response.status})`);
      }

      setCurrentStep('coding');
      setStatusMessage('Etapa 2: A codificar ficheiros semânticos HTML, CSS e JavaScript...');
      setProgressPercent(75);

      const data = await response.json();
      setProgressPercent(100);
      setCurrentStep('done');
      setStatusMessage('Website gerado com sucesso!');
      setGeneratedResult(data);

      const files = data.files || {};
      const firstFile = files['index.html'] ? 'index.html' : Object.keys(files)[0] || 'index.html';
      setSelectedFile(firstFile);
    } catch (err: any) {
      setError(err.message || 'Falha ao gerar o website. Por favor tente novamente.');
      setCurrentStep('idle');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-neutral-50 dark:bg-[#070709] text-neutral-900 dark:text-neutral-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto w-full flex flex-col gap-6">
        {/* Banner Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-br from-neutral-900 via-neutral-950 to-blue-950 text-white shadow-xl border border-blue-900/30">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-400/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Orquestrador 2-Etapas: Planner + Coder</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Gerador de Websites Profissionais</h1>
            <p className="text-xs sm:text-sm text-neutral-300 max-w-2xl">
              Crie websites completos e responsivos a partir de um briefing em linguagem natural. A IA planeia a arquitetura, estrutura semântica e gera código pronto para produção.
            </p>
          </div>

          <button
            onClick={onOpenModelModal}
            className="self-start md:self-auto flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-xs font-medium backdrop-blur-md transition-colors cursor-pointer"
          >
            <Cpu className="w-4 h-4 text-blue-400" />
            <div className="text-left">
              <p className="text-[10px] text-neutral-400">Modelo OpenRouter</p>
              <p className="font-semibold text-white truncate max-w-[150px]">{selectedModel}</p>
            </div>
          </button>
        </div>

        {/* Input Form & Templates */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 flex flex-col gap-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-[#0e0e12] border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col gap-3">
              <label className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 flex items-center justify-between">
                <span>Descreva o website que pretende:</span>
                <span className="text-[11px] font-normal text-neutral-500">Português ou qualquer idioma</span>
              </label>

              <textarea
                value={briefing}
                onChange={(e) => setBriefing(e.target.value)}
                placeholder="Exemplo: Cria um website de apresentação para um restaurante de gastronomia italiana chamado Bella Napoli. Inclui menu dinâmico com fotos de pratos, sistema de reservas online, história do chef e mapa de localização..."
                rows={5}
                disabled={isGenerating}
                className="w-full p-3.5 rounded-xl text-xs sm:text-sm bg-neutral-50 dark:bg-[#141419] border border-neutral-300 dark:border-neutral-700/80 text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none transition-all"
              />

              {error && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {isGenerating && (
                <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 space-y-2">
                  <div className="flex items-center justify-between text-xs text-blue-900 dark:text-blue-200 font-medium">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-blue-600 dark:text-blue-400" />
                      <span>{statusMessage}</span>
                    </div>
                    <span>{progressPercent}%</span>
                  </div>
                  <div className="w-full bg-blue-200 dark:bg-blue-900/60 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-neutral-500 hidden sm:inline">
                  Geração em ficheiros separados com CSS moderno e responsividade
                </span>
                <button
                  onClick={() => handleStartGeneration()}
                  disabled={isGenerating || !briefing.trim()}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-neutral-300 dark:disabled:bg-neutral-800 disabled:text-neutral-500 text-white font-semibold text-xs sm:text-sm shadow-md shadow-blue-600/20 transition-all cursor-pointer"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>A Gerar...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Gerar Website</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Quick Templates List */}
          <div className="flex flex-col gap-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-500 px-1">Ideias & Modelos Rápidos</h2>
            <div className="flex flex-col gap-2.5">
              {BRIEFING_TEMPLATES.map((tmpl, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setBriefing(tmpl.prompt);
                    handleStartGeneration(tmpl.prompt);
                  }}
                  disabled={isGenerating}
                  className="p-3.5 rounded-xl text-left bg-white dark:bg-[#0e0e12] hover:bg-neutral-100 dark:hover:bg-[#15151c] border border-neutral-200 dark:border-neutral-800/80 shadow-xs transition-all cursor-pointer group"
                >
                  <p className="text-xs font-semibold text-neutral-900 dark:text-white group-hover:text-blue-500 transition-colors">
                    {tmpl.title}
                  </p>
                  <p className="text-[11px] text-neutral-500 line-clamp-2 mt-0.5">
                    {tmpl.description}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results Section */}
        {generatedResult && (
          <div className="p-6 rounded-2xl bg-white dark:bg-[#0e0e12] border border-neutral-200 dark:border-neutral-800 shadow-md flex flex-col gap-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200 dark:border-neutral-800 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
                    {generatedResult.projectName || generatedResult.spec?.siteName || 'Website Criado com Sucesso'}
                  </h3>
                </div>
                <p className="text-xs text-neutral-500">
                  {generatedResult.description || generatedResult.spec?.description}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex p-0.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
                  <button
                    onClick={() => setActiveTab('preview')}
                    className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                      activeTab === 'preview'
                        ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs'
                        : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                    }`}
                  >
                    <MonitorPlay className="w-3.5 h-3.5" />
                    <span>Pré-visualização</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('code')}
                    className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                      activeTab === 'code'
                        ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs'
                        : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                    }`}
                  >
                    <Code2 className="w-3.5 h-3.5" />
                    <span>Código</span>
                  </button>
                </div>

                <button
                  onClick={() =>
                    onOpenInDeveloper({
                      name: generatedResult.projectName || generatedResult.spec?.siteName || 'Website IMCH',
                      description: generatedResult.description || generatedResult.spec?.description || briefing,
                      files: generatedResult.files,
                    })
                  }
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  <span>Abrir no Developer</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Content Tabs */}
            {activeTab === 'preview' ? (
              <div className="w-full h-[520px] rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-white">
                <iframe
                  title="Pré-visualização do Website"
                  className="w-full h-full border-0"
                  srcDoc={generatedResult.files['index.html'] || Object.values(generatedResult.files)[0] as string || ''}
                  sandbox="allow-scripts allow-modals allow-same-origin"
                />
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  {Object.keys(generatedResult.files || {}).map((filePath) => (
                    <button
                      key={filePath}
                      onClick={() => setSelectedFile(filePath)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
                        selectedFile === filePath
                          ? 'bg-blue-600 text-white font-semibold'
                          : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                      }`}
                    >
                      <FileCode className="w-3.5 h-3.5" />
                      <span>{filePath}</span>
                    </button>
                  ))}
                </div>

                <pre className="p-4 rounded-xl bg-neutral-900 text-neutral-200 text-xs font-mono overflow-auto max-h-[460px] border border-neutral-800">
                  <code>{generatedResult.files[selectedFile] || ''}</code>
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
