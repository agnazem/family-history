"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft } from "lucide-react";
import { Spinner } from "@/components/ui/Spinner";
import type { Person } from "@/types";

export default function EditPersonPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [person, setPerson] = useState<Person | null>(null);
  const [form, setForm] = useState({
    first_name: "",
    middle_name: "",
    last_name: "",
    nickname: "",
    dob: "",
    dod: "",
    bio: "",
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from("people").select("*").eq("id", id).single();
      if (data) {
        setPerson(data);
        setForm({
          first_name: data.first_name,
          middle_name: data.middle_name ?? "",
          last_name: data.last_name,
          nickname: data.nickname ?? "",
          dob: data.dob ?? "",
          dod: data.dod ?? "",
          bio: data.bio ?? "",
        });
      }
      setFetching(false);
    }
    load();
  }, [id]);

  function set(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    let photoUrl = person?.profile_photo_url ?? null;

    if (photoFile) {
      const path = `${person?.family_id}/${id}/profile-${Date.now()}`;
      const { error: uploadErr } = await supabase.storage
        .from("profile-photos")
        .upload(path, photoFile, { upsert: true });
      if (uploadErr) {
        setError(uploadErr.message);
        setLoading(false);
        return;
      }
      const { data } = supabase.storage.from("profile-photos").getPublicUrl(path);
      photoUrl = data.publicUrl;
    }

    const { error: updateErr } = await supabase
      .from("people")
      .update({
        first_name: form.first_name,
        middle_name: form.middle_name || null,
        last_name: form.last_name,
        nickname: form.nickname || null,
        dob: form.dob || null,
        dod: form.dod || null,
        bio: form.bio || null,
        profile_photo_url: photoUrl,
      })
      .eq("id", id);

    if (updateErr) {
      setError(updateErr.message);
    } else {
      router.push(`/person/${id}`);
    }
    setLoading(false);
  }

  if (fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-canvas">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas">
      <div className="max-w-lg mx-auto px-4 py-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h1 className="font-display text-2xl font-light text-stone-900 mb-6">Edit Person</h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">First Name *</label>
                <input
                  required
                  value={form.first_name}
                  onChange={(e) => set("first_name", e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-mid"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Middle Name</label>
                <input
                  value={form.middle_name}
                  onChange={(e) => set("middle_name", e.target.value)}
                  placeholder="Optional"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-300"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Last Name *</label>
                <input
                  required
                  value={form.last_name}
                  onChange={(e) => set("last_name", e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-mid"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Nickname / Known As</label>
                <input
                  value={form.nickname}
                  onChange={(e) => set("nickname", e.target.value)}
                  placeholder="Optional"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-300"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Date of Birth</label>
                <input
                  type="date"
                  value={form.dob}
                  onChange={(e) => set("dob", e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-mid"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Date of Death</label>
                <input
                  type="date"
                  value={form.dod}
                  onChange={(e) => set("dod", e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-mid"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Profile Photo</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
                className="w-full text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-canvas file:text-accent hover:file:bg-accent-pale"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Bio</label>
              <textarea
                value={form.bio}
                onChange={(e) => set("bio", e.target.value)}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-mid resize-none"
              />
            </div>
            {error && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
            )}
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-accent text-white py-2 rounded-lg text-sm hover:bg-accent-hover disabled:opacity-50"
              >
                {loading ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
