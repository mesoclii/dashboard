import { ENGINE_REGISTRY } from "@/lib/dashboard/engineRegistry";

export type PremiumFeature = {
  id: string;
  label: string;
  route: string;
  summary: string;
  premiumLabel: string;
};

export type StandardFeature = {
  id: string;
  label: string;
  route: string;
  summary: string;
};

export const PREMIUM_FEATURES: PremiumFeature[] = [
  {
    id: "tts",
    label: "TTS Engine",
    route: "/dashboard/tts",
    summary: "Voice playback channels, speech routing, and text-to-speech runtime controls.",
    premiumLabel: "Premium Add-On",
  },
  {
    id: "persona-ai",
    label: "Persona Engine AI",
    route: "/dashboard/ai/persona",
    summary: "OpenAI-powered persona responses, backstory shaping, and live persona prompt behavior.",
    premiumLabel: "Premium Add-On",
  },
  {
    id: "heist",
    label: "Heist Engine",
    route: "/dashboard/heist",
    summary: "Heist signup/session gameplay controls. GTA Ops stays separate and is not bundled into this premium item.",
    premiumLabel: "Premium Add-On",
  },
];

const PREMIUM_ROUTE_SET = new Set(PREMIUM_FEATURES.map((feature) => feature.route));
const EXCLUDED_ROUTE_SET = new Set([
  "/dashboard/pokemon-catching",
  "/dashboard/pokemon-battle",
  "/dashboard/pokemon-trade",
]);

export const STANDARD_FEATURES: StandardFeature[] = ENGINE_REGISTRY
  .filter((engine) => !PREMIUM_ROUTE_SET.has(engine.route) && !EXCLUDED_ROUTE_SET.has(engine.route))
  .map((engine) => ({
    id: engine.id,
    label: engine.label,
    route: engine.route,
    summary: engine.description,
  }));
