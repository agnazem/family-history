"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
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
  const router = useRouter();

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
        router.push("/tree");
        router.refresh();
      }
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-amber-50 flex flex-col">
      {/* Hero */}
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Left: branding */}
        <div className="lg:w-1/2 flex flex-col justify-center px-8 lg:px-16 py-16">
          <div className="flex items-center gap-3 mb-8">
            <BookOpen className="w-10 h-10 text-amber-700" />
            <h1 className="text-3xl font-bold text-amber-900">Family History</h1>
          </div>
          <p className="text-xl text-amber-800 mb-8 leading-relaxed">
            Collaboratively build your family tree and preserve the stories,
            voices, and memories of the people who shaped your family.
          </p>
          <div className="grid grid-cols-1 gap-4">
            {[
              { icon: Users, text: "Build your family tree together" },
              { icon: Mic, text: "Record audio stories and memories" },
              { icon: Image, text: "Preserve photos and family artifacts" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3 text-amber-700">
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: auth form */}
        <div className="lg:w-1/2 flex items-center justify-center px-8 py-16">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
            <div className="flex rounded-lg bg-gray-100 p-1 mb-6">
              <button
                className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
                  mode === "signin"
                    ? "bg-white shadow text-gray-900"
                    : "text-gray-500 hover:text-gray-700"
                }`}
                onClick={() => setMode("signin")}
              >
                Sign In
              </button>
              <button
                className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
                  mode === "signup"
                    ? "bg-white shadow text-gray-900"
                    : "text-gray-500 hover:text-gray-700"
                }`}
                onClick={() => setMode("signup")}
              >
                Create Account
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "signup" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="Jane Smith"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="••••••••"
                />
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}
              {message && (
                <p className="text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2">
                  {message}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-amber-700 hover:bg-amber-800 text-white font-medium py-2 rounded-lg transition-colors disabled:opacity-50"
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
