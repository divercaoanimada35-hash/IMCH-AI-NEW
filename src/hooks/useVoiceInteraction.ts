import { useState, useRef, useEffect, useCallback } from 'react';

export interface UseVoiceInteractionOptions {
  onSendMessage?: (text: string) => void;
  lang?: string;
}

export function useVoiceInteraction(options?: UseVoiceInteractionOptions) {
  const [isListening, setIsListening] = useState(false);
  const [isVoiceModeActive, setIsVoiceModeActive] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [audioLevel, setAudioLevel] = useState(0);
  const [micError, setMicError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);

  const recognitionRef = useRef<any>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const isVoiceModeRef = useRef(false);
  const isListeningRef = useRef(false);
  const isAiSpeakingRef = useRef(false);
  const silenceTimerRef = useRef<any>(null);
  const accumulatedTranscriptRef = useRef('');

  useEffect(() => {
    isVoiceModeRef.current = isVoiceModeActive;
  }, [isVoiceModeActive]);

  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  // Check Web Speech API availability
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
    }
  }, []);

  // Stop hardware audio meter
  const stopAudioMeter = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close();
      } catch {}
      audioContextRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setAudioLevel(0);
  }, []);

  // Start real-time volume level meter using Web Audio API (resilient, non-blocking)
  const startAudioMeter = useCallback(async (): Promise<MediaStream | null> => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        return null;
      }

      let stream: MediaStream | null = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
      } catch {
        // Fallback to basic audio constraint if advanced constraints were rejected
        try {
          stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch (fallbackErr) {
          console.warn('Microphone hardware stream fallback error:', fallbackErr);
        }
      }

      if (!stream) {
        return null;
      }

      mediaStreamRef.current = stream;

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        try {
          const audioCtx = new AudioContextClass();
          if (audioCtx.state === 'suspended') {
            await audioCtx.resume().catch(() => {});
          }
          audioContextRef.current = audioCtx;
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 64;
          analyserRef.current = analyser;

          const source = audioCtx.createMediaStreamSource(stream);
          source.connect(analyser);

          const dataArray = new Uint8Array(analyser.frequencyBinCount);

          const updateMeter = () => {
            if (!analyserRef.current || !isListeningRef.current) return;
            analyserRef.current.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
              sum += dataArray[i];
            }
            const avg = sum / dataArray.length;
            const level = Math.min(100, Math.round((avg / 128) * 100));
            setAudioLevel(level);

            animFrameRef.current = requestAnimationFrame(updateMeter);
          };

          animFrameRef.current = requestAnimationFrame(updateMeter);
        } catch (ctxErr) {
          console.warn('AudioContext visualization error:', ctxErr);
        }
      }

      return stream;
    } catch (err: any) {
      console.warn('Hardware microphone stream warning:', err);
      return null;
    }
  }, []);

  // Text-to-Speech
  const speakText = useCallback((text: string, onEnd?: () => void) => {
    if (!('speechSynthesis' in window)) {
      onEnd?.();
      return;
    }

    window.speechSynthesis.cancel();
    isAiSpeakingRef.current = true;

    // Pause recognition while speaking so AI doesn't listen to itself
    if (recognitionRef.current && isListeningRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {}
    }

    const cleanText = text
      .replace(/```[\s\S]*?```/g, 'código omitido da leitura')
      .replace(/[*#_`]/g, '')
      .replace(/\(.*?\)/g, '')
      .slice(0, 500);

    const utterance = new SpeechSynthesisUtterance(cleanText);
    const navLang = navigator.language || 'pt-PT';
    utterance.lang = navLang.startsWith('pt') ? navLang : 'pt-PT';
    utterance.rate = 1.05;
    utterance.pitch = 1.0;

    const resumeRecognition = () => {
      isAiSpeakingRef.current = false;
      onEnd?.();

      if (isVoiceModeRef.current) {
        setTimeout(() => {
          if (isVoiceModeRef.current && !isListeningRef.current) {
            startListeningInternal();
          }
        }, 300);
      }
    };

    utterance.onend = resumeRecognition;
    utterance.onerror = resumeRecognition;

    window.speechSynthesis.speak(utterance);
  }, []);

  // Stop listening
  const stopListening = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    setIsListening(false);
    isListeningRef.current = false;
    stopAudioMeter();
  }, [stopAudioMeter]);

  // Internal start listening logic
  const startListeningInternal = useCallback(async (): Promise<boolean> => {
    if (isAiSpeakingRef.current) return false;

    const SpeechRecognitionClass =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      setMicError('O seu navegador não suporta a API de reconhecimento de fala direta (Web Speech). Recomendamos o Google Chrome, Microsoft Edge ou Safari.');
      setIsListening(false);
      return false;
    }

    // Try starting hardware audio meter in background (non-blocking for visual waveform)
    startAudioMeter().catch(() => null);

    try {
      // Abort old instance if any
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }

      const recognition = new SpeechRecognitionClass();
      recognition.continuous = true;
      recognition.interimResults = true;
      const navLang = navigator.language || 'pt-PT';
      recognition.lang = navLang.startsWith('pt') ? navLang : 'pt-PT';
      recognition.maxAlternatives = 1;

      accumulatedTranscriptRef.current = '';
      setLiveTranscript('');

      recognition.onstart = () => {
        setIsListening(true);
        isListeningRef.current = true;
        setMicError(null);
      };

      recognition.onresult = (event: any) => {
        let interimText = '';
        let finalText = '';

        for (let i = 0; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalText += result[0].transcript + ' ';
          } else {
            interimText += result[0].transcript;
          }
        }

        const fullSaid = (finalText + interimText).trim();
        accumulatedTranscriptRef.current = fullSaid;
        setLiveTranscript(fullSaid);

        // If hardware audio meter is not active, pulse visual level indicator
        if (!mediaStreamRef.current) {
          setAudioLevel(Math.min(90, Math.max(30, fullSaid.length * 3)));
          setTimeout(() => setAudioLevel(0), 350);
        }

        // Automatic send on silence pause (when the user stops speaking)
        if (fullSaid.length > 1) {
          if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
          const delay = (finalText.trim().length > 0 && interimText.trim().length === 0) ? 1000 : 1300;

          silenceTimerRef.current = setTimeout(() => {
            const toSend = (accumulatedTranscriptRef.current || fullSaid).trim();
            if (toSend.length > 1) {
              accumulatedTranscriptRef.current = '';
              setLiveTranscript('');

              if (options?.onSendMessage) {
                options.onSendMessage(toSend);
              }

              if (!isVoiceModeRef.current) {
                stopListening();
              }
            }
          }, delay);
        }
      };

      recognition.onerror = (event: any) => {
        const error = event.error;
        console.warn('SpeechRecognition error:', error);

        if (error === 'no-speech') {
          // Normal timeout when silence; keep listening if in voice mode
          if (isVoiceModeRef.current && !isAiSpeakingRef.current) {
            // Keep going or will restart in onend
          }
          return;
        }

        if (error === 'not-allowed' || error === 'service-not-allowed') {
          setMicError('Permissão do microfone negada pelo navegador. Se o microfone já foi autorizado, recarregue a página (F5) para o navegador renovar a autorização da sessão.');
          setIsListening(false);
          stopAudioMeter();
        } else if (error === 'audio-capture') {
          setMicError('Nenhum microfone encontrado ou o hardware de áudio está em uso por outro aplicativo.');
          setIsListening(false);
          stopAudioMeter();
        } else if (error === 'network') {
          setMicError('Erro de ligação de rede ao serviço de reconhecimento de voz.');
        }
      };

      recognition.onend = () => {
        // If Voice Mode is active and AI is not speaking, automatically restart to keep conversational loop open
        if (isVoiceModeRef.current && !isAiSpeakingRef.current) {
          setTimeout(() => {
            if (isVoiceModeRef.current && !isListeningRef.current && !isAiSpeakingRef.current) {
              try {
                recognition.start();
              } catch {}
            }
          }, 600);
        } else {
          setIsListening(false);
          isListeningRef.current = false;
          stopAudioMeter();
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
      setIsListening(true);
      isListeningRef.current = true;
      return true;
    } catch (err: any) {
      console.warn('Falha ao iniciar SpeechRecognition:', err);
      setMicError(err.message || 'Falha ao iniciar o microfone.');
      setIsListening(false);
      stopAudioMeter();
      return false;
    }
  }, [startAudioMeter, stopAudioMeter, stopListening, options]);

  // Toggle single speech recording
  const toggleListening = useCallback(async () => {
    if (isListeningRef.current) {
      stopListening();
    } else {
      await startListeningInternal();
    }
  }, [startListeningInternal, stopListening]);

  // Toggle in-place Voice Mode
  const toggleVoiceMode = useCallback(async (greeting = 'Olá! Estou a ouvir. Como posso ajudar você hoje por voz?') => {
    if (isVoiceModeRef.current) {
      // Turn OFF
      setIsVoiceModeActive(false);
      isVoiceModeRef.current = false;
      stopListening();
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    } else {
      // Turn ON
      setIsVoiceModeActive(true);
      isVoiceModeRef.current = true;
      setMicError(null);

      // Speak greeting first, then start listening on utterance end
      speakText(greeting, () => {
        startListeningInternal();
      });
    }
  }, [speakText, startListeningInternal, stopListening]);

  // Send current accumulated transcript now
  const commitCurrentTranscript = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    const text = accumulatedTranscriptRef.current.trim() || liveTranscript.trim();
    if (text && options?.onSendMessage) {
      options.onSendMessage(text);
      accumulatedTranscriptRef.current = '';
      setLiveTranscript('');
      if (!isVoiceModeRef.current) {
        stopListening();
      }
    }
  }, [liveTranscript, options, stopListening]);

  const clearMicError = useCallback(() => {
    setMicError(null);
  }, []);

  return {
    isListening,
    isVoiceModeActive,
    liveTranscript,
    audioLevel,
    micError,
    isSupported,
    toggleListening,
    toggleVoiceMode,
    stopListening,
    speakText,
    commitCurrentTranscript,
    clearMicError,
  };
}
