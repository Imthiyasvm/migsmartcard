"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  Trash2,
  Shield,
  Plus,
  Save,
  X,
  UserPlus,
  Ban,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDate } from "@/lib/utils";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  plan: string;
  status: string;
  createdAt: string;
}

interface Draft {
  name: string;
  email: string;
  plan: string;
  status: string;
  role: string;
}

const PLANS = ["free", "pro", "business", "enterprise"] as const;
const ROLES = ["user", "admin", "company_admin"] as const;
const STATUSES = ["active", "suspended", "pending"] as const;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function AdminUsersPage() {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState("");
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(
    null
  );

  // Create-user form
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    plan: "free",
    role: "user",
  });

  const flash = (type: "ok" | "err", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const load = () => {
    fetch("/api/admin?resource=users")
      .then((r) => r.json())
      .then((d) => {
        const list: AdminUser[] = d.users || [];
        setUsers(list);
        const map: Record<string, Draft> = {};
        list.forEach((u) => {
          map[u.id] = {
            name: u.name,
            email: u.email,
            plan: u.plan,
            status: u.status,
            role: u.role,
          };
        });
        setDrafts(map);
      })
      .catch(() => flash("err", "Failed to load users"));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setDraft = (id: string, patch: Partial<Draft>) =>
    setDrafts((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));

  const isDirty = (u: AdminUser) => {
    const d = drafts[u.id];
    if (!d) return false;
    return (
      d.name !== u.name ||
      d.email !== u.email ||
      d.plan !== u.plan ||
      d.status !== u.status ||
      d.role !== u.role
    );
  };

  const saveUser = async (u: AdminUser) => {
    const d = drafts[u.id];
    if (!d) return;
    if (!d.name.trim() || !EMAIL_RE.test(d.email)) {
      flash("err", "A name and valid email are required.");
      return;
    }
    setSavingId(u.id);
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update-user",
          userId: u.id,
          name: d.name.trim(),
          email: d.email.trim().toLowerCase(),
          plan: d.plan,
          status: d.status,
          role: d.role,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        flash("ok", `Saved changes for ${d.name}.`);
        load();
      } else {
        flash("err", data.error || "Failed to save user.");
      }
    } catch {
      flash("err", "Failed to save user.");
    }
    setSavingId(null);
  };

  const toggleSuspend = async (u: AdminUser) => {
    if (u.id === currentUserId) {
      flash("err", "You can't suspend your own account.");
      return;
    }
    const nextStatus = u.status === "suspended" ? "active" : "suspended";
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update-user",
          userId: u.id,
          status: nextStatus,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        flash(
          "ok",
          nextStatus === "suspended"
            ? `${u.name} suspended.`
            : `${u.name} reactivated.`
        );
        load();
      } else {
        flash("err", data.error || "Failed to update status.");
      }
    } catch {
      flash("err", "Failed to update status.");
    }
  };

  const createUser = async () => {
    if (!newUser.name.trim() || !EMAIL_RE.test(newUser.email)) {
      flash("err", "A name and valid email are required.");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create-user",
          name: newUser.name.trim(),
          email: newUser.email.trim().toLowerCase(),
          password: newUser.password || "password123",
          plan: newUser.plan,
          role: newUser.role,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        flash(
          "ok",
          `User created. Temporary password: ${newUser.password || "password123"}`
        );
        setNewUser({ name: "", email: "", password: "", plan: "free", role: "user" });
        setShowCreate(false);
        load();
      } else {
        flash("err", data.error || "Failed to create user.");
      }
    } catch {
      flash("err", "Failed to create user.");
    }
    setCreating(false);
  };

  const deleteUser = async (u: AdminUser) => {
    if (u.id === currentUserId) {
      flash("err", "You can't delete your own account.");
      return;
    }
    if (!confirm(`Delete ${u.name} permanently? This cannot be undone.`)) return;
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete-user", userId: u.id }),
      });
      if (res.ok) {
        flash("ok", `${u.name} deleted.`);
        load();
      } else {
        flash("err", "Failed to delete user.");
      }
    } catch {
      flash("err", "Failed to delete user.");
    }
  };

  const filtered = users.filter((u) =>
    `${u.name} ${u.email}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">User Management</h1>
          <p className="mt-1 text-sm text-slate-500">
            Create, edit, suspend, and manage plans &amp; roles
          </p>
        </div>
        <Button size="sm" onClick={() => setShowCreate((v) => !v)}>
          {showCreate ? <X className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
          {showCreate ? "Close" : "Add User"}
        </Button>
      </div>

      {message && (
        <div
          className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm ${
            message.type === "ok"
              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30"
              : "bg-red-50 text-red-700 dark:bg-red-950/30"
          }`}
        >
          {message.type === "ok" ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <Ban className="h-4 w-4" />
          )}
          {message.text}
        </div>
      )}

      {showCreate && (
        <Card className="border-brand-200 dark:border-brand-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <UserPlus className="h-4 w-4 text-brand-600" /> Create New User
            </CardTitle>
            <CardDescription>
              The user can sign in immediately with the email and password below.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Input
              label="Full name"
              value={newUser.name}
              onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
              placeholder="Jane Doe"
            />
            <Input
              label="Email"
              type="email"
              value={newUser.email}
              onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              placeholder="jane@company.com"
            />
            <Input
              label="Password"
              type="text"
              value={newUser.password}
              onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
              placeholder="Defaults to password123"
            />
            <div>
              <label className="mb-1.5 block text-sm font-medium">Plan</label>
              <Select
                value={newUser.plan}
                onValueChange={(v) => setNewUser({ ...newUser, plan: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PLANS.map((p) => (
                    <SelectItem key={p} value={p} className="capitalize">
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Role</label>
              <Select
                value={newUser.role}
                onValueChange={(v) => setNewUser({ ...newUser, role: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r.replace("_", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button className="w-full" onClick={createUser} loading={creating}>
                <Plus className="h-4 w-4" /> Create User
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Input
        placeholder="Search users by name or email..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" /> {filtered.length} Users
          </CardTitle>
          <CardDescription>
            Edit any field, then press <strong>Save</strong>. Suspend instantly
            blocks sign-in.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {filtered.length === 0 && (
            <p className="py-10 text-center text-sm text-slate-400">
              No users match your search.
            </p>
          )}
          {filtered.map((u) => {
            const d = drafts[u.id] || {
              name: u.name,
              email: u.email,
              plan: u.plan,
              status: u.status,
              role: u.role,
            };
            const isSelf = u.id === currentUserId;
            return (
              <div
                key={u.id}
                className="rounded-xl border border-slate-200 p-4 dark:border-slate-800"
              >
                <div className="grid gap-3 lg:grid-cols-[1.4fr_1.6fr_repeat(3,minmax(120px,0.7fr))_auto]">
                  <Input
                    label="Name"
                    value={d.name}
                    onChange={(e) => setDraft(u.id, { name: e.target.value })}
                  />
                  <Input
                    label="Email"
                    type="email"
                    value={d.email}
                    onChange={(e) => setDraft(u.id, { email: e.target.value })}
                  />
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">Plan</label>
                    <Select
                      value={d.plan}
                      onValueChange={(v) => setDraft(u.id, { plan: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PLANS.map((p) => (
                          <SelectItem key={p} value={p} className="capitalize">
                            {p}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">Status</label>
                    <Select
                      value={d.status}
                      onValueChange={(v) => setDraft(u.id, { status: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUSES.map((s) => (
                          <SelectItem key={s} value={s} className="capitalize">
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">Role</label>
                    <Select
                      value={d.role}
                      onValueChange={(v) => setDraft(u.id, { role: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLES.map((r) => (
                          <SelectItem key={r} value={r}>
                            {r.replace("_", " ")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end gap-2">
                    <Button
                      size="sm"
                      onClick={() => saveUser(u)}
                      loading={savingId === u.id}
                      disabled={!isDirty(u)}
                      title={isDirty(u) ? "Save changes" : "No changes to save"}
                    >
                      <Save className="h-4 w-4" /> Save
                    </Button>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                  <Badge
                    className={
                      u.status === "active"
                        ? "bg-emerald-100 text-emerald-700"
                        : u.status === "suspended"
                          ? "bg-red-100 text-red-700"
                          : "bg-amber-100 text-amber-700"
                    }
                  >
                    {u.status}
                  </Badge>
                  <Badge variant="outline" className="capitalize">
                    {u.role.replace("_", " ")}
                  </Badge>
                  <span className="text-xs text-slate-400">
                    Joined {formatDate(u.createdAt)}
                  </span>
                  {isSelf && (
                    <Badge variant="secondary">You</Badge>
                  )}
                  <div className="ml-auto flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleSuspend(u)}
                      disabled={isSelf}
                    >
                      <Ban className="h-4 w-4" />
                      {u.status === "suspended" ? "Reactivate" : "Suspend"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500"
                      onClick={() => deleteUser(u)}
                      disabled={isSelf}
                    >
                      <Trash2 className="h-4 w-4" /> Delete
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
