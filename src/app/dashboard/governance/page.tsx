import { Suspense } from "react";
import GovernanceClient from "./GovernanceClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function Loading() {
  return <div style={{ color: "#ff4444", padding: 16 }}>Loading...</div>;
}

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <GovernanceClient />
    </Suspense>
  );
}
