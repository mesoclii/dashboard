"use client";

import CatalogEngineConsole from "@/components/possum/CatalogEngineConsole";
import LegacyEntityClient from "@/components/possum/LegacyEntityClient";

type QuickLink = {
  href: string;
  label: string;
};

type EngineEntityClientProps = {
  title: string;
  description: string;
  runtimeId: string;
  commandId?: string;
  links?: QuickLink[];
  profile?: "generic" | "jed";
};

const ENGINE_ALIASES: Record<string, string> = {
  "engine/blacklistEngine.js": "blacklist",
  "engine/profileEngine.js": "profile",
  "engine/runtimeRouter.js": "runtimeRouter",
  "engine/accountIntegrityEngine.js": "security.accountIntegrity",
  "engine/behavioralDriftEngine.js": "security.behavioralDrift",
  "engine/forensicsEngine.js": "security.forensics",
  "engine/crewSecurityEngine.js": "security.crewSecurity",
  "engine/linkIntelEngine.js": "security.linkIntel",
  "engine/containmentEngine.js": "security.containment",
  "engine/riskEscalationEngine.js": "security.riskEscalation",
  "engine/threatIntelEngine.js": "security.threatIntel",
  "engine/staffActivityMonitorEngine.js": "security.staffActivityMonitor",
  "engine/shadowLayerEngine.js": "security.shadowLayer",
  "engine/trustWeightEngine.js": "security.trustWeight",
};

export default function EngineEntityClient(props: EngineEntityClientProps) {
  const engineKey = ENGINE_ALIASES[String(props.runtimeId || "").trim()];

  if (engineKey) {
    return (
      <CatalogEngineConsole
        engineKey={engineKey}
        title={props.title}
        description={props.description}
        commandId={props.commandId}
        links={props.links}
      />
    );
  }

  return <LegacyEntityClient {...props} />;
}
