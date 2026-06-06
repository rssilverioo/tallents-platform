"use client";

import { useEffect, useState } from "react";

export type ScoutModalValue = {
  label: string;
  description: string;
  confidence: "baixa" | "média" | "alta";
  actionKey: string | null;
};

const ACTION_GROUPS = [
  {
    group: "Passes",
    actions: [
      { key: "passeCertoOfensivo", label: "Passe certo" },
      { key: "passeDecisivo",      label: "Passe decisivo" },
      { key: "passeEntreLinhas",   label: "Passe entre linhas" },
      { key: "passeParaTras",      label: "Passe para trás" },
      { key: "passeErrado",        label: "Passe errado" },
      { key: "perdaPosse",         label: "Perca da posse" },
    ],
  },
  {
    group: "Ofensivo",
    actions: [
      { key: "gol",                label: "Gol" },
      { key: "assistencia",        label: "Assistência" },
      { key: "finalizacaoNoAlvo",  label: "Finalização no gol" },
      { key: "finalizacaoFora",    label: "Finalização" },
      { key: "cruzamento",         label: "Cruzamento" },
      { key: "passeCampoOfensivo", label: "Passe no campo ofensivo" },
      { key: "faltaSofrida",       label: "Falta sofrida" },
      { key: "impedimento",        label: "Impedimento" },
      { key: "dribleCompleto",     label: "Drible completo" },
      { key: "dribleIncompleto",   label: "Drible incompleto" },
    ],
  },
  {
    group: "Defensivo",
    actions: [
      { key: "desarme",             label: "Desarme" },
      { key: "interceptacao",       label: "Interceptação" },
      { key: "recuperacaoPosse",    label: "Recuperação de posse" },
      { key: "pressaoPosPerda",     label: "Pressão pós-perda" },
      { key: "aereoGanho",          label: "Aéreo ganho" },
      { key: "aereoPerdido",        label: "Aéreo perdido" },
      { key: "passeCampoDefensivo", label: "Passe no campo defensivo" },
      { key: "faltaCometida",       label: "Falta cometida" },
    ],
  },
];

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
  const [actionKey, setActionKey] = useState<string>("");

  useEffect(() => {
    if (!open) return;
    setLabel(initialLabel ?? "Lance");
    setDescription("");
    setConfidence("média");
    setActionKey("");
  }, [open, initialLabel]);

  if (!open) return null;

  const selectedAction = ACTION_GROUPS
    .flatMap((g) => g.actions)
    .find((a) => a.key === actionKey);

  function handleConfirm() {
    // If an action was selected and label is still default, use the action label
    const finalLabel = label.trim() === "Lance" && selectedAction
      ? selectedAction.label
      : label;
    onConfirm({ label: finalLabel, description, confidence, actionKey: actionKey || null });
  }

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
          {/* Action selector */}
          <div>
            <label className="mb-1 block text-sm text-zinc-300">
              Ação <span className="text-zinc-500">(opcional — contabiliza automaticamente)</span>
            </label>
            <select
              value={actionKey}
              onChange={(e) => {
                const key = e.target.value;
                setActionKey(key);
                // Auto-fill label with action name if label is still default
                if (label.trim() === "Lance" || label.trim() === "") {
                  const found = ACTION_GROUPS.flatMap((g) => g.actions).find((a) => a.key === key);
                  if (found) setLabel(found.label);
                }
              }}
              className="w-full rounded-2xl bg-white/5 px-4 py-3 text-sm ring-1 ring-white/10 outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">— Nenhuma ação —</option>
              {ACTION_GROUPS.map((g) => (
                <optgroup key={g.group} label={g.group}>
                  {g.actions.map((a) => (
                    <option key={a.key} value={a.key}>{a.label}</option>
                  ))}
                </optgroup>
              ))}
            </select>
            {actionKey && (
              <p className="mt-1.5 text-xs text-emerald-400">
                ✓ &quot;{selectedAction?.label}&quot; será contabilizada automaticamente
              </p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm text-zinc-300">Categoria / Título do corte</label>
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="w-full rounded-2xl bg-white/5 px-4 py-3 text-sm ring-1 ring-white/10 outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ex.: Finalização, Passe-chave, Duelo..."
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-zinc-300">Descrição</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-20 w-full resize-none rounded-2xl bg-white/5 px-4 py-3 text-sm ring-1 ring-white/10 outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Descreva o lance de forma objetiva..."
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-zinc-300">Confiança</label>
            <select
              value={confidence}
              onChange={(e) => setConfidence(e.target.value as ScoutModalValue["confidence"])}
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
            onClick={handleConfirm}
          >
            Salvar corte{actionKey ? " e contabilizar ação" : ""}
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
