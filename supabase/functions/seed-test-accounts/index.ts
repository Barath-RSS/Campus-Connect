import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Generate a 1x1 black JPEG as a Uint8Array
function createBlackImage(): Uint8Array {
  // Minimal valid JPEG: 1x1 black pixel
  const bytes = [
    0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
    0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,
    0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
    0x09, 0x08, 0x0A, 0x0C, 0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12,
    0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D, 0x1A, 0x1C, 0x1C, 0x20,
    0x24, 0x2E, 0x27, 0x20, 0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29,
    0x2C, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27, 0x39, 0x3D, 0x38, 0x32,
    0x3C, 0x2E, 0x33, 0x34, 0x32, 0xFF, 0xC0, 0x00, 0x0B, 0x08, 0x00, 0x01,
    0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xFF, 0xC4, 0x00, 0x1F, 0x00, 0x00,
    0x01, 0x05, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08,
    0x09, 0x0A, 0x0B, 0xFF, 0xC4, 0x00, 0xB5, 0x10, 0x00, 0x02, 0x01, 0x03,
    0x03, 0x02, 0x04, 0x03, 0x05, 0x05, 0x04, 0x04, 0x00, 0x00, 0x01, 0x7D,
    0x01, 0x02, 0x03, 0x00, 0x04, 0x11, 0x05, 0x12, 0x21, 0x31, 0x41, 0x06,
    0x13, 0x51, 0x61, 0x07, 0x22, 0x71, 0x14, 0x32, 0x81, 0x91, 0xA1, 0x08,
    0x23, 0x42, 0xB1, 0xC1, 0x15, 0x52, 0xD1, 0xF0, 0x24, 0x33, 0x62, 0x72,
    0x82, 0x09, 0x0A, 0x16, 0x17, 0x18, 0x19, 0x1A, 0x25, 0x26, 0x27, 0x28,
    0x29, 0x2A, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x3A, 0x43, 0x44, 0x45,
    0x46, 0x47, 0x48, 0x49, 0x4A, 0x53, 0x54, 0x55, 0x56, 0x57, 0x58, 0x59,
    0x5A, 0x63, 0x64, 0x65, 0x66, 0x67, 0x68, 0x69, 0x6A, 0x73, 0x74, 0x75,
    0x76, 0x77, 0x78, 0x79, 0x7A, 0x83, 0x84, 0x85, 0x86, 0x87, 0x88, 0x89,
    0x8A, 0x92, 0x93, 0x94, 0x95, 0x96, 0x97, 0x98, 0x99, 0x9A, 0xA2, 0xA3,
    0xA4, 0xA5, 0xA6, 0xA7, 0xA8, 0xA9, 0xAA, 0xB2, 0xB3, 0xB4, 0xB5, 0xB6,
    0xB7, 0xB8, 0xB9, 0xBA, 0xC2, 0xC3, 0xC4, 0xC5, 0xC6, 0xC7, 0xC8, 0xC9,
    0xCA, 0xD2, 0xD3, 0xD4, 0xD5, 0xD6, 0xD7, 0xD8, 0xD9, 0xDA, 0xE1, 0xE2,
    0xE3, 0xE4, 0xE5, 0xE6, 0xE7, 0xE8, 0xE9, 0xEA, 0xF1, 0xF2, 0xF3, 0xF4,
    0xF5, 0xF6, 0xF7, 0xF8, 0xF9, 0xFA, 0xFF, 0xDA, 0x00, 0x08, 0x01, 0x01,
    0x00, 0x00, 0x3F, 0x00, 0x7B, 0x94, 0x11, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xFF, 0xD9,
  ];
  return new Uint8Array(bytes);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { confirm } = await req.json().catch(() => ({}));
    if (confirm !== "SEED_ACCOUNTS") {
      return new Response(
        JSON.stringify({ error: 'Confirm with { "confirm": "SEED_ACCOUNTS" }' }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const url = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    if (!url || !serviceKey) {
      return new Response(
        JSON.stringify({ error: "Server not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

    // Helper: create user and return user_id
    const createUser = async (email: string, password: string, metadata: Record<string, string>) => {
      // Check if user already exists
      const { data: existingUsers } = await admin.auth.admin.listUsers({ perPage: 1000 });
      const existing = existingUsers?.users?.find(u => u.email === email);
      if (existing) return existing.id;

      const { data, error } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: metadata,
      });
      if (error) throw new Error(`Failed to create ${email}: ${error.message}`);
      return data.user.id;
    };

    // Helper: upload black image to storage and get public URL
    const uploadBlackImage = async (fileName: string): Promise<string> => {
      const imgBytes = createBlackImage();
      const { error } = await admin.storage.from("issue-images").upload(fileName, imgBytes, {
        contentType: "image/jpeg",
        upsert: true,
      });
      if (error) throw new Error(`Upload failed for ${fileName}: ${error.message}`);
      const { data: urlData } = admin.storage.from("issue-images").getPublicUrl(fileName);
      return urlData.publicUrl;
    };

    const results: any = { students: [], staff: [], reports: [], staffResolvedReports: [] };

    // ===== CREATE 3 STUDENTS =====
    const students = [
      { email: "student1@test.com", password: "Student@1234", fullName: "Arjun Kumar", registerNo: "41110001" },
      { email: "student2@test.com", password: "Student@1234", fullName: "Priya Sharma", registerNo: "41110002" },
      { email: "student3@test.com", password: "Student@1234", fullName: "Ravi Patel", registerNo: "41110003" },
    ];

    const studentIds: string[] = [];
    for (const s of students) {
      const uid = await createUser(s.email, s.password, {
        full_name: s.fullName,
        register_no: s.registerNo,
      });
      studentIds.push(uid);
      results.students.push({ email: s.email, password: s.password, fullName: s.fullName, registerNo: s.registerNo, userId: uid });
    }

    // ===== CREATE 2 STAFF =====
    const staffAccounts = [
      { email: "emp001@staff.campusconnect.local", password: "Staff@1234", fullName: "Mohan Rajan", empId: "EMP001", contact: "9876543210" },
      { email: "emp002@staff.campusconnect.local", password: "Staff@1234", fullName: "Lakshmi Devi", empId: "EMP002", contact: "9876543211" },
    ];

    const staffIds: string[] = [];
    for (const st of staffAccounts) {
      const uid = await createUser(st.email, st.password, {
        full_name: st.fullName,
        emp_id: st.empId,
        contact_number: st.contact,
      });
      // Update role to staff
      const { error: roleError } = await admin.from("user_roles").update({ role: "staff" }).eq("user_id", uid);
      if (roleError) {
        console.error(`Role update failed for ${st.empId}:`, roleError);
      }
      staffIds.push(uid);
      results.staff.push({ empId: st.empId, password: st.password, fullName: st.fullName, contact: st.contact, userId: uid });
    }

    // ===== CREATE OFFICIAL (if not exists) =====
    const officialEmail = "official@sathyabama.ac.in";
    const officialPassword = "Official@123";
    const officialUid = await createUser(officialEmail, officialPassword, { full_name: "Head Official" });
    await admin.from("user_roles").update({ role: "official" }).eq("user_id", officialUid);
    results.official = { email: officialEmail, password: officialPassword };

    // ===== CREATE REPORTS WITH IMAGES =====
    // Random locations around Chennai / Sathyabama
    const locations = [
      { lat: 12.8231, lng: 80.0438, landmark: "Main Building - Ground Floor Corridor" },
      { lat: 12.8215, lng: 80.0452, landmark: "Library - Second Floor" },
      { lat: 12.8240, lng: 80.0425, landmark: "Mechanical Lab Block" },
      { lat: 12.8228, lng: 80.0465, landmark: "Boys Hostel - Block A" },
      { lat: 12.8250, lng: 80.0410, landmark: "Cafeteria Area" },
      { lat: 12.8235, lng: 80.0445, landmark: "Computer Science Department" },
      { lat: 12.8220, lng: 80.0430, landmark: "Parking Lot - North Gate" },
      { lat: 12.8245, lng: 80.0460, landmark: "Sports Complex" },
    ];

    const reportTemplates = [
      { category: "infrastructure", subCategory: "classroom", description: "Broken fan in classroom 301. Not rotating at all, making the room very hot.", anonymous: false },
      { category: "infrastructure", subCategory: "lab", description: "Water leakage in chemistry lab near the storage cabinet. Floor is slippery.", anonymous: false },
      { category: "infrastructure", subCategory: "others", description: "Street light near the main entrance is not working. Very dark at night.", anonymous: false },
      { category: "personal", subCategory: "harassment", description: "Facing verbal abuse from senior students near the canteen area during lunch break.", anonymous: true },
      { category: "security", subCategory: "theft", description: "My laptop charger was stolen from the library desk while I was away for 5 minutes.", anonymous: false },
      { category: "infrastructure", subCategory: "classroom", description: "Projector in seminar hall is displaying distorted colors. Cannot read slides properly.", anonymous: false },
      { category: "infrastructure", subCategory: "others", description: "Elevator in Block B is stuck on the 3rd floor. Making loud grinding noises.", anonymous: false },
      { category: "security", subCategory: "suspicious_activity", description: "Unknown person seen roaming near girls hostel after 10 PM without ID card.", anonymous: true },
    ];

    // Create 8 reports spread across 3 students
    const createdReportIds: string[] = [];
    for (let i = 0; i < 8; i++) {
      const studentIndex = i % 3;
      const loc = locations[i];
      const tmpl = reportTemplates[i];

      // Upload 1-3 black images per report
      const numImages = (i % 3) + 1; // 1, 2, or 3 images
      const imageUrls: (string | null)[] = [null, null, null];
      for (let j = 0; j < numImages; j++) {
        const fileName = `seed-report-${i}-img-${j}-${Date.now()}.jpg`;
        imageUrls[j] = await uploadBlackImage(fileName);
      }

      const { data: reportData, error: reportError } = await admin.from("reports").insert({
        user_id: studentIds[studentIndex],
        category: tmpl.category,
        sub_category: tmpl.subCategory,
        description: tmpl.description,
        landmark: loc.landmark,
        lat: loc.lat,
        lng: loc.lng,
        is_anonymous: tmpl.anonymous,
        image_url: imageUrls[0],
        image_url_2: imageUrls[1],
        image_url_3: imageUrls[2],
        status: "pending",
      }).select("id").single();

      if (reportError) {
        console.error(`Report ${i} error:`, reportError);
        continue;
      }

      createdReportIds.push(reportData.id);
      results.reports.push({
        id: reportData.id,
        student: students[studentIndex].fullName,
        subCategory: tmpl.subCategory,
        location: loc.landmark,
        gpsLink: `https://www.google.com/maps?q=${loc.lat},${loc.lng}`,
        images: numImages,
      });
    }

    // ===== STAFF HANDLES SOME REPORTS =====
    // Staff 1 (EMP001) resolves reports 0,1,2 — Staff 2 (EMP002) resolves report 3
    // Reports 4-7 stay pending
    const staffResolutions = [
      { reportIndex: 0, staffIndex: 0 },
      { reportIndex: 1, staffIndex: 0 },
      { reportIndex: 2, staffIndex: 0 },
      { reportIndex: 3, staffIndex: 1 },
    ];

    for (const res of staffResolutions) {
      if (!createdReportIds[res.reportIndex]) continue;
      const completionFileName = `seed-completion-${res.reportIndex}-${Date.now()}.jpg`;
      const completionUrl = await uploadBlackImage(completionFileName);

      const { error: updateError } = await admin.from("reports").update({
        status: "resolved",
        completion_image_url: completionUrl,
        official_response: "Work completed by service staff. Issue has been fixed.",
        resolved_by: staffIds[res.staffIndex],
      }).eq("id", createdReportIds[res.reportIndex]);

      if (updateError) {
        console.error(`Resolve report ${res.reportIndex} error:`, updateError);
      } else {
        results.staffResolvedReports.push({
          reportId: createdReportIds[res.reportIndex],
          resolvedBy: staffAccounts[res.staffIndex].empId,
          staffName: staffAccounts[res.staffIndex].fullName,
        });
      }
    }

    // Set reports 4,5 to investigating (active for staff)
    for (const idx of [4, 5]) {
      if (createdReportIds[idx]) {
        await admin.from("reports").update({ status: "investigating" }).eq("id", createdReportIds[idx]);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        summary: {
          studentsCreated: results.students.length,
          staffCreated: results.staff.length,
          reportsCreated: results.reports.length,
          reportsResolved: results.staffResolvedReports.length,
        },
        accounts: {
          students: results.students.map((s: any) => ({
            email: s.email, password: s.password, fullName: s.fullName, registerNo: s.registerNo,
          })),
          staff: results.staff.map((s: any) => ({
            empId: s.empId, password: s.password, fullName: s.fullName, contact: s.contact,
            loginNote: `Login with EMP ID: ${s.empId} and password: ${s.password}`,
          })),
          official: results.official,
        },
        reports: results.reports,
        staffResolutions: results.staffResolvedReports,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("Seed error:", msg);
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
