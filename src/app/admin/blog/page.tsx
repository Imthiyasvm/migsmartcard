"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { FileText, Plus, Save, Search, Trash2, ExternalLink, Eye, EyeOff } from "lucide-react";
import { BlogPost } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface BlogDraft {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  authorName: string;
  category: string;
  tags: string;
  coverImage: string;
  published: boolean;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
  canonicalUrl: string;
  ogImage: string;
}

const emptyDraft: BlogDraft = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  authorName: "MigSmartCard Editorial Team",
  category: "Networking",
  tags: "",
  coverImage: "/templates/cover-classic.jpg",
  published: false,
  seoTitle: "",
  seoDescription: "",
  seoKeywords: "",
  canonicalUrl: "",
  ogImage: "",
};

function toDraft(post: BlogPost): BlogDraft {
  return {
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    content: post.content,
    authorName: post.authorName,
    category: post.category,
    tags: post.tags.join(", "),
    coverImage: post.coverImage || "",
    published: post.published,
    seoTitle: post.seoTitle || "",
    seoDescription: post.seoDescription || "",
    seoKeywords: (post.seoKeywords || []).join(", "),
    canonicalUrl: post.canonicalUrl || "",
    ogImage: post.ogImage || "",
  };
}

export default function AdminBlogPage() {
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [draft, setDraft] = useState<BlogDraft>(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadBlogs = () => {
    setLoading(true);
    fetch("/api/admin?resource=blogs")
      .then(async (response) => {
        if (!response.ok) throw new Error("Unable to load blog posts");
        return response.json();
      })
      .then((data) => setBlogs(data.blogs || []))
      .catch((error: Error) => setMessage({ type: "error", text: error.message }))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadBlogs(); }, []);

  const filteredBlogs = useMemo(
    () => blogs.filter((post) => `${post.title} ${post.category} ${post.slug}`.toLowerCase().includes(query.toLowerCase())),
    [blogs, query]
  );

  const updateDraft = (field: keyof BlogDraft, value: string | boolean) => {
    setDraft((current) => ({ ...current, [field]: value }));
    setMessage(null);
  };

  const startNew = () => {
    setEditingId(null);
    setDraft(emptyDraft);
    setMessage(null);
  };

  const editPost = (post: BlogPost) => {
    setEditingId(post.id);
    setDraft(toDraft(post));
    setMessage(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const savePost = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: editingId ? "update-blog" : "create-blog",
          blogId: editingId,
          ...draft,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to save blog post");
      setMessage({ type: "success", text: draft.published ? "Article published and saved." : "Draft saved successfully." });
      setEditingId(data.blog.id);
      setDraft(toDraft(data.blog));
      loadBlogs();
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Unable to save blog post" });
    } finally {
      setSaving(false);
    }
  };

  const deletePost = async (post: BlogPost) => {
    if (!window.confirm(`Delete “${post.title}”? This cannot be undone.`)) return;
    const response = await fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete-blog", blogId: post.id }),
    });
    if (!response.ok) {
      const data = await response.json();
      setMessage({ type: "error", text: data.error || "Unable to delete article" });
      return;
    }
    if (editingId === post.id) startNew();
    setMessage({ type: "success", text: "Article deleted." });
    loadBlogs();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="flex items-center gap-2 text-brand-700 dark:text-brand-300"><FileText className="h-5 w-5" /><span className="text-sm font-semibold">Content management</span></div>
          <h1 className="mt-2 font-display text-3xl font-bold">Blog</h1>
          <p className="mt-1 text-sm text-slate-500">Create search-friendly articles and publish them to the public blog.</p>
        </div>
        <Button onClick={startNew}><Plus className="h-4 w-4" /> New article</Button>
      </div>

      {message && <div className={`rounded-xl border px-4 py-3 text-sm ${message.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300" : "border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300"}`}>{message.text}</div>}

      <form onSubmit={savePost} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? "Edit article" : "Create article"}</CardTitle>
            <CardDescription>Write the article once, then control its public URL and publishing status.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-5 md:grid-cols-2">
              <Input label="Title *" required value={draft.title} onChange={(event) => updateDraft("title", event.target.value)} placeholder="A clear, useful headline" />
              <Input label="URL slug" value={draft.slug} onChange={(event) => updateDraft("slug", event.target.value)} hint="Leave blank to generate it from the title." placeholder="digital-business-card-guide" />
            </div>
            <Textarea label="Excerpt *" required rows={3} value={draft.excerpt} onChange={(event) => updateDraft("excerpt", event.target.value)} hint={`${draft.excerpt.length}/160 recommended characters`} placeholder="A concise summary for the blog card and search results." />
            <Textarea label="Article content *" required rows={16} value={draft.content} onChange={(event) => updateDraft("content", event.target.value)} hint="Basic HTML is supported: use <h2>, <p>, <ul>, <ol>, <li>, and <strong> for structure." placeholder="Write your article here..." />
            <div className="grid gap-5 md:grid-cols-3">
              <Input label="Author" value={draft.authorName} onChange={(event) => updateDraft("authorName", event.target.value)} />
              <Input label="Category" value={draft.category} onChange={(event) => updateDraft("category", event.target.value)} placeholder="Networking" />
              <Input label="Tags" value={draft.tags} onChange={(event) => updateDraft("tags", event.target.value)} hint="Comma separated" placeholder="NFC, networking, sales" />
            </div>
            <Input label="Cover image URL" value={draft.coverImage} onChange={(event) => updateDraft("coverImage", event.target.value)} placeholder="/uploads/blog-cover.jpg" />
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/50">
              <input type="checkbox" checked={draft.published} onChange={(event) => updateDraft("published", event.target.checked)} className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
              <span className="flex-1"><span className="block text-sm font-semibold">Publish this article</span><span className="block text-xs text-slate-500">Published posts appear at /blog and can be indexed by search engines.</span></span>
              {draft.published ? <Eye className="h-5 w-5 text-emerald-600" /> : <EyeOff className="h-5 w-5 text-slate-400" />}
            </label>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>SEO settings</CardTitle>
            <CardDescription>Customize how this article appears in search results and when shared.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-5 md:grid-cols-2">
              <Input label="SEO title" value={draft.seoTitle} onChange={(event) => updateDraft("seoTitle", event.target.value)} hint={`${draft.seoTitle.length}/60 recommended characters. Falls back to the article title.`} placeholder="Keyword-focused title for Google" />
              <Input label="SEO keywords" value={draft.seoKeywords} onChange={(event) => updateDraft("seoKeywords", event.target.value)} hint="Comma separated phrases" placeholder="digital business card, NFC networking" />
            </div>
            <Textarea label="SEO description" rows={3} value={draft.seoDescription} onChange={(event) => updateDraft("seoDescription", event.target.value)} hint={`${draft.seoDescription.length}/160 recommended characters. Falls back to the excerpt.`} placeholder="A compelling description for search and social previews" />
            <div className="grid gap-5 md:grid-cols-2">
              <Input label="Canonical URL (optional)" type="url" value={draft.canonicalUrl} onChange={(event) => updateDraft("canonicalUrl", event.target.value)} hint="Use this when the article's primary URL lives elsewhere." placeholder="https://example.com/blog/article" />
              <Input label="Social / OG image URL (optional)" value={draft.ogImage} onChange={(event) => updateDraft("ogImage", event.target.value)} hint="Falls back to the cover image." placeholder="/uploads/blog-social.jpg" />
            </div>
            <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-5 dark:border-slate-800">
              <Button type="button" variant="outline" onClick={startNew}>Clear</Button>
              <Button type="submit" loading={saving}><Save className="h-4 w-4" /> {editingId ? "Update article" : "Save article"}</Button>
            </div>
          </CardContent>
        </Card>
      </form>

      <Card>
        <CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div><CardTitle>Articles</CardTitle><CardDescription>{blogs.length} total articles, including drafts.</CardDescription></div>
          <div className="relative w-full sm:w-64"><Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search articles" className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-900" /></div>
        </CardHeader>
        <CardContent>
          {loading ? <p className="py-8 text-center text-sm text-slate-500">Loading articles...</p> : filteredBlogs.length === 0 ? <p className="py-8 text-center text-sm text-slate-500">No articles match your search.</p> : <div className="divide-y divide-slate-100 dark:divide-slate-800">{filteredBlogs.map((post) => <div key={post.id} className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold text-slate-900 dark:text-white">{post.title}</h3><Badge variant={post.published ? "success" : "secondary"}>{post.published ? "Published" : "Draft"}</Badge></div><p className="mt-1 text-xs text-slate-500">/blog/{post.slug} · {post.category}</p></div><div className="flex shrink-0 gap-2"><Button size="sm" variant="outline" onClick={() => editPost(post)}>Edit</Button>{post.published && <Button size="sm" variant="ghost" asChild><Link href={`/blog/${post.slug}`} target="_blank"><ExternalLink className="h-4 w-4" /></Link></Button>}<Button size="sm" variant="ghost" onClick={() => deletePost(post)} className="text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"><Trash2 className="h-4 w-4" /></Button></div></div>)}</div>}
        </CardContent>
      </Card>
    </div>
  );
}
