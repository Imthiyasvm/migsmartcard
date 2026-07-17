import { Metadata } from "next";
import { findProfileBySlug, isRedisEnabled } from "@/lib/db";
import {
  decodeShareToken,
  sharePayloadToProfile,
} from "@/lib/share-token";
import { PublicProfileView } from "@/components/public-profile-view";
import Link from "next/link";

interface Props {
  params: { slug: string };
  searchParams: { src?: string; d?: string };
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata({
  params,
  searchParams,
}: Props): Promise<Metadata> {
  if (searchParams.d) {
    const data = decodeShareToken(searchParams.d);
    if (data) {
      return {
        title: `${data.fullName} — ${data.jobTitle || "Digital Profile"}`,
        description: data.bio || `Connect with ${data.fullName}`,
      };
    }
  }

  const profile = await findProfileBySlug(params.slug);
  if (!profile) return { title: "Profile Not Found" };

  return {
    title: `${profile.fullName} — ${profile.jobTitle || "Digital Profile"}`,
    description:
      profile.bio ||
      `Connect with ${profile.fullName}${profile.companyName ? ` at ${profile.companyName}` : ""}`,
    openGraph: {
      title: profile.fullName,
      description: profile.jobTitle || "",
      type: "profile",
    },
  };
}

export default async function PublicProfilePage({
  params,
  searchParams,
}: Props) {
  // Portable share payload (works without Redis)
  if (searchParams.d) {
    const data = decodeShareToken(searchParams.d);
    if (data) {
      return (
        <PublicProfileView
          profile={sharePayloadToProfile(data)}
          src={searchParams.src || "share"}
        />
      );
    }
  }

  const profile = await findProfileBySlug(params.slug);

  if (profile && profile.isPublic !== false) {
    return <PublicProfileView profile={profile} src={searchParams.src} />;
  }

  // Helpful not-found for short /p/slug when Redis is off
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <p className="text-sm font-semibold text-brand-600">Profile not found</p>
      <h1 className="mt-2 text-2xl font-bold">
        This short link is unavailable
      </h1>
      <p className="mt-3 max-w-lg text-sm text-slate-500">
        Short URLs like{" "}
        <code className="rounded bg-slate-100 px-1">/p/{params.slug}</code> need
        Redis on Vercel so every server can load your saved profile.
        {isRedisEnabled()
          ? " Redis is enabled, but this slug was not found — save the profile again from the dashboard."
          : " Redis is not configured on this deployment."}
      </p>
      <div className="mt-6 max-w-md space-y-2 text-left text-sm text-slate-600">
        <p className="font-semibold">What works now:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <Link className="text-brand-600 underline" href="/dashboard/preview">
              Dashboard → Profile Preview
            </Link>{" "}
            (while logged in)
          </li>
          <li>
            <strong>Copy share link</strong> from My Profile (long{" "}
            <code className="rounded bg-slate-100 px-1">/c/...</code> link —
            works for anyone, no Redis)
          </li>
          <li>
            Demo:{" "}
            <Link className="text-brand-600 underline" href="/p/alex-rivera">
              /p/alex-rivera
            </Link>
          </li>
        </ul>
      </div>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href="/dashboard/profile"
          className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white"
        >
          Open My Profile
        </Link>
        <Link
          href="/dashboard/preview"
          className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold"
        >
          Owner preview
        </Link>
      </div>
    </div>
  );
}
