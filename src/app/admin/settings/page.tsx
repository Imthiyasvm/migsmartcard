"use client";

import { useSession } from "next-auth/react";
import { ShieldCheck } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AccountSettingsForm } from "@/components/account/account-settings-form";
import { ZiinaSettingsForm } from "@/components/admin/ziina-settings-form";

export default function AdminSettingsPage() {
  const { data: session } = useSession();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Admin Settings</h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage the platform administrator account email and password
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-brand-600" />
            Account
          </CardTitle>
          <CardDescription>Your platform administrator account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Name</span>
            <span className="font-medium">{session?.user?.name}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Email</span>
            <span className="font-medium">{session?.user?.email || "—"}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Role</span>
            <Badge className="capitalize">{session?.user?.role || "admin"}</Badge>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Plan</span>
            <Badge className="capitalize">{session?.user?.plan}</Badge>
          </div>
        </CardContent>
      </Card>

      <AccountSettingsForm />

      <ZiinaSettingsForm />
    </div>
  );
}
