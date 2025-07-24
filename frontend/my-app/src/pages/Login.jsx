 import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { LogIn, Mail, Lock, AlertCircle, CheckCircle } from "lucide-react";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  // Handle messages from signup or other pages
  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      if (location.state.email) {
        setEmail(location.state.email);
      }
      // Clear the state
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    setIsLoading(true);

    try {
      console.log("Attempting login with email:", email);
      
      // 1. Authenticate with Supabase
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
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
      
      // ADMIN OVERRIDE - Check if this is your admin email
      let userPlan;
      if (user.email === 'mariasheikh0113@outlook.com') {
        userPlan = 'enterprise';
        console.log("Admin override: plan set to enterprise");
      } else {
        // 3. Get the plan from user metadata or default to 'free'
        userPlan = user.user_metadata?.plan?.toLowerCase() || 'free';
      }
      
      console.log("Determined user plan:", userPlan);
      
      // 4. Updated valid plans to include new pricing structure
      const validPlans = [
        'free', 'trial', 'trial_expired',
        'starter', 'professional', 'business', 'enterprise',
        // Legacy plans for backward compatibility
        'basic', 'premium', 'pro'
      ];
      
      if (!validPlans.includes(userPlan)) {
        console.error("Invalid plan detected:", userPlan);
        throw new Error(`Invalid subscription plan (${userPlan}). Please contact support.`);
      }
  
      // 5. Handle legacy plan migrations
      const planMigrations = {
        'pro': 'enterprise',
        'basic': 'starter', 
        'premium': 'professional'
      };
      
      if (planMigrations[userPlan]) {
        const originalPlan = userPlan;
        userPlan = planMigrations[userPlan];
        console.warn(`Legacy '${originalPlan}' plan detected - automatically treating as '${userPlan}'`);
        
        // You could update the metadata here if desired
        try {
          await supabase.auth.updateUser({
            data: { plan: userPlan }
          });
          console.log(`Updated user metadata plan from ${originalPlan} to ${userPlan}`);
        } catch (updateError) {
          console.warn("Failed to update user metadata:", updateError);
          // Continue anyway, the backend will handle the migration
        }
      }
      
      // 6. Handle different user types
      if (userPlan === 'trial') {
        console.log("Trial user login successful");
      } else if (userPlan === 'trial_expired') {
        console.log("Expired trial user login - directing to upgrade");
      } else if (['starter', 'professional', 'business', 'enterprise'].includes(userPlan)) {
        console.log(`Paid user login successful - plan: ${userPlan}`);
      } else {
        console.log(`Free user login successful - plan: ${userPlan}`);
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
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthLogin = async (provider) => {
    try {
      console.log(`Attempting ${provider} OAuth login`);
      setError("");
      setSuccessMessage("");
      
      const { error: authError } = await supabase.auth.signInWithOAuth({ 
        provider,
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      });
      
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-950 text-white flex items-center justify-center p-4 sm:p-6">
      <div className="bg-gray-900 p-6 sm:p-8 rounded-lg shadow-lg max-w-md w-full">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
            <LogIn className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold mb-2">Welcome Back</h2>
          <p className="text-gray-400 text-sm sm:text-base">Sign in to Content Factory</p>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 mb-6 flex items-start">
            <CheckCircle className="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
            <p className="text-green-400 text-sm">{successMessage}</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-300">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Enter your email"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-300">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Enter your password"
                required
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-start">
              <AlertCircle className="w-5 h-5 text-red-400 mr-3 mt-0.5 flex-shrink-0" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <button 
            type="submit" 
            disabled={isLoading}
            className={`w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all ${
              isLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Signing In...
              </div>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-700"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-gray-900 text-gray-400">Or continue with</span>
          </div>
        </div>

        {/* Social Login Buttons */}
        <div className="space-y-3">
          <button
            onClick={() => handleOAuthLogin("google")}
            className="w-full flex items-center justify-center px-4 py-3 bg-white text-gray-900 rounded-lg hover:bg-gray-100 transition-colors font-medium"
          >
            <img 
              src="https://img.icons8.com/color/48/000000/google-logo.png" 
              alt="Google" 
              className="w-5 h-5 mr-3" 
            />
            Continue with Google
          </button>
          
          <button
            onClick={() => handleOAuthLogin("facebook")}
            className="w-full flex items-center justify-center px-4 py-3 bg-[#1877F2] text-white rounded-lg hover:bg-[#166FE5] transition-colors font-medium"
          >
            <img 
              src="https://img.icons8.com/color/48/000000/facebook-new.png" 
              alt="Facebook" 
              className="w-5 h-5 mr-3" 
            />
            Continue with Facebook
          </button>
        </div>

        {/* Links */}
        <div className="mt-8 space-y-4 text-center">
          <p className="text-gray-400">
            <Link to="/forgot-password" className="text-blue-400 hover:text-blue-300 hover:underline transition-colors">
              Forgot your password?
            </Link>
          </p>

          <div className="border-t border-gray-700 pt-4">
            <p className="text-gray-400 text-sm">
              Don't have an account?{" "}
              <Link to="/signup" className="text-blue-400 hover:text-blue-300 hover:underline font-medium transition-colors">
                Sign up for free
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;