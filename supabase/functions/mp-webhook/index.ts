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

    const body = await req.json();
    console.log("MP Webhook received:", JSON.stringify(body));

    // Mercado Pago sends different notification types
    if (body.type === "payment" || body.action === "payment.created" || body.action === "payment.updated") {
      const paymentId = body.data?.id;
      if (!paymentId) {
        return new Response(JSON.stringify({ received: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Fetch payment details from MP
      const paymentRes = await fetch(
        `https://api.mercadopago.com/v1/payments/${paymentId}`,
        { headers: { Authorization: `Bearer ${MP_TOKEN}` } }
      );
      const payment = await paymentRes.json();
      console.log("Payment details - status:", payment.status, "id:", paymentId);

      // external_reference format: "userId|planType"
      const refParts = (payment.external_reference || "").split("|");
      const userId = refParts[0];
      const planType = refParts[1] || "monthly";

      if (!userId) {
        console.log("No user_id in external_reference");
        return new Response(JSON.stringify({ received: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Upsert payment record
      const { error: paymentError } = await supabase
        .from("payments")
        .upsert({
          user_id: userId,
          mp_payment_id: String(paymentId),
          status: payment.status,
          status_detail: payment.status_detail || null,
          payment_method: payment.payment_method_id || null,
          payment_type: payment.payment_type_id || null,
          transaction_amount: payment.transaction_amount || 0,
          payer_email: payment.payer?.email || null,
          description: payment.description || null,
          external_reference: payment.external_reference,
        }, { onConflict: "mp_payment_id" });
      
      if (paymentError) {
        console.error("Error saving payment record:", paymentError);
      } else {
        console.log(`Payment record upserted for user ${userId}, mp_id: ${paymentId}, plan: ${planType}`);
      }

      if (payment.status === "approved") {
        const now = new Date();
        const periodEnd = new Date(now);
        // Annual plan = 12 months, monthly = 1 month
        const months = planType === "yearly" ? 12 : 1;
        periodEnd.setMonth(periodEnd.getMonth() + months);

        await supabase
          .from("subscriptions")
          .upsert({
            user_id: userId,
            status: "active",
            mp_subscription_id: String(paymentId),
            mp_payer_email: payment.payer?.email || null,
            current_period_start: now.toISOString(),
            current_period_end: periodEnd.toISOString(),
          }, { onConflict: "user_id" });

        console.log(`Subscription activated for user ${userId}, plan: ${planType}, period: ${months} months`);

        // Convert referral if this user was referred
        const { data: referral } = await supabase
          .from("referrals")
          .select("id, referrer_id")
          .eq("referred_id", userId)
          .eq("status", "pending")
          .single();

        if (referral) {
          await supabase
            .from("referrals")
            .update({ status: "converted", converted_at: now.toISOString() })
            .eq("id", referral.id);

          console.log(`Referral converted for referrer ${referral.referrer_id}`);

          // Process rewards for referrer
          await supabase.rpc("process_referral_rewards", { _referrer_id: referral.referrer_id });
          console.log(`Referral rewards processed for referrer ${referral.referrer_id}`);
        }
      } else if (payment.status === "rejected" || payment.status === "cancelled") {
        await supabase
          .from("subscriptions")
          .update({ status: "expired" })
          .eq("user_id", userId);
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("mp-webhook error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
