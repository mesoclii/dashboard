import { Suspense } from "react";
import ProfilesClient from "./ProfilesClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function Loading() {
  return <div style={{ color: "#ff4444", padding: 16 }}>Loading...</div>;
}

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <ProfilesClient />
    </Suspense>
  );
}
