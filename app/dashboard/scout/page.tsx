"use client";

import { useEffect, useState } from "react";
import ScoutPlayer, { AthleteOption } from "@/app/components/dashboard/ScoutPlayer";

export default function ScoutPage() {
  const [athletes, setAthletes] = useState<AthleteOption[]>([]);

  useEffect(() => {
    fetch("/api/athletes")
      .then((r) => r.json())
      .then((d) => setAthletes(d.athletes ?? []));
  }, []);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold">Scout</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Selecione o atleta, carregue o vídeo e registre as ações em tempo real.
        </p>
      </div>

      <ScoutPlayer athletes={athletes} />
    </div>
  );
}
