import SecuritySubEngineConsole from "@/components/possum/SecuritySubEngineConsole";

export default function Page() {
  return (
    <SecuritySubEngineConsole
      engineKey="security.crewSecurity"
      title="Crew Security Engine"
      intro="Monitors suspicious crew-to-crew patterns, funneling, and ping-pong behavior so GTA operations can be protected without flattening the whole guild."
      related={[
        { route: "/dashboard/crew", label: "Crew Engine", reason: "crew policy should match live crew mechanics" },
        { route: "/dashboard/security/engines", label: "Security Engines", reason: "crew signals still feed the shared stack" },
      ]}
    />
  );
}
