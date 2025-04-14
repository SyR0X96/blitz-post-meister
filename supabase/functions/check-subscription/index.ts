
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = "https://oyzgptyrgofrwhqaitnx.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95emdwdHlyZ29mcndocWFpdG54Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM2ODkwMTUsImV4cCI6MjA1OTI2NTAxNX0.2xyiZONxThwvswPlLHmR_8v4xM7JcjH_tyGSHAf8lXw";

// Helper function for logging
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");
    
    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    // Get the authorization header from the request
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      logStep("No authorization header");
      return new Response(
        JSON.stringify({ error: "Nicht autorisiert" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify the user session
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      logStep("User not authenticated", { error: userError });
      return new Response(
        JSON.stringify({ error: "Nicht autorisiert" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Check if user has an active subscription in database
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
    
    logStep("Database subscription check completed", { 
      found: !!subscription, 
      error: subscriptionError ? subscriptionError.message : null 
    });

    // If active subscription is found in the database
    if (subscription) {
      // Verify the subscription with Stripe (as an extra validation step)
      try {
        const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
        if (stripeKey) {
          const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
          
          // Check if there's a Stripe subscription ID
          if (subscription.stripe_subscription_id) {
            const stripeSubscription = await stripe.subscriptions.retrieve(
              subscription.stripe_subscription_id
            );
            
            // If Stripe says the subscription is not active, update our database
            if (stripeSubscription.status !== 'active') {
              logStep("Stripe subscription status mismatch", { 
                databaseStatus: subscription.status, 
                stripeStatus: stripeSubscription.status 
              });
              
              await supabase
                .from("user_subscriptions")
                .update({
                  status: stripeSubscription.status,
                  updated_at: new Date().toISOString(),
                })
                .eq("id", subscription.id);
              
              // If no longer active, return false for hasActiveSubscription
              if (stripeSubscription.status !== 'active') {
                logStep("Subscription not active according to Stripe");
                return new Response(
                  JSON.stringify({ hasActiveSubscription: false }),
                  { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
              }
            }
          }
        }
      } catch (stripeError) {
        // Log the error but don't fail the request - trust our database
        logStep("Error verifying with Stripe", { error: stripeError.message });
      }
    }

    // Get the user's post usage
    const { data: usage, error: usageError } = await supabase
      .from("user_post_usage")
      .select("count, reset_date")
      .eq("user_id", user.id)
      .single();
    
    logStep("Usage data retrieved", { 
      found: !!usage, 
      error: usageError ? usageError.message : null 
    });
    
    // Create default usage data if none exists
    if (usageError && usageError.code === 'PGRST116') { // Record not found
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      
      const { data: newUsage, error: newUsageError } = await supabase
        .from("user_post_usage")
        .insert({
          user_id: user.id,
          count: 0,
          reset_date: nextMonth.toISOString(),
        })
        .select()
        .single();
      
      if (!newUsageError) {
        logStep("Created new usage record", { usage: newUsage });
      } else {
        logStep("Error creating usage record", { error: newUsageError });
      }
    }

    // Return the response
    if (!subscriptionError && subscription) {
      logStep("Active subscription found", { subscription });
      return new Response(
        JSON.stringify({
          hasActiveSubscription: true,
          subscription: subscription,
          usage: usage || { count: 0, reset_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() },
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      logStep("No active subscription found");
      return new Response(
        JSON.stringify({
          hasActiveSubscription: false,
          usage: usage || { count: 0, reset_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() },
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("Check subscription error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
