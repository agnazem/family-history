"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { BookOpen, Users, Mic, Image } from "lucide-react";

export default function LandingPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });
      if (error) {
        setError(error.message);
      } else {
        setMessage("Check your email to confirm your account, then sign in.");
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setError(error.message);
      } else {
        window.location.href = "/home";
      }
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      {/* Hero */}
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Left: branding */}
        <div className="lg:w-1/2 flex flex-col justify-center px-8 lg:px-16 py-16">
          <div className="flex items-center gap-3 mb-8">
            <BookOpen className="w-10 h-10 text-accent" />
            <h1 className="font-display text-[40px] leading-[1.05] tracking-[-0.02em] font-normal text-[--ink]">Family History</h1>
          </div>
          <p className="text-[19px] leading-[1.55] text-[--ink-soft] mb-8 max-w-[480px]">
            Collaboratively build your family tree and preserve the stories,
            voices, and memories of the people who shaped your family.
          </p>
          <div className="grid grid-cols-1 gap-4">
            {[
              { icon: Users, text: "Build your family tree together" },
              { icon: Mic, text: "Record audio stories and memories" },
              { icon: Image, text: "Preserve photos and family artifacts" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3 text-[--ink-soft]">
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: auth form */}
        <div className="lg:w-1/2 flex items-center justify-center px-8 py-16">
          <div className="w-full max-w-md bg-[--surface] border border-[--rule] rounded-xl p-8">
            <div className="flex rounded-lg bg-[--surface-alt] p-1 mb-6">
              <button
                className={`flex-1 py-2.5 rounded-md text-sm font-medium transition-colors min-h-[44px] ${
                  mode === "signin"
                    ? "bg-[--surface] shadow-sm text-[--ink]"
                    : "text-[--ink-mute] hover:text-[--ink-soft]"
                }`}
                onClick={() => setMode("signin")}
              >
                Sign In
              </button>
              <button
                className={`flex-1 py-2.5 rounded-md text-sm font-medium transition-colors min-h-[44px] ${
                  mode === "signup"
                    ? "bg-[--surface] shadow-sm text-[--ink]"
                    : "text-[--ink-mute] hover:text-[--ink-soft]"
                }`}
                onClick={() => setMode("signup")}
              >
                Create Account
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "signup" && (
                <div>
                  <label className="block text-sm font-medium text-[--ink-soft] mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="w-full border border-[--rule] bg-[--surface] rounded-lg px-3 py-2 text-sm text-[--ink] focus:outline-none focus:ring-2 focus:ring-[--gold] placeholder:text-[--ink-mute]"
                    placeholder="Jane Smith"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-[--ink-soft] mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full border border-[--rule] bg-[--surface] rounded-lg px-3 py-2 text-sm text-[--ink] focus:outline-none focus:ring-2 focus:ring-[--gold] placeholder:text-[--ink-mute]"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[--ink-soft] mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full border border-[--rule] bg-[--surface] rounded-lg px-3 py-2 text-sm text-[--ink] focus:outline-none focus:ring-2 focus:ring-[--gold] placeholder:text-[--ink-mute]"
                  placeholder="••••••••"
                />
              </div>

              {error && (
                <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}
              {message && (
                <p className="text-sm text-green-800 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                  {message}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-accent hover:bg-accent-hover text-white font-medium py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                {loading
                  ? "..."
                  : mode === "signin"
                  ? "Sign In"
                  : "Create Account"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
