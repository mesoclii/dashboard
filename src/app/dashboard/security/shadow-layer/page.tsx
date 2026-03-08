import SecuritySubEngineConsole from "@/components/possum/SecuritySubEngineConsole";

export default function Page() {
  return (
    <SecuritySubEngineConsole
      engineKey="security.shadowLayer"
      title="Shadow Layer Engine"
      intro="Applies hidden suppression and interaction deny rules for high-risk users when you want quiet containment instead of visible enforcement."
      related={[
        { route: "/dashboard/security/containment", label: "Containment", reason: "shadow controls should match visible containment rules" },
        { route: "/dashboard/security/policy", label: "Security Policy", reason: "suppression should obey governance posture" },
      ]}
    />
  );
}
