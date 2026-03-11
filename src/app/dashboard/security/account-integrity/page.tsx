import SecurityEngineOperator from "@/components/possum/SecurityEngineOperator";

export default function Page() {
  return (
    <SecurityEngineOperator
      engineKey="security.accountIntegrity"
      title="Account Integrity Engine"
      description="Score account age, profile integrity, and baseline trust signals for this guild before those signals flow into the broader threat and escalation pipeline."
      links={[
        { href: "/dashboard/security", label: "Security" },
        { href: "/dashboard/security/trust-weight", label: "Trust Weight" },
      ]}
    />
  );
}
