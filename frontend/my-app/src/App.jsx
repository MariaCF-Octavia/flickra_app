import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { supabase } from "./supabaseClient";
import { ErrorBoundary } from "./components/ErrorBoundary.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import UserDashboard from "./pages/UserDashboard.jsx";
import Success from "./pages/Success.jsx";
import Profile from "./components/Profile.jsx"; // Updated from SubscriptionSettings
import Settings from "./components/Settings.jsx"; // New Settings component
import ChatBubble from "./components/ChatBubble.jsx"; // Add chat assistant

// Legal pages imports
import TermsOfService from "./pages/TermsOfService.jsx";
import PrivacyPolicy from "./pages/PrivacyPolicy.jsx";
import CookiePolicy from "./pages/CookiePolicy.jsx";

// About and Contact pages imports
import AboutUs from "./components/AboutUs.jsx";
import Contact from "./components/Contact.jsx";

const ProtectedRoute = ({ user, children }) => {
  const [isValidUser, setIsValidUser] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyUser = async () => {
      try {
        if (user) {
          // 1. Check public users table
          const { data, error } = await supabase
            .from('users')
            .select('plan')
            .eq('id', user.id)
            .single();

          // 2. If no record exists, create one
          if (error?.code === 'PGRST116') { // No records found
            await supabase.from('users').insert({
              id: user.id,
              email: user.email,
              plan: 'trial'
            });
          }
          
          // 3. Verify plan exists
          const { data: verifiedData } = await supabase
            .from('users')
            .select('plan')
            .eq('id', user.id)
            .single();

          if (verifiedData?.plan) {
            setIsValidUser(true);
          }
        }
      } finally {
        setLoading(false);
      }
    };

    verifyUser();
  }, [user]);

  if (loading) return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
    </div>
  );

  return isValidUser ? children : <Navigate to="/" />;
};

const App = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Enhanced auth state management
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user || null);
        
        // Refresh user data after plan selection
        if (event === 'USER_UPDATED') {
          const { data: { user } } = await supabase.auth.getUser();
          setUser(user);
        }
      }
    );

    const initializeAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };

    initializeAuth();
    return () => subscription?.unsubscribe();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
    </div>
  );

  return (
    <ErrorBoundary>
      <Router basename="/">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* About and Contact routes - Public access */}
          <Route path="/about" element={<AboutUs />} />
          <Route path="/contact" element={<Contact />} />

          {/* Add the Success route here */}
          <Route path="/success" element={<Success />} />
          
          {/* Add a cancel route for Stripe's cancel_url */}
          <Route path="/cancel" element={<Navigate to="/choose-plan" />} />

          {/* Legal pages - Public access */}
          <Route path="/terms-of-service" element={<TermsOfService />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/cookie-policy" element={<CookiePolicy />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute user={user}>
                <UserDashboard user={user} />
              </ProtectedRoute>
            }
          />

          {/* Profile route - updated from profile-settings */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute user={user}>
                <Profile user={user} />
              </ProtectedRoute>
            }
          />

          {/* New Settings route */}
          <Route
            path="/settings"
            element={
              <ProtectedRoute user={user}>
                <Settings user={user} />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
        
        {/* Chat bubble - shows on all pages */}
        <ChatBubble />
      </Router>
    </ErrorBoundary>
  );
};

export default App;