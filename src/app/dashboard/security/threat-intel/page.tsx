import SecuritySubEngineConsole from "@/components/possum/SecuritySubEngineConsole";

export default function Page() {
  return (
    <SecuritySubEngineConsole
      engineKey="security.threatIntel"
      title="Threat Intel Engine"
      intro="Composes live join, link, integrity, and wave signals into a coherent threat score so the rest of the stack can react with context."
      related={[
        { route: "/dashboard/security/link-intel", label: "Link Intel", reason: "link reputation is a main threat input" },
        { route: "/dashboard/security/account-integrity", label: "Account Integrity", reason: "account trust should influence threat levels" },
      ]}
    />
  );
}
