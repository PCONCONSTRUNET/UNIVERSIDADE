import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const MP_TOKEN = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    if (!MP_TOKEN) throw new Error("MERCADOPAGO_ACCESS_TOKEN not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error("Unauthorized");

    const body = await req.json();
    console.log("Process payment request:", JSON.stringify(body));

    const planType = body.plan || "monthly";
    const planMonths = planType === "yearly" ? 12 : 1;
    const fd = body.formData || body;

    const planConfig: Record<string, { amount: number; label: string }> = {
      monthly: { amount: 24.9, label: "Study Hakify - Plano Mensal" },
      yearly: { amount: 197, label: "Study Hakify - Plano Anual" },
    };

    const plan = planConfig[planType] || planConfig.monthly;
    
    // Build the payment payload from Brick's formData
    const paymentData: Record<string, unknown> = {
      transaction_amount: plan.amount,
      description: plan.label,
      payment_method_id: fd.payment_method_id,
      payer: {
        email: fd.payer?.email || user.email,
        ...(fd.payer?.identification && { identification: fd.payer.identification }),
      },
      statement_descriptor: "Study-Hakify",
      external_reference: `${user.id}|${planType}`,
      notification_url: `${supabaseUrl}/functions/v1/mp-webhook`,
    };

    // Add token if present (card payments)
    if (fd.token) {
      paymentData.token = fd.token;
      paymentData.installments = fd.installments || 1;
      paymentData.issuer_id = fd.issuer_id;
    }

    const mpResponse = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${MP_TOKEN}`,
        "X-Idempotency-Key": `${user.id}-${Date.now()}`,
      },
      body: JSON.stringify(paymentData),
    });

    const mpData = await mpResponse.json();
    console.log("MP payment response status:", mpData.status, "id:", mpData.id);

    if (!mpResponse.ok) {
      throw new Error(`Mercado Pago error: ${JSON.stringify(mpData)}`);
    }

    // Save payment record
    await supabase.from("payments").insert({
      user_id: user.id,
      mp_payment_id: String(mpData.id),
      status: mpData.status,
      status_detail: mpData.status_detail || null,
      payment_method: mpData.payment_method_id || null,
      payment_type: mpData.payment_type_id || null,
      transaction_amount: mpData.transaction_amount || plan.amount,
      payer_email: mpData.payer?.email || user.email || null,
      description: plan.label,
      external_reference: `${user.id}|${planType}`,
    });
    console.log(`Payment record saved for user ${user.id}, mp_id: ${mpData.id}, plan: ${planType}`);

    // If payment is approved, activate subscription immediately
    if (mpData.status === "approved") {
      const now = new Date();
      const periodEnd = new Date(now);
      periodEnd.setMonth(periodEnd.getMonth() + planMonths);

      await supabase
        .from("subscriptions")
        .upsert({
          user_id: user.id,
          status: "active",
          mp_subscription_id: String(mpData.id),
          mp_payer_email: mpData.payer?.email || null,
          current_period_start: now.toISOString(),
          current_period_end: periodEnd.toISOString(),
        }, { onConflict: "user_id" });

      console.log(`Subscription activated for user ${user.id}`);

      // Convert referral if this user was referred
      const { data: referral } = await supabase
        .from("referrals")
        .select("id, referrer_id")
        .eq("referred_id", user.id)
        .eq("status", "pending")
        .single();

      if (referral) {
        await supabase
          .from("referrals")
          .update({ status: "converted", converted_at: new Date().toISOString() })
          .eq("id", (referral as any).id);

        await supabase.rpc("process_referral_rewards", { _referrer_id: (referral as any).referrer_id });
        console.log(`Referral converted and rewards processed for referrer ${(referral as any).referrer_id}`);
      }
    }

    // Build response with PIX data if available
    const responseData: Record<string, unknown> = {
      status: mpData.status,
      status_detail: mpData.status_detail,
      id: mpData.id,
    };

    // Include PIX QR code data for pending bank_transfer payments
    if (mpData.point_of_interaction?.transaction_data) {
      responseData.point_of_interaction = mpData.point_of_interaction;
    }

    return new Response(
      JSON.stringify(responseData),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("process-payment error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
