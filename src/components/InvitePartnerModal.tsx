import React, { useState } from 'react';
import { 
  X, 
  Share2, 
  Mail, 
  Send, 
  Users, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  Folder 
} from 'lucide-react';
import { collaborationService } from '../services/collaborationService';
import { UserProfile, Project, CollaborationInvite } from '../types';

interface InvitePartnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  currentProject: Project;
  projects: Project[];
  currentProjectId: string;
  onSuccess: (invite: CollaborationInvite) => void;
  onOpenPricing: () => void;
  onRequireAuth: () => void;
}

export const InvitePartnerModal: React.FC<InvitePartnerModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  currentProject,
  projects,
  currentProjectId,
  onSuccess,
  onOpenPricing,
  onRequireAuth,
}) => {
  const [partnerEmail, setPartnerEmail] = useState('');
  const [selectedProjId, setSelectedProjId] = useState(currentProjectId || currentProject.id);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!currentUser) {
      onRequireAuth();
      return;
    }

    const email = partnerEmail.trim().toLowerCase();
    if (!email || !email.includes('@')) {
      setError('Por favor, introduza um e-mail válido para o colaborador.');
      return;
    }

    if (email === currentUser.email.toLowerCase()) {
      setError('Não pode convidar o seu próprio endereço de e-mail.');
      return;
    }

    const targetProject = projects.find((p) => p.id === selectedProjId) || currentProject;

    // Check free plan limit (1 project with 1 partner)
    if (currentUser.plan === 'free') {
      const alreadyShared = projects.filter((p) => p.isShared);
      if (alreadyShared.length >= 1 && !targetProject.isShared) {
        onOpenPricing();
        return;
      }
    }

    setIsLoading(true);
    try {
      const invite = await collaborationService.sendInvite({
        fromUserId: currentUser.id,
        fromUserName: currentUser.name,
        fromUserEmail: currentUser.email,
        toUserEmail: email,
        projectId: targetProject.id,
        projectName: targetProject.name,
        projectDescription: targetProject.description,
        message: message.trim() || undefined,
      });

      onSuccess(invite);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Falha ao enviar convite de colaboração.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#111116] border border-neutral-200 dark:border-neutral-800 shadow-2xl p-6 text-neutral-900 dark:text-neutral-100 flex flex-col gap-5">
        <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900 dark:text-white">Convidar Parceiro</h2>
              <p className="text-xs text-neutral-500">Colaboração e edição em tempo real</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              Projeto a Partilhar
            </label>
            <select
              value={selectedProjId}
              onChange={(e) => setSelectedProjId(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl text-xs sm:text-sm bg-neutral-50 dark:bg-[#181820] border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              E-mail do Colaborador / Parceiro
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={partnerEmail}
                onChange={(e) => setPartnerEmail(e.target.value)}
                placeholder="colega@empresa.com"
                className="w-full pl-10 pr-3.5 py-2 rounded-xl text-xs sm:text-sm bg-neutral-50 dark:bg-[#181820] border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              Mensagem de Convite (opcional)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Olá! Convido-te a colaborar neste projeto de software no IMCH AI Studio..."
              rows={3}
              className="w-full px-3.5 py-2 rounded-xl text-xs bg-neutral-50 dark:bg-[#181820] border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isLoading || !partnerEmail.trim()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold text-xs shadow-md shadow-blue-600/20 transition-all cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isLoading ? 'A Enviar...' : 'Enviar Convite'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
