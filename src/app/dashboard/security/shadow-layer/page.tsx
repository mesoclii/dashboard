import SecurityEngineOperator from "@/components/possum/SecurityEngineOperator";

export default function Page() {
  return (
    <SecurityEngineOperator
      engineKey="security.shadowLayer"
      title="Shadow Layer Engine"
      description="Apply hidden suppression and interaction deny rules for high-risk users when you want quiet containment instead of visible enforcement."
      links={[
        { href: "/dashboard/security", label: "Security" },
        { href: "/dashboard/security/containment", label: "Containment" },
        { href: "/dashboard/security/policy", label: "Security Policy" },
      ]}
    />
  );
}
