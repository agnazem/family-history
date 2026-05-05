"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Loader2, ImagePlus, X, MapPin } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { useFamily } from "@/lib/hooks/useFamily";
import { personDisplayName } from "@/lib/utils";
import type { Person } from "@/types";

type Phase = "upload" | "details" | "saving";

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

export default function AddPhotoPage() {
  const router = useRouter();
  const { family, loading: familyLoading } = useFamily();
  const supabase = createClient();

  const [phase, setPhase] = useState<Phase>("upload");
  const [people, setPeople] = useState<Person[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [title, setTitle] = useState("");
  const [dateOfMemory, setDateOfMemory] = useState("");
  const [description, setDescription] = useState("");
  const [taggedIds, setTaggedIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [exifLocation, setExifLocation] = useState<string | null>(null);
  const [exifLoading, setExifLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function extractExif(f: File): Promise<{ date?: string; location?: string }> {
    try {
      const exifr = (await import("exifr")).default;
      const data = await exifr.parse(f, {
        pick: ["DateTimeOriginal", "CreateDate", "GPSLatitude", "GPSLongitude", "GPSLatitudeRef", "GPSLongitudeRef"],
      });
      if (!data) return {};

      const result: { date?: string; location?: string } = {};

      const rawDate = data.DateTimeOriginal ?? data.CreateDate;
      if (rawDate instanceof Date && !isNaN(rawDate.getTime())) {
        const y = rawDate.getFullYear();
        const m = String(rawDate.getMonth() + 1).padStart(2, "0");
        const d = String(rawDate.getDate()).padStart(2, "0");
        result.date = `${y}-${m}-${d}`;
      }

      if (data.GPSLatitude && data.GPSLongitude) {
        const lat = Array.isArray(data.GPSLatitude)
          ? data.GPSLatitude[0] + data.GPSLatitude[1] / 60 + data.GPSLatitude[2] / 3600
          : data.GPSLatitude;
        const lng = Array.isArray(data.GPSLongitude)
          ? data.GPSLongitude[0] + data.GPSLongitude[1] / 60 + data.GPSLongitude[2] / 3600
          : data.GPSLongitude;
        const finalLat = (data.GPSLatitudeRef === "S" || lat < 0) ? -Math.abs(lat) : Math.abs(lat);
        const finalLng = (data.GPSLongitudeRef === "W" || lng < 0) ? -Math.abs(lng) : Math.abs(lng);

        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${finalLat}&lon=${finalLng}&format=json`,
          { headers: { "Accept-Language": "en" } }
        ).catch(() => null);
        if (res?.ok) {
          const geo = await res.json();
          const addr = geo.address ?? {};
          const parts = [
            addr.city ?? addr.town ?? addr.village ?? addr.county,
            addr.state,
            addr.country,
          ].filter(Boolean);
          if (parts.length) result.location = parts.join(", ");
        }
      }

      return result;
    } catch {
      return {};
    }
  }

  useEffect(() => {
    if (!family?.id) return;
    supabase
      .from("people")
      .select("id, first_name, last_name, nickname, dob, dod, profile_photo_url")
      .eq("family_id", family.id)
      .order("last_name")
      .then(({ data }) => setPeople((data ?? []) as Person[]));
  }, [family?.id]);

  function acceptFile(f: File) {
    if (!f.type.startsWith("image/")) return;
    if (f.size > MAX_FILE_SIZE) {
      setError("File is too large. Please choose an image under 20 MB.");
      return;
    }
    const url = URL.createObjectURL(f);
    setFile(f);
    setPreview(url);
    setExifLocation(null);
    // Seed title from filename as a fallback
    setTitle((prev) => prev || f.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " "));
    setPhase("details");

    // Async EXIF extraction — fill in what we find
    setExifLoading(true);
    extractExif(f).then(({ date, location }) => {
      if (date) setDateOfMemory((prev) => prev || date);
      if (location) setExifLocation(location);
      setExifLoading(false);
    });
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) acceptFile(f);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) acceptFile(f);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setDragging(true);
  }

  function handleDragLeave() {
    setDragging(false);
  }

  function clearPhoto() {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview(null);
    setTitle("");
    setDateOfMemory("");
    setDescription("");
    setExifLocation(null);
    setPhase("upload");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function toggleTag(pid: string) {
    setTaggedIds((prev) => {
      const next = new Set(prev);
      next.has(pid) ? next.delete(pid) : next.add(pid);
      return next;
    });
  }

  const handlePaste = useCallback((e: ClipboardEvent) => {
    const item = Array.from(e.clipboardData?.items ?? []).find(
      (i) => i.type.startsWith("image/")
    );
    if (item) {
      const f = item.getAsFile();
      if (f) acceptFile(f);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, [handlePaste]);

  async function handleSave() {
    if (!file || !family?.id) return;
    setPhase("saving");
    setError(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("Not signed in."); setPhase("details"); return; }

    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${family.id}/photos/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("photos")
      .upload(path, file, { contentType: file.type });
    if (uploadError) {
      setError(uploadError.message);
      setPhase("details");
      return;
    }

    const { data: urlData } = supabase.storage.from("photos").getPublicUrl(path);

    const { error: insertError, data: inserted } = await supabase
      .from("memories")
      .insert({
        family_id: family.id,
        type: "photo",
        title: title.trim() || "Photo",
        description: description.trim() || null,
        storage_url: urlData.publicUrl,
        recorded_by: user.id,
        date_of_memory: dateOfMemory || null,
        location: exifLocation || null,
      })
      .select("id")
      .single();

    if (insertError || !inserted) {
      setError(insertError?.message ?? "Failed to save.");
      setPhase("details");
      return;
    }

    const tagList = Array.from(taggedIds);
    if (tagList.length > 0) {
      await supabase.from("memory_people").insert(
        tagList.map((pid) => ({
          memory_id: inserted.id,
          person_id: pid,
          family_id: family.id,
        }))
      );
    }

    router.push(`/memory/${inserted.id}`);
  }

  if (familyLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[--canvas]">
        <p className="text-[--ink-soft]">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[--canvas]">
      <header className="sticky top-0 z-20 bg-[--surface] border-b border-[--rule]">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link
            href="/home"
            className="p-1.5 -ml-1.5 text-[--ink-mute] hover:text-[--ink] transition-colors rounded-lg hover:bg-[--surface-alt]"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <span className="font-display italic text-[17px] text-[--ink] truncate">
            {family?.name ?? "Folio"}
          </span>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-10 lg:grid lg:grid-cols-[1fr_360px] lg:gap-14">
        {/* Left: main content */}
        <div>
          {phase === "upload" && (
            <div className="space-y-8">
              <div>
                <p className="eyebrow mb-3">New photo memory</p>
                <p className="font-display font-normal text-[28px] leading-[1.2] tracking-[-0.02em] text-[--ink]">
                  Add a photo to the archive
                </p>
                <p className="text-[14px] text-[--ink-soft] mt-3 leading-snug">
                  Upload a photo, drag it in, or paste from your clipboard. You'll add a title and tag people after.
                </p>
              </div>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`w-full rounded-2xl border-2 border-dashed transition-colors flex flex-col items-center justify-center gap-4 py-16 px-8 text-center ${
                  dragging
                    ? "border-[--accent] bg-[--accent-soft]"
                    : "border-[--rule] bg-[--surface] hover:border-[--gold]"
                }`}
              >
                <div className="w-14 h-14 rounded-full bg-[--accent-soft] flex items-center justify-center">
                  <ImagePlus className="w-6 h-6 text-[--accent]" />
                </div>
                <div>
                  <p className="font-medium text-[--ink] text-[16px]">
                    {dragging ? "Drop to add" : "Click to browse"}
                  </p>
                  <p className="text-[13px] text-[--ink-mute] mt-1">
                    or drag &amp; drop · paste works too
                  </p>
                </div>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          )}

          {(phase === "details" || phase === "saving") && (
            <div className="space-y-6">
              <div>
                <p className="eyebrow mb-1">Almost done</p>
                <h1 className="font-display text-[30px] font-normal text-[--ink] leading-[1.1] tracking-[-0.02em]">
                  Add a few details
                </h1>
              </div>

              {/* Mobile preview */}
              {preview && (
                <div className="lg:hidden relative rounded-xl overflow-hidden border border-[--rule] aspect-video bg-[--surface]">
                  <Image src={preview} alt="Preview" fill className="object-contain" />
                  <button
                    type="button"
                    onClick={clearPhoto}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-[--ink-soft] mb-1.5">
                  Title <span className="text-red-400">*</span>
                </label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full border border-[--rule] bg-[--surface] rounded-lg px-3 py-2.5 text-sm text-[--ink] placeholder:text-[--ink-mute] focus:outline-none focus:border-[--gold]"
                  placeholder="e.g. Grandma at the beach, 1974"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[--ink-soft] mb-1.5">
                  Date of photo <span className="text-[--ink-mute] font-normal">optional</span>
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={dateOfMemory}
                    onChange={(e) => setDateOfMemory(e.target.value)}
                    className="w-full border border-[--rule] bg-[--surface] rounded-lg px-3 py-2.5 text-sm text-[--ink] focus:outline-none focus:border-[--gold]"
                  />
                  {exifLoading && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[--ink-mute] animate-spin" />
                  )}
                </div>
              </div>

              {(exifLocation || exifLoading) && (
                <div className="flex items-center gap-2 text-[13px] text-[--ink-soft]">
                  <MapPin className="w-3.5 h-3.5 text-[--ink-mute] flex-shrink-0" />
                  {exifLoading ? (
                    <span className="text-[--ink-mute]">Looking up location…</span>
                  ) : (
                    <span>{exifLocation}</span>
                  )}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-[--ink-soft] mb-1.5">
                  Description <span className="text-[--ink-mute] font-normal">optional</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Where was this taken? What was the occasion?"
                  className="w-full border border-[--rule] bg-[--surface] rounded-lg px-3 py-2.5 text-sm text-[--ink] placeholder:text-[--ink-mute] focus:outline-none focus:border-[--gold] resize-none"
                />
              </div>

              {people.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-[--ink-soft] mb-2">
                    Who's in this photo?{" "}
                    <span className="text-[--ink-mute] font-normal">optional</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {people.map((p) => {
                      const selected = taggedIds.has(p.id);
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => toggleTag(p.id)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-medium transition-colors ${
                            selected
                              ? "bg-[--accent] border-[--accent] text-white"
                              : "border-[--rule] text-[--ink-soft] hover:border-[--gold]"
                          }`}
                        >
                          {selected && <Check className="w-3 h-3" />}
                          {personDisplayName(p)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={clearPhoto}
                  disabled={phase === "saving"}
                  className="flex-1 border border-[--rule] text-[--ink-soft] py-2.5 rounded-xl text-sm hover:bg-[--canvas] transition-colors disabled:opacity-40"
                >
                  Change photo
                </button>
                <button
                  onClick={handleSave}
                  disabled={!title.trim() || phase === "saving"}
                  className="flex-1 bg-[--accent] hover:bg-[--accent-hover] text-white py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {phase === "saving" ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving…
                    </>
                  ) : (
                    "Save photo"
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right: photo preview — desktop only */}
        {preview && phase !== "upload" && (
          <aside className="hidden lg:block sticky top-16 self-start pt-[1px]">
            <div className="relative rounded-xl overflow-hidden border border-[--rule] bg-[--surface]">
              <Image
                src={preview}
                alt="Preview"
                width={360}
                height={480}
                className="w-full object-contain max-h-[480px]"
              />
              <button
                type="button"
                onClick={clearPhoto}
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
                title="Remove photo"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
