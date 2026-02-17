import "@/app/globals.css";
import Sidebar from "../components/dashboard/Sidebar";
import Topbar from "../components/dashboard/Topbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* background glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-130 w-130 -translate-x-1/2 rounded-full bg-blue-600/20 blur-3xl" />
        <div className="absolute -bottom-55 -right-40 h-140 w-140 rounded-full bg-sky-500/10 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.12),transparent_55%)]" />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl gap-4 px-3 py-4 sm:px-6 sm:py-6">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <Topbar />
          <div className="min-w-0 flex-1 rounded-3xl bg-white/5 p-4 ring-1 ring-white/10 sm:p-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
