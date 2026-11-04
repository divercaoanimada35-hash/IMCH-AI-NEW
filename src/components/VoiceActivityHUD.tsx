import React from 'react';
import { Mic, MicOff, Send, X, AlertCircle, Volume2 } from 'lucide-react';

interface VoiceActivityHUDProps {
  isListening: boolean;
  isVoiceModeActive: boolean;
  audioLevel: number;
  liveTranscript: string;
  micError: string | null;
  onCommit: () => void;
  onCancel: () => void;
  onClearError: () => void;
}

export const VoiceActivityHUD: React.FC<VoiceActivityHUDProps> = ({
  isListening,
  isVoiceModeActive,
  audioLevel,
  liveTranscript,
  micError,
  onCommit,
  onCancel,
  onClearError,
}) => {
  if (!micError) {
    return null;
  }

  return (
    <div className="w-full mb-3 px-1 animate-in fade-in slide-in-from-bottom-2 duration-200">
      <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/80 text-amber-900 dark:text-amber-200 text-xs shadow-md flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold">{micError}</p>
            <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80">
              Dica: Verifique se o microfone do seu sistema não está silenciado e se autorizou o acesso no navegador.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClearError}
          className="text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-200 p-1 rounded cursor-pointer"
          title="Fechar aviso"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
