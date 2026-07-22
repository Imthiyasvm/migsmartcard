"use client";

import { useEffect, useState } from "react";
import { Trash2, Download, Mail, Phone, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { formatDateTime } from "@/lib/utils";
import { Lead } from "@/types";

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = () => {
    fetch("/api/leads")
      .then((r) => r.json())
      .then((d) => {
        setLeads(d.leads || []);
        setIsAdmin(Boolean(d.isAdmin));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const remove = async (id: string) => {
    if (!confirm("Delete this lead?")) return;
    await fetch(`/api/leads?id=${id}`, { method: "DELETE" });
    setLeads((prev) => prev.filter((l) => l.id !== id));
  };

  const exportCsv = () => {
    const header = isAdmin
      ? "Name,Email,Phone,Company,Message,Source,Profile,Owner,Date\n"
      : "Name,Email,Phone,Company,Message,Source,Date\n";
    const rows = leads
      .map((l) => {
        const base = `"${l.name}","${l.email}","${l.phone || ""}","${l.company || ""}","${(l.message || "").replace(/"/g, '""')}","${l.source}"`;
        return isAdmin
          ? `${base},"${l.profileName || ""}","${l.ownerEmail || l.ownerName || ""}","${l.createdAt}"`
          : `${base},"${l.createdAt}"`;
      })
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "migsmartcard-leads.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const sourceVariant = (s: string) => {
    if (s === "nfc") return "default" as const;
    if (s === "qr") return "warning" as const;
    if (s === "form") return "success" as const;
    return "secondary" as const;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Leads</h1>
          <p className="mt-1 text-sm text-slate-500">
            {isAdmin
              ? "All contact exchanges captured across every profile on the platform"
              : "Contacts captured from your digital profile"}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={exportCsv} disabled={!leads.length}>
          <Download className="h-4 w-4" /> Export CSV
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {leads.length} Lead{leads.length !== 1 ? "s" : ""}
          </CardTitle>
          <CardDescription>
            From exchange forms, NFC taps, and QR scans
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="py-12 text-center text-slate-400">Loading...</p>
          ) : leads.length === 0 ? (
            <p className="py-12 text-center text-slate-400">
              No leads yet. Share your card to start capturing contacts.
            </p>
          ) : (
            <div className="space-y-3">
              {leads.map((lead) => (
                <div
                  key={lead.id}
                  className="flex flex-col gap-3 rounded-xl border border-slate-200 p-4 dark:border-slate-800 sm:flex-row sm:items-center"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
                    {lead.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{lead.name}</p>
                      <Badge variant={sourceVariant(lead.source)}>
                        {lead.source}
                      </Badge>
                      {!lead.viewed && (
                        <Badge variant="default">New</Badge>
                      )}
                      {isAdmin && (lead.profileName || lead.ownerName) && (
                        <Badge variant="outline" className="text-[10px]">
                          → {lead.profileName || lead.ownerName}
                          {lead.ownerEmail ? ` (${lead.ownerEmail})` : ""}
                        </Badge>
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" /> {lead.email}
                      </span>
                      {lead.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" /> {lead.phone}
                        </span>
                      )}
                      {lead.company && (
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3 w-3" /> {lead.company}
                        </span>
                      )}
                    </div>
                    {lead.message && (
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                        &ldquo;{lead.message}&rdquo;
                      </p>
                    )}
                    <p className="mt-1 text-[11px] text-slate-400">
                      {formatDateTime(lead.createdAt)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <a href={`mailto:${lead.email}`}>
                        <Mail className="h-4 w-4" />
                      </a>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => remove(lead.id)}
                      className="text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
