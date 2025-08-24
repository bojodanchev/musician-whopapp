import Link from "next/link";
import { CreditCard } from "lucide-react";

const plans = [
  { name: "Starter", price: "$29/mo", blurb: "150 credits, 30s max, loops only" },
  { name: "Pro", price: "$79/mo", blurb: "600 credits, stems, batch up to 10" },
  { name: "Studio", price: "$199/mo", blurb: "2000 credits, team seats (x5)" },
];

export default function PricingPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Pricing</h1>
        <Link href="/" className="text-sm text-white/70 hover:text-white">Back</Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map((p) => (
          <div key={p.name} className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-medium">{p.name}</h2>
              <CreditCard size={16} />
            </div>
            <div className="text-2xl mt-2">{p.price}</div>
            <div className="text-sm text-white/70 mt-1">{p.blurb}</div>
            <a href="#" className="inline-block mt-4 rounded-2xl px-4 py-2 bg-white/10 border border-white/10">Choose</a>
          </div>
        ))}
      </div>
    </div>
  );
}

