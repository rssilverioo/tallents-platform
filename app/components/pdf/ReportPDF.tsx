import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image as PDFImage,
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
  passeCampoDefensivo: number;
  passeCampoOfensivo: number;
  faltaCometida: number;
  faltaSofrida: number;
  impedimento: number;
  perdaPosse: number;
  dribleCompleto: number;
  dribleIncompleto: number;
};

export type ReportData = {
  id: string;
  title: string;
  summary: string;
  tags: string[];
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
  blueAccent: "#2563eb",
  green: "#34d399",
  violet: "#a78bfa",
  white: "#ffffff",
  muted: "rgba(255,255,255,0.45)",
  faint: "rgba(255,255,255,0.15)",
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
});

// ─── Main component ───────────────────────────────────────────────────────────

export function ReportPDF({ report }: { report: ReportData }) {
  const clips = Array.isArray(report.clips) ? report.clips : [];
  const counts = report.counts as ScoutCounts | null;
  const hasCounts = counts && Object.values(counts).some((v) => v > 0);

  const countSections = counts
    ? [
        {
          label: "Passes",
          color: C.blue,
          borderColor: "rgba(59,130,246,0.3)",
          bg: "rgba(59,130,246,0.08)",
          rows: [
            ["Passe certo",        counts.passeCertoOfensivo],
            ["Passe decisivo",     counts.passeDecisivo],
            ["Passe entre linhas", counts.passeEntreLinhas],
            ["Passe para trás",    counts.passeParaTras],
            ["Passe errado",       counts.passeErrado],
            ["Perca da posse",     counts.perdaPosse ?? 0],
          ] as [string, number][],
        },
        {
          label: "Ofensivo",
          color: C.green,
          borderColor: "rgba(16,185,129,0.3)",
          bg: "rgba(16,185,129,0.08)",
          rows: [
            ["Gol",                     counts.gol],
            ["Assistência",             counts.assistencia],
            ["Final. no alvo",          counts.finalizacaoNoAlvo],
            ["Finalização fora",        counts.finalizacaoFora],
            ["Cruzamento",              counts.cruzamento],
            ["Passe campo ofensivo",    counts.passeCampoOfensivo ?? 0],
            ["Falta sofrida",           counts.faltaSofrida ?? 0],
            ["Impedimento",             counts.impedimento ?? 0],
            ["Drible completo",         counts.dribleCompleto ?? 0],
            ["Drible incompleto",       counts.dribleIncompleto ?? 0],
          ] as [string, number][],
        },
        {
          label: "Defensivo",
          color: C.violet,
          borderColor: "rgba(139,92,246,0.3)",
          bg: "rgba(139,92,246,0.08)",
          rows: [
            ["Desarme",              counts.desarme],
            ["Interceptação",        counts.interceptacao],
            ["Rec. de posse",        counts.recuperacaoPosse],
            ["Pressão pós-perda",    counts.pressaoPosPerda],
            ["Aéreo ganho",          counts.aereoGanho],
            ["Aéreo perdido",        counts.aereoPerdido],
            ["Passe campo defensivo", counts.passeCampoDefensivo ?? 0],
            ["Falta cometida",       counts.faltaCometida ?? 0],
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
    </Document>
  );
}
