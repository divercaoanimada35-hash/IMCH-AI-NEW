import React from 'react';
import { 
  Users, 
  Share2, 
  MessageSquare, 
  Lock, 
  Globe, 
  Circle,
  Plus
} from 'lucide-react';
import { Project, UserProfile, CollaboratorUser } from '../types';

interface CollaborationBarProps {
  project: Project;
  currentUser: UserProfile | null;
  collaborators: CollaboratorUser[];
  onInvitePartner: () => void;
  onToggleDrawer: () => void;
  isDrawerOpen: boolean;
}

export const CollaborationBar: React.FC<CollaborationBarProps> = ({
  project,
  currentUser,
  collaborators,
  onInvitePartner,
  onToggleDrawer,
  isDrawerOpen,
}) => {
  return (
    <div className="h-9 px-3 bg-[#111116] border-b border-neutral-800 flex items-center justify-between text-xs select-none shrink-0">
      <div className="flex items-center gap-2">
        <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-neutral-800 text-neutral-300">
          {project.isShared ? (
            <>
              <Globe className="w-3 h-3 text-blue-400" />
              <span>Colaborativo</span>
            </>
          ) : (
            <>
              <Lock className="w-3 h-3 text-neutral-400" />
              <span>Privado</span>
            </>
          )}
        </span>

        {project.isShared && (
          <span className="text-[11px] text-neutral-400 hidden sm:inline">
            Proprietário: {project.ownerName || project.ownerEmail || 'Você'}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* Collaborators List Bubbles */}
        <div className="flex items-center -space-x-1.5">
          {collaborators.slice(0, 4).map((c, idx) => (
            <div
              key={c.id || idx}
              className="w-5 h-5 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 border border-neutral-800 flex items-center justify-center text-white text-[9px] font-bold shadow-xs relative"
              title={`${c.name || c.email} (Online)`}
            >
              {(c.name || c.email || 'U').charAt(0).toUpperCase()}
              <span className="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-500 ring-1 ring-black" />
            </div>
          ))}
          {collaborators.length > 4 && (
            <div className="w-5 h-5 rounded-full bg-neutral-800 text-neutral-300 border border-neutral-700 flex items-center justify-center text-[9px] font-bold">
              +{collaborators.length - 4}
            </div>
          )}
        </div>

        {/* Invite Button */}
        <button
          onClick={onInvitePartner}
          className="flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
          title="Convidar parceiro para este projeto"
        >
          <Share2 className="w-3 h-3 text-blue-400" />
          <span className="hidden md:inline">Partilhar</span>
        </button>

        {/* Drawer Toggle */}
        <button
          onClick={onToggleDrawer}
          className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
            isDrawerOpen
              ? 'bg-blue-600 text-white'
              : 'text-neutral-300 hover:text-white hover:bg-neutral-800'
          }`}
          title="Abrir painel de equipa e chat"
        >
          <MessageSquare className="w-3 h-3" />
          <span className="hidden sm:inline">Equipa</span>
        </button>
      </div>
    </div>
  );
};
