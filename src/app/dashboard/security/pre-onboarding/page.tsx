import SecurityEngineOperator from "@/components/possum/SecurityEngineOperator";

export default function Page() {
  return (
    <SecurityEngineOperator
      engineKey="preOnboarding"
      title="Pre-Onboarding Enforcement"
      description="Edit the live blacklist-rejoin, refusal-role, and enforcement-channel rules that the pre-onboarding enforcement runtime uses for this guild."
      featureFlagKey="securityEnabled"
      links={[
        { href: "/dashboard/security", label: "Security" },
        { href: "/dashboard/security/onboarding", label: "Onboarding" },
        { href: "/dashboard/security/verification", label: "Verification" },
      ]}
    />
  );
}
