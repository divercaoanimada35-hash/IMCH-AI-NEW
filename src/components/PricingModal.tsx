import React, { useState } from 'react';
import { 
  X, 
  Check, 
  Sparkles, 
  Zap, 
  ShieldCheck, 
  CreditCard, 
  Layers, 
  Star,
  Users
} from 'lucide-react';
import { authService } from '../services/auth';
import { UserProfile } from '../types';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  promptReason?: string;
  onUpgradeSuccess: (user: UserProfile) => void;
}

export const PricingModal: React.FC<PricingModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  promptReason,
  onUpgradeSuccess,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleSelectPlan = (plan: 'pro' | 'enterprise') => {
    if (!currentUser) return;
    setIsProcessing(true);
    setTimeout(() => {
      const updated = authService.upgradePlan(plan);
      onUpgradeSuccess(updated);
      setIsProcessing(false);
      onClose();
    }, 600);
  };

  const handleAddCredits = (amount: number) => {
    if (!currentUser) return;
    setIsProcessing(true);
    setTimeout(() => {
      const updated = authService.addCredits(amount);
      onUpgradeSuccess(updated);
      setIsProcessing(false);
      onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-200 overflow-y-auto">
      <div className="w-full max-w-3xl rounded-2xl bg-white dark:bg-[#111116] border border-neutral-200 dark:border-neutral-800 shadow-2xl p-6 text-neutral-900 dark:text-neutral-100 flex flex-col gap-6 my-auto">
        <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900 dark:text-white">Planos & Créditos de IA</h2>
              <p className="text-xs text-neutral-500">Potencie o seu desenvolvimento com modelos de ponta</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {promptReason && (
          <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <p>{promptReason}</p>
          </div>
        )}

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Free Tier */}
          <div className="p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#16161c] flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Iniciante</span>
              <h3 className="text-xl font-bold mt-1 text-neutral-900 dark:text-white">Gratuito</h3>
              <p className="text-2xl font-extrabold mt-2 text-neutral-900 dark:text-white">
                0 AOA <span className="text-xs font-normal text-neutral-500">/ sempre</span>
              </p>

              <ul className="mt-4 space-y-2 text-xs text-neutral-600 dark:text-neutral-300">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  <span>50 créditos de IA iniciais</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  <span>1 projeto partilhado com 1 parceiro</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  <span>Acesso ao editor e pré-visualização</span>
                </li>
              </ul>
            </div>

            <div className="mt-6 pt-4 border-t border-neutral-200 dark:border-neutral-700">
              <span className="block text-center text-xs text-neutral-400 font-medium">Plano Padrão</span>
            </div>
          </div>

          {/* Pro Tier (Featured) */}
          <div className="p-5 rounded-xl border-2 border-blue-600 bg-blue-50/50 dark:bg-blue-950/20 flex flex-col justify-between relative shadow-lg">
            <span className="absolute -top-2.5 right-4 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-600 text-white shadow-xs">
              Recomendado
            </span>

            <div>
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Profissional</span>
              <h3 className="text-xl font-bold mt-1 text-neutral-900 dark:text-white">Plano PRO</h3>
              <p className="text-2xl font-extrabold mt-2 text-neutral-900 dark:text-white">
                15.000 AOA <span className="text-xs font-normal text-neutral-500">/ mês</span>
              </p>

              <ul className="mt-4 space-y-2 text-xs text-neutral-700 dark:text-neutral-200">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span>500 créditos de IA mensais</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span>Projetos ilimitados em equipa</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span>Sincronização contínua com GitHub</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span>Prioridade nos modelos OpenRouter</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => handleSelectPlan('pro')}
              disabled={isProcessing}
              className="mt-6 w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md transition-all cursor-pointer"
            >
              {currentUser?.plan === 'pro' ? 'Plano Ativo' : 'Ativar Plano PRO'}
            </button>
          </div>

          {/* Enterprise Tier */}
          <div className="p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#16161c] flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">Corporativo</span>
              <h3 className="text-xl font-bold mt-1 text-neutral-900 dark:text-white">Enterprise</h3>
              <p className="text-2xl font-extrabold mt-2 text-neutral-900 dark:text-white">
                45.000 AOA <span className="text-xs font-normal text-neutral-500">/ mês</span>
              </p>

              <ul className="mt-4 space-y-2 text-xs text-neutral-600 dark:text-neutral-300">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                  <span>Créditos de IA ilimitados</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                  <span>Colaboração sem limite de parceiros</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                  <span>Suporte dedicado da IMCH Soluções</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                  <span>Auditoria e segurança avançada</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => handleSelectPlan('enterprise')}
              disabled={isProcessing}
              className="mt-6 w-full py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-900 font-semibold text-xs shadow-md transition-all cursor-pointer"
            >
              {currentUser?.plan === 'enterprise' ? 'Plano Ativo' : 'Ativar Enterprise'}
            </button>
          </div>
        </div>

        {/* Quick Add Credits Pack */}
        <div className="p-4 rounded-xl bg-neutral-100/70 dark:bg-[#14141a] border border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div>
            <p className="font-semibold text-neutral-900 dark:text-white">Precisa apenas de recarregar créditos avulsos?</p>
            <p className="text-neutral-500">Adicione pacotes imediatos sem alterar a sua subscrição mensal.</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleAddCredits(50)}
              disabled={isProcessing}
              className="px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 hover:bg-white dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 font-medium transition-colors cursor-pointer"
            >
              +50 Créditos (2.500 AOA)
            </button>
            <button
              onClick={() => handleAddCredits(200)}
              disabled={isProcessing}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors cursor-pointer shadow-xs"
            >
              +200 Créditos (8.000 AOA)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
