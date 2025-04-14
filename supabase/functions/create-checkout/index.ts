
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = "https://oyzgptyrgofrwhqaitnx.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95emdwdHlyZ29mcndocWFpdG54Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM2ODkwMTUsImV4cCI6MjA1OTI2NTAxNX0.2xyiZONxThwvswPlLHmR_8v4xM7JcjH_tyGSHAf8lXw";

// Helper function to log steps (useful for debugging)
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");
    
    // Initialize Supabase and Stripe
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });
    
    logStep("Clients initialized");

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
    
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Parse the request body to get the plan ID
    const { planId } = await req.json();
    if (!planId) {
      return new Response(
        JSON.stringify({ error: "Plan ID fehlt" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    logStep("Plan ID received", { planId });

    // Get the plan from the database
    const { data: planData, error: planError } = await supabase
      .from("subscription_plans")
      .select("*")
      .eq("id", planId)
      .single();

    if (planError || !planData) {
      logStep("Plan not found", { error: planError });
      return new Response(
        JSON.stringify({ error: "Plan nicht gefunden" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    logStep("Plan found", { plan: planData });
    
    // Verify that we have a valid Stripe price ID
    if (!planData.stripe_price_id) {
      logStep("Missing Stripe price ID", { planId: planData.id, name: planData.name });
      return new Response(
        JSON.stringify({ error: "Stripe Price ID fehlt für diesen Plan" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    logStep("Stripe price ID found", { stripeId: planData.stripe_price_id });

    // Check if user already has a customer ID
    let customerId;
    const { data: customerData } = await supabase
      .from("user_subscriptions")
      .select("stripe_subscription_id, stripe_customer_id")
      .eq("user_id", user.id)
      .not("stripe_subscription_id", "is", null)
      .single();

    if (customerData?.stripe_customer_id) {
      customerId = customerData.stripe_customer_id;
      logStep("Existing customer found", { customerId });
    } else {
      // Create a new customer or get existing one
      const customers = await stripe.customers.list({ email: user.email, limit: 1 });
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
        logStep("Found existing Stripe customer", { customerId });
      } else {
        const customer = await stripe.customers.create({
          email: user.email,
          metadata: { user_id: user.id },
        });
        customerId = customer.id;
        logStep("Created new Stripe customer", { customerId });
      }
    }

    // Create a checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: planData.stripe_price_id, // Use the price ID from the database
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${req.headers.get("origin")}/subscription-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/subscriptions`,
      metadata: {
        user_id: user.id,
        plan_id: planId,
      },
      payment_method_types: ["card"],
      subscription_data: {
        metadata: {
          user_id: user.id,
          plan_id: planId,
        },
      },
    });
    
    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    // Pre-create or update the subscription record with pending status
    const now = new Date();
    const oneMonthLater = new Date();
    oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);
    
    const { data: subscriptionRecord, error: subscriptionError } = await supabase
      .from("user_subscriptions")
      .upsert({
        user_id: user.id,
        subscription_plan_id: planId,
        status: "incomplete", // Will be updated to active after successful payment
        stripe_customer_id: customerId,
        stripe_subscription_id: null, // Will be updated after successful payment
        current_period_start: now.toISOString(),
        current_period_end: oneMonthLater.toISOString(),
        cancel_at_period_end: false,
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      }, { onConflict: 'user_id' })
      .select();
      
    if (subscriptionError) {
      logStep("Error creating subscription record", { error: subscriptionError });
    } else {
      logStep("Subscription record created/updated", { record: subscriptionRecord });
    }

    // Return the checkout URL
    return new Response(
      JSON.stringify({ url: session.url }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Checkout error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
