 import React, { useState, useEffect } from 'react';
import supabase from '../supabaseClient';
import './SubscriptionSettings.css';

const SubscriptionSettings = () => {
  const [userPlan, setUserPlan] = useState(null);
  const [generationCount, setGenerationCount] = useState(0);
  const [subscriptionStatus, setSubscriptionStatus] = useState('active');
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      // Get Supabase session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error("Authentication required");
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not found");

      setCurrentUser(user);

      // Get plan directly from database
      const { data: dbUser, error: dbError } = await supabase
        .table('users')
        .select('plan')
        .eq('id', user.id)
        .single();

      if (!dbError && dbUser) {
        setUserPlan(dbUser.plan || 'basic');
      }
      
      // Get other data from API
      const response = await fetch('http://localhost:8000/user/subscription', {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setGenerationCount(data.generation_count || 0);
        setSubscriptionStatus(data.status);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm("Are you sure you want to cancel your subscription? You'll keep access until your billing period ends.")) {
      return;
    }

    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Authentication required");

      const response = await fetch('http://localhost:8000/user/cancel-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      const result = await response.json();
      if (response.ok) {
        alert("Subscription cancelled successfully. Access continues until period end.");
        setSubscriptionStatus('cancelled');
        fetchUserData(); // Refresh data
      } else {
        alert(result.detail || "Error cancelling subscription");
      }
    } catch (error) {
      alert("Error cancelling subscription");
    }
    setIsLoading(false);
  };

  const handleDeleteAccount = async () => {
    const confirmText = "DELETE";
    const userInput = prompt(`This will permanently delete your account and all data. Type "${confirmText}" to confirm:`);
    
    if (userInput !== confirmText) {
      alert("Account deletion cancelled.");
      return;
    }

    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Authentication required");

      const response = await fetch('http://localhost:8000/api/delete-account', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (response.ok) {
        alert("Account deleted successfully.");
        await supabase.auth.signOut();
        window.location.href = '/';
      } else {
        alert("Error deleting account");
      }
    } catch (error) {
      alert("Error deleting account");
    }
    setIsLoading(false);
  };

  return (
    <div className="subscription-settings">
      <div className="settings-header">
        <h1>Account Settings</h1>
        <button onClick={() => window.history.back()} className="back-button">
          ← Back to Dashboard
        </button>
      </div>

      {/* Account Overview */}
      <div className="settings-card">
        <div className="card-header">
          <h2>Account Overview</h2>
        </div>
        <div className="account-info">
          <div className="info-row">
            <span className="label">Email:</span>
            <span className="value">{currentUser?.email}</span>
          </div>
          <div className="info-row">
            <span className="label">Status:</span>
            <span className={`status-badge ${subscriptionStatus}`}>
              {subscriptionStatus === 'active' ? 'Active' : 'Cancelled'}
            </span>
          </div>
        </div>
      </div>

      {/* Subscription Management */}
      <div className="settings-card">
        <div className="card-header">
          <h2>Subscription</h2>
        </div>
        
        {subscriptionStatus === 'active' ? (
          <div className="subscription-actions">
            <button 
              onClick={handleCancelSubscription}
              disabled={isLoading}
              className="cancel-button"
            >
              {isLoading ? 'Processing...' : 'Cancel Subscription'}
            </button>
            <p className="cancel-note">
              Your subscription will remain active until the end of your current billing period.
            </p>
          </div>
        ) : (
          <div className="cancelled-notice">
            <p>Your subscription has been cancelled. Access continues until your billing period ends.</p>
          </div>
        )}
      </div>

      {/* Danger Zone */}
      <div className="settings-card danger-card">
        <div className="card-header">
          <h2>Danger Zone</h2>
        </div>
        <div className="danger-content">
          <div className="danger-info">
            <h3>Delete Account</h3>
            <p>Permanently delete your account and all associated data. This action cannot be undone.</p>
          </div>
          <button 
            onClick={handleDeleteAccount}
            disabled={isLoading}
            className="delete-button"
          >
            {isLoading ? 'Processing...' : 'Delete Account'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionSettings;