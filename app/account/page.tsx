"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useFamily } from "@/lib/hooks/useFamily";
import { ArrowLeft, Check, Loader2 } from "lucide-react";

export default function AccountPage() {
  const router = useRouter();
  const supabase = createClient();
  const { family, member, loading } = useFamily();

  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setEmail(user.email ?? "");
    }
    loadUser();
  }, []);

  useEffect(() => {
    if (member) {
      setDisplayName(member.display_name ?? "");
    }
  }, [member]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!family || !member) return;
    setSaving(true);
    setError(null);

    const res = await fetch("/api/members", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        familyId: family.id,
        userId: member.user_id,
        display_name: displayName.trim(),
      }),
    });
    const data = await res.json();

    if (data.error) {
      setError(data.error);
    } else {
      // Also sync to auth user_metadata so sign-up → join flow is consistent
      await supabase.auth.updateUser({ data: { full_name: displayName.trim() } });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[--canvas]">
        <Loader2 className="w-5 h-5 text-[--ink-mute] animate-spin" />
      </div>
    );
  }

  if (!member) {
    router.replace("/");
    return null;
  }

  return (
    <div className="min-h-screen bg-[--canvas]">
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-10">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-[--ink-soft] hover:text-[--ink] transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="mb-8">
          <h1 className="font-display text-[clamp(28px,5vw,40px)] font-normal text-[--ink] leading-[1.1] tracking-[-0.02em]">
            Your account
          </h1>
          <p className="text-sm text-[--ink-mute] mt-1">{family?.name}</p>
        </div>

        <div className="bg-[--surface] border border-[--rule] rounded-xl p-6">
          <form onSubmit={handleSave} className="space-y-5">
            <div>
              <label className="block text-[12px] font-mono uppercase tracking-[0.04em] text-[--ink-mute] mb-1.5">
                Display name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name as it appears in the family history"
                className="w-full border border-[--rule] bg-[--canvas] rounded-lg px-3 py-2.5 text-sm text-[--ink] placeholder:text-[--ink-mute] focus:outline-none focus:border-[--gold]"
              />
              <p className="mt-1.5 text-[12px] text-[--ink-mute]">
                This is how you appear when you record memories or contribute to the family history.
              </p>
            </div>

            <div>
              <label className="block text-[12px] font-mono uppercase tracking-[0.04em] text-[--ink-mute] mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                readOnly
                className="w-full border border-[--rule] bg-[--canvas] rounded-lg px-3 py-2.5 text-sm text-[--ink-soft] cursor-default"
              />
            </div>

            {error && (
              <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={saving || !displayName.trim()}
              className="flex items-center gap-2 bg-[--accent] hover:bg-[--accent-hover] text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : saved ? (
                <Check className="w-4 h-4" />
              ) : null}
              {saving ? "Saving…" : saved ? "Saved" : "Save changes"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
