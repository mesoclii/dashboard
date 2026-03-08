import SecuritySubEngineConsole from "@/components/possum/SecuritySubEngineConsole";

export default function Page() {
  return (
    <SecuritySubEngineConsole
      engineKey="security.accountIntegrity"
      title="Account Integrity Engine"
      intro="Scores account age, profile integrity, and baseline trust signals before they flow into the broader threat and escalation pipeline."
      related={[
        { route: "/dashboard/security/engines", label: "Security Engines", reason: "see how integrity fits into the full stack" },
        { route: "/dashboard/security/trust-weight", label: "Trust Weight", reason: "integrity weighting feeds trust calculations" },
      ]}
    />
  );
}
