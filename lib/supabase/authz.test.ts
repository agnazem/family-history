import { describe, it, expect } from "vitest";
import { requireFamilyMember, requireFamilyAdmin } from "./authz";

// The authz helpers take the Supabase client as a parameter, so we can inject a
// minimal fake that reproduces the two calls they make:
//   supabase.auth.getUser()  ->  { data: { user } }
//   supabase.from("family_members").select(...).eq(...).eq(...).single()  ->  { data }
function makeClient({ user, member }: { user: unknown; member: unknown }) {
  const query = {
    select: () => query,
    eq: () => query,
    single: async () => ({ data: member }),
  };
  return {
    auth: { getUser: async () => ({ data: { user } }) },
    from: () => query,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;
}

async function status(result: Awaited<ReturnType<typeof requireFamilyMember>>) {
  if (!result.error) return null;
  return result.error.status;
}

describe("requireFamilyMember", () => {
  it("401s when there is no authenticated user", async () => {
    const res = await requireFamilyMember(makeClient({ user: null, member: null }), "fam-1");
    expect(res.user).toBeNull();
    expect(await status(res)).toBe(401);
  });

  it("403s when the user is authenticated but not a member of the family", async () => {
    const res = await requireFamilyMember(
      makeClient({ user: { id: "u1" }, member: null }),
      "fam-1"
    );
    expect(res.user).toBeNull();
    expect(await status(res)).toBe(403);
  });

  it("passes when the user is a member", async () => {
    const res = await requireFamilyMember(
      makeClient({ user: { id: "u1" }, member: { id: "m1" } }),
      "fam-1"
    );
    expect(res.error).toBeNull();
    expect(res.user).toEqual({ id: "u1" });
  });
});

describe("requireFamilyAdmin", () => {
  it("401s when there is no authenticated user", async () => {
    const res = await requireFamilyAdmin(makeClient({ user: null, member: null }), "fam-1");
    expect(await status(res)).toBe(401);
  });

  it("403s when the member is not an admin", async () => {
    const res = await requireFamilyAdmin(
      makeClient({ user: { id: "u1" }, member: { role: "member" } }),
      "fam-1"
    );
    expect(res.user).toBeNull();
    expect(await status(res)).toBe(403);
  });

  it("403s when the user is not a member at all", async () => {
    const res = await requireFamilyAdmin(
      makeClient({ user: { id: "u1" }, member: null }),
      "fam-1"
    );
    expect(await status(res)).toBe(403);
  });

  it("passes when the member is an admin", async () => {
    const res = await requireFamilyAdmin(
      makeClient({ user: { id: "u1" }, member: { role: "admin" } }),
      "fam-1"
    );
    expect(res.error).toBeNull();
    expect(res.user).toEqual({ id: "u1" });
  });
});
