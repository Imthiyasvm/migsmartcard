import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlogPostTemplate } from "@/components/blog/blog-template";
import { db, ensureDbReady } from "@/lib/db";
import { absoluteUrl } from "@/lib/utils";

interface Props {
  params: { slug: string };
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function getPublishedPost(slug: string) {
  await ensureDbReady();
  const post = db.blogs.getBySlug(slug.toLowerCase());
  return post?.published ? post : undefined;
}

function absoluteAsset(value?: string) {
  if (!value) return undefined;
  return /^https?:\/\//i.test(value) ? value : absoluteUrl(value);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getPublishedPost(params.slug);
  if (!post) return { title: "Article Not Found" };

  const title = post.seoTitle || post.title;
  const description = post.seoDescription || post.excerpt;
  const canonical = post.canonicalUrl || absoluteUrl(`/blog/${post.slug}`);
  const image = absoluteAsset(post.ogImage || post.coverImage);

  return {
    title,
    description,
    keywords: post.seoKeywords,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      type: "article",
      url: canonical,
      publishedTime: post.publishedAt,
      authors: [post.authorName],
      section: post.category,
      tags: post.tags,
      images: image ? [{ url: image, alt: post.title }] : undefined,
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function BlogArticlePage({ params }: Props) {
  const post = await getPublishedPost(params.slug);
  if (!post) notFound();

  const canonical = post.canonicalUrl || absoluteUrl(`/blog/${post.slug}`);
  const image = absoluteAsset(post.ogImage || post.coverImage);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.seoDescription || post.excerpt,
    image: image ? [image] : undefined,
    datePublished: post.publishedAt || post.createdAt,
    dateModified: post.updatedAt,
    author: { "@type": "Organization", name: post.authorName },
    publisher: { "@type": "Organization", name: "MigSmartCard" },
    mainEntityOfPage: { "@type": "WebPage", "@id": canonical },
    articleSection: post.category,
    keywords: post.seoKeywords?.join(", "),
  };

  return (
    <>
      <BlogPostTemplate post={post} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </>
  );
}
