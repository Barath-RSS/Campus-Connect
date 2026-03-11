// Edge function to send password reset link via SMS to staff using Twilio
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { contactNumber } = await req.json();

    if (!contactNumber) {
      return new Response(
        JSON.stringify({ error: "Contact number is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const url = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const twilioSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const twilioToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const twilioPhone = Deno.env.get("TWILIO_PHONE_NUMBER");

    if (!url || !serviceKey) {
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!twilioSid || !twilioToken || !twilioPhone) {
      console.error("Missing Twilio configuration");
      return new Response(
        JSON.stringify({ error: "SMS service not configured. Please contact admin." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

    // Normalize phone number - ensure it has country code
    let normalizedPhone = contactNumber.replace(/\D/g, '');
    if (normalizedPhone.length === 10) {
      normalizedPhone = `91${normalizedPhone}`; // Default to India
    }
    if (!normalizedPhone.startsWith('+')) {
      normalizedPhone = `+${normalizedPhone}`;
    }

    // Look up staff profile by contact number
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("user_id, email, full_name, contact_number")
      .or(`contact_number.eq.${contactNumber},contact_number.eq.${normalizedPhone.replace('+', '')}`)
      .maybeSingle();

    if (profileError) {
      console.error("Profile lookup error:", profileError);
    }

    // Even if not found, don't reveal that
    if (!profile?.email) {
      // Still return success for security (don't reveal if number exists)
      return new Response(
        JSON.stringify({ success: true, message: "If this number is registered, an SMS will be sent." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if the user is actually staff
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", profile.user_id)
      .eq("role", "staff")
      .maybeSingle();

    if (!roleData) {
      return new Response(
        JSON.stringify({ success: true, message: "If this number is registered, an SMS will be sent." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate password reset link using Supabase Admin API
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: profile.email,
      options: {
        redirectTo: `${url.replace('.supabase.co', '.lovable.app')}/reset-password`,
      }
    });

    if (linkError) {
      console.error("Link generation error:", linkError);
      return new Response(
        JSON.stringify({ error: "Failed to generate reset link" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // The action_link from generateLink contains the token
    const resetLink = linkData?.properties?.action_link;
    
    if (!resetLink) {
      console.error("No action link returned");
      return new Response(
        JSON.stringify({ error: "Failed to create reset link" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send SMS via Twilio
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`;
    const smsBody = `Campus Connect Password Reset\n\nHi ${profile.full_name || 'Staff'},\n\nClick the link below to reset your password:\n${resetLink}\n\nThis link expires in 1 hour.\n\nIf you didn't request this, ignore this message.`;

    const twilioResponse = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${twilioSid}:${twilioToken}`)}`,
      },
      body: new URLSearchParams({
        To: normalizedPhone,
        From: twilioPhone,
        Body: smsBody,
      }),
    });

    const twilioResult = await twilioResponse.json();

    if (!twilioResponse.ok) {
      console.error("Twilio error:", twilioResult);
      return new Response(
        JSON.stringify({ error: "Failed to send SMS. Please check your phone number." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`SMS sent successfully to ${normalizedPhone}, SID: ${twilioResult.sid}`);

    return new Response(
      JSON.stringify({ success: true, message: "Password reset SMS sent successfully" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("Send SMS error:", msg);
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
