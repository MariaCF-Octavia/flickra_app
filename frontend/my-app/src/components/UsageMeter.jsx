import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { toast } from 'react-toastify';
import { Sparkles, Clock, Zap, ArrowRight, Crown, Star, Building2 } from 'lucide-react';
import { Link } from 'react-router-dom';

// Updated plan configuration to match new pricing structure
const PLAN_CONFIG = {
  // New pricing plans
  free: { 
    limit: 3, 
    color: 'from-gray-500 to-gray-400',
    name: 'Free',
    price: 0,
    icon: Sparkles
  },
  starter: { 
    limit: 25, 
    color: 'from-blue-500 to-blue-400',
    name: 'Starter',
    price: 49,
    icon: Zap
  },
  professional: { 
    limit: 50, 
    color: 'from-purple-500 to-purple-400',
    name: 'Professional',
    price: 89,
    icon: Star
  },
  business: { 
    limit: 100, 
    color: 'from-orange-500 to-orange-400',
    name: 'Business',
    price: 159,
    icon: Building2
  },
  enterprise: { 
    limit: Infinity, 
    color: 'from-yellow-500 to-yellow-400',
    name: 'Enterprise',
    price: 249,
    icon: Crown
  },
  
  // Trial and legacy plans
  trial: { 
    limit: 3, 
    color: 'from-green-500 to-teal-400',
    name: 'Trial',
    price: 0,
    icon: Sparkles
  },
  trial_expired: { 
    limit: 3, 
    color: 'from-red-500 to-orange-400',
    name: 'Trial Expired',
    price: 0,
    icon: Clock
  },
  
  // Legacy plans (for backward compatibility)
  basic: { 
    limit: 25, 
    color: 'from-blue-500 to-blue-400',
    name: 'Basic (Legacy)',
    price: 49,
    icon: Zap
  },
  premium: { 
    limit: 50, 
    color: 'from-purple-500 to-purple-400',
    name: 'Premium (Legacy)',
    price: 89,
    icon: Star
  },
  pro: { 
    limit: Infinity, 
    color: 'from-yellow-500 to-yellow-400',
    name: 'Pro (Legacy)',
    price: 249,
    icon: Crown
  }
};

const DEFAULT_PLAN = 'free';

const UsageMeter = ({ userId, plan = DEFAULT_PLAN, onLimitReached }) => {
  const [currentUsage, setCurrentUsage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [userInfo, setUserInfo] = useState(null);
  const [trialExpiry, setTrialExpiry] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);

  // Safely get plan configuration with fallback to default
  const planKey = plan.toLowerCase();
  const planConfig = PLAN_CONFIG[planKey] || PLAN_CONFIG[DEFAULT_PLAN];
  const { limit, color, name: planName, price, icon: PlanIcon } = planConfig;

  const fetchUsage = async () => {
    if (!userId) {
      console.warn('No userId provided to UsageMeter');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      
      // Get current session for auth
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error("Authentication required");
      }

      // Call your existing usage endpoint
      const response = await fetch('/api/user-usage', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const usageData = await response.json();
      setUserInfo(usageData);
      
      // Handle trial users
      if (usageData.user?.is_trial_user) {
        const trialCredits = usageData.user?.usage?.trial_credits || 0;
        const usedCredits = 3 - trialCredits;
        setCurrentUsage(usedCredits);
        
        // Parse trial expiry
        if (usageData.user?.trial_expires_at) {
          const expiryDate = new Date(usageData.user.trial_expires_at);
          setTrialExpiry(expiryDate);
        }
      } else {
        // Regular user usage parsing
        let usageCount = 0;
        if (usageData.count && typeof usageData.count === 'string') {
          usageCount = parseInt(usageData.count.split('/')[0]) || 0;
        } else if (usageData.current_usage) {
          usageCount = usageData.current_usage;
        } else if (usageData.usage) {
          usageCount = usageData.usage;
        } else if (usageData.user?.usage?.used) {
          usageCount = usageData.user.usage.used;
        }
        setCurrentUsage(usageCount);
      }
      
      // Check if limit reached (with 95% threshold for pro/enterprise plans)
      const threshold = ['enterprise', 'pro'].includes(planKey) ? 0.95 : 1;
      if (limit !== Infinity && currentUsage >= limit * threshold) {
        onLimitReached?.();
      }
      
    } catch (error) {
      console.error('Usage fetch error:', error);
      setCurrentUsage(0);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate time left for trial
  useEffect(() => {
    if (!trialExpiry) return;

    const updateTimeLeft = () => {
      const now = new Date();
      const timeDiff = trialExpiry.getTime() - now.getTime();
      
      if (timeDiff <= 0) {
        setTimeLeft("Expired");
        return;
      }

      const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h`);
      } else if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m`);
      } else {
        setTimeLeft(`${minutes}m`);
      }
    };

    updateTimeLeft();
    const interval = setInterval(updateTimeLeft, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [trialExpiry]);

  useEffect(() => {
    if (!userId) return;
    fetchUsage();
  }, [userId, plan]);

  const usagePercentage = limit === Infinity ? 0 : Math.min((currentUsage / limit) * 100, 100);
  const isTrialUser = plan === 'trial' || userInfo?.user?.is_trial_user;
  const isTrialExpired = plan === 'trial_expired' || (isTrialUser && timeLeft === "Expired");
  const remainingCredits = limit === Infinity ? 'unlimited' : Math.max(0, limit - currentUsage);

  // Get next month date for reset display
  const getNextResetDate = () => {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return nextMonth.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-gray-800 via-gray-800 to-gray-800 rounded-lg p-4 border border-gray-600/30">
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-400"></div>
        </div>
      </div>
    );
  }

  // TRIAL EXPIRED STATE
  if (isTrialExpired) {
    return (
      <div className="bg-gradient-to-br from-red-500/20 via-orange-500/20 to-red-500/20 border border-red-500/50 rounded-lg p-4">
        <div className="flex items-center mb-3">
          <Clock size={16} className="mr-2 text-red-400" />
          <span className="font-medium text-white">Trial Expired</span>
        </div>
        
        <p className="text-sm text-red-200 mb-4">
          Your 7-day trial has ended. Upgrade to continue creating amazing content!
        </p>
        
        <div className="space-y-2 mb-4 text-xs text-red-200">
          <div className="flex justify-between">
            <span>Starter (25 credits):</span>
            <span className="font-medium">$49/month</span>
          </div>
          <div className="flex justify-between">
            <span>Professional (50 credits):</span>
            <span className="font-medium">$89/month</span>
          </div>
          <div className="flex justify-between">
            <span>Enterprise (unlimited):</span>
            <span className="font-medium">$249/month</span>
          </div>
        </div>
        
        <Link 
          to="/signup?mode=paid"
          className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white py-3 px-4 rounded-lg font-medium hover:from-purple-600 hover:to-indigo-600 transition-all flex items-center justify-center"
        >
          <Zap className="w-4 h-4 mr-2" />
          Upgrade Now
          <ArrowRight className="w-4 h-4 ml-2" />
        </Link>
      </div>
    );
  }

  // TRIAL USER STATE
  if (isTrialUser) {
    const creditsLeft = limit - currentUsage;
    
    return (
      <div className="bg-gradient-to-br from-green-500/20 via-emerald-500/20 to-green-500/20 border border-green-500/50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <Sparkles size={16} className="mr-2 text-green-400" />
            <span className="font-medium text-white">Trial Credits</span>
          </div>
          <div className="text-xs bg-green-500/20 text-green-300 px-2 py-1 rounded-full">
            FREE
          </div>
        </div>
        
        <p className="text-sm text-green-200 mb-3">
          You have {creditsLeft} of 3 free credits remaining
        </p>
        
        <div className="w-full bg-gray-700 rounded-full h-2 mb-4">
          <div 
            className={`bg-gradient-to-r ${color} h-2 rounded-full transition-all duration-500`}
            style={{ width: `${usagePercentage}%` }}
          ></div>
        </div>
        
        <div className="flex items-center justify-between text-xs mb-4">
          <span className="text-green-300">
            {currentUsage}/{limit} used
          </span>
          {timeLeft && timeLeft !== "Expired" && (
            <span className="text-green-300 flex items-center">
              <Clock className="w-3 h-3 mr-1" />
              {timeLeft} left
            </span>
          )}
        </div>
        
        {creditsLeft <= 1 && (
          <div className="space-y-2">
            <div className="text-xs text-green-200 mb-2">
              <strong>Upgrade options:</strong>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs mb-3">
              <div className="bg-green-500/10 p-2 rounded">
                <div className="font-medium text-green-300">Starter</div>
                <div className="text-green-200">25 credits - $49/mo</div>
              </div>
              <div className="bg-green-500/10 p-2 rounded">
                <div className="font-medium text-green-300">Professional</div>
                <div className="text-green-200">50 credits - $89/mo</div>
              </div>
            </div>
            <Link 
              to="/signup?mode=paid"
              className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white py-2 px-4 rounded-lg text-sm font-medium hover:from-purple-600 hover:to-indigo-600 transition-all flex items-center justify-center"
            >
              <Zap className="w-4 h-4 mr-2" />
              Upgrade for More Credits
            </Link>
          </div>
        )}
      </div>
    );
  }

  // REGULAR USER STATE
  const isNearLimit = limit !== Infinity && usagePercentage >= 80;
  const isAtLimit = limit !== Infinity && currentUsage >= limit;

  return (
    <div className={`bg-gradient-to-br from-gray-800 via-gray-800 to-gray-800 rounded-lg p-4 border ${
      isAtLimit ? 'border-red-500/50' : isNearLimit ? 'border-yellow-500/50' : 'border-gray-600/30'
    }`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <PlanIcon size={16} className="mr-2 text-purple-400" />
          <span className="font-medium text-white">{planName} Plan</span>
        </div>
        {price > 0 && (
          <div className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded-full">
            ${price}/mo
          </div>
        )}
      </div>
      
      {limit === Infinity ? (
        <div>
          <p className="text-sm text-gray-300 mb-3">
            ✨ Unlimited creations this month
          </p>
          <div className="flex items-center text-xs text-gray-400">
            <Sparkles className="w-3 h-3 mr-1" />
            <span>Used: {currentUsage} creations</span>
          </div>
        </div>
      ) : (
        <div>
          <p className="text-sm text-gray-300 mb-3">
            You've used {currentUsage}/{limit} creations this month
          </p>
          
          <div className="w-full bg-gray-700 rounded-full h-2 mb-4">
            <div 
              className={`bg-gradient-to-r ${
                isAtLimit ? 'from-red-500 to-red-400' : 
                isNearLimit ? 'from-yellow-500 to-orange-400' : 
                color
              } h-2 rounded-full transition-all duration-500`}
              style={{ width: `${usagePercentage}%` }}
            ></div>
          </div>
          
          <div className="flex items-center justify-between text-xs mb-2">
            <span className={`${isAtLimit ? 'text-red-300' : isNearLimit ? 'text-yellow-300' : 'text-gray-400'}`}>
              {remainingCredits} credits remaining
            </span>
            <span className="text-gray-400">
              Resets: {getNextResetDate()}
            </span>
          </div>
        </div>
      )}
      
      {/* Upgrade prompts */}
      {isAtLimit && (
        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-sm text-red-400 mb-2 font-medium">Plan limit reached!</p>
          <Link
            to="/signup?mode=paid"
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-2 px-3 rounded text-sm font-medium hover:opacity-90 transition-opacity flex items-center justify-center"
          >
            <ArrowRight className="w-4 h-4 mr-2" />
            Upgrade Plan
          </Link>
        </div>
      )}
      
      {isNearLimit && !isAtLimit && (
        <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <p className="text-sm text-yellow-400 mb-2">⚠️ Running low on credits</p>
          <Link
            to="/signup?mode=paid"
            className="text-xs text-yellow-300 hover:text-yellow-200 underline"
          >
            Consider upgrading →
          </Link>
        </div>
      )}
    </div>
  );
};

export default UsageMeter; 