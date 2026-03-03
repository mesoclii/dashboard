"use client";



import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Role = { id: string; name: string; position?: number };
type Channel = { id: string; name: string; type: number };

type RewardTier = {
  invites: number;
  roleId: string;
  coins: number;
  label: string;
};

type LeaderboardConfig = {
  active: boolean;
  publicEnabled: boolean;
  vanitySlug: string;
  pointsName: string;
  leaderboardType: "invites" | "referrals";
  rewardsEnabled: boolean;
  rewardTiers: RewardTier[];
  payoutMode: "manual" | "auto";
  payoutIntervalHours: number;
  minimumInvitesForReward: number;
  announceRewards: boolean;
  announceChannelId: string;
  notes: string;
};

const DEFAULT_CONFIG: LeaderboardConfig = {
  active: true,
  publicEnabled: false,
  vanitySlug: "",
  pointsName: "XP",
  leaderboardType: "invites",
  rewardsEnabled: true,
  rewardTiers: [
    { invites: 5, roleId: "", coins: 0, label: "" },
    { invites: 10, roleId: "", coins: 250, label: "" },
    { invites: 25, roleId: "", coins: 1000, label: "" }
  ],
  payoutMode: "manual",
  payoutIntervalHours: 24,
  minimumInvitesForReward: 1,
  announceRewards: true,
  announceChannelId: "",
  notes: ""
};

function cloneDefaults(): LeaderboardConfig {
  return JSON.parse(JSON.stringify(DEFAULT_CONFIG));
}

function clampInt(v: unknown, fallback: number, min: number, max: number): number {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  const i = Math.trunc(n);
  if (i < min) return min;
  if (i > max) return max;
  return i;
}

function cleanText(v: unknown, fallback = "", max = 3000): string {
  return String(v ?? fallback).trim().slice(0, max);
}

function normalize(cfg: LeaderboardConfig): LeaderboardConfig {
  const tiers = (Array.isArray(cfg.rewardTiers) ? cfg.rewardTiers : [])
    .map((t) => ({
      invites: clampInt(t?.invites, 1, 1, 1000000),
      roleId: cleanText(t?.roleId, "", 30),
      coins: clampInt(t?.coins, 0, 0, 100000000),
      label: cleanText(t?.label, "", 120)
    }))
    .sort((a, b) => a.invites - b.invites);

  return {
    active: !!cfg.active,
    publicEnabled: !!cfg.publicEnabled,
    vanitySlug: cleanText(cfg.vanitySlug, "", 48)
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-{2,}/g, "-")
      .replace(/^-+|-+$/g, ""),
    pointsName: cleanText(cfg.pointsName, "XP", 40) || "XP",
    leaderboardType: cfg.leaderboardType === "referrals" ? "referrals" : "invites",
    rewardsEnabled: !!cfg.rewardsEnabled,
    rewardTiers: tiers,
    payoutMode: cfg.payoutMode === "auto" ? "auto" : "manual",
    payoutIntervalHours: clampInt(cfg.payoutIntervalHours, 24, 1, 720),
    minimumInvitesForReward: clampInt(cfg.minimumInvitesForReward, 1, 1, 1000000),
    announceRewards: !!cfg.announceRewards,
    announceChannelId: cleanText(cfg.announceChannelId, "", 30),
    notes: cleanText(cfg.notes, "", 4000)
  };
}

function sig(cfg: LeaderboardConfig): string {
  return JSON.stringify(normalize(cfg));
}

function baseTier(): RewardTier {
  return { invites: 1, roleId: "", coins: 0, label: "" };
}

export default function LeaderboardPage() {
  const [guildId, setGuildId] = useState("");
  const [guildName, setGuildName] = useState("");
  const [roles, setRoles] = useState<Role[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [cfg, setCfg] = useState<LeaderboardConfig>(cloneDefaults());
  const [initialSig, setInitialSig] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const urlId = new URLSearchParams(window.location.search).get("guildId") || "";
    const stored = localStorage.getItem("activeGuildId") || "";
    const gid = (urlId || stored).trim();
    if (gid) {
      localStorage.setItem("activeGuildId", gid);
      setGuildId(gid);
    }
  }, []);

  useEffect(() => {
    if (!guildId) {
      setLoading(false);
      return;
    }

    (async () => {
      try {
        setLoading(true);
        setMsg("");

        const [gRes, cRes] = await Promise.all([
          fetch(`/api/bot/guild-data?guildId=${encodeURIComponent(guildId)}`),
          fetch(`/api/setup/leaderboard-config?guildId=${encodeURIComponent(guildId)}`)
        ]);

        const g = await gRes.json();
        const c = await cRes.json();

        const loaded = normalize({ ...cloneDefaults(), ...(c?.config || {}) });

        setGuildName(g?.guild?.name || guildId);
        setRoles((Array.isArray(g?.roles) ? g.roles : []).sort((a: Role, b: Role) => Number(b.position || 0) - Number(a.position || 0)));
        setChannels(Array.isArray(g?.channels) ? g.channels : []);
        setCfg(loaded);
        setInitialSig(sig(loaded));
      } catch {
        setMsg("Failed to load leaderboard config.");
      } finally {
        setLoading(false);
      }
    })();
  }, [guildId]);

  const textChannels = useMemo(() => channels.filter((c) => c.type === 0 || c.type === 5), [channels]);
  const dirty = useMemo(() => sig(cfg) !== initialSig, [cfg, initialSig]);

  function addTier() {
    setCfg((p) => ({ ...p, rewardTiers: [...p.rewardTiers, baseTier()] }));
  }

  function removeTier(index: number) {
    setCfg((p) => ({ ...p, rewardTiers: p.rewardTiers.filter((_, i) => i !== index) }));
  }

  function patchTier(index: number, patch: Partial<RewardTier>) {
    setCfg((p) => ({ ...p, rewardTiers: p.rewardTiers.map((t, i) => (i === index ? { ...t, ...patch } : t)) }));
  }

  function applyPreset(name: "blank" | "starter" | "growth") {
    if (name === "blank") {
      setCfg((p) =>
        normalize({
          ...p,
          active: false,
          publicEnabled: false,
          rewardsEnabled: false,
          rewardTiers: [],
          payoutMode: "manual",
          payoutIntervalHours: 24,
          minimumInvitesForReward: 1
        })
      );
      return;
    }

    if (name === "starter") {
      setCfg((p) =>
        normalize({
          ...p,
          active: true,
          publicEnabled: false,
          rewardsEnabled: true,
          pointsName: "XP",
          leaderboardType: "invites",
          rewardTiers: [
            { invites: 5, roleId: "", coins: 0, label: "Starter" },
            { invites: 10, roleId: "", coins: 250, label: "Builder" },
            { invites: 25, roleId: "", coins: 1000, label: "Promoter" }
          ]
        })
      );
      return;
    }

    setCfg((p) =>
      normalize({
        ...p,
        active: true,
        publicEnabled: true,
        rewardsEnabled: true,
        pointsName: "Invites",
        leaderboardType: "invites",
        payoutMode: "auto",
        payoutIntervalHours: 12,
        rewardTiers: [
          { invites: 3, roleId: "", coins: 100, label: "Bronze" },
          { invites: 10, roleId: "", coins: 500, label: "Silver" },
          { invites: 25, roleId: "", coins: 1500, label: "Gold" },
          { invites: 50, roleId: "", coins: 5000, label: "Platinum" }
        ]
      })
    );
  }

  async function saveAll() {
    if (!guildId) return;
    try {
      setSaving(true);
      setMsg("");

      const normalized = normalize(cfg);

      const res = await fetch("/api/setup/leaderboard-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guildId, config: normalized })
      });

      const data = await res.json();
      if (!res.ok || data?.success === false) throw new Error(data?.error || "Save failed");

      // keep module state visible in global feature flags
      await fetch("/api/bot/dashboard-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guildId,
          patch: {
            features: {
              economyEnabled: !!normalized.active
            }
          }
        })
      }).catch(() => null);

      setCfg(normalized);
      setInitialSig(sig(normalized));
      setMsg("Saved leaderboard config.");
    } catch (e: any) {
      setMsg(e?.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  const card: React.CSSProperties = {
    border: "1px solid #5f0000",
    borderRadius: 12,
    padding: 14,
    background: "rgba(120,0,0,0.08)",
    marginBottom: 12
  };

  const input: React.CSSProperties = {
    width: "100%",
    background: "#0a0a0a",
    color: "#ffd0d0",
    border: "1px solid #7f0000",
    borderRadius: 8,
    padding: "10px 12px"
  };

  const pill = (on: boolean) => ({
    border: `1px solid ${on ? "#14a44d" : "#a41414"}`,
    borderRadius: 999,
    padding: "6px 12px",
    color: on ? "#7dff9c" : "#ff9a9a",
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: "0.06em"
  });

  if (!guildId) {
    return (
      <div style={{ color: "#ffb3b3", padding: 20 }}>
        Missing guildId. Open from <Link href="/guilds" style={{ color: "#fff" }}>/guilds</Link>.
      </div>
    );
  }

  return (
    <div style={{ color: "#ff5c5c", padding: 18, maxWidth: 1280 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, letterSpacing: "0.12em", textTransform: "uppercase" }}>Leaderboard Control</h1>
          <div style={{ color: "#ff9f9f", marginTop: 6 }}>Guild: {guildName || guildId}</div>
        </div>
        <button
          onClick={saveAll}
          disabled={saving || loading}
          style={{ border: "1px solid #ff3636", background: "#190000", color: "#fff", borderRadius: 10, padding: "10px 14px", fontWeight: 800, cursor: "pointer" }}
        >
          {saving ? "Saving..." : "Save Leaderboard"}
        </button>
      </div>

      <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
        <span style={pill(cfg.active)}>MODULE {cfg.active ? "ON" : "OFF"}</span>
        <span style={pill(cfg.publicEnabled)}>PUBLIC {cfg.publicEnabled ? "ON" : "OFF"}</span>
        <span style={pill(cfg.rewardsEnabled)}>REWARDS {cfg.rewardsEnabled ? "ON" : "OFF"}</span>
        <span style={pill(cfg.payoutMode === "auto")}>PAYOUT {cfg.payoutMode.toUpperCase()}</span>
        <span style={pill(!dirty)}>{dirty ? "UNSAVED" : "SAVED"}</span>
      </div>

      {msg ? <div style={{ marginTop: 10, color: "#ffd3d3" }}>{msg}</div> : null}

      {loading ? (
        <div style={{ marginTop: 16 }}>Loading...</div>
      ) : (
        <div style={{ marginTop: 16 }}>
          <div style={card}>
            <h3 style={{ marginTop: 0, color: "#ff4444" }}>Quick Presets</h3>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button type="button" onClick={() => applyPreset("blank")} style={{ ...input, width: "auto", cursor: "pointer" }}>Blank</button>
              <button type="button" onClick={() => applyPreset("starter")} style={{ ...input, width: "auto", cursor: "pointer" }}>Starter</button>
              <button type="button" onClick={() => applyPreset("growth")} style={{ ...input, width: "auto", cursor: "pointer" }}>Growth</button>
            </div>
          </div>

          <div style={card}>
            <h3 style={{ marginTop: 0, color: "#ff4444" }}>Core</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
              <label><input type="checkbox" checked={cfg.active} onChange={(e) => setCfg({ ...cfg, active: e.target.checked })} /> Enabled</label>
              <label><input type="checkbox" checked={cfg.publicEnabled} onChange={(e) => setCfg({ ...cfg, publicEnabled: e.target.checked })} /> Public leaderboard</label>
              <label><input type="checkbox" checked={cfg.rewardsEnabled} onChange={(e) => setCfg({ ...cfg, rewardsEnabled: e.target.checked })} /> Reward payouts</label>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              <div>
                <div>Points Name</div>
                <input style={input} value={cfg.pointsName} onChange={(e) => setCfg({ ...cfg, pointsName: e.target.value })} />
              </div>
              <div>
                <div>Leaderboard Type</div>
                <select style={input} value={cfg.leaderboardType} onChange={(e) => setCfg({ ...cfg, leaderboardType: e.target.value as "invites" | "referrals" })}>
                  <option value="invites">Invites</option>
                  <option value="referrals">Referrals</option>
                </select>
              </div>
              <div>
                <div>Vanity Slug</div>
                <input style={input} value={cfg.vanitySlug} onChange={(e) => setCfg({ ...cfg, vanitySlug: e.target.value })} placeholder="guild-leaderboard" />
              </div>
            </div>
          </div>

          <div style={card}>
            <h3 style={{ marginTop: 0, color: "#ff4444" }}>Payout + Announce</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10 }}>
              <div>
                <div>Payout Mode</div>
                <select style={input} value={cfg.payoutMode} onChange={(e) => setCfg({ ...cfg, payoutMode: e.target.value as "manual" | "auto" })}>
                  <option value="manual">Manual</option>
                  <option value="auto">Auto</option>
                </select>
              </div>
              <div>
                <div>Payout Interval Hours</div>
                <input type="number" style={input} value={cfg.payoutIntervalHours} onChange={(e) => setCfg({ ...cfg, payoutIntervalHours: clampInt(e.target.value, 24, 1, 720) })} />
              </div>
              <div>
                <div>Min Invites For Reward</div>
                <input type="number" style={input} value={cfg.minimumInvitesForReward} onChange={(e) => setCfg({ ...cfg, minimumInvitesForReward: clampInt(e.target.value, 1, 1, 1000000) })} />
              </div>
              <div>
                <div>Announce Channel</div>
                <select style={input} value={cfg.announceChannelId} onChange={(e) => setCfg({ ...cfg, announceChannelId: e.target.value })}>
                  <option value="">No channel</option>
                  {textChannels.map((c) => (
                    <option key={c.id} value={c.id}>
                      #{c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div style={{ marginTop: 10 }}>
              <label><input type="checkbox" checked={cfg.announceRewards} onChange={(e) => setCfg({ ...cfg, announceRewards: e.target.checked })} /> Announce reward payouts</label>
            </div>
          </div>

          <div style={card}>
            <h3 style={{ marginTop: 0, color: "#ff4444" }}>Reward Tiers</h3>
            {cfg.rewardTiers.map((t, i) => (
              <div key={i} style={{ border: "1px solid #5f0000", borderRadius: 8, padding: 10, marginBottom: 8 }}>
                <div style={{ display: "grid", gridTemplateColumns: "120px 1fr 120px 1fr auto", gap: 8, alignItems: "center" }}>
                  <input type="number" style={input} value={t.invites} onChange={(e) => patchTier(i, { invites: clampInt(e.target.value, 1, 1, 1000000) })} placeholder="Invites" />
                  <select style={input} value={t.roleId} onChange={(e) => patchTier(i, { roleId: e.target.value })}>
                    <option value="">No role</option>
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                  <input type="number" style={input} value={t.coins} onChange={(e) => patchTier(i, { coins: clampInt(e.target.value, 0, 0, 100000000) })} placeholder="Coins" />
                  <input style={input} value={t.label} onChange={(e) => patchTier(i, { label: e.target.value })} placeholder="Label (optional)" />
                  <button type="button" onClick={() => removeTier(i)} style={{ border: "1px solid #ff3b3b", background: "transparent", color: "#ffd0d0", borderRadius: 8, padding: "8px 10px", cursor: "pointer" }}>
                    Remove
                  </button>
                </div>
              </div>
            ))}
            <button type="button" onClick={addTier} style={{ border: "1px solid #ff3b3b", background: "transparent", color: "#ffd0d0", borderRadius: 8, padding: "8px 12px", cursor: "pointer" }}>
              Add Tier
            </button>
          </div>

          <div style={card}>
            <h3 style={{ marginTop: 0, color: "#ff4444" }}>Notes</h3>
            <textarea style={{ ...input, minHeight: 120 }} value={cfg.notes} onChange={(e) => setCfg({ ...cfg, notes: e.target.value })} />
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
            <Link href={`/dashboard/economy?guildId=${encodeURIComponent(guildId)}`} style={{ color: "#fff" }}>
              Back to Economy
            </Link>
            <button
              onClick={saveAll}
              disabled={saving}
              style={{ border: "1px solid #ff3636", background: "#190000", color: "#fff", borderRadius: 10, padding: "10px 14px", fontWeight: 800, cursor: "pointer" }}
            >
              {saving ? "Saving..." : "Save Leaderboard"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
