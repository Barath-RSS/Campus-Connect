// One-off admin utility: wipes all users + data and creates one account per role.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    // Wipe data tables
    await supabase.from("reports").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("access_requests").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("password_reset_codes").delete().neq("id", "00000000-0000-0000-0000-000000000000");

    // Wipe storage
    const { data: files } = await supabase.storage.from("issue-images").list("", { limit: 1000 });
    if (files?.length) {
      await supabase.storage.from("issue-images").remove(files.map((f) => f.name));
    }

    // Delete all auth users (cascades to profiles + user_roles)
    let page = 1;
    while (true) {
      const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 100 });
      if (error) throw error;
      if (!data.users.length) break;
      for (const u of data.users) {
        await supabase.auth.admin.deleteUser(u.id);
      }
      if (data.users.length < 100) break;
    }

    const created: any[] = [];

    const mkUser = async (
      email: string,
      password: string,
      meta: Record<string, string>,
      role: "student" | "official" | "staff"
    ) => {
      const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: meta,
      });
      if (error) throw new Error(`${email}: ${error.message}`);
      const uid = data.user!.id;

      // handle_new_user trigger inserts profile + 'student' role. Adjust for others.
      if (role !== "student") {
        await supabase.from("user_roles").delete().eq("user_id", uid);
        await supabase.from("user_roles").insert({ user_id: uid, role });
      }
      created.push({ role, email, password, user_id: uid, ...meta });
    };

    await mkUser(
      "student.demo@sathyabama.ac.in",
      "Student@12345",
      { full_name: "Demo Student", register_no: "REG1001", contact_number: "+919000000001" },
      "student"
    );

    await mkUser(
      "official.demo@sathyabama.ac.in",
      "Official@12345",
      { full_name: "Demo Official", contact_number: "+919000000002" },
      "official"
    );

    await mkUser(
      "staff.demo@sathyabama.ac.in",
      "Staff@12345",
      { full_name: "Demo Staff", emp_id: "EMP1001", contact_number: "+919000000003" },
      "staff"
    );

    return new Response(JSON.stringify({ ok: true, accounts: created }, null, 2), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String((e as Error).message) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
