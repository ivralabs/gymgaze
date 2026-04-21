import { Suspense } from "react";
import SettingsShell from "./SettingsShell";

export default async function SettingsPage() {
  return (
    <Suspense fallback={
      <div style={{ padding: "32px" }}>
        <div
          style={{
            height: "32px",
            width: "200px",
            borderRadius: "10px",
            backgroundColor: "rgba(255,255,255,0.04)",
            marginBottom: "24px",
          }}
        />
        <div
          style={{
            height: "200px",
            borderRadius: "16px",
            backgroundColor: "rgba(255,255,255,0.04)",
          }}
        />
      </div>
    }>
      <SettingsShell />
    </Suspense>
  );
}
