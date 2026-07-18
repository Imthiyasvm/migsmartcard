import Link from "next/link";
import {
  Nfc,
  QrCode,
  BarChart3,
  Users,
  Zap,
  Shield,
  Smartphone,
  Globe,
  Check,
  ArrowRight,
  Sparkles,
  CreditCard,
  Share2,
  Download,
  TrendingUp,
  Target,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PLANS } from "@/lib/plans";
import { CountUp } from "@/components/count-up";

const features = [
  {
    icon: Nfc,
    title: "NFC Smart Cards",
    description:
      "Tap your physical MigSmartCard on any phone to instantly open your digital profile. No app required.",
  },
  {
    icon: QrCode,
    title: "Dynamic QR Codes",
    description:
      "Auto-generated QR codes for events, print materials, and email signatures. Download as PNG or SVG.",
  },
  {
    icon: Users,
    title: "Lead Capture",
    description:
      "Exchange contacts on the spot. Visitors share their details and you get notified instantly.",
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    description:
      "Track views, link clicks, device types, locations, and conversion rates in real time.",
  },
  {
    icon: Share2,
    title: "Multi-Channel Sharing",
    description:
      "Share via NFC, QR, direct link, email signature, or social media — one profile, every channel.",
  },
  {
    icon: Shield,
    title: "Enterprise Ready",
    description:
      "Team management, bulk NFC assignment, brand control, CRM export, and custom domains.",
  },
];

const steps = [
  {
    step: "01",
    title: "Create your profile",
    description:
      "Add your photo, bio, contact info, social links, and custom CTAs in minutes.",
    icon: Sparkles,
  },
  {
    step: "02",
    title: "Get your smart card",
    description:
      "Order a physical NFC card or use your free QR code and shareable link immediately.",
    icon: CreditCard,
  },
  {
    step: "03",
    title: "Tap, share & grow",
    description:
      "Network smarter. Capture leads, track engagement, and never lose a contact again.",
    icon: Zap,
  },
];

const benefits = [
  {
    icon: Target,
    title: "Precision Networking",
    description: "Know exactly who viewed your profile, when, and from where.",
  },
  {
    icon: TrendingUp,
    title: "Grow Your Pipeline",
    description: "Turn every interaction into a qualified lead with smart capture forms.",
  },
  {
    icon: Layers,
    title: "Brand Consistency",
    description: "Control your look across every card, template, and team member.",
  },
];

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden landing-hero">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMzUiPjxwYXRoIGQ9Ik0zNiAzNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8 lg:py-36">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className="animate-slide-up animate-delay-100">
              <Badge className="mb-6 border-0 bg-white/10 text-white backdrop-blur">
                <Sparkles className="mr-1 h-3 w-3" /> Smarter Way to Connect
              </Badge>
              <h1 className="font-display text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
                Your Digital
                <br />
                <span className="bg-gradient-to-r from-brand-300 to-brand-400 bg-clip-text text-transparent">
                  Business Profile
                </span>
                <br />
                Reimagined
              </h1>
              <p className="mt-6 max-w-lg text-lg text-slate-300">
                Create stunning digital profiles. Share instantly via NFC, QR, or
                link. Capture every lead and grow your network with powerful
                analytics.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button size="xl" asChild className="bg-white text-brand-800 hover:bg-slate-100 hover-lift">
                  <Link href="/register">
                    Create Free Profile <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  size="xl"
                  variant="outline"
                  asChild
                  className="border-white/30 text-white hover:bg-white/10 hover-lift"
                >
                  <Link href="/#demos">View Demos</Link>
                </Button>
              </div>
              <div className="mt-8 flex flex-wrap items-center gap-6 text-sm text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-brand-400" /> Free forever plan
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-brand-400" /> No app needed
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-brand-400" /> Works on any phone
                </span>
              </div>
            </div>

            {/* Hero card mockup */}
            <div className="relative mx-auto w-full max-w-sm animate-float lg:mx-0 lg:ml-auto">
              <div className="rounded-3xl border border-white/10 bg-white/10 p-1 shadow-glow backdrop-blur-xl hover-lift">
                <div className="overflow-hidden rounded-[1.35rem] bg-white text-slate-900 shadow-2xl">
                  <div className="h-28 bg-cover bg-center" style={{ backgroundImage: "url(/templates/cover-classic.jpg)" }} />
                  <div className="-mt-12 flex flex-col items-center px-6 pb-6">
                    <div className="h-24 w-24 shrink-0 overflow-hidden rounded-full border-4 border-white bg-[#E8E6E3] shadow-lg">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="/templates/avatar-classic.jpg"
                        alt="Alex Rivera"
                        width={96}
                        height={96}
                        className="h-24 w-24 max-w-none object-cover object-[center_15%]"
                      />
                    </div>
                    <h3 className="mt-3 text-xl font-bold">Alex Rivera</h3>
                    <p className="text-sm text-slate-500">Head of Product · Mignet Technologies</p>
                    <div className="mt-4 flex w-full gap-2">
                      <div className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-brand-600 py-2.5 text-xs font-semibold text-white hover-lift">
                        <Download className="h-3.5 w-3.5" /> Save Contact
                      </div>
                      <div className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border-2 border-brand-600 py-2.5 text-xs font-semibold text-brand-600 hover:bg-brand-50 hover-lift">
                        Exchange
                      </div>
                    </div>
                    <div className="mt-4 w-full space-y-2">
                      {["+971 50 123 4567", "alex@mignet.io", "mignet.io"].map(
                        (item) => (
                          <div
                            key={item}
                            className="rounded-xl bg-slate-50 px-4 py-2.5 text-xs font-medium text-slate-600 hover:bg-slate-100 transition hover-lift"
                          >
                            {item}
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>
              </div>
              {/* Floating badges */}
              <div className="absolute -left-4 top-16 rounded-xl bg-white px-3 py-2 shadow-card dark:bg-[#141414] animate-slide-left animate-delay-300 hover-lift">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200">
                  <Nfc className="h-4 w-4 text-brand-600" /> NFC Ready
                </div>
              </div>
              <div className="absolute -right-2 bottom-24 rounded-xl bg-white px-3 py-2 shadow-card dark:bg-[#141414] animate-slide-right animate-delay-500 hover-lift">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200">
                  <BarChart3 className="h-4 w-4 text-brand-600" /> 2.4K views
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Logos / trust */}
      <section className="landing-section landing-section-1 border-b py-10">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
            Trusted by professionals at leading companies worldwide
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-8 grayscale">
            {["Mignet", "Acme Corp", "Globex", "Initech", "Umbrella"].map(
              (name) => (
                <span
                  key={name}
                  className="text-lg font-bold tracking-tight text-slate-600 transition-colors duration-300 hover:text-brand-700 dark:text-slate-400 dark:hover:text-brand-300"
                >
                  {name}
                </span>
              )
            )}
          </div>
        </div>
      </section>

      {/* Demo profiles */}
      <section id="demos" className="landing-section landing-section-2 border-b py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center animate-fade-in">
            <Badge variant="default" className="mb-4">Live demos</Badge>
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Minimal. Premium. Live.
            </h2>
            <p className="mt-3 text-slate-500">
              Three demo profiles — Classic, Glass, and Premium. Open any profile to experience the full digital experience.
            </p>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {[
              {
                href: "/p/alex-rivera",
                name: "Alex Rivera",
                role: "Head of Product · Mignet Technologies",
                img: "/templates/avatar-classic.jpg",
                cover: "/templates/cover-classic.jpg",
                badge: "Free",
              },
              {
                href: "/p/jordan-lee",
                name: "Jordan Lee",
                role: "Glass · Pro+",
                img: "/templates/avatar-glass.jpg",
                cover: "/templates/cover-glass.jpg",
                badge: "Pro+",
              },
              {
                href: "/p/sam-chen",
                name: "Sam Chen",
                role: "Premium · Pro+",
                img: "/templates/avatar-premium.jpg",
                cover: "/templates/cover-premium.jpg",
                badge: "Pro+",
              },
            ].map((d, index) => (
              <Link
                key={d.href}
                href={d.href}
                className="group overflow-hidden rounded-2xl border landing-card shadow-soft transition hover:-translate-y-1 hover:shadow-card hover:border-brand-500/50 animate-slide-up animate-delay-100"
                style={{ animationDelay: `${100 + index * 100}ms` }}
              >
                <div
                  className="relative h-28 bg-cover bg-center"
                  style={{ backgroundImage: `url(${d.cover})` }}
                >
                  <span className="absolute right-3 top-3 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-white">
                    {d.badge}
                  </span>
                </div>
                <div className="relative z-10 -mt-12 flex flex-col items-center px-4 pb-6">
                  <div className="h-24 w-24 shrink-0 overflow-hidden rounded-full border-4 border-white bg-[#E8E6E3] shadow-lg ring-1 ring-black/5 dark:border-[#1a1a1a] group-hover:ring-2 group-hover:ring-brand-500 transition-all duration-300">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={d.img}
                      alt={d.name}
                      width={96}
                      height={96}
                      className="h-24 w-24 max-w-none object-cover object-[center_15%]"
                    />
                  </div>
                  <h3 className="mt-3 font-bold group-hover:text-brand-700 transition-colors dark:group-hover:text-brand-300">{d.name}</h3>
                  <p className="text-xs text-slate-500">{d.role}</p>
                  <span className="mt-3 inline-block text-xs font-semibold text-brand-700 transition-transform group-hover:translate-x-1 dark:text-brand-300">Open live profile →</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="landing-section landing-section-3 py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center animate-fade-in">
            <Badge variant="default" className="mb-4">Features</Badge>
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Everything you need to network smarter
            </h2>
            <p className="mt-4 text-slate-500 dark:text-slate-400">
              From NFC taps to deep analytics — MigSmartCard is your complete
              digital networking platform.
            </p>
          </div>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, index) => (
              <div
                key={f.title}
                className="group rounded-2xl border landing-card p-6 shadow-soft transition hover:border-brand-500/50 hover:shadow-card hover-lift animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100 text-brand-800 dark:bg-brand-950/50 dark:text-brand-300 transition group-hover:bg-brand-600 group-hover:text-white group-hover:scale-110 duration-300">
                  <f.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                  {f.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section
        id="how-it-works"
        className="landing-section landing-section-1 border-y py-20 sm:py-28"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center animate-fade-in">
            <Badge variant="default" className="mb-4">How it Works</Badge>
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Up and running in 3 minutes
            </h2>
          </div>
          <div className="mt-14 grid gap-8 md:grid-cols-3">
            {steps.map((s, index) => (
              <div key={s.step} className="relative text-center animate-slide-up" style={{ animationDelay: `${200 + index * 150}ms` }}>
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-glow group-hover:scale-110 transition-transform duration-300">
                  <s.icon className="h-7 w-7" />
                </div>
                <span className="text-xs font-bold uppercase tracking-widest text-brand-700 dark:text-brand-300">
                  Step {s.step}
                </span>
                <h3 className="mt-2 text-xl font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  {s.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Channels */}
      <section className="landing-section landing-section-2 py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className="animate-slide-left">
              <Badge variant="default" className="mb-4">Share Anywhere</Badge>
              <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
                One profile.
                <br />
                Every channel.
              </h2>
              <p className="mt-4 text-slate-500 dark:text-slate-400">
                Whether it&apos;s a conference handshake, a virtual intro, or a
                printed flyer — your MigSmartCard works everywhere.
              </p>
              <ul className="mt-8 space-y-4">
                {[
                  { icon: Nfc, label: "NFC physical smart cards" },
                  { icon: QrCode, label: "Dynamic QR codes (PNG/SVG)" },
                  { icon: Globe, label: "Shareable profile links" },
                  { icon: Smartphone, label: "Email signatures & wallets" },
                ].map((item, index) => (
                  <li key={item.label} className="flex items-center gap-3 animate-slide-right" style={{ animationDelay: `${300 + index * 100}ms` }}>
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-100 text-brand-800 dark:bg-brand-950/50 dark:text-brand-300 group-hover:bg-brand-600 group-hover:text-white transition-all duration-300">
                      <item.icon className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-medium">{item.label}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Profile Views", value: 12400, change: "+24%" },
                { label: "Leads Captured", value: 847, change: "+18%" },
                { label: "NFC Taps", value: 3200, change: "+41%" },
                { label: "Link Clicks", value: 5800, change: "+12%" },
              ].map((stat, index) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border landing-card p-5 shadow-soft hover:border-brand-500/50 hover:shadow-card hover-lift animate-scale-in"
                  style={{ animationDelay: `${200 + index * 100}ms` }}
                >
                  <p className="text-xs font-medium text-slate-500">{stat.label}</p>
                  <p className="mt-1 text-2xl font-bold text-brand-700 dark:text-brand-300">
                    <CountUp end={stat.value} />
                  </p>
                  <p className="mt-1 text-xs font-semibold text-brand-700 dark:text-brand-300">
                    {stat.change} this month
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="landing-section landing-section-3 border-y py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center animate-fade-in">
            <Badge variant="default" className="mb-4">Why MigSmartCard?</Badge>
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Network with purpose
            </h2>
            <p className="mt-4 text-slate-500">
              More than a digital card — a growth engine for your professional network.
            </p>
          </div>
          <div className="mt-14 grid gap-6 sm:grid-cols-3">
            {benefits.map((b, index) => (
              <div
                key={b.title}
                className="group rounded-2xl border landing-card p-6 shadow-soft transition hover:border-brand-500/50 hover:shadow-card hover-lift animate-slide-up"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100 text-brand-800 dark:bg-brand-950/50 dark:text-brand-300 transition group-hover:bg-brand-600 group-hover:text-white group-hover:scale-110 duration-300">
                  <b.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold">{b.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">
                  {b.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section
        id="pricing"
        className="landing-section landing-section-4 border-t py-20 sm:py-28"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center animate-fade-in">
            <Badge variant="default" className="mb-4">Pricing</Badge>
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Simple, transparent pricing
            </h2>
            <p className="mt-4 text-slate-500 dark:text-slate-400">
              Start free. Upgrade when you need more power.
            </p>
          </div>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {PLANS.map((plan, index) => (
              <div
                key={plan.id}
                className={`relative flex flex-col rounded-2xl border landing-card p-6 shadow-soft transition hover:shadow-card hover-lift animate-slide-up ${
                  plan.popular
                    ? "border-brand-500 shadow-glow ring-1 ring-brand-500"
                    : "border-slate-200 dark:border-slate-800"
                }`}
                style={{ animationDelay: `${200 + index * 100}ms` }}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 animate-pulse-soft">
                    <Badge className="bg-brand-600 text-white">Most Popular</Badge>
                  </div>
                )}
                <h3 className="text-lg font-bold">{plan.name}</h3>
                <p className="mt-1 text-xs text-slate-500">{plan.description}</p>
                <div className="mt-4">
                  <span className="text-4xl font-extrabold text-brand-700 dark:text-brand-300">${plan.price}</span>
                  <span className="text-sm text-slate-500">/mo</span>
                </div>
                {plan.priceYearly > 0 && (
                  <p className="mt-1 text-xs text-slate-400">
                    or ${plan.priceYearly}/yr (save 2 months)
                  </p>
                )}
                <ul className="mt-6 flex-1 space-y-2.5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-700 dark:text-brand-300" />
                      <span className="text-slate-700 dark:text-slate-300">{f}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="mt-6 w-full"
                  variant={plan.popular ? "default" : "outline"}
                  asChild
                >
                  <Link href="/register">
                    {plan.price === 0 ? "Get Started" : "Upgrade"}
                  </Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="landing-section landing-section-3 py-20 sm:py-28">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl animate-fade-in">
            Ready to connect smarter?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-slate-500 dark:text-slate-400 animate-slide-up animate-delay-200">
            Join thousands of professionals who ditched paper cards for
            MigSmartCard. Create yours free in under 2 minutes.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3 animate-slide-up animate-delay-400">
            <Button size="xl" asChild className="hover-lift">
              <Link href="/register">
                Create Your Free Profile <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="xl" variant="outline" asChild className="hover-lift">
              <Link href="/shop">Shop NFC Cards</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}