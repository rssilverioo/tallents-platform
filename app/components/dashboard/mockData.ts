import type { Athlete, AthleteReport } from "./types";

export const ATHLETES: Athlete[] = [
  {
    id: "a1",
    name: "Marquinhos",
    team: "Corinthians",
    position: "Zagueiro",
    remainingMeetings: 3,
    photo: "/athletes/1.png",
  },
  {
    id: "a2",
    name: "Luisão",
    team: "Palmeiras",
    position: "Volante",
    remainingMeetings: 2,
    photo: "/athletes/2.png",
  },
  {
    id: "a3",
    name: "Brian Carvalho",
    team: "São Paulo",
    position: "Meia",
    remainingMeetings: 4,
    photo: "/athletes/3.png",
  },
  {
    id: "a4",
    name: "Davi Selva",
    team: "Santos",
    position: "Atacante",
    remainingMeetings: 1,
    photo: "/athletes/4.png",
  },
  {
    id: "a5",
    name: "Leo Amista",
    team: "Flamengo",
    position: "Lateral",
    remainingMeetings: 5,
    photo: "/athletes/5.png",
  },
  {
    id: "a6",
    name: "Arthur Rufino",
    team: "Vasco",
    position: "Goleiro",
    remainingMeetings: 2,
    photo: "/athletes/6.png",
  },
];

export const REPORTS: AthleteReport[] = [
  {
    id: "r1",
    athleteId: "a3",
    title: "Relatório — Jogo vs Rival (Meia)",
    createdAt: "2026-01-20",
    tags: ["Tomada de decisão", "Passe", "Visão"],
    summary:
      "Boa leitura entrelinhas, precisa acelerar decisão sob pressão. Evolução clara no passe vertical.",
    metrics: { rating: 8, intensity: 7, decision: 6, positioning: 8 },
  },
  {
    id: "r2",
    athleteId: "a1",
    title: "Relatório — Compactação e duelo aéreo",
    createdAt: "2026-01-18",
    tags: ["Defesa", "Aéreo", "Cobertura"],
    summary:
      "Excelente tempo de bola no alto; ajustar cobertura lateral em transição rápida.",
    metrics: { rating: 8, intensity: 8, decision: 7, positioning: 7 },
  },
  {
    id: "r3",
    athleteId: "a4",
    title: "Relatório — Finalização e movimentação",
    createdAt: "2026-01-12",
    tags: ["Ataque", "Finalização", "Ruptura"],
    summary:
      "Boa ruptura nas costas; trabalhar finalização de primeira e escolhas dentro da área.",
    metrics: { rating: 7, intensity: 8, decision: 6, positioning: 7 },
  },
];
