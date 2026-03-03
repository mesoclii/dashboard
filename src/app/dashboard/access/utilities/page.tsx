import { Suspense } from "react";
import UtilitiesClient from "./UtilitiesClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function Loading() {
  return <div style={{ color: "#ff4444", padding: 16 }}>Loading utilities...</div>;
}

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <UtilitiesClient />
    </Suspense>
  );
}
