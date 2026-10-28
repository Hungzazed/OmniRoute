"use client";

import { useState, useEffect, useCallback } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Alert } from "@omniroute/ui-kit/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@omniroute/ui-kit/table";
import { DataTableShell } from "@omniroute/ui-kit/data-table-shell";
import { PageHeader } from "@omniroute/ui-kit/page-header";
import Badge from "@/shared/components/Badge";
import Button from "@/shared/components/Button";
import Card from "@/shared/components/Card";
import EmptyState from "@/shared/components/EmptyState";
import Input from "@/shared/components/Input";
import Icon from "@/shared/components/Icon";
import { cn } from "@/shared/utils/cn";
import CodeSnippetBox from "../api-manager/components/CodeSnippetBox";

interface TokenLedgerEntry {
  id: number;
  fromApiKeyId: string;
  toApiKeyId: string;
  amount: number;
  reason: string | null;
  idempotencyKey: string | null;
  createdAt: string;
}

interface InviteItem {
  id: string;
  code: string;
  serverUrl: string | null;
  maxUses: number;
  useCount: number;
  expiresAt: string | null;
  revokedAt: string | null;
  createdAt: string;
}

interface ServerConnection {
  id: string;
  name: string;
  url: string;
  status: string;
  lastSyncAt: string | null;
  errorMessage: string | null;
}

export default function TokensPage() {
  const t = useTranslations("common");
  const locale = useLocale();

  // Balance & History
  const [balance, setBalance] = useState(0);
  const [history, setHistory] = useState<TokenLedgerEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  // Transfer form
  const [toApiKeyId, setToApiKeyId] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferMsg, setTransferMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Invites
  const [invites, setInvites] = useState<InviteItem[]>([]);
  const [inviteMaxUses, setInviteMaxUses] = useState("1");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [newInviteCode, setNewInviteCode] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState("");
  const [copiedInviteId, setCopiedInviteId] = useState<string | null>(null);

  // Redeem
  const [redeemCode, setRedeemCode] = useState("");
  const [redeemLoading, setRedeemLoading] = useState(false);
  const [redeemMsg, setRedeemMsg] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );

  // Servers
  const [servers, setServers] = useState<ServerConnection[]>([]);
  const [serverName, setServerName] = useState("");
  const [serverUrl, setServerUrl] = useState("");
  const [serverApiKey, setServerApiKey] = useState("");
  const [serverLoading, setServerLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  // Base URL & Snippet toggle
  const [showCurlSnippet, setShowCurlSnippet] = useState(false);
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "http://localhost:20128";

  const fetchData = useCallback(async () => {
    try {
      const [transferRes, inviteRes, serverRes] = await Promise.all([
        fetch("/api/gamification/transfer"),
        fetch("/api/gamification/invite"),
        fetch("/api/gamification/servers"),
      ]);

      if (transferRes.ok) {
        const data = await transferRes.json();
        setBalance(data.balance ?? 0);
        setHistory(data.history ?? []);
      }
      if (inviteRes.ok) {
        const data = await inviteRes.json();
        setInvites(data.invites ?? []);
      }
      if (serverRes.ok) {
        const data = await serverRes.json();
        setServers(data.servers ?? []);
      }
    } catch {
      // silent fail
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    const loadTimer = window.setTimeout(() => {
      void fetchData();
    }, 0);

    return () => window.clearTimeout(loadTimer);
  }, [fetchData]);

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setTransferLoading(true);
    setTransferMsg(null);

    try {
      const res = await fetch("/api/gamification/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromApiKeyId: "current", // backend resolves from auth
          toApiKeyId,
          amount: Number(amount),
          reason: reason || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setTransferMsg({
          type: "success",
          text: t("tokensTransferSuccess", { idempotencyKey: data.idempotencyKey }),
        });
        setToApiKeyId("");
        setAmount("");
        setReason("");
        await fetchData();
      } else {
        setTransferMsg({ type: "error", text: data.error || t("tokensTransferFailed") });
      }
    } catch (err) {
      setTransferMsg({
        type: "error",
        text: err instanceof Error ? err.message : t("tokensTransferFailed"),
      });
    } finally {
      setTransferLoading(false);
    }
  };

  const handleCreateInvite = async () => {
    setInviteLoading(true);
    setNewInviteCode(null);
    setInviteError("");

    try {
      const res = await fetch("/api/gamification/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKeyId: "current",
          maxUses: Number(inviteMaxUses) || 1,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setNewInviteCode(data.code);
        await fetchData();
      } else {
        setInviteError(data.error || t("tokensCreateInviteFailed"));
      }
    } catch (error) {
      setInviteError(error instanceof Error ? error.message : t("tokensCreateInviteFailed"));
    } finally {
      setInviteLoading(false);
    }
  };

  const handleRevokeInvite = async (inviteId: string) => {
    setInviteError("");
    try {
      const response = await fetch(`/api/gamification/invite?id=${inviteId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error(t("tokensRevokeInviteFailed"));
      await fetchData();
    } catch (error) {
      setInviteError(error instanceof Error ? error.message : t("tokensRevokeInviteFailed"));
    }
  };

  const handleCopyInviteCode = async (invite: InviteItem) => {
    try {
      await navigator.clipboard.writeText(invite.code);
      setCopiedInviteId(invite.id);
      setTimeout(() => setCopiedInviteId(null), 1800);
    } catch {
      // ignore
    }
  };

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    setRedeemLoading(true);
    setRedeemMsg(null);

    try {
      const res = await fetch("/api/gamification/invite/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: redeemCode, apiKeyId: "current" }),
      });
      const data = await res.json();
      if (res.ok) {
        setRedeemMsg({
          type: "success",
          text: t("tokensRedeemSuccess", {
            server: data.serverUrl || t("connected"),
          }),
        });
        setRedeemCode("");
        await fetchData();
      } else {
        setRedeemMsg({ type: "error", text: data.error || t("tokensRedeemFailed") });
      }
    } catch (err) {
      setRedeemMsg({
        type: "error",
        text: err instanceof Error ? err.message : t("tokensRedeemFailed"),
      });
    } finally {
      setRedeemLoading(false);
    }
  };

  const handleConnectServer = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerLoading(true);
    setServerError("");

    try {
      const res = await fetch("/api/gamification/servers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: serverName, url: serverUrl, apiKey: serverApiKey }),
      });
      if (res.ok) {
        setServerName("");
        setServerUrl("");
        setServerApiKey("");
        await fetchData();
      } else {
        const data = await res.json().catch(() => null);
        setServerError(data?.error || t("tokensConnectServerFailed"));
      }
    } catch (error) {
      setServerError(error instanceof Error ? error.message : t("tokensConnectServerFailed"));
    } finally {
      setServerLoading(false);
    }
  };

  const handleDisconnectServer = async (serverId: string) => {
    setServerError("");
    try {
      const response = await fetch(`/api/gamification/servers?id=${serverId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error(t("tokensDisconnectServerFailed"));
      await fetchData();
    } catch (error) {
      setServerError(error instanceof Error ? error.message : t("tokensDisconnectServerFailed"));
    }
  };

  const statusMessage = (
    message: { type: "success" | "error"; text: string } | null,
    onDismiss: () => void
  ) =>
    message ? (
      <Alert
        variant={message.type === "success" ? "success" : "critical"}
        dismissLabel={t("close")}
        onDismiss={onDismiss}
      >
        {message.text}
      </Alert>
    ) : null;

  const errorMessage = (text: string, onDismiss: () => void) =>
    text ? (
      <Alert variant="critical" dismissLabel={t("close")} onDismiss={onDismiss}>
        {text}
      </Alert>
    ) : null;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader compact title={t("tokensPageTitle")} description={t("tokensPageDescription")} />

      {/* Balance Card — Apple Minimalist Stat Card */}
      <Card className="border-border/40 bg-surface shadow-none">
        <div className="flex items-center justify-between p-1">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              {t("tokensTokenBalance")}
            </p>
            <p className="text-3xl font-semibold tracking-tight text-text-main tabular-nums">
              {balance.toLocaleString(locale)}
            </p>
          </div>
          <div className="size-11 rounded-xl bg-surface-muted border border-border/40 flex items-center justify-center text-text-muted">
            <Icon name="toll" size={22} className="text-[#007AFF]" />
          </div>
        </div>
      </Card>

      {/* Transfer Form Card */}
      <Card
        title={t("tokensSendTokens")}
        icon="send"
        className="border-border/40 bg-surface shadow-none"
      >
        <form onSubmit={handleTransfer} className="grid gap-4">
          <Input
            label={t("tokensRecipientApiKeyId")}
            type="text"
            value={toApiKeyId}
            onChange={(e) => setToApiKeyId(e.target.value)}
            placeholder={t("tokensRecipientApiKeyIdPlaceholder")}
            required
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label={t("tokensAmount")}
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              min="1"
              required
            />
            <Input
              label={t("tokensReasonOptional")}
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t("tokensReasonPlaceholder")}
            />
          </div>
          {statusMessage(transferMsg, () => setTransferMsg(null))}
          <Button
            type="submit"
            variant="primary"
            disabled={transferLoading || !toApiKeyId || !amount}
            className="justify-self-start bg-[#007AFF] text-white hover:bg-[#0071E3] rounded-lg font-medium shadow-none transition-colors border-0"
          >
            {transferLoading ? t("tokensSending") : t("tokensSendTokens")}
          </Button>
        </form>
      </Card>

      {/* Transaction History Card */}
      <Card
        title={t("tokensTransactionHistory")}
        icon="history"
        className="border-border/40 bg-surface shadow-none"
      >
        <DataTableShell loading={historyLoading} loadingLabel={t("loading")}>
          {!historyLoading && history.length === 0 ? (
            <EmptyState icon="history" title={t("tokensNoTransactionsYet")} />
          ) : (
            <Table scrollbarLabel={t("tokensTransactionHistory")}>
              <TableHeader>
                <TableRow className="border-b border-border/40 bg-surface-muted/30">
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                    {t("type")}
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                    {t("tokensFrom")}
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                    {t("tokensTo")}
                  </TableHead>
                  <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-text-muted">
                    {t("tokensAmount")}
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                    {t("tokensReason")}
                  </TableHead>
                  <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-text-muted">
                    {t("tokensDate")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((entry) => {
                  const isSent = entry.fromApiKeyId !== "current";
                  return (
                    <TableRow
                      key={entry.id}
                      className="hover:bg-surface-muted/40 transition-colors"
                    >
                      <TableCell>
                        <Badge
                          variant={isSent ? "error" : "success"}
                          size="sm"
                          className={cn(
                            "rounded-full text-[11px] font-medium px-2 py-0.5 border",
                            isSent
                              ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                              : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                          )}
                        >
                          {isSent ? t("tokensSent") : t("tokensReceived")}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-48">
                        <span className="font-mono text-xs text-text-secondary dark:text-zinc-200 bg-surface-muted/60 dark:bg-zinc-800/60 px-2 py-0.5 rounded-md border border-border/30 inline-block">
                          {entry.fromApiKeyId.slice(0, 8)}...
                        </span>
                      </TableCell>
                      <TableCell className="max-w-48">
                        <span className="font-mono text-xs text-text-secondary dark:text-zinc-200 bg-surface-muted/60 dark:bg-zinc-800/60 px-2 py-0.5 rounded-md border border-border/30 inline-block">
                          {entry.toApiKeyId.slice(0, 8)}...
                        </span>
                      </TableCell>
                      <TableCell
                        className={cn(
                          "text-right font-mono text-xs font-semibold tabular-nums",
                          isSent
                            ? "text-rose-600 dark:text-rose-400"
                            : "text-emerald-600 dark:text-emerald-400"
                        )}
                      >
                        {isSent ? "-" : "+"}
                        {entry.amount.toLocaleString(locale)}
                      </TableCell>
                      <TableCell className="text-xs text-text-muted max-w-xs truncate">
                        {entry.reason || "—"}
                      </TableCell>
                      <TableCell className="text-right text-xs text-text-muted tabular-nums whitespace-nowrap">
                        {new Date(entry.createdAt).toLocaleDateString(locale, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </DataTableShell>
      </Card>

      {/* Invite Panel Card */}
      <Card
        title={t("tokensInviteCodes")}
        icon="mail"
        className="border-border/40 bg-surface shadow-none"
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-end gap-3">
            <Input
              label={t("tokensMaxUses")}
              type="number"
              value={inviteMaxUses}
              onChange={(e) => setInviteMaxUses(e.target.value)}
              min="1"
              className="flex-1"
            />
            <Button
              variant="primary"
              onClick={handleCreateInvite}
              disabled={inviteLoading}
              className="bg-[#007AFF] text-white hover:bg-[#0071E3] rounded-lg font-medium shadow-none transition-colors border-0"
            >
              {inviteLoading ? t("tokensCreatingInvite") : t("tokensCreateInvite")}
            </Button>
          </div>

          {newInviteCode && (
            <div className="flex flex-col gap-1.5 p-3.5 rounded-xl border border-border/50 bg-surface-muted/60">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <Icon name="check_circle" size={14} />
                  {t("tokensInviteCreated")}
                </span>
                <button
                  type="button"
                  onClick={() => setNewInviteCode(null)}
                  className="text-text-muted hover:text-text-main text-xs"
                >
                  {t("close")}
                </button>
              </div>
              <CodeSnippetBox
                code={newInviteCode}
                title="Invite Code"
                language="Invite Code"
                copyLabel={t("copy")}
                copiedLabel={t("copied")}
              />
            </div>
          )}

          {errorMessage(inviteError, () => setInviteError(""))}

          {/* Redeem Form */}
          <form
            onSubmit={handleRedeem}
            className="flex items-end gap-3 border-t border-border/40 pt-4"
          >
            <Input
              label={t("tokensRedeemCode")}
              type="text"
              value={redeemCode}
              onChange={(e) => setRedeemCode(e.target.value)}
              placeholder={t("tokensRedeemCodePlaceholder")}
              required
              className="flex-1"
            />
            <Button
              type="submit"
              variant="secondary"
              disabled={redeemLoading || !redeemCode}
              className="rounded-lg"
            >
              {redeemLoading ? t("tokensRedeeming") : t("tokensRedeem")}
            </Button>
          </form>

          {statusMessage(redeemMsg, () => setRedeemMsg(null))}

          {/* Active Invites List */}
          {invites.length > 0 && (
            <div className="border-t border-border/40 pt-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3">
                {t("tokensYourActiveInvites")}
              </p>
              <div className="space-y-2">
                {invites.map((inv) => (
                  <div
                    key={inv.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-surface-muted/40 border border-border/40 hover:bg-surface-muted/70 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono text-xs font-semibold text-text-main bg-surface px-2.5 py-1 rounded-md border border-border/40">
                        {inv.code}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyInviteCode(inv)}
                        className="p-1 rounded text-text-muted hover:text-text-main transition-colors"
                        title={t("copy")}
                        aria-label={t("copy")}
                      >
                        <Icon
                          name={copiedInviteId === inv.id ? "check" : "content_copy"}
                          size={13}
                          className={copiedInviteId === inv.id ? "text-emerald-500" : ""}
                        />
                      </button>
                      <span className="text-xs text-text-muted tabular-nums ml-2">
                        {t("tokensInviteUses", { used: inv.useCount, max: inv.maxUses })}
                      </span>
                      {inv.revokedAt && (
                        <Badge
                          variant="error"
                          size="sm"
                          className="rounded-full text-[10px] px-2 py-0.5 ml-2"
                        >
                          {t("tokensRevoked")}
                        </Badge>
                      )}
                    </div>
                    {!inv.revokedAt && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 rounded-lg text-xs"
                        onClick={() => handleRevokeInvite(inv.id)}
                      >
                        {t("tokensRevoke")}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Server Panel Card */}
      <Card
        title={t("tokensCommunityServers")}
        icon="dns"
        className="border-border/40 bg-surface shadow-none"
      >
        <div className="flex flex-col gap-4">
          <form onSubmit={handleConnectServer} className="grid gap-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Input
                type="text"
                value={serverName}
                onChange={(e) => setServerName(e.target.value)}
                placeholder={t("tokensServerNamePlaceholder")}
                aria-label={t("tokensServerNamePlaceholder")}
                required
              />
              <Input
                type="url"
                value={serverUrl}
                onChange={(e) => setServerUrl(e.target.value)}
                placeholder="https://server.example.com"
                aria-label={t("tokensServerUrlLabel")}
                required
              />
              <Input
                type="password"
                value={serverApiKey}
                onChange={(e) => setServerApiKey(e.target.value)}
                placeholder={t("tokensApiKeyPlaceholder")}
                aria-label={t("tokensApiKeyPlaceholder")}
                required
              />
            </div>
            <Button
              type="submit"
              variant="primary"
              disabled={serverLoading || !serverName || !serverUrl || !serverApiKey}
              className="justify-self-start bg-[#007AFF] text-white hover:bg-[#0071E3] rounded-lg font-medium shadow-none transition-colors border-0"
            >
              {serverLoading ? t("tokensConnecting") : t("tokensConnectServer")}
            </Button>
          </form>

          {errorMessage(serverError, () => setServerError(""))}

          {servers.length === 0 ? (
            <EmptyState icon="dns" title={t("tokensNoServersConnected")} />
          ) : (
            <div className="space-y-2">
              {servers.map((server) => (
                <div
                  key={server.id}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-surface-muted/40 border border-border/40 hover:bg-surface-muted/70 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "size-2 rounded-full shrink-0",
                          server.status === "connected"
                            ? "bg-emerald-500"
                            : server.status === "error"
                              ? "bg-rose-500"
                              : "bg-neutral-400"
                        )}
                      />
                      <p className="font-semibold text-sm truncate text-text-main">{server.name}</p>
                      <Badge
                        size="sm"
                        variant={
                          server.status === "connected"
                            ? "success"
                            : server.status === "error"
                              ? "error"
                              : "default"
                        }
                        className="rounded-full text-[10px] font-medium px-2 py-0.5"
                      >
                        {t.has(`tokensServerStatus.${server.status}`)
                          ? t(`tokensServerStatus.${server.status}`)
                          : server.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-text-muted mt-0.5 truncate font-mono">
                      {server.url}
                    </p>
                    {server.errorMessage && (
                      <p className="text-xs text-rose-500 mt-0.5">{server.errorMessage}</p>
                    )}
                    {server.lastSyncAt && (
                      <p className="text-[11px] text-text-muted mt-0.5 tabular-nums">
                        {t("tokensLastSync", {
                          date: new Date(server.lastSyncAt).toLocaleString(locale),
                        })}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 rounded-lg text-xs ml-4"
                    onClick={() => handleDisconnectServer(server.id)}
                  >
                    {t("tokensDisconnect")}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Developer API / cURL Snippet Card */}
      <Card padding="sm" className="border-border/40 bg-surface shadow-none">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon name="code" size={16} className="text-text-muted" />
              <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                Token API Integration
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowCurlSnippet(!showCurlSnippet)}
              className="text-xs text-text-muted hover:text-text-main flex items-center gap-1 font-medium transition-colors"
            >
              <span>{showCurlSnippet ? t("close") : "Show API Snippet"}</span>
              <Icon name={showCurlSnippet ? "expand_less" : "expand_more"} size={16} />
            </button>
          </div>
          {showCurlSnippet && (
            <CodeSnippetBox
              title="cURL Token Transfer Example"
              language="cURL"
              copyLabel={t("copy")}
              copiedLabel={t("copied")}
              code={`curl -X POST ${baseUrl}/api/gamification/transfer \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "toApiKeyId": "target_api_key_id",
    "amount": 100,
    "reason": "Developer quota allocation"
  }'`}
            />
          )}
        </div>
      </Card>
    </div>
  );
}
