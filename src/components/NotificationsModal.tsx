import React, { useState } from 'react';
import { 
  X, 
  Bell, 
  Check, 
  XCircle, 
  Folder, 
  User, 
  MessageSquare, 
  ArrowRight, 
  Clock, 
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { CollaborationInvite, UserProfile, Project } from '../types';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  invites: CollaborationInvite[];
  projects: Project[];
  currentProject: Project;
  onRefreshInvites: () => void;
  onAcceptAndOpenProject: (invite: CollaborationInvite) => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  invites,
  onRefreshInvites,
  onAcceptAndOpenProject,
}) => {
  const [activeTab, setActiveTab] = useState<'invites' | 'history'>('invites');

  if (!isOpen) return null;

  const pendingInvites = invites.filter((i) => i.status === 'pending');
  const pastInvites = invites.filter((i) => i.status !== 'pending');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#111116] border border-neutral-200 dark:border-neutral-800 shadow-2xl p-6 text-neutral-900 dark:text-neutral-100 flex flex-col gap-5">
        <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900 dark:text-white">Notificações & Convites</h2>
              <p className="text-xs text-neutral-500">Convites para projetos partilhados</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={onRefreshInvites}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
              title="Atualizar"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab selection */}
        <div className="flex p-0.5 rounded-lg bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 text-xs">
          <button
            onClick={() => setActiveTab('invites')}
            className={`flex-1 py-1.5 rounded-md font-medium text-center transition-colors cursor-pointer ${
              activeTab === 'invites'
                ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs font-semibold'
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            Pendentes ({pendingInvites.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-1.5 rounded-md font-medium text-center transition-colors cursor-pointer ${
              activeTab === 'history'
                ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs font-semibold'
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            Histórico ({pastInvites.length})
          </button>
        </div>

        {/* List */}
        <div className="max-h-[360px] overflow-y-auto space-y-3">
          {activeTab === 'invites' ? (
            pendingInvites.length === 0 ? (
              <div className="p-8 text-center text-neutral-500 text-xs">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-30 text-blue-500" />
                <p>Nenhum convite pendente no momento.</p>
              </div>
            ) : (
              pendingInvites.map((invite) => (
                <div
                  key={invite.id}
                  className="p-4 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/30 dark:bg-blue-950/20 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <Folder className="w-3.5 h-3.5 text-blue-500" />
                        <h4 className="font-bold text-xs text-neutral-900 dark:text-white">{invite.projectName}</h4>
                      </div>
                      <p className="text-[11px] text-neutral-500">
                        De: <span className="font-medium text-neutral-700 dark:text-neutral-300">{invite.fromUserName}</span> ({invite.fromUserEmail})
                      </p>
                    </div>

                    <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300">
                      Pendente
                    </span>
                  </div>

                  {invite.message && (
                    <p className="text-xs italic bg-white/70 dark:bg-black/30 p-2.5 rounded-lg border border-neutral-200/50 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300">
                      "{invite.message}"
                    </p>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      onClick={() => onAcceptAndOpenProject(invite)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Aceitar e Abrir Projeto</span>
                    </button>
                  </div>
                </div>
              ))
            )
          ) : (
            pastInvites.length === 0 ? (
              <div className="p-8 text-center text-neutral-500 text-xs">
                <p>Nenhum histórico de convites.</p>
              </div>
            ) : (
              pastInvites.map((invite) => (
                <div
                  key={invite.id}
                  className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#16161c] flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <p className="font-semibold text-neutral-900 dark:text-white">{invite.projectName}</p>
                    <p className="text-[11px] text-neutral-500">{invite.fromUserEmail}</p>
                  </div>

                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase ${
                      invite.status === 'accepted'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                        : 'bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300'
                    }`}
                  >
                    {invite.status === 'accepted' ? 'Aceite' : 'Recusado'}
                  </span>
                </div>
              ))
            )
          )}
        </div>
      </div>
    </div>
  );
};
