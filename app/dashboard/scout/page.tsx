import ScoutPlayer from "@/app/components/dashboard/ScoutPlayer";

export default function ScoutPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold">Scout</h1>
        <p className="mt-1 text-sm text-zinc-300">
          Assista o jogo, marque lances e gere um relatório (mock).
        </p>
      </div>

      <ScoutPlayer />
    </div>
  );
}
