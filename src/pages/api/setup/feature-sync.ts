import type { NextApiRequest, NextApiResponse } from "next";
import { readStore, appendAudit } from "@/lib/setupStore";

function gid(req: NextApiRequest) {
  return String(req.query.guildId || req.body?.guildId || "").trim();
}

function pick(file: string, guildId: string, fallback: any = {}) {
  const store = readStore(file);
  return store?.[guildId] ?? fallback;
}

function toBool(v: any, d = false) {
  return typeof v === "boolean" ? v : d;
}

function deriveFeatures(guildId: string) {
  const mod = pick("moderator-config.json", guildId, {});
  const wg = pick("welcome-goodbye-config.json", guildId, {});
  const tickets = pick("tickets-config.json", guildId, {});
  const tts = pick("tts-config.json", guildId, {});
  const gov = pick("governance-config.json", guildId, {});
  const games = pick("games-config.json", guildId, {});
  const gives = pick("giveaways-ui-config.json", guildId, {});
  const leaderboard = pick("leaderboard-config.json", guildId, {});
  const prog = pick("progression-config.json", guildId, {});
  const aiPricing = pick("ai-pricing-config.json", guildId, {});
  const aiPersona = pick("ai-personas-config.json", guildId, {});
  const radioBirthday = pick("radio-birthday-config.json", guildId, {});
  const heist = pick("heist-ops-config.json", guildId, {});
  const onboardingFlow = pick("onboarding-flow-config.json", guildId, {});
  const secPolicy = pick("security-policy-config.json", guildId, {});

  const securityEnabled =
    toBool(mod.active) ||
    toBool(onboardingFlow.active) ||
    toBool(wg.active) ||
    toBool(secPolicy.active);

  const onboardingEnabled = toBool(onboardingFlow.onboardingEnabled, toBool(onboardingFlow.active));
  const verificationEnabled = toBool(onboardingFlow.verificationEnabled, false);
  const lockdownEnabled = toBool(secPolicy.lockdown?.enabled, false);
  const raidEnabled = toBool(secPolicy.raid?.enabled, false);

  const economyEnabled =
    toBool(gives.active) ||
    toBool(leaderboard.active) ||
    toBool(prog.active) ||
    toBool(radioBirthday.birthday?.enabled, false);

  const features = {
    coreEnabled: true,
    securityEnabled,
    onboardingEnabled,
    verificationEnabled,
    lockdownEnabled,
    raidEnabled,
    giveawaysEnabled: toBool(gives.active),
    economyEnabled,
    heistEnabled: toBool(heist.active),
    ticketsEnabled: toBool(tickets.active),
    pokemonEnabled: toBool(games.pokemon?.enabled, false),
    pokemonPrivateOnly: toBool(games.pokemon?.privateOnly, true),
    aiEnabled: toBool(aiPricing.active) || toBool(aiPersona.active),
    ttsEnabled: toBool(tts.active),
    birthdayEnabled: toBool(radioBirthday.birthday?.enabled, false),
    governanceEnabled: toBool(gov.active),
    rareDropEnabled: toBool(games.rareDrop?.enabled, false),
    catDropEnabled: toBool(games.catDrop?.enabled, false),
    crewEnabled: toBool(gov.crew?.enabled, false),
    contractsEnabled: toBool(gov.contracts?.enabled, false),
    progressionEnabled: toBool(games.progression?.enabled, toBool(prog.active)),
  };

  return features;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const guildId = gid(req);
  if (!guildId) return res.status(400).json({ success: false, error: "guildId required" });

  const features = deriveFeatures(guildId);

  if (req.method === "GET") {
    return res.status(200).json({ success: true, guildId, features });
  }

  if (req.method === "POST") {
    try {
      const upstream = await fetch("http://127.0.0.1:3000/api/bot/dashboard-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guildId, patch: { features } })
      });
      const data = await upstream.json().catch(() => ({}));

      appendAudit({
        guildId,
        area: "feature-sync",
        action: "apply",
        keys: Object.keys(features)
      });

      return res.status(200).json({
        success: true,
        guildId,
        features,
        upstreamStatus: upstream.status,
        upstream: data
      });
    } catch (e: any) {
      return res.status(500).json({ success: false, error: e?.message || "sync failed", guildId, features });
    }
  }

  return res.status(405).json({ success: false, error: "Method not allowed" });
}
