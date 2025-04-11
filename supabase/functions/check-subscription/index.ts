
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = "https://oyzgptyrgofrwhqaitnx.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95emdwdHlyZ29mcndocWFpdG54Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM2ODkwMTUsImV4cCI6MjA1OTI2NTAxNX0.2xyiZONxThwvswPlLHmR_8v4xM7JcjH_tyGSHAf8lXw";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // Get the authorization header from the request
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Nicht autorisiert" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify the user session
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Nicht autorisiert" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user has an active subscription
    const { data: subscription, error: subscriptionError } = await supabase
      .from("user_subscriptions")
      .select(`
        id,
        status,
        current_period_end,
        subscription_plans!inner(
          id,
          name,
          price,
          monthly_post_limit
        )
      `)
      .eq("user_id", user.id)
      .eq("status", "active")
      .single();

    if (subscriptionError) {
      // No active subscription found
      return new Response(
        JSON.stringify({ hasActiveSubscription: false }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the user's post usage
    const { data: usage, error: usageError } = await supabase
      .from("user_post_usage")
      .select("count, reset_date")
      .eq("user_id", user.id)
      .single();

    return new Response(
      JSON.stringify({
        hasActiveSubscription: true,
        subscription: subscription,
        usage: usage || { count: 0, reset_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Check subscription error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
