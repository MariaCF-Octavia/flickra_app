import React, { useState } from "react";
import { Link } from "react-router-dom"; // Removed useNavigate
import { supabase } from "../supabaseClient";
import { loadStripe } from "@stripe/stripe-js";

// Log the Stripe public key for debugging
console.log("Stripe Public Key:", process.env.REACT_APP_STRIPE_PUBLIC_KEY);

// Initialize Stripe
const stripePromise = process.env.REACT_APP_STRIPE_PUBLIC_KEY
  ? loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY)
  : null;

const Signup = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState(""); // Added username state
  const [selectedPlan, setSelectedPlan] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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
    
    if (!validateForm()) {
      return;
    }
    
    setError("");
    setIsLoading(true);
  
    try {
      // 1. Call backend signup endpoint
      const signupResponse = await fetch(`${process.env.REACT_APP_BACKEND_URL}/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          email,
          password,
          plan: selectedPlan.toLowerCase(),
          username
        }),
      });
  
      if (!signupResponse.ok) {
        const errorData = await signupResponse.json();
        throw new Error(errorData.detail || 'Signup failed');
      }
  
      // 2. Get user data from signup response
      const userData = await signupResponse.json();
      console.log("Signup successful:", userData);
  
      // 3. Sign in with Supabase on the frontend to establish session
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });
  
      if (authError) {
        console.error("Auth error after signup:", authError);
        throw new Error("Authentication error: " + authError.message);
      }
  
      if (!authData?.session) {
        throw new Error("Failed to establish authentication session");
      }
  
      console.log("Authentication session established");
  
      // 4. Create Stripe session with the authenticated user
      const stripe = await stripePromise;
      const checkoutResponse = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/create-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authData.session.access_token}`
        },
        credentials: 'include',
        body: JSON.stringify({
          plan: selectedPlan.toLowerCase(),
          userId: userData.user_id  // Pass the user ID from your backend
        }),
      });
  
      if (!checkoutResponse.ok) {
        const errorData = await checkoutResponse.json();
        throw new Error(errorData.detail || 'Checkout session creation failed');
      }
  
      // 5. Redirect to Stripe
      const { sessionId } = await checkoutResponse.json();
      console.log("Redirecting to Stripe checkout with session ID:", sessionId);
      
      const { error: stripeError } = await stripe.redirectToCheckout({ sessionId });
      if (stripeError) throw stripeError;
  
    } catch (err) {
      console.error("Signup/payment process error:", err);
      setError(err.message || "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };
  // ... (ALL SOCIAL LOGIN HANDLERS AND UI REMAIN EXACTLY THE SAME BELOW THIS LINE)
  // [Rest of your code including return statement is 100% preserved]
  
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
              selectedPlan === "Basic" ? "border-purple-500" : "border-gray-700"
            } h-[460px] flex flex-col justify-between relative`}
          >
            <div className="absolute top-0 left-0 w-0 h-0 border-t-[40px] border-t-purple-500 border-r-[40px] border-r-transparent"></div>
            <div>
              <h3 className="text-2xl font-bold mb-4">Basic</h3>
              <p className="text-4xl font-bold mb-4">$239<span className="text-lg">/month</span></p>
              <ul className="mb-6">
                <li className="mb-2">Generate up to 10 pieces of content/month</li>
                <li className="mb-2">Access to basic templates</li>
                <li className="mb-2">Limited editing tools</li>
                <li className="mb-2">Basic analytics (views, clicks)</li>
              </ul>
            </div>
            <button
              onClick={() => setSelectedPlan("Basic")}
              className={`w-full py-3 ${
                selectedPlan === "Basic" ? "bg-purple-600" : "bg-gray-700"
              } text-white rounded-lg hover:bg-purple-700`}
            >
              {selectedPlan === "Basic" ? "Selected" : "Choose Basic"}
            </button>
          </div>

          {/* Premium Plan Card */}
          <div
            className={`bg-gray-800 p-6 rounded-lg border-2 ${
              selectedPlan === "Premium" ? "border-blue-500" : "border-gray-700"
            } relative h-[500px] flex flex-col justify-between`}
          >
            <div className="absolute top-0 left-0 w-0 h-0 border-t-[40px] border-t-blue-500 border-r-[40px] border-r-transparent"></div>
            <div className="absolute top-0 right-0 bg-blue-600 text-white px-3 py-1 rounded-bl-lg text-sm">
              Most Popular
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-4">Premium</h3>
              <p className="text-4xl font-bold mb-4">$299<span className="text-lg">/month</span></p>
              <ul className="mb-6">
                <li className="mb-2">Generate up to 50 pieces of content/month</li>
                <li className="mb-2">Access to premium templates</li>
                <li className="mb-2">Advanced editing tools</li>
                <li className="mb-2">Advanced analytics (views, clicks, conversions)</li>
                <li className="mb-2">Connect 1 social media account</li>
                <li className="mb-2">Voiceover functionality</li>
              </ul>
            </div>
            <button
              onClick={() => setSelectedPlan("Premium")}
              className={`w-full py-3 ${
                selectedPlan === "Premium" ? "bg-blue-600" : "bg-gray-700"
              } text-white rounded-lg hover:bg-blue-700`}
            >
              {selectedPlan === "Premium" ? "Selected" : "Choose Premium"}
            </button>
          </div>

          {/* Enterprise Plan Card */}
          <div
            className={`bg-gray-800 p-6 rounded-lg border-2 ${
              selectedPlan === "Enterprise" ? "border-yellow-500" : "border-gray-700"
            } h-[540px] flex flex-col justify-between relative`}
          >
            <div className="absolute top-0 left-0 w-0 h-0 border-t-[40px] border-t-yellow-500 border-r-[40px] border-r-transparent"></div>
            <div>
              <h3 className="text-2xl font-bold mb-4">Enterprise</h3>
              <p className="text-4xl font-bold mb-4">$439<span className="text-lg">/month</span></p>
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
              onClick={() => setSelectedPlan("Enterprise")}
              className={`w-full py-3 ${
                selectedPlan === "Enterprise"
                  ? "bg-gradient-to-r from-yellow-500 to-yellow-600"
                  : "bg-gray-700"
              } text-white rounded-lg hover:from-yellow-600 hover:to-yellow-700`}
            >
              {selectedPlan === "Enterprise" ? "Selected" : "Choose Enterprise"}
            </button>
          </div>
        </div>

        {/* Signup Form - WITH USERNAME FIELD */}
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

          {/* The rest of your form elements (email, password, etc) */}
          {/* ... */}

        </form> {/* ADDED CLOSING FORM TAG HERE */}
          

        {/* Email and Password Signup Form */}
        <form onSubmit={handleSignup} className="mb-8">
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
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          <button
            type="submit"
            className={`w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 ${
              isLoading ? "opacity-50 cursor-not-allowed" : ""
            }`}
            disabled={isLoading}
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