"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useFamily } from "@/lib/hooks/useFamily";
import {
  ArrowLeft, UserPlus, Mail, Crown, Users, Trash2,
  ShieldCheck, ShieldOff, X, CheckCircle, AlertCircle, UserCheck,
} from "lucide-react";
import type { Invitation } from "@/types";

type MemberRow = {
  id: string;
  user_id: string;
  family_id: string;
  role: "admin" | "member";
  joined_at: string;
  email: string;
  full_name: string | null;
};

export default function SettingsPage() {
  const router = useRouter();
  const { family, member: currentMember } = useFamily();
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [addEmail, setAddEmail] = useState("");
  const [adding, setAdding] = useState(false);
  const [flash, setFlash] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const supabase = createClient();

  function showFlash(type: "success" | "error", msg: string) {
    setFlash({ type, msg });
    setTimeout(() => setFlash(null), 4000);
  }

  const loadData = useCallback(async () => {
    if (!family) return;
    const [membersRes, { data: invs }] = await Promise.all([
      fetch(`/api/members?familyId=${family.id}`),
      supabase
        .from("invitations")
        .select("*")
        .eq("family_id", family.id)
        .eq("status", "pending")
        .order("created_at"),
    ]);
    const { members: m } = await membersRes.json();
    setMembers(m ?? []);
    setInvitations(invs ?? []);
  }, [family?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviting(true);
    const res = await fetch("/api/invitations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: inviteEmail, familyId: family?.id }),
    });
    const data = await res.json();
    if (data.error) {
      showFlash("error", data.error);
    } else {
      showFlash("success", `Invitation sent to ${inviteEmail}`);
      setInviteEmail("");
      loadData();
    }
    setInviting(false);
  }

  async function handleAddExisting(e: React.FormEvent) {
    e.preventDefault();
    setAdding(true);
    const res = await fetch("/api/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: addEmail, familyId: family?.id }),
    });
    const data = await res.json();
    if (data.error) {
      showFlash("error", data.error);
    } else {
      showFlash("success", `${addEmail} has been added to ${family?.name}.`);
      setAddEmail("");
      loadData();
    }
    setAdding(false);
  }

  async function handleCancelInvite(inv: Invitation) {
    setLoadingAction(`cancel-${inv.id}`);
    const res = await fetch("/api/invitations", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invitationId: inv.id, familyId: family?.id }),
    });
    const data = await res.json();
    if (data.error) showFlash("error", data.error);
    else setInvitations((prev) => prev.filter((i) => i.id !== inv.id));
    setLoadingAction(null);
  }

  async function handleChangeRole(m: MemberRow, newRole: "admin" | "member") {
    setLoadingAction(`role-${m.user_id}`);
    const res = await fetch("/api/members", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ familyId: family?.id, userId: m.user_id, role: newRole }),
    });
    const data = await res.json();
    if (data.error) showFlash("error", data.error);
    else setMembers((prev) => prev.map((x) => x.user_id === m.user_id ? { ...x, role: newRole } : x));
    setLoadingAction(null);
  }

  async function handleRemoveMember(m: MemberRow) {
    if (!confirm(`Remove ${m.email} from this family? They will lose access immediately.`)) return;
    setLoadingAction(`remove-${m.user_id}`);
    const res = await fetch("/api/members", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ familyId: family?.id, userId: m.user_id }),
    });
    const data = await res.json();
    if (data.error) showFlash("error", data.error);
    else setMembers((prev) => prev.filter((x) => x.user_id !== m.user_id));
    setLoadingAction(null);
  }

  if (!family || currentMember?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-gray-500">Access denied.</p>
      </div>
    );
  }

  const adminCount = members.filter((m) => m.role === "admin").length;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* Header */}
        <button
          onClick={() => router.push("/tree")}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to tree
        </button>

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">{family.name}</h1>
          <p className="text-sm text-gray-500 mt-0.5">Admin panel</p>
        </div>

        {/* Flash message */}
        {flash && (
          <div className={`flex items-center gap-2 px-4 py-3 rounded-xl mb-6 text-sm font-medium ${
            flash.type === "success"
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}>
            {flash.type === "success"
              ? <CheckCircle className="w-4 h-4 flex-shrink-0" />
              : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
            {flash.msg}
          </div>
        )}

        {/* Members */}
        <section className="bg-white rounded-2xl shadow-sm mb-4 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600" />
            <h2 className="font-semibold text-gray-900">Members</h2>
            <span className="ml-auto text-xs text-gray-400">{members.length} total</span>
          </div>

          <div className="px-6 py-2 bg-slate-50 border-b border-gray-100 flex gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1"><Crown className="w-3 h-3 text-blue-500" /> <strong>Admin</strong> — invite &amp; manage members, access this panel</span>
            <span className="flex items-center gap-1"><Users className="w-3 h-3 text-gray-400" /> <strong>Member</strong> — view &amp; contribute to the family tree</span>
          </div>

          {members.length === 0 ? (
            <p className="px-6 py-8 text-sm text-gray-400 text-center">No members yet.</p>
          ) : (
            <ul className="divide-y divide-gray-50">
              {members.map((m) => {
                const isSelf = m.user_id === currentMember?.user_id;
                const isLastAdmin = m.role === "admin" && adminCount === 1;
                const busy = loadingAction === `role-${m.user_id}` || loadingAction === `remove-${m.user_id}`;

                return (
                  <li key={m.id} className="px-6 py-4 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-semibold text-blue-600">
                        {(m.full_name ?? m.email).charAt(0).toUpperCase()}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {m.full_name ?? m.email}
                        {isSelf && <span className="ml-1.5 text-xs text-gray-400">(you)</span>}
                      </p>
                      {m.full_name && (
                        <p className="text-xs text-gray-500 truncate">{m.email}</p>
                      )}
                    </div>

                    {m.role === "admin" ? (
                      <span className="flex items-center gap-1 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full flex-shrink-0">
                        <Crown className="w-3 h-3" /> Admin
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-full flex-shrink-0">
                        Member
                      </span>
                    )}

                    {!isSelf && (
                      <div className="flex items-center gap-1 ml-1">
                        {m.role === "member" ? (
                          <button
                            onClick={() => handleChangeRole(m, "admin")}
                            disabled={busy}
                            title="Make admin"
                            className="flex items-center gap-1 text-xs px-2 py-1 text-blue-600 hover:bg-blue-50 border border-blue-200 rounded-lg transition-colors disabled:opacity-40"
                          >
                            <ShieldCheck className="w-3 h-3" />
                            Make admin
                          </button>
                        ) : (
                          <button
                            onClick={() => handleChangeRole(m, "member")}
                            disabled={busy || isLastAdmin}
                            title={isLastAdmin ? "Cannot demote the only admin" : "Make member"}
                            className="flex items-center gap-1 text-xs px-2 py-1 text-gray-500 hover:bg-gray-50 border border-gray-200 rounded-lg transition-colors disabled:opacity-40"
                          >
                            <ShieldOff className="w-3 h-3" />
                            Make member
                          </button>
                        )}
                        <button
                          onClick={() => handleRemoveMember(m)}
                          disabled={busy}
                          title="Remove from family"
                          className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Add existing user */}
        <section className="bg-white rounded-2xl shadow-sm p-6 mb-4">
          <h2 className="flex items-center gap-2 font-semibold text-gray-900 mb-1">
            <UserCheck className="w-4 h-4 text-blue-600" />
            Add Existing Member
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            If someone already created an account but wasn&apos;t invited through the app, enter their email to add them directly.
          </p>
          <form onSubmit={handleAddExisting} className="flex gap-2">
            <input
              type="email"
              value={addEmail}
              onChange={(e) => setAddEmail(e.target.value)}
              required
              placeholder="their@email.com"
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={adding}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-5 py-2 rounded-lg disabled:opacity-50 font-medium"
            >
              {adding ? "Adding…" : "Add"}
            </button>
          </form>
        </section>

        {/* Pending invitations */}
        {invitations.length > 0 && (
          <section className="bg-white rounded-2xl shadow-sm mb-4 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
              <Mail className="w-4 h-4 text-blue-600" />
              <h2 className="font-semibold text-gray-900">Pending Invitations</h2>
              <span className="ml-auto text-xs text-gray-400">{invitations.length}</span>
            </div>
            <ul className="divide-y divide-gray-50">
              {invitations.map((inv) => (
                <li key={inv.id} className="px-6 py-3.5 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700 truncate">{inv.email}</p>
                  </div>
                  <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full flex-shrink-0">
                    pending
                  </span>
                  <button
                    onClick={() => handleCancelInvite(inv)}
                    disabled={loadingAction === `cancel-${inv.id}`}
                    title="Cancel invitation"
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Invite form */}
        <section className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="flex items-center gap-2 font-semibold text-gray-900 mb-1">
            <UserPlus className="w-4 h-4 text-blue-600" />
            Invite Someone
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            They&apos;ll receive an email with a link to join {family.name} as a member.
          </p>
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
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-5 py-2 rounded-lg disabled:opacity-50 font-medium"
            >
              {inviting ? "Sending…" : "Send Invite"}
            </button>
          </form>
        </section>

      </div>
    </div>
  );
}
