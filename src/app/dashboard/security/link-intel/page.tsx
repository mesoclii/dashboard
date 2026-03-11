import SecurityEngineOperator from "@/components/possum/SecurityEngineOperator";

export default function Page() {
  return (
    <SecurityEngineOperator
      engineKey="security.linkIntel"
      title="Link Intel Engine"
      description="Evaluate URL safety, shortener behavior, and spread velocity so suspicious links can be scored before they become a guild-wide wave."
      links={[
        { href: "/dashboard/security", label: "Security" },
        { href: "/dashboard/security/threat-intel", label: "Threat Intel" },
        { href: "/dashboard/security/account-integrity", label: "Account Integrity" },
      ]}
    />
  );
}
