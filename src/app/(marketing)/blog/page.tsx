import type { Metadata } from "next";
import { BookOpen, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { BlogCard } from "@/components/blog/blog-template";
import { db, ensureDbReady } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "MigSmartCard Blog — Digital Networking & NFC Guides",
  description:
    "Practical guides to digital business cards, NFC networking, QR code sharing, lead capture, and smarter professional connections.",
  keywords: [
    "digital business card blog",
    "NFC networking guide",
    "professional networking tips",
    "lead capture",
  ],
  openGraph: {
    title: "MigSmartCard Blog — Digital Networking & NFC Guides",
    description:
      "Learn how to share your professional profile, capture better leads, and network smarter with digital business cards.",
    type: "website",
  },
};

export default async function BlogIndexPage() {
  await ensureDbReady();
  const posts = db.blogs.getAll().filter((post) => post.published);
  const [featured, ...rest] = posts;

  return (
    <div className="bg-[#faf9f7] dark:bg-[#0a0a0a]">
      <section className="relative overflow-hidden border-b border-slate-200/80 bg-gradient-to-br from-brand-50 via-[#faf9f7] to-amber-50 py-20 dark:border-slate-800 dark:from-brand-950/50 dark:via-[#0a0a0a] dark:to-[#17120b] sm:py-28">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand-200/30 blur-3xl dark:bg-brand-500/10" />
        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6">
          <Badge className="mb-5"><Sparkles className="mr-1.5 h-3.5 w-3.5" /> Insights for better connections</Badge>
          <h1 className="font-display text-4xl font-extrabold tracking-tight text-slate-950 sm:text-6xl dark:text-white">The MigSmartCard blog</h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-slate-600 dark:text-slate-300">Ideas, guides, and practical advice for digital business cards, NFC networking, and turning more introductions into meaningful relationships.</p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 sm:py-20">
        {featured ? (
          <>
            <div className="mb-8 flex items-center gap-3">
              <BookOpen className="h-5 w-5 text-brand-700 dark:text-brand-300" />
              <h2 className="font-display text-2xl font-bold text-slate-950 dark:text-white">Featured guide</h2>
            </div>
            <BlogCard post={featured} featured />
          </>
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-300 p-12 text-center dark:border-slate-700">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">New articles are on the way.</h2>
          </div>
        )}

        {rest.length > 0 && (
          <div className="mt-16">
            <h2 className="font-display text-2xl font-bold text-slate-950 dark:text-white">Latest articles</h2>
            <div className="mt-8 grid gap-6 md:grid-cols-2">
              {rest.map((post) => <BlogCard key={post.id} post={post} />)}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
