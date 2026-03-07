import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";

type PersonaStore = {
  settings: {
    autoReplyEnabled: boolean;
    mentionOnly: boolean;
  };
  personas: Record<string, any>;
};

function resolvePersonaFile(): string {
  const explicit = String(process.env.BOT_PERSONA_FILE || "").trim();
  const candidates = [
    explicit,
    path.resolve(process.cwd(), "../modules/data/personas.json"),
    path.resolve(process.cwd(), "../Negan Bot/modules/data/personas.json"),
    path.resolve(process.cwd(), "../Negan-Bot/modules/data/personas.json"),
    path.resolve(process.cwd(), "../negan-bot/modules/data/personas.json"),
  ].filter(Boolean);

  for (const candidate of candidates) {
    try {
      if (fs.existsSync(candidate)) return candidate;
    } catch {}
  }

  return candidates[1] || candidates[0] || path.resolve(process.cwd(), "personas.json");
}

const PERSONA_FILE = resolvePersonaFile();

function readStore(): PersonaStore {
  try {
    const raw = JSON.parse(fs.readFileSync(PERSONA_FILE, "utf8"));
    return {
      settings: {
        autoReplyEnabled: Boolean(raw?.settings?.autoReplyEnabled),
        mentionOnly: raw?.settings?.mentionOnly !== false,
      },
      personas: raw?.personas && typeof raw.personas === "object" ? raw.personas : {},
    };
  } catch {
    return {
      settings: {
        autoReplyEnabled: false,
        mentionOnly: true,
      },
      personas: {},
    };
  }
}

function summarizePersonas(personas: Record<string, any>) {
  return Object.values(personas || {})
    .filter((persona) => persona && typeof persona === "object")
    .map((persona: any) => ({
      key: String(persona.key || "").trim(),
      name: String(persona.name || persona.key || "Unnamed Persona").trim(),
      enabled: persona.enabled !== false,
      bio: String(persona.bio || "").trim(),
      triggerCount: Array.isArray(persona.triggers) ? persona.triggers.filter(Boolean).length : 0,
      mentionRequired: persona.mentionRequired !== false,
      imageConfigured: Boolean(String(persona.imageUrl || "").trim()),
      allowedRoleCount: Array.isArray(persona?.access?.allowedRoles) ? persona.access.allowedRoles.filter(Boolean).length : 0,
      allowedChannelCount: Array.isArray(persona?.access?.allowedChannels) ? persona.access.allowedChannels.filter(Boolean).length : 0,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "GET") {
      return res.status(405).json({ success: false, error: "Method not allowed" });
    }

    const guildId = String(req.query.guildId || "").trim();
    if (!guildId) {
      return res.status(400).json({ success: false, error: "guildId is required" });
    }

    const store = readStore();
    const personas = summarizePersonas(store.personas);

    return res.status(200).json({
      success: true,
      guildId,
      config: {
        settings: store.settings,
        personaCount: personas.length,
        personas,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || "Failed to load AI persona runtime" });
  }
}
