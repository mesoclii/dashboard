import PremiumGate from "@/components/possum/PremiumGate";
import SecurityEngineOperator from "@/components/possum/SecurityEngineOperator";

export default function Page() {
  return (
    <PremiumGate featureKey="advanced-security" featureLabel="Advanced Security + Governance Suite">
      <SecurityEngineOperator
        engineKey="security.containment"
        title="Containment Engine"
        description="Control automated slowmode and isolation behavior when guild or category risk reaches the configured emergency threshold."
        links={[
          { href: "/dashboard/security", label: "Security" },
          { href: "/dashboard/security/risk-escalation", label: "Risk Escalation" },
          { href: "/dashboard/security/policy", label: "Security Policy" },
        ]}
      />
    </PremiumGate>
  );
}
