import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    try {
      console.log("Attempting login with email:", email);
      
      // 1. Authenticate with Supabase
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (authError) {
        console.error("Authentication error:", authError);
        setError(authError.message);
        return;
      }
  
      console.log("Authentication successful. Data:", data);
      
      // 2. Get user details including plan from auth response
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      
      console.log("User details:", user);
      console.log("User plan from metadata:", user.user_metadata?.plan);
      
      // 3. Get the plan from user metadata or default to 'basic'
      let userPlan = user.user_metadata?.plan?.toLowerCase() || 'basic';
      console.log("Determined user plan:", userPlan);
      
      // 4. Validate plan (including 'pro' for backward compatibility)
      // Add 'enterprise' to valid plans
      const validPlans = ['basic', 'premium', 'enterprise', 'pro'];
      if (!validPlans.includes(userPlan)) {
        console.error("Invalid plan detected:", userPlan);
        throw new Error(`Invalid subscription plan (${userPlan}). Please contact support.`);
      }
  
      // 5. Handle legacy 'pro' plan name
      if (userPlan === 'pro') {
        console.warn("Legacy 'pro' plan detected - automatically treating as 'enterprise'");
        // Optional: You could update the metadata here if desired
      }
      
      console.log("Login successful. Redirecting to dashboard...");
      navigate("/dashboard");
      
    } catch (err) {
      console.error("Full login error:", {
        message: err.message,
        stack: err.stack,
        response: err.response,
      });
      setError(err.message || "An error occurred. Please try again.");
    }
  };

  const handleOAuthLogin = async (provider) => {
    try {
      console.log(`Attempting ${provider} OAuth login`);
      const { error: authError } = await supabase.auth.signInWithOAuth({ provider });
      if (authError) {
        console.error(`${provider} OAuth error:`, authError);
        setError(authError.message);
        return;
      }
      console.log(`${provider} OAuth flow initiated successfully`);
    } catch (err) {
      console.error(`Full ${provider} login error:`, err);
      setError("An error occurred. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-950 text-white flex items-center justify-center p-6">
      <div className="bg-gray-900 p-8 rounded-lg shadow-lg max-w-md w-full">
        <h2 className="text-3xl font-bold mb-6 text-center">Log In to Content Factory</h2>

        <form onSubmit={handleLogin}>
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
            className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Log In
          </button>
        </form>

        <div className="flex items-center justify-center space-x-4 my-6">
          <button
            onClick={() => handleOAuthLogin("google")}
            className="flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            <img src="https://img.icons8.com/color/48/000000/google-logo.png" alt="Google" className="w-6 h-6 mr-2" />
            Log In with Google
          </button>
          <button
            onClick={() => handleOAuthLogin("facebook")}
            className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <img src="https://img.icons8.com/color/48/000000/facebook-new.png" alt="Facebook" className="w-6 h-6 mr-2" />
            Log In with Facebook
          </button>
        </div>

        <p className="text-center text-gray-400 mb-4">
          <a href="/forgot-password" className="text-blue-400 hover:underline">
            Forgot Password?
          </a>
        </p>

        <p className="text-center text-gray-400">
          Don't have an account?{" "}
          <Link to="/signup" className="text-blue-400 hover:underline">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login; 