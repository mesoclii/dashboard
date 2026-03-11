export type EngineGroup =
  | "Guild Control"
  | "AI"
  | "Security"
  | "Automation"
  | "Community"
  | "Economy"
  | "Fun"
  | "Operations";

export type EngineDef = {
  id: string;
  label: string;
  description: string;
  group: EngineGroup;
  route: string;
  featureKey?: string;
  notes?: string;
};

export const SAVIORS_GUILD_ID = "1431799056211906582";

export const ENGINE_REGISTRY: EngineDef[] = [
  { id: "bot-personalizer", label: "Bot Personalizer", description: "Per-guild Possum AI identity, avatar, and backstory", group: "Guild Control", route: "/dashboard/bot-personalizer" },
  { id: "bot-masters", label: "Bot Masters", description: "Dashboard role/user access per guild", group: "Guild Control", route: "/dashboard/bot-masters" },
  { id: "premium-features", label: "Premium Features", description: "Public SaaS catalog showing paid vs standard features", group: "Guild Control", route: "/dashboard/premium-features" },

  { id: "onboarding", label: "Onboarding", description: "Welcome + ticket-driven join flow", group: "Security", route: "/dashboard/security/onboarding", featureKey: "onboardingEnabled" },
  { id: "verification", label: "Verification", description: "ID/verification workflows", group: "Security", route: "/dashboard/security/verification", featureKey: "verificationEnabled" },
  { id: "lockdown", label: "Lockdown", description: "Emergency channel/server controls", group: "Security", route: "/dashboard/security/lockdown", notes: "Engine-config controlled" },
  { id: "raid", label: "Raid", description: "Anti-raid burst controls", group: "Security", route: "/dashboard/security/raid", notes: "Engine-config controlled" },
  { id: "governance", label: "Governance", description: "Security governance stack master gate", group: "Security", route: "/dashboard/governance", featureKey: "governanceEnabled" },
  { id: "security-enforcer", label: "Security Enforcer", description: "Security enforcement policy and escalation runtime", group: "Security", route: "/dashboard/security-enforcer", featureKey: "governanceEnabled" },

  { id: "possum-ai", label: "Possum AI", description: "Homemade adaptive AI, memory, and runtime reply routing", group: "AI", route: "/dashboard/ai/learning" },
  { id: "persona-ai", label: "Persona AI", description: "Hosted generative persona runtime and prompt shaping", group: "AI", route: "/dashboard/ai/persona" },
  { id: "openai-platform", label: "Hosted AI Platform", description: "Provider, model, and quota-aware hosted AI controls", group: "AI", route: "/dashboard/ai/openai-platform" },
  { id: "runtime-router", label: "Runtime Router", description: "Gun/possum/vip runtime routing", group: "AI", route: "/dashboard/runtime-router" },

  { id: "automation-studio", label: "Automation Studio", description: "Visual automation builder and runtime editor", group: "Automation", route: "/dashboard/automations/studio" },
  { id: "commands", label: "!Command Studio", description: "Custom bang-command builder", group: "Automation", route: "/dashboard/commands" },
  { id: "slash-commands", label: "Slash Commands", description: "Native built-in slash command master", group: "Automation", route: "/dashboard/slash-commands" },
  { id: "panel-hub", label: "Panel Hub", description: "Panel-backed engine launch and shared deploy controls", group: "Automation", route: "/dashboard/panels" },
  { id: "event-reactor", label: "Event Reactor", description: "Scheduled event reactor controls", group: "Automation", route: "/dashboard/event-reactor" },

  { id: "moderator", label: "Moderator", description: "Separate automod, audit, and moderation control surface", group: "Community", route: "/dashboard/moderator" },
  { id: "tickets", label: "Tickets", description: "Support ticket controls", group: "Community", route: "/dashboard/tickets", notes: "Engine-config controlled" },
  { id: "selfroles", label: "Self Roles", description: "Self-role panel deployment", group: "Community", route: "/dashboard/selfroles" },
  { id: "invite", label: "Invite Tracker", description: "Invite tracking and leaderboard", group: "Community", route: "/dashboard/invite-tracker" },
  { id: "tts", label: "TTS", description: "Text-to-speech controls", group: "Community", route: "/dashboard/tts", featureKey: "ttsEnabled" },
  { id: "vip", label: "VIP", description: "VIP grants, status, expiry cleanup, and tier lifecycle", group: "Community", route: "/dashboard/vip", notes: "Separate VIP engine. Loyalty is configured on its own linked page." },

  { id: "economy", label: "Economy", description: "Economy/store/progression baseline", group: "Economy", route: "/dashboard/economy", featureKey: "economyEnabled" },
  { id: "birthday", label: "Birthday/Radio", description: "Birthday engine controls", group: "Economy", route: "/dashboard/economy/radio-birthday", featureKey: "birthdayEnabled" },
  { id: "giveaways", label: "Giveaways", description: "Giveaway engine controls", group: "Economy", route: "/dashboard/giveaways", notes: "Engine-config controlled" },
  { id: "profile", label: "Profile", description: "Profile display, rank surfaces, and stat aggregation", group: "Economy", route: "/dashboard/profile" },
  { id: "contracts", label: "Contracts", description: "Objective progression, task tracking, and contract completion flow", group: "Economy", route: "/dashboard/contracts" },
  { id: "halloffame", label: "Hall Of Fame", description: "Recognition layer for top achievers and prestige-ready members", group: "Economy", route: "/dashboard/halloffame" },
  { id: "loyalty", label: "Loyalty", description: "Retention timing, tenure rewards, and VIP-adjacent loyalty benefits", group: "Economy", route: "/dashboard/loyalty" },
  { id: "prestige", label: "Prestige", description: "Capstone reset loop and long-tail prestige reward ladder", group: "Economy", route: "/dashboard/prestige" },

  { id: "music", label: "Music", description: "Always-free multi-route music playback and queue control", group: "Fun", route: "/dashboard/music", featureKey: "musicEnabled" },
  { id: "jed", label: "Jed", description: "Sticker, emoji, gif, and asset steal/deploy controls", group: "Fun", route: "/dashboard/jed" },
  { id: "heist", label: "Heist", description: "Heist signup/session controls", group: "Fun", route: "/dashboard/heist", featureKey: "heistEnabled" },
  { id: "gta-ops", label: "GTA Ops", description: "GTA operations entity (separate from Heist signup)", group: "Fun", route: "/dashboard/gta-ops" },
  { id: "pokemon", label: "Pokemon Catching", description: "Wild spawn lanes, catch economy, and trainer intake", group: "Fun", route: "/dashboard/pokemon-catching", featureKey: "pokemonEnabled" },
  { id: "pokemon-battle", label: "Pokemon Battle", description: "Pokemon battle routing and logs", group: "Fun", route: "/dashboard/pokemon-battle", featureKey: "pokemonEnabled" },
  { id: "pokemon-trade", label: "Pokemon Trade", description: "Pokemon trade routing and logs", group: "Fun", route: "/dashboard/pokemon-trade", featureKey: "pokemonEnabled" },
  { id: "rare-drop", label: "Rare Spawn", description: "Rare spawn controls", group: "Fun", route: "/dashboard/rarespawn", featureKey: "rareDropEnabled" },
  { id: "cat-drop", label: "Cat Drop", description: "Cat drop controls", group: "Fun", route: "/dashboard/catdrop" },
  { id: "crew", label: "Crew", description: "Crew engine controls", group: "Fun", route: "/dashboard/crew" },
  { id: "dominion", label: "Dominion", description: "Dominion engine controls", group: "Fun", route: "/dashboard/dominion" },
  { id: "range", label: "Range", description: "Range game controls", group: "Fun", route: "/dashboard/range" },
  { id: "truthdare", label: "Truth Dare", description: "Truth/Dare controls", group: "Fun", route: "/dashboard/truthdare" },

  { id: "blacklist", label: "Blacklist", description: "Blacklist controls", group: "Operations", route: "/dashboard/blacklist" },
  { id: "failsafe", label: "Failsafe", description: "Failsafe emergency controls", group: "Operations", route: "/dashboard/failsafe" },
  { id: "system-health", label: "System Health", description: "Runtime monitor, drift and health checks", group: "Operations", route: "/dashboard/system-health" },
];

export const GROUP_ORDER: EngineGroup[] = [
  "Guild Control",
  "AI",
  "Automation",
  "Security",
  "Community",
  "Economy",
  "Fun",
  "Operations",
];
