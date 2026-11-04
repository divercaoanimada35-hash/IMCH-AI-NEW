import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  FileCode, 
  Layers, 
  ArrowRight, 
  Loader2, 
  Plus, 
  FolderPlus 
} from 'lucide-react';
import { apiService } from '../services/api';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectReady: (projectData: {
    projectName: string;
    description: string;
    entryFile: string;
    files: Record<string, string>;
    architecturePlan?: any;
  }) => void;
}

export const NewProjectModal: React.FC<NewProjectModalProps> = ({
  isOpen,
  onClose,
  onProjectReady,
}) => {
  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCreateBlank = () => {
    const name = projectName.trim() || 'Projeto em branco';
    const desc = description.trim() || 'Projeto limpo sem ficheiros';

    onProjectReady({
      projectName: name,
      description: desc,
      entryFile: '',
      files: {},
    });

    onClose();
  };

  const handleGenerateWithAI = async () => {
    const prompt = description.trim() || projectName.trim();
    if (!prompt) {
      setError('Por favor, descreva o que deseja criar.');
      return;
    }

    setError(null);
    setIsGenerating(true);

    try {
      const res = await apiService.generateSite({
        briefing: prompt,
      });

      if (res && res.files) {
        onProjectReady({
          projectName: res.projectName || res.spec?.siteName || projectName || 'Projeto IMCH',
          description: res.description || res.spec?.description || prompt,
          entryFile: res.entryFile || 'index.html',
          files: res.files,
          architecturePlan: res.architecturePlan || res.spec,
        });
        onClose();
      } else {
        throw new Error('Nenhum ficheiro retornado.');
      }
    } catch (err: any) {
      setError(err.message || 'Falha ao gerar projeto com IA.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#111116] border border-neutral-200 dark:border-neutral-800 shadow-2xl p-6 text-neutral-900 dark:text-neutral-100 flex flex-col gap-5">
        <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 flex items-center justify-center">
              <FolderPlus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900 dark:text-white">Criar Novo Projeto</h2>
              <p className="text-xs text-neutral-500">Configure o ambiente de desenvolvimento</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              Nome do Projeto
            </label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="Ex: Gestão de Clientes IMCH"
              className="w-full px-3.5 py-2 rounded-xl text-xs sm:text-sm bg-neutral-50 dark:bg-[#181820] border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:focus:ring-neutral-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              Descrição / Briefing para IA (opcional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva funcionalidades pretendidas, estilo visual ou proposta de valor..."
              rows={3}
              className="w-full px-3.5 py-2 rounded-xl text-xs sm:text-sm bg-neutral-50 dark:bg-[#181820] border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:focus:ring-neutral-600 resize-none"
            />
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs">
              {error}
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-2 border-t border-neutral-100 dark:border-neutral-800">
          <button
            onClick={handleCreateBlank}
            disabled={isGenerating}
            className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 transition-colors cursor-pointer"
          >
            Projeto em Branco
          </button>

          <button
            onClick={handleGenerateWithAI}
            disabled={isGenerating}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:hover:bg-white text-white dark:text-neutral-900 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>A Gerar Ficheiros...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Gerar com IA</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
