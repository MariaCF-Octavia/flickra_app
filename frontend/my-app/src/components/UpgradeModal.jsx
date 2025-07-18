// src/components/UpgradeModal.jsx
import React, { useState, useEffect } from 'react';
import { FiX, FiStar, FiCheck, FiCreditCard, FiZap, FiTool, FiHeadphones, FiAlertCircle } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://fastapi-app-production-ac48.up.railway.app';

// Upgrade Plan Modal Component
export const UpgradePlanModal = ({ isOpen, onClose, currentPlan, userEmail, userPlan }) => {
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState([]);

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
    setLoading(true);
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
      setLoading(false);
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
        'Media Library',
        'Email support'
      ],
      professional: [
        '50 generations per month',
        'All Starter features',
        'Advanced Image Editor',
        'Professional Video Production',
        'High-quality exports',
        'Priority email support',
        '25GB storage'
      ],
      business: [
        '100 generations per month',
        'All Professional features',
        'Media Production Suite',
        'Team collaboration',
        'Advanced analytics',
        'Phone support',
        '100GB storage'
      ],
      enterprise: [
        'Unlimited generations',
        'All Business features',
        'Custom integrations',
        'Dedicated account manager',
        'SLA guarantee',
        'On-premise deployment',
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
      <div className="relative z-10 w-full max-w-7xl mx-4 max-h-[90vh] overflow-auto">
        <div className="bg-[#0f1419] border border-slate-700/50 rounded-2xl shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
            <div>
              <h2 className="text-2xl font-bold text-white">Upgrade Your Plan</h2>
              <p className="text-slate-400 text-sm mt-1">
                Choose the perfect plan for your creative needs
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 text-slate-400 hover:text-white transition-colors"
            >
              <FiX size={20} />
            </button>
          </div>
          
          {/* Current Plan Status */}
          <div className="p-6 border-b border-slate-700/50 bg-slate-800/20">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white font-semibold">
                  Current Plan: {currentPlan === 'trial' ? 'Free Trial' : 'Free'}
                </h3>
                <p className="text-slate-400 text-sm">
                  {currentPlan === 'trial' ? 'Limited trial features and credits' : 'Basic features only'}
                </p>
              </div>
              <div className="px-3 py-1 bg-slate-700/50 text-slate-300 rounded-lg text-sm">
                {currentPlan === 'trial' ? 'Trial User' : 'Free User'}
              </div>
            </div>
          </div>

          {/* Plans Grid */}
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
              {plans.map((plan) => {
                const gradient = {
                  starter: 'from-blue-500 to-cyan-500',
                  professional: 'from-indigo-500 to-purple-600',
                  business: 'from-emerald-500 to-teal-600',
                  enterprise: 'from-orange-500 to-red-500'
                }[plan.id] || 'from-gray-500 to-gray-600';

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
                            {getPlanFeatures(plan.id).slice(0, 6).map((feature, index) => (
                              <li key={index} className="flex items-start space-x-2">
                                <div className="w-4 h-4 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                                  <FiCheck className="w-2.5 h-2.5 text-white" />
                                </div>
                                <span className="text-slate-300 text-sm">{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Upgrade Button */}
                        <button
                          onClick={() => handleUpgrade(plan.id)}
                          disabled={loading}
                          className={`w-full py-3 px-4 rounded-xl font-semibold text-white transition-all duration-500 flex items-center justify-center space-x-2 relative overflow-hidden ${
                            loading 
                              ? 'bg-slate-700 cursor-not-allowed' 
                              : `bg-gradient-to-r ${gradient} hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]`
                          }`}
                        >
                          {loading ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                              <span className="text-sm">Processing...</span>
                            </>
                          ) : (
                            <>
                              <FiCreditCard className="w-4 h-4" />
                              <span className="text-sm">Upgrade to {plan.name}</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Benefits Section */}
            <div className="mt-8 p-6 rounded-xl bg-gradient-to-r from-slate-800/30 to-slate-700/30 border border-slate-600/30">
              <h4 className="text-white font-semibold mb-4 flex items-center">
                <FiStar className="w-5 h-5 mr-2 text-yellow-500" />
                Why Upgrade?
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                    <FiZap className="w-6 h-6 text-white" />
                  </div>
                  <h5 className="text-white font-medium text-sm mb-2">More Generations</h5>
                  <p className="text-slate-400 text-xs">Create hundreds more images, videos, and content pieces</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 flex items-center justify-center">
                    <FiTool className="w-6 h-6 text-white" />
                  </div>
                  <h5 className="text-white font-medium text-sm mb-2">Professional Tools</h5>
                  <p className="text-slate-400 text-xs">Access advanced editing and production features</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center">
                    <FiHeadphones className="w-6 h-6 text-white" />
                  </div>
                  <h5 className="text-white font-medium text-sm mb-2">Priority Support</h5>
                  <p className="text-slate-400 text-xs">Get faster help when you need it most</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Upgrade Button Component for Sidebar
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

// Credits Exhausted Modal (when trial runs out)
export const CreditsExhaustedModal = ({ isOpen, onUpgrade, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="bg-[#0f1419] border border-slate-700/50 rounded-2xl shadow-2xl p-6">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center">
              <FiAlertCircle className="w-8 h-8 text-white" />
            </div>
            
            <h3 className="text-xl font-bold text-white mb-2">Credits Exhausted</h3>
            <p className="text-slate-400 mb-6">
              You've used all your trial credits. Upgrade to continue creating amazing content!
            </p>
            
            <div className="space-y-3">
              <button
                onClick={onUpgrade}
                className="w-full py-3 px-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all duration-300"
              >
                View Upgrade Plans
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