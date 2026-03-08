import rawCatalog from "@/data/dashboard-engines.json";

export type EngineTriggerType =
  | "slash"
  | "message"
  | "member_event"
  | "audit_event"
  | "scheduled"
  | "api"
  | "button"
  | "select"
  | "modal"
  | "panel"
  | "guild events"
  | "event";

export type EngineDependencySpec = {
  services?: string[];
  envVars?: string[];
  runtimeFlags?: string[];
};

export type DashboardEngineSpec = {
  engineKey: string;
  displayName: string;
  category: string;
  featureFlag: string;
  configKey: string;
  premiumRequired: boolean;
  privateOnly: boolean;
  enabledByDefault: boolean;
  triggerTypes: string[];
  entrypoints: string[];
  hardDependencies: EngineDependencySpec;
  decisionLogic: string;
  stateMutations: string[];
  persistence: string[];
  outputs: string[];
  failureModes: string[];
};

type RawCatalog = {
  schemaVersion?: string;
  generatedFor?: string;
  notes?: string[];
  sourceFiles?: string[];
  engines?: Array<{
    key?: string;
    name?: string;
    category?: string;
    featureFlag?: string;
    configKey?: string;
    premiumRequired?: boolean;
    privateOnly?: boolean;
    enabledByDefault?: boolean;
    triggerTypes?: string[];
    entrypoints?: string[];
    dependencies?: EngineDependencySpec;
    decisionLogic?: string;
    stateMutations?: string[];
    persistence?: string[];
    outputs?: string[];
    failureModes?: string[];
  }>;
};

const catalog = rawCatalog as RawCatalog;

export const ENGINE_CATALOG_SCHEMA_VERSION = String(catalog.schemaVersion || "1.0.0");
export const ENGINE_CATALOG_GENERATED_FOR = String(catalog.generatedFor || "Possum Bot");
export const ENGINE_CATALOG_NOTES = Array.isArray(catalog.notes) ? catalog.notes : [];
export const ENGINE_CATALOG_SOURCES = Array.isArray(catalog.sourceFiles) ? catalog.sourceFiles : [];

export const ENGINE_CATALOG: DashboardEngineSpec[] = (Array.isArray(catalog.engines) ? catalog.engines : []).map((engine) => ({
  engineKey: String(engine?.key || "").trim(),
  displayName: String(engine?.name || engine?.key || "Unknown Engine").trim(),
  category: String(engine?.category || "uncategorized").trim(),
  featureFlag: String(engine?.featureFlag || "").trim(),
  configKey: String(engine?.configKey || "").trim(),
  premiumRequired: Boolean(engine?.premiumRequired),
  privateOnly: Boolean(engine?.privateOnly),
  enabledByDefault: Boolean(engine?.enabledByDefault),
  triggerTypes: Array.isArray(engine?.triggerTypes) ? engine!.triggerTypes!.map((value) => String(value)) : [],
  entrypoints: Array.isArray(engine?.entrypoints) ? engine!.entrypoints!.map((value) => String(value)) : [],
  hardDependencies: {
    services: Array.isArray(engine?.dependencies?.services) ? engine!.dependencies!.services!.map((value) => String(value)) : [],
    envVars: Array.isArray(engine?.dependencies?.envVars) ? engine!.dependencies!.envVars!.map((value) => String(value)) : [],
    runtimeFlags: Array.isArray(engine?.dependencies?.runtimeFlags) ? engine!.dependencies!.runtimeFlags!.map((value) => String(value)) : [],
  },
  decisionLogic: String(engine?.decisionLogic || "").trim(),
  stateMutations: Array.isArray(engine?.stateMutations) ? engine!.stateMutations!.map((value) => String(value)) : [],
  persistence: Array.isArray(engine?.persistence) ? engine!.persistence!.map((value) => String(value)) : [],
  outputs: Array.isArray(engine?.outputs) ? engine!.outputs!.map((value) => String(value)) : [],
  failureModes: Array.isArray(engine?.failureModes) ? engine!.failureModes!.map((value) => String(value)) : [],
})).filter((engine) => engine.engineKey);

export const ENGINE_CATALOG_BY_KEY = Object.fromEntries(
  ENGINE_CATALOG.map((engine) => [engine.engineKey, engine])
) as Record<string, DashboardEngineSpec>;

export type ProgressionStackKey =
  | "progression"
  | "achievements"
  | "hallOfFame"
  | "loyalty"
  | "prestige";

export const PROGRESSION_STACK: Array<{
  key: ProgressionStackKey;
  route: string;
  label: string;
}> = [
  { key: "progression", route: "/dashboard/economy/progression", label: "Progression" },
  { key: "achievements", route: "/dashboard/achievements", label: "Achievements" },
  { key: "hallOfFame", route: "/dashboard/halloffame", label: "Hall Of Fame" },
  { key: "loyalty", route: "/dashboard/loyalty", label: "Loyalty" },
  { key: "prestige", route: "/dashboard/prestige", label: "Prestige" },
];

export function getEngineSpec(engineKey: string): DashboardEngineSpec | null {
  return ENGINE_CATALOG_BY_KEY[String(engineKey || "").trim()] || null;
}

export function getProgressionStackSpecs(): DashboardEngineSpec[] {
  return PROGRESSION_STACK.map((item) => getEngineSpec(item.key)).filter((item): item is DashboardEngineSpec => Boolean(item));
}

export function formatEngineList(items: string[], fallback = "Not defined"): string {
  const cleaned = items.map((item) => String(item || "").trim()).filter(Boolean);
  return cleaned.length ? cleaned.join(", ") : fallback;
}

