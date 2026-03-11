import PremiumGate from "@/components/possum/PremiumGate";
import SecurityEngineOperator from "@/components/possum/SecurityEngineOperator";

export default function Page() {
  return (
    <PremiumGate featureKey="advanced-security" featureLabel="Advanced Security + Governance Suite">
      <SecurityEngineOperator
        engineKey="security.trustWeight"
        title="Trust Weight Engine"
        description="Weight integrity, link, drift, and threat signals into the trust floor that downstream automation, escalation, and containment depend on."
        links={[
          { href: "/dashboard/security", label: "Security" },
          { href: "/dashboard/security/risk-escalation", label: "Risk Escalation" },
          { href: "/dashboard/security/account-integrity", label: "Account Integrity" },
        ]}
      />
    </PremiumGate>
  );
}
