import SecurityEngineOperator from "@/components/possum/SecurityEngineOperator";

export default function Page() {
  return (
    <SecurityEngineOperator
      engineKey="lockdown"
      title="Lockdown Engine"
      description="Edit the live lockdown thresholds and exemption rules that the bot reads for this guild."
      featureFlagKey="lockdownEnabled"
      links={[
        { href: "/dashboard/security", label: "Security" },
        { href: "/dashboard/security/raid", label: "Raid Engine" },
      ]}
    />
  );
}
