"use client";

import Link from "next/link";
import type { ChangeEvent, CSSProperties } from "react";
import EngineContractPanel from "@/components/possum/EngineContractPanel";
import EngineInsights from "@/components/possum/EngineInsights";
import { buildDashboardHref } from "@/lib/dashboardContext";
import { getEngineSpec } from "@/lib/dashboardEngineCatalog";
import { useGuildEngineEditor, type GuildChannel, type GuildRole } from "@/components/possum/useGuildEngineEditor";

type QuickLink = {
  href: string;
  label: string;
};

type CatalogEngineConsoleProps = {
  engineKey: string;
  title: string;
  description: string;
  commandId?: string;
  links?: QuickLink[];
};

type JsonRecord = Record<string, any>;

const shell: CSSProperties = {
  color: "#ffd0d0",
  padding: 18,
  maxWidth: 1360,
};

const card: CSSProperties = {
  border: "1px solid #5f0000",
  borderRadius: 14,
  padding: 16,
  background: "linear-gradient(180deg, rgba(120,0,0,0.12), rgba(0,0,0,0.72))",
  marginTop: 12,
};

const fieldset: CSSProperties = {
  border: "1px solid #450000",
  borderRadius: 12,
  padding: 14,
  background: "rgba(120,0,0,0.08)",
  marginTop: 12,
};

const input: CSSProperties = {
  width: "100%",
  background: "#0a0a0a",
  color: "#ffd0d0",
  border: "1px solid #7f0000",
  borderRadius: 10,
  padding: "10px 12px",
};

const button: CSSProperties = {
  ...input,
  width: "auto",
  cursor: "pointer",
  fontWeight: 900,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
};

const label: CSSProperties = {
  color: "#ffb9b9",
  fontSize: 12,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  marginBottom: 6,
};

const scrollList: CSSProperties = {
  maxHeight: 220,
  overflowY: "auto",
  border: "1px solid #410000",
  borderRadius: 10,
  padding: 10,
  background: "#090202",
};

function isPlainObject(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function humanize(value: string) {
  return String(value || "")
    .replace(/^security\./, "")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/\./g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function updateAtPath(input: any, path: string[], nextValue: any): any {
  if (!path.length) return nextValue;
  const [head, ...rest] = path;
  const source = isPlainObject(input) ? input : {};
  return {
    ...source,
    [head]: rest.length ? updateAtPath(source[head], rest, nextValue) : nextValue,
  };
}

function toggle(list: string[], id: string) {
  const set = new Set((Array.isArray(list) ? list : []).map((value) => String(value || "").trim()).filter(Boolean));
  if (set.has(id)) set.delete(id);
  else set.add(id);
  return Array.from(set);
}

function lines(value: string) {
  return String(value || "")
    .split(/\r?\n+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseNumberish(value: string, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function looksLongText(key: string) {
  return /(message|template|notes|description|intro|footer|content|copy|text|prompt|backstory)/i.test(key);
}

function looksImageField(key: string) {
  return /(image|banner|avatar|artwork|background|thumbnail|icon)url$/i.test(key);
}

function isChannelIdKey(key: string) {
  return /ChannelId$/i.test(key);
}

function isCategoryIdKey(key: string) {
  return /CategoryId$/i.test(key);
}

function isVoiceChannelKey(key: string) {
  return /(voice|stage)/i.test(key) && /ChannelId$/i.test(key);
}

function isRoleIdKey(key: string) {
  return /RoleId$/i.test(key);
}

function isChannelIdsKey(key: string) {
  return /ChannelIds$/i.test(key);
}

function isCategoryIdsKey(key: string) {
  return /CategoryIds$/i.test(key);
}

function isRoleIdsKey(key: string) {
  return /RoleIds$/i.test(key);
}

function getTextChannels(channels: GuildChannel[]) {
  return channels.filter((channel) => Number(channel?.type) === 0 || String(channel?.type || "").toLowerCase().includes("text"));
}

function getVoiceChannels(channels: GuildChannel[]) {
  return channels.filter((channel) => {
    const type = Number(channel?.type);
    const text = String(channel?.type || "").toLowerCase();
    return type === 2 || type === 13 || text.includes("voice") || text.includes("stage");
  });
}

function getCategories(channels: GuildChannel[]) {
  return channels.filter((channel) => Number(channel?.type) === 4 || String(channel?.type || "").toLowerCase().includes("category"));
}

async function fileToDataUrl(file: File) {
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Image load failed."));
    reader.readAsDataURL(file);
  });
}

function renderIdChecklist({
  values,
  options,
  prefix,
  onToggle,
}: {
  values: string[];
  options: Array<{ id: string; name: string }>;
  prefix: string;
  onToggle: (id: string) => void;
}) {
  if (!options.length) {
    return <div style={{ color: "#ffabab" }}>No matching options available in this guild.</div>;
  }
  return (
    <div style={scrollList}>
      {options.map((option) => (
        <label key={`${prefix}:${option.id}`} style={{ display: "block", marginBottom: 6, color: "#ffd8d8" }}>
          <input type="checkbox" checked={values.includes(option.id)} onChange={() => onToggle(option.id)} /> {option.name}
        </label>
      ))}
    </div>
  );
}

function ConfigField({
  path,
  value,
  channels,
  roles,
  update,
}: {
  path: string[];
  value: any;
  channels: GuildChannel[];
  roles: GuildRole[];
  update: (nextValue: any) => void;
}) {
  const fieldKey = path[path.length - 1] || "value";
  const title = humanize(fieldKey);
  const textChannels = getTextChannels(channels);
  const voiceChannels = getVoiceChannels(channels);
  const categories = getCategories(channels);

  async function onUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const dataUrl = await fileToDataUrl(file).catch(() => "");
    if (dataUrl) update(dataUrl);
    event.target.value = "";
  }

  if (isPlainObject(value)) {
    const entries = Object.entries(value);
    return (
      <div style={fieldset}>
        <div style={{ ...label, marginBottom: 10 }}>{title}</div>
        <div style={{ display: "grid", gap: 12 }}>
          {entries.length ? (
            entries.map(([nestedKey, nestedValue]) => (
              <ConfigField
                key={`${path.join(".")}:${nestedKey}`}
                path={[...path, nestedKey]}
                value={nestedValue}
                channels={channels}
                roles={roles}
                update={(nextValue) => update(updateAtPath(value, [nestedKey], nextValue))}
              />
            ))
          ) : (
            <div style={{ color: "#ffabab" }}>No nested settings defined.</div>
          )}
        </div>
      </div>
    );
  }

  if (Array.isArray(value)) {
    if (isChannelIdsKey(fieldKey)) {
      return (
        <div>
          <div style={label}>{title}</div>
          {renderIdChecklist({
            values: value.map((entry) => String(entry)),
            options: textChannels.map((entry) => ({ id: entry.id, name: `#${entry.name}` })),
            prefix: path.join("."),
            onToggle: (id) => update(toggle(value.map((entry) => String(entry)), id)),
          })}
        </div>
      );
    }

    if (isCategoryIdsKey(fieldKey)) {
      return (
        <div>
          <div style={label}>{title}</div>
          {renderIdChecklist({
            values: value.map((entry) => String(entry)),
            options: categories.map((entry) => ({ id: entry.id, name: entry.name })),
            prefix: path.join("."),
            onToggle: (id) => update(toggle(value.map((entry) => String(entry)), id)),
          })}
        </div>
      );
    }

    if (isRoleIdsKey(fieldKey)) {
      return (
        <div>
          <div style={label}>{title}</div>
          {renderIdChecklist({
            values: value.map((entry) => String(entry)),
            options: roles.map((entry) => ({ id: entry.id, name: `@${entry.name}` })),
            prefix: path.join("."),
            onToggle: (id) => update(toggle(value.map((entry) => String(entry)), id)),
          })}
        </div>
      );
    }

    if (value.every((entry) => entry === null || ["string", "number", "boolean"].includes(typeof entry))) {
      return (
        <div>
          <div style={label}>{title}</div>
          <textarea
            style={{ ...input, minHeight: 110 }}
            value={value.map((entry) => String(entry ?? "")).join("\n")}
            onChange={(event) => update(lines(event.target.value))}
          />
        </div>
      );
    }

    return (
      <div>
        <div style={label}>{title}</div>
        <textarea
          style={{ ...input, minHeight: 150, fontFamily: "monospace", fontSize: 12 }}
          value={JSON.stringify(value, null, 2)}
          onChange={(event) => {
            try {
              update(JSON.parse(event.target.value || "[]"));
            } catch {}
          }}
        />
        <div style={{ color: "#ffabab", fontSize: 12, marginTop: 6 }}>Advanced object-list editor. Paste valid JSON to update this list.</div>
      </div>
    );
  }

  if (typeof value === "boolean") {
    return (
      <label style={{ display: "inline-flex", gap: 8, alignItems: "center", color: "#ffdcdc", fontWeight: 700 }}>
        <input type="checkbox" checked={value} onChange={(event) => update(event.target.checked)} /> {title}
      </label>
    );
  }

  if (typeof value === "number") {
    return (
      <div>
        <div style={label}>{title}</div>
        <input style={input} type="number" value={value} onChange={(event) => update(parseNumberish(event.target.value, value))} />
      </div>
    );
  }

  if (typeof value === "string") {
    if (isVoiceChannelKey(fieldKey)) {
      return (
        <div>
          <div style={label}>{title}</div>
          <select style={input} value={value || ""} onChange={(event) => update(event.target.value)}>
            <option value="">Not set</option>
            {voiceChannels.map((channel) => (
              <option key={channel.id} value={channel.id}>
                {channel.name}
              </option>
            ))}
          </select>
        </div>
      );
    }

    if (isCategoryIdKey(fieldKey)) {
      return (
        <div>
          <div style={label}>{title}</div>
          <select style={input} value={value || ""} onChange={(event) => update(event.target.value)}>
            <option value="">Not set</option>
            {categories.map((channel) => (
              <option key={channel.id} value={channel.id}>
                {channel.name}
              </option>
            ))}
          </select>
        </div>
      );
    }

    if (isChannelIdKey(fieldKey)) {
      return (
        <div>
          <div style={label}>{title}</div>
          <select style={input} value={value || ""} onChange={(event) => update(event.target.value)}>
            <option value="">Not set</option>
            {textChannels.map((channel) => (
              <option key={channel.id} value={channel.id}>
                #{channel.name}
              </option>
            ))}
          </select>
        </div>
      );
    }

    if (isRoleIdKey(fieldKey)) {
      return (
        <div>
          <div style={label}>{title}</div>
          <select style={input} value={value || ""} onChange={(event) => update(event.target.value)}>
            <option value="">Not set</option>
            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                @{role.name}
              </option>
            ))}
          </select>
        </div>
      );
    }

    if (/color$/i.test(fieldKey)) {
      return (
        <div>
          <div style={label}>{title}</div>
          <div style={{ display: "grid", gridTemplateColumns: "80px 1fr", gap: 10 }}>
            <input style={{ ...input, padding: 4 }} type="color" value={value || "#ff3131"} onChange={(event) => update(event.target.value)} />
            <input style={input} value={value || ""} onChange={(event) => update(event.target.value)} />
          </div>
        </div>
      );
    }

    if (looksImageField(fieldKey)) {
      return (
        <div>
          <div style={label}>{title}</div>
          <input style={input} value={value || ""} onChange={(event) => update(event.target.value)} />
          <input style={{ marginTop: 8 }} type="file" accept="image/*" onChange={onUpload} />
          {value ? (
            <div style={{ marginTop: 10 }}>
              <img src={value} alt={title} style={{ maxWidth: "100%", maxHeight: 180, borderRadius: 10, border: "1px solid #440000" }} />
            </div>
          ) : null}
        </div>
      );
    }

    if (looksLongText(fieldKey)) {
      return (
        <div>
          <div style={label}>{title}</div>
          <textarea style={{ ...input, minHeight: 120 }} value={value || ""} onChange={(event) => update(event.target.value)} />
        </div>
      );
    }

    return (
      <div>
        <div style={label}>{title}</div>
        <input style={input} value={value || ""} onChange={(event) => update(event.target.value)} />
      </div>
    );
  }

  return null;
}

export default function CatalogEngineConsole({
  engineKey,
  title,
  description,
  commandId = "",
  links = [],
}: CatalogEngineConsoleProps) {
  const spec = getEngineSpec(engineKey);
  const {
    guildId,
    guildName,
    config,
    setConfig,
    channels,
    roles,
    summary,
    details,
    loading,
    saving,
    message,
    save,
  } = useGuildEngineEditor<JsonRecord>(engineKey, {});

  if (!guildId) {
    return <div style={{ ...shell, color: "#ff8080" }}>Missing guildId. Open from /guilds first.</div>;
  }

  const entries = Object.entries(config || {});

  return (
    <section style={shell}>
      <h1 style={{ margin: 0, color: "#ff4f4f", letterSpacing: "0.10em", textTransform: "uppercase" }}>{title}</h1>
      <p style={{ marginTop: 10, color: "#ffabab" }}>{description}</p>
      <p style={{ marginTop: 0, color: "#ffbdbd" }}>
        Guild: <b>{guildName || guildId}</b>
        {commandId ? <> | Commands: <b>{commandId}</b></> : null}
      </p>

      {message ? <div style={{ marginTop: 10, color: "#ffd27a" }}>{message}</div> : null}

      {loading ? (
        <div style={card}>Loading engine runtime...</div>
      ) : (
        <>
          {spec ? (
            <EngineContractPanel
              engineKey={engineKey}
              title={title}
              intro={description}
              related={links.map((item) => ({ label: item.label, route: item.href, reason: "linked operational surface" }))}
            />
          ) : (
            <div style={card}>
              <div style={{ ...label, marginBottom: 8 }}>Runtime Contract</div>
              <div style={{ color: "#ffbcbc", lineHeight: 1.7 }}>
                This engine is using the live runtime editor without a documented catalog contract yet.
              </div>
            </div>
          )}

          <EngineInsights summary={summary} details={details} />

          <div style={card}>
            <div style={{ ...label, marginBottom: 10 }}>Live Operator Surface</div>
            <div style={{ color: "#ffbcbc", lineHeight: 1.7 }}>
              This tab is now bound to the live per-guild engine config instead of the old placeholder editor. Channel IDs, roles, limits, policy
              thresholds, templates, and image-backed presentation fields all save directly to the bot runtime for <b>{spec?.displayName || title}</b>.
            </div>
          </div>

          {entries.length ? (
            entries.map(([key, value]) => (
              <div key={key} style={card}>
                <ConfigField
                  path={[key]}
                  value={value}
                  channels={channels}
                  roles={roles}
                  update={(nextValue) => setConfig((prev) => updateAtPath(prev, [key], nextValue))}
                />
              </div>
            ))
          ) : (
            <div style={card}>
              <div style={{ color: "#ffbcbc" }}>No engine-specific overrides are saved yet. Save once to create the live runtime config for this guild.</div>
            </div>
          )}

          <div style={{ ...card, display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {links.map((item) => (
                <Link key={item.href} href={buildDashboardHref(item.href)} style={{ ...button, textDecoration: "none" }}>
                  {item.label}
                </Link>
              ))}
            </div>
            <button type="button" onClick={() => save()} disabled={saving} style={button}>
              {saving ? "Saving..." : "Save Engine"}
            </button>
          </div>
        </>
      )}
    </section>
  );
}
