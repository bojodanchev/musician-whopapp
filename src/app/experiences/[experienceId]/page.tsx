import Link from "next/link";
import { Music, Calendar, User, Sparkles, PlayCircle, Download, Shield } from "lucide-react";
import PlanCard from "@/components/PlanCard";

export const dynamic = "force-dynamic";

export default function ExperiencePage({ params }: { params: { experienceId: string } }) {
  const { experienceId } = params;
  return (
    <main className="min-h-screen bg-[#0b0b12] text-white">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-r from-[#7b5cff] via-[#ff4d9d] to-[#35a1ff] blur-2xl opacity-25" />
      </div>

      <header className="sticky top-0 z-20 backdrop-blur supports-[backdrop-filter]:bg-black/30 border-b border-white/10">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-3">
          <div className="size-9 rounded-xl bg-gradient-to-br from-[#7b5cff] via-[#ff4d9d] to-[#35a1ff] grid place-items-center shadow-[0_0_40px_-10px_rgba(123,92,255,0.6)]">
            <Music className="size-5" />
          </div>
          <div className="font-semibold tracking-tight">Musician</div>
          <div className="ml-auto flex items-center gap-3 text-sm">
            <Link href={`/experiences/${experienceId}/generate`} className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10">Open Composer</Link>
            <a href="#pricing" className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10">Pricing</a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 py-20 text-center">
        <h1 className="text-4xl md:text-6xl font-semibold tracking-tight">Create your own music</h1>
        <p className="mt-4 text-white/70 max-w-2xl mx-auto">
          Musician generates ready‑to‑use music for your videos, ads, and social content—backed by Whop entitlements and simple licensing.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link href={`/experiences/${experienceId}/generate`} className="px-5 py-3 rounded-2xl bg-gradient-to-r from-[#7b5cff] via-[#ff4d9d] to-[#35a1ff] shadow-lg">Open Composer</Link>
          <a href="#pricing" className="px-5 py-3 rounded-2xl bg-white/10 border border-white/10 hover:bg-white/15">See pricing</a>
        </div>
      </section>

      {/* Transformation – toned for embed */}
      <section className="mx-auto max-w-6xl px-4 pb-16">
        <h2 className="text-xl font-semibold mb-4 text-center">From idea to song in ~60 seconds</h2>
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 md:p-8">
          <div className="grid grid-cols-12 gap-6 items-center">
            {/* Left: Input */}
            <div className="col-span-12 md:col-span-5">
              <div className="text-sm uppercase tracking-wider text-white/60 mb-3">Your input</div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-2xl bg-black/30 border border-white/10 p-3 flex items-center gap-3">
                  <div className="size-9 rounded-full bg-white/10 grid place-items-center"><Music className="size-5"/></div>
                  <div>Mood & style</div>
                </div>
                <div className="rounded-2xl bg-black/30 border border-white/10 p-3 flex items-center gap-3">
                  <div className="size-9 rounded-full bg-white/10 grid place-items-center"><Calendar className="size-5"/></div>
                  <div>Occasion</div>
                </div>
                <div className="rounded-2xl bg-black/30 border border-white/10 p-3 flex items-center gap-3">
                  <div className="size-9 rounded-full bg-white/10 grid place-items-center"><User className="size-5"/></div>
                  <div>Personal details</div>
                </div>
                <div className="rounded-2xl bg-black/30 border border-white/10 p-3 flex items-center gap-3">
                  <div className="size-9 rounded-full bg-white/10 grid place-items-center"><Sparkles className="size-5"/></div>
                  <div>Extra vibe</div>
                </div>
              </div>
            </div>

            {/* Bridge – subtle line, no badge */}
            <div className="col-span-12 md:col-span-2 flex items-center justify-center">
              <div className="h-16 w-full flex items-center justify-center">
                <div className="h-[2px] w-full rounded-full bg-gradient-to-r from-transparent via-white/30 to-transparent" />
              </div>
            </div>

            {/* Right: Output */}
            <div className="col-span-12 md:col-span-5">
              <div className="text-sm uppercase tracking-wider text-white/60 mb-3">Your track</div>
              <div className="rounded-2xl border border-white/10 bg-black/30">
                <div className="p-4">
                  <div className="h-20 mb-3 rounded-lg bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.1),transparent_60%)] border border-white/10" />
                  <div className="flex items-center gap-2 text-sm">
                    <button className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/10 flex items-center gap-2"><PlayCircle className="size-4"/>Play</button>
                    <button className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/10 flex items-center gap-2"><Download className="size-4"/>Download</button>
                    <button className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/10 flex items-center gap-2"><Shield className="size-4"/>License</button>
                  </div>
                  <div className="text-xs text-white/60 mt-2">Custom WAV + loop + license — ready to use</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="mx-auto max-w-6xl px-4 pb-16">
        <h2 className="text-xl font-semibold mb-4 text-center">Popular use cases</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            {name:"Birthday song", prompt:"Upbeat pop birthday song with the name Alex, celebratory claps and synths, 10s"},
            {name:"Wedding entrance", prompt:"Romantic cinematic entrance cue with strings and light percussion, 20s"},
            {name:"Small business jingle", prompt:"Catchy brand jingle for a coffee shop, warm acoustic guitar and handclaps, 15s"},
            {name:"Reels background", prompt:"Modern electronic background loop for Instagram Reels, chill yet punchy, 10s"},
            {name:"Workout burst", prompt:"High‑energy trap beat for HIIT interval, heavy 808 and crisp hats, 10s"},
            {name:"Copyright‑free vlog", prompt:"Laid‑back lofi hip‑hop loop for vlog, vinyl crackle and soft keys, 15s"},
          ].map((u)=> (
            <Link
              key={u.name}
              href={{ pathname: `/experiences/${experienceId}/generate`, query: { preset: u.prompt } }}
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 hover:bg-white/10"
            >
              <div className="font-medium">{u.name}</div>
              <div className="text-xs text-white/60 line-clamp-2">{u.prompt}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[{
            title: "Instant hooks",
            desc: "Generate 10–120s hooks and loops tailored to your prompt.",
          },{
            title: "Plan‑aware credits",
            desc: "Credits map to your Whop plan and decrement atomically per take.",
          },{
            title: "Simple licensing",
            desc: "One‑click license files for safe use across social & ads.",
          }].map((f) => (
            <div key={f.title} className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="font-semibold mb-1">{f.title}</div>
              <p className="text-sm text-white/70">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-4 pb-16">
        <h2 className="text-xl font-semibold mb-4">How it works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-white/80">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="font-medium mb-1">1. Describe your song</div>
            <p>Type a vibe like “Warm lofi for study” or “Trailer percussion hit”.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="font-medium mb-1">2. Generate and preview</div>
            <p>Create one or multiple takes; preview instantly and keep favorites.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="font-medium mb-1">3. Download & license</div>
            <p>Grab loop/WAV with a license.txt so you can post with confidence.</p>
          </div>
        </div>
        <div className="text-center mt-6">
          <Link href={`/experiences/${experienceId}/generate`} className="px-5 py-3 rounded-2xl bg-gradient-to-r from-[#7b5cff] via-[#ff4d9d] to-[#35a1ff] shadow-lg">Start generating</Link>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="mx-auto max-w-6xl px-4 pb-20">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-semibold">Plans</h2>
          <p className="text-white/70 text-sm">Whop access maps to credits and features</p>
          <p className="text-white/60 text-xs mt-2">Flexible payment options: Monthly billing or 100+ payment methods including Klarna, Afterpay, and installment plans</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <PlanCard plan="STARTER" title="Starter" price="$29/mo" features={["150 credits/mo","30s max loops","Loops only"]} generateHref={`/experiences/${experienceId}/generate`} />
          <PlanCard plan="PRO" title="Pro" price="$79/mo" features={["600 credits/mo","Batch up to 10","Stems + streaming preview"]} generateHref={`/experiences/${experienceId}/generate`} />
          <PlanCard plan="STUDIO" title="Studio" price="$199/mo" features={["2000 credits/mo","Team seats (x5)","Webhooks & API"]} generateHref={`/experiences/${experienceId}/generate`} />
        </div>
      </section>

      {/* Testimonials */}
      <section className="mx-auto max-w-6xl px-4 pb-16">
        <h2 className="text-xl font-semibold mb-4 text-center">Loved by creators</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-white/80">
          {[
            { quote: "Got a perfect 10s hook for my ad in under a minute.", name: "Lina • DTC founder" },
            { quote: "My reels finally sound pro without copyright strikes.", name: "Marco • Content creator" },
            { quote: "Clients loved the custom jingle, closed the deal fast.", name: "Tess • Freelance editor" },
          ].map((t) => (
            <div key={t.name} className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="mb-2">“{t.quote}”</div>
              <div className="text-white/60">{t.name}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-6xl px-4 pb-24">
        <h2 className="text-xl font-semibold mb-4 text-center">FAQ</h2>
        <div className="space-y-3 text-sm text-white/80">
          <details className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <summary className="font-medium cursor-pointer list-none">Can I use the music commercially?</summary>
            <p className="text-white/70 mt-2">Yes—eligible plans include a license file per asset for social/ads use.</p>
          </details>
          <details className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <summary className="font-medium cursor-pointer list-none">Do I need music theory?</summary>
            <p className="text-white/70 mt-2">No. Describe your song in plain language; presets help you start fast.</p>
          </details>
          <details className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <summary className="font-medium cursor-pointer list-none">Where are files stored?</summary>
            <p className="text-white/70 mt-2">We store audio securely and give you expiring download links.</p>
          </details>
        </div>
      </section>
    </main>
  );
}

