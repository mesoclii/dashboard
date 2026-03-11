import SecurityEngineOperator from "@/components/possum/SecurityEngineOperator";

export default function Page() {
  return (
    <SecurityEngineOperator
      engineKey="security.governance"
      title="Security Governance"
      description="Live governance state for enforcement approvals, staff-AFK emergency mode, and request queue observability."
      featureFlagKey="governanceEnabled"
      links={[
        { href: "/dashboard/security", label: "Security" },
        { href: "/dashboard/security-enforcer", label: "Security Enforcer" },
      ]}
    />
  );
}
