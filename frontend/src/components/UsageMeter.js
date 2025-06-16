import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { toast } from 'react-toastify';

// Define all possible plans with their configurations
const PLAN_CONFIG = {
  basic: { limit: 10, color: 'from-blue-500 to-blue-400' },
  premium: { limit: 40, color: 'from-purple-500 to-purple-400' },
  pro: { limit: 100, color: 'from-purple-600 to-pink-500' },
  trial: { limit: 3, color: 'from-green-500 to-teal-400' }
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
      return;
    }

    try {
      setIsLoading(true);
      const monthYear = new Date().toISOString().slice(0, 7);
      
      // Use RPC function for atomic get-or-create operation
      const { data, error } = await supabase
        .rpc('get_or_create_usage', {
          p_user_id: userId,
          p_month_year: monthYear
        })
        .single();

      if (error) throw error;

      const usageCount = data.content_generated || 0;
      setCurrentUsage(usageCount);
      
      // Check if limit reached (with 5% buffer for pro plan)
      if (usageCount >= limit * (plan === 'pro' ? 0.95 : 1)) {
        onLimitReached?.();
      }
    } catch (error) {
      console.error('Usage fetch error:', error);
      toast.error("Failed to load usage data. Please refresh.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!userId) return;

    fetchUsage();

    // Realtime subscription for usage updates
    const subscription = supabase
      .channel(`usage_updates_${userId}`) // Unique channel per user
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_usage',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          const currentMonth = new Date().toISOString().slice(0, 7);
          if (payload.new.month_year === currentMonth) {
            setCurrentUsage(payload.new.content_generated);
            if (payload.new.content_generated >= limit) {
              onLimitReached?.();
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [userId, plan]);

  const remaining = Math.max(0, limit - currentUsage);
  const usagePercentage = Math.min((currentUsage / limit) * 100, 100);

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      {isLoading ? (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-400"></div>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-medium">
              {plan.charAt(0).toUpperCase() + plan.slice(1)} Plan
            </h3>
            <span className="text-sm font-medium">
              {remaining}/{limit} remaining
            </span>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-2.5 mb-1">
            <div
              className={`h-2.5 rounded-full bg-gradient-to-r ${color}`}
              style={{ width: `${usagePercentage}%` }}
              aria-label={`${usagePercentage.toFixed(0)}% of limit used`}
            />
          </div>

          {remaining <= 3 && remaining > 0 && (
            <p className="text-xs text-orange-600 mt-1">
              Only {remaining} generation{remaining !== 1 ? 's' : ''} left
            </p>
          )}

          {remaining <= 0 && (
            <div className="mt-2 text-center">
              <p className="text-sm text-red-600">
                {plan === 'pro' ? 'Fair use warning' : 'Plan limit reached'}
              </p>
              {plan !== 'pro' && (
                <button
                  onClick={() => window.location.href = '/upgrade'}
                  className="mt-1 px-3 py-1 text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded hover:opacity-90 transition-opacity"
                >
                  Upgrade Plan
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default UsageMeter;