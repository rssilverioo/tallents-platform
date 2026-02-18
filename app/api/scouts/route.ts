import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

type ScoutCounts = {
  passeErrado: number;
  passeParaTras: number;
  passeErradoDefensivo: number;
  passeCertoOfensivo: number;
  passeDecisivo: number;
  passeEntreLinhas: number;
  cruzamento: number;
  assistencia: number;
  finalizacaoNoAlvo: number;
  finalizacaoFora: number;
  gol: number;
  desarme: number;
  interceptacao: number;
  recuperacaoPosse: number;
  pressaoPosPerda: number;
  aereoGanho: number;
  aereoPerdido: number;
};

type ClipInput = {
  start: number;
  end: number;
  label: string;
  description: string;
  confidence: string;
};

function computeMetrics(counts: ScoutCounts) {
  const totalActions = Object.values(counts).reduce((a, b) => a + b, 0);

  // Intensity: based on total actions
  const intensity = Math.min(10, Math.round(totalActions / 5));

  // Decision: good passes vs total passes
  const goodPasses =
    counts.passeCertoOfensivo + counts.passeDecisivo + counts.passeEntreLinhas;
  const badPasses = counts.passeErrado + counts.passeErradoDefensivo;
  const totalPasses = goodPasses + badPasses + counts.passeParaTras;
  const decision =
    totalPasses > 0 ? Math.round((goodPasses / totalPasses) * 10) : 5;

  // Positioning: defensive effectiveness
  const goodDef =
    counts.desarme +
    counts.interceptacao +
    counts.recuperacaoPosse +
    counts.pressaoPosPerda +
    counts.aereoGanho;
  const badDef = counts.aereoPerdido;
  const totalDef = goodDef + badDef;
  const positioning =
    totalDef > 0 ? Math.round((goodDef / totalDef) * 10) : 5;

  // Rating: average
  const rating = Math.round((intensity + decision + positioning) / 3);

  return { rating, intensity, decision, positioning };
}

function generateTags(counts: ScoutCounts): string[] {
  const tags: string[] = [];

  const totalPasses =
    counts.passeErrado +
    counts.passeParaTras +
    counts.passeErradoDefensivo +
    counts.passeCertoOfensivo +
    counts.passeDecisivo +
    counts.passeEntreLinhas;

  if (totalPasses >= 3) tags.push("Passe");
  if (counts.passeDecisivo > 0 || counts.passeEntreLinhas > 0)
    tags.push("Visão de jogo");
  if (counts.gol > 0) tags.push("Gol");
  if (counts.assistencia > 0) tags.push("Assistência");
  if (counts.finalizacaoNoAlvo > 0 || counts.finalizacaoFora > 0)
    tags.push("Finalização");
  if (counts.cruzamento > 0) tags.push("Cruzamento");

  const totalDef =
    counts.desarme +
    counts.interceptacao +
    counts.recuperacaoPosse +
    counts.pressaoPosPerda +
    counts.aereoGanho +
    counts.aereoPerdido;

  if (totalDef >= 3) tags.push("Defesa");
  if (counts.aereoGanho > 0 || counts.aereoPerdido > 0) tags.push("Aéreo");
  if (counts.pressaoPosPerda > 0) tags.push("Pressão");

  return tags.length > 0 ? tags : ["Scout"];
}

function generateSummary(counts: ScoutCounts, athleteName: string): string {
  const parts: string[] = [];

  const goodPasses =
    counts.passeCertoOfensivo + counts.passeDecisivo + counts.passeEntreLinhas;
  const badPasses = counts.passeErrado + counts.passeErradoDefensivo;

  if (goodPasses > 0 || badPasses > 0) {
    parts.push(`${goodPasses} passes positivos e ${badPasses} erros`);
  }

  if (counts.gol > 0) parts.push(`${counts.gol} gol(s)`);
  if (counts.assistencia > 0)
    parts.push(`${counts.assistencia} assistência(s)`);
  if (counts.finalizacaoNoAlvo > 0)
    parts.push(`${counts.finalizacaoNoAlvo} finalização(ões) no alvo`);

  const totalDef =
    counts.desarme + counts.interceptacao + counts.recuperacaoPosse;
  if (totalDef > 0) parts.push(`${totalDef} ações defensivas positivas`);

  if (parts.length === 0) {
    return `Scout realizado para ${athleteName}. Poucas ações registradas.`;
  }

  return `${athleteName}: ${parts.join(", ")}.`;
}

export async function POST(req: Request) {
  const body = await req.json();
  const { athleteId, youtubeUrl, counts, clips } = body as {
    athleteId: string;
    youtubeUrl: string;
    counts: ScoutCounts;
    clips: ClipInput[];
  };

  if (!athleteId || !youtubeUrl || !counts) {
    return NextResponse.json(
      { error: "athleteId, youtubeUrl e counts são obrigatórios" },
      { status: 400 }
    );
  }

  const athlete = await prisma.athlete.findUnique({
    where: { id: athleteId },
  });
  if (!athlete) {
    return NextResponse.json(
      { error: "Atleta não encontrado" },
      { status: 404 }
    );
  }

  const scout = await prisma.scout.create({
    data: {
      athleteId,
      youtubeUrl,
      counts: counts as any,
      clips: {
        create: (clips || []).map((c) => ({
          start: c.start,
          end: c.end,
          label: c.label,
          description: c.description || "",
          confidence: c.confidence,
        })),
      },
    },
    include: { clips: true },
  });

  const metrics = computeMetrics(counts);
  const tags = generateTags(counts);
  const summary = generateSummary(counts, athlete.name);
  const title = `Relatório — Scout ${athlete.name} (${athlete.position})`;

  const report = await prisma.report.create({
    data: {
      title,
      summary,
      tags: tags as any,
      rating: metrics.rating,
      intensity: metrics.intensity,
      decision: metrics.decision,
      positioning: metrics.positioning,
      athleteId,
      scoutId: scout.id,
    },
  });

  return NextResponse.json({ scout, report }, { status: 201 });
}
