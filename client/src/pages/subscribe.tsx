import { useState, useEffect, useContext } from "react";
import { useLocation, useSearch } from "wouter";
import { createSubscription } from "@/lib/stripe";
import { SubscriptionTier } from "@shared/schema";
import { UserContext } from "@/App";
import SiteLayout from "@/components/layout/site-layout";
import { useToast } from "@/hooks/use-toast";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Check if Stripe is properly initialized
const isStripeAvailable = !!import.meta.env.VITE_STRIPE_PUBLIC_KEY;

export default function Subscribe() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { session } = useContext(UserContext);
  const [, navigate] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const tier = params.get("tier") as SubscriptionTier || SubscriptionTier.Basic;
  const { toast } = useToast();
  
  // SEO enhancement for the subscription page
  useEffect(() => {
    // Update page title and meta description
    document.title = "Upgrade Your Plan - AI LaTeX Generator";
    
    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 
        "Upgrade your AI LaTeX Generator subscription plan. Choose from Basic, Pro, and Power plans to unlock more document generations per month.");
    }
    
    // Add JSON-LD structured data for the subscription page
    const head = document.querySelector('head');
    if (head) {
      const existingSchema = document.querySelector('script#subscription-schema');
      if (existingSchema) {
        existingSchema.remove();
      }
      
      const schemaScript = document.createElement('script');
      schemaScript.type = 'application/ld+json';
      schemaScript.id = 'subscription-schema';
      
      // Subscription Product schema
      const schemaData = {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": "AI LaTeX Generator Subscription",
        "description": "Subscribe to AI LaTeX Generator and create professional LaTeX documents with AI assistance",
        "offers": {
          "@type": "AggregateOffer",
          "lowPrice": "0.99",
          "highPrice": "19.99",
          "priceCurrency": "USD",
          "offerCount": "5"
        },
        "category": "Software Subscription",
        "image": "https://aitexgen.com/subscription.png",
        "brand": {
          "@type": "Brand",
          "name": "AI LaTeX Generator"
        }
      };
      
      schemaScript.textContent = JSON.stringify(schemaData);
      head.appendChild(schemaScript);
    }
  }, []);
  
  useEffect(() => {
    // Redirect to login if not authenticated
    if (!session.isAuthenticated) {
      navigate("/");
      return;
    }
    
    // Check if Stripe is available
    if (!isStripeAvailable) {
      setError("Payment system is not configured. Please contact the administrator.");
      setIsLoading(false);
      return;
    }
    
    // Create the subscription checkout session
    const setupSubscription = async () => {
      try {
        // Create Stripe Checkout Session and redirect to it
        const { url } = await createSubscription(tier);
        
        if (url) {
          // Redirect to the checkout page
          window.location.href = url;
        } else {
          setError("Failed to create checkout session");
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Error creating subscription:", err);
        setError(err instanceof Error ? err.message : "Failed to create subscription");
        setIsLoading(false);
      }
    };
    
    setupSubscription();
  }, [session.isAuthenticated, navigate, tier, isStripeAvailable]);
  
  if (!session.isAuthenticated) {
    return null;
  }
  
  if (isLoading) {
    return (
      <SiteLayout seoTitle="Subscribe to AI LaTeX Generator - Premium Plans">
        <div className="h-screen flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
          <p className="ml-2">Preparing checkout...</p>
        </div>
      </SiteLayout>
    );
  }
  
  if (error) {
    return (
      <SiteLayout seoTitle="Subscription Error - AI LaTeX Generator">
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-lg mx-auto">
            <CardHeader>
              <CardTitle className="text-red-600">Subscription Error</CardTitle>
              <CardDescription>There was a problem setting up your subscription</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-4">{error}</p>
              <Button onClick={() => navigate("/")}>Return to Home</Button>
            </CardContent>
          </Card>
        </div>
      </SiteLayout>
    );
  }
  
  // We should not reach here since we're redirecting to Stripe's checkout
  // But just in case there's some issue with the redirect
  return (
    <SiteLayout seoTitle="Subscribe to AI LaTeX Generator - Premium Plans">
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-lg mx-auto">
          <CardHeader>
            <CardTitle>Redirecting to Checkout</CardTitle>
            <CardDescription>Please wait while we redirect you to the secure payment page</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 mb-4">
              If you are not redirected automatically, please click the button below.
            </p>
            <Button onClick={() => navigate("/account")}>Return to Account</Button>
          </CardContent>
        </Card>
      </div>
    </SiteLayout>
  );
}
