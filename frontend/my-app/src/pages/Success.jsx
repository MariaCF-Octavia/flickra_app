 import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "../supabaseClient";

// Add this line at the top to get the backend URL
const backendUrl = import.meta.env.VITE_API_BASE_URL;

const Success = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [status, setStatus] = useState("Initializing...");
  const [verificationComplete, setVerificationComplete] = useState(false);

  // Force full page refresh to ensure latest auth state
  useEffect(() => {
    const verifyPayment = async () => {
      try {
        // Check if backend URL is configured
        if (!backendUrl) {
          setStatus("Backend configuration missing. Please contact support.");
          console.error("VITE_API_BASE_URL environment variable not set");
          return;
        }

        console.log("Using backend URL:", backendUrl);

        // Get fresh session with token
        const { data: { user }, error: authError } = await supabase.auth.getSession();
        
        if (authError || !user) {
          setStatus("Session expired - redirecting to login...");
          await supabase.auth.signOut();
          window.location.href = '/login';
          return;
        }
    
        // Get fresh access token
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.access_token) {
          setStatus("No valid session found");
          return;
        }
  
        setStatus(`Authenticated as: ${user.email}`);
        
        // Verify payment with backend - FIXED: Using backend URL
        setStatus("Verifying payment...");
        console.log("Calling verify-payment endpoint:", `${backendUrl}/api/verify-payment`);
        
        const response = await fetch(`${backendUrl}/api/verify-payment`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`
          },
          body: JSON.stringify({ session_id: sessionId })
        });
  
        if (!response.ok) {
          const errorData = await response.json();
          setStatus(`Payment verification failed: ${errorData.detail || 'Unknown error'}`);
          return;
        }
        
        const data = await response.json();
        setStatus(`Payment verified. Plan: ${data.plan || "unknown"}`);
        
        // Refresh auth session to get updated claims
        const { error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError) {
          throw refreshError;
        }
  
        // Redirect to user dashboard for all paid plans
        window.location.href = `/userdashboard?plan=${data.plan.toLowerCase()}`;
  
      } catch (error) {
        console.error("Verification error:", error);
        setStatus(`Error: ${error.message || 'Unknown error occurred'}`);
      }
    };
  
    if (sessionId) verifyPayment();
    else setStatus("Missing session ID - cannot verify payment");
  }, [sessionId]);
  
  // Remove the verificationComplete state and associated useEffect
  
  useEffect(() => {
    if (verificationComplete) {
      // Verify session exists before redirect
      const confirmRedirect = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          // Use window.location.assign instead of href for better tracking
          window.location.assign(`/dashboard?refresh=${Date.now()}`);
        } else {
          setStatus("Session verification failed - redirecting to login");
          await supabase.auth.signOut();
          window.location.href = '/login';
        }
      };
      
      confirmRedirect();
    }
  }, [verificationComplete]);

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
      <div className="text-center p-6 bg-gray-800 rounded-lg shadow-lg max-w-md">
        {!verificationComplete && (
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4 mx-auto"></div>
        )}
        <h2 className="text-xl font-bold mb-3">Payment Processing</h2>
        <p className="text-gray-300 mb-4 break-words">{status}</p>
        
        {verificationComplete ? (
          <div className="mt-6">
            <h3 className="text-green-400 text-lg mb-3">Redirecting...</h3>
            <p className="text-gray-300 mb-4">
              You're being redirected to your dashboard
            </p>
          </div>
        ) : (
          <p className="text-sm text-gray-400">
            This may take a few seconds. Please don't close this page.
          </p>
        )}
      </div>
    </div>
  );
};

export default Success;