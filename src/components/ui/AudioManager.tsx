'use client';

import { useEffect, useState } from 'react';
import { SpeakerWaveIcon, SpeakerXMarkIcon } from '@heroicons/react/24/solid';

export default function AudioManager() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [isFirefox, setIsFirefox] = useState(false);

  // Detectar Firefox
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isFF = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
      setIsFirefox(isFF);
    }
  }, []);

  // Inicializar áudio quando o usuário clicar
  const enableAudio = () => {
    try {
      // Para Firefox, precisamos de um contexto específico
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const context = new AudioContextClass();
      
      // Firefox precisa que o contexto seja iniciado por uma interação do usuário
      if (context.state === 'suspended') {
        context.resume();
      }
      
      setAudioContext(context);
      setIsEnabled(true);
      
      // Tocar som de confirmação (mais longo para Firefox)
      playTestSound(context);
      
      // Salvar no localStorage para persistir
      localStorage.setItem('audioEnabled', 'true');
    } catch (error) {
      console.error('Erro ao ativar áudio:', error);
      alert('Clique no botão novamente para ativar o áudio.');
    }
  };

  // Verificar se áudio estava ativado anteriormente
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('audioEnabled');
      if (saved === 'true') {
        // Tentar restaurar áudio
        try {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          const context = new AudioContextClass();
          setAudioContext(context);
          setIsEnabled(true);
        } catch (error) {
          console.error('Erro ao restaurar áudio:', error);
        }
      }
    }
  }, []);

  // Tocar som de teste (adaptado para Firefox)
  const playTestSound = (context: AudioContext) => {
    try {
      // Firefox precisa que o oscillator seja criado e iniciado imediatamente
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(context.destination);
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, context.currentTime);
      
      // Para Firefox, usar valores mais suaves
      gainNode.gain.setValueAtTime(0.3, context.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.3);
      
      oscillator.start(context.currentTime);
      oscillator.stop(context.currentTime + 0.3);
      
      // Segundo beep para confirmar
      setTimeout(() => {
        try {
          const osc2 = context.createOscillator();
          const gain2 = context.createGain();
          osc2.connect(gain2);
          gain2.connect(context.destination);
          osc2.type = 'sine';
          osc2.frequency.setValueAtTime(1100, context.currentTime);
          gain2.gain.setValueAtTime(0.2, context.currentTime);
          gain2.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.2);
          osc2.start(context.currentTime);
          osc2.stop(context.currentTime + 0.2);
        } catch (e) {}
      }, 300);
    } catch (error) {
      console.error('Erro ao tocar som de teste:', error);
    }
  };

  // Função para tocar alarme (exportada globalmente)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).playAlertSound = () => {
        if (audioContext && isEnabled) {
          try {
            // Para Firefox, garantir que o contexto está rodando
            if (audioContext.state === 'suspended') {
              audioContext.resume();
            }

            // Som de sirene - adaptado para Firefox
            const now = audioContext.currentTime;
            
            // Primeiro tom (agudo)
            const osc1 = audioContext.createOscillator();
            const gain1 = audioContext.createGain();
            osc1.connect(gain1);
            gain1.connect(audioContext.destination);
            
            osc1.type = 'square';
            osc1.frequency.setValueAtTime(800, now);
            osc1.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
            gain1.gain.setValueAtTime(0.25, now);
            gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
            osc1.start(now);
            osc1.stop(now + 0.3);

            // Segundo tom (grave)
            setTimeout(() => {
              try {
                if (audioContext.state === 'suspended') {
                  audioContext.resume();
                }
                const osc2 = audioContext.createOscillator();
                const gain2 = audioContext.createGain();
                osc2.connect(gain2);
                gain2.connect(audioContext.destination);
                
                osc2.type = 'square';
                osc2.frequency.setValueAtTime(600, audioContext.currentTime);
                osc2.frequency.exponentialRampToValueAtTime(1000, audioContext.currentTime + 0.15);
                gain2.gain.setValueAtTime(0.25, audioContext.currentTime);
                gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
                osc2.start(audioContext.currentTime);
                osc2.stop(audioContext.currentTime + 0.3);
              } catch (e) { console.error('Erro no segundo tom:', e); }
            }, 400);

            // Terceiro tom (alerta final)
            setTimeout(() => {
              try {
                if (audioContext.state === 'suspended') {
                  audioContext.resume();
                }
                const osc3 = audioContext.createOscillator();
                const gain3 = audioContext.createGain();
                osc3.connect(gain3);
                gain3.connect(audioContext.destination);
                
                osc3.type = 'sawtooth';
                osc3.frequency.setValueAtTime(1000, audioContext.currentTime);
                osc3.frequency.exponentialRampToValueAtTime(800, audioContext.currentTime + 0.2);
                gain3.gain.setValueAtTime(0.2, audioContext.currentTime);
                gain3.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
                osc3.start(audioContext.currentTime);
                osc3.stop(audioContext.currentTime + 0.2);
              } catch (e) { console.error('Erro no terceiro tom:', e); }
            }, 800);

          } catch (error) {
            console.error('Erro ao tocar alarme:', error);
          }
        } else {
          console.log('Áudio não ativado. Clique no botão para ativar.');
        }
      };
    }
  }, [audioContext, isEnabled]);

  return (
    <div className="fixed bottom-4 right-4 z-[9999]">
      <button
        onClick={enableAudio}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg shadow-lg transition-all ${
          isEnabled 
            ? 'bg-green-600 hover:bg-green-700 text-white' 
            : 'bg-red-600 hover:bg-red-700 text-white animate-pulse'
        }`}
        title={isEnabled ? 'Áudio ativado' : 'Clique para ativar os alertas sonoros'}
      >
        {isEnabled ? (
          <>
            <SpeakerWaveIcon className="w-5 h-5" />
            <span className="text-sm font-medium">Áudio Ativo</span>
          </>
        ) : (
          <>
            <SpeakerXMarkIcon className="w-5 h-5" />
            <span className="text-sm font-medium">Ativar Áudio</span>
          </>
        )}
      </button>
      {!isEnabled && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center">
          Clique para ativar os alertas sonoros
        </p>
      )}
      {isEnabled && isFirefox && (
        <p className="text-xs text-green-600 dark:text-green-400 mt-1 text-center">
          ✅ Áudio ativado para Firefox!
        </p>
      )}
    </div>
  );
}
