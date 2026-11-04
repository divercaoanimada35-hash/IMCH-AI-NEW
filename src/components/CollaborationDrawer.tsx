import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Users, 
  MessageSquare, 
  Send, 
  Share2, 
  UserPlus, 
  CheckCircle2, 
  Circle,
  FileCode
} from 'lucide-react';
import { Project, UserProfile, CollaboratorUser, DirectSMSMessage } from '../types';
import { collaborationService } from '../services/collaborationService';

interface CollaborationDrawerProps {
  project: Project;
  currentUser: UserProfile | null;
  collaborators: CollaboratorUser[];
  isOpen: boolean;
  onClose: () => void;
  onOpenInvite: () => void;
}

export const CollaborationDrawer: React.FC<CollaborationDrawerProps> = ({
  project,
  currentUser,
  collaborators,
  isOpen,
  onClose,
  onOpenInvite,
}) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'team'>('chat');
  const [messages, setMessages] = useState<DirectSMSMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (currentUser?.email) {
      collaborationService.getMessages(currentUser.email, 'team@imch.ao').then(setMessages).catch(() => {});
    }
  }, [currentUser?.email, project.id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputText.trim();
    if (!text || !currentUser) return;

    setInputText('');

    const newMsg: DirectSMSMessage = {
      id: `msg_${Date.now()}`,
      fromEmail: currentUser.email,
      fromName: currentUser.name,
      toEmail: 'team@imch.ao',
      toName: 'Equipa do Projeto',
      text,
      timestamp: new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }),
      createdAt: new Date().toISOString(),
      read: true,
    };

    setMessages((prev) => [...prev, newMsg]);

    try {
      await collaborationService.sendSMS({
        fromEmail: currentUser.email,
        fromName: currentUser.name,
        toEmail: 'team@imch.ao',
        toName: 'Equipa do Projeto',
        text,
      });
    } catch {}
  };

  if (!isOpen) return null;

  return (
    <div className="w-80 h-full bg-[#111116] border-l border-neutral-800 flex flex-col shrink-0 text-neutral-200 select-none z-20 animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="h-10 px-3 border-b border-neutral-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1.5 p-0.5 rounded-lg bg-neutral-900 border border-neutral-800 text-xs">
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
              activeTab === 'chat' ? 'bg-neutral-800 text-white shadow-xs font-semibold' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <MessageSquare className="w-3 h-3 text-blue-400" />
            <span>Chat</span>
          </button>
          <button
            onClick={() => setActiveTab('team')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
              activeTab === 'team' ? 'bg-neutral-800 text-white shadow-xs font-semibold' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Users className="w-3 h-3 text-purple-400" />
            <span>Equipa</span>
          </button>
        </div>

        <button
          onClick={onClose}
          className="p-1 rounded text-neutral-400 hover:text-white hover:bg-neutral-800 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {activeTab === 'chat' ? (
          <div className="flex flex-col h-full justify-between gap-3">
            <div className="space-y-2 overflow-y-auto pr-1">
              {messages.length === 0 ? (
                <div className="p-6 text-center text-neutral-500 text-xs">
                  <MessageSquare className="w-6 h-6 mx-auto mb-2 opacity-30 text-blue-400" />
                  <p>Inicie a conversa com a sua equipa e parceiros neste projeto.</p>
                </div>
              ) : (
                messages.map((m) => {
                  const isMe = m.fromEmail.toLowerCase() === (currentUser?.email || '').toLowerCase();
                  return (
                    <div
                      key={m.id}
                      className={`p-2.5 rounded-xl text-xs space-y-1 ${
                        isMe ? 'bg-blue-600/20 border border-blue-500/30 ml-4' : 'bg-neutral-900 border border-neutral-800 mr-4'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] text-neutral-400">
                        <span className="font-semibold text-neutral-300">{isMe ? 'Você' : m.fromName}</span>
                        <span>{m.timestamp}</span>
                      </div>
                      <p className="text-neutral-100 whitespace-pre-wrap">{m.text}</p>
                    </div>
                  );
                })
              )}
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="flex items-center gap-1.5 pt-2 border-t border-neutral-800">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Mensagem para a equipa..."
                className="flex-1 px-3 py-1.5 rounded-lg text-xs bg-neutral-900 border border-neutral-800 text-white placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="p-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Colaboradores</span>
              <button
                onClick={onOpenInvite}
                className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 cursor-pointer font-medium"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Convidar</span>
              </button>
            </div>

            <div className="space-y-2">
              {/* Current user */}
              <div className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-[10px]">
                    {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'V'}
                  </div>
                  <div>
                    <p className="font-semibold text-neutral-200">{currentUser?.name || 'Desenvolvedor'}</p>
                    <p className="text-[10px] text-neutral-500">{currentUser?.email || 'dev@imch.ao'}</p>
                  </div>
                </div>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-950 text-blue-400 border border-blue-800 uppercase font-bold">
                  Você
                </span>
              </div>

              {/* Other collaborators */}
              {collaborators.map((c, i) => (
                <div
                  key={c.id || i}
                  className="p-2.5 rounded-xl bg-neutral-900/60 border border-neutral-800/80 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-[10px]">
                      {(c.name || c.email || 'C').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-neutral-200">{c.name || 'Parceiro'}</p>
                      <p className="text-[10px] text-neutral-500">{c.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-emerald-400 text-[10px]">
                    <Circle className="w-2 h-2 fill-current" />
                    <span>Online</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
