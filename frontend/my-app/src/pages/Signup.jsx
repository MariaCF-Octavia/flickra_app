 import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { loadStripe } from "@stripe/stripe-js";
import { Sparkles, Zap, Clock } from "lucide-react";

// Vite environment variables
const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
const backendUrl = import.meta.env.VITE_API_BASE_URL;

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
  const [signupMode, setSignupMode] = useState("paid"); // "paid" or "trial"
  const [affiliateCode, setAffiliateCode] = useState(""); // NEW: Affiliate tracking

  // Check URL parameters for mode AND affiliate code
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('mode');
    const ref = urlParams.get('ref'); // NEW: Capture affiliate code
    
    if (mode === 'trial') {
      setSignupMode('trial');
    }
    
    // NEW: Store affiliate code if present
    if (ref) {
      setAffiliateCode(ref);
      localStorage.setItem('cf_affiliate_ref', ref);
      console.log('Affiliate code detected:', ref);
    } else {
      // Check if we have stored affiliate code
      const storedRef = localStorage.getItem('cf_affiliate_ref');
      if (storedRef) {
        setAffiliateCode(storedRef);
      }
    }
  }, []);

  // Handle email confirmation when user returns from email
  useEffect(() => {
    const handleEmailConfirmation = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const confirmed = urlParams.get('confirmed');
      const plan = urlParams.get('plan');
      
      if (confirmed === 'true') {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (session && plan) {
          console.log("Email confirmed, proceeding to payment for plan:", plan);
          setSelectedPlan(plan);
          
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
        
        window.history.replaceState({}, document.title, "/signup");
      }
    };
    
    handleEmailConfirmation();
  }, []);

  const validateForm = () => {
    if (signupMode === "paid") {
      const validPlans = ["basic", "premium", "enterprise"];
      if (!validPlans.includes(selectedPlan.toLowerCase())) {
        setError("Please select a valid plan.");
        return false;
      }
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

  // Trial signup handler - NO affiliate tracking for free trials
  const handleTrialSignup = async (e) => {
    e.preventDefault();
    
    // Simplified validation for trial (no username needed)
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (!backendUrl) {
      setError("Backend configuration missing. Please contact support.");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      const requestBody = {
        email: email.trim(),
        password: password
      };

      // NO affiliate tracking for trials - they need to upgrade to paid plans

      const response = await fetch(`${backendUrl}/trial-signup/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Trial signup failed");
      }

      const result = await response.json();
      
      if (result.success) {
        // DON'T clear affiliate code - keep it for when they upgrade!
        // localStorage.removeItem('cf_affiliate_ref');
        
        // Trial signup successful - redirect to login or dashboard
        navigate("/login", { 
          state: { 
            message: "🎉 Trial account created! Please log in to start creating.",
            email: email.trim() 
          } 
        });
      } else {
        throw new Error(result.message || "Trial signup failed");
      }

    } catch (err) {
      console.error("Trial signup error:", err);
      setError(err.message || "Trial signup failed");
    } finally {
      setIsLoading(false);
    }
  };
  
  // UPDATED: Paid signup handler with affiliate tracking
  const handleSignup = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setError("Please fill all fields correctly. Password must be at least 6 characters.");
      return;
    }

    if (!backendUrl) {
      setError("Backend configuration missing. Please contact support.");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      const signupOptions = {
        email: email.trim(),
        password: password,
        options: {
          data: {
            username: username.trim(),
            plan: selectedPlan.toLowerCase()
          },
          emailRedirectTo: `https://contentfactory.ai/signup?confirmed=true&plan=${selectedPlan.toLowerCase()}`
        }
      };

      // NEW: Add affiliate code to user metadata if present
      if (affiliateCode) {
        signupOptions.options.data.referred_by = affiliateCode;
      }

      const { data: authData, error: authError } = await supabase.auth.signUp(signupOptions);

      if (authError) {
        throw new Error(authError.message || "Registration failed");
      }

      if (!authData.session?.access_token) {
        setError("🎉 Account created! Please check your email and click the confirmation link before proceeding to payment.");
        setIsLoading(false);
        return;
      }

      // Continue with Stripe checkout...
      const checkoutUrl = `${backendUrl}/create-checkout`;
      const requestBody = {
        plan: selectedPlan.toLowerCase(),
        email: email.trim(),
        user_id: authData.user?.id
      };

      // NEW: Add affiliate code to checkout request
      if (affiliateCode) {
        requestBody.referred_by = affiliateCode;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000);
      
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

      if (!response.ok) {
        const errorText = await response.text();
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
      let session;
      try {
        session = JSON.parse(responseText);
      } catch (parseError) {
        throw new Error("Invalid server response - not valid JSON");
      }

      if (!session?.sessionId) {
        throw new Error("Missing session ID in response");
      }

      if (!stripePromise) {
        throw new Error("Stripe not initialized - check your VITE_STRIPE_PUBLIC_KEY");
      }

      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error("Failed to load Stripe instance");
      }

      // Clear stored affiliate code before redirect (successful signup)
      localStorage.removeItem('cf_affiliate_ref');

      const { error: stripeError } = await stripe.redirectToCheckout({
        sessionId: session.sessionId
      });

      if (stripeError) {
        throw new Error(`Stripe redirect failed: ${stripeError.message}`);
      }

    } catch (err) {
      if (err.name === 'AbortError') {
        setError("Request timed out. The server may be starting up - please try again in a minute.");
      } else {
        setError(err.message || "Signup process failed");
      }
    } finally {
      setIsLoading(false);
    }
  };

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
      <div className="bg-gray-900 p-8 rounded-lg shadow-lg max-w-5xl w-full">
        <h2 className="text-3xl font-bold mb-6 text-center">Sign Up for Content Factory</h2>

        {/* NEW: Affiliate Code Display */}
        {affiliateCode && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 mb-6 text-center">
            <p className="text-green-400 font-medium">
              🎉 You're signing up through an affiliate link! 
              <span className="ml-2 bg-green-500/20 px-2 py-1 rounded text-sm">
                Ref: {affiliateCode}
              </span>
            </p>
          </div>
        )}

        {/* TRIAL VS PAID TOGGLE */}
        <div className="flex justify-center mb-8">
          <div className="bg-gray-800 p-1 rounded-lg flex">
            <button
              onClick={() => setSignupMode("trial")}
              className={`px-6 py-3 rounded-md font-medium transition-all ${
                signupMode === "trial"
                  ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <Sparkles className="w-4 h-4 inline mr-2" />
              Try for Free
            </button>
            <button
              onClick={() => setSignupMode("paid")}
              className={`px-6 py-3 rounded-md font-medium transition-all ${
                signupMode === "paid"
                  ? "bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-lg"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <Zap className="w-4 h-4 inline mr-2" />
              Full Access
            </button>
          </div>
        </div>

        {/* TRIAL MODE */}
        {signupMode === "trial" && (
          <div className="mb-8">
            {/* Trial Benefits Card */}
            <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-xl p-6 mb-8">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-green-400 mb-3">
                  <Sparkles className="w-6 h-6 inline mr-2" />
                  Free Trial Access
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-400">3</div>
                    <div className="text-sm text-gray-300">Free Credits</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-400">3</div>
                    <div className="text-sm text-gray-300">Days Access</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-green-400">$0</div>
                    <div className="text-sm text-gray-300">No Credit Card</div>
                  </div>
                </div>
                <div className="text-sm text-gray-300">
                  ✅ Image-to-Image Styling &nbsp;&nbsp; ✅ Image-to-Video &nbsp;&nbsp; ✅ Keyframes
                </div>
              </div>
            </div>

            {/* Trial Signup Form */}
            <form onSubmit={handleTrialSignup}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Enter your email"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Enter your password"
                    required
                  />
                </div>
              </div>

              {error && <p className={`text-sm mb-4 ${error.includes('✅') || error.includes('🎉') ? 'text-green-500' : 'text-red-500'}`}>{error}</p>}
              
              <button
                type="submit"
                className={`w-full py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-medium text-lg hover:from-green-600 hover:to-emerald-600 transition-all ${
                  isLoading ? "opacity-50 cursor-not-allowed" : ""
                }`}
                disabled={isLoading}
              >
                {isLoading ? "Creating Trial Account..." : "Start Creating for Free"}
              </button>
            </form>
          </div>
        )}

        {/* PAID MODE */}
        {signupMode === "paid" && (
          <div>
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
                  {/* NEW: Show affiliate bonus for basic plan */}
                  {affiliateCode && (
                    <div className="bg-green-500/20 border border-green-500/30 rounded p-2 mb-4">
                      <p className="text-green-400 text-sm font-medium">💰 $35 affiliate bonus on this plan!</p>
                    </div>
                  )}
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
                  {/* NEW: Show affiliate bonus for premium plan */}
                  {affiliateCode && (
                    <div className="bg-green-500/20 border border-green-500/30 rounded p-2 mb-4">
                      <p className="text-green-400 text-sm font-medium">💰 $60 affiliate bonus on this plan!</p>
                    </div>
                  )}
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
                  {/* NEW: Show affiliate bonus for enterprise plan */}
                  {affiliateCode && (
                    <div className="bg-green-500/20 border border-green-500/30 rounded p-2 mb-4">
                      <p className="text-green-400 text-sm font-medium">💰 $110 affiliate bonus on this plan!</p>
                    </div>
                  )}
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

            {/* Paid Signup Form */}
            <form onSubmit={handleSignup} className="mb-8">
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
          </div>
        )}

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