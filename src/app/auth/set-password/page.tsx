"use client";

import { useEffect, useState } from "react";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { Zap } from "lucide-react";

// Invite links use implicit-grant hash tokens (#access_token=...&type=invite)
// @supabase/ssr PKCE client silently ignores hash tokens — must use implicit flow client here
function createImplicitClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { flowType: "implicit", detectSessionInUrl: true, persistSession: true } }
  );
}

type PageState = "checking" | "ready" | "expired" | "success" | "error";

export default function SetPasswordPage() {
  const [pageState, setPageState] = useState<PageState>("checking");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [validationError, setValidationError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Use implicit-flow client — created once, stable across renders
  const [supabase] = useState(() => createImplicitClient());

  useEffect(() => {
    // The implicit client auto-detects and exchanges the hash token on mount.
    // Listen for the session event rather than polling getSession().
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        setPageState("ready");
      } else if (event === "TOKEN_REFRESHED" && session) {
        setPageState("ready");
      }
    });

    // Fallback: if already signed in (e.g. page refresh), check immediately
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setPageState("ready");
    });

    // Show expired after 4s if nothing fired
    const timer = setTimeout(() => {
      setPageState((prev) => prev === "checking" ? "expired" : prev);
    }, 4000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, [supabase]);

  function validate(): boolean {
    if (password.length < 8) {
      setValidationError("Password must be at least 8 characters.");
      return false;
    }
    if (password !== confirmPassword) {
      setValidationError("Passwords do not match.");
      return false;
    }
    setValidationError("");
    return true;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setErrorMsg(null);

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setErrorMsg(error.message);
      setSubmitting(false);
      return;
    }

    setPageState("success");
    setTimeout(() => {
      window.location.href = "/admin/dashboard";
    }, 2000);
  }

  const INPUT_STYLE: React.CSSProperties = {
    background: "rgba(255,255,255,0.06)",
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: "12px",
    padding: "12px 16px",
    color: "#FFFFFF",
    outline: "none",
    width: "100%",
    fontSize: "14px",
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-6 py-12"
      style={{ backgroundColor: "transparent" }}
    >
      {/* Radial lime glow */}
      <div
        className="fixed pointer-events-none"
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
          {pageState === "checking" && (
            <p style={{ color: "#999", fontSize: 14, textAlign: "center" }}>
              Verifying your invite link…
            </p>
          )}

          {pageState === "expired" && (
            <div className="flex flex-col gap-4 text-center">
              <h2 className="text-xl font-semibold" style={{ color: "#FFFFFF" }}>
                Link expired
              </h2>
              <p style={{ color: "#A3A3A3", fontSize: 14, lineHeight: 1.6 }}>
                This invitation link has expired or is invalid. Please contact your administrator for a new invite.
              </p>
              <a
                href="/auth/login"
                className="text-sm font-semibold mt-2"
                style={{ color: "#D4FF4F", textDecoration: "none" }}
              >
                Back to login →
              </a>
            </div>
          )}

          {pageState === "success" && (
            <div className="flex flex-col gap-4 text-center">
              <div
                className="w-12 h-12 rounded-full mx-auto flex items-center justify-center"
                style={{ background: "rgba(212,255,79,0.1)" }}
              >
                <Zap size={24} color="#D4FF4F" />
              </div>
              <h2 className="text-xl font-semibold" style={{ color: "#FFFFFF" }}>
                Password set!
              </h2>
              <p style={{ color: "#A3A3A3", fontSize: 14 }}>
                Taking you to your dashboard…
              </p>
            </div>
          )}

          {pageState === "ready" && (
            <>
              <h2
                className="text-xl font-semibold mb-2"
                style={{ fontFamily: "Inter Tight, sans-serif", color: "#FFFFFF" }}
              >
                Set your password
              </h2>
              <p className="text-sm mb-6" style={{ color: "#A3A3A3" }}>
                Create a secure password to access GymGaze.
              </p>

              {errorMsg && (
                <div
                  className="rounded-xl px-4 py-3 text-sm mb-4"
                  style={{
                    backgroundColor: "rgba(239,68,68,0.1)",
                    border: "1px solid rgba(239,68,68,0.3)",
                    color: "#EF4444",
                  }}
                >
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: "#A3A3A3" }}>
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    style={INPUT_STYLE}
                    onFocus={(e) => (e.target.style.borderColor = "rgba(212,255,79,0.5)")}
                    onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.10)")}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: "#A3A3A3" }}>
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    style={INPUT_STYLE}
                    onFocus={(e) => (e.target.style.borderColor = "rgba(212,255,79,0.5)")}
                    onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.10)")}
                  />
                </div>

                {validationError && (
                  <p className="text-sm" style={{ color: "#EF4444" }}>{validationError}</p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 rounded-xl text-sm font-semibold transition-colors duration-150"
                  style={{
                    backgroundColor: submitting ? "#909090" : "#D4FF4F",
                    color: "#0A0A0A",
                    cursor: submitting ? "not-allowed" : "pointer",
                    height: "44px",
                    marginTop: 8,
                  }}
                >
                  {submitting ? "Setting up your account…" : "Set Password"}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="mt-8 text-xs text-center" style={{ color: "#444444" }}>
          GymGaze Platform &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
