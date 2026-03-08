import SecuritySubEngineConsole from "@/components/possum/SecuritySubEngineConsole";

export default function Page() {
  return (
    <SecuritySubEngineConsole
      engineKey="security.staffActivityMonitor"
      title="Staff Activity Monitor Engine"
      intro="Tracks staff action velocity and moderation anomalies so owner teams can see risky internal patterns instead of only member-side threats."
      related={[
        { route: "/dashboard/security/forensics", label: "Forensics", reason: "staff anomalies should be reviewed with forensic evidence" },
        { route: "/dashboard/security/audit-trail", label: "Audit Trail", reason: "this monitor consumes the same audit stream" },
      ]}
    />
  );
}
