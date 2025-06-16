import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { toast } from 'react-toastify';
import { Sparkles } from 'lucide-react';

// Define all possible plans with their configurations
const PLAN_CONFIG = {
  basic: { limit: 100, color: 'from-blue-500 to-blue-400' },        // $99 plan
  premium: { limit: 500, color: 'from-purple-500 to-purple-400' },  // $179 plan
  pro: { limit: 100, color: 'from-purple-600 to-pink-500' },
  trial: { limit: 3, color: 'from-green-500 to-teal-400' },
  enterprise: { limit: Infinity, color: 'from-blue-500 to-teal-500' } // Unlimited
};

const DEFAULT_PLAN = 'basic';

const UsageMeter = ({ userId, plan = DEFAULT_PLAN, onLimitReached }) => {
  const [currentUsage, setCurrentUsage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Safely get plan configuration with fallback to default
  const { limit, color } = PLAN_CONFIG[plan.toLowerCase()] || PLAN_CONFIG[DEFAULT_PLAN];

  const fetchUsage = async () => {
    if (!userId) {
      console.warn('No userId provided to UsageMeter');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      console.log('Fetching usage for:', userId); // Debug log
      
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
      console.log('Usage data received:', usageData); // Debug log
      
      // Extract current usage from your API response format
      // Based on your console log: {count: '3/40', ...}
      let usageCount = 0;
      if (usageData.count && typeof usageData.count === 'string') {
        usageCount = parseInt(usageData.count.split('/')[0]) || 0;
      } else if (usageData.current_usage) {
        usageCount = usageData.current_usage;
      } else if (usageData.usage) {
        usageCount = usageData.usage;
      }
      
      console.log('Parsed usage count:', usageCount); // Debug log
      setCurrentUsage(usageCount);
      
      // Check if limit reached
      if (limit !== Infinity && usageCount >= limit * (plan === 'pro' ? 0.95 : 1)) {
        onLimitReached?.();
      }
      
    } catch (error) {
      console.error('Usage fetch error:', error);
      setCurrentUsage(0); // Fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!userId) return;
    fetchUsage();
  }, [userId, plan]);

  const usagePercentage = limit === Infinity ? 0 : Math.min((currentUsage / limit) * 100, 100);

  return (
    <div className="bg-gradient-to-br from-gray-800 via-gray-800 to-gray-800 rounded-lg p-4 border border-pink-500/30">
      {isLoading ? (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-pink-400"></div>
        </div>
      ) : (
        <>
          <div className="flex items-center mb-3">
            <Sparkles size={16} className="mr-2 text-pink-400" />
            <span className="font-medium text-white">Content Credits</span>
          </div>
          
          {limit === Infinity ? (
            <p className="text-sm text-gray-300 mb-3">
              Unlimited creations this month
            </p>
          ) : (
            <p className="text-sm text-gray-300 mb-3">
              You've used {currentUsage}/{limit} creations this month
            </p>
          )}
          
          {limit !== Infinity && (
            <div className="w-full bg-gray-700 rounded-full h-2 mb-4">
              <div 
                className="bg-gradient-to-r from-pink-500 to-rose-500 h-2 rounded-full" 
                style={{ width: `${usagePercentage}%` }}
              ></div>
            </div>
          )}
          
          <div className="text-xs text-gray-400">
            Next reset: <span className="text-pink-300">June 1, 2025</span>
          </div>
          
          {limit !== Infinity && currentUsage >= limit && (
            <div className="mt-2 text-center">
              <p className="text-sm text-red-400">Plan limit reached</p>
              <button
                onClick={() => window.location.href = '/upgrade'}
                className="mt-1 px-3 py-1 text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded hover:opacity-90 transition-opacity"
              >
                Upgrade Plan
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default UsageMeter;

  