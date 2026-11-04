import React, { useState, useEffect } from 'react';
import { 
  X, 
  Github, 
  GitBranch, 
  GitCommit, 
  GitPullRequest, 
  RefreshCw, 
  UploadCloud, 
  DownloadCloud, 
  CheckCircle2, 
  AlertCircle,
  KeyRound,
  ExternalLink
} from 'lucide-react';
import { apiService } from '../services/api';
import { Project } from '../types';

interface GitHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
}

export const GitHubModal: React.FC<GitHubModalProps> = ({ isOpen, onClose, project }) => {
  const [status, setStatus] = useState<any>(null);
  const [token, setToken] = useState<string>(() => localStorage.getItem('imch_github_token') || '');
  const [commitMessage, setCommitMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadStatus();
    }
  }, [isOpen]);

  const loadStatus = async () => {
    setIsLoading(true);
    setActionError(null);
    try {
      const data = await apiService.getGitHubStatus();
      setStatus(data);
    } catch (err: any) {
      setActionError(err.message || 'Erro ao carregar estado do GitHub.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePull = async () => {
    setIsLoading(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      const res = await apiService.pullGitHub(token || undefined);
      setActionSuccess(res.message || 'Repositório sincronizado com sucesso a partir do GitHub!');
      await loadStatus();
    } catch (err: any) {
      setActionError(err.message || 'Erro ao obter alterações do GitHub.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePush = async () => {
    setIsLoading(true);
    setActionError(null);
    setActionSuccess(null);
    const msg = commitMessage.trim() || `Atualização: ${project.name || 'Projeto IMCH'}`;
    try {
      const res = await apiService.pushGitHub(token || undefined, msg);
      setActionSuccess(res.message || 'Código publicado no GitHub com sucesso!');
      setCommitMessage('');
      await loadStatus();
    } catch (err: any) {
      setActionError(err.message || 'Erro ao publicar código no GitHub.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveToken = (val: string) => {
    setToken(val);
    localStorage.setItem('imch_github_token', val);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#111116] border border-neutral-200 dark:border-neutral-800 shadow-2xl p-6 text-neutral-900 dark:text-neutral-100 flex flex-col gap-5">
        <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-neutral-900 text-white flex items-center justify-center dark:bg-white dark:text-neutral-900 shadow-sm">
              <Github className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900 dark:text-white">Sincronização com GitHub</h2>
              <p className="text-xs text-neutral-500">Controlo de versão em tempo real</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status Card */}
        <div className="p-4 rounded-xl bg-neutral-50 dark:bg-[#181820] border border-neutral-200 dark:border-neutral-800 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-neutral-500 font-medium">Repositório Remoto:</span>
            <span className="font-mono text-neutral-800 dark:text-neutral-200 truncate max-w-[260px]">
              {status?.remoteUrl || 'divercaoanimada35-hash/-IMCH-AII.git'}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-neutral-500 font-medium">Ramo Atual:</span>
            <span className="flex items-center gap-1 font-semibold text-blue-600 dark:text-blue-400">
              <GitBranch className="w-3.5 h-3.5" />
              <span>{status?.branch || 'main'}</span>
            </span>
          </div>

          {status?.lastCommit && (
            <div className="flex items-center justify-between pt-1 border-t border-neutral-200/60 dark:border-neutral-700/60">
              <span className="text-neutral-500 font-medium">Último Commit:</span>
              <span className="font-mono text-[11px] text-neutral-600 dark:text-neutral-400 truncate max-w-[220px]">
                {status.lastCommit}
              </span>
            </div>
          )}
        </div>

        {/* Token Input */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-neutral-400" />
              <span>GitHub Personal Access Token (PAT)</span>
            </span>
            <span className="text-[10px] text-neutral-500">Opcional para repos públicos</span>
          </label>
          <input
            type="password"
            value={token}
            onChange={(e) => handleSaveToken(e.target.value)}
            placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
            className="w-full px-3.5 py-2 rounded-xl text-xs bg-neutral-50 dark:bg-[#181820] border border-neutral-200 dark:border-neutral-700 font-mono text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Push Commit Message */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
            Mensagem de Commit (para Publicar / Push)
          </label>
          <input
            type="text"
            value={commitMessage}
            onChange={(e) => setCommitMessage(e.target.value)}
            placeholder="Ex: Atualização do layout responsivo e novos ficheiros"
            className="w-full px-3.5 py-2 rounded-xl text-xs bg-neutral-50 dark:bg-[#181820] border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {actionSuccess && (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {actionError && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{actionError}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-2 border-t border-neutral-100 dark:border-neutral-800">
          <button
            onClick={loadStatus}
            disabled={isLoading}
            className="w-full sm:w-auto p-2 rounded-xl text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            title="Atualizar Estado"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handlePull}
              disabled={isLoading}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              <DownloadCloud className="w-3.5 h-3.5 text-blue-500" />
              <span>Pull (Atualizar)</span>
            </button>

            <button
              onClick={handlePush}
              disabled={isLoading}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-900 shadow-md transition-colors cursor-pointer"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Push (Publicar)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
