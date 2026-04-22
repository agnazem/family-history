export type UserRole = "admin" | "member";
export type RelationshipType = "parent_child" | "spouse" | "sibling";
export type MemoryType = "audio" | "photo" | "document" | "note";
export type InvitationStatus = "pending" | "accepted";

export interface Family {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
}

export interface FamilyMember {
  id: string;
  family_id: string;
  user_id: string;
  role: UserRole;
  joined_at: string;
  user?: {
    email: string;
    user_metadata: { full_name?: string };
  };
}

export interface Person {
  id: string;
  family_id: string;
  first_name: string;
  last_name: string;
  dob: string | null;
  dod: string | null;
  bio: string | null;
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
  person_id: string;
  family_id: string;
  type: MemoryType;
  title: string;
  description: string | null;
  storage_url: string | null;
  recorded_by: string;
  created_at: string;
  recorder?: {
    email: string;
    user_metadata: { full_name?: string };
  };
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
