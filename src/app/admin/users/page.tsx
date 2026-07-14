"use client";

import { useEffect, useState } from "react";
import { Trash2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
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

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState("");

  const load = () => {
    fetch("/api/admin?resource=users")
      .then((r) => r.json())
      .then((d) => setUsers(d.users || []));
  };

  useEffect(() => {
    load();
  }, []);

  const updateUser = async (
    userId: string,
    data: Record<string, string>
  ) => {
    await fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update-user", userId, ...data }),
    });
    load();
  };

  const deleteUser = async (userId: string) => {
    if (!confirm("Delete this user permanently?")) return;
    await fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete-user", userId }),
    });
    load();
  };

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">User Management</h1>
        <p className="mt-1 text-sm text-slate-500">
          Create, edit, suspend, and manage plans
        </p>
      </div>

      <Input
        placeholder="Search users..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" /> {filtered.length} Users
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {filtered.map((u) => (
            <div
              key={u.id}
              className="flex flex-col gap-3 rounded-xl border border-slate-200 p-4 dark:border-slate-800 lg:flex-row lg:items-center lg:justify-between"
            >
              <div className="min-w-0 flex-1 space-y-2">
                <p className="font-semibold">{u.name}</p>
                <p className="text-xs text-slate-500">
                  Joined {formatDate(u.createdAt)}
                </p>
                <Input
                  type="email"
                  defaultValue={u.email}
                  className="h-9 max-w-sm text-xs"
                  title="Edit email and click away to save"
                  onBlur={(e) => {
                    const v = e.target.value.trim().toLowerCase();
                    if (v && v !== u.email) updateUser(u.id, { email: v });
                  }}
                />
                <p className="text-[10px] text-slate-400">
                  Edit email then click outside to save (e.g. imthiyas@mignet.io)
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Select
                  value={u.plan}
                  onValueChange={(v) => updateUser(u.id, { plan: v })}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="pro">Pro</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={u.status}
                  onValueChange={(v) => updateUser(u.id, { status: v })}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
                <Badge className="capitalize">{u.role.replace("_", " ")}</Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-red-500"
                  onClick={() => deleteUser(u.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
