import PremiumGate from "@/components/possum/PremiumGate";
import SecurityEngineOperator from "@/components/possum/SecurityEngineOperator";

export default function Page() {
  return (
    <PremiumGate featureKey="advanced-security" featureLabel="Advanced Security + Governance Suite">
      <SecurityEngineOperator
        engineKey="security.behavioralDrift"
        title="Behavioral Drift Engine"
        description="Track message volume, content shift, and interaction pattern drift for this guild so unusual changes can feed trust and escalation scoring."
        links={[
          { href: "/dashboard/security", label: "Security" },
          { href: "/dashboard/security/risk-escalation", label: "Risk Escalation" },
        ]}
      />
    </PremiumGate>
  );
}
