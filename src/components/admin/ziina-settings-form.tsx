"use client";

import { useEffect, useState } from "react";
import { CreditCard, KeyRound, ShieldCheck, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ZiinaConfig {
  configured: boolean;
  tokenSet: boolean;
  tokenLast4: string | null;
  tokenSource: "env" | "database" | null;
  secretSet: boolean;
  secretSource: "env" | "database" | null;
  testMode: boolean;
  testModeSource: "env" | "database" | "default";
  webhookPath: string;
}

function SourceBadge({ source }: { source: string | null | undefined }) {
  if (source === "env") return <Badge variant="secondary">env var</Badge>;
  if (source === "database") return <Badge>saved</Badge>;
  return <Badge variant="warning">not set</Badge>;
}

export function ZiinaSettingsForm() {
  const [config, setConfig] = useState<ZiinaConfig | null>(null);
  const [token, setToken] = useState("");
  const [secret, setSecret] = useState("");
  const [testMode, setTestMode] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin?resource=ziina")
      .then((response) => (response.ok ? response.json() : null))
      .then((data: ZiinaConfig | null) => {
        if (data) {
          setConfig(data);
          setTestMode(data.testMode);
        }
      })
      .catch(() => setError("Unable to load Ziina settings"));
  }, []);

  async function submit(action: "save-ziina" | "clear-ziina") {
    const clearing = action === "clear-ziina";
    if (clearing) setClearing(true);
    else setSaving(true);
    setMessage("");
    setError("");
    try {
      const response = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          clearing
            ? { action }
            : {
                action,
                ziinaApiToken: token || undefined,
                ziinaWebhookSecret: secret || undefined,
                ziinaTestMode: testMode,
              }
        ),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Request failed");
      setConfig(data.ziina);
      setTestMode(data.ziina.testMode);
      setToken("");
      setSecret("");
      setMessage(
        clearing
          ? "Saved Ziina credentials removed."
          : "Ziina settings saved. Secret values will not be shown again."
      );
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "Request failed"
      );
    } finally {
      if (clearing) setClearing(false);
      else setSaving(false);
    }
  }

  const hasDatabaseValues =
    config?.tokenSource === "database" || config?.secretSource === "database";
  const hasEnvironmentValues =
    config?.tokenSource === "env" || config?.secretSource === "env";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-brand-600" />
          Ziina Payments (AED)
        </CardTitle>
        <CardDescription>
          Connect Ziina for subscription and card-order payments. Environment
          variables always take precedence over values saved here.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {message && (
          <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:bg-emerald-950/30">
            {message}
          </div>
        )}
        {error && (
          <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/30">
            {error}
          </div>
        )}

        <div className="space-y-2 rounded-xl bg-slate-50 p-4 text-sm dark:bg-slate-800/50">
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Gateway</span>
            {config?.configured ? (
              <Badge variant="success" className="gap-1">
                <ShieldCheck className="h-3 w-3" /> Active
                {config.testMode ? " (test mode)" : " (live)"}
              </Badge>
            ) : (
              <Badge variant="warning">Simulated mode</Badge>
            )}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">API token</span>
            <span className="flex items-center gap-2">
              {config?.tokenLast4 && (
                <span className="font-mono text-xs">••••{config.tokenLast4}</span>
              )}
              <SourceBadge source={config?.tokenSource} />
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Webhook secret</span>
            <SourceBadge source={config?.secretSource} />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-slate-500">Webhook URL to register</span>
            <code className="text-xs">
              https://YOUR-DOMAIN{config?.webhookPath || "/api/billing/webhook"}
            </code>
          </div>
        </div>

        {hasEnvironmentValues && (
          <p className="text-xs text-amber-600 dark:text-amber-400">
            Some values are controlled by environment variables. Remove those
            variables to manage the corresponding values here.
          </p>
        )}

        <div className="grid gap-4">
          <Input
            label="Ziina API token"
            type="password"
            autoComplete="off"
            value={token}
            onChange={(event) => setToken(event.target.value)}
            placeholder={
              config?.tokenSet
                ? "Saved — enter a new value to replace"
                : "Paste token from dashboard.ziina.com"
            }
          />
          <Input
            label="Webhook secret (code)"
            type="password"
            autoComplete="off"
            value={secret}
            onChange={(event) => setSecret(event.target.value)}
            placeholder={
              config?.secretSet
                ? "Saved — enter a new value to replace"
                : "For example: openssl rand -hex 32"
            }
          />
          <label className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 px-4 py-3 dark:border-slate-800">
            <span>
              <span className="flex items-center gap-2 text-sm font-medium">
                <KeyRound className="h-4 w-4 text-slate-400" /> Test mode
              </span>
              <span className="mt-0.5 block text-xs text-slate-500">
                On means no real charges. Turn off only when going live.
                {config?.testModeSource === "env" &&
                  " This setting is locked by ZIINA_TEST_MODE."}
              </span>
            </span>
            <Switch
              checked={testMode}
              onCheckedChange={setTestMode}
              disabled={config?.testModeSource === "env"}
            />
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={() => submit("save-ziina")} loading={saving}>
            Save Ziina settings
          </Button>
          {hasDatabaseValues && (
            <Button
              variant="outline"
              onClick={() => submit("clear-ziina")}
              loading={clearing}
              className="gap-1 text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" /> Remove saved credentials
            </Button>
          )}
        </div>

        <p className="text-xs text-slate-400">
          Blank fields retain their current values. Credentials are stored
          server-side and are never returned to the browser; only the token’s
          last four characters are shown. See ZIINA_SETUP.md.
        </p>
      </CardContent>
    </Card>
  );
}
