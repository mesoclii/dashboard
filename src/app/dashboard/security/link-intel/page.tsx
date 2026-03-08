import SecuritySubEngineConsole from "@/components/possum/SecuritySubEngineConsole";

export default function Page() {
  return (
    <SecuritySubEngineConsole
      engineKey="security.linkIntel"
      title="Link Intel Engine"
      intro="Evaluates URL safety, shortener behavior, and spread velocity so suspicious links can be scored before they become a guild-wide wave."
      related={[
        { route: "/dashboard/security/threat-intel", label: "Threat Intel", reason: "domain reputation is a key threat input" },
        { route: "/dashboard/security/account-integrity", label: "Account Integrity", reason: "link risk and account trust should stay aligned" },
      ]}
    />
  );
}
