import SecuritySubEngineConsole from "@/components/possum/SecuritySubEngineConsole";

export default function Page() {
  return (
    <SecuritySubEngineConsole
      engineKey="security.riskEscalation"
      title="Risk Escalation Engine"
      intro="Combines trust, drift, integrity, and threat signals into user, crew, and guild escalation states with decay and threshold controls."
      related={[
        { route: "/dashboard/security/containment", label: "Containment", reason: "containment should trigger from the escalation ladder" },
        { route: "/dashboard/security/trust-weight", label: "Trust Weight", reason: "trust output is one of the main escalation inputs" },
      ]}
    />
  );
}
