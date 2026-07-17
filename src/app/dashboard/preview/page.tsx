import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { findProfileByUserId } from "@/lib/db";
import { PublicProfileView } from "@/components/public-profile-view";
import Link from "next/link";

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
        <h1 className="text-xl font-bold">No profile yet</h1>
        <p className="mt-2 text-sm text-slate-500">
          Create your digital profile first, then preview it here.
        </p>
        <Link
          href="/dashboard/profile"
          className="mt-6 inline-block rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white"
        >
          Edit My Profile
        </Link>
      </div>
    );
  }

  return (
    <div>
      <PublicProfileView profile={{ ...profile, isPublic: true }} src="preview" />
    </div>
  );
}
