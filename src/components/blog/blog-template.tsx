import Link from "next/link";
import { ArrowLeft, ArrowUpRight, CalendarDays, Clock, Tag } from "lucide-react";
import { BlogPost } from "@/types";
import { formatDate } from "@/lib/utils";

function readingTime(content: string) {
  const words = content.replace(/<[^>]+>/g, " ").trim().split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.ceil(words / 220))} min read`;
}

export function BlogCard({ post, featured = false }: { post: BlogPost; featured?: boolean }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className={`group block overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-soft transition duration-300 hover:-translate-y-1 hover:border-brand-500/50 hover:shadow-card dark:border-slate-800 dark:bg-slate-900 ${featured ? "lg:grid lg:grid-cols-2" : ""}`}
    >
      <div
        className={`relative min-h-52 overflow-hidden bg-gradient-to-br from-brand-100 via-amber-50 to-slate-100 dark:from-brand-950 dark:via-slate-900 dark:to-slate-800 ${featured ? "lg:min-h-full" : ""}`}
        style={post.coverImage ? { backgroundImage: `url(${post.coverImage})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent" />
        <span className="absolute left-5 top-5 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-800 shadow-sm backdrop-blur dark:bg-slate-950/80 dark:text-slate-100">
          {post.category}
        </span>
      </div>
      <div className={`flex flex-col p-6 sm:p-8 ${featured ? "justify-center" : ""}`}>
        <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-slate-500 dark:text-slate-400">
          <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" /> {formatDate(post.publishedAt || post.createdAt)}</span>
          <span className="inline-flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {readingTime(post.content)}</span>
        </div>
        <h2 className={`mt-4 font-display font-bold tracking-tight text-slate-900 transition-colors group-hover:text-brand-700 dark:text-white dark:group-hover:text-brand-300 ${featured ? "text-3xl sm:text-4xl" : "text-xl"}`}>
          {post.title}
        </h2>
        <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{post.excerpt}</p>
        <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-brand-700 dark:text-brand-300">
          Read article <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}

export function BlogPostTemplate({ post }: { post: BlogPost }) {
  return (
    <article className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <Link href="/blog" className="inline-flex items-center gap-2 text-sm font-semibold text-brand-700 transition-colors hover:text-brand-800 dark:text-brand-300 dark:hover:text-brand-200">
        <ArrowLeft className="h-4 w-4" /> Back to all articles
      </Link>
      <header className="mt-8">
        <div className="flex flex-wrap items-center gap-3 text-sm font-medium text-brand-700 dark:text-brand-300">
          <span className="rounded-full bg-brand-100 px-3 py-1 dark:bg-brand-950/60">{post.category}</span>
          <span className="text-slate-500 dark:text-slate-400">{formatDate(post.publishedAt || post.createdAt)} · {readingTime(post.content)}</span>
        </div>
        <h1 className="mt-5 max-w-4xl font-display text-4xl font-extrabold leading-tight tracking-tight text-slate-950 sm:text-5xl dark:text-white">{post.title}</h1>
        <p className="mt-5 max-w-3xl text-lg leading-relaxed text-slate-600 dark:text-slate-300">{post.excerpt}</p>
        <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
          <span>By <strong className="text-slate-800 dark:text-slate-200">{post.authorName}</strong></span>
          {post.tags.length > 0 && <span className="inline-flex items-center gap-1.5"><Tag className="h-3.5 w-3.5" /> {post.tags.join(" · ")}</span>}
        </div>
      </header>

      {post.coverImage && (
        <div className="mt-10 overflow-hidden rounded-3xl border border-slate-200/80 shadow-card dark:border-slate-800">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={post.coverImage} alt={post.title} className="max-h-[30rem] w-full object-cover" />
        </div>
      )}

      <div className="blog-prose mt-10" dangerouslySetInnerHTML={{ __html: post.content }} />
      <div className="mt-12 rounded-3xl border border-brand-200 bg-brand-50 p-6 sm:p-8 dark:border-brand-900/60 dark:bg-brand-950/30">
        <p className="text-sm font-semibold uppercase tracking-wider text-brand-800 dark:text-brand-300">Keep networking smarter</p>
        <h2 className="mt-2 font-display text-2xl font-bold text-slate-950 dark:text-white">Turn your next introduction into a lasting connection.</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">Create a free MigSmartCard profile and share it through NFC, QR code, or a simple link.</p>
        <Link href="/register" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-700">Create your free profile <ArrowUpRight className="h-4 w-4" /></Link>
      </div>
    </article>
  );
}
