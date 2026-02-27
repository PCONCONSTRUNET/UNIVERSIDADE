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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error("Unauthorized");

    const { data: sub } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (!sub) {
      // No subscription yet - create trial
      const now = new Date();
      const trialEnd = new Date(now);
      trialEnd.setDate(trialEnd.getDate() + 7);

      await supabase.from("subscriptions").insert({
        user_id: user.id,
        status: "trial",
        trial_start: now.toISOString(),
        trial_end: trialEnd.toISOString(),
      });

      return new Response(
        JSON.stringify({
          status: "trial",
          hasAccess: true,
          trialEnd: trialEnd.toISOString(),
          daysLeft: 7,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const now = new Date();

    // Check active subscription
    if (sub.status === "active" && sub.current_period_end) {
      const periodEnd = new Date(sub.current_period_end);
      if (periodEnd > now) {
        return new Response(
          JSON.stringify({
            status: "active",
            hasAccess: true,
            periodEnd: sub.current_period_end,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } else {
        // Period expired
        await supabase
          .from("subscriptions")
          .update({ status: "expired" })
          .eq("user_id", user.id);

        return new Response(
          JSON.stringify({ status: "expired", hasAccess: false }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Check trial
    if (sub.status === "trial") {
      const trialEnd = new Date(sub.trial_end);
      if (trialEnd > now) {
        const daysLeft = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return new Response(
          JSON.stringify({
            status: "trial",
            hasAccess: true,
            trialEnd: sub.trial_end,
            daysLeft,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } else {
        await supabase
          .from("subscriptions")
          .update({ status: "expired" })
          .eq("user_id", user.id);

        return new Response(
          JSON.stringify({ status: "expired", hasAccess: false }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    return new Response(
      JSON.stringify({ status: sub.status, hasAccess: false }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("check-subscription error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
