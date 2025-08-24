import Link from "next/link";
import { Music, SlidersHorizontal, BookOpen, CreditCard } from "lucide-react";
import GeneratorCard from "@/components/GeneratorCard";
import PresetButtons from "@/components/PresetButtons";

export default function Home() {
  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-2xl bg-white/10 flex items-center justify-center"><Music size={18} /></div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Musician</h1>
            <p className="text-sm text-white/60">Generate hooks, loops, and stems in seconds.</p>
          </div>
        </div>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/library" className="text-white/80 hover:text-white">Library</Link>
          <Link href="/pricing" className="text-white/80 hover:text-white">Pricing</Link>
          <Link href="/docs" className="text-white/80 hover:text-white">Docs</Link>
        </nav>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <GeneratorCard />

          <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="font-medium flex items-center gap-2 mb-4"><SlidersHorizontal size={16}/> Status</h2>
            <div className="text-sm text-white/70">No active jobs.</div>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="font-medium flex items-center gap-2 mb-2"><BookOpen size={16}/> Presets</h2>
            <PresetButtons />
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="font-medium flex items-center gap-2 mb-2"><CreditCard size={16}/> Credits</h2>
            <div className="text-sm text-white/70">Credits: 0</div>
          </section>
        </aside>
      </div>
    </div>
  );
}
