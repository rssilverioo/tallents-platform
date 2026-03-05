import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image as PDFImage,
  Svg,
  Rect,
  G,
} from "@react-pdf/renderer";

// ─── Types ────────────────────────────────────────────────────────────────────

export type GoalItem = {
  id: string;
  category: string;
  name: string;
  target: number;
  current: number;
  unit: string;
};

export type MetaData = {
  id: string;
  title: string;
  season: string;
  description: string;
  analystName: string;
  createdAt: string;
  goals: GoalItem[];
  athlete: {
    name: string;
    team: string;
    position: string;
    photo?: string;
  };
};

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
  amber: "#fbbf24",
  red: "#f87171",
  white: "#ffffff",
  muted: "rgba(255,255,255,0.45)",
  faint: "rgba(255,255,255,0.15)",
};

const CATEGORY_COLORS: Record<string, { color: string; bg: string }> = {
  "Técnico":     { color: C.blue,   bg: "rgba(59,130,246,0.15)"  },
  "Físico":      { color: C.green,  bg: "rgba(52,211,153,0.15)"  },
  "Tático":      { color: C.violet, bg: "rgba(167,139,250,0.15)" },
  "Mental":      { color: C.amber,  bg: "rgba(251,191,36,0.15)"  },
  "Estatístico": { color: "#fb923c", bg: "rgba(251,146,60,0.15)" },
};

function catColor(cat: string) {
  return CATEGORY_COLORS[cat] ?? { color: C.blue, bg: "rgba(59,130,246,0.15)" };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function pct(current: number, target: number) {
  if (target === 0) return 0;
  return Math.min(100, Math.round((current / target) * 100));
}

function progressColor(p: number) {
  if (p >= 100) return C.green;
  if (p >= 70)  return C.blue;
  if (p >= 40)  return C.amber;
  return C.red;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  page: {
    backgroundColor: C.bg,
    paddingHorizontal: 36,
    paddingVertical: 32,
    fontFamily: "Helvetica",
    color: C.white,
  },
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
  brandSub:  { fontSize: 18, fontFamily: "Helvetica-Bold", color: C.white, letterSpacing: 2 },
  headerRight: { alignItems: "flex-end" },
  headerDate: { fontSize: 8, color: C.muted },
  headerAnalyst: { fontSize: 8, color: C.faint, marginTop: 2 },

  // Athlete block
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
    width: 52,
    height: 52,
    borderRadius: 8,
    backgroundColor: "#162646",
    borderWidth: 1,
    borderColor: C.border,
    marginRight: 14,
    flexShrink: 0,
  },
  avatarInitial: {
    width: 52,
    height: 52,
    borderRadius: 8,
    backgroundColor: "#162646",
    borderWidth: 1,
    borderColor: C.border,
    marginRight: 14,
    flexShrink: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitialText: { fontSize: 20, fontFamily: "Helvetica-Bold", color: C.blue },
  athleteName: { fontSize: 14, fontFamily: "Helvetica-Bold", color: C.white },
  athleteSub:  { fontSize: 9, color: C.muted, marginTop: 3 },
  seasonBadge: {
    marginLeft: "auto",
    backgroundColor: "rgba(37,99,235,0.2)",
    borderWidth: 1,
    borderColor: "rgba(37,99,235,0.4)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  seasonText: { fontSize: 9, color: C.blue, fontFamily: "Helvetica-Bold" },

  // Title block
  titleBlock: {
    marginBottom: 14,
  },
  titleText: { fontSize: 16, fontFamily: "Helvetica-Bold", color: C.white },
  descText:  { fontSize: 9, color: C.muted, marginTop: 4, lineHeight: 1.6 },

  // Section label
  secLabel: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: C.muted,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 8,
  },

  // Summary cards
  summaryRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  summaryCard: {
    flex: 1,
    backgroundColor: "#0c1e3a",
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 8,
    padding: 10,
    alignItems: "center",
  },
  summaryVal: { fontSize: 20, fontFamily: "Helvetica-Bold", color: C.blue },
  summaryLbl: { fontSize: 7, color: C.muted, marginTop: 3, letterSpacing: 0.5, textAlign: "center" },

  // Goal item
  goalItem: {
    backgroundColor: C.bgMuted,
    borderWidth: 1,
    borderColor: C.borderLight,
    borderRadius: 8,
    padding: 10,
    marginBottom: 6,
  },
  goalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  goalLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  catBadge: {
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 2,
    marginRight: 8,
  },
  catText: { fontSize: 7, fontFamily: "Helvetica-Bold" },
  goalName: { fontSize: 9, color: C.white, fontFamily: "Helvetica-Bold", flex: 1 },
  goalRight: { flexDirection: "row", alignItems: "center", gap: 4 },
  goalCurrent: { fontSize: 11, fontFamily: "Helvetica-Bold" },
  goalSep:    { fontSize: 9, color: C.muted },
  goalTarget: { fontSize: 9, color: C.muted },
  goalUnit:   { fontSize: 8, color: C.faint },
  pctText:    { fontSize: 8, fontFamily: "Helvetica-Bold", marginLeft: 6 },

  // Progress bar
  trackOuter: { height: 5, backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 999 },
  trackFill:  { height: 5, borderRadius: 999 },

  // Category section header
  catHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
    marginBottom: 6,
  },
  catLine: { flex: 1, height: 0.5, backgroundColor: "rgba(255,255,255,0.08)" },
  catHeaderText: { fontSize: 8, fontFamily: "Helvetica-Bold", letterSpacing: 1 },

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

// ─── Progress Bar SVG ──────────────────────────────────────────────────────────

function ProgressBar({ current, target }: { current: number; target: number }) {
  const p = pct(current, target);
  const color = progressColor(p);
  const W = 460;
  const H = 5;
  const filled = (p / 100) * W;

  return (
    <Svg width={W} height={H}>
      <Rect x={0} y={0} width={W} height={H} fill="rgba(255,255,255,0.06)" rx={2} ry={2} />
      <Rect x={0} y={0} width={filled} height={H} fill={color} rx={2} ry={2} />
    </Svg>
  );
}

// ─── Goal Item ────────────────────────────────────────────────────────────────

function GoalRow({ goal }: { goal: GoalItem }) {
  const p = pct(goal.current, goal.target);
  const color = progressColor(p);
  const cc = catColor(goal.category);

  return (
    <View style={s.goalItem}>
      <View style={s.goalHeader}>
        <View style={s.goalLeft}>
          <View style={[s.catBadge, { backgroundColor: cc.bg }]}>
            <Text style={[s.catText, { color: cc.color }]}>{goal.category}</Text>
          </View>
          <Text style={s.goalName}>{goal.name}</Text>
        </View>
        <View style={s.goalRight}>
          <Text style={[s.goalCurrent, { color }]}>{goal.current}</Text>
          <Text style={s.goalSep}>/</Text>
          <Text style={s.goalTarget}>{goal.target}</Text>
          <Text style={s.goalUnit}>{goal.unit}</Text>
          <Text style={[s.pctText, { color }]}>{p}%</Text>
        </View>
      </View>
      <ProgressBar current={goal.current} target={goal.target} />
    </View>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function MetasPDF({ meta }: { meta: MetaData }) {
  const goals = Array.isArray(meta.goals) ? meta.goals : [];

  // Group goals by category
  const grouped = goals.reduce<Record<string, GoalItem[]>>((acc, g) => {
    if (!acc[g.category]) acc[g.category] = [];
    acc[g.category].push(g);
    return acc;
  }, {});

  const categoryOrder = ["Técnico", "Físico", "Tático", "Mental", "Estatístico"];
  const sortedCategories = [
    ...categoryOrder.filter((c) => grouped[c]),
    ...Object.keys(grouped).filter((c) => !categoryOrder.includes(c)),
  ];

  const completed = goals.filter((g) => pct(g.current, g.target) >= 100).length;
  const onTrack   = goals.filter((g) => { const p = pct(g.current, g.target); return p >= 70 && p < 100; }).length;
  const avgPct    = goals.length ? Math.round(goals.reduce((s, g) => s + pct(g.current, g.target), 0) / goals.length) : 0;

  return (
    <Document>
      <Page size="A4" style={s.page}>

        {/* Header */}
        <View style={s.header}>
          <View style={{ flexDirection: "row" }}>
            <Text style={s.brandMain}>TALLENTS</Text>
            <Text style={s.brandSub}> METAS</Text>
          </View>
          <View style={s.headerRight}>
            <Text style={s.headerDate}>{formatDate(meta.createdAt)}</Text>
            <Text style={s.headerAnalyst}>Analista: {meta.analystName}</Text>
          </View>
        </View>

        {/* Athlete */}
        <View style={s.athleteBlock}>
          {meta.athlete.photo ? (
            // eslint-disable-next-line jsx-a11y/alt-text
            <PDFImage style={s.avatar} src={meta.athlete.photo} />
          ) : (
            <View style={s.avatarInitial}>
              <Text style={s.avatarInitialText}>
                {meta.athlete.name[0]?.toUpperCase() ?? "?"}
              </Text>
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={s.athleteName}>{meta.athlete.name}</Text>
            <Text style={s.athleteSub}>
              {meta.athlete.team} · {meta.athlete.position}
            </Text>
          </View>
          <View style={s.seasonBadge}>
            <Text style={s.seasonText}>Temporada {meta.season}</Text>
          </View>
        </View>

        {/* Title */}
        <View style={s.titleBlock}>
          <Text style={s.titleText}>{meta.title}</Text>
          {meta.description ? (
            <Text style={s.descText}>{meta.description}</Text>
          ) : null}
        </View>

        {/* Summary cards */}
        <Text style={s.secLabel}>Resumo da Temporada</Text>
        <View style={s.summaryRow}>
          <View style={s.summaryCard}>
            <Text style={s.summaryVal}>{goals.length}</Text>
            <Text style={s.summaryLbl}>Objetivos{"\n"}definidos</Text>
          </View>
          <View style={s.summaryCard}>
            <Text style={[s.summaryVal, { color: C.green }]}>{completed}</Text>
            <Text style={s.summaryLbl}>Objetivos{"\n"}alcançados</Text>
          </View>
          <View style={s.summaryCard}>
            <Text style={[s.summaryVal, { color: C.blue }]}>{onTrack}</Text>
            <Text style={s.summaryLbl}>Em bom{"\n"}caminho (+70%)</Text>
          </View>
          <View style={s.summaryCard}>
            <Text style={[s.summaryVal, { color: progressColor(avgPct) }]}>{avgPct}%</Text>
            <Text style={s.summaryLbl}>Progresso{"\n"}médio geral</Text>
          </View>
        </View>

        {/* Goals by category */}
        <Text style={s.secLabel}>Objetivos por Categoria</Text>

        {sortedCategories.map((cat) => {
          const cc = catColor(cat);
          return (
            <View key={cat}>
              <View style={s.catHeader}>
                <View style={[s.catLine, { backgroundColor: cc.color + "33" }]} />
                <Text style={[s.catHeaderText, { color: cc.color }]}>{cat.toUpperCase()}</Text>
                <View style={[s.catLine, { backgroundColor: cc.color + "33" }]} />
              </View>
              {grouped[cat].map((goal) => (
                <GoalRow key={goal.id} goal={goal} />
              ))}
            </View>
          );
        })}

        {/* Footer */}
        <View style={s.footer}>
          <Text style={s.footerText}>Tallents Platform — Metas da Temporada</Text>
          <Text style={s.footerText}>
            {meta.athlete.name} · {meta.season}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
