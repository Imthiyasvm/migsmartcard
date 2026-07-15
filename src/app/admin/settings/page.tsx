"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Mail, KeyRound, ShieldCheck, CheckCircle2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Status = {
  type: "idle" | "success" | "error";
  message?: string;
};

export default function AdminSettingsPage() {
  const { data: session, update } = useSession();
  const [currentEmail, setCurrentEmail] = useState("");

  useEffect(() => {
    if (session?.user?.email) setCurrentEmail(session.user.email);
  }, [session?.user?.email]);

  // ─── Change email ─────────────────────────────────────────
  const [emailForm, setEmailForm] = useState({
    currentPassword: "",
    newEmail: "",
    confirmEmail: "",
  });
  const [emailStatus, setEmailStatus] = useState<Status>({ type: "idle" });
  const [emailLoading, setEmailLoading] = useState(false);

  // ─── Reset password ───────────────────────────────────────
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordStatus, setPasswordStatus] = useState<Status>({
    type: "idle",
  });
  const [passwordLoading, setPasswordLoading] = useState(false);

  const resetEmailForm = () => {
    setEmailForm({ currentPassword: "", newEmail: "", confirmEmail: "" });
  };

  const resetPasswordForm = () => {
    setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
  };

  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailStatus({ type: "idle" });

    if (emailForm.newEmail !== emailForm.confirmEmail) {
      setEmailStatus({
        type: "error",
        message: "Email addresses do not match.",
      });
      return;
    }
    if (emailForm.newEmail.trim().toLowerCase() === currentEmail.toLowerCase()) {
      setEmailStatus({
        type: "error",
        message: "New email must be different from the current email.",
      });
      return;
    }

    setEmailLoading(true);
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "change-email",
          currentPassword: emailForm.currentPassword,
          newEmail: emailForm.newEmail,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setEmailStatus({ type: "error", message: data.error || "Could not update email." });
        return;
      }
      setCurrentEmail(data.user?.email || emailForm.newEmail);
      await update({ email: data.user?.email || emailForm.newEmail });
      resetEmailForm();
      setEmailStatus({ type: "success", message: "Admin email updated successfully." });
    } catch {
      setEmailStatus({ type: "error", message: "Something went wrong. Please try again." });
    } finally {
      setEmailLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordStatus({ type: "idle" });

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordStatus({
        type: "error",
        message: "New passwords do not match.",
      });
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      setPasswordStatus({
        type: "error",
        message: "New password must be at least 8 characters long.",
      });
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "change-password",
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPasswordStatus({ type: "error", message: data.error || "Could not reset password." });
        return;
      }
      resetPasswordForm();
      setPasswordStatus({ type: "success", message: "Password reset successfully." });
    } catch {
      setPasswordStatus({ type: "error", message: "Something went wrong. Please try again." });
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Admin Settings</h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage the platform administrator account email and password
        </p>
      </div>

      {/* Account overview */}
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
            <span className="font-medium">{currentEmail || "—"}</span>
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

      {/* Change email */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-brand-600" />
            Change Admin Email
          </CardTitle>
          <CardDescription>
            Enter your current password and the new email address you want to use
            to sign in.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangeEmail} className="space-y-4">
            <Input
              label="Current password"
              type="password"
              required
              placeholder="••••••••"
              autoComplete="current-password"
              value={emailForm.currentPassword}
              onChange={(e) =>
                setEmailForm({ ...emailForm, currentPassword: e.target.value })
              }
            />
            <Input
              label="New email"
              type="email"
              required
              placeholder="new-admin@company.com"
              autoComplete="email"
              value={emailForm.newEmail}
              onChange={(e) =>
                setEmailForm({ ...emailForm, newEmail: e.target.value })
              }
            />
            <Input
              label="Confirm new email"
              type="email"
              required
              placeholder="new-admin@company.com"
              autoComplete="email"
              value={emailForm.confirmEmail}
              onChange={(e) =>
                setEmailForm({ ...emailForm, confirmEmail: e.target.value })
              }
            />
            <StatusMessage status={emailStatus} />
            <Button type="submit" loading={emailLoading}>
              Update email
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Reset password */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-brand-600" />
            Reset Password
          </CardTitle>
          <CardDescription>
            Set a new password for the admin account. Choose at least 8
            characters.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleResetPassword} className="space-y-4">
            <Input
              label="Current password"
              type="password"
              required
              placeholder="••••••••"
              autoComplete="current-password"
              value={passwordForm.currentPassword}
              onChange={(e) =>
                setPasswordForm({
                  ...passwordForm,
                  currentPassword: e.target.value,
                })
              }
            />
            <Input
              label="New password"
              type="password"
              required
              placeholder="••••••••"
              autoComplete="new-password"
              hint="Minimum 8 characters"
              value={passwordForm.newPassword}
              onChange={(e) =>
                setPasswordForm({ ...passwordForm, newPassword: e.target.value })
              }
            />
            <Input
              label="Confirm new password"
              type="password"
              required
              placeholder="••••••••"
              autoComplete="new-password"
              value={passwordForm.confirmPassword}
              onChange={(e) =>
                setPasswordForm({
                  ...passwordForm,
                  confirmPassword: e.target.value,
                })
              }
            />
            <StatusMessage status={passwordStatus} />
            <Button type="submit" loading={passwordLoading}>
              Reset password
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function StatusMessage({ status }: { status: Status }) {
  if (status.type === "idle") return null;
  if (status.type === "success") {
    return (
      <p className="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-950/30 dark:text-green-400">
        <CheckCircle2 className="h-4 w-4 shrink-0" />
        {status.message}
      </p>
    );
  }
  return (
    <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/30 dark:text-red-400">
      {status.message}
    </p>
  );
}
