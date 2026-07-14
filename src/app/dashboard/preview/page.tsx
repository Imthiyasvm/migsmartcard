import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { findProfileByUserId, isRedisEnabled } from "@/lib/db";
import { buildSharePath } from "@/lib/share-token";
import { PublicProfileView } from "@/components/public-profile-view";
import Link from "next/link";
import { CopyShareButton } from "@/components/copy-share-button";

export const dynamic = "force-dynamic";

export default async function OwnerPreviewPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/dashboard/preview");
  }

  const profile = await findProfileByUserId(session.user.id);

  if (!profile) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="text-xl font-bold">No card yet</h1>
        <p className="mt-2 text-sm text-slate-500">
          Create your digital card first, then preview it here.
        </p>
        <Link
          href="/dashboard/profile"
          className="mt-6 inline-block rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white"
        >
          Edit My Card
        </Link>
      </div>
    );
  }

  const sharePath = buildSharePath(profile);
  const redis = isRedisEnabled();

  return (
    <div>
      <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-center text-xs text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
        <p className="font-semibold">
          Owner preview (works while logged in)
        </p>
        <p className="mt-1">
          Short public URL{" "}
          <code className="rounded bg-white/70 px-1 dark:bg-black/30">
            /p/{profile.slug}
          </code>{" "}
          {redis
            ? "should work if Redis is configured and the card was saved."
            : "will 404 on Vercel until Redis is added — use the share link below."}
        </p>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
          <CopyShareButton path={sharePath} />
          <Link className="underline" href="/dashboard/profile">
            Edit card
          </Link>
          {redis && (
            <Link className="underline" href={`/p/${profile.slug}`}>
              Try short /p/ link
            </Link>
          )}
        </div>
      </div>
      <PublicProfileView profile={{ ...profile, isPublic: true }} src="preview" />
    </div>
  );
}
