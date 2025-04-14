
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@14.21.0";

const SUPABASE_URL = "https://oyzgptyrgofrwhqaitnx.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

// Helper function to log steps (useful for debugging)
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  try {
    logStep("Webhook received");
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Create Supabase client with admin privileges
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Get the signature from the request header
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      logStep("Missing signature");
      return new Response(JSON.stringify({ error: "Missing signature" }), { status: 400 });
    }

    // Get the raw request body
    const body = await req.text();
    
    // Verify the event with Stripe
    let event;
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") || "";
    
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        webhookSecret
      );
      logStep("Event constructed", { type: event.type });
    } catch (err) {
      logStep("Webhook error", { error: err.message });
      return new Response(JSON.stringify({ error: err.message }), { status: 400 });
    }

    // Handle the event
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        logStep("Checkout session completed", { 
          sessionId: session.id, 
          customerId: session.customer,
          subscriptionId: session.subscription
        });
        
        if (session.subscription && session.metadata?.user_id && session.metadata?.plan_id) {
          // Update user subscription
          const { error } = await supabase
            .from("user_subscriptions")
            .upsert({
              user_id: session.metadata.user_id,
              subscription_plan_id: session.metadata.plan_id,
              status: "active",
              stripe_customer_id: session.customer,
              stripe_subscription_id: session.subscription,
              updated_at: new Date().toISOString(),
            }, { onConflict: 'user_id' });
          
          if (error) {
            logStep("Error updating subscription", { error });
          } else {
            logStep("Subscription updated successfully");
          }

          // Get details of the subscription to set accurate current_period_start/end
          try {
            const subscription = await stripe.subscriptions.retrieve(session.subscription);
            
            const { error } = await supabase
              .from("user_subscriptions")
              .update({
                current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
                current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
                updated_at: new Date().toISOString(),
              })
              .eq("user_id", session.metadata.user_id);
            
            if (error) {
              logStep("Error updating subscription periods", { error });
            } else {
              logStep("Subscription periods updated");
            }
            
          } catch (err) {
            logStep("Error fetching subscription details", { error: err.message });
          }
        }
        break;
      }
      
      case "invoice.payment_succeeded": {
        const invoice = event.data.object;
        if (invoice.subscription) {
          logStep("Invoice payment succeeded", { subscriptionId: invoice.subscription });
          
          try {
            // Get the subscription
            const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
            const userId = subscription.metadata?.user_id;
            
            if (userId) {
              // Update the subscription status
              const { error } = await supabase
                .from("user_subscriptions")
                .update({
                  status: subscription.status,
                  current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
                  current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
                  updated_at: new Date().toISOString(),
                })
                .eq("stripe_subscription_id", invoice.subscription);
              
              if (error) {
                logStep("Error updating subscription after payment", { error });
              } else {
                logStep("Subscription updated after payment");
              }
            }
          } catch (err) {
            logStep("Error processing invoice payment", { error: err.message });
          }
        }
        break;
      }
      
      case "customer.subscription.updated": {
        const subscription = event.data.object;
        logStep("Subscription updated", { 
          subscriptionId: subscription.id, 
          status: subscription.status
        });
        
        // Get the user_id from metadata
        const userId = subscription.metadata?.user_id;
        
        if (userId) {
          const { error } = await supabase
            .from("user_subscriptions")
            .update({
              status: subscription.status,
              current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
              cancel_at_period_end: subscription.cancel_at_period_end,
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", userId);
          
          if (error) {
            logStep("Error updating subscription status", { error });
          } else {
            logStep("Subscription status updated");
          }
        } else {
          // Try to find by subscription ID if metadata doesn't have user_id
          const { error } = await supabase
            .from("user_subscriptions")
            .update({
              status: subscription.status,
              current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
              cancel_at_period_end: subscription.cancel_at_period_end,
              updated_at: new Date().toISOString(),
            })
            .eq("stripe_subscription_id", subscription.id);
          
          if (error) {
            logStep("Error updating subscription by ID", { error });
          } else {
            logStep("Subscription updated by ID");
          }
        }
        break;
      }
      
      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        logStep("Subscription deleted", { subscriptionId: subscription.id });
        
        const userId = subscription.metadata?.user_id;
        
        if (userId) {
          const { error } = await supabase
            .from("user_subscriptions")
            .update({
              status: "canceled",
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", userId);
          
          if (error) {
            logStep("Error marking subscription as canceled", { error });
          } else {
            logStep("Subscription marked as canceled");
          }
        } else {
          // Try to find by subscription ID
          const { error } = await supabase
            .from("user_subscriptions")
            .update({
              status: "canceled",
              updated_at: new Date().toISOString(),
            })
            .eq("stripe_subscription_id", subscription.id);
          
          if (error) {
            logStep("Error marking subscription as canceled by ID", { error });
          } else {
            logStep("Subscription marked as canceled by ID");
          }
        }
        break;
      }
      
      default:
        logStep(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 });
  } catch (error) {
    logStep("Webhook error", { error: error.message });
    return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  }
});
