type AthleteMarqueeProps = {
  images: string[];
};

export function AthleteMarquee({ images }: AthleteMarqueeProps) {
  // duplica a lista pra ficar looping suave
  const track = [...images, ...images];

  return (
    <div className="relative overflow-hidden rounded-3xl bg-white/5 ring-1 ring-white/10">
      <div className="pointer-events-none absolute inset-0 bg-linear-to-r from-zinc-950 via-transparent to-zinc-950 opacity-90" />

      <div className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-zinc-200">Nossos atletas</p>
          <span className="text-xs text-zinc-400">scroll automático</span>
        </div>

        <div className="relative">
          <div className="flex w-max animate-marquee gap-4 py-2">
            {track.map((src, idx) => (
              <div
                key={`${src}-${idx}`}
                className="h-28 w-44 overflow-hidden rounded-2xl bg-zinc-900 ring-1 ring-white/10"
              >
                {/* usando img simples pra aceitar qualquer arquivo sem config */}
                <img
                  src={src}
                  alt={`Atleta ${idx + 1}`}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </div>

        <style jsx>{`
          @keyframes marquee {
            0% {
              transform: translateX(0);
            }
            100% {
              transform: translateX(-50%);
            }
          }
          .animate-marquee {
            animation: marquee 22s linear infinite;
          }
        `}</style>
      </div>
    </div>
  );
}
