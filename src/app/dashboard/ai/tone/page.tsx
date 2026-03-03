import { Suspense } from "react";
import ToneClient from "./ToneClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function Loading() {
  return <div style={{ color: "#ff4444", padding: 16 }}>Loading...</div>;
}

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <ToneClient />
    </Suspense>
  );
}
