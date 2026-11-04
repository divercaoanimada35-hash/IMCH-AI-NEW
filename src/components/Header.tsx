import React, { useState } from 'react';
import { 
  Sparkles, 
  Code2, 
  Globe, 
  MessageSquare, 
  Sun, 
  Moon, 
  Download, 
  Github, 
  Plus, 
  User, 
  LogOut, 
  Bell, 
  Share2, 
  Cpu, 
  ShieldCheck,
  ChevronDown,
  CreditCard
} from 'lucide-react';
import { UserProfile, CollaborationInvite } from '../types';

interface HeaderProps {
  currentView: 'developer' | 'chat' | 'generator';
  onSelectView: (view: 'developer' | 'chat' | 'generator') => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  workspaceLayout?: 'split' | 'code-only' | 'preview-only';
  onSelectLayout?: (layout: 'split' | 'code-only' | 'preview-only') => void;
  onNewProject: () => void;
  onExportZip: () => void;
  onOpenGithub: () => void;
  user: UserProfile | null;
  onOpenAuth: () => void;
  onOpenPricing: () => void;
  onLogout: () => void;
  selectedModel: string;
  onOpenModelModal: () => void;
  onOpenRegister: () => void;
  onOpenInvitePartner: () => void;
  onOpenNotifications: () => void;
  unreadNotificationsCount: number;
  invites: CollaborationInvite[];
  onAcceptInvite: (invite: CollaborationInvite) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onSelectView,
  theme,
  onToggleTheme,
  onNewProject,
  onExportZip,
  onOpenGithub,
  user,
  onOpenAuth,
  onOpenPricing,
  onLogout,
  selectedModel,
  onOpenModelModal,
  onOpenRegister,
  onOpenInvitePartner,
  onOpenNotifications,
  unreadNotificationsCount,
}) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  return (
    <header className="h-14 border-b border-neutral-200 dark:border-neutral-800 bg-white/90 dark:bg-[#0a0a0d]/95 backdrop-blur-md px-3 sm:px-4 flex items-center justify-between z-30 shrink-0">
      {/* Brand & Main View Tabs */}
      <div className="flex items-center gap-3 sm:gap-6">
        <div className="flex flex-col justify-center">
          <div className="flex items-baseline gap-2">
            <span className="font-black text-2xl sm:text-3xl tracking-tight text-neutral-950 dark:text-white uppercase font-sans">
              IMCH
            </span>
            <span className="font-black text-2xl sm:text-3xl tracking-tight text-neutral-950 dark:text-white uppercase font-sans">
              AI STUDIO
            </span>
          </div>
          <span className="text-[10px] font-medium text-neutral-500 dark:text-neutral-400 tracking-wider uppercase -mt-0.5 hidden sm:inline">
            Soluções Digitais
          </span>
        </div>

        {/* View Switcher */}
        <nav className="flex items-center p-0.5 rounded-lg bg-neutral-100 dark:bg-neutral-900/80 border border-neutral-200 dark:border-neutral-800">
          <button
            onClick={() => onSelectView('developer')}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
              currentView === 'developer'
                ? 'bg-white dark:bg-[#1c1c22] text-neutral-900 dark:text-white shadow-xs font-semibold'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <Code2 className="w-3.5 h-3.5 text-blue-500" />
            <span>Developer</span>
          </button>

          <button
            onClick={() => onSelectView('generator')}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
              currentView === 'generator'
                ? 'bg-white dark:bg-[#1c1c22] text-neutral-900 dark:text-white shadow-xs font-semibold'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-emerald-500" />
            <span className="hidden sm:inline">Gerador de Sites</span>
            <span className="sm:hidden">Sites</span>
          </button>

          <button
            onClick={() => onSelectView('chat')}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
              currentView === 'chat'
                ? 'bg-white dark:bg-[#1c1c22] text-neutral-900 dark:text-white shadow-xs font-semibold'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-purple-500" />
            <span>Chat IA</span>
          </button>
        </nav>
      </div>

      {/* Right Controls & Actions */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Model Selector without technical specifications */}
        <button
          onClick={onOpenModelModal}
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 hover:border-neutral-400 dark:hover:border-neutral-600 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
          title="Configurar Modelo de Inteligência Artificial"
        >
          <Cpu className="w-3.5 h-3.5 text-neutral-400" />
          <span>Modelo IA</span>
        </button>


        {/* Export ZIP */}
        <button
          onClick={onExportZip}
          className="p-1.5 rounded-md text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          title="Transferir projeto (.zip)"
        >
          <Download className="w-4 h-4" />
        </button>

        {/* GitHub Integration */}
        <button
          onClick={onOpenGithub}
          className="p-1.5 rounded-md text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          title="Sincronização com GitHub"
        >
          <Github className="w-4 h-4" />
        </button>

        {/* Invite / Share Partner */}
        <button
          onClick={onOpenInvitePartner}
          className="p-1.5 rounded-md text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          title="Convidar parceiro ou equipa"
        >
          <Share2 className="w-4 h-4" />
        </button>

        {/* Notifications / SMS */}
        <button
          onClick={onOpenNotifications}
          className="relative p-1.5 rounded-md text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          title="Notificações e mensagens diretas"
        >
          <Bell className="w-4 h-4" />
          {unreadNotificationsCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-black animate-pulse" />
          )}
        </button>

        {/* Theme Toggle */}
        <button
          onClick={onToggleTheme}
          className="p-1.5 rounded-md text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          title={theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* User Account / Profile */}
        {user ? (
          <div className="relative">
            <button
              onClick={() => setIsUserMenuOpen((prev) => !prev)}
              className="flex items-center gap-1.5 pl-2 pr-1 py-1 rounded-md text-xs font-medium text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer border border-neutral-200 dark:border-neutral-800"
            >
              <div className="w-5 h-5 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center text-white text-[10px] font-bold">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <span className="max-w-[90px] truncate hidden md:inline">{user.name.split(' ')[0]}</span>
              <ChevronDown className="w-3 h-3 text-neutral-400" />
            </button>

            {isUserMenuOpen && (
              <div
                className="absolute right-0 mt-2 w-56 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#121216] shadow-xl p-2 z-50 text-xs animate-in fade-in slide-in-from-top-1"
                onMouseLeave={() => setIsUserMenuOpen(false)}
              >
                <div className="px-3 py-2 border-b border-neutral-100 dark:border-neutral-800/80 mb-1">
                  <p className="font-semibold text-neutral-900 dark:text-white truncate">{user.name}</p>
                  <p className="text-[11px] text-neutral-500 truncate">{user.email}</p>
                  <div className="mt-1.5 flex items-center justify-between">
                    <span className="text-[10px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wider bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300">
                      Plano {user.plan}
                    </span>
                    <span className="text-[11px] font-mono text-neutral-500">
                      {user.plan === 'enterprise' ? 'Créditos ilimitados' : `${user.credits} créditos`}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    onOpenPricing();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  <CreditCard className="w-3.5 h-3.5 text-blue-500" />
                  <span>Gerir Plano & Créditos</span>
                </button>

                <button
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    onLogout();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Terminar Sessão</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <button
              onClick={onOpenAuth}
              className="px-2.5 py-1 text-xs font-medium rounded-md text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              Entrar
            </button>
            <button
              onClick={onOpenRegister}
              className="px-2.5 py-1 text-xs font-semibold rounded-md bg-blue-600 hover:bg-blue-500 text-white transition-colors cursor-pointer shadow-xs"
            >
              Criar Conta
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
