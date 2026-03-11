import SecurityEngineOperator from "@/components/possum/SecurityEngineOperator";

export default function Page() {
  return (
    <SecurityEngineOperator
      engineKey="security.threatIntel"
      title="Threat Intel Engine"
      description="Compose live join, link, integrity, and wave signals into a coherent threat score so the rest of the stack can react with context."
      links={[
        { href: "/dashboard/security", label: "Security" },
        { href: "/dashboard/security/link-intel", label: "Link Intel" },
        { href: "/dashboard/security/account-integrity", label: "Account Integrity" },
      ]}
    />
  );
}
