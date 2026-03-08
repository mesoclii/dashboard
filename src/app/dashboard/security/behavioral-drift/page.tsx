import SecuritySubEngineConsole from "@/components/possum/SecuritySubEngineConsole";

export default function Page() {
  return (
    <SecuritySubEngineConsole
      engineKey="security.behavioralDrift"
      title="Behavioral Drift Engine"
      intro="Tracks message volume, content shift, and interaction pattern drift so unusual changes can be fed into trust and escalation scoring."
      related={[
        { route: "/dashboard/security/engines", label: "Security Engines", reason: "keep drift tuned alongside the rest of the stack" },
        { route: "/dashboard/security/risk-escalation", label: "Risk Escalation", reason: "drift contributes directly to escalation" },
      ]}
    />
  );
}
