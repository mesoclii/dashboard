import { ENGINE_REGISTRY } from "@/lib/dashboard/engineRegistry";

export type FeatureCatalogEntry = {
  id: string;
  label: string;
  route: string;
  summary: string;
};

export type PremiumFeature = FeatureCatalogEntry & {
  premiumLabel: string;
  includedIn: string[];
  pricingNote: string;
};

export type SubscriptionPlan = {
  id: string;
  label: string;
  monthlyUsd: number | null;
  yearlyUsd: number | null;
  lifetimeUsd: number | null;
  headline: string;
  included: string[];
  note: string;
};

export const PRICING_FOOTNOTE =
  "Prices are subject to change based on availability, operating cost, and service load. One license covers all guilds owned or staffed by the purchasing account.";

export const PREMIUM_FEATURES: PremiumFeature[] = [
  {
    id: "tts",
    label: "TTS Engine",
    route: "/dashboard/tts",
    summary: "Voice playback channels, speech routing, queue rules, and live text-to-speech controls.",
    premiumLabel: "Premium Feature",
    includedIn: ["Pro", "Business", "Enterprise"],
    pricingNote: "Included through paid guild plans."
  },
  {
    id: "openai-platform",
    label: "AI Platform",
    route: "/dashboard/ai/openai-platform",
    summary: "Model provider routing, platform toggles, and quota-aware AI delivery controls.",
    premiumLabel: "Premium Feature",
    includedIn: ["Pro", "Business", "Enterprise"],
    pricingNote: "Provider controls remain separate from Possum AI."
  },
  {
    id: "persona-ai",
    label: "Persona AI",
    route: "/dashboard/ai/persona",
    summary: "Hosted generative persona replies, prompt shaping, access rules, persona photos, and custom backstory behavior.",
    premiumLabel: "Premium Feature",
    includedIn: ["Pro", "Business", "Enterprise"],
    pricingNote: "Separate from Possum AI and Bot Personalizer."
  },
  {
    id: "heist",
    label: "Heist Engine",
    route: "/dashboard/heist",
    summary: "Heist signup rotations, channel routing, logging, and event-session controls. GTA Ops stays separate.",
    premiumLabel: "Premium Feature",
    includedIn: ["Pro", "Business", "Enterprise"],
    pricingNote: "Guild signup engine only."
  }
];

export const PREMIUM_PLANS: SubscriptionPlan[] = [
  {
    id: "pro",
    label: "Pro",
    monthlyUsd: 9.99,
    yearlyUsd: 99.0,
    lifetimeUsd: 299.0,
    headline: "Premium engagement and threat protection for growing communities.",
    included: [
      "TTS Engine",
      "Persona AI",
      "Heist Engine",
      "AI Platform",
      "Included monthly AI usage credit",
    ],
    note: PRICING_FOOTNOTE,
  },
  {
    id: "business",
    label: "Business",
    monthlyUsd: 19.99,
    yearlyUsd: 199.0,
    lifetimeUsd: 499.0,
    headline: "Adds governance automation and higher included usage for active servers.",
    included: [
      "Everything in Pro",
      "Higher included monthly AI usage credit",
      "Expanded concurrency limits",
    ],
    note: PRICING_FOOTNOTE,
  },
  {
    id: "enterprise",
    label: "Enterprise",
    monthlyUsd: 39.99,
    yearlyUsd: 399.0,
    lifetimeUsd: 999.0,
    headline: "Priority control for serious communities with custom support and pooled usage.",
    included: [
      "Everything in Business",
      "Priority support",
      "Higher pooled monthly AI usage credit",
      "Custom operational limits",
    ],
    note: `${PRICING_FOOTNOTE} Contact for custom limits and annual contracts.`,
  },
];

const PREMIUM_ROUTE_SET = new Set(PREMIUM_FEATURES.map((feature) => feature.route));
const PRIVATE_ROUTE_SET = new Set([
  "/dashboard/pokemon-catching",
  "/dashboard/pokemon-battle",
  "/dashboard/pokemon-trade",
]);
const EXCLUDED_PUBLIC_ROUTE_SET = new Set([
  "/dashboard/premium-features",
  "/dashboard/ai",
  "/dashboard/system-health",
]);

const STANDARD_MANUAL_FEATURES: FeatureCatalogEntry[] = [
  {
    id: "possum-ai",
    label: "Possum AI",
    route: "/dashboard/ai/learning",
    summary: "Homemade adaptive AI and bot knowledge base with learned tone, stored knowledge, and runtime reply routing."
  },
];

export const STANDARD_FEATURES: FeatureCatalogEntry[] = [
  ...STANDARD_MANUAL_FEATURES,
  ...ENGINE_REGISTRY
    .filter((engine) => !PREMIUM_ROUTE_SET.has(engine.route))
    .filter((engine) => !PRIVATE_ROUTE_SET.has(engine.route))
    .filter((engine) => !EXCLUDED_PUBLIC_ROUTE_SET.has(engine.route))
    .map((engine) => ({
      id: engine.id,
      label: engine.label,
      route: engine.route,
      summary: engine.description,
    })),
];
