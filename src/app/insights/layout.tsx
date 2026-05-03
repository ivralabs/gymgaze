// Clean layout for public insights pages — no admin chrome, no hero background
export default function InsightsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", background: "#0A0A0A" }}>
      {children}
    </div>
  );
}
