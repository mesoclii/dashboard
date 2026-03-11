import SecurityEngineOperator from "@/components/possum/SecurityEngineOperator";

export default function Page() {
  return (
    <SecurityEngineOperator
      engineKey="security.forensics"
      title="Forensics Engine"
      description="Collect destructive audit-log bursts, moderation anomalies, and trace evidence so incidents can be reconstructed after the fact."
      links={[
        { href: "/dashboard/security", label: "Security" },
        { href: "/dashboard/security/audit-trail", label: "Audit Trail" },
        { href: "/dashboard/security/staff-activity", label: "Staff Activity" },
      ]}
    />
  );
}
