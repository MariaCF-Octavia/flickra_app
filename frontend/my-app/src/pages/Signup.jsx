 import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom"; // Added useNavigate
import { supabase } from "../supabaseClient";
import { loadStripe } from "@stripe/stripe-js";

// Vite environment variables
const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
const backendUrl = import.meta.env.VITE_API_BASE_URL;

// Log the Stripe public key for debugging
console.log("Stripe Public Key:", stripePublicKey);

// Initialize Stripe
const stripePromise = stripePublicKey ? loadStripe(stripePublicKey) : null;

const Signup = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [selectedPlan, setSelectedPlan] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Handle email confirmation when user returns from email
 // Replace your current useEffect with this:
useEffect(() => {
  const handleEmailConfirmation = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const confirmed = urlParams.get('confirmed');
    const plan = urlParams.get('plan');
    
    if (confirmed === 'true') {
      // User confirmed email, now get their session and proceed to payment
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (session && plan) {
        console.log("Email confirmed, proceeding to payment for plan:", plan);
        
        // Set the plan they selected
        setSelectedPlan(plan);
        
        // Now create checkout session and redirect to Stripe
        try {
          setIsLoading(true);
          
          const checkoutUrl = `${backendUrl}/create-checkout`;
          const requestBody = {
            plan: plan.toLowerCase(),
            email: session.user.email,
            user_id: session.user.id
          };

          const response = await fetch(checkoutUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`
            },
            body: JSON.stringify(requestBody)
          });

          if (!response.ok) {
            throw new Error(`Checkout failed: ${response.status}`);
          }

          const checkoutSession = await response.json();
          
          if (!checkoutSession?.sessionId) {
            throw new Error("Missing session ID in response");
          }

          // Redirect to Stripe
          const stripe = await stripePromise;
          if (!stripe) {
            throw new Error("Failed to load Stripe");
          }

          const { error: stripeError } = await stripe.redirectToCheckout({
            sessionId: checkoutSession.sessionId
          });

          if (stripeError) {
            throw new Error(`Stripe redirect failed: ${stripeError.message}`);
          }

        } catch (err) {
          console.error("Email confirmation payment error:", err);
          setError(`Payment setup failed: ${err.message}`);
        } finally {
          setIsLoading(false);
        }
      } else {
        setError("❌ Email confirmation failed. Please try signing up again.");
      }
      
      // Clean up URL
      window.history.replaceState({}, document.title, "/signup");
    }
  };
  
  handleEmailConfirmation();
}, []);

  const validateForm = () => {
    const validPlans = ["basic", "premium", "enterprise"];
    if (!validPlans.includes(selectedPlan.toLowerCase())) {
      setError("Please select a valid plan.");
      return false;
    }
    if (username.length < 3) {
      setError("Username must be at least 3 characters.");
      return false;
    }
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setError("Please enter a valid email address.");
      return false;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return false;
    }
    return true;
  };
  
  const handleSignup = async (e) => {
  e.preventDefault();
  
  console.log("=== SIGNUP DEBUG START ===");
  console.log("Backend URL:", backendUrl);
  console.log("Selected plan:", selectedPlan);
  console.log("Email:", email);
  console.log("Username:", username);
  
  if (!validateForm()) {
    setError("Please fill all fields correctly. Password must be at least 6 characters.");
    return;
  }

  // Check if backend URL is configured
  if (!backendUrl) {
    setError("Backend configuration missing. Please contact support.");
    console.error("VITE_API_BASE_URL environment variable not set");
    return;
  }

  setError("");
  setIsLoading(true);

  try {
    // 1. Supabase Signup with custom redirect
    console.log("Step 1: Starting Supabase signup...");
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email.trim(),
      password: password,
      options: {
        data: {
          username: username.trim(),
          plan: selectedPlan.toLowerCase()
        },
        emailRedirectTo: `https://contentfactory.ai/signup?confirmed=true&plan=${selectedPlan.toLowerCase()}`
      }
    });

    if (authError) {
      console.error("Supabase Auth Error:", authError);
      throw new Error(authError.message || "Registration failed");
    }

    console.log("Supabase signup successful!");
    console.log("User ID:", authData.user?.id);
    console.log("Has session:", !!authData.session);
    console.log("Has access token:", !!authData.session?.access_token);

    // 2. Check for session token (email confirmation)
    if (!authData.session?.access_token) {
      console.warn("No session token - email confirmation required");
      setError("🎉 Account created! Please check your email and click the confirmation link before proceeding to payment.");
      setIsLoading(false);
      return;
    }

    console.log("Access token (first 20 chars):", authData.session.access_token.substring(0, 20) + "...");

    // 3. Prepare checkout request
    console.log("Step 2: Preparing checkout request...");
    const checkoutUrl = `${backendUrl}/create-checkout`;
    console.log("Checkout URL:", checkoutUrl);
    
    const requestBody = {
      plan: selectedPlan.toLowerCase(),
      email: email.trim(),
      user_id: authData.user?.id
    };
    console.log("Request body:", requestBody);

    console.log("Step 3: Making checkout request (this may take 30-60 seconds on first request)...");
    
    // Add longer timeout for the checkout request since backend might be cold
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minute timeout
    
    const response = await fetch(checkoutUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authData.session.access_token}`
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    console.log("Checkout response status:", response.status);
    console.log("Response headers:", Object.fromEntries(response.headers.entries()));

    // 4. Handle response
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Checkout error response (${response.status}):`, errorText);
      
      // Better error messages for common issues
      if (response.status === 401) {
        throw new Error("Authentication failed. Please try signing up again.");
      } else if (response.status === 400) {
        throw new Error("Invalid request. Please check your information and try again.");
      } else if (response.status === 500) {
        throw new Error("Server error. Please try again in a few minutes.");
      } else {
        throw new Error(`Checkout failed: ${response.status} - ${errorText}`);
      }
    }

    const responseText = await response.text();
    console.log("Raw checkout response:", responseText);

    let session;
    try {
      session = JSON.parse(responseText);
      console.log("Parsed session object:", session);
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      console.error("Response that failed to parse:", responseText);
      throw new Error("Invalid server response - not valid JSON");
    }

    if (!session?.sessionId) {
      console.error("Missing sessionId in response:", session);
      throw new Error("Missing session ID in response");
    }

    console.log("✅ Got session ID:", session.sessionId);

    // 5. Initialize Stripe
    console.log("Step 4: Initializing Stripe...");
    if (!stripePromise) {
      console.error("Stripe promise is null - check VITE_STRIPE_PUBLIC_KEY");
      throw new Error("Stripe not initialized - check your VITE_STRIPE_PUBLIC_KEY");
    }

    console.log("Loading Stripe instance...");
    const stripe = await stripePromise;
    console.log("Stripe instance loaded:", !!stripe);
    
    if (!stripe) {
      throw new Error("Failed to load Stripe instance");
    }

    // 6. Redirect to Stripe
    console.log("Step 5: Redirecting to Stripe checkout...");
    console.log("Using session ID:", session.sessionId);
    
    const { error: stripeError } = await stripe.redirectToCheckout({
      sessionId: session.sessionId
    });

    // This should never execute if redirect is successful
    console.log("❌ Redirect did not happen - checking for errors...");
    
    if (stripeError) {
      console.error("Stripe redirect error:", stripeError);
      throw new Error(`Stripe redirect failed: ${stripeError.message}`);
    } else {
      console.error("Redirect returned without error but user is still here");
      throw new Error("Stripe redirect failed for unknown reason");
    }

  } catch (err) {
    console.error("=== SIGNUP ERROR ===");
    console.error("Error object:", err);
    console.error("Error message:", err.message);
    console.error("Error stack:", err.stack);
    
    // Better error handling for timeouts
    if (err.name === 'AbortError') {
      setError("Request timed out. The server may be starting up - please try again in a minute.");
    } else {
      setError(err.message || "Signup process failed");
    }
  } finally {
    setIsLoading(false);
    console.log("=== SIGNUP DEBUG END ===");
  }
};

  // Social login handlers remain unchanged
  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
    });
    if (error) {
      setError(error.message);
    }
  };
  
  const handleFacebookLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "facebook",
    });
    if (error) {
      setError(error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-950 text-white flex items-center justify-center p-6">
      <div className="bg-gray-900 p-8 rounded-lg shadow-lg max-w-4xl w-full">
        <h2 className="text-3xl font-bold mb-6 text-center">Sign Up for Content Factory</h2>

        {/* Plan Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Basic Plan Card */}
          <div
            className={`bg-gray-800 p-6 rounded-lg border-2 ${
              selectedPlan === "basic" ? "border-purple-500" : "border-gray-700"
            } h-[460px] flex flex-col justify-between relative cursor-pointer`}
            onClick={() => setSelectedPlan("basic")}
          >
            <div className="absolute top-0 left-0 w-0 h-0 border-t-[40px] border-t-purple-500 border-r-[40px] border-r-transparent"></div>
            <div>
              <h3 className="text-2xl font-bold mb-4">Basic</h3>
              <p className="text-4xl font-bold mb-4">$99<span className="text-lg">/month</span></p>
              <ul className="mb-6">
                <li className="mb-2">Generate up to 10 pieces of content/month</li>
                <li className="mb-2">Access to basic templates</li>
                <li className="mb-2">Limited editing tools</li>
                <li className="mb-2">Basic analytics (views, clicks)</li>
              </ul>
            </div>
            <button
              type="button"
              className={`w-full py-3 ${
                selectedPlan === "basic" ? "bg-purple-600" : "bg-gray-700"
              } text-white rounded-lg hover:bg-purple-700`}
            >
              {selectedPlan === "basic" ? "Selected" : "Choose Basic"}
            </button>
          </div>

          {/* Premium Plan Card */}
          <div
            className={`bg-gray-800 p-6 rounded-lg border-2 ${
              selectedPlan === "premium" ? "border-blue-500" : "border-gray-700"
            } relative h-[500px] flex flex-col justify-between cursor-pointer`}
            onClick={() => setSelectedPlan("premium")}
          >
            <div className="absolute top-0 left-0 w-0 h-0 border-t-[40px] border-t-blue-500 border-r-[40px] border-r-transparent"></div>
            <div className="absolute top-0 right-0 bg-blue-600 text-white px-3 py-1 rounded-bl-lg text-sm">
              Most Popular
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-4">Premium</h3>
              <p className="text-4xl font-bold mb-4">$179<span className="text-lg">/month</span></p>
              <ul className="mb-6">
                <li className="mb-2">Generate up to 40 pieces of content/month</li>
                <li className="mb-2">Access to premium templates</li>
                <li className="mb-2">Advanced editing tools</li>
                <li className="mb-2">Advanced analytics (views, clicks, conversions)</li>
                <li className="mb-2">Connect 1 social media account</li>
                <li className="mb-2">Voiceover functionality</li>
              </ul>
            </div>
            <button
              type="button"
              className={`w-full py-3 ${
                selectedPlan === "premium" ? "bg-blue-600" : "bg-gray-700"
              } text-white rounded-lg hover:bg-blue-700`}
            >
              {selectedPlan === "premium" ? "Selected" : "Choose Premium"}
            </button>
          </div>

          {/* Enterprise Plan Card */}
          <div
            className={`bg-gray-800 p-6 rounded-lg border-2 ${
              selectedPlan === "enterprise" ? "border-yellow-500" : "border-gray-700"
            } h-[540px] flex flex-col justify-between relative cursor-pointer`}
            onClick={() => setSelectedPlan("enterprise")}
          >
            <div className="absolute top-0 left-0 w-0 h-0 border-t-[40px] border-t-yellow-500 border-r-[40px] border-r-transparent"></div>
            <div>
              <h3 className="text-2xl font-bold mb-4">Enterprise</h3>
              <p className="text-4xl font-bold mb-4">$299<span className="text-lg">/month</span></p>
              <ul className="mb-6">
                <li className="mb-2">Unlimited content generation</li>
                <li className="mb-2">Access to all templates</li>
                <li className="mb-2">Advanced editing tools</li>
                <li className="mb-2">Advanced analytics (views, clicks, conversions, engagement)</li>
                <li className="mb-2">Connect up to 3 social media accounts</li>
                <li className="mb-2">Priority support</li>
                <li className="mb-2">Voiceover functionality</li>
                <li className="mb-2">Marketplace access</li>
              </ul>
            </div>
            <button
              type="button"
              className={`w-full py-3 ${
                selectedPlan === "enterprise"
                  ? "bg-gradient-to-r from-yellow-500 to-yellow-600"
                  : "bg-gray-700"
              } text-white rounded-lg hover:from-yellow-600 hover:to-yellow-700`}
            >
              {selectedPlan === "enterprise" ? "Selected" : "Choose Enterprise"}
            </button>
          </div>
        </div>

        {/* Single Signup Form */}
        <form onSubmit={handleSignup} className="mb-8">
          {/* Username Field */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              placeholder="Enter your username"
              required
            />
          </div>

          {/* Email Field */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              placeholder="Enter your email"
              required
            />
          </div>

          {/* Password Field */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              placeholder="Enter your password"
              required
            />
          </div>

          {error && <p className={`text-sm mb-4 ${error.includes('✅') ? 'text-green-500' : 'text-red-500'}`}>{error}</p>}
          
          <button
            type="submit"
            className={`w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 ${
              isLoading ? "opacity-50 cursor-not-allowed" : ""
            }`}
            disabled={isLoading || !selectedPlan}
          >
            {isLoading ? "Processing..." : "Proceed to Payment"}
          </button>
        </form>

        {/* Social Login Buttons */}
        <div className="flex items-center justify-center space-x-4 mb-6">
          <button
            onClick={handleGoogleLogin}
            className="flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            <img
              src="https://img.icons8.com/color/48/000000/google-logo.png"
              alt="Google"
              className="w-6 h-6 mr-2"
            />
            Sign Up with Google
          </button>
          <button
            onClick={handleFacebookLogin}
            className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <img
              src="https://img.icons8.com/color/48/000000/facebook-new.png"
              alt="Facebook"
              className="w-6 h-6 mr-2"
            />
            Sign Up with Facebook
          </button>
        </div>

        {/* Login Link */}
        <p className="text-center text-gray-400">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-400 hover:underline">
            Log In
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;