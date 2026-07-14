import Link from "next/link";
import { Check, Nfc, Truck, Shield, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const products = [
  {
    id: "premium-metal",
    name: "Premium Metal Card",
    price: 59,
    desc: "Premium metal NFC card with engraved MigSmartCard branding.",
    features: ["Metal body", "Engraved logo", "NFC ready"],
    image: "/shop/premium-metal.webp",
    popular: true,
  },
  {
    id: "wood-grain",
    name: "Premium Wood Grain NFC Card",
    price: 45,
    desc: "Premium wood grain NFC card with engraved MigSmartCard branding.",
    features: ["Wood finish", "Engraved logo", "NFC ready"],
    image: "/shop/wood-grain.webp",
  },
  {
    id: "custom-print",
    name: "Premium Custom Printed NFC Card",
    price: 49,
    desc: "Premium custom printed NFC card with engraved MigSmartCard branding.",
    features: ["Custom finish", "Engraved logo", "Bulk discounts"],
    image: "/shop/custom-print.webp",
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
            Three premium finishes. Tap to share your digital profile instantly
            — no app required.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:grid-cols-3 sm:px-6 lg:px-8">
          {products.map((p) => (
            <div
              key={p.id}
              className={`relative overflow-hidden rounded-2xl border bg-white shadow-soft dark:bg-slate-900 ${
                p.popular
                  ? "border-brand-500 ring-1 ring-brand-500"
                  : "border-slate-200 dark:border-slate-800"
              }`}
            >
              {p.popular && (
                <div className="absolute left-1/2 top-3 z-10 -translate-x-1/2">
                  <Badge className="bg-brand-600 text-white">Best Seller</Badge>
                </div>
              )}
              <div className="aspect-[4/3] overflow-hidden bg-slate-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.image}
                  alt={p.name}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="p-6">
                <h3 className="text-lg font-bold">{p.name}</h3>
                <p className="mt-1 text-sm text-slate-500">{p.desc}</p>
                <p className="mt-3 text-3xl font-extrabold">
                  ${p.price}
                  <span className="text-sm font-normal text-slate-400">
                    {" "}
                    /card
                  </span>
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
