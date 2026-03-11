import SecurityEngineOperator from "@/components/possum/SecurityEngineOperator";

export default function Page() {
  return (
    <SecurityEngineOperator
      engineKey="raid"
      title="Raid Engine"
      description="Edit the live anti-raid thresholds, exemption lists, and escalation preset that the bot reads for this guild."
      featureFlagKey="raidEnabled"
      links={[
        { href: "/dashboard/security", label: "Security" },
        { href: "/dashboard/security/lockdown", label: "Lockdown Engine" },
      ]}
    />
  );
}
