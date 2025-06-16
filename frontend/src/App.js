import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { supabase } from "./supabaseClient";
import { ErrorBoundary } from "./components/ErrorBoundary";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import UserDashboard from "./pages/UserDashboard";
import Success from "./pages/Success"; // Import the Success component
import AboutUs from "./components/AboutUs"; // Import AboutUs component
import Contact from "./components/Contact"; // Import Contact component

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

          {/* About and Contact routes - accessible to everyone */}
          <Route path="/about" element={<AboutUs />} />
          <Route path="/contact" element={<Contact />} />

          {/* Add the Success route here */}
          <Route path="/success" element={<Success />} />
          
          {/* Add a cancel route for Stripe's cancel_url */}
          <Route path="/cancel" element={<Navigate to="/choose-plan" />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute user={user}>
                <UserDashboard user={user} />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
};

export default App;