import Link from "next/link";
import { Check, Nfc, Truck, Shield, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const products = [
  {
    name: "Classic Black",
    price: 29,
    desc: "Matte black PVC with embedded NFC. Timeless and professional.",
    features: ["NFC NTAG chip", "Matte finish", "Works on all phones"],
  },
  {
    name: "Classic White",
    price: 29,
    desc: "Clean white card with subtle MigSmartCard branding.",
    features: ["NFC NTAG chip", "Gloss finish", "Minimal design"],
  },
  {
    name: "Premium Metal",
    price: 59,
    desc: "Brushed stainless steel. The ultimate networking statement.",
    features: ["Metal body", "Premium weight", "Laser engraving"],
    popular: true,
  },
  {
    name: "Wood Grain",
    price: 45,
    desc: "Eco-friendly real wood NFC card with natural texture.",
    features: ["Sustainable wood", "Unique grain", "Lightweight"],
  },
  {
    name: "Custom Print",
    price: 39,
    desc: "Full-color custom design with your logo and brand colors.",
    features: ["Your branding", "Full color print", "Bulk discounts"],
  },
];

export default function ShopMarketingPage() {
  return (
    <div>
      <section className="bg-hero-gradient py-20 text-white">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6">
          <Badge className="mb-4 border-0 bg-white/10 text-white">
            <Nfc className="mr-1 h-3 w-3" /> Physical NFC Cards
          </Badge>
          <h1 className="font-display text-4xl font-extrabold sm:text-5xl">
            MigSmartCard Hardware
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-slate-300">
            Tap to share. Beautiful physical cards with embedded NFC that open
            your digital profile instantly — no app required.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-3 lg:px-8">
          {products.map((p) => (
            <div
              key={p.name}
              className={`relative rounded-2xl border bg-white p-6 shadow-soft dark:bg-slate-900 ${
                p.popular
                  ? "border-brand-500 ring-1 ring-brand-500"
                  : "border-slate-200 dark:border-slate-800"
              }`}
            >
              {p.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-brand-600 text-white">Best Seller</Badge>
                </div>
              )}
              <div className="mb-4 flex h-36 items-center justify-center rounded-xl bg-gradient-to-br from-slate-800 to-slate-950">
                <div className="rounded-lg border border-white/20 bg-white/10 px-8 py-4 backdrop-blur">
                  <p className="text-sm font-bold text-white">MigSmartCard</p>
                  <p className="text-[10px] text-white/60">Smarter Way to Connect</p>
                </div>
              </div>
              <h3 className="text-lg font-bold">{p.name}</h3>
              <p className="mt-1 text-sm text-slate-500">{p.desc}</p>
              <p className="mt-3 text-3xl font-extrabold">
                ${p.price}
                <span className="text-sm font-normal text-slate-400"> /card</span>
              </p>
              <ul className="mt-4 space-y-2">
                {p.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-accent-600" /> {f}
                  </li>
                ))}
              </ul>
              <Button className="mt-6 w-full" asChild>
                <Link href="/dashboard/shop">Order Now</Link>
              </Button>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-slate-200 bg-slate-50 py-16 dark:border-slate-800 dark:bg-slate-900/40">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:grid-cols-3 sm:px-6 lg:px-8">
          {[
            {
              icon: Truck,
              title: "Worldwide Shipping",
              desc: "Ships in 3–5 business days. Tracking included.",
            },
            {
              icon: Shield,
              title: "Works Everywhere",
              desc: "Compatible with iPhone and Android NFC.",
            },
            {
              icon: Sparkles,
              title: "Bulk Corporate Orders",
              desc: "Team packs with brand control. Contact sales.",
            },
          ].map((item) => (
            <div key={item.title} className="text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100 text-brand-600">
                <item.icon className="h-6 w-6" />
              </div>
              <h3 className="font-semibold">{item.title}</h3>
              <p className="mt-1 text-sm text-slate-500">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
