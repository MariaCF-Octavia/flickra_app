// src/components/UpgradeModal.jsx - Replace your existing components with these

import React, { useState, useEffect } from 'react';
import { FiX, FiStar, FiCheck, FiCreditCard } from 'react-icons/fi';
import { toast } from 'react-toastify';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://fastapi-app-production-ac48.up.railway.app';

// Simplified Upgrade Plan Modal - Direct to Plans
export const UpgradePlanModal = ({ isOpen, onClose, currentPlan, userEmail, userPlan }) => {
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState([]);
  const [processingPlan, setProcessingPlan] = useState(null);

  // Load available plans when modal opens
  useEffect(() => {
    if (isOpen) {
      loadUpgradePlans();
    }
  }, [isOpen]);

  const loadUpgradePlans = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/upgrade-plans`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      if (response.ok) {
        setPlans(data.available_plans || []);
      } else {
        toast.error('Failed to load upgrade plans');
      }
    } catch (error) {
      console.error('Error loading plans:', error);
      toast.error('Failed to load upgrade plans');
    }
  };

  const handleUpgrade = async (planId) => {
    setProcessingPlan(planId);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/create-upgrade-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          plan: planId
        })
      });

      const data = await response.json();
      
      if (response.ok && data.checkout_url) {
        // Redirect to Stripe checkout
        window.location.href = data.checkout_url;
      } else {
        toast.error(data.detail || 'Failed to create upgrade session');
      }
    } catch (error) {
      console.error('Upgrade error:', error);
      toast.error('Failed to process upgrade');
    } finally {
      setProcessingPlan(null);
    }
  };

  const getPlanFeatures = (planId) => {
    const features = {
      starter: [
        '25 generations per month',
        'Image Enhancement',
        'Basic Video Production',
        'Voice Synthesis',
        'Copy Generation',
        'Media Library'
      ],
      professional: [
        '50 generations per month',
        'All Starter features',
        'Advanced Image Editor',
        'Professional Video Production',
        'High-quality exports',
        'Priority support'
      ],
      business: [
        '100 generations per month',
        'All Professional features',
        'Media Production Suite',
        'Team collaboration',
        'Advanced analytics',
        'Phone support'
      ],
      enterprise: [
        'Unlimited generations',
        'All Business features',
        'Custom integrations',
        'Dedicated account manager',
        'SLA guarantee',
        'Unlimited storage'
      ]
    };
    return features[planId] || [];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative z-10 w-full max-w-6xl mx-4 max-h-[90vh] overflow-auto">
        <div className="bg-[#0f1419] border border-slate-700/50 rounded-2xl shadow-2xl">
          {/* Simple Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
            <div>
              <h2 className="text-2xl font-bold text-white">Choose Your Plan</h2>
              <p className="text-slate-400 text-sm mt-1">
                Upgrade from {currentPlan === 'trial' ? 'Free Trial' : 'Free'} to unlock more features
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 text-slate-400 hover:text-white transition-colors"
            >
              <FiX size={20} />
            </button>
          </div>

          {/* Plans Grid - Direct Selection */}
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
              {plans.map((plan) => {
                const gradient = {
                  starter: 'from-blue-500 to-cyan-500',
                  professional: 'from-indigo-500 to-purple-600',
                  business: 'from-emerald-500 to-teal-600',
                  enterprise: 'from-orange-500 to-red-500'
                }[plan.id] || 'from-gray-500 to-gray-600';

                const isProcessing = processingPlan === plan.id;

                return (
                  <div key={plan.id} className="group relative">
                    {/* Premium Lighting Effects */}
                    <div className={`absolute -inset-0.5 bg-gradient-to-r ${gradient} rounded-2xl blur opacity-20 group-hover:opacity-40 transition-all duration-500`}></div>
                    
                    {/* Plan Card */}
                    <div className={`relative overflow-hidden rounded-2xl bg-slate-900/50 backdrop-blur border border-slate-800/50 hover:border-slate-700/50 transition-all duration-500 shadow-xl hover:shadow-2xl ${plan.popular ? 'ring-2 ring-indigo-500' : ''}`}>
                      
                      {/* Popular Badge */}
                      {plan.popular && (
                        <div className="absolute top-4 right-4 z-10">
                          <div className="px-3 py-1 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-medium rounded-full">
                            Most Popular
                          </div>
                        </div>
                      )}

                      <div className="p-6">
                        {/* Plan Header */}
                        <div className="mb-6">
                          <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                          <div className="flex items-baseline mb-4">
                            <span className="text-3xl font-bold text-white">${plan.price}</span>
                            <span className="text-slate-400 ml-1">/month</span>
                          </div>
                        </div>

                        {/* Features */}
                        <div className="mb-6">
                          <ul className="space-y-2">
                            {getPlanFeatures(plan.id).map((feature, index) => (
                              <li key={index} className="flex items-start space-x-2">
                                <div className="w-4 h-4 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                                  <FiCheck className="w-2.5 h-2.5 text-white" />
                                </div>
                                <span className="text-slate-300 text-sm">{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Upgrade Button - WORKING */}
                        <button
                          onClick={() => handleUpgrade(plan.id)}
                          disabled={isProcessing}
                          className={`w-full py-3 px-4 rounded-xl font-semibold text-white transition-all duration-500 flex items-center justify-center space-x-2 relative overflow-hidden ${
                            isProcessing 
                              ? 'bg-slate-700 cursor-not-allowed' 
                              : `bg-gradient-to-r ${gradient} hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]`
                          }`}
                        >
                          {isProcessing ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                              <span className="text-sm">Processing...</span>
                            </>
                          ) : (
                            <>
                              <FiCreditCard className="w-4 h-4" />
                              <span className="text-sm">Choose {plan.name}</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Simplified Upgrade Button Component
export const UpgradeButton = ({ userPlan, userEmail }) => {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Only show for trial/free users
  if (!['trial', 'free', 'trial_expired'].includes(userPlan?.toLowerCase())) {
    return null;
  }

  return (
    <>
      <button
        onClick={() => setShowUpgradeModal(true)}
        className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg hover:shadow-indigo-500/25 transition-all duration-300 transform hover:scale-105"
      >
        <FiStar size={16} />
        <span>Upgrade Plan</span>
      </button>

      <UpgradePlanModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        currentPlan={userPlan}
        userEmail={userEmail}
        userPlan={userPlan}
      />
    </>
  );
};

// Credits Exhausted Modal (when trial runs out) - Simplified
export const CreditsExhaustedModal = ({ isOpen, onUpgrade, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="bg-[#0f1419] border border-slate-700/50 rounded-2xl shadow-2xl p-6">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center">
              <FiStar className="w-8 h-8 text-white" />
            </div>
            
            <h3 className="text-xl font-bold text-white mb-2">Credits Exhausted</h3>
            <p className="text-slate-400 mb-6">
              You've used all your trial credits. Choose a plan to continue creating!
            </p>
            
            <div className="space-y-3">
              <button
                onClick={onUpgrade}
                className="w-full py-3 px-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all duration-300"
              >
                Choose Plan
              </button>
              
              <button
                onClick={onClose}
                className="w-full py-3 px-4 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 