"use client";

import { useEffect, useState } from "react";

export type ScoutModalValue = {
  label: string;
  description: string;
  confidence: "baixa" | "média" | "alta";
};

export default function ScoutModal({
  open,
  onClose,
  onConfirm,
  initialLabel,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (value: ScoutModalValue) => void;
  initialLabel?: string;
}) {
  const [label, setLabel] = useState(initialLabel ?? "Lance");
  const [description, setDescription] = useState("");
  const [confidence, setConfidence] = useState<ScoutModalValue["confidence"]>("média");

  useEffect(() => {
    if (!open) return;
    setLabel(initialLabel ?? "Lance");
    setDescription("");
    setConfidence("média");
  }, [open, initialLabel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4">
      <div className="w-full max-w-lg rounded-3xl bg-zinc-950 p-5 ring-1 ring-white/10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-zinc-300">Descrever corte</p>
            <h3 className="text-lg font-semibold">O que foi o lance?</h3>
          </div>

          <button
            type="button"
            className="rounded-2xl bg-white/10 px-3 py-2 text-sm ring-1 ring-white/10 hover:bg-white/15"
            onClick={onClose}
          >
            Fechar
          </button>
        </div>

        <div className="mt-4 space-y-3">
          <div>
            <label className="mb-1 block text-sm text-zinc-300">Categoria</label>
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="w-full rounded-2xl bg-white/5 px-4 py-3 text-sm ring-1 ring-white/10 outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ex.: Finalização, Passe-chave, Duelo, Erro, Pressão..."
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-zinc-300">Descrição</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-27.5 w-full resize-none rounded-2xl bg-white/5 px-4 py-3 text-sm ring-1 ring-white/10 outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Descreva o lance de forma objetiva..."
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-zinc-300">Confiança</label>
            <select
              value={confidence}
              onChange={(e) => setConfidence(e.target.value as any)}
              className="w-full rounded-2xl bg-white/5 px-4 py-3 text-sm ring-1 ring-white/10 outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="baixa">Baixa</option>
              <option value="média">Média</option>
              <option value="alta">Alta</option>
            </select>
          </div>

          <button
            type="button"
            className="w-full rounded-2xl bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-500"
            onClick={() => onConfirm({ label, description, confidence })}
          >
            Salvar corte
          </button>

          <p className="text-xs text-zinc-400">
            Dica: use a tecla <span className="font-semibold text-zinc-200">C</span>{" "}
            para criar um corte automático de 5s antes e 5s depois.
          </p>
        </div>
      </div>
    </div>
  );
}
