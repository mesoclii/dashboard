import SecuritySubEngineConsole from "@/components/possum/SecuritySubEngineConsole";

export default function Page() {
  return (
    <SecuritySubEngineConsole
      engineKey="security.forensics"
      title="Forensics Engine"
      intro="Collects destructive audit-log bursts, moderation anomalies, and trace evidence so incidents can be reconstructed after the fact."
      related={[
        { route: "/dashboard/security/audit-trail", label: "Audit Trail", reason: "forensics depends on the audit evidence stream" },
        { route: "/dashboard/security/staff-activity", label: "Staff Activity", reason: "staff anomalies should be visible beside forensic events" },
      ]}
    />
  );
}
