"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Mail, KeyRound, CheckCircle2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Status = { type: "idle" | "success" | "error"; message?: string };

const emptyEmail = { currentPassword: "", newEmail: "", confirmEmail: "" };
const emptyPassword = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

/**
 * Self-service Change Email + Reset Password forms.
 * Works for any authenticated user via /api/account.
 */
export function AccountSettingsForm() {
  const { data: session, update } = useSession();
  const [currentEmail, setCurrentEmail] = useState("");

  const [emailForm, setEmailForm] = useState(emptyEmail);
  const [emailStatus, setEmailStatus] = useState<Status>({ type: "idle" });
  const [emailLoading, setEmailLoading] = useState(false);

  const [passwordForm, setPasswordForm] = useState(emptyPassword);
  const [passwordStatus, setPasswordStatus] = useState<Status>({
    type: "idle",
  });
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    if (session?.user?.email) setCurrentEmail(session.user.email);
  }, [session?.user?.email]);

  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailStatus({ type: "idle" });

    if (emailForm.newEmail.trim() !== emailForm.confirmEmail.trim()) {
      setEmailStatus({
        type: "error",
        message: "Email addresses do not match.",
      });
      return;
    }
    if (
      emailForm.newEmail.trim().toLowerCase() === currentEmail.toLowerCase()
    ) {
      setEmailStatus({
        type: "error",
        message: "New email must be different from the current email.",
      });
      return;
    }

    setEmailLoading(true);
    try {
      const res = await fetch("/api/account", {
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
        setEmailStatus({
          type: "error",
          message: data.error || "Could not update email.",
        });
        return;
      }
      const newEmail = data.user?.email || emailForm.newEmail;
      setCurrentEmail(newEmail);
      await update({ email: newEmail });
      setEmailForm(emptyEmail);
      setEmailStatus({
        type: "success",
        message: "Email updated successfully.",
      });
    } catch {
      setEmailStatus({
        type: "error",
        message: "Something went wrong. Please try again.",
      });
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
      const res = await fetch("/api/account", {
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
        setPasswordStatus({
          type: "error",
          message: data.error || "Could not reset password.",
        });
        return;
      }
      setPasswordForm(emptyPassword);
      setPasswordStatus({
        type: "success",
        message: "Password reset successfully.",
      });
    } catch {
      setPasswordStatus({
        type: "error",
        message: "Something went wrong. Please try again.",
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-brand-600" />
            Change Email
          </CardTitle>
          <CardDescription>
            Enter your current password and the new email address you want to
            use to sign in.
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
              placeholder="you@company.com"
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
              placeholder="you@company.com"
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-brand-600" />
            Reset Password
          </CardTitle>
          <CardDescription>
            Set a new password for your account. Choose at least 8 characters.
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
    </>
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
