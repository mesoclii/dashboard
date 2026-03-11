"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { buildDashboardHref } from "@/lib/dashboardContext";
import {
  fetchGuildData,
  fetchRuntimeEngine,
  resolveGuildContext,
  runRuntimeEngineAction,
  saveRuntimeEngine,
  type GuildChannel,
  type GuildRole,
} from "@/lib/liveRuntime";

const ENGINE_KEYS = ["masterPanel", "tickets", "selfroles", "store", "music", "onboarding", "progression", "range", "pokemon"] as const;
type EngineKey = (typeof ENGINE_KEYS)[number];
type RuntimeMap = Record<EngineKey, any>;
type SummaryMap = Record<EngineKey, string>;

const shell: CSSProperties = { color: "#ffd0d0", padding: 18, maxWidth: 1540 };
const card: CSSProperties = { border: "1px solid #650000", borderRadius: 14, background: "rgba(120,0,0,0.10)", padding: 16, marginTop: 14 };
const input: CSSProperties = { width: "100%", padding: 10, borderRadius: 10, border: "1px solid #7f0000", background: "#090909", color: "#ffe0e0" };
const action: CSSProperties = { ...input, width: "auto", cursor: "pointer", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em" };
const chip: CSSProperties = { borderRadius: 999, border: "1px solid #553030", background: "rgba(255,255,255,.03)", color: "#ffb3b3", padding: "6px 10px", cursor: "pointer", fontSize: 12 };
const grid: CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12 };

const DEFAULTS: RuntimeMap = {
  masterPanel: { enabled: true, deployChannelId: "", persistentMessageId: "", title: "Possum Bot Control Panel", description: "Select a panel to open." },
  tickets: {
    active: true,
    panelChannelId: "",
    panelTitle: "Support Tickets",
    panelDescription: "Choose a ticket type below.",
    openCategoryId: "",
    closedCategoryId: "",
    transcriptLogId: "",
    staffRoleIds: [],
    types: {
      support: { enabled: true, label: "Support", panelButtonLabel: "Support", panelButtonEmoji: "" },
      vip: { enabled: true, label: "VIP", panelButtonLabel: "VIP", panelButtonEmoji: "" },
      drops: { enabled: true, label: "Drops", panelButtonLabel: "Drops", panelButtonEmoji: "" },
    },
  },
  selfroles: { active: true, requireVerification: false, verificationRoleId: "", maxRolesPerUser: 10, antiAbuseCooldownSec: 3, logChannelId: "", panels: [] },
  store: { active: true, panel: { enabled: true, channelId: "", title: "Server Store", description: "Spend coins on roles, perks, and items.", buttonLabel: "Open Store", embedColor: "#ff3b3b", imageUrl: "" }, policies: { logChannelId: "", requireStaffApproval: false } },
  music: { enabled: true, panelDeploy: { enabled: false, channelId: "", messageId: "", title: "Possum Music Control", description: "Use /music to route direct audio streams and library aliases into the configured voice routes.", bannerUrl: "", showRouteSelector: true, footerText: "Music stays permanently free and excluded from paid plans." } },
  onboarding: { enabled: true, welcomeChannelId: "", rulesChannelId: "", idChannelId: "", ticketCategoryId: "", panelTitle: "Welcome to {{guildName}}", panelDescription: "Read the rules in <#{{rulesChannelId}}> and confirm below to continue.", panelFooter: "Complete onboarding to unlock the server.", idPanelTitle: "ID Verification - Final Gate", idPanelDescription: "<@{{userId}}> choose how you proceed.", idPanelContent: "Survivor <@{{userId}}>" },
  progression: { active: true, achievements: { enabled: true, announceChannelId: "" }, badges: { enabled: true, panelEnabled: false, panelChannelId: "", panelTitle: "Achievements & Badges", roleSyncEnabled: true } },
  range: { enabled: true, defaultWeapon: "rifle", presentation: { setupTitle: "Range Setup Panel", liveTitle: "Range Live Target", introText: "Configure the range, set the weapon, and press start when the shooters are ready.", footerText: "Use buttons to configure the range, then press Start.", setupImageUrl: "", liveImageUrl: "" } },
  pokemon: { enabled: false, guildAllowed: false, privateOnly: true, stage2Enabled: true, catchLogChannelId: "", battleEnabled: true, tradingEnabled: true },
};

const EMPTY_SUMMARIES: SummaryMap = { masterPanel: "", tickets: "", selfroles: "", store: "", music: "", onboarding: "", progression: "", range: "", pokemon: "" };
const linkedPanels = [
  { href: "/dashboard/truthdare", title: "Truth Or Dare", body: "Command-driven panel owned by the engine page." },
  { href: "/dashboard/pokemon-battle", title: "Pokemon Battle", body: "Battle uses the shared trainer runtime and keeps its own page." },
  { href: "/dashboard/pokemon-trade", title: "Pokemon Trade", body: "Trade uses the same trainer runtime and keeps its own page." },
];

function isTextLike(type: number | string | undefined) {
  return Number(type) === 0 || Number(type) === 5 || String(type || "").toLowerCase().includes("text");
}

function isCategory(type: number | string | undefined) {
  return Number(type) === 4 || String(type || "").toLowerCase().includes("category");
}

function summaryText(summary: Array<{ label?: string; value?: string }> | undefined) {
  return Array.isArray(summary) && summary.length
    ? summary.slice(0, 4).map((item) => `${String(item.label || "State")}: ${String(item.value || "-")}`).join(" | ")
    : "Live runtime connected.";
}

function toggleId(list: string[], id: string) {
  return list.includes(id) ? list.filter((value) => value !== id) : [...list, id];
}

function newPanel() {
  return { id: `panel_${Date.now()}`, enabled: true, channelId: "", messageTitle: "Pick Your Roles", messageBody: "Choose roles below.", mode: "buttons", maxSelectable: 1, allowRemove: true, options: [{ roleId: "", label: "New Role", emoji: "", description: "", style: "secondary" }] };
}

function newOption() {
  return { roleId: "", label: "New Role", emoji: "", description: "", style: "secondary" };
}

function mergeDefaults(engine: EngineKey, raw: any) {
  const base = structuredClone(DEFAULTS[engine]);
  if (!raw || typeof raw !== "object") return base;
  const merged = { ...base, ...raw };
  if (engine === "tickets") {
    merged.types = { ...base.types, ...(raw.types || {}) };
    merged.staffRoleIds = Array.isArray(raw.staffRoleIds) ? raw.staffRoleIds.map((value: unknown) => String(value || "")).filter(Boolean) : [];
  }
  if (engine === "selfroles") merged.panels = Array.isArray(raw.panels) ? raw.panels : [];
  if (engine === "store") {
    merged.panel = { ...base.panel, ...(raw.panel || {}) };
    merged.policies = { ...base.policies, ...(raw.policies || {}) };
  }
  if (engine === "music") merged.panelDeploy = { ...base.panelDeploy, ...(raw.panelDeploy || {}) };
  if (engine === "onboarding") return { ...base, ...raw };
  if (engine === "progression") {
    merged.achievements = { ...base.achievements, ...(raw.achievements || {}) };
    merged.badges = { ...base.badges, ...(raw.badges || {}) };
  }
  if (engine === "range") merged.presentation = { ...base.presentation, ...(raw.presentation || {}) };
  return merged;
}

function RoleChips({ roles, selected, onToggle }: { roles: GuildRole[]; selected: string[]; onToggle: (id: string) => void }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {roles.map((role) => (
        <button
          key={role.id}
          type="button"
          onClick={() => onToggle(role.id)}
          style={{
            ...chip,
            border: selected.includes(role.id) ? "1px solid #ff5555" : chip.border,
            background: selected.includes(role.id) ? "rgba(255,0,0,.24)" : chip.background,
            color: selected.includes(role.id) ? "#fff" : chip.color,
          }}
        >
          @{role.name}
        </button>
      ))}
    </div>
  );
}

export default function PanelHubClient() {
  const [guildId, setGuildId] = useState("");
  const [guildName, setGuildName] = useState("");
  const [channels, setChannels] = useState<GuildChannel[]>([]);
  const [roles, setRoles] = useState<GuildRole[]>([]);
  const [runtime, setRuntime] = useState<RuntimeMap>(structuredClone(DEFAULTS));
  const [summaries, setSummaries] = useState<SummaryMap>(EMPTY_SUMMARIES);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");

  const loadAll = useCallback(async (targetGuildId: string) => {
    if (!targetGuildId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setMessage("");
      const [guildData, ...payloads] = await Promise.all([
        fetchGuildData(targetGuildId),
        ...ENGINE_KEYS.map((engine) => fetchRuntimeEngine(targetGuildId, engine)),
      ]);
      const nextRuntime = structuredClone(DEFAULTS);
      const nextSummaries = { ...EMPTY_SUMMARIES };
      ENGINE_KEYS.forEach((engine, index) => {
        nextRuntime[engine] = mergeDefaults(engine, payloads[index]?.config);
        nextSummaries[engine] = summaryText(payloads[index]?.summary);
      });
      setRuntime(nextRuntime);
      setSummaries(nextSummaries);
      setChannels(Array.isArray(guildData.channels) ? guildData.channels : []);
      setRoles(Array.isArray(guildData.roles) ? guildData.roles : []);
      const nextGuildName = String(guildData.guild?.name || guildName || targetGuildId).trim();
      setGuildName(nextGuildName);
      if (typeof window !== "undefined" && nextGuildName) {
        localStorage.setItem("activeGuildName", nextGuildName);
      }
    } catch (error) {
      setMessage((error as Error).message || "Failed to load panel runtimes.");
    } finally {
      setLoading(false);
    }
  }, [guildName]);

  useEffect(() => {
    const resolved = resolveGuildContext();
    setGuildId(resolved.guildId);
    setGuildName(resolved.guildName);
  }, []);

  useEffect(() => {
    void loadAll(guildId);
  }, [guildId, loadAll]);

  const textChannels = useMemo(() => channels.filter((channel) => isTextLike(channel.type)), [channels]);
  const categoryChannels = useMemo(() => channels.filter((channel) => isCategory(channel.type)), [channels]);

  function patchEngine(engine: EngineKey, updater: (current: any) => any) {
    setRuntime((prev) => ({ ...prev, [engine]: updater(prev[engine]) }));
  }

  async function refreshEngine(engine: EngineKey) {
    const payload = await fetchRuntimeEngine(guildId, engine);
    setRuntime((prev) => ({ ...prev, [engine]: mergeDefaults(engine, payload?.config) }));
    setSummaries((prev) => ({ ...prev, [engine]: summaryText(payload?.summary) }));
  }

  async function saveEngine(engine: EngineKey, ok: string) {
    try {
      setBusy(`save:${engine}`);
      setMessage("");
      await saveRuntimeEngine(guildId, engine, runtime[engine] || {});
      await refreshEngine(engine);
      setMessage(ok);
    } catch (error) {
      setMessage((error as Error).message || "Save failed.");
    } finally {
      setBusy("");
    }
  }

  async function runAction(engine: EngineKey | "panelDeploy", actionName: string, ok: string, refresh: EngineKey | EngineKey[] | "all") {
    try {
      setBusy(`action:${engine}:${actionName}`);
      setMessage("");
      const json = await runRuntimeEngineAction(guildId, engine, actionName);
      if (refresh === "all") {
        await loadAll(guildId);
      } else if (Array.isArray(refresh)) {
        await Promise.all(refresh.map((item) => refreshEngine(item)));
      } else {
        await refreshEngine(refresh);
      }
      const output = Array.isArray(json?.result?.output) ? json.result.output.join(" | ") : "";
      setMessage(output ? `${ok} ${output}` : ok);
    } catch (error) {
      setMessage((error as Error).message || "Action failed.");
    } finally {
      setBusy("");
    }
  }

  if (!guildId && !loading) {
    return <div style={{ ...shell, color: "#ff8080" }}>Missing guildId. Open from /guilds first.</div>;
  }

  return (
    <div style={shell}>
      <h1 style={{ margin: 0, color: "#ff4444", letterSpacing: "0.12em", textTransform: "uppercase" }}>Master Panels</h1>
      <div style={{ color: "#ff9999", marginTop: 6 }}>Guild: {guildName || guildId}</div>
      <div style={{ color: "#ffb0b0", fontSize: 12, marginTop: 4, maxWidth: 1180, lineHeight: 1.6 }}>
        This page now edits the live panel-backed engines directly. It is no longer just a jump page.
      </div>
      {message ? <div style={{ color: "#ffd27a", marginTop: 10 }}>{message}</div> : null}
      {loading ? <section style={card}>Loading live panel runtimes...</section> : null}

      {!loading ? (
        <>
          <section style={card}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
              <div>
                <div style={{ color: "#ff6767", fontSize: 13, fontWeight: 900, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8 }}>Deploy Actions</div>
                <div style={{ color: "#ffd3d3", lineHeight: 1.7, maxWidth: 980 }}>Save config first, then deploy the exact panel surface you want to refresh.</div>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button type="button" disabled={Boolean(busy)} style={action} onClick={() => void runAction("masterPanel", "deploy", "Master panel deployed.", "masterPanel")}>Deploy Master Panel</button>
                <button type="button" disabled={Boolean(busy)} style={action} onClick={() => void runAction("panelDeploy", "deployAll", "Ticket + selfrole bundle deployed.", ["tickets", "selfroles"])}>Deploy Shared Bundle</button>
                <button type="button" disabled={Boolean(busy)} style={action} onClick={() => void runAction("tickets", "deployPanel", "Tickets panel deployed.", "tickets")}>Deploy Tickets</button>
                <button type="button" disabled={Boolean(busy)} style={action} onClick={() => void runAction("selfroles", "deployPanels", "Selfrole panels deployed.", "selfroles")}>Deploy Selfroles</button>
                <button type="button" disabled={Boolean(busy)} style={action} onClick={() => void runAction("music", "deployPanel", "Music panel deployed.", "music")}>Deploy Music</button>
              </div>
            </div>
          </section>

          <section style={card}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
              <div>
                <div style={{ color: "#ff6767", fontSize: 13, fontWeight: 900, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8 }}>Master Panel</div>
                <div style={{ color: "#ffb3b3", fontSize: 12 }}>{summaries.masterPanel}</div>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button type="button" disabled={Boolean(busy)} style={action} onClick={() => void saveEngine("masterPanel", "Saved master panel runtime.")}>Save Master Panel</button>
                <Link href={buildDashboardHref("/dashboard/system-health")} style={{ ...action, textDecoration: "none" }}>System Health</Link>
              </div>
            </div>
            <div style={{ ...grid, marginTop: 12 }}>
              <label><input type="checkbox" checked={Boolean(runtime.masterPanel.enabled)} onChange={(event) => patchEngine("masterPanel", (current) => ({ ...current, enabled: event.target.checked }))} /> Enabled</label>
              <div>
                <div style={{ marginBottom: 6 }}>Deploy Channel</div>
                <select style={input} value={String(runtime.masterPanel.deployChannelId || "")} onChange={(event) => patchEngine("masterPanel", (current) => ({ ...current, deployChannelId: event.target.value }))}>
                  <option value="">Select channel</option>
                  {textChannels.map((channel) => <option key={channel.id} value={channel.id}>#{channel.name}</option>)}
                </select>
              </div>
              <div>
                <div style={{ marginBottom: 6 }}>Persistent Message ID</div>
                <input style={input} value={String(runtime.masterPanel.persistentMessageId || "")} onChange={(event) => patchEngine("masterPanel", (current) => ({ ...current, persistentMessageId: event.target.value }))} />
              </div>
              <div>
                <div style={{ marginBottom: 6 }}>Title</div>
                <input style={input} value={String(runtime.masterPanel.title || "")} onChange={(event) => patchEngine("masterPanel", (current) => ({ ...current, title: event.target.value }))} />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <div style={{ marginBottom: 6 }}>Description</div>
                <textarea style={{ ...input, minHeight: 90 }} value={String(runtime.masterPanel.description || "")} onChange={(event) => patchEngine("masterPanel", (current) => ({ ...current, description: event.target.value }))} />
              </div>
            </div>
          </section>

          <section style={card}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
              <div>
                <div style={{ color: "#ff6767", fontSize: 13, fontWeight: 900, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8 }}>Tickets Panel</div>
                <div style={{ color: "#ffb3b3", fontSize: 12 }}>{summaries.tickets}</div>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button type="button" disabled={Boolean(busy)} style={action} onClick={() => void saveEngine("tickets", "Saved tickets panel runtime.")}>Save Tickets</button>
                <button type="button" disabled={Boolean(busy)} style={action} onClick={() => void runAction("tickets", "deployPanel", "Tickets panel deployed.", "tickets")}>Deploy Tickets</button>
                <Link href={buildDashboardHref("/dashboard/tickets")} style={{ ...action, textDecoration: "none" }}>Open Tickets</Link>
              </div>
            </div>
            <div style={{ ...grid, marginTop: 12 }}>
              <label><input type="checkbox" checked={Boolean(runtime.tickets.active)} onChange={(event) => patchEngine("tickets", (current) => ({ ...current, active: event.target.checked }))} /> Active</label>
              <div>
                <div style={{ marginBottom: 6 }}>Panel Channel</div>
                <select style={input} value={String(runtime.tickets.panelChannelId || "")} onChange={(event) => patchEngine("tickets", (current) => ({ ...current, panelChannelId: event.target.value }))}>
                  <option value="">Select channel</option>
                  {textChannels.map((channel) => <option key={channel.id} value={channel.id}>#{channel.name}</option>)}
                </select>
              </div>
              <div>
                <div style={{ marginBottom: 6 }}>Open Category</div>
                <select style={input} value={String(runtime.tickets.openCategoryId || "")} onChange={(event) => patchEngine("tickets", (current) => ({ ...current, openCategoryId: event.target.value }))}>
                  <option value="">Select category</option>
                  {categoryChannels.map((channel) => <option key={channel.id} value={channel.id}>{channel.name}</option>)}
                </select>
              </div>
              <div>
                <div style={{ marginBottom: 6 }}>Closed Category</div>
                <select style={input} value={String(runtime.tickets.closedCategoryId || "")} onChange={(event) => patchEngine("tickets", (current) => ({ ...current, closedCategoryId: event.target.value }))}>
                  <option value="">Select category</option>
                  {categoryChannels.map((channel) => <option key={channel.id} value={channel.id}>{channel.name}</option>)}
                </select>
              </div>
              <div>
                <div style={{ marginBottom: 6 }}>Transcript Log</div>
                <select style={input} value={String(runtime.tickets.transcriptLogId || "")} onChange={(event) => patchEngine("tickets", (current) => ({ ...current, transcriptLogId: event.target.value }))}>
                  <option value="">Select channel</option>
                  {textChannels.map((channel) => <option key={channel.id} value={channel.id}>#{channel.name}</option>)}
                </select>
              </div>
              <div>
                <div style={{ marginBottom: 6 }}>Panel Title</div>
                <input style={input} value={String(runtime.tickets.panelTitle || "")} onChange={(event) => patchEngine("tickets", (current) => ({ ...current, panelTitle: event.target.value }))} />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <div style={{ marginBottom: 6 }}>Panel Description</div>
                <textarea style={{ ...input, minHeight: 90 }} value={String(runtime.tickets.panelDescription || "")} onChange={(event) => patchEngine("tickets", (current) => ({ ...current, panelDescription: event.target.value }))} />
              </div>
            </div>
            <div style={{ marginTop: 12 }}>
              <div style={{ color: "#ffb5b5", fontSize: 12, marginBottom: 6 }}>Staff Roles</div>
              <RoleChips roles={roles} selected={Array.isArray(runtime.tickets.staffRoleIds) ? runtime.tickets.staffRoleIds : []} onToggle={(id) => patchEngine("tickets", (current) => ({ ...current, staffRoleIds: toggleId(Array.isArray(current.staffRoleIds) ? current.staffRoleIds : [], id) }))} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 12, marginTop: 12 }}>
              {(["support", "vip", "drops"] as const).map((key) => (
                <div key={key} style={{ border: "1px solid #4f0000", borderRadius: 10, padding: 12, background: "#120000" }}>
                  <div style={{ color: "#ff5a5a", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em" }}>{String(runtime.tickets.types?.[key]?.label || key)}</div>
                  <div style={{ marginTop: 10 }}>
                    <label><input type="checkbox" checked={Boolean(runtime.tickets.types?.[key]?.enabled)} onChange={(event) => patchEngine("tickets", (current) => ({ ...current, types: { ...current.types, [key]: { ...current.types[key], enabled: event.target.checked } } }))} /> Enabled</label>
                  </div>
                  <div style={{ marginTop: 10 }}>
                    <div style={{ marginBottom: 6 }}>Button Label</div>
                    <input style={input} value={String(runtime.tickets.types?.[key]?.panelButtonLabel || "")} onChange={(event) => patchEngine("tickets", (current) => ({ ...current, types: { ...current.types, [key]: { ...current.types[key], panelButtonLabel: event.target.value } } }))} />
                  </div>
                  <div style={{ marginTop: 10 }}>
                    <div style={{ marginBottom: 6 }}>Button Emoji</div>
                    <input style={input} value={String(runtime.tickets.types?.[key]?.panelButtonEmoji || "")} onChange={(event) => patchEngine("tickets", (current) => ({ ...current, types: { ...current.types, [key]: { ...current.types[key], panelButtonEmoji: event.target.value } } }))} />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section style={card}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
              <div>
                <div style={{ color: "#ff6767", fontSize: 13, fontWeight: 900, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8 }}>Selfrole Panels</div>
                <div style={{ color: "#ffb3b3", fontSize: 12 }}>{summaries.selfroles}</div>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button type="button" disabled={Boolean(busy)} style={action} onClick={() => patchEngine("selfroles", (current) => ({ ...current, panels: [...(Array.isArray(current.panels) ? current.panels : []), newPanel()] }))}>Add Panel</button>
                <button type="button" disabled={Boolean(busy)} style={action} onClick={() => void saveEngine("selfroles", "Saved selfrole panel runtime.")}>Save Selfroles</button>
                <button type="button" disabled={Boolean(busy)} style={action} onClick={() => void runAction("selfroles", "deployPanels", "Selfrole panels deployed.", "selfroles")}>Deploy Selfroles</button>
                <Link href={buildDashboardHref("/dashboard/selfroles")} style={{ ...action, textDecoration: "none" }}>Open Selfroles</Link>
              </div>
            </div>
            <div style={{ ...grid, marginTop: 12 }}>
              <label><input type="checkbox" checked={Boolean(runtime.selfroles.active)} onChange={(event) => patchEngine("selfroles", (current) => ({ ...current, active: event.target.checked }))} /> Active</label>
              <label><input type="checkbox" checked={Boolean(runtime.selfroles.requireVerification)} onChange={(event) => patchEngine("selfroles", (current) => ({ ...current, requireVerification: event.target.checked }))} /> Require Verification</label>
              <div>
                <div style={{ marginBottom: 6 }}>Verification Role</div>
                <select style={input} value={String(runtime.selfroles.verificationRoleId || "")} onChange={(event) => patchEngine("selfroles", (current) => ({ ...current, verificationRoleId: event.target.value }))}>
                  <option value="">Select role</option>
                  {roles.map((role) => <option key={role.id} value={role.id}>@{role.name}</option>)}
                </select>
              </div>
              <div>
                <div style={{ marginBottom: 6 }}>Max Roles Per User</div>
                <input style={input} type="number" min={1} value={Number(runtime.selfroles.maxRolesPerUser || 1)} onChange={(event) => patchEngine("selfroles", (current) => ({ ...current, maxRolesPerUser: Number(event.target.value || 1) }))} />
              </div>
              <div>
                <div style={{ marginBottom: 6 }}>Cooldown (sec)</div>
                <input style={input} type="number" min={0} value={Number(runtime.selfroles.antiAbuseCooldownSec || 0)} onChange={(event) => patchEngine("selfroles", (current) => ({ ...current, antiAbuseCooldownSec: Number(event.target.value || 0) }))} />
              </div>
              <div>
                <div style={{ marginBottom: 6 }}>Log Channel</div>
                <select style={input} value={String(runtime.selfroles.logChannelId || "")} onChange={(event) => patchEngine("selfroles", (current) => ({ ...current, logChannelId: event.target.value }))}>
                  <option value="">Select channel</option>
                  {textChannels.map((channel) => <option key={channel.id} value={channel.id}>#{channel.name}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
              {(Array.isArray(runtime.selfroles.panels) ? runtime.selfroles.panels : []).map((panel: any, panelIndex: number) => (
                <div key={`${panel.id || panelIndex}_${panelIndex}`} style={{ border: "1px solid #4f0000", borderRadius: 10, padding: 12, background: "#120000" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center", marginBottom: 10 }}>
                    <div style={{ color: "#ff5a5a", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em" }}>{String(panel.messageTitle || `Panel ${panelIndex + 1}`)}</div>
                    <button type="button" style={action} disabled={Boolean(busy)} onClick={() => patchEngine("selfroles", (current) => ({ ...current, panels: current.panels.filter((_: unknown, index: number) => index !== panelIndex) }))}>Remove Panel</button>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 10 }}>
                    <input style={input} value={String(panel.id || "")} onChange={(event) => patchEngine("selfroles", (current) => ({ ...current, panels: current.panels.map((row: any, index: number) => index === panelIndex ? { ...row, id: event.target.value } : row) }))} />
                    <input style={input} value={String(panel.messageTitle || "")} onChange={(event) => patchEngine("selfroles", (current) => ({ ...current, panels: current.panels.map((row: any, index: number) => index === panelIndex ? { ...row, messageTitle: event.target.value } : row) }))} />
                    <select style={input} value={String(panel.channelId || "")} onChange={(event) => patchEngine("selfroles", (current) => ({ ...current, panels: current.panels.map((row: any, index: number) => index === panelIndex ? { ...row, channelId: event.target.value } : row) }))}>
                      <option value="">Select channel</option>
                      {textChannels.map((channel) => <option key={channel.id} value={channel.id}>#{channel.name}</option>)}
                    </select>
                    <select style={input} value={String(panel.mode || "buttons")} onChange={(event) => patchEngine("selfroles", (current) => ({ ...current, panels: current.panels.map((row: any, index: number) => index === panelIndex ? { ...row, mode: event.target.value } : row) }))}>
                      <option value="buttons">buttons</option>
                      <option value="select">select</option>
                    </select>
                    <input style={input} type="number" min={1} value={Number(panel.maxSelectable || 1)} onChange={(event) => patchEngine("selfroles", (current) => ({ ...current, panels: current.panels.map((row: any, index: number) => index === panelIndex ? { ...row, maxSelectable: Math.max(1, Number(event.target.value || 1)) } : row) }))} />
                  </div>
                  <div style={{ marginTop: 10 }}>
                    <textarea style={{ ...input, minHeight: 80 }} value={String(panel.messageBody || "")} onChange={(event) => patchEngine("selfroles", (current) => ({ ...current, panels: current.panels.map((row: any, index: number) => index === panelIndex ? { ...row, messageBody: event.target.value } : row) }))} />
                  </div>
                  <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginTop: 10 }}>
                    <label><input type="checkbox" checked={panel.enabled !== false} onChange={(event) => patchEngine("selfroles", (current) => ({ ...current, panels: current.panels.map((row: any, index: number) => index === panelIndex ? { ...row, enabled: event.target.checked } : row) }))} /> Panel Enabled</label>
                    <label><input type="checkbox" checked={panel.allowRemove !== false} onChange={(event) => patchEngine("selfroles", (current) => ({ ...current, panels: current.panels.map((row: any, index: number) => index === panelIndex ? { ...row, allowRemove: event.target.checked } : row) }))} /> Allow Remove</label>
                    <button type="button" style={action} disabled={Boolean(busy)} onClick={() => patchEngine("selfroles", (current) => ({ ...current, panels: current.panels.map((row: any, index: number) => index === panelIndex ? { ...row, options: [...(Array.isArray(row.options) ? row.options : []), newOption()] } : row) }))}>Add Role Option</button>
                  </div>
                  <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
                    {(Array.isArray(panel.options) ? panel.options : []).map((option: any, optionIndex: number) => (
                      <div key={`${panel.id || panelIndex}_${optionIndex}`} style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 120px 140px 1fr auto", gap: 8, alignItems: "center" }}>
                        <select style={input} value={String(option.roleId || "")} onChange={(event) => patchEngine("selfroles", (current) => ({ ...current, panels: current.panels.map((row: any, index: number) => index === panelIndex ? { ...row, options: row.options.map((entry: any, childIndex: number) => childIndex === optionIndex ? { ...entry, roleId: event.target.value } : entry) } : row) }))}>
                          <option value="">Select role</option>
                          {roles.map((role) => <option key={role.id} value={role.id}>@{role.name}</option>)}
                        </select>
                        <input style={input} value={String(option.label || "")} onChange={(event) => patchEngine("selfroles", (current) => ({ ...current, panels: current.panels.map((row: any, index: number) => index === panelIndex ? { ...row, options: row.options.map((entry: any, childIndex: number) => childIndex === optionIndex ? { ...entry, label: event.target.value } : entry) } : row) }))} />
                        <input style={input} value={String(option.emoji || "")} onChange={(event) => patchEngine("selfroles", (current) => ({ ...current, panels: current.panels.map((row: any, index: number) => index === panelIndex ? { ...row, options: row.options.map((entry: any, childIndex: number) => childIndex === optionIndex ? { ...entry, emoji: event.target.value } : entry) } : row) }))} />
                        <select style={input} value={String(option.style || "secondary")} onChange={(event) => patchEngine("selfroles", (current) => ({ ...current, panels: current.panels.map((row: any, index: number) => index === panelIndex ? { ...row, options: row.options.map((entry: any, childIndex: number) => childIndex === optionIndex ? { ...entry, style: event.target.value } : entry) } : row) }))}>
                          <option value="primary">primary</option>
                          <option value="secondary">secondary</option>
                          <option value="success">success</option>
                          <option value="danger">danger</option>
                        </select>
                        <input style={input} value={String(option.description || "")} onChange={(event) => patchEngine("selfroles", (current) => ({ ...current, panels: current.panels.map((row: any, index: number) => index === panelIndex ? { ...row, options: row.options.map((entry: any, childIndex: number) => childIndex === optionIndex ? { ...entry, description: event.target.value } : entry) } : row) }))} />
                        <button type="button" style={action} disabled={Boolean(busy)} onClick={() => patchEngine("selfroles", (current) => ({ ...current, panels: current.panels.map((row: any, index: number) => index === panelIndex ? { ...row, options: row.options.filter((_: unknown, childIndex: number) => childIndex !== optionIndex) } : row) }))}>X</button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {!(Array.isArray(runtime.selfroles.panels) && runtime.selfroles.panels.length) ? <div style={{ color: "#ffaaaa", fontSize: 12 }}>No selfrole panels configured yet. Use Add Panel to create the first live panel.</div> : null}
            </div>
          </section>

          <section style={card}>
            <div style={{ display: "grid", gap: 14 }}>
              <div>
                <div style={{ color: "#ff6767", fontSize: 13, fontWeight: 900, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8 }}>Store, Music, Onboarding, and Game Panels</div>
                <div style={{ color: "#ffb3b3", fontSize: 12 }}>These remain editable here with direct links to their full engine pages.</div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 12 }}>
                <div style={{ ...card, marginTop: 0, background: "#110000" }}>
                  <div style={{ color: "#ff5a5a", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em" }}>Store Panel</div>
                  <div style={{ color: "#ffb3b3", fontSize: 12, marginTop: 6 }}>{summaries.store}</div>
                  <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
                    <label><input type="checkbox" checked={Boolean(runtime.store.active)} onChange={(event) => patchEngine("store", (current) => ({ ...current, active: event.target.checked }))} /> Store Active</label>
                    <label><input type="checkbox" checked={Boolean(runtime.store.panel?.enabled)} onChange={(event) => patchEngine("store", (current) => ({ ...current, panel: { ...current.panel, enabled: event.target.checked } }))} /> Panel Enabled</label>
                    <input style={input} value={String(runtime.store.panel?.title || "")} onChange={(event) => patchEngine("store", (current) => ({ ...current, panel: { ...current.panel, title: event.target.value } }))} />
                    <textarea style={{ ...input, minHeight: 72 }} value={String(runtime.store.panel?.description || "")} onChange={(event) => patchEngine("store", (current) => ({ ...current, panel: { ...current.panel, description: event.target.value } }))} />
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <button type="button" disabled={Boolean(busy)} style={action} onClick={() => void saveEngine("store", "Saved store panel runtime.")}>Save Store</button>
                      <Link href={buildDashboardHref("/dashboard/economy/store")} style={{ ...action, textDecoration: "none" }}>Open Store</Link>
                    </div>
                  </div>
                </div>

                <div style={{ ...card, marginTop: 0, background: "#110000" }}>
                  <div style={{ color: "#ff5a5a", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em" }}>Music Panel</div>
                  <div style={{ color: "#ffb3b3", fontSize: 12, marginTop: 6 }}>{summaries.music}</div>
                  <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
                    <label><input type="checkbox" checked={Boolean(runtime.music.enabled)} onChange={(event) => patchEngine("music", (current) => ({ ...current, enabled: event.target.checked }))} /> Engine Enabled</label>
                    <label><input type="checkbox" checked={Boolean(runtime.music.panelDeploy?.enabled)} onChange={(event) => patchEngine("music", (current) => ({ ...current, panelDeploy: { ...current.panelDeploy, enabled: event.target.checked } }))} /> Panel Enabled</label>
                    <input style={input} value={String(runtime.music.panelDeploy?.title || "")} onChange={(event) => patchEngine("music", (current) => ({ ...current, panelDeploy: { ...current.panelDeploy, title: event.target.value } }))} />
                    <textarea style={{ ...input, minHeight: 72 }} value={String(runtime.music.panelDeploy?.description || "")} onChange={(event) => patchEngine("music", (current) => ({ ...current, panelDeploy: { ...current.panelDeploy, description: event.target.value } }))} />
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <button type="button" disabled={Boolean(busy)} style={action} onClick={() => void saveEngine("music", "Saved music panel runtime.")}>Save Music</button>
                      <button type="button" disabled={Boolean(busy)} style={action} onClick={() => void runAction("music", "deployPanel", "Music panel deployed.", "music")}>Deploy Music</button>
                    </div>
                  </div>
                </div>

                <div style={{ ...card, marginTop: 0, background: "#110000" }}>
                  <div style={{ color: "#ff5a5a", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em" }}>Onboarding Panels</div>
                  <div style={{ color: "#ffb3b3", fontSize: 12, marginTop: 6 }}>{summaries.onboarding}</div>
                  <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
                    <label><input type="checkbox" checked={Boolean(runtime.onboarding.enabled)} onChange={(event) => patchEngine("onboarding", (current) => ({ ...current, enabled: event.target.checked }))} /> Enabled</label>
                    <input style={input} value={String(runtime.onboarding.panelTitle || "")} onChange={(event) => patchEngine("onboarding", (current) => ({ ...current, panelTitle: event.target.value }))} />
                    <textarea style={{ ...input, minHeight: 72 }} value={String(runtime.onboarding.panelDescription || "")} onChange={(event) => patchEngine("onboarding", (current) => ({ ...current, panelDescription: event.target.value }))} />
                    <input style={input} value={String(runtime.onboarding.idPanelTitle || "")} onChange={(event) => patchEngine("onboarding", (current) => ({ ...current, idPanelTitle: event.target.value }))} />
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <button type="button" disabled={Boolean(busy)} style={action} onClick={() => void saveEngine("onboarding", "Saved onboarding panel runtime.")}>Save Onboarding</button>
                      <Link href={buildDashboardHref("/dashboard/security/onboarding")} style={{ ...action, textDecoration: "none" }}>Open Onboarding</Link>
                    </div>
                  </div>
                </div>

                <div style={{ ...card, marginTop: 0, background: "#110000" }}>
                  <div style={{ color: "#ff5a5a", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em" }}>Achievement Badge Panel</div>
                  <div style={{ color: "#ffb3b3", fontSize: 12, marginTop: 6 }}>{summaries.progression}</div>
                  <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
                    <label><input type="checkbox" checked={Boolean(runtime.progression.badges?.panelEnabled)} onChange={(event) => patchEngine("progression", (current) => ({ ...current, badges: { ...current.badges, panelEnabled: event.target.checked } }))} /> Panel Enabled</label>
                    <input style={input} value={String(runtime.progression.badges?.panelTitle || "")} onChange={(event) => patchEngine("progression", (current) => ({ ...current, badges: { ...current.badges, panelTitle: event.target.value } }))} />
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <button type="button" disabled={Boolean(busy)} style={action} onClick={() => void saveEngine("progression", "Saved achievement badge panel runtime.")}>Save Badge Panel</button>
                      <Link href={buildDashboardHref("/dashboard/economy/progression")} style={{ ...action, textDecoration: "none" }}>Open Progression</Link>
                    </div>
                  </div>
                </div>

                <div style={{ ...card, marginTop: 0, background: "#110000" }}>
                  <div style={{ color: "#ff5a5a", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em" }}>Range Panel</div>
                  <div style={{ color: "#ffb3b3", fontSize: 12, marginTop: 6 }}>{summaries.range}</div>
                  <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
                    <label><input type="checkbox" checked={Boolean(runtime.range.enabled)} onChange={(event) => patchEngine("range", (current) => ({ ...current, enabled: event.target.checked }))} /> Enabled</label>
                    <input style={input} value={String(runtime.range.presentation?.setupTitle || "")} onChange={(event) => patchEngine("range", (current) => ({ ...current, presentation: { ...current.presentation, setupTitle: event.target.value } }))} />
                    <textarea style={{ ...input, minHeight: 72 }} value={String(runtime.range.presentation?.introText || "")} onChange={(event) => patchEngine("range", (current) => ({ ...current, presentation: { ...current.presentation, introText: event.target.value } }))} />
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <button type="button" disabled={Boolean(busy)} style={action} onClick={() => void saveEngine("range", "Saved range presentation runtime.")}>Save Range</button>
                      <Link href={buildDashboardHref("/dashboard/range")} style={{ ...action, textDecoration: "none" }}>Open Range</Link>
                    </div>
                  </div>
                </div>

                <div style={{ ...card, marginTop: 0, background: "#110000" }}>
                  <div style={{ color: "#ff5a5a", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em" }}>Pokemon Trainer Panel</div>
                  <div style={{ color: "#ffb3b3", fontSize: 12, marginTop: 6 }}>{summaries.pokemon}</div>
                  <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
                    <label><input type="checkbox" checked={Boolean(runtime.pokemon.stage2Enabled)} onChange={(event) => patchEngine("pokemon", (current) => ({ ...current, stage2Enabled: event.target.checked }))} /> Trainer Panel Enabled</label>
                    <label><input type="checkbox" checked={Boolean(runtime.pokemon.guildAllowed)} onChange={(event) => patchEngine("pokemon", (current) => ({ ...current, guildAllowed: event.target.checked }))} /> Guild Allowed</label>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <button type="button" disabled={Boolean(busy)} style={action} onClick={() => void saveEngine("pokemon", "Saved Pokemon trainer panel runtime.")}>Save Pokemon</button>
                      <Link href={buildDashboardHref("/dashboard/pokemon-catching")} style={{ ...action, textDecoration: "none" }}>Open Catching</Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section style={card}>
            <div style={{ color: "#ff6767", fontSize: 13, fontWeight: 900, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 10 }}>Engine-Owned Live Panels</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 10 }}>
              {linkedPanels.map((item) => (
                <Link key={item.href} href={buildDashboardHref(item.href)} style={{ ...card, marginTop: 0, textDecoration: "none", color: "#ffd0d0", background: "#110000" }}>
                  <div style={{ color: "#ff5a5a", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em" }}>{item.title}</div>
                  <div style={{ color: "#ffb0b0", fontSize: 12, marginTop: 6, lineHeight: 1.6 }}>{item.body}</div>
                </Link>
              ))}
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
