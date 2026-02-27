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

    const now = new Date().toISOString();

    // Expire active subscriptions past their period end
    const { data: expiredActive, error: err1 } = await supabase
      .from("subscriptions")
      .update({ status: "expired" })
      .eq("status", "active")
      .lt("current_period_end", now)
      .select("user_id");

    // Expire trials past their trial end
    const { data: expiredTrials, error: err2 } = await supabase
      .from("subscriptions")
      .update({ status: "expired" })
      .eq("status", "trial")
      .lt("trial_end", now)
      .select("user_id");

    const activeExpired = expiredActive?.length || 0;
    const trialsExpired = expiredTrials?.length || 0;

    console.log(`Expired ${activeExpired} active subscriptions and ${trialsExpired} trials`);

    if (err1) console.error("Error expiring active:", err1);
    if (err2) console.error("Error expiring trials:", err2);

    return new Response(
      JSON.stringify({
        success: true,
        expiredActive: activeExpired,
        expiredTrials: trialsExpired,
        checkedAt: now,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("expire-subscriptions error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
