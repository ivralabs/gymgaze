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
      style={{ backgroundColor: "#0F0F0F" }}
    >
      {/* Logo */}
      <div className="mb-10 flex flex-col items-center">
        <div
          className="w-14 h-14 rounded-xl flex items-center justify-center mb-4"
          style={{ backgroundColor: "#FF6B35" }}
        >
          <Zap size={28} color="#FFFFFF" strokeWidth={2.5} />
        </div>
        <h1
          className="text-3xl font-bold tracking-tight"
          style={{ fontFamily: "Inter Tight, sans-serif", color: "#FFFFFF" }}
        >
          GymGaze
        </h1>
        <p className="text-sm mt-1" style={{ color: "#666666" }}>
          Gym advertising platform
        </p>
      </div>

      {/* Card */}
      <div
        className="w-full max-w-sm rounded-xl p-8"
        style={{
          backgroundColor: "#1E1E1E",
          border: "1px solid #333333",
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
              style={{ color: "#B3B3B3" }}
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
              className="w-full rounded-lg px-4 py-3 text-sm transition-colors duration-150"
              style={{
                backgroundColor: "#0F0F0F",
                border: "1px solid #333333",
                color: "#FFFFFF",
                outline: "none",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#FF6B35";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#333333";
              }}
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium mb-2"
              style={{ color: "#B3B3B3" }}
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
              className="w-full rounded-lg px-4 py-3 text-sm transition-colors duration-150"
              style={{
                backgroundColor: "#0F0F0F",
                border: "1px solid #333333",
                color: "#FFFFFF",
                outline: "none",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#FF6B35";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#333333";
              }}
            />
          </div>

          {error && (
            <div
              className="rounded-lg px-4 py-3 text-sm"
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
            className="w-full py-3 rounded-lg text-sm font-medium text-white transition-colors duration-150"
            style={{
              backgroundColor: loading ? "#666666" : "#FF6B35",
              cursor: loading ? "not-allowed" : "pointer",
            }}
            onMouseEnter={(e) => {
              if (!loading)
                (e.target as HTMLButtonElement).style.backgroundColor =
                  "#E55A2B";
            }}
            onMouseLeave={(e) => {
              if (!loading)
                (e.target as HTMLButtonElement).style.backgroundColor =
                  "#FF6B35";
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
