// =============================================================================
// Bangla Haat — Supabase Edge Function: Send Customer Inquiries via Resend
// =============================================================================

// Declare Deno namespace for IDE / TypeScript environments without Deno language server
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
  serve(handler: (req: Request) => Promise<Response> | Response): void;
};

const STORE_OWNER_EMAIL = "ankitmajumdar27@gmail.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ error: "Missing RESEND_API_KEY in Supabase environment secrets." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { name, email, subject, message } = await req.json();

    if (!email || !message) {
      return new Response(
        JSON.stringify({ error: "Missing required fields (email and message)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eadfce; border-radius: 12px; background: #fffdf9;">
        <div style="border-bottom: 2px solid #a23334; padding-bottom: 12px; margin-bottom: 18px;">
          <h2 style="color: #a23334; margin: 0;">Bangla Haat — New Customer Inquiry</h2>
          <p style="color: #85766d; margin: 4px 0 0; font-size: 13px;">Received via the online store portal</p>
        </div>

        <p style="font-size: 15px; line-height: 1.5; color: #2b1f1a;">
          <strong>From:</strong> ${name || "Customer"} &lt;<a href="mailto:${email}">${email}</a>&gt;<br>
          <strong>Subject:</strong> ${subject || "Customer Inquiry"}<br>
          <strong>Date:</strong> ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}
        </p>

        <div style="background: #faf4ea; border-left: 4px solid #a23334; padding: 16px; border-radius: 6px; margin: 20px 0;">
          <h4 style="margin: 0 0 8px; color: #2b1f1a; font-size: 14px;">Customer Message:</h4>
          <p style="margin: 0; white-space: pre-wrap; font-size: 14px; line-height: 1.6; color: #3a2e26;">${message}</p>
        </div>

        <p style="font-size: 13px; color: #85766d; border-top: 1px solid #eadfce; padding-top: 14px; margin-top: 24px;">
          You can reply directly to this email to respond to <strong>${name || "the customer"}</strong> at <strong>${email}</strong>.
        </p>
      </div>
    `;

    // Dispatch via Resend REST API
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Bangla Haat <onboarding@resend.dev>",
        to: [STORE_OWNER_EMAIL],
        reply_to: email,
        subject: `[Bangla Haat] ${subject || "New Customer Inquiry"}`,
        html: htmlContent,
      }),
    });

    const resendData = await res.json();

    if (!res.ok) {
      throw new Error(resendData.message || `Resend error code ${res.status}`);
    }

    return new Response(
      JSON.stringify({ success: true, id: resendData.id, recipient: STORE_OWNER_EMAIL }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

