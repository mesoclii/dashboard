import type { NextApiRequest, NextApiResponse } from "next";
import { isWriteBlockedForGuild, stockLockError } from "@/lib/guildPolicy";
import { BOT_API, buildBotApiHeaders, readJsonSafe } from "@/lib/botApi";

type OnboardingFlowConfig = {
  onboardingEnabled: boolean;
  verificationEnabled: boolean;
  sendWelcomeDm: boolean;
  channels: {
    welcomeChannelId: string;
    mainChatChannelId: string;
    rulesChannelId: string;
    idChannelId: string;
    ticketCategoryId: string;
    transcriptChannelId: string;
    logChannelId: string;
    hostingLegacyChannelId: string;
    hostingEnhancedChannelId: string;
    staffIntroChannelId: string;
    selfRolesChannelId: string;
    botGuideChannelId: string;
    updatesChannelId: string;
    funChannelId: string;
    subscriptionChannelId: string;
  };
  roles: {
    verifiedRoleId: string;
    declineRoleId: string;
    staffRoleIds: string[];
    removeOnVerifyRoleIds: string[];
  };
  templates: {
    dmTemplate: string;
    panelTitle: string;
    panelDescription: string;
    panelFooter: string;
    gateAnnouncementTemplate: string;
    idPanelTitle: string;
    idPanelDescription: string;
    idPanelContent: string;
    postVerifyTemplate: string;
  };
  verification: {
    idTimeoutMinutes: number;
    autoKickOnDecline: boolean;
    autoKickOnTimeout: boolean;
    declineKickReason: string;
    timeoutKickReason: string;
    declineReplyTemplate: string;
  };
};

const DEFAULT_CFG: OnboardingFlowConfig = {
  onboardingEnabled: true,
  verificationEnabled: true,
  sendWelcomeDm: true,
  channels: {
    welcomeChannelId: "",
    mainChatChannelId: "",
    rulesChannelId: "",
    idChannelId: "",
    ticketCategoryId: "",
    transcriptChannelId: "",
    logChannelId: "",
    hostingLegacyChannelId: "",
    hostingEnhancedChannelId: "",
    staffIntroChannelId: "",
    selfRolesChannelId: "",
    botGuideChannelId: "",
    updatesChannelId: "",
    funChannelId: "",
    subscriptionChannelId: "",
  },
  roles: {
    verifiedRoleId: "",
    declineRoleId: "",
    staffRoleIds: [],
    removeOnVerifyRoleIds: [],
  },
  templates: {
    dmTemplate: "Welcome to {{guildName}}. Start onboarding in <#{{welcomeChannelId}}>",
    panelTitle: "Welcome to {{guildName}}",
    panelDescription: "Read the rules in <#{{rulesChannelId}}> and continue.",
    panelFooter: "Complete onboarding to unlock the server.",
    gateAnnouncementTemplate: "Survivor <@{{userId}}> has reached the gates.",
    idPanelTitle: "ID Verification - Final Gate",
    idPanelDescription: "<@{{userId}}> choose how you proceed.",
    idPanelContent: "Survivor <@{{userId}}>",
    postVerifyTemplate: "<@{{userId}}> is now verified. Welcome to {{guildName}}.",
  },
  verification: {
    idTimeoutMinutes: 30,
    autoKickOnDecline: true,
    autoKickOnTimeout: true,
    declineKickReason: "Declined ID verification",
    timeoutKickReason: "ID submission timeout",
    declineReplyTemplate: "You declined ID verification.",
  },
};

function asBool(v: any, fallback: boolean): boolean {
  return typeof v === "boolean" ? v : fallback;
}
function asNum(v: any, fallback: number): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}
function asArr(v: any): string[] {
  return Array.isArray(v) ? v.map((x) => String(x).trim()).filter(Boolean) : [];
}
function asStr(v: any, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

function mergeConfig(dash: any, onboarding: any, verification: any): OnboardingFlowConfig {
  const features = dash?.config?.features || {};
  const secOnboarding = dash?.config?.security?.onboarding || {};
  const on = onboarding?.config || {};
  const vr = verification?.config || {};

  return {
    onboardingEnabled: asBool(features?.onboardingEnabled, DEFAULT_CFG.onboardingEnabled),
    verificationEnabled: asBool(features?.verificationEnabled, DEFAULT_CFG.verificationEnabled),
    sendWelcomeDm: asBool(secOnboarding?.sendWelcomeDm, DEFAULT_CFG.sendWelcomeDm),
    channels: {
      welcomeChannelId: asStr(on?.welcomeChannelId, asStr(secOnboarding?.welcomeChannelId, "")),
      mainChatChannelId: asStr(on?.mainChatChannelId, ""),
      rulesChannelId: asStr(on?.rulesChannelId, asStr(secOnboarding?.rulesChannelId, "")),
      idChannelId: asStr(on?.idChannelId, ""),
      ticketCategoryId: asStr(on?.ticketCategoryId, ""),
      transcriptChannelId: asStr(on?.transcriptChannelId, ""),
      logChannelId: asStr(on?.logChannelId, asStr(secOnboarding?.logChannelId, "")),
      hostingLegacyChannelId: asStr(on?.hostingLegacyChannelId, ""),
      hostingEnhancedChannelId: asStr(on?.hostingEnhancedChannelId, ""),
      staffIntroChannelId: asStr(on?.staffIntroChannelId, ""),
      selfRolesChannelId: asStr(on?.selfRolesChannelId, ""),
      botGuideChannelId: asStr(on?.botGuideChannelId, ""),
      updatesChannelId: asStr(on?.updatesChannelId, ""),
      funChannelId: asStr(on?.funChannelId, ""),
      subscriptionChannelId: asStr(on?.subscriptionChannelId, ""),
    },
    roles: {
      verifiedRoleId: asStr(on?.verifiedRoleId, ""),
      declineRoleId: asStr(on?.declineRoleId, ""),
      staffRoleIds: asArr(on?.staffRoleIds),
      removeOnVerifyRoleIds: asArr(on?.removeOnVerifyRoleIds),
    },
    templates: {
      dmTemplate: asStr(on?.dmTemplate, DEFAULT_CFG.templates.dmTemplate),
      panelTitle: asStr(on?.panelTitle, DEFAULT_CFG.templates.panelTitle),
      panelDescription: asStr(on?.panelDescription, DEFAULT_CFG.templates.panelDescription),
      panelFooter: asStr(on?.panelFooter, DEFAULT_CFG.templates.panelFooter),
      gateAnnouncementTemplate: asStr(on?.gateAnnouncementTemplate, DEFAULT_CFG.templates.gateAnnouncementTemplate),
      idPanelTitle: asStr(on?.idPanelTitle, DEFAULT_CFG.templates.idPanelTitle),
      idPanelDescription: asStr(on?.idPanelDescription, DEFAULT_CFG.templates.idPanelDescription),
      idPanelContent: asStr(on?.idPanelContent, DEFAULT_CFG.templates.idPanelContent),
      postVerifyTemplate: asStr(on?.postVerifyTemplate, DEFAULT_CFG.templates.postVerifyTemplate),
    },
    verification: {
      idTimeoutMinutes: asNum(on?.idTimeoutMinutes, DEFAULT_CFG.verification.idTimeoutMinutes),
      autoKickOnDecline: asBool(vr?.autoKickOnDecline, DEFAULT_CFG.verification.autoKickOnDecline),
      autoKickOnTimeout: asBool(vr?.autoKickOnTimeout, DEFAULT_CFG.verification.autoKickOnTimeout),
      declineKickReason: asStr(vr?.declineKickReason, DEFAULT_CFG.verification.declineKickReason),
      timeoutKickReason: asStr(vr?.timeoutKickReason, DEFAULT_CFG.verification.timeoutKickReason),
      declineReplyTemplate: asStr(vr?.declineReplyTemplate, DEFAULT_CFG.verification.declineReplyTemplate),
    },
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const guildId =
      req.method === "GET"
        ? String(req.query.guildId || "").trim()
        : String(req.body?.guildId || "").trim();

    if (!guildId) {
      return res.status(400).json({ success: false, error: "guildId is required" });
    }

    if (req.method !== "GET" && isWriteBlockedForGuild(guildId)) {
      return res.status(403).json(stockLockError(guildId));
    }

    if (req.method === "GET") {
      const [dashRes, onRes, verRes] = await Promise.all([
        fetch(`${BOT_API}/dashboard-config?guildId=${encodeURIComponent(guildId)}`, { headers: buildBotApiHeaders(req), cache: "no-store" }),
        fetch(`${BOT_API}/engine-config?guildId=${encodeURIComponent(guildId)}&engine=onboarding`, { headers: buildBotApiHeaders(req), cache: "no-store" }),
        fetch(`${BOT_API}/engine-config?guildId=${encodeURIComponent(guildId)}&engine=verification`, { headers: buildBotApiHeaders(req), cache: "no-store" }),
      ]);

      const [dash, onboarding, verification] = await Promise.all([
        readJsonSafe(dashRes),
        readJsonSafe(onRes),
        readJsonSafe(verRes),
      ]);

      const cfg = mergeConfig(dash, onboarding, verification);
      return res.status(200).json({ success: true, guildId, config: cfg });
    }

    if (req.method === "POST") {
      const patch = req.body?.patch || {};
      const next: OnboardingFlowConfig = {
        ...DEFAULT_CFG,
        ...patch,
        channels: { ...DEFAULT_CFG.channels, ...(patch.channels || {}) },
        roles: {
          ...DEFAULT_CFG.roles,
          ...(patch.roles || {}),
          staffRoleIds: asArr(patch?.roles?.staffRoleIds),
          removeOnVerifyRoleIds: asArr(patch?.roles?.removeOnVerifyRoleIds),
        },
        templates: { ...DEFAULT_CFG.templates, ...(patch.templates || {}) },
        verification: { ...DEFAULT_CFG.verification, ...(patch.verification || {}) },
      };

      const dashPatch = {
        features: {
          onboardingEnabled: !!next.onboardingEnabled,
          verificationEnabled: !!next.verificationEnabled,
        },
        security: {
          onboarding: {
            enabled: !!next.onboardingEnabled,
            sendWelcomeDm: !!next.sendWelcomeDm,
            welcomeChannelId: next.channels.welcomeChannelId,
            rulesChannelId: next.channels.rulesChannelId,
            logChannelId: next.channels.logChannelId,
            welcomeMessageTemplate: next.templates.panelDescription,
            dmTemplate: next.templates.dmTemplate,
          },
          verification: {
            enabled: !!next.verificationEnabled,
            idTimeoutMinutes: Number(next.verification.idTimeoutMinutes || 30),
            autoKickOnTimeout: !!next.verification.autoKickOnTimeout,
            declineAction: next.verification.autoKickOnDecline ? "kick" : "timeout",
          },
        },
      };

      const onboardingConfig = {
        ...next.channels,
        ...next.roles,
        ...next.templates,
        idTimeoutMinutes: Number(next.verification.idTimeoutMinutes || 30),
        dmTemplate: next.templates.dmTemplate,
      };

      const verificationConfig = {
        autoKickOnDecline: !!next.verification.autoKickOnDecline,
        autoKickOnTimeout: !!next.verification.autoKickOnTimeout,
        declineKickReason: next.verification.declineKickReason,
        timeoutKickReason: next.verification.timeoutKickReason,
        declineReplyTemplate: next.verification.declineReplyTemplate,
      };

      const [dashSave, onSave, verSave] = await Promise.all([
        fetch(`${BOT_API}/dashboard-config`, {
          method: "POST",
          headers: buildBotApiHeaders(req, { json: true }),
          body: JSON.stringify({ guildId, patch: dashPatch }),
        }),
        fetch(`${BOT_API}/engine-config`, {
          method: "POST",
          headers: buildBotApiHeaders(req, { json: true }),
          body: JSON.stringify({ guildId, engine: "onboarding", config: onboardingConfig }),
        }),
        fetch(`${BOT_API}/engine-config`, {
          method: "POST",
          headers: buildBotApiHeaders(req, { json: true }),
          body: JSON.stringify({ guildId, engine: "verification", config: verificationConfig }),
        }),
      ]);

      const [dashJson, onJson, verJson] = await Promise.all([
        readJsonSafe(dashSave),
        readJsonSafe(onSave),
        readJsonSafe(verSave),
      ]);

      if (!dashSave.ok || dashJson?.success === false) {
        return res.status(502).json({ success: false, error: dashJson?.error || "dashboard-config save failed" });
      }
      if (!onSave.ok || onJson?.success === false) {
        return res.status(502).json({ success: false, error: onJson?.error || "onboarding engine save failed" });
      }
      if (!verSave.ok || verJson?.success === false) {
        return res.status(502).json({ success: false, error: verJson?.error || "verification engine save failed" });
      }

      return res.status(200).json({ success: true, guildId, config: next });
    }

    return res.status(405).json({ success: false, error: "Method not allowed" });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || "Internal error" });
  }
}
