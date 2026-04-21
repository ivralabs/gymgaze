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
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ backgroundColor: "#0A0A0A" }}
    >
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
          style={{ fontFamily: "Inter Tight, sans-serif", color: "#FFFFFF", letterSpacing: "-0.02em" }}
        >
          GymGaze
        </h1>
        <p className="text-sm mt-1" style={{ color: "#666666" }}>
          Gym advertising platform
        </p>
      </div>

      {/* Card */}
      <div
        className="w-full max-w-sm rounded-2xl p-8"
        style={{
          backgroundColor: "#141414",
          border: "1px solid #2A2A2A",
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
                backgroundColor: "#0A0A0A",
                border: "1px solid #2A2A2A",
                color: "#FFFFFF",
                outline: "none",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#D4FF4F";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#2A2A2A";
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
                backgroundColor: "#0A0A0A",
                border: "1px solid #2A2A2A",
                color: "#FFFFFF",
                outline: "none",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#D4FF4F";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#2A2A2A";
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
              backgroundColor: loading ? "#666666" : "#D4FF4F",
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

      <p className="mt-8 text-xs" style={{ color: "#444444" }}>
        GymGaze Platform &copy; {new Date().getFullYear()}
      </p>
    </div>
  );
}
