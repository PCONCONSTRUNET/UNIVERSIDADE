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

    const { returnUrl, plan: planType } = await req.json();

    const planConfig: Record<string, { amount: number; label: string; description: string; months: number }> = {
      monthly: { amount: 24.9, label: "Study Hakify - Plano Mensal", description: "Assinatura mensal Study Hakify - Gestão acadêmica inteligente", months: 1 },
      yearly: { amount: 197, label: "Study Hakify - Plano Anual", description: "Assinatura anual Study Hakify - Gestão acadêmica inteligente (economize R$101,80)", months: 12 },
    };

    const plan = planConfig[planType || "monthly"] || planConfig.monthly;

    // Create Mercado Pago Checkout Pro preference
    const mpResponse = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${MP_TOKEN}`,
      },
      body: JSON.stringify({
        items: [
          {
            title: plan.label,
            description: plan.description,
            quantity: 1,
            unit_price: plan.amount,
            currency_id: "BRL",
          },
        ],
        payment_methods: {
          installments: planType === "yearly" ? 3 : 1,
          default_installments: planType === "yearly" ? 3 : 1,
        },
        statement_descriptor: "Study-Hakify",
        payer: {
          email: user.email,
        },
        back_urls: {
          success: returnUrl || "https://studyhakify.com/",
          failure: returnUrl || "https://studyhakify.com/",
          pending: returnUrl || "https://studyhakify.com/",
        },
        auto_return: "approved",
        external_reference: `${user.id}|${planType || "monthly"}`,
        notification_url: `${supabaseUrl}/functions/v1/mp-webhook`,
      }),
    });

    const mpData = await mpResponse.json();
    if (!mpResponse.ok) {
      throw new Error(`Mercado Pago error: ${JSON.stringify(mpData)}`);
    }

    // Ensure subscription row exists
    const { data: existing } = await supabase
      .from("subscriptions")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!existing) {
      await supabase.from("subscriptions").insert({
        user_id: user.id,
        status: "trial",
      });
    }

    return new Response(
      JSON.stringify({
        init_point: mpData.init_point,
        sandbox_init_point: mpData.sandbox_init_point,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("create-checkout error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
