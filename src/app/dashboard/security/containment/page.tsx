import SecurityEngineOperator from "@/components/possum/SecurityEngineOperator";

export default function Page() {
  return (
    <SecurityEngineOperator
      engineKey="security.containment"
      title="Containment Engine"
      description="Control automated slowmode and isolation behavior when guild or category risk reaches the configured emergency threshold."
      links={[
        { href: "/dashboard/security", label: "Security" },
        { href: "/dashboard/security/escalation", label: "Escalation" },
        { href: "/dashboard/security/policy", label: "Security Policy" },
      ]}
    />
  );
}
