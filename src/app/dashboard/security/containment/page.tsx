import SecuritySubEngineConsole from "@/components/possum/SecuritySubEngineConsole";

export default function Page() {
  return (
    <SecuritySubEngineConsole
      engineKey="security.containment"
      title="Containment Engine"
      intro="Controls automated slowmode and isolation behavior when guild or category risk reaches the configured emergency threshold."
      related={[
        { route: "/dashboard/security/escalation", label: "Escalation", reason: "containment normally follows escalation state" },
        { route: "/dashboard/security/policy", label: "Security Policy", reason: "containment behavior should match governance posture" },
      ]}
    />
  );
}
