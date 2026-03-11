"use client";

import { useState } from "react";
import ConfigJsonEditor from "@/components/possum/ConfigJsonEditor";
import EngineInsights from "@/components/possum/EngineInsights";
import { useGuildEngineEditor } from "@/components/possum/useGuildEngineEditor";

type Role = { id: string; name: string };
type Channel = { id: string; name: string; type?: number | string };
type StoreImage = { url: string; label?: string };

type StoreItem = {
  id: string;
  name: string;
  description: string;
  type: "role" | "item" | "perk";
  roleId: string;
  priceCoins: number;
  stock: number;
  oneTime: boolean;
  enabled: boolean;
};

type StoreConfig = {
  active: boolean;
  panel: {
    enabled: boolean;
    channelId: string;
    title: string;
    description: string;
    buttonLabel: string;
    embedColor: string;
    imageUrl: string;
    imageLibrary: StoreImage[];
  };
  policies: {
    maxItemsPerPurchase: number;
    allowRoleStacking: boolean;
    requireStaffApproval: boolean;
    logChannelId: string;
  };
  items: StoreItem[];
};

const DEFAULT_CONFIG: StoreConfig = {
  active: true,
  panel: {
    enabled: true,
    channelId: "",
    title: "Server Store",
    description: "Spend coins on roles, perks, and items.",
    buttonLabel: "Open Store",
    embedColor: "#ff3b3b",
    imageUrl: "",
    imageLibrary: [],
  },
  policies: {
    maxItemsPerPurchase: 1,
    allowRoleStacking: false,
    requireStaffApproval: false,
    logChannelId: "",
  },
  items: [
    {
      id: "vip-trial",
      name: "VIP Trial",
      description: "Temporary VIP access",
      type: "role",
      roleId: "",
      priceCoins: 5000,
      stock: -1,
      oneTime: true,
      enabled: true,
    },
  ],
};

function normalizeLibrary(raw: unknown): StoreImage[] {
  if (!Array.isArray(raw)) return [];
  const out: StoreImage[] = [];
  const seen = new Set<string>();
  for (const row of raw) {
    const url = String((row as StoreImage | undefined)?.url || "").trim();
    if (!url || seen.has(url)) continue;
    seen.add(url);
    out.push({
      url,
      label: String((row as StoreImage | undefined)?.label || "").trim().slice(0, 120),
    });
  }
  return out;
}

function mergeConfig(raw: Partial<StoreConfig> | null | undefined): StoreConfig {
  return {
    ...DEFAULT_CONFIG,
    ...(raw || {}),
    panel: {
      ...DEFAULT_CONFIG.panel,
      ...(raw?.panel || {}),
      imageLibrary: normalizeLibrary(raw?.panel?.imageLibrary),
    },
    policies: {
      ...DEFAULT_CONFIG.policies,
      ...(raw?.policies || {}),
    },
    items: Array.isArray(raw?.items) ? raw.items : DEFAULT_CONFIG.items,
  };
}

const box: React.CSSProperties = {
  border: "1px solid #5f0000",
  borderRadius: 12,
  padding: 14,
  background: "rgba(120,0,0,0.07)",
  marginBottom: 14,
};

const input: React.CSSProperties = {
  width: "100%",
  padding: 10,
  background: "#0a0a0a",
  border: "1px solid #6f0000",
  color: "#ffd7d7",
  borderRadius: 8,
};

export default function StorePage() {
  const {
    guildId,
    guildName,
    config: rawCfg,
    setConfig: setCfg,
    roles,
    channels,
    summary,
    details,
    loading,
    saving,
    message,
    save,
  } = useGuildEngineEditor<StoreConfig>("store", DEFAULT_CONFIG);

  const cfg = mergeConfig(rawCfg);
  const [localMsg, setLocalMsg] = useState("");
  const [newImageUrl, setNewImageUrl] = useState("");
  const [newImageLabel, setNewImageLabel] = useState("");
  const visibleMessage = localMsg || message;
  const textChannels = (channels as Channel[]).filter(
    (channel) => Number(channel?.type) === 0 || Number(channel?.type) === 5 || String(channel?.type || "").toLowerCase().includes("text")
  );

  async function saveStore(nextConfig: StoreConfig = cfg) {
    setLocalMsg("");
    const normalized = mergeConfig(nextConfig);
    setCfg(normalized);
    const result = await save(normalized);
    if (!result) return;
  }

  function addPanelImage(newImageUrl: string, newImageLabel: string, reset: () => void) {
    const url = String(newImageUrl || "").trim();
    if (!url) return;
    if (cfg.panel.imageLibrary.some((item) => item.url === url)) {
      setLocalMsg("Image already in library.");
      return;
    }
    setCfg((prev) => ({
      ...prev,
      panel: {
        ...prev.panel,
        imageLibrary: [...prev.panel.imageLibrary, { url, label: String(newImageLabel || "").trim() }],
      },
    }));
    reset();
    setLocalMsg("Added image to library. Save Store to persist.");
  }

  function removePanelImage(url: string) {
    setCfg((prev) => ({
      ...prev,
      panel: {
        ...prev.panel,
        imageLibrary: prev.panel.imageLibrary.filter((item) => item.url !== url),
        imageUrl: prev.panel.imageUrl === url ? "" : prev.panel.imageUrl,
      },
    }));
    setLocalMsg("");
  }

  function setPanelBackground(url: string) {
    setCfg((prev) => ({ ...prev, panel: { ...prev.panel, imageUrl: url } }));
    setLocalMsg("");
  }

  function addItem() {
    setCfg((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          id: `item-${Date.now()}`,
          name: "",
          description: "",
          type: "item",
          roleId: "",
          priceCoins: 0,
          stock: -1,
          oneTime: false,
          enabled: true,
        },
      ],
    }));
    setLocalMsg("");
  }

  function updateItem(index: number, patch: Partial<StoreItem>) {
    setCfg((prev) => {
      const items = [...prev.items];
      items[index] = { ...items[index], ...patch };
      return { ...prev, items };
    });
  }

  function removeItem(index: number) {
    setCfg((prev) => ({
      ...prev,
      items: prev.items.filter((_, itemIndex) => itemIndex !== index),
    }));
    setLocalMsg("");
  }

  if (!guildId) {
    return <div style={{ color: "#ff7777", padding: 20 }}>Missing guildId.</div>;
  }

  return (
    <div style={{ color: "#ff4d4d", padding: 20, maxWidth: 1180 }}>
      <h1 style={{ marginTop: 0, letterSpacing: "0.12em", textTransform: "uppercase" }}>Economy - Store Engine</h1>
      <p>Guild: {guildName || guildId}</p>
      <div style={{ color: "#ffb7b7", lineHeight: 1.6, marginBottom: 12 }}>
        Store now writes straight into the live guild store engine. Catalog items, panel art, policy toggles, and role grants stay on the same runtime path the bot uses.
      </div>
      {visibleMessage ? <div style={{ marginBottom: 12, color: "#ffd1d1" }}>{visibleMessage}</div> : null}

      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          <EngineInsights summary={summary} details={details} />

          <div style={{ ...box, marginTop: 14 }}>
            <label>
              <input
                type="checkbox"
                checked={cfg.active}
                onChange={(e) => setCfg((prev) => ({ ...prev, active: e.target.checked }))}
              />{" "}
              Store engine active
            </label>
          </div>

          <div style={box}>
            <h3 style={{ marginTop: 0, color: "#ff4444" }}>Store Panel</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label>Panel channel</label>
                <select
                  style={input}
                  value={cfg.panel.channelId}
                  onChange={(e) => setCfg((prev) => ({ ...prev, panel: { ...prev.panel, channelId: e.target.value } }))}
                >
                  <option value="">Select channel</option>
                  {textChannels.map((channel) => (
                    <option key={channel.id} value={channel.id}>
                      #{channel.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label>Log channel</label>
                <select
                  style={input}
                  value={cfg.policies.logChannelId}
                  onChange={(e) => setCfg((prev) => ({ ...prev, policies: { ...prev.policies, logChannelId: e.target.value } }))}
                >
                  <option value="">Select channel</option>
                  {textChannels.map((channel) => (
                    <option key={channel.id} value={channel.id}>
                      #{channel.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ marginTop: 10 }}>
              <label>Panel title</label>
              <input
                style={input}
                value={cfg.panel.title}
                onChange={(e) => setCfg((prev) => ({ ...prev, panel: { ...prev.panel, title: e.target.value } }))}
              />
            </div>

            <div style={{ marginTop: 10 }}>
              <label>Panel description</label>
              <textarea
                style={{ ...input, minHeight: 80 }}
                value={cfg.panel.description}
                onChange={(e) => setCfg((prev) => ({ ...prev, panel: { ...prev.panel, description: e.target.value } }))}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 10 }}>
              <div>
                <label>Button label</label>
                <input
                  style={input}
                  value={cfg.panel.buttonLabel}
                  onChange={(e) => setCfg((prev) => ({ ...prev, panel: { ...prev.panel, buttonLabel: e.target.value } }))}
                />
              </div>
              <div>
                <label>Embed color</label>
                <input
                  style={input}
                  value={cfg.panel.embedColor}
                  onChange={(e) => setCfg((prev) => ({ ...prev, panel: { ...prev.panel, embedColor: e.target.value } }))}
                />
              </div>
              <div>
                <label>Selected background image URL</label>
                <input
                  style={input}
                  value={cfg.panel.imageUrl}
                  onChange={(e) => setCfg((prev) => ({ ...prev, panel: { ...prev.panel, imageUrl: e.target.value } }))}
                />
              </div>
            </div>

            <div style={{ marginTop: 10 }}>
              <label>
                <input
                  type="checkbox"
                  checked={cfg.panel.enabled}
                  onChange={(e) => setCfg((prev) => ({ ...prev, panel: { ...prev.panel, enabled: e.target.checked } }))}
                />{" "}
                Panel enabled
              </label>
            </div>
          </div>

          <div style={box}>
            <h3 style={{ marginTop: 0, color: "#ff4444" }}>Store Background Image Library</h3>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr auto", gap: 8 }}>
              <input
                style={input}
                placeholder="Image URL"
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
              />
              <input
                style={input}
                placeholder="Label (optional)"
                value={newImageLabel}
                onChange={(e) => setNewImageLabel(e.target.value)}
              />
              <button
                onClick={() => addPanelImage(newImageUrl, newImageLabel, () => {
                  setNewImageUrl("");
                  setNewImageLabel("");
                })}
                style={{ ...input, width: "auto", cursor: "pointer" }}
                type="button"
              >
                Add
              </button>
            </div>

            {cfg.panel.imageLibrary.length ? (
              <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
                {cfg.panel.imageLibrary.map((img) => (
                  <div key={img.url} style={{ border: "1px solid #5f0000", borderRadius: 8, padding: 8, display: "grid", gridTemplateColumns: "1fr auto auto", gap: 8, alignItems: "center" }}>
                    <div>
                      <div style={{ color: "#ffd6d6", fontWeight: 700 }}>{img.label || "Store background"}</div>
                      <div style={{ color: "#ff9f9f", fontSize: 12, overflow: "hidden", textOverflow: "ellipsis" }}>{img.url}</div>
                    </div>
                    <button type="button" onClick={() => setPanelBackground(img.url)} style={{ ...input, width: "auto", cursor: "pointer" }}>
                      {cfg.panel.imageUrl === img.url ? "Selected" : "Select"}
                    </button>
                    <button type="button" onClick={() => removePanelImage(img.url)} style={{ ...input, width: "auto", cursor: "pointer" }}>
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ marginTop: 10, color: "#ff9f9f", fontSize: 12 }}>No images in library yet.</div>
            )}

            {cfg.panel.imageUrl ? (
              <div style={{ marginTop: 10 }}>
                <div style={{ color: "#ffb3b3", marginBottom: 4, fontSize: 12 }}>Current background preview</div>
                <img src={cfg.panel.imageUrl} alt="Store background preview" style={{ maxWidth: "100%", borderRadius: 8, border: "1px solid #5f0000" }} />
              </div>
            ) : null}
          </div>

          <div style={box}>
            <h3 style={{ marginTop: 0, color: "#ff4444" }}>Policies</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label>Max items per purchase</label>
                <input
                  style={input}
                  type="number"
                  value={cfg.policies.maxItemsPerPurchase}
                  onChange={(e) => setCfg((prev) => ({ ...prev, policies: { ...prev.policies, maxItemsPerPurchase: Number(e.target.value || 1) } }))}
                />
              </div>
              <div>
                <label>Require staff approval</label>
                <br />
                <input
                  type="checkbox"
                  checked={cfg.policies.requireStaffApproval}
                  onChange={(e) => setCfg((prev) => ({ ...prev, policies: { ...prev.policies, requireStaffApproval: e.target.checked } }))}
                />
              </div>
            </div>
            <div style={{ marginTop: 8 }}>
              <label>
                <input
                  type="checkbox"
                  checked={cfg.policies.allowRoleStacking}
                  onChange={(e) => setCfg((prev) => ({ ...prev, policies: { ...prev.policies, allowRoleStacking: e.target.checked } }))}
                />{" "}
                Allow role stacking
              </label>
            </div>
          </div>

          <div style={box}>
            <h3 style={{ marginTop: 0, color: "#ff4444" }}>Store Items</h3>
            {cfg.items.map((item, index) => (
              <div key={item.id || index} style={{ border: "1px solid #5f0000", borderRadius: 8, padding: 10, marginBottom: 10 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr 1fr auto", gap: 8 }}>
                  <input
                    style={input}
                    placeholder="Name"
                    value={item.name}
                    onChange={(e) => updateItem(index, { name: e.target.value })}
                  />
                  <select
                    style={input}
                    value={item.type}
                    onChange={(e) => updateItem(index, { type: e.target.value as StoreItem["type"] })}
                  >
                    <option value="item">Item</option>
                    <option value="role">Role</option>
                    <option value="perk">Perk</option>
                  </select>
                  <input
                    style={input}
                    type="number"
                    placeholder="Price"
                    value={item.priceCoins}
                    onChange={(e) => updateItem(index, { priceCoins: Number(e.target.value || 0) })}
                  />
                  <input
                    style={input}
                    type="number"
                    placeholder="Stock (-1 infinite)"
                    value={item.stock}
                    onChange={(e) => updateItem(index, { stock: Number(e.target.value || -1) })}
                  />
                  <button type="button" onClick={() => removeItem(index)} style={{ ...input, width: "auto", cursor: "pointer" }}>
                    Remove
                  </button>
                </div>

                <div style={{ marginTop: 8, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <textarea
                    style={{ ...input, minHeight: 58 }}
                    placeholder="Description"
                    value={item.description}
                    onChange={(e) => updateItem(index, { description: e.target.value })}
                  />
                  <div>
                    <select
                      style={input}
                      value={item.roleId}
                      onChange={(e) => updateItem(index, { roleId: e.target.value })}
                      disabled={item.type !== "role"}
                    >
                      <option value="">{item.type === "role" ? "Select role" : "Role not needed"}</option>
                      {(roles as Role[]).map((role) => (
                        <option key={role.id} value={role.id}>
                          @{role.name}
                        </option>
                      ))}
                    </select>
                    <div style={{ marginTop: 8 }}>
                      <label>
                        <input
                          type="checkbox"
                          checked={item.oneTime}
                          onChange={(e) => updateItem(index, { oneTime: e.target.checked })}
                        />{" "}
                        One-time purchase
                      </label>{" "}
                      <label style={{ marginLeft: 12 }}>
                        <input
                          type="checkbox"
                          checked={item.enabled}
                          onChange={(e) => updateItem(index, { enabled: e.target.checked })}
                        />{" "}
                        Enabled
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <button type="button" onClick={addItem} style={{ ...input, width: "auto", cursor: "pointer" }}>
              + Add Item
            </button>
          </div>

          <ConfigJsonEditor
            title="Advanced Store Config"
            value={cfg}
            disabled={saving}
            onApply={async (next) => {
              const normalized = mergeConfig(next as StoreConfig);
              setCfg(normalized);
              await saveStore(normalized);
            }}
          />

          <button onClick={() => void saveStore()} disabled={saving} style={{ ...input, width: "auto", cursor: "pointer", fontWeight: 700 }}>
            {saving ? "Saving..." : "Save Store"}
          </button>
        </>
      )}
    </div>
  );
}
