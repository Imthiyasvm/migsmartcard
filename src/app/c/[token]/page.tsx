import { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  decodeShareToken,
  sharePayloadToProfile,
} from "@/lib/share-token";
import { PublicProfileView } from "@/components/public-profile-view";

interface Props {
  params: { token: string };
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = decodeShareToken(params.token);
  if (!data) return { title: "Card Not Found" };
  return {
    title: `${data.fullName} — ${data.jobTitle || "Digital Card"}`,
    description: data.bio || `Connect with ${data.fullName}`,
  };
}

/**
 * Portable public card link — works on Vercel without Redis.
 * URL is longer because the card data is embedded in the path.
 */
export default function ShareCardPage({ params }: Props) {
  const data = decodeShareToken(params.token);
  if (!data) notFound();

  const profile = sharePayloadToProfile(data);
  return <PublicProfileView profile={profile} src="share" />;
}
