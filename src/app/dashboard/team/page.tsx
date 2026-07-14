"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Building2, Plus, ExternalLink, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { UserAvatar } from "@/components/ui/avatar";

interface Member {
  id: string;
  name: string;
  email: string;
  role: string;
  plan: string;
  profile?: { slug: string; jobTitle: string; fullName: string };
}

export default function TeamPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [company, setCompany] = useState<any>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [form, setForm] = useState({ name: "", email: "", jobTitle: "" });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const load = () => {
    fetch("/api/team")
      .then((r) => r.json())
      .then((d) => {
        setCompany(d.company);
        setMembers(d.members || []);
      });
  };

  useEffect(() => {
    load();
  }, []);

  const createCompany = async () => {
    if (!companyName.trim()) return;
    setLoading(true);
    await fetch("/api/team", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create-company", name: companyName }),
    });
    setLoading(false);
    load();
  };

  const addMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    const res = await fetch("/api/team", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "add-member", ...form }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      setMessage("Team member added (temp password: welcome123)");
      setForm({ name: "", email: "", jobTitle: "" });
      setShowForm(false);
      load();
    } else {
      setMessage(data.error || "Failed");
    }
  };

  if (!company) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold">Team</h1>
          <p className="mt-1 text-sm text-slate-500">
            Create a company account to manage employee cards
          </p>
        </div>
        <Card className="mx-auto max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" /> Create Company
            </CardTitle>
            <CardDescription>
              Available on Business & Enterprise plans
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Company Name"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Acme Innovations"
            />
            <Button onClick={createCompany} loading={loading} className="w-full">
              Create Company Account
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">{company.name}</h1>
          <p className="mt-1 text-sm text-slate-500">
            Team dashboard · {members.length} members
          </p>
        </div>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4" /> Add Member
        </Button>
      </div>

      {message && (
        <div className="rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-800">
          {message}
        </div>
      )}

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add Team Member</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={addMember} className="grid gap-4 sm:grid-cols-3">
              <Input
                label="Full Name"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              <Input
                label="Email"
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
              <Input
                label="Job Title"
                value={form.jobTitle}
                onChange={(e) => setForm({ ...form, jobTitle: e.target.value })}
              />
              <div className="sm:col-span-3">
                <Button type="submit" loading={loading}>
                  Add Member
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" /> Members
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {members.map((m) => (
            <div
              key={m.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-4 dark:border-slate-800"
            >
              <div className="flex items-center gap-3">
                <UserAvatar name={m.name} className="h-10 w-10" />
                <div>
                  <p className="font-semibold">{m.name}</p>
                  <p className="text-xs text-slate-500">
                    {m.profile?.jobTitle || m.role} · {m.email}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="capitalize">{m.role.replace("_", " ")}</Badge>
                {m.profile && (
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/p/${m.profile.slug}`} target="_blank">
                      <ExternalLink className="h-3 w-3" /> Card
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
