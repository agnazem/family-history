"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useFamily } from "@/lib/hooks/useFamily";
import { ArrowLeft, UserPlus, Mail, Crown, Users } from "lucide-react";
import type { FamilyMember, Invitation } from "@/types";

export default function SettingsPage() {
  const router = useRouter();
  const { family, member } = useFamily();
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteMsg, setInviteMsg] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    if (!family) return;
    async function load() {
      const [{ data: m }, { data: i }] = await Promise.all([
        supabase.from("family_members").select("*").eq("family_id", family!.id),
        supabase
          .from("invitations")
          .select("*")
          .eq("family_id", family!.id)
          .eq("status", "pending"),
      ]);
      setMembers(m ?? []);
      setInvitations(i ?? []);
    }
    load();
  }, [family?.id]);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviting(true);
    setInviteMsg(null);
    setInviteError(null);

    const res = await fetch("/api/invitations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: inviteEmail, familyId: family?.id }),
    });
    const data = await res.json();

    if (data.error) {
      setInviteError(data.error);
    } else {
      setInviteMsg(`Invitation sent to ${inviteEmail}`);
      setInviteEmail("");
      setInvitations((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          family_id: family!.id,
          email: inviteEmail,
          token: "",
          invited_by: "",
          status: "pending",
          created_at: new Date().toISOString(),
        },
      ]);
    }
    setInviting(false);
  }

  if (!family || member?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-gray-500">Access denied.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-lg mx-auto px-4 py-8">
        <button
          onClick={() => router.push("/tree")}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to tree
        </button>

        <h1 className="text-2xl font-bold text-gray-900 mb-1">{family.name}</h1>
        <p className="text-gray-500 text-sm mb-8">Family settings</p>

        {/* Invite */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-4">
          <h2 className="flex items-center gap-2 font-semibold text-gray-900 mb-4">
            <UserPlus className="w-4 h-4 text-blue-600" />
            Invite Family Member
          </h2>
          <form onSubmit={handleInvite} className="flex gap-2">
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              required
              placeholder="family@example.com"
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={inviting}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg disabled:opacity-50"
            >
              {inviting ? "Sending..." : "Invite"}
            </button>
          </form>
          {inviteMsg && (
            <p className="text-sm text-green-700 mt-2">{inviteMsg}</p>
          )}
          {inviteError && (
            <p className="text-sm text-red-600 mt-2">{inviteError}</p>
          )}
        </div>

        {/* Pending invites */}
        {invitations.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-4">
            <h2 className="flex items-center gap-2 font-semibold text-gray-900 mb-4">
              <Mail className="w-4 h-4 text-blue-600" />
              Pending Invitations
            </h2>
            <ul className="space-y-2">
              {invitations.map((inv) => (
                <li
                  key={inv.id}
                  className="flex items-center justify-between text-sm text-gray-600 py-1 border-b border-gray-50 last:border-0"
                >
                  <span>{inv.email}</span>
                  <span className="text-xs text-blue-500 bg-slate-50 px-2 py-0.5 rounded-full">
                    pending
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Members */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="flex items-center gap-2 font-semibold text-gray-900 mb-4">
            <Users className="w-4 h-4 text-blue-600" />
            Members ({members.length})
          </h2>
          <ul className="space-y-2">
            {members.map((m) => (
              <li
                key={m.id}
                className="flex items-center justify-between text-sm py-1 border-b border-gray-50 last:border-0"
              >
                <span className="text-gray-700">{m.user_id}</span>
                {m.role === "admin" && (
                  <span title="Admin"><Crown className="w-4 h-4 text-blue-400" /></span>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
