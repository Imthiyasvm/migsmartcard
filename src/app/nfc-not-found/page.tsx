import Link from "next/link";
import { Nfc } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";

export default function NfcNotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <Logo />
      <div className="mt-10 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
        <Nfc className="h-8 w-8 text-slate-400" />
      </div>
      <h1 className="mt-6 text-2xl font-bold">Card Not Linked</h1>
      <p className="mt-2 max-w-sm text-sm text-slate-500">
        This NFC card hasn&apos;t been assigned to a profile yet. If you just
        ordered, activation may still be pending.
      </p>
      <div className="mt-6 flex gap-3">
        <Button asChild>
          <Link href="/login">Sign In</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/">Home</Link>
        </Button>
      </div>
    </div>
  );
}
