import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/home";
  const familyId = searchParams.get("familyId");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // If an invitation is being accepted, join the family
      if (familyId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Check not already a member
          const { data: existing } = await supabase
            .from("family_members")
            .select("id")
            .eq("family_id", familyId)
            .eq("user_id", user.id)
            .single();

          if (!existing) {
            const displayName = (user.user_metadata?.full_name as string | undefined) ?? null;
            const { error: joinError } = await supabase.from("family_members").insert({
              family_id: familyId,
              user_id: user.id,
              role: "member",
              display_name: displayName,
            });
            // If the auto-join is rejected (e.g. no matching pending invitation),
            // surface it instead of redirecting to /tree as if it succeeded — an
            // unhandled failure here leaves the user signed in with no family access.
            if (joinError) {
              return NextResponse.redirect(`${origin}/?error=join`);
            }
          }

          // Mark the invitation as accepted
          await supabase
            .from("invitations")
            .update({ status: "accepted" })
            .eq("family_id", familyId)
            .eq("email", user.email)
            .eq("status", "pending");
        }
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/?error=auth`);
}
