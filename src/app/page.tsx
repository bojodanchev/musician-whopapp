import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0b0b12] text-white">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-r from-[#7b5cff] via-[#ff4d9d] to-[#35a1ff] blur-2xl opacity-25" />
      </div>

      <section className="mx-auto max-w-6xl px-4 py-24 text-center">
        <div className="text-4xl md:text-6xl font-semibold tracking-tight">Create catchy hooks for anything.</div>
        <p className="mt-4 text-white/70 max-w-2xl mx-auto">Musician generates ready‑to‑use music for your videos, ads, and social content—backed by Whop entitlements and simple licensing.</p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link href="/generate" className="px-5 py-3 rounded-2xl bg-gradient-to-r from-[#7b5cff] via-[#ff4d9d] to-[#35a1ff] shadow-lg">Open Composer</Link>
          <Link href="#pricing" className="px-5 py-3 rounded-2xl bg-white/10 border border-white/10 hover:bg-white/15">See pricing</Link>
        </div>
      </section>

      <section id="pricing" className="mx-auto max-w-6xl px-4 pb-24">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-semibold">Plans</h2>
          <p className="text-white/70 text-sm">Whop access maps to credits and features</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {name:"Starter", price:"$29/mo", features:["150 credits","30s max","Loops" ]},
            {name:"Pro", price:"$79/mo", features:["600 credits","Batch x4","Streaming preview"]},
            {name:"Studio", price:"$199/mo", features:["2000 credits","Batch x10","Advanced plan editor"]},
          ].map((p)=> (
            <div key={p.name} className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <div className="font-semibold">{p.name}</div>
              <div className="text-3xl mt-2">{p.price}</div>
              <ul className="mt-4 space-y-1 text-sm text-white/70 list-disc list-inside">
                {p.features.map((f)=> <li key={f}>{f}</li>)}
              </ul>
              <Link href="/generate" className="mt-5 inline-block w-full text-center rounded-xl bg-white/10 border border-white/10 py-2 hover:bg-white/15">Choose {p.name}</Link>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
