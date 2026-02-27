"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Clip = {
  id?: string;
  start: number;
  end: number;
  label: string;
  description?: string;
  confidence: string;
};

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

type Report = {
  id: string;
  title: string;
  summary: string;
  tags: string[];
  rating: number;
  intensity: number;
  decision: number;
  positioning: number;
  analystName: string;
  createdAt: string;
  clips: Clip[];
  counts: ScoutCounts | null;
  athlete: {
    name: string;
    team: string;
    position: string;
    photo: string;
  };
};

function fmt(t: number) {
  return `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, "0")}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default function PrintReportPage() {
  const params = useParams();
  const id = params?.id as string;

  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    fetch(`/api/analyst-reports/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.report) setReport(d.report);
        else setError("Relatório não encontrado");
      })
      .catch(() => setError("Erro ao carregar relatório"))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (report) {
      const t = setTimeout(() => window.print(), 600);
      return () => clearTimeout(t);
    }
  }, [report]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a1628] text-white">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a1628] text-white">
        <p className="text-red-400">{error || "Relatório não encontrado"}</p>
      </div>
    );
  }

  const clips: Clip[] = Array.isArray(report.clips) ? report.clips : [];
  const counts = report.counts;
  const hasCounts = counts && Object.values(counts).some((v) => v > 0);

  const overallScore =
    Math.round(
      ((report.rating + report.intensity + report.decision + report.positioning) / 4) * 10
    ) / 10;

  const countSections = counts
    ? [
        {
          label: "Passes",
          color: "#60a5fa",
          borderColor: "rgba(59,130,246,0.25)",
          bg: "rgba(59,130,246,0.07)",
          rows: [
            ["Passe certo ofensivo", counts.passeCertoOfensivo],
            ["Passe decisivo",       counts.passeDecisivo],
            ["Passe entre linhas",   counts.passeEntreLinhas],
            ["Passe para trás",      counts.passeParaTras],
            ["Passe errado",         counts.passeErrado],
            ["Passe errado (def.)",  counts.passeErradoDefensivo],
          ] as [string, number][],
        },
        {
          label: "Ofensivo",
          color: "#34d399",
          borderColor: "rgba(16,185,129,0.25)",
          bg: "rgba(16,185,129,0.07)",
          rows: [
            ["Gol",                 counts.gol],
            ["Assistência",         counts.assistencia],
            ["Finalização no alvo", counts.finalizacaoNoAlvo],
            ["Finalização fora",    counts.finalizacaoFora],
            ["Cruzamento",          counts.cruzamento],
          ] as [string, number][],
        },
        {
          label: "Defensivo",
          color: "#a78bfa",
          borderColor: "rgba(139,92,246,0.25)",
          bg: "rgba(139,92,246,0.07)",
          rows: [
            ["Desarme",              counts.desarme],
            ["Interceptação",        counts.interceptacao],
            ["Recuperação de posse", counts.recuperacaoPosse],
            ["Pressão pós-perda",    counts.pressaoPosPerda],
            ["Aéreo ganho",          counts.aereoGanho],
            ["Aéreo perdido",        counts.aereoPerdido],
          ] as [string, number][],
        },
      ]
    : [];

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          background: #0a1628;
          color: #fff;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        .print-btn {
          position: fixed;
          top: 1rem;
          right: 1rem;
          background: #2563eb;
          color: #fff;
          border: none;
          border-radius: 0.75rem;
          padding: 0.6rem 1.25rem;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          z-index: 100;
        }
        .print-btn:hover { background: #1d4ed8; }

        @media print {
          .print-btn { display: none !important; }
          @page { size: A4; margin: 12mm; }
          body { background: #0a1628 !important; }
        }

        .page { max-width: 780px; margin: 0 auto; padding: 2.5rem; }

        /* ── Header ── */
        .header {
          display: flex; align-items: center; justify-content: space-between;
          border-bottom: 2px solid rgba(59,130,246,0.4);
          padding-bottom: 1.25rem; margin-bottom: 1.75rem;
        }
        .brand { font-size: 1.5rem; font-weight: 900; letter-spacing: 0.08em; color: #60a5fa; }
        .brand span { color: #fff; }
        .header-meta { text-align: right; }
        .header-date { font-size: 0.75rem; color: rgba(255,255,255,0.4); }
        .header-analyst { font-size: 0.75rem; color: rgba(255,255,255,0.3); margin-top: 2px; }

        /* ── Athlete block ── */
        .athlete-block {
          display: flex; align-items: center; gap: 1.25rem;
          background: rgba(59,130,246,0.08);
          border: 1px solid rgba(59,130,246,0.2);
          border-radius: 1rem; padding: 1.25rem; margin-bottom: 1.5rem;
        }
        .athlete-avatar {
          width: 60px; height: 60px; border-radius: 0.75rem;
          overflow: hidden; background: rgba(255,255,255,0.06);
          display: flex; align-items: center; justify-content: center;
          font-size: 1.5rem; font-weight: 700; color: rgba(255,255,255,0.4);
          flex-shrink: 0; border: 1px solid rgba(255,255,255,0.1);
        }
        .athlete-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .athlete-name { font-size: 1.125rem; font-weight: 700; color: #fff; }
        .athlete-sub { font-size: 0.8rem; color: rgba(255,255,255,0.5); margin-top: 3px; }
        .athlete-score { margin-left: auto; text-align: right; }
        .score-big { font-size: 2.5rem; font-weight: 900; color: #60a5fa; line-height: 1; }
        .score-label { font-size: 0.6rem; text-transform: uppercase; letter-spacing: 0.1em; color: rgba(255,255,255,0.3); margin-top: 3px; }

        /* ── Tags ── */
        .tags { display: flex; flex-wrap: wrap; gap: 0.4rem; margin-bottom: 1.5rem; }
        .tag {
          background: rgba(59,130,246,0.12); border: 1px solid rgba(59,130,246,0.25);
          border-radius: 999px; padding: 0.2rem 0.7rem;
          font-size: 0.7rem; color: #93c5fd; font-weight: 500;
        }

        /* ── Section title ── */
        .sec-title {
          font-size: 0.65rem; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.12em; color: rgba(255,255,255,0.3); margin-bottom: 0.75rem;
        }

        /* ── Summary ── */
        .summary {
          background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07);
          border-radius: 0.75rem; padding: 1rem;
          font-size: 0.85rem; color: rgba(255,255,255,0.7); line-height: 1.65;
          margin-bottom: 1.75rem;
        }

        /* ── Score grid ── */
        .score-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 0.6rem; margin-bottom: 1.75rem; }
        .score-cell {
          background: rgba(59,130,246,0.08); border: 1px solid rgba(59,130,246,0.18);
          border-radius: 0.75rem; padding: 0.875rem 0.5rem; text-align: center;
        }
        .score-cell-val { font-size: 1.5rem; font-weight: 800; color: #60a5fa; line-height: 1; }
        .score-cell-lbl { font-size: 0.6rem; text-transform: uppercase; letter-spacing: 0.05em; color: rgba(255,255,255,0.35); margin-top: 4px; }

        /* ── Metric bars ── */
        .metrics { margin-bottom: 1.75rem; }
        .metric-row { margin-bottom: 0.75rem; }
        .metric-hdr { display: flex; justify-content: space-between; font-size: 0.8rem; color: rgba(255,255,255,0.6); margin-bottom: 4px; }
        .metric-val { font-weight: 700; color: #60a5fa; }
        .metric-track { height: 7px; background: rgba(255,255,255,0.08); border-radius: 999px; overflow: hidden; }
        .metric-fill { height: 100%; background: linear-gradient(90deg, #1d4ed8, #60a5fa); border-radius: 999px; }

        /* ── Counts grid ── */
        .counts-section { margin-bottom: 1.75rem; }
        .counts-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 0.6rem; }
        .counts-card { border-radius: 0.75rem; padding: 0.875rem; }
        .counts-card-title {
          font-size: 0.65rem; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.1em; margin-bottom: 0.6rem;
        }
        .counts-row { display: flex; justify-content: space-between; align-items: center; padding: 3px 0; border-bottom: 1px solid rgba(255,255,255,0.04); }
        .counts-row:last-child { border-bottom: none; }
        .counts-lbl { font-size: 0.7rem; color: rgba(255,255,255,0.5); }
        .counts-val { font-size: 0.85rem; font-weight: 700; font-variant-numeric: tabular-nums; }

        /* ── Clips ── */
        .clips { margin-bottom: 1.75rem; }
        .clip-item {
          background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07);
          border-radius: 0.75rem; padding: 0.7rem 0.875rem; margin-bottom: 0.4rem;
          display: flex; align-items: flex-start; gap: 0.6rem;
        }
        .clip-dot { width: 7px; height: 7px; background: #2563eb; border-radius: 999px; flex-shrink: 0; margin-top: 4px; }
        .clip-lbl { font-size: 0.85rem; font-weight: 600; color: #fff; }
        .clip-time { font-size: 0.7rem; color: rgba(255,255,255,0.4); margin-top: 2px; }
        .clip-desc { font-size: 0.7rem; color: rgba(255,255,255,0.45); margin-top: 2px; }
        .clip-conf { margin-left: auto; flex-shrink: 0; font-size: 0.65rem; padding: 2px 8px; border-radius: 999px; font-weight: 600; }
        .conf-alta  { background: rgba(16,185,129,0.15); color: #6ee7b7; border: 1px solid rgba(16,185,129,0.3); }
        .conf-media { background: rgba(245,158,11,0.15);  color: #fcd34d; border: 1px solid rgba(245,158,11,0.3); }
        .conf-baixa { background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.4); border: 1px solid rgba(255,255,255,0.1); }

        /* ── Footer ── */
        .footer {
          border-top: 1px solid rgba(255,255,255,0.07); padding-top: 0.875rem;
          display: flex; justify-content: space-between; align-items: center;
          font-size: 0.65rem; color: rgba(255,255,255,0.2);
        }
      `}</style>

      <button className="print-btn" onClick={() => window.print()}>
        Imprimir / Salvar PDF
      </button>

      <div className="page">

        {/* Header */}
        <div className="header">
          <div className="brand">TALLENTS<span> SCOUT</span></div>
          <div className="header-meta">
            <div className="header-date">{formatDate(report.createdAt)}</div>
            <div className="header-analyst">Analista: {report.analystName}</div>
          </div>
        </div>

        {/* Athlete */}
        <div className="athlete-block">
          <div className="athlete-avatar">
            {report.athlete.photo
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={report.athlete.photo} alt={report.athlete.name} />
              : report.athlete.name[0]?.toUpperCase()
            }
          </div>
          <div>
            <div className="athlete-name">{report.athlete.name}</div>
            <div className="athlete-sub">{report.athlete.team} · {report.athlete.position}</div>
          </div>
          <div className="athlete-score">
            <div className="score-big">{overallScore}</div>
            <div className="score-label">Score geral</div>
          </div>
        </div>

        {/* Tags */}
        {report.tags.length > 0 && (
          <div className="tags">
            {report.tags.map((t) => <span key={t} className="tag">{t}</span>)}
          </div>
        )}

        {/* Title + summary */}
        <h1 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "0.75rem", color: "#fff" }}>
          {report.title}
        </h1>
        <p className="sec-title">Resumo</p>
        <div className="summary">{report.summary}</div>

        {/* Score grid */}
        <p className="sec-title">Métricas</p>
        <div className="score-grid">
          {[
            { val: report.rating,      lbl: "Avaliação"   },
            { val: report.intensity,   lbl: "Intensidade" },
            { val: report.decision,    lbl: "Decisão"     },
            { val: report.positioning, lbl: "Posição"     },
          ].map(({ val, lbl }) => (
            <div key={lbl} className="score-cell">
              <div className="score-cell-val">{val}</div>
              <div className="score-cell-lbl">{lbl}</div>
            </div>
          ))}
        </div>

        {/* Metric bars */}
        <div className="metrics">
          {[
            { label: "Avaliação geral",     value: report.rating      },
            { label: "Intensidade",         value: report.intensity   },
            { label: "Tomada de decisão",   value: report.decision    },
            { label: "Posicionamento",      value: report.positioning },
          ].map(({ label, value }) => (
            <div key={label} className="metric-row">
              <div className="metric-hdr">
                <span>{label}</span>
                <span className="metric-val">{value}/10</span>
              </div>
              <div className="metric-track">
                <div className="metric-fill" style={{ width: `${value * 10}%` }} />
              </div>
            </div>
          ))}
        </div>

        {/* Counts — Passes / Ofensivo / Defensivo */}
        {hasCounts && (
          <div className="counts-section">
            <p className="sec-title">Ações registradas</p>
            <div className="counts-grid">
              {countSections.map((sec) => (
                <div
                  key={sec.label}
                  className="counts-card"
                  style={{ background: sec.bg, border: `1px solid ${sec.borderColor}` }}
                >
                  <div className="counts-card-title" style={{ color: sec.color }}>
                    {sec.label}
                  </div>
                  {sec.rows.map(([lbl, val]) => (
                    <div key={lbl} className="counts-row">
                      <span className="counts-lbl">{lbl}</span>
                      <span
                        className="counts-val"
                        style={{ color: val > 0 ? sec.color : "rgba(255,255,255,0.2)" }}
                      >
                        {val ?? 0}
                      </span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Clips */}
        {clips.length > 0 && (
          <div className="clips">
            <p className="sec-title">Lances cortados ({clips.length})</p>
            {clips.map((c, i) => (
              <div key={c.id ?? i} className="clip-item">
                <div className="clip-dot" />
                <div style={{ flex: 1 }}>
                  <div className="clip-lbl">{c.label}</div>
                  <div className="clip-time">{fmt(c.start)} → {fmt(c.end)}</div>
                  {c.description && <div className="clip-desc">{c.description}</div>}
                </div>
                <span className={`clip-conf ${
                  c.confidence === "alta" ? "conf-alta" :
                  c.confidence === "média" ? "conf-media" : "conf-baixa"
                }`}>{c.confidence}</span>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="footer">
          <span>Tallents Platform — Relatório Confidencial</span>
          <span>{report.athlete.name} · {formatDate(report.createdAt)}</span>
        </div>
      </div>
    </>
  );
}
