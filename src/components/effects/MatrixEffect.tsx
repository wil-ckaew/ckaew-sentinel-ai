'use client';

import { useEffect, useRef } from 'react';

interface MatrixEffectProps {
  isActive: boolean;
}

export default function MatrixEffect({ isActive }: MatrixEffectProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!isActive) {
      // Limpar o canvas quando não estiver ativo
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      }
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Ajustar tamanho
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Configuração Matrix
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*()_+{}|:<>?~';
    const columns = Math.floor(canvas.width / 20);
    const drops: number[] = [];

    for (let i = 0; i < columns; i++) {
      drops[i] = Math.random() * -100;
    }

    // Cores
    const colors = [
      'rgba(0, 255, 0, 0.8)',
      'rgba(0, 200, 0, 0.6)',
      'rgba(50, 255, 50, 0.9)',
      'rgba(0, 150, 0, 0.7)',
    ];

    // Desenhar o efeito Matrix
    const draw = () => {
      // Fundo semi-transparente para efeito de rastro
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Configurar fonte
      ctx.font = '20px monospace';

      // Desenhar cada coluna
      for (let i = 0; i < drops.length; i++) {
        // Escolher caractere aleatório
        const char = characters[Math.floor(Math.random() * characters.length)];
        
        // Escolher cor
        const color = colors[Math.floor(Math.random() * colors.length)];
        ctx.fillStyle = color;

        // Posição X
        const x = i * 20;
        // Posição Y - com efeito de ondulação
        const y = drops[i] * 20 + Math.sin(i * 0.5 + Date.now() * 0.001) * 10;

        // Desenhar caractere
        ctx.fillText(char, x, y);

        // Resetar posição se sair da tela
        if (y > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }

        // Aumentar a queda
        drops[i] += 0.5 + Math.random() * 0.5;
      }

      requestAnimationFrame(draw);
    };

    // Iniciar animação
    const animationId = requestAnimationFrame(draw);

    // Lidar com redimensionamento
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
    };
  }, [isActive]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 50,
        pointerEvents: 'none',
        opacity: isActive ? 1 : 0,
        transition: 'opacity 0.5s ease',
      }}
    />
  );
}
