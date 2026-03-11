const ENGINE_ALIAS_MAP: Record<string, string> = {
  runtimeRouter: "aiRuntime",
  possumAi: "aiRuntime",
  adaptiveAi: "aiRuntime",
  personaEngine: "persona",
  personaAi: "persona",
  botPersonalizer: "botPersonalizer",
};

export function normalizeEngineKey(raw: string): string {
  const key = String(raw || "").trim();
  if (!key) return "";
  return ENGINE_ALIAS_MAP[key] || key;
}
