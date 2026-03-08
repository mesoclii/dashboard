import SecuritySubEngineConsole from "@/components/possum/SecuritySubEngineConsole";

export default function Page() {
  return (
    <SecuritySubEngineConsole
      engineKey="security.trustWeight"
      title="Trust Weight Engine"
      intro="Weights integrity, link, drift, and threat signals into the trust floor that downstream automation, escalation, and containment depend on."
      related={[
        { route: "/dashboard/security/risk-escalation", label: "Risk Escalation", reason: "trust output should match escalation triggers" },
        { route: "/dashboard/security/account-integrity", label: "Account Integrity", reason: "account-level trust should be tuned alongside global weights" },
      ]}
    />
  );
}
