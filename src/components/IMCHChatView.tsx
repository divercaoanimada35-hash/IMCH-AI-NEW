import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Plus, 
  ArrowUp, 
  Mic, 
  MicOff, 
  History, 
  Sparkles, 
  Code2, 
  Copy, 
  Check, 
  Loader2, 
  Bot, 
  User, 
  Trash2, 
  X, 
  Volume2, 
  VolumeX,
  MessageSquare,
  ArrowRight
} from 'lucide-react';
import { apiService } from '../services/api';
import { UserProfile, ChatMessage } from '../types';
import { useVoiceInteraction } from '../hooks/useVoiceInteraction';
import { VoiceActivityHUD } from './VoiceActivityHUD';
import { FormattedMessageContent } from './FormattedMessageContent';

interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  updatedAt: string;
}

interface IMCHChatViewProps {
  onOpenDeveloperWithPrompt: (promptText: string) => void;
  onProjectReady?: (projectData: any) => void;
  onUpdateFile?: (path: string, content: string) => void;
  onSwitchToDeveloper?: () => void;
  currentProjectFiles?: Record<string, any>;
  user: UserProfile | null;
  onRequireAuth: () => void;
  selectedModel: string;
}

export const IMCHChatView: React.FC<IMCHChatViewProps> = ({
  onOpenDeveloperWithPrompt,
  user,
  onRequireAuth,
  selectedModel,
}) => {
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    try {
      const saved = localStorage.getItem('imch_chat_sessions');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [
      {
        id: 'session-1',
        title: 'Arquitetura de microsserviços',
        messages: [],
        updatedAt: new Date().toISOString(),
      },
    ];
  });

  const [activeSessionId, setActiveSessionId] = useState<string>(() => {
    return sessions[0]?.id || 'session-default';
  });

  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync active session messages
  useEffect(() => {
    const current = sessions.find((s) => s.id === activeSessionId);
    if (current) {
      setMessages(current.messages || []);
    } else {
      setMessages([]);
    }
  }, [activeSessionId]);

  // Persist sessions
  const saveSessions = useCallback((updated: ChatSession[]) => {
    setSessions(updated);
    try {
      localStorage.setItem('imch_chat_sessions', JSON.stringify(updated.slice(0, 30)));
    } catch {}
  }, []);

  // Update active session messages
  const updateActiveSessionMessages = useCallback((newMessages: ChatMessage[], firstPrompt?: string) => {
    setSessions((prev) => {
      const idx = prev.findIndex((s) => s.id === activeSessionId);
      if (idx >= 0) {
        const current = prev[idx];
        const nextTitle =
          current.title && current.title !== 'Nova Conversa' && !current.title.startsWith('Conversa')
            ? current.title
            : firstPrompt
            ? firstPrompt.slice(0, 35)
            : current.title;

        const updatedSession: ChatSession = {
          ...current,
          title: nextTitle,
          messages: newMessages,
          updatedAt: new Date().toISOString(),
        };
        const nextSessions = [...prev];
        nextSessions[idx] = updatedSession;
        try {
          localStorage.setItem('imch_chat_sessions', JSON.stringify(nextSessions.slice(0, 30)));
        } catch {}
        return nextSessions;
      } else {
        const newSession: ChatSession = {
          id: activeSessionId,
          title: firstPrompt ? firstPrompt.slice(0, 35) : 'Conversa IMCH',
          messages: newMessages,
          updatedAt: new Date().toISOString(),
        };
        const nextSessions = [newSession, ...prev];
        try {
          localStorage.setItem('imch_chat_sessions', JSON.stringify(nextSessions.slice(0, 30)));
        } catch {}
        return nextSessions;
      }
    });
  }, [activeSessionId]);

  // Scroll to bottom when messages update
  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  // Core send message handler
  const handleSend = async (customPrompt?: string) => {
    const text = (customPrompt || input).trim();
    if (!text || isLoading) return;

    if (!user) {
      onRequireAuth();
      return;
    }

    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }),
    };

    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    updateActiveSessionMessages(nextMessages, text);
    if (!customPrompt) setInput('');
    setIsLoading(true);

    try {
      const history = nextMessages.map((m) => ({
        role: m.role || (m.sender === 'user' ? 'user' : 'assistant'),
        content: m.content,
      }));

      const res = await apiService.sendChat({
        message: text,
        history,
        model: selectedModel,
      });

      const replyText = res.reply || res.message || 'Comando processado com sucesso.';

      const assistantMsg: ChatMessage = {
        id: `ast_${Date.now()}`,
        sender: 'assistant',
        role: 'assistant',
        content: replyText,
        timestamp: new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }),
      };

      const finalMessages = [...nextMessages, assistantMsg];
      setMessages(finalMessages);
      updateActiveSessionMessages(finalMessages);

      // If voice mode is active, read the answer aloud
      if (isVoiceModeActive && speakText) {
        speakText(replyText);
      }
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `err_${Date.now()}`,
        sender: 'system',
        role: 'system',
        content: `Erro: ${err.message || 'Falha ao comunicar com a inteligência artificial.'}`,
        timestamp: new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }),
      };
      const errorMessages = [...nextMessages, errorMsg];
      setMessages(errorMessages);
      updateActiveSessionMessages(errorMessages);
    } finally {
      setIsLoading(false);
    }
  };

  // Voice Interaction Hook with automatic send upon silence detection
  const {
    isListening,
    isVoiceModeActive,
    liveTranscript,
    audioLevel,
    micError,
    toggleListening,
    toggleVoiceMode,
    stopListening,
    speakText,
    clearMicError,
  } = useVoiceInteraction({
    onSendMessage: (spokenText) => {
      // Called automatically when user finishes speaking!
      handleSend(spokenText);
    },
  });

  const handleStartNewConversation = () => {
    const newId = `session-${Date.now()}`;
    const newSession: ChatSession = {
      id: newId,
      title: 'Nova Conversa',
      messages: [],
      updatedAt: new Date().toISOString(),
    };
    const updated = [newSession, ...sessions];
    saveSessions(updated);
    setActiveSessionId(newId);
    setMessages([]);
    setInput('');
  };

  const handleDeleteSession = (idToDelete: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const remaining = sessions.filter((s) => s.id !== idToDelete);
    if (remaining.length === 0) {
      const fresh: ChatSession = {
        id: `session-${Date.now()}`,
        title: 'Nova Conversa',
        messages: [],
        updatedAt: new Date().toISOString(),
      };
      saveSessions([fresh]);
      setActiveSessionId(fresh.id);
    } else {
      saveSessions(remaining);
      if (activeSessionId === idToDelete) {
        setActiveSessionId(remaining[0].id);
      }
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const isInitialState = messages.length === 0;

  return (
    <div className="flex-1 flex flex-col h-full bg-[#060608] text-neutral-100 overflow-hidden relative select-none">
      {/* Background Pattern */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: 'radial-gradient(#383838 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* Top Header */}
      <div className="h-14 px-4 sm:px-6 border-b border-neutral-900 bg-[#08080c]/80 backdrop-blur-md flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-2.5">
          {/* Histórico Button with count */}
          <button
            type="button"
            onClick={() => setIsHistoryOpen((prev) => !prev)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-800 bg-neutral-900/90 hover:bg-neutral-800 text-neutral-300 hover:text-white text-xs font-medium transition-colors cursor-pointer"
            title="Ver histórico de conversas"
          >
            <History className="w-3.5 h-3.5 text-neutral-400" />
            <span>Histórico</span>
            <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded-full bg-neutral-800 text-neutral-300 ml-0.5">
              {sessions.length}
            </span>
          </button>
        </div>

        {/* Status / Active Model */}
        <div className="flex items-center gap-2">
          {isVoiceModeActive && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-800 border border-neutral-700 text-[11px] font-semibold text-neutral-200 animate-pulse">
              <Volume2 className="w-3.5 h-3.5" />
              <span>Modo Voz Ativo</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Container Area */}
      <div className="flex-1 overflow-y-auto flex flex-col relative z-10">
        {/* Voice Error Notice if any */}
        {micError && (
          <div className="max-w-2xl mx-auto w-full px-4 pt-3">
            <VoiceActivityHUD
              isListening={isListening}
              isVoiceModeActive={isVoiceModeActive}
              audioLevel={audioLevel}
              liveTranscript={liveTranscript}
              micError={micError}
              onCommit={() => {}}
              onCancel={stopListening}
              onClearError={clearMicError}
            />
          </div>
        )}

        {/* Live voice feedback indicator when user is speaking */}
        {isListening && (
          <div className="sticky top-2 z-30 max-w-xl mx-auto w-full px-4 animate-in fade-in slide-in-from-top-2">
            <div className="p-3 rounded-2xl bg-neutral-900 border border-neutral-700 text-neutral-200 shadow-xl flex items-center justify-between gap-3 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-red-500 animate-ping shrink-0" />
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-white">A ouvir a sua voz...</p>
                  <p className="text-[11px] text-neutral-400 italic line-clamp-1">
                    {liveTranscript || 'Fale agora; a mensagem será enviada automaticamente quando fizer uma pausa.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={stopListening}
                className="p-1 rounded-lg hover:bg-white/10 text-neutral-300 hover:text-white cursor-pointer"
                title="Parar de ouvir"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {isInitialState ? (
          /* ======================================================== */
          /* HERO VIEW: Exact reproduction of image_277657f4.png       */
          /* ======================================================== */
          <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 my-auto text-center max-w-3xl mx-auto w-full">
            {/* Title */}
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white mb-4">
              Por onde começamos?
            </h1>

            {/* Suggestion pill */}
            <button
              type="button"
              onClick={() => handleSend('Explica a diferença entre microsserviços e arquitetura modular e quando usar cada uma.')}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-900/90 border border-neutral-800 hover:border-neutral-700 text-xs text-neutral-300 hover:text-white shadow-md mb-8 transition-colors cursor-pointer"
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-300 bg-neutral-800 px-2 py-0.5 rounded border border-neutral-700">
                SUGESTÃO
              </span>
              <span className="truncate max-w-[280px] sm:max-w-md">
                «Explica a diferença entre microsserviços e arquitetu»
              </span>
            </button>

            {/* Central Capsule Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="w-full max-w-2xl rounded-2xl bg-[#121217]/95 border border-neutral-800/90 shadow-2xl p-2 px-3 flex items-center gap-2.5 focus-within:border-neutral-700 transition-all mb-8"
            >
              {/* Attach / Plus button */}
              <button
                type="button"
                onClick={() => setInput((prev) => (prev ? prev + ' [anexo]' : 'Analisa a arquitetura: '))}
                className="p-2 text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-800/60 transition-colors cursor-pointer shrink-0"
                title="Adicionar anexo ou requisito"
              >
                <Plus className="w-4 h-4" />
              </button>

              {/* Text input */}
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Pergunta qualquer coisa, conversa ou anexa ficheiros..."
                disabled={isLoading}
                className="flex-1 bg-transparent text-xs sm:text-sm text-white placeholder-neutral-500 focus:outline-none py-1.5"
              />

              {/* Right controls inside capsule */}
              <div className="flex items-center gap-1.5 shrink-0">
                {/* Voz button */}
                <button
                  type="button"
                  onClick={() => toggleVoiceMode()}
                  className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                    isVoiceModeActive
                      ? 'bg-neutral-800 text-white border-neutral-600 shadow-xs'
                      : 'bg-neutral-800/80 text-neutral-300 hover:text-white border-neutral-700/60 hover:bg-neutral-700/80'
                  }`}
                  title="Ativar modo de conversação contínua por voz"
                >
                  Voz
                </button>

                {/* Mic button */}
                <button
                  type="button"
                  onClick={toggleListening}
                  className={`p-2 rounded-xl transition-all cursor-pointer ${
                    isListening
                      ? 'bg-red-500/20 text-red-400 ring-2 ring-red-500/50 animate-pulse'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
                  }`}
                  title="Falar ao microfone (envio automático ao terminar)"
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>

                {/* Send button */}
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 text-white transition-all cursor-pointer shrink-0 shadow-xs"
                  title="Enviar mensagem"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUp className="w-4 h-4" />}
                </button>
              </div>
            </form>

            {/* 4 Cards in 2x2 Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl w-full text-left">
              {/* Card 1 */}
              <button
                type="button"
                onClick={() => handleSend('Gostaria de conversar livremente sobre novas ideias e soluções tecnológicas.')}
                className="p-4 rounded-2xl bg-[#0e0e13]/90 hover:bg-[#15151c] border border-neutral-800/80 hover:border-neutral-700 shadow-sm transition-all text-left cursor-pointer group"
              >
                <h3 className="font-bold text-xs sm:text-sm text-neutral-100 group-hover:text-blue-400 transition-colors">
                  Conversar livremente sobre qualquer assunto
                </h3>
                <p className="text-[11px] text-neutral-400 mt-1 leading-relaxed">
                  Perguntas, ideias, filosofia, ciência e tecnologia
                </p>
              </button>

              {/* Card 2 */}
              <button
                type="button"
                onClick={() => handleSend('Cria um prompt perfeito e detalhado para gerar um website moderno e responsivo no AI Developer.')}
                className="p-4 rounded-2xl bg-[#0e0e13]/90 hover:bg-[#15151c] border border-neutral-800/80 hover:border-neutral-700 shadow-sm transition-all text-left cursor-pointer group"
              >
                <h3 className="font-bold text-xs sm:text-sm text-neutral-100 group-hover:text-blue-400 transition-colors">
                  Criar prompt para novo website
                </h3>
                <p className="text-[11px] text-neutral-400 mt-1 leading-relaxed">
                  Escrever uma descrição perfeita para o AI Developer
                </p>
              </button>

              {/* Card 3 */}
              <button
                type="button"
                onClick={() => handleSend('Preciso de escrever e revisar um texto executivo com tom profissional e rigor técnico.')}
                className="p-4 rounded-2xl bg-[#0e0e13]/90 hover:bg-[#15151c] border border-neutral-800/80 hover:border-neutral-700 shadow-sm transition-all text-left cursor-pointer group"
              >
                <h3 className="font-bold text-xs sm:text-sm text-neutral-100 group-hover:text-blue-400 transition-colors">
                  Escrever ou revisar um texto profissional
                </h3>
                <p className="text-[11px] text-neutral-400 mt-1 leading-relaxed">
                  Artigos, emails, propostas ou relatórios
                </p>
              </button>

              {/* Card 4 */}
              <button
                type="button"
                onClick={() => handleSend('Como desenhar e estruturar a arquitetura de um website full-stack moderno e escalável?')}
                className="p-4 rounded-2xl bg-[#0e0e13]/90 hover:bg-[#15151c] border border-neutral-800/80 hover:border-neutral-700 shadow-sm transition-all text-left cursor-pointer group"
              >
                <h3 className="font-bold text-xs sm:text-sm text-neutral-100 group-hover:text-blue-400 transition-colors">
                  Planeamento de arquitetura de software
                </h3>
                <p className="text-[11px] text-neutral-400 mt-1 leading-relaxed">
                  Como desenhar e estruturar um website full-stack moderno
                </p>
              </button>
            </div>
          </div>
        ) : (
          /* ======================================================== */
          /* CONVERSATION FLOW (when messages exist)                  */
          /* ======================================================== */
          <div className="flex-1 flex flex-col justify-between max-w-4xl mx-auto w-full p-4 sm:p-6 space-y-4">
            <div className="space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.sender !== 'user' && (
                    <div className="w-7 h-7 rounded-lg bg-neutral-800 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5 border border-neutral-700">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] rounded-2xl p-4 text-xs sm:text-sm shadow-sm relative group ${
                      msg.sender === 'user'
                        ? 'bg-neutral-800 border border-neutral-700 text-white rounded-br-xs'
                        : msg.sender === 'system'
                        ? 'bg-red-950/40 border border-red-900 text-red-300'
                        : 'bg-[#111116] border border-neutral-800 text-neutral-200 rounded-bl-xs'
                    }`}
                  >
                    {msg.sender === 'user' ? (
                      <div className="whitespace-pre-wrap leading-relaxed select-text">{msg.content}</div>
                    ) : (
                      <div className="leading-relaxed select-text">
                        <FormattedMessageContent content={msg.content} />
                      </div>
                    )}

                    <div
                      className={`mt-2 flex items-center justify-between text-[10px] ${
                        msg.sender === 'user' ? 'text-blue-100' : 'text-neutral-400'
                      }`}
                    >
                      <span>{msg.timestamp}</span>
                      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleCopy(msg.content, msg.id)}
                          className="p-1 rounded hover:bg-white/10 cursor-pointer"
                          title="Copiar mensagem"
                        >
                          {copiedId === msg.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        </button>

                        {msg.sender === 'assistant' && (
                          <button
                            onClick={() => onOpenDeveloperWithPrompt(msg.content)}
                            className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 font-medium hover:bg-blue-500/30 cursor-pointer"
                            title="Abrir e criar no Developer"
                          >
                            <Code2 className="w-3 h-3" />
                            <span>Criar no Editor</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {msg.sender === 'user' && (
                    <div className="w-7 h-7 rounded-lg bg-neutral-800 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5 font-bold text-xs border border-neutral-700">
                      {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-3">
                  <div className="w-7 h-7 rounded-lg bg-neutral-800 border border-neutral-700 text-white flex items-center justify-center shrink-0 shadow-sm animate-pulse">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="p-4 rounded-2xl rounded-bl-xs bg-[#111116] border border-neutral-800 text-xs text-neutral-400 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-neutral-400" />
                    <span>A formular resposta...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Bottom Input Capsule in conversation mode */}
            <div className="pt-4 sticky bottom-2 z-20">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="w-full rounded-2xl bg-[#121217]/95 border border-neutral-800 shadow-2xl p-2 px-3 flex items-center gap-2.5 focus-within:border-neutral-700 transition-all backdrop-blur-md"
              >
                <button
                  type="button"
                  onClick={() => setInput((prev) => (prev ? prev + ' [anexo]' : 'Analisa o código: '))}
                  className="p-2 text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-800/60 transition-colors cursor-pointer shrink-0"
                  title="Adicionar anexo"
                >
                  <Plus className="w-4 h-4" />
                </button>

                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Pergunta qualquer coisa, conversa ou anexa ficheiros..."
                  disabled={isLoading}
                  className="flex-1 bg-transparent text-xs sm:text-sm text-white placeholder-neutral-500 focus:outline-none py-1.5"
                />

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => toggleVoiceMode()}
                    className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                      isVoiceModeActive
                        ? 'bg-neutral-800 text-white border-neutral-600 shadow-xs'
                        : 'bg-neutral-800/80 text-neutral-300 hover:text-white border-neutral-700/60 hover:bg-neutral-700/80'
                    }`}
                    title="Ativar modo de conversação contínua por voz"
                  >
                    Voz
                  </button>

                  <button
                    type="button"
                    onClick={toggleListening}
                    className={`p-2 rounded-xl transition-all cursor-pointer ${
                      isListening
                        ? 'bg-red-500/20 text-red-400 ring-2 ring-red-500/50 animate-pulse'
                        : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
                    }`}
                    title="Falar ao microfone (envio automático ao terminar)"
                  >
                    {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </button>

                  <button
                    type="submit"
                    disabled={isLoading || !input.trim()}
                    className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 text-white transition-all cursor-pointer shrink-0 shadow-xs"
                    title="Enviar mensagem"
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUp className="w-4 h-4" />}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* History Slide-over Drawer */}
      {isHistoryOpen && (
        <div className="absolute inset-y-0 left-0 w-80 bg-[#0e0e13] border-r border-neutral-800 shadow-2xl z-40 flex flex-col animate-in slide-in-from-left duration-200">
          <div className="h-14 px-4 border-b border-neutral-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-blue-400" />
              <h3 className="font-bold text-xs text-white uppercase tracking-wider">Histórico de Conversas</h3>
            </div>
            <button
              onClick={() => setIsHistoryOpen(false)}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
            {sessions.map((sess) => {
              const isCurrent = sess.id === activeSessionId;
              return (
                <div
                  key={sess.id}
                  onClick={() => {
                    setActiveSessionId(sess.id);
                    setIsHistoryOpen(false);
                  }}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all flex items-center justify-between gap-2 group ${
                    isCurrent
                      ? 'bg-blue-600/15 border-blue-500/40 text-white'
                      : 'bg-neutral-900/40 border-neutral-800/80 text-neutral-300 hover:bg-neutral-800/60'
                  }`}
                >
                  <div className="truncate flex-1">
                    <p className="font-semibold text-xs truncate">{sess.title || 'Conversa sem título'}</p>
                    <p className="text-[10px] text-neutral-500 font-mono mt-0.5">
                      {new Date(sess.updatedAt).toLocaleDateString('pt-PT')}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => handleDeleteSession(sess.id, e)}
                    className="p-1 text-neutral-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    title="Eliminar conversa"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>

          <div className="p-3 border-t border-neutral-800">
            <button
              type="button"
              onClick={() => {
                handleStartNewConversation();
                setIsHistoryOpen(false);
              }}
              className="w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nova Conversa</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
