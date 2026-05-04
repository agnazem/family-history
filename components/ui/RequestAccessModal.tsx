"use client";

import { useState } from "react";
import { X, Lock, CheckCircle } from "lucide-react";
import type { PermissionKey } from "@/types";

const PERMISSION_LABELS: Record<PermissionKey, { title: string; description: string }> = {
  can_edit_tree: {
    title: "Edit the family tree",
    description: "Adding people, editing profiles, and managing relationships.",
  },
  can_edit_memories: {
    title: "Add and edit memories",
    description: "Recording audio, uploading photos, and editing memory details.",
  },
};

interface Props {
  open: boolean;
  onClose: () => void;
  permission: PermissionKey;
  familyId: string;
}

export function RequestAccessModal({ open, onClose, permission, familyId }: Props) {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "already">("idle");

  const { title, description } = PERMISSION_LABELS[permission];

  async function handleRequest() {
    setStatus("sending");
    const res = await fetch("/api/permission-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ familyId, permission }),
    });
    const data = await res.json();
    if (data.alreadyRequested) {
      setStatus("already");
    } else if (data.success) {
      setStatus("sent");
    } else {
      setStatus("idle");
    }
  }

  function handleClose() {
    setStatus("idle");
    onClose();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30" onClick={handleClose} />
      <div className="relative bg-[--surface] border border-[--rule] rounded-2xl p-6 max-w-sm w-full shadow-xl">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-1 text-[--ink-mute] hover:text-[--ink] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {status === "sent" || status === "already" ? (
          <div className="text-center py-2">
            <CheckCircle className="w-10 h-10 text-green-600 mx-auto mb-3" />
            <p className="font-display text-lg text-[--ink] mb-1">
              {status === "sent" ? "Request sent" : "Already requested"}
            </p>
            <p className="text-sm text-[--ink-soft]">
              {status === "sent"
                ? "A family admin will review your request and grant access."
                : "You've already sent this request. A family admin will review it soon."}
            </p>
            <button
              onClick={handleClose}
              className="mt-5 w-full bg-[--accent] hover:bg-[--accent-hover] text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-[--accent-soft] flex items-center justify-center flex-shrink-0">
                <Lock className="w-5 h-5 text-[--accent]" />
              </div>
              <div>
                <p className="font-medium text-[--ink]">Permission required</p>
                <p className="text-sm text-[--ink-soft]">{title}</p>
              </div>
            </div>

            <p className="text-sm text-[--ink-soft] mb-5">
              {description} You don&apos;t currently have access to this. Would you like to request it from a family admin?
            </p>

            <div className="flex gap-2">
              <button
                onClick={handleClose}
                className="flex-1 border border-[--rule] text-[--ink-soft] text-sm py-2.5 rounded-lg hover:bg-[--canvas] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRequest}
                disabled={status === "sending"}
                className="flex-1 bg-[--accent] hover:bg-[--accent-hover] text-white text-sm font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50"
              >
                {status === "sending" ? "Sending…" : "Request access"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
