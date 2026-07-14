"use client";

import { useEffect, useState } from "react";
import { Nfc, Plus, Link2 } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface NfcCardRow {
  id: string;
  nfcUid: string;
  status: string;
  design: string;
  userId?: string;
  profileId?: string;
}

interface AdminUser {
  id: string;
  name: string;
  email: string;
}

export default function AdminNfcPage() {
  const [cards, setCards] = useState<NfcCardRow[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [newUid, setNewUid] = useState("");
  const [newDesign, setNewDesign] = useState("classic-black");
  const [assignUid, setAssignUid] = useState("");
  const [assignUser, setAssignUser] = useState("");
  const [message, setMessage] = useState("");

  const load = () => {
    fetch("/api/admin?resource=nfc")
      .then((r) => r.json())
      .then((d) => setCards(d.cards || []));
    fetch("/api/admin?resource=users")
      .then((r) => r.json())
      .then((d) => setUsers(d.users || []));
  };

  useEffect(() => {
    load();
  }, []);

  const createCard = async () => {
    if (!newUid.trim()) return;
    const res = await fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "create-nfc",
        nfcUid: newUid.trim(),
        design: newDesign,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      setMessage("NFC card created");
      setNewUid("");
      load();
    } else {
      setMessage(data.error || "Failed");
    }
  };

  const assign = async () => {
    if (!assignUid || !assignUser) return;
    const res = await fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "assign-nfc",
        nfcUid: assignUid,
        userId: assignUser,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      setMessage("NFC assigned to user profile");
      load();
    } else {
      setMessage(data.error || "Failed");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">NFC Card Management</h1>
        <p className="mt-1 text-sm text-slate-500">
          Inventory and assign physical smart cards
        </p>
      </div>

      {message && (
        <div className="rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-800">
          {message}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" /> Register NFC Card
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              label="NFC UID"
              value={newUid}
              onChange={(e) => setNewUid(e.target.value)}
              placeholder="NFC-MIG-XXXXXXX"
            />
            <div>
              <label className="mb-1.5 block text-sm font-medium">Design</label>
              <Select value={newDesign} onValueChange={setNewDesign}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="classic-black">Classic Black</SelectItem>
                  <SelectItem value="classic-white">Classic White</SelectItem>
                  <SelectItem value="premium-metal">Premium Metal</SelectItem>
                  <SelectItem value="wood-grain">Wood Grain</SelectItem>
                  <SelectItem value="custom-print">Custom Print</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={createCard}>Create Card</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5" /> Assign to User
            </CardTitle>
            <CardDescription>
              Links NFC chip to user&apos;s digital profile
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                Unassigned Card
              </label>
              <Select value={assignUid} onValueChange={setAssignUid}>
                <SelectTrigger>
                  <SelectValue placeholder="Select NFC card" />
                </SelectTrigger>
                <SelectContent>
                  {cards
                    .filter((c) => c.status === "unassigned")
                    .map((c) => (
                      <SelectItem key={c.id} value={c.nfcUid}>
                        {c.nfcUid} ({c.design})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">User</label>
              <Select value={assignUser} onValueChange={setAssignUser}>
                <SelectTrigger>
                  <SelectValue placeholder="Select user" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name} ({u.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={assign}>Assign Card</Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Nfc className="h-5 w-5" /> Inventory ({cards.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {cards.map((c) => (
            <div
              key={c.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 p-3 dark:border-slate-800"
            >
              <div>
                <p className="font-mono text-sm font-semibold">{c.nfcUid}</p>
                <p className="text-xs capitalize text-slate-500">
                  {c.design.replace(/-/g, " ")}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant={c.status === "assigned" ? "success" : "secondary"}
                  className="capitalize"
                >
                  {c.status}
                </Badge>
                {c.userId && (
                  <span className="text-xs text-slate-400">
                    → {users.find((u) => u.id === c.userId)?.name || c.userId}
                  </span>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
