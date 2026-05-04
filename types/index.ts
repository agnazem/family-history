export type UserRole = "admin" | "member";
export type RelationshipType = "parent_child" | "spouse" | "sibling";
export type MemoryType = "audio" | "photo" | "document" | "note";
export type InvitationStatus = "pending" | "accepted";
export type TranscriptStatus = "none" | "pending" | "streaming" | "finalizing" | "ready" | "failed";
export type MemoryPersonRole = "subject" | "mentioned" | "narrator";

export interface Family {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
  root_person_id: string | null;
}

export interface GenColumn {
  normGen: number;
  relGen: number;
  x: number;
  label: string;
  decade: string | null;
}

export interface FamilyMember {
  id: string;
  family_id: string;
  user_id: string;
  role: UserRole;
  joined_at: string;
  display_name: string | null;
  can_edit_tree: boolean;
  can_edit_memories: boolean;
  user?: {
    email: string;
    user_metadata: { full_name?: string };
  };
}

export type PermissionKey = "can_edit_tree" | "can_edit_memories";

export interface PermissionRequest {
  id: string;
  family_id: string;
  user_id: string;
  permission: PermissionKey;
  status: "pending" | "approved" | "denied";
  created_at: string;
  display_name?: string | null;
  email?: string;
}

export interface Person {
  id: string;
  family_id: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  nickname: string | null;
  dob: string | null;
  dod: string | null;
  bio: string | null;
  ai_summary: string | null;
  profile_photo_url: string | null;
  canvas_x: number;
  canvas_y: number;
  created_by: string;
  created_at: string;
}

export interface Relationship {
  id: string;
  family_id: string;
  person_a_id: string;
  person_b_id: string;
  type: RelationshipType;
}

export interface Memory {
  id: string;
  family_id: string;
  type: MemoryType;
  title: string;
  description: string | null;
  storage_url: string | null;
  audio_mp3_url: string | null;
  recorded_by: string;
  date_of_memory: string | null;
  created_at: string;
  deleted_at: string | null;
  transcript: string | null;
  transcript_draft: string | null;
  duration_sec: number | null;
  recorded_at: string | null;
  recorded_at_note: string | null;
  transcript_status: TranscriptStatus;
  transcript_summary: string | null;
  recorder?: {
    email: string;
    user_metadata: { full_name?: string };
  };
}

export interface MemoryPerson {
  id: string;
  memory_id: string;
  person_id: string;
  family_id: string;
  role: MemoryPersonRole;
}

export interface MemoryComment {
  id: string;
  memory_id: string;
  family_id: string;
  user_id: string;
  text: string;
  parent_id: string | null;
  created_at: string;
}

export interface Invitation {
  id: string;
  family_id: string;
  email: string;
  token: string;
  invited_by: string;
  status: InvitationStatus;
  created_at: string;
}
