/**
 * APEX TUNING ENGINE — FH5
 * ASISTENTE IA: INGENIERO JEFE DE PISTA (Gemini Contextual Engineering)
 */

import React, { useState } from 'react';
import { Bot, Send, X, Sparkles, Loader2, Wrench } from 'lucide-react';
import { Vehicle, Tune } from '../types';

interface GeminiDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeVehicle: Vehicle | null;
  activeTune: Tune | null;
}

interface Message {
  role: 'user' | 'assistant';
  text: string;
  source?: string;
}

export const GeminiDrawer: React.FC<GeminiDrawerProps> = ({
  isOpen,
  onClose,
  activeVehicle,
  activeTune,
}) => {
  const [inputPrompt, setInputPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      text: `Ingeniero de Pista Apex listo. Tengo cargada la telemetría de ${
        activeVehicle ? `${activeVehicle.make} ${activeVehicle.model} (${activeVehicle.drivetrain})` : 'tu vehículo'
      } para la disciplina ${activeTune?.discipline || 'Road Racing'}.
¿Qué síntoma o comportamiento dinámico deseas analizar en pista?`,
      source: 'system',
    },
  ]);

  if (!isOpen) return null;

  const quickQuestions = [
    '¿Por qué subvira a mitad de curva en asfalto?',
    '¿Cómo absorber saltos en Cross Country sin que rebote?',
    '¿Cuál es la regla de oro para la compresión (Bump)?',
    '¿Qué porcentaje de reparto central AWD me conviene?',
    '¿Cómo estabilizar la cola en frenadas a 200+ km/h?',
  ];

  const handleSend = async (customPrompt?: string) => {
    const textToSend = customPrompt || inputPrompt;
    if (!textToSend.trim() || loading) return;

    const userMsg: Message = { role: 'user', text: textToSend };
    setMessages((prev) => [...prev, userMsg]);
    if (!customPrompt) setInputPrompt('');
    setLoading(true);

    try {
      // Build context package for the backend
      const context = {
        vehicle: activeVehicle,
        tune: {
          discipline: activeTune?.discipline,
          balance: activeTune?.balance,
          selectedParameters: activeTune?.parameters
            ? {
                arb_front: activeTune.parameters.arb_front?.value,
                arb_rear: activeTune.parameters.arb_rear?.value,
                springs_front: activeTune.parameters.springs_front?.value,
                springs_rear: activeTune.parameters.springs_rear?.value,
                rebound_front: activeTune.parameters.rebound_front?.value,
                bump_front: activeTune.parameters.bump_front?.value,
                diff_rear_accel: activeTune.parameters.diff_rear_accel?.value,
                diff_center_balance: activeTune.parameters.diff_center_balance?.value,
                brake_balance: activeTune.parameters.brake_balance?.value,
              }
            : null,
        },
      };

      const res = await fetch('/api/gemini/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: textToSend,
          context,
        }),
      });

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: data.reply || 'No se pudo obtener respuesta del ingeniero.',
          source: data.source,
        },
      ]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: 'Error al conectar con la telemetría del servidor de ingeniería. Verifica tu conexión.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-cyan-950 border border-cyan-500/40 flex items-center justify-center">
              <Bot className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h3 className="font-mono text-sm font-bold text-white uppercase">
                INGENIERO JEFE DE PISTA (IA)
              </h3>
              <p className="text-[11px] text-slate-400 font-sans">
                Diagnóstico de dinámica vehicular según física de FH5
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Telemetry info banner */}
        <div className="bg-slate-950/80 px-4 py-2 border-b border-slate-800/80 flex items-center justify-between text-xs font-mono">
          <span className="text-slate-400 flex items-center gap-1.5">
            <Wrench className="w-3.5 h-3.5 text-cyan-400" />
            {activeVehicle?.make} {activeVehicle?.model} ({activeVehicle?.drivetrain})
          </span>
          <span className="text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800/60 font-bold">
            {activeTune?.discipline || 'Road Racing'}
          </span>
        </div>

        {/* Quick prompt chips */}
        <div className="p-3 border-b border-slate-800/60 bg-slate-900/50 overflow-x-auto scrollbar-none flex gap-1.5">
          {quickQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(q)}
              disabled={loading}
              className="text-[11px] font-mono whitespace-nowrap bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-300 px-2.5 py-1 rounded border border-slate-700 transition-colors"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Chat Messages */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3.5">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${
                msg.role === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              <div
                className={`max-w-[90%] rounded-lg p-3 text-xs leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-cyan-600 text-slate-950 font-medium'
                    : 'bg-slate-950 border border-slate-800 text-slate-200 font-mono whitespace-pre-wrap'
                }`}
              >
                {msg.text}
              </div>
              <span className="text-[9px] font-mono text-slate-500 mt-1">
                {msg.role === 'user' ? 'Piloto' : 'Ingeniero de Pista'}
              </span>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 bg-slate-950 border border-slate-800 p-3 rounded-lg w-fit">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Analizando telemetría y matriz de física FH5...</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-slate-800 bg-slate-950">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              placeholder="Pregunta sobre física o reporta un síntoma..."
              className="flex-1 bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
            />
            <button
              type="submit"
              disabled={!inputPrompt.trim() || loading}
              className="p-2 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-slate-950 rounded-md transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          <p className="text-[10px] text-slate-500 font-mono text-center mt-2">
            Reglas deterministas & IA basada en la física de Forza Horizon 5.
          </p>
        </div>
      </div>
    </div>
  );
};
