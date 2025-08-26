import Link from "next/link";

export const dynamic = "force-dynamic";

export default function ExperiencePage({ params }: { params: { experienceId: string } }) {
  const { experienceId } = params;
  return (
    <main className="min-h-screen bg-[#0b0b12] text-white">
      <section className="mx-auto max-w-5xl px-4 py-20 text-center">
        <div className="text-4xl md:text-5xl font-semibold tracking-tight">Create catchy hooks for anything.</div>
        <p className="mt-4 text-white/70 max-w-2xl mx-auto">Welcome! This is your Musician workspace. Start by opening the composer to generate your first track.</p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link href={`/experiences/${experienceId}/generate`} className="px-5 py-3 rounded-2xl bg-gradient-to-r from-[#7b5cff] via-[#ff4d9d] to-[#35a1ff] shadow-lg">Open Composer</Link>
        </div>
      </section>
    </main>
  );
}


