import Image from "next/image";
import Link from "next/link";

const ATHLETES = [
  { src: "/athletes/1.png", name: "Marquinhos" },
  { src: "/athletes/2.png", name: "Luisão" },
  { src: "/athletes/3.png", name: "Brian Carvalho" },
  { src: "/athletes/4.png", name: "Davi Selva" },
  { src: "/athletes/5.png", name: "Leo Amista" },
  { src: "/athletes/6.png", name: "Arthur Rufino" },
];

const WHATSAPP_LINK = "https://wa.me/5511932190099";

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-zinc-950 text-white">
      {/* Background glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-48 left-1/2 h-135 w-135 -translate-x-1/2 rounded-full bg-blue-600/20 blur-3xl" />
        <div className="absolute -bottom-55 -right-40 h-140 w-140 rounded-full bg-sky-500/10 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.14),transparent_55%)]" />
      </div>

      <div className="relative mx-auto w-full max-w-6xl overflow-x-hidden px-4 pb-12 sm:px-6 sm:pb-16">
        {/* Header */}
        <header className="flex flex-col gap-4 py-6 sm:flex-row sm:items-center sm:justify-between sm:py-7">
          <div className="flex items-center gap-3">
            <div className="relative grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-2xl bg-white/5 ring-1 ring-white/10">
              <Image
                src="/logo.png"
                alt="Tallents"
                width={44}
                height={44}
                className="h-9 w-9 object-contain opacity-90"
                priority
              />
            </div>

            <div className="leading-tight">
              <p className="text-sm text-zinc-300">Tallents</p>
              <p className="text-base font-semibold tracking-tight">
                Scout & Performance
              </p>
            </div>
          </div>

          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:gap-2">
            <Link
              href="/loginAnalista"
              className="w-full rounded-2xl bg-white/10 px-4 py-2 text-center text-sm font-medium ring-1 ring-white/10 transition hover:bg-white/15 sm:w-auto"
            >
              Área do Analista
            </Link>
            <Link
              href="/atletas"
              className="w-full rounded-2xl bg-blue-600 px-4 py-2 text-center text-sm font-semibold text-white transition hover:bg-blue-500 sm:w-auto"
            >
              Área do Atleta
            </Link>
            <a
              href={WHATSAPP_LINK}
              target="_blank"
              rel="noreferrer"
              className="w-full rounded-2xl bg-emerald-500/15 px-4 py-2 text-center text-sm font-semibold text-emerald-200 ring-1 ring-emerald-500/25 transition hover:bg-emerald-500/20 sm:w-auto"
            >
              Quero fazer parte
            </a>
          </div>
        </header>

        {/* Hero */}
        <section className="grid items-center gap-8 pt-2 sm:pt-6 lg:grid-cols-2 lg:gap-10">
          <div>
            <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs text-zinc-200 ring-1 ring-white/10">
              ⚡ Encontros semanais • Presencial e Online • Análise tática
            </p>

            <h1 className="text-3xl font-semibold tracking-tight sm:text-5xl">
              Evolua seu jogo com{" "}
              <span className="text-blue-400">análises reais</span> e rotina de{" "}
              <span className="text-blue-400">performance</span>.
            </h1>

            <p className="mt-4 max-w-xl text-sm text-zinc-300 sm:mt-5 sm:text-base">
              Na Tallents, realizamos encontros semanais (presencial e online)
              focados em análise de jogos, leitura de desempenho e evolução por
              posição. Quando não há jogo, trabalhamos conteúdos específicos:
              tomada de decisão, análise de movimentos, atividades por função e
              avaliações objetivas.
            </p>

      

            <div className="mt-8 grid max-w-xl grid-cols-1 gap-3 text-center text-sm sm:mt-10 sm:grid-cols-3">
              <div className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
                <p className="text-zinc-300">Encontros</p>
                <p className="mt-1 text-xl font-semibold">Semanais</p>
              </div>
              <div className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
                <p className="text-zinc-300">Formato</p>
                <p className="mt-1 text-xl font-semibold">Online + Presencial</p>
              </div>
              <div className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
                <p className="text-zinc-300">Foco</p>
                <p className="mt-1 text-xl font-semibold">Posição & Jogo</p>
              </div>
            </div>
          </div>

          {/* Athletes */}
          <div className="rounded-3xl bg-white/5 p-5 ring-1 ring-white/10 sm:p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-zinc-200">
                Alguns atletas Tallents
              </p>
              <span className="text-xs text-zinc-400">Feed</span>
            </div>

            {/* MOBILE: grid (sem animação / sem overflow) */}
            <div className="mt-4 grid grid-cols-3 gap-3 sm:hidden">
              {ATHLETES.slice(0, 6).map((a) => (
                <div
                  key={a.src}
                  className="group relative aspect-square overflow-hidden rounded-2xl bg-white/5 ring-1 ring-white/10"
                  title={a.name}
                >
                  <Image
                    src={a.src}
                    alt={a.name}
                    fill
                    className="object-cover transition duration-300 group-hover:scale-[1.03]"
                    sizes="33vw"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/10 to-transparent opacity-90" />
                </div>
              ))}
            </div>

            {/* SM+ : marquee (com máscara e sem estourar) */}
            <div className="mt-4 hidden overflow-hidden rounded-2xl ring-1 ring-white/10 sm:block">
              <div className="relative bg-zinc-950/40">
                {/* mask pra ficar chique e segurar visualmente */}
                <div className="mask-[linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
                  <div className="flex w-max animate-[marquee_28s_linear_infinite] gap-3 p-3">
                    {[...ATHLETES, ...ATHLETES].map((a, idx) => (
                      <div
                        key={`${a.src}-${idx}`}
                        className="group relative h-28 w-28 overflow-hidden rounded-2xl bg-white/5 ring-1 ring-white/10 md:h-32 md:w-32"
                        title={a.name}
                      >
                        <Image
                          src={a.src}
                          alt={a.name}
                          fill
                          className="object-cover transition duration-300 group-hover:scale-[1.03]"
                          sizes="128px"
                        />
                        <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/10 to-transparent opacity-90" />
                        <div className="absolute bottom-2 left-2 max-w-[90%] truncate rounded-full bg-black/40 px-2 py-1 text-[11px] text-zinc-200 ring-1 ring-white/10">
                          {a.name}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
                <p className="text-sm font-semibold">Análise de jogos</p>
                <p className="mt-1 text-sm text-zinc-300">
                  Reuniões com recortes, padrões de decisão e evolução no jogo.
                </p>
              </div>
              <div className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
                <p className="text-sm font-semibold">
                  Desenvolvimento por posição
                </p>
                <p className="mt-1 text-sm text-zinc-300">
                  Conteúdo específico para cada função: movimentos, leitura e
                  tomada de decisão.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Videos */}
        <section className="mt-12 sm:mt-14">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">
                O que os atletas falam da Tallents
              </h2>
              <p className="mt-1 text-sm text-zinc-300">
                Depoimentos reais de atletas que participam dos encontros e
                análises.
              </p>
            </div>

            <a
              href={WHATSAPP_LINK}
              target="_blank"
              rel="noreferrer"
              className="inline-flex w-full justify-center rounded-2xl bg-emerald-500/15 px-4 py-2 text-sm font-semibold text-emerald-200 ring-1 ring-emerald-500/25 transition hover:bg-emerald-500/20 sm:w-auto"
            >
              Quero fazer parte
            </a>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <VideoCard
              title="Depoimento — Leo Toledo"
              desc="Como as análises e encontros semanais ajudaram a evoluir no jogo."
              src="/videos/1.mp4"
            />
            <VideoCard
              title="Depoimento —   Arthur Giacobelli"
              desc="O que mudou na leitura de jogo e tomada de decisão após entrar."
              src="/videos/2.mp4"
            />
            <VideoCard
              title="Depoimento — Francisco "
              desc="Como o conteúdo por posição trouxe clareza nos movimentos e funções."
              src="/videos/3.mp4"
            />
          </div>
        </section>

        {/* CTA bottom */}
        <section className="mt-12 rounded-3xl bg-white/5 p-5 ring-1 ring-white/10 sm:mt-14 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold">Quer entrar para a Tallents?</p>
              <p className="mt-1 text-sm text-zinc-300">
                Fale com a gente no WhatsApp e venha fazer parte.
              </p>
            </div>

            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:gap-3">
              <Link
                href="/analista"
                className="w-full rounded-2xl bg-white/10 px-5 py-3 text-center text-sm font-medium ring-1 ring-white/10 transition hover:bg-white/15 sm:w-auto"
              >
                Sou Analista
              </Link>
              <Link
                href="/atletas"
                className="w-full rounded-2xl bg-blue-600 px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-blue-500 sm:w-auto"
              >
                Sou Atleta
              </Link>
              <a
                href={WHATSAPP_LINK}
                target="_blank"
                rel="noreferrer"
                className="w-full rounded-2xl bg-emerald-500/15 px-5 py-3 text-center text-sm font-semibold text-emerald-200 ring-1 ring-emerald-500/25 transition hover:bg-emerald-500/20 sm:w-auto"
              >
                Quero fazer parte
              </a>
            </div>
          </div>
        </section>

        <footer className="mt-10 text-center text-xs text-zinc-400">
          © {new Date().getFullYear()} Tallents • Scout & Performance
        </footer>
      </div>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </main>
  );
}

function VideoCard({
  title,
  desc,
  src,
}: {
  title: string;
  desc: string;
  src: string;
}) {
  return (
    <div className="rounded-3xl bg-white/5 p-4 ring-1 ring-white/10">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">{title}</p>
          <p className="mt-1 text-sm text-zinc-300">{desc}</p>
        </div>
        <span className="rounded-full bg-blue-600/20 px-2 py-1 text-[11px] text-blue-200 ring-1 ring-blue-500/20">
          Vídeo
        </span>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl ring-1 ring-white/10">
        <video className="aspect-video w-full bg-black" controls preload="metadata">
          <source src={src} type="video/mp4" />
          Seu navegador não suporta vídeo.
        </video>
      </div>
    </div>
  );
}
