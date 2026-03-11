import PremiumGate from "@/components/possum/PremiumGate";
import SecurityEngineOperator from "@/components/possum/SecurityEngineOperator";

export default function Page() {
  return (
    <PremiumGate featureKey="advanced-security" featureLabel="Advanced Security + Governance Suite">
      <SecurityEngineOperator
        engineKey="security.riskEscalation"
        title="Risk Escalation Engine"
        description="Combine trust, drift, integrity, and threat signals into user, crew, and guild escalation states with decay and threshold controls."
        links={[
          { href: "/dashboard/security", label: "Security" },
          { href: "/dashboard/security/containment", label: "Containment" },
          { href: "/dashboard/security/trust-weight", label: "Trust Weight" },
        ]}
      />
    </PremiumGate>
  );
}
