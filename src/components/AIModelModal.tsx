import React, { useState, useEffect } from 'react';
import { 
  X, 
  Cpu, 
  Check, 
  KeyRound, 
  ShieldCheck, 
  AlertCircle, 
  Sparkles,
  ExternalLink 
} from 'lucide-react';
import { apiService } from '../services/api';

interface AIModelModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedModel: string;
  onSelectModel: (modelId: string) => void;
}

const AVAILABLE_MODELS = [
  {
    id: 'openrouter/free',
    name: 'OpenRouter Free Auto',
    provider: 'OpenRouter',
    badge: 'Padrão Gratuito',
    badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
    description: 'Roteamento dinâmico automático com zero custo, ideal para prototipagem e desenvolvimento geral.',
  },
  {
    id: 'meta-llama/llama-3.3-70b-instruct:free',
    name: 'Llama 3.3 70B Instruct',
    provider: 'Meta',
    badge: 'Alto Desempenho',
    badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300',
    description: 'Modelo de 70 mil milhões de parâmetros com excelente capacidade de raciocínio, escrita e código.',
  },
  {
    id: 'google/gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'Google',
    badge: 'Ultrarrápido',
    badgeColor: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300',
    description: 'Velocidade extrema de resposta e compreensão avançada de código semântico e arquitetura web.',
  },
  {
    id: 'anthropic/claude-3.5-sonnet',
    name: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',
    badge: 'Engenharia Pro',
    badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
    description: 'Líder em precisão na criação de software, arquitetura robusta e depuração de bugs complexos.',
  },
  {
    id: 'openai/gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'OpenAI',
    badge: 'Eficiente',
    badgeColor: 'bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300',
    description: 'Equilíbrio ideal entre inteligência, velocidade de resposta e coerência textual.',
  },
  {
    id: 'deepseek/deepseek-chat',
    name: 'DeepSeek V3',
    provider: 'DeepSeek',
    badge: 'Especialista em Código',
    badgeColor: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300',
    description: 'Forte raciocínio matemático e sintático para geração de aplicações complexas e lógica.',
  },
];

export const AIModelModal: React.FC<AIModelModalProps> = ({
  isOpen,
  onClose,
  selectedModel,
  onSelectModel,
}) => {
  const [serverKeyStatus, setServerKeyStatus] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      apiService.getOpenRouterStatus().then(setServerKeyStatus).catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-xl rounded-2xl bg-white dark:bg-[#111116] border border-neutral-200 dark:border-neutral-800 shadow-2xl p-6 text-neutral-900 dark:text-neutral-100 flex flex-col gap-5">
        <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900 dark:text-white">Modelos de Inteligência Artificial</h2>
              <p className="text-xs text-neutral-500">Selecione o motor LLM via OpenRouter</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Server Key Probe */}
        <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-[#181820] border border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-neutral-400 shrink-0" />
            <div>
              <p className="font-semibold text-neutral-800 dark:text-neutral-200">Estado no Servidor</p>
              <p className="text-neutral-500 text-[11px]">
                {serverKeyStatus?.configured
                  ? 'Chave OPENROUTER_API_KEY ativa e pronta para geração.'
                  : 'Variável OPENROUTER_API_KEY verificada.'}
              </p>
            </div>
          </div>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
              serverKeyStatus?.configured
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
            }`}
          >
            {serverKeyStatus?.configured ? 'Conectado' : 'Configurado'}
          </span>
        </div>

        {/* Models List */}
        <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
          {AVAILABLE_MODELS.map((model) => {
            const isSelected = selectedModel === model.id;
            return (
              <div
                key={model.id}
                onClick={() => {
                  onSelectModel(model.id);
                  onClose();
                }}
                className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all flex items-start justify-between gap-3 ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50/40 dark:bg-blue-950/20 shadow-xs'
                    : 'border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-[#181820]'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-neutral-900 dark:text-white">{model.name}</span>
                    <span className={`px-2 py-0.2 rounded-full text-[10px] font-semibold ${model.badgeColor}`}>
                      {model.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-500 leading-relaxed">{model.description}</p>
                  <p className="text-[10px] font-mono text-neutral-400">{model.id}</p>
                </div>

                {isSelected && (
                  <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 mt-1 shadow-xs">
                    <Check className="w-3 h-3" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
