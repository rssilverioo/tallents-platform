import type { Athlete } from "./types";
import { Pencil, Trash2, CalendarDays } from "lucide-react";

interface AthleteCardProps {
  athlete: Athlete;
  onEdit?: (athlete: Athlete) => void;
  onDelete?: (id: string) => void;
}

const POSITION_COLORS: Record<string, { accent: string; bg: string; text: string; ring: string; dot: string }> = {
  Goleiro:  { accent: "from-amber-500/20",  bg: "bg-amber-500/10",  text: "text-amber-300",  ring: "ring-amber-500/25",  dot: "bg-amber-400"  },
  Lateral:  { accent: "from-sky-500/20",    bg: "bg-sky-500/10",    text: "text-sky-300",    ring: "ring-sky-500/25",    dot: "bg-sky-400"    },
  Zagueiro: { accent: "from-violet-500/20", bg: "bg-violet-500/10", text: "text-violet-300", ring: "ring-violet-500/25", dot: "bg-violet-400" },
  Volante:  { accent: "from-orange-500/20", bg: "bg-orange-500/10", text: "text-orange-300", ring: "ring-orange-500/25", dot: "bg-orange-400" },
  Meia:     { accent: "from-blue-500/20",   bg: "bg-blue-500/10",   text: "text-blue-300",   ring: "ring-blue-500/25",   dot: "bg-blue-400"   },
  Atacante: { accent: "from-rose-500/20",   bg: "bg-rose-500/10",   text: "text-rose-300",   ring: "ring-rose-500/25",   dot: "bg-rose-400"   },
};

const DEFAULT_POS = { accent: "from-zinc-500/15", bg: "bg-zinc-500/10", text: "text-zinc-300", ring: "ring-zinc-500/20", dot: "bg-zinc-400" };

function getMeetingStyle(n: number) {
  if (n === 0) return { color: "text-zinc-500", label: "Concluído", badge: "bg-zinc-800 text-zinc-500 ring-white/5" };
  if (n <= 2)  return { color: "text-rose-400",  label: "restantes", badge: "bg-rose-500/10 text-rose-400 ring-rose-500/20" };
  if (n <= 4)  return { color: "text-amber-400", label: "restantes", badge: "bg-amber-500/10 text-amber-400 ring-amber-500/20" };
  return       { color: "text-blue-300",  label: "restantes", badge: "bg-blue-500/10 text-blue-300 ring-blue-500/20" };
}

export default function AthleteCard({ athlete, onEdit, onDelete }: AthleteCardProps) {
  const hasPhoto = Boolean(athlete.photo);
  const pos = POSITION_COLORS[athlete.position] ?? DEFAULT_POS;
  const meeting = getMeetingStyle(athlete.remainingMeetings);

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-3xl bg-zinc-900 ring-1 ring-white/8 transition duration-200 hover:ring-white/15 hover:shadow-2xl hover:shadow-black/40 min-h-45">

      {/* Gradient accent top strip */}
      <div className={`absolute inset-x-0 top-0 h-24 bg-linear-to-b ${pos.accent} to-transparent pointer-events-none`} />

      {/* Action buttons — appear on hover */}
      {(onEdit || onDelete) && (
        <div className="absolute right-3 top-3 z-10 flex gap-1">
          {onEdit && (
            <button
              onClick={() => onEdit(athlete)}
              title="Editar atleta"
              className="flex h-7 w-7 items-center justify-center rounded-xl bg-zinc-800/90 text-zinc-400 ring-1 ring-white/10 backdrop-blur transition hover:bg-white/15 hover:text-white"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(athlete.id)}
              title="Excluir atleta"
              className="flex h-7 w-7 items-center justify-center rounded-xl bg-zinc-800/90 text-zinc-400 ring-1 ring-white/10 backdrop-blur transition hover:bg-red-500/20 hover:text-red-400"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Main content */}
      <div className="relative flex flex-1 flex-col p-5">

        {/* Top row: avatar + name */}
        <div className="flex items-start gap-3">

          {/* Avatar */}
          <div className={`relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl ring-2 ${pos.ring} bg-zinc-800`}>
            {hasPhoto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={athlete.photo} alt={athlete.name} className="h-full w-full object-cover" />
            ) : (
              <div className={`flex h-full w-full items-center justify-center text-xl font-bold ${pos.text}`}>
                {athlete.name[0]?.toUpperCase()}
              </div>
            )}
            <span className={`absolute bottom-0.5 right-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-zinc-900 ${pos.dot}`} />
          </div>

          {/* Name + team */}
          <div className="flex-1 pt-0.5 pr-8">
            <p className="text-[15px] font-semibold text-white leading-snug">{athlete.name}</p>
            <p className="mt-0.5 text-xs text-zinc-500 font-medium">{athlete.team}</p>
          </div>
        </div>

        {/* Position badge */}
        <div className="mt-3">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${pos.bg} ${pos.text} ${pos.ring}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${pos.dot}`} />
            {athlete.position}
          </span>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Bottom: divider + meetings */}
        <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-4">
          <div className="flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5 text-zinc-600" />
            <span className="text-xs text-zinc-500">Encontros</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xl font-bold tabular-nums leading-none ${meeting.color}`}>
              {athlete.remainingMeetings}
            </span>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${meeting.badge}`}>
              {meeting.label}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
