"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Zap } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single();

      const role = profile?.role;

      if (role === "admin") {
        window.location.href = "/admin/dashboard";
      } else if (role === "owner") {
        window.location.href = "/portal/dashboard";
      } else if (role === "manager") {
        window.location.href = "/portal/manager";
      } else {
        window.location.href = "/portal/dashboard";
      }
    }

    setLoading(false);
  }

  return (
    <div
      className="min-h-screen flex"
      style={{ backgroundColor: "transparent" }}
    >
      {/* Left panel — login form */}
      <div
        className="flex flex-col justify-center items-center w-full md:w-1/2 px-6 py-12 relative"
        style={{ backgroundColor: "transparent" }}
      >
        {/* Radial lime glow behind the form */}
        <div
          className="absolute pointer-events-none"
          style={{
            width: 480,
            height: 480,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(212,255,79,0.05) 0%, transparent 70%)",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
        />

        <div className="relative z-10 w-full max-w-sm">
          {/* Logo */}
          <div className="mb-10 flex flex-col items-center">
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center mb-4"
              style={{ backgroundColor: "#D4FF4F" }}
            >
              <Zap size={28} color="#0A0A0A" strokeWidth={2.5} />
            </div>
            <h1
              className="text-3xl font-bold tracking-tight"
              style={{
                fontFamily: "Inter Tight, sans-serif",
                color: "#FFFFFF",
                letterSpacing: "-0.02em",
              }}
            >
              GymGaze
            </h1>
            <p className="text-sm mt-1" style={{ color: "#909090" }}>
              Gym advertising platform
            </p>
          </div>

          {/* Card */}
          <div
            className="w-full rounded-2xl p-8"
            style={{
              background: "rgba(255,255,255,0.05)",
              backdropFilter: "blur(6px)",
              WebkitBackdropFilter: "blur(6px)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 16,
            }}
          >
            <h2
              className="text-xl font-semibold mb-6"
              style={{ fontFamily: "Inter Tight, sans-serif", color: "#FFFFFF" }}
            >
              Sign in to your account
            </h2>

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium mb-2"
                  style={{ color: "#A3A3A3" }}
                >
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  className="w-full rounded-xl px-4 py-3 text-sm transition-colors duration-150"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    backdropFilter: "blur(8px)",
                    WebkitBackdropFilter: "blur(8px)",
                    border: "1px solid rgba(255,255,255,0.10)",
                    color: "#FFFFFF",
                    outline: "none",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "rgba(212,255,79,0.5)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "rgba(255,255,255,0.10)";
                  }}
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium mb-2"
                  style={{ color: "#A3A3A3" }}
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full rounded-xl px-4 py-3 text-sm transition-colors duration-150"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    backdropFilter: "blur(8px)",
                    WebkitBackdropFilter: "blur(8px)",
                    border: "1px solid rgba(255,255,255,0.10)",
                    color: "#FFFFFF",
                    outline: "none",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "rgba(212,255,79,0.5)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "rgba(255,255,255,0.10)";
                  }}
                />
              </div>

              {error && (
                <div
                  className="rounded-xl px-4 py-3 text-sm"
                  style={{
                    backgroundColor: "rgba(239,68,68,0.1)",
                    border: "1px solid rgba(239,68,68,0.3)",
                    color: "#EF4444",
                  }}
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl text-sm font-semibold transition-colors duration-150"
                style={{
                  backgroundColor: loading ? "#909090" : "#D4FF4F",
                  color: "#0A0A0A",
                  cursor: loading ? "not-allowed" : "pointer",
                  height: "44px",
                }}
                onMouseEnter={(e) => {
                  if (!loading)
                    (e.target as HTMLButtonElement).style.backgroundColor = "#C8F438";
                }}
                onMouseLeave={(e) => {
                  if (!loading)
                    (e.target as HTMLButtonElement).style.backgroundColor = "#D4FF4F";
                }}
              >
                {loading ? "Signing in..." : "Sign in"}
              </button>
            </form>
          </div>

          <p className="mt-8 text-xs text-center" style={{ color: "#444444" }}>
            GymGaze Platform &copy; {new Date().getFullYear()}
          </p>
        </div>
      </div>

      {/* Right panel — hero object (desktop only) */}
      <div
        className="hidden md:flex w-1/2 relative overflow-hidden items-center justify-center"
        style={{
          background: "rgba(255,255,255,0.03)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          borderLeft: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        {/* Lime glow in the right panel */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at 60% 40%, rgba(212,255,79,0.06) 0%, transparent 60%)",
          }}
        />

      </div>
    </div>
  );
}
