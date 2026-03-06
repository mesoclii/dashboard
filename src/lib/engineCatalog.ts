import { EngineSchema } from "./engineSchema";

export const engineCatalog: EngineSchema[] = [
  {
    engineId: "preOnboarding",
    displayName: "Pre-Onboarding",
    category: "Security",
    description: "Entry screening, blacklist rejoin handling, and refusal enforcement",
    controls: [
      { type: "toggle", key: "autoBanOnBlacklistRejoin", label: "Auto Ban Blacklist Rejoin" },
      { type: "toggle", key: "autoBanOnRefusalRole", label: "Auto Ban Refusal Role" },
      { type: "role", key: "refusalRoleId", label: "Refusal Role" },
      { type: "channel", key: "enforcementChannelId", label: "Enforcement Channel" },
      { type: "text", key: "contactUser", label: "Contact User" }
    ]
  },
  {
    engineId: "onboarding",
    displayName: "Onboarding",
    category: "Security",
    description: "Guild welcome flow, role gates, and channel routing",
    controls: [
      { type: "channel", key: "welcomeChannelId", label: "Welcome Channel" },
      { type: "channel", key: "rulesChannelId", label: "Rules Channel" },
      { type: "channel", key: "ticketCategoryId", label: "Ticket Category" },
      { type: "role", key: "verifiedRoleId", label: "Verified Role" },
      { type: "number", key: "idTimeoutMinutes", label: "ID Timeout Minutes" }
    ]
  },
  {
    engineId: "verification",
    displayName: "Verification",
    category: "Security",
    description: "Decline and timeout behavior for the verification gate",
    controls: [
      { type: "toggle", key: "autoKickOnDecline", label: "Auto Kick On Decline" },
      { type: "toggle", key: "autoKickOnTimeout", label: "Auto Kick On Timeout" },
      { type: "text", key: "declineKickReason", label: "Decline Kick Reason" },
      { type: "text", key: "timeoutKickReason", label: "Timeout Kick Reason" }
    ]
  },
  {
    engineId: "lockdown",
    displayName: "Lockdown",
    category: "Security",
    description: "Emergency thresholds and escalation toggles",
    controls: [
      { type: "toggle", key: "enabled", label: "Enabled" },
      { type: "number", key: "joinThresholdPerMinute", label: "Join Threshold / Minute" },
      { type: "number", key: "mentionThresholdPerMinute", label: "Mention Threshold / Minute" },
      { type: "toggle", key: "autoEscalation", label: "Auto Escalation" }
    ]
  },
  {
    engineId: "raid",
    displayName: "Raid",
    category: "Security",
    description: "Burst detection and containment automation",
    controls: [
      { type: "toggle", key: "enabled", label: "Enabled" },
      { type: "number", key: "joinBurstThreshold", label: "Join Burst Threshold" },
      { type: "number", key: "windowSeconds", label: "Window Seconds" },
      { type: "text", key: "actionPreset", label: "Action Preset" }
    ]
  },
  {
    engineId: "persona",
    displayName: "Persona",
    category: "AI",
    description: "Guild persona and webhook identity controls",
    controls: [
      { type: "text", key: "guildNickname", label: "Guild Nickname" },
      { type: "text", key: "webhookName", label: "Webhook Name" },
      { type: "text", key: "webhookAvatarUrl", label: "Webhook Avatar URL" },
      { type: "toggle", key: "useWebhookPersona", label: "Use Webhook Persona" }
    ]
  },
  {
    engineId: "giveaways",
    displayName: "Giveaways",
    category: "Economy",
    description: "Default giveaway channel and panel image configuration",
    controls: [
      { type: "toggle", key: "enabled", label: "Enabled" },
      { type: "channel", key: "defaultChannelId", label: "Default Channel" },
      { type: "channel", key: "ticketChannelId", label: "Ticket Channel" },
      { type: "text", key: "defaultImageUrl", label: "Default Image URL" }
    ]
  },
  {
    engineId: "tts",
    displayName: "TTS",
    category: "Access",
    description: "TTS runtime enablement",
    controls: [
      { type: "toggle", key: "enabled", label: "Enabled" }
    ]
  }
];
