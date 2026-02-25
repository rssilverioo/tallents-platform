import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image as PDFImage,
  Svg,
  Line,
  Polygon,
  Rect,
  Circle,
  G,
} from "@react-pdf/renderer";

// ─── Types ────────────────────────────────────────────────────────────────────

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

export type ReportData = {
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
  clips: Array<{
    id?: string;
    start: number;
    end: number;
    label: string;
    description?: string;
    confidence: string;
  }>;
  counts: ScoutCounts | null;
  athlete: {
    name: string;
    team: string;
    position: string;
    photo?: string;
  };
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

// ─── Palette ──────────────────────────────────────────────────────────────────

const C = {
  bg: "#0a1628",
  bgCard: "#0f1f3d",
  bgMuted: "#111d35",
  border: "#1e3a5f",
  borderLight: "#1a3050",
  blue: "#60a5fa",
  blueDeep: "#1d4ed8",
  blueAccent: "#2563eb",
  green: "#34d399",
  violet: "#a78bfa",
  white: "#ffffff",
  muted: "rgba(255,255,255,0.45)",
  faint: "rgba(255,255,255,0.15)",
  // Radar specific
  lime: "#bef264",
  limeFill: "rgba(190,242,100,0.22)",
  radarBg: "#0d1117",
  radarGrid: "rgba(255,255,255,0.1)",
  radarAxis: "rgba(255,255,255,0.07)",
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  page: {
    backgroundColor: C.bg,
    paddingHorizontal: 36,
    paddingVertical: 32,
    fontFamily: "Helvetica",
    color: C.white,
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    borderBottomWidth: 1.5,
    borderBottomColor: C.blueAccent,
    paddingBottom: 12,
    marginBottom: 18,
  },
  brandMain: { fontSize: 18, fontFamily: "Helvetica-Bold", color: C.blue, letterSpacing: 2 },
  brandSub: { fontSize: 18, fontFamily: "Helvetica-Bold", color: C.white, letterSpacing: 2 },
  headerRight: { alignItems: "flex-end" },
  headerDate: { fontSize: 8, color: C.muted },
  headerAnalyst: { fontSize: 8, color: C.faint, marginTop: 2 },

  // Athlete
  athleteBlock: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0c1e3a",
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 10,
    padding: 14,
    marginBottom: 14,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: "#162646",
    borderWidth: 1,
    borderColor: C.border,
    marginRight: 14,
    flexShrink: 0,
  },
  avatarInitial: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: "#162646",
    borderWidth: 1,
    borderColor: C.border,
    marginRight: 14,
    flexShrink: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitialText: { fontSize: 22, fontFamily: "Helvetica-Bold", color: C.blue },
  athleteName: { fontSize: 14, fontFamily: "Helvetica-Bold", color: C.white },
  athleteSub: { fontSize: 9, color: C.muted, marginTop: 3 },
  scoreBlock: { marginLeft: "auto", alignItems: "flex-end" },
  scoreBig: { fontSize: 28, fontFamily: "Helvetica-Bold", color: C.blue, lineHeight: 1 },
  scoreLabel: { fontSize: 7, color: C.muted, marginTop: 3, letterSpacing: 1 },

  // Tags
  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 4, marginBottom: 14 },
  tag: {
    backgroundColor: "rgba(37,99,235,0.18)",
    borderWidth: 1,
    borderColor: "rgba(37,99,235,0.35)",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  tagText: { fontSize: 8, color: "#93c5fd", fontFamily: "Helvetica-Bold" },

  // Section label
  secLabel: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: C.muted,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 6,
  },

  // Summary
  summaryBox: {
    backgroundColor: C.bgMuted,
    borderWidth: 1,
    borderColor: C.borderLight,
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
  },
  summaryText: { fontSize: 9, color: "rgba(255,255,255,0.7)", lineHeight: 1.7 },

  // Score grid
  scoreGrid: { flexDirection: "row", gap: 6, marginBottom: 16 },
  scoreCell: {
    flex: 1,
    backgroundColor: "#0c1e3a",
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 8,
    padding: 10,
    alignItems: "center",
  },
  scoreCellVal: { fontSize: 18, fontFamily: "Helvetica-Bold", color: C.blue },
  scoreCellLbl: { fontSize: 7, color: C.muted, marginTop: 3, letterSpacing: 0.5 },

  // Metric bars
  metricRow: { marginBottom: 8 },
  metricHdr: { flexDirection: "row", justifyContent: "space-between", marginBottom: 3 },
  metricName: { fontSize: 9, color: "rgba(255,255,255,0.6)" },
  metricVal: { fontSize: 9, fontFamily: "Helvetica-Bold", color: C.blue },
  metricTrack: { height: 6, backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 999 },
  metricFill: { height: 6, borderRadius: 999 },

  // Counts
  countsGrid: { flexDirection: "row", gap: 6, marginBottom: 16 },
  countsCard: {
    flex: 1,
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
  },
  countsTitle: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  countsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 2,
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  countsLbl: { fontSize: 8, color: C.muted },
  countsVal: { fontSize: 9, fontFamily: "Helvetica-Bold" },

  // Clips
  clipsSection: { marginBottom: 16 },
  clipItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: C.bgMuted,
    borderWidth: 1,
    borderColor: C.borderLight,
    borderRadius: 8,
    padding: 8,
    marginBottom: 4,
    gap: 6,
  },
  clipDot: {
    width: 6,
    height: 6,
    borderRadius: 999,
    backgroundColor: C.blueAccent,
    marginTop: 3,
    flexShrink: 0,
  },
  clipContent: { flex: 1 },
  clipLabel: { fontSize: 9, fontFamily: "Helvetica-Bold", color: C.white },
  clipTime: { fontSize: 8, color: C.muted, marginTop: 1 },
  clipDesc: { fontSize: 8, color: "rgba(255,255,255,0.4)", marginTop: 1 },
  confBadge: { borderRadius: 999, paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1 },
  confText: { fontSize: 7, fontFamily: "Helvetica-Bold" },

  // Footer
  footer: {
    borderTopWidth: 1,
    borderTopColor: C.borderLight,
    paddingTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: "auto",
  },
  footerText: { fontSize: 7, color: "rgba(255,255,255,0.2)" },

  // Radar section wrapper
  radarSection: { marginBottom: 16, alignItems: "center" },
});

// ─── Bar helper ───────────────────────────────────────────────────────────────

function MetricBar({ label, value }: { label: string; value: number }) {
  return (
    <View style={s.metricRow}>
      <View style={s.metricHdr}>
        <Text style={s.metricName}>{label}</Text>
        <Text style={s.metricVal}>{value}/10</Text>
      </View>
      <View style={s.metricTrack}>
        <View style={[s.metricFill, { width: `${value * 10}%`, backgroundColor: C.blueAccent }]} />
      </View>
    </View>
  );
}

// ─── Radar chart ─────────────────────────────────────────────────────────────

const RW = 280;          // SVG total width
const RH = 290;          // SVG total height (radar + score box)
const RCX = 140;         // radar center X
const RCY = 110;         // radar center Y
const MAX_R = 76;        // max radar radius
const N_AXES = 6;

// angles: 0 = top, going clockwise
const rAngles = Array.from(
  { length: N_AXES },
  (_, i) => (i / N_AXES) * 2 * Math.PI - Math.PI / 2
);

function radarPt(val: number, idx: number) {
  const r = (Math.min(Math.max(val, 0), 10) / 10) * MAX_R;
  return {
    x: RCX + r * Math.cos(rAngles[idx]),
    y: RCY + r * Math.sin(rAngles[idx]),
  };
}

function hexPts(frac: number) {
  return rAngles
    .map((a) => `${(RCX + frac * MAX_R * Math.cos(a)).toFixed(2)},${(RCY + frac * MAX_R * Math.sin(a)).toFixed(2)}`)
    .join(" ");
}

function labelAnchor(angle: number): "middle" | "start" | "end" {
  const cos = Math.cos(angle);
  if (Math.abs(cos) < 0.25) return "middle";
  return cos > 0 ? "start" : "end";
}

function scorePerf(s: number) {
  if (s >= 8.5) return "EXCELENTE";
  if (s >= 7) return "BOA ATUAÇÃO";
  if (s >= 5) return "ATUAÇÃO REGULAR";
  return "ATUAÇÃO FRACA";
}

interface RAxis { label: string; value: number }

function getRadarAxes(report: ReportData): RAxis[] {
  const c = report.counts;

  // derive offensive/defensive scores from counts, fallback to metrics
  let ofensivo = parseFloat(((report.rating + report.intensity) / 2).toFixed(1));
  let defensivo = parseFloat(((report.positioning + report.decision) / 2).toFixed(1));

  if (c) {
    const off = Math.min(10, c.gol * 2 + c.assistencia + c.finalizacaoNoAlvo + c.cruzamento * 0.5);
    const def = Math.min(10, c.desarme + c.interceptacao + c.recuperacaoPosse + c.pressaoPosPerda * 0.5);
    if (off > 0) ofensivo = parseFloat(off.toFixed(1));
    if (def > 0) defensivo = parseFloat(def.toFixed(1));
  }

  return [
    { label: "Passes",      value: report.decision    },
    { label: "Intensidade", value: report.intensity   },
    { label: "Posic.",      value: report.positioning },
    { label: "Avaliação",   value: report.rating      },
    { label: "Defensivo",   value: defensivo          },
    { label: "Ofensivo",    value: ofensivo           },
  ];
}

function RadarChart({ report, score }: { report: ReportData; score: number }) {
  const axes = getRadarAxes(report);
  const data = axes.map((ax, i) => radarPt(ax.value, i));
  const dataPts = data.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ");
  const LRAD = MAX_R + 22;

  // Score box dimensions
  const boxW = 110;
  const boxH = 48;
  const boxX = RCX - boxW / 2;
  const boxY = RH - boxH - 6;

  return (
    <View style={s.radarSection}>
      <Text style={s.secLabel}>Radar da Partida</Text>
      <Svg width={RW} height={RH}>
        {/* Background */}
        <Rect x={0} y={0} width={RW} height={RH} fill={C.radarBg} rx={10} ry={10} />

        {/* Grid hexagons */}
        {[0.25, 0.5, 0.75, 1].map((frac) => (
          <Polygon
            key={frac}
            points={hexPts(frac)}
            fill="none"
            stroke={C.radarGrid}
            strokeWidth={0.5}
          />
        ))}

        {/* Axis lines */}
        {rAngles.map((a, i) => (
          <Line
            key={i}
            x1={RCX}
            y1={RCY}
            x2={RCX + MAX_R * Math.cos(a)}
            y2={RCY + MAX_R * Math.sin(a)}
            stroke={C.radarAxis}
            strokeWidth={0.5}
          />
        ))}

        {/* Data polygon fill */}
        <Polygon points={dataPts} fill={C.limeFill} stroke={C.lime} strokeWidth={1.5} />

        {/* Dots on polygon vertices */}
        {data.map((p, i) => (
          <Circle key={i} cx={p.x} cy={p.y} r={3} fill={C.lime} />
        ))}

        {/* Axis labels + values */}
        {axes.map((ax, i) => {
          const lx = RCX + LRAD * Math.cos(rAngles[i]);
          const ly = RCY + LRAD * Math.sin(rAngles[i]);
          const anchor = labelAnchor(rAngles[i]);
          return (
            <G key={i}>
              <Text
                x={lx}
                y={ly - 2}
                style={{ fontSize: 7, fill: C.white, fontFamily: "Helvetica-Bold", textAnchor: anchor }}
              >
                {ax.label}
              </Text>
              <Text
                x={lx}
                y={ly + 8}
                style={{ fontSize: 7, fill: C.lime, fontFamily: "Helvetica-Bold", textAnchor: anchor }}
              >
                {ax.value.toFixed(1)}
              </Text>
            </G>
          );
        })}

        {/* Score box */}
        <Rect
          x={boxX}
          y={boxY}
          width={boxW}
          height={boxH}
          fill="#131c2e"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth={1}
          rx={6}
          ry={6}
        />
        <Text
          x={RCX}
          y={boxY + 12}
          style={{ fontSize: 6, fill: "rgba(255,255,255,0.35)", fontFamily: "Helvetica", textAnchor: "middle" }}
        >
          ÍNDICE DA PARTIDA
        </Text>
        <Text
          x={RCX}
          y={boxY + 28}
          style={{ fontSize: 14, fill: C.white, fontFamily: "Helvetica-Bold", textAnchor: "middle" }}
        >
          {score.toFixed(1)}
        </Text>
        <Text
          x={RCX}
          y={boxY + 41}
          style={{ fontSize: 6.5, fill: C.lime, fontFamily: "Helvetica-Bold", textAnchor: "middle" }}
        >
          {scorePerf(score)}
        </Text>
      </Svg>
    </View>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ReportPDF({ report }: { report: ReportData }) {
  const clips = Array.isArray(report.clips) ? report.clips : [];
  const counts = report.counts as ScoutCounts | null;
  const hasCounts = counts && Object.values(counts).some((v) => v > 0);

  const overallScore =
    Math.round(
      ((report.rating + report.intensity + report.decision + report.positioning) / 4) * 10
    ) / 10;

  const countSections = counts
    ? [
        {
          label: "Passes",
          color: C.blue,
          borderColor: "rgba(59,130,246,0.3)",
          bg: "rgba(59,130,246,0.08)",
          rows: [
            ["Passe certo ofensivo", counts.passeCertoOfensivo],
            ["Passe decisivo", counts.passeDecisivo],
            ["Passe entre linhas", counts.passeEntreLinhas],
            ["Passe para trás", counts.passeParaTras],
            ["Passe errado", counts.passeErrado],
            ["Passe errado (def.)", counts.passeErradoDefensivo],
          ] as [string, number][],
        },
        {
          label: "Ofensivo",
          color: C.green,
          borderColor: "rgba(16,185,129,0.3)",
          bg: "rgba(16,185,129,0.08)",
          rows: [
            ["Gol", counts.gol],
            ["Assistência", counts.assistencia],
            ["Final. no alvo", counts.finalizacaoNoAlvo],
            ["Finalização fora", counts.finalizacaoFora],
            ["Cruzamento", counts.cruzamento],
          ] as [string, number][],
        },
        {
          label: "Defensivo",
          color: C.violet,
          borderColor: "rgba(139,92,246,0.3)",
          bg: "rgba(139,92,246,0.08)",
          rows: [
            ["Desarme", counts.desarme],
            ["Interceptação", counts.interceptacao],
            ["Rec. de posse", counts.recuperacaoPosse],
            ["Pressão pós-perda", counts.pressaoPosPerda],
            ["Aéreo ganho", counts.aereoGanho],
            ["Aéreo perdido", counts.aereoPerdido],
          ] as [string, number][],
        },
      ]
    : [];

  return (
    <Document>
      <Page size="A4" style={s.page}>

        {/* ── Header ── */}
        <View style={s.header}>
          <View style={{ flexDirection: "row" }}>
            <Text style={s.brandMain}>TALLENTS</Text>
            <Text style={s.brandSub}> SCOUT</Text>
          </View>
          <View style={s.headerRight}>
            <Text style={s.headerDate}>{formatDate(report.createdAt)}</Text>
            <Text style={s.headerAnalyst}>Analista: {report.analystName}</Text>
          </View>
        </View>

        {/* ── Athlete ── */}
        <View style={s.athleteBlock}>
          {report.athlete.photo ? (
            // eslint-disable-next-line jsx-a11y/alt-text
            <PDFImage style={s.avatar} src={report.athlete.photo} />
          ) : (
            <View style={s.avatarInitial}>
              <Text style={s.avatarInitialText}>
                {report.athlete.name[0]?.toUpperCase() ?? "?"}
              </Text>
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={s.athleteName}>{report.athlete.name}</Text>
            <Text style={s.athleteSub}>
              {report.athlete.team} · {report.athlete.position}
            </Text>
          </View>
          <View style={s.scoreBlock}>
            <Text style={s.scoreBig}>{overallScore}</Text>
            <Text style={s.scoreLabel}>SCORE GERAL</Text>
          </View>
        </View>

        {/* ── Tags ── */}
        {report.tags.length > 0 && (
          <View style={s.tagsRow}>
            {report.tags.map((t) => (
              <View key={t} style={s.tag}>
                <Text style={s.tagText}>{t}</Text>
              </View>
            ))}
          </View>
        )}

        {/* ── Summary ── */}
        <Text style={s.secLabel}>Resumo</Text>
        <View style={s.summaryBox}>
          <Text style={s.summaryText}>{report.summary}</Text>
        </View>

        {/* ── Score grid ── */}
        <Text style={s.secLabel}>Métricas</Text>
        <View style={s.scoreGrid}>
          {[
            { val: report.rating, lbl: "Avaliação" },
            { val: report.intensity, lbl: "Intensidade" },
            { val: report.decision, lbl: "Decisão" },
            { val: report.positioning, lbl: "Posição" },
          ].map(({ val, lbl }) => (
            <View key={lbl} style={s.scoreCell}>
              <Text style={s.scoreCellVal}>{val}</Text>
              <Text style={s.scoreCellLbl}>{lbl}</Text>
            </View>
          ))}
        </View>

        {/* ── Metric bars ── */}
        <View style={{ marginBottom: 16 }}>
          <MetricBar label="Avaliação geral" value={report.rating} />
          <MetricBar label="Intensidade" value={report.intensity} />
          <MetricBar label="Tomada de decisão" value={report.decision} />
          <MetricBar label="Posicionamento" value={report.positioning} />
        </View>

        {/* ── Counts ── */}
        {hasCounts && (
          <View>
            <Text style={s.secLabel}>Ações registradas</Text>
            <View style={s.countsGrid}>
              {countSections.map((sec) => (
                <View
                  key={sec.label}
                  style={[s.countsCard, { backgroundColor: sec.bg, borderColor: sec.borderColor }]}
                >
                  <Text style={[s.countsTitle, { color: sec.color }]}>{sec.label}</Text>
                  {sec.rows.map(([lbl, val]) => (
                    <View key={lbl} style={s.countsRow}>
                      <Text style={s.countsLbl}>{lbl}</Text>
                      <Text style={[s.countsVal, { color: val > 0 ? sec.color : C.faint }]}>
                        {val ?? 0}
                      </Text>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── Clips ── */}
        {clips.length > 0 && (
          <View style={s.clipsSection}>
            <Text style={s.secLabel}>Lances cortados ({clips.length})</Text>
            {clips.map((c, i) => {
              const confStyle =
                c.confidence === "alta"
                  ? { bg: "rgba(16,185,129,0.15)", color: "#6ee7b7", border: "rgba(16,185,129,0.3)" }
                  : c.confidence === "média"
                  ? { bg: "rgba(245,158,11,0.15)", color: "#fcd34d", border: "rgba(245,158,11,0.3)" }
                  : { bg: "rgba(255,255,255,0.06)", color: C.muted, border: "rgba(255,255,255,0.1)" };

              return (
                <View key={c.id ?? i} style={s.clipItem}>
                  <View style={s.clipDot} />
                  <View style={s.clipContent}>
                    <Text style={s.clipLabel}>{c.label}</Text>
                    <Text style={s.clipTime}>
                      {fmt(c.start)} → {fmt(c.end)}
                    </Text>
                    {c.description ? (
                      <Text style={s.clipDesc}>{c.description}</Text>
                    ) : null}
                  </View>
                  <View
                    style={[
                      s.confBadge,
                      { backgroundColor: confStyle.bg, borderColor: confStyle.border },
                    ]}
                  >
                    <Text style={[s.confText, { color: confStyle.color }]}>{c.confidence}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* ── Footer ── */}
        <View style={s.footer}>
          <Text style={s.footerText}>Tallents Platform — Relatório Confidencial</Text>
          <Text style={s.footerText}>
            {report.athlete.name} · {formatDate(report.createdAt)}
          </Text>
        </View>
      </Page>

      {/* ── Página 2: Radar ── */}
      <Page size="A4" style={s.page}>

        {/* Mini header */}
        <View style={s.header}>
          <View style={{ flexDirection: "row" }}>
            <Text style={s.brandMain}>TALLENTS</Text>
            <Text style={s.brandSub}> SCOUT</Text>
          </View>
          <View style={s.headerRight}>
            <Text style={s.headerDate}>{report.athlete.name} · {report.athlete.position}</Text>
            <Text style={s.headerAnalyst}>Análise Gráfica</Text>
          </View>
        </View>

        {/* Radar centralizado */}
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <RadarChart report={report} score={overallScore} />
        </View>

        {/* Footer */}
        <View style={s.footer}>
          <Text style={s.footerText}>Tallents Platform — Relatório Confidencial</Text>
          <Text style={s.footerText}>
            {report.athlete.name} · {formatDate(report.createdAt)}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
