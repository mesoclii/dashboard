import SecurityEngineOperator from "@/components/possum/SecurityEngineOperator";

export default function Page() {
  return (
    <SecurityEngineOperator
      engineKey="security.crewSecurity"
      title="Crew Security Engine"
      description="Monitor suspicious crew-to-crew patterns, funneling, and ping-pong behavior so GTA operations can be protected without flattening the whole guild."
      links={[
        { href: "/dashboard/security", label: "Security" },
        { href: "/dashboard/crew", label: "Crew Engine" },
      ]}
    />
  );
}
