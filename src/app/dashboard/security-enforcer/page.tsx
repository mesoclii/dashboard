import SecurityEngineOperator from "@/components/possum/SecurityEngineOperator";

export default function Page() {
  return (
    <SecurityEngineOperator
      engineKey="security.enforcer"
      title="Security Enforcer"
      description="Live enforcement queue and execution surface for security decisions."
      featureFlagKey="governanceEnabled"
      links={[
        { href: "/dashboard/security", label: "Security" },
        { href: "/dashboard/governance", label: "Governance" },
        { href: "/dashboard/security/shadow-layer", label: "Shadow Layer" },
      ]}
    />
  );
}
