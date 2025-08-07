import React, { useEffect, useState, useCallback } from "react";
import ReactMarkdown from 'react-markdown';
import supabase from "../supabaseClient"; // Import from our single instance
import ContentGenerator from "../components/ContentGenerator.jsx";
import CloudinaryEditor from "../components/CloudinaryEditor.jsx";
import UsageMeter from "../components/UsageMeter.jsx";
import { loadStripe } from '@stripe/stripe-js';
import { v4 as uuidv4 } from 'uuid';
import { Bell, User, LogOut } from 'lucide-react';
import { toast } from 'react-toastify';
import DemoVideo from "../components/DemoVideo.jsx";
import { 
    FiHome, FiFileText, FiImage, FiVideo, FiMic, FiEdit, 
    FiBarChart2, FiUsers, FiShoppingCart, FiMoon, FiSun, 
    FiUser, FiLogOut, FiDownload, FiMaximize, FiLayers, 
    FiFolder, FiTrendingUp, FiX, FiMenu, FiPlay, FiZap, FiClock, FiInfo
} from 'react-icons/fi';
import { RiMagicLine } from 'react-icons/ri'
import { Settings, ChevronRight, Upload, Info, HelpCircle, Book, Layout, Sparkles, Clock, Star, Zap } from 'lucide-react';
import BackendFFmpeg from "../components/BackendFFmpeg.jsx";
import { useNavigate } from 'react-router-dom';
import { UpgradeButton } from '../components/UpgradeModal';
import GenerateBackground from "../components/GenerateBackground.jsx";

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://fastapi-app-production-ac48.up.railway.app';

// Professional Modal Component
const ProfessionalModal = ({ isOpen, onClose, title, subtitle, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative z-10 w-full max-w-4xl mx-4 max-h-[90vh] overflow-auto">
        <div className="bg-[#0f1419] border border-slate-700/50 rounded-2xl shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
            <div>
              <h2 className="text-xl font-bold text-white">{title}</h2>
              <p className="text-slate-400 text-sm mt-1">{subtitle}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 text-slate-400 hover:text-white transition-colors"
            >
              <FiX size={20} />
            </button>
          </div>
          
          {/* Content */}
          <div className="p-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

const typeConfig = {
  text: {
    title: 'Copy Generation',
    subtitle: 'Professional marketing copy',
    description: 'Generate compelling headlines, product descriptions, and marketing content optimized for conversion.',
    icon: <FiFileText size={20} />,
    gradient: 'from-blue-500 to-cyan-500',
    borderGradient: 'from-blue-500/20 to-cyan-500/20',
    glowColor: 'shadow-blue-500/20',
    capability: 'AI-powered copywriting',
    modalTitle: 'AI Copy Generation',
    modalSubtitle: 'Create professional marketing copy that converts'
  },
  image: {
    title: 'Image Enhancement',
    subtitle: 'Professional product photography',
    description: 'Transform product photos into polished marketing visuals with advanced AI styling and background enhancement.',
    icon: <FiImage size={20} />,
    gradient: 'from-indigo-500 to-purple-600',
    borderGradient: 'from-indigo-500/20 to-purple-600/20',
    glowColor: 'shadow-indigo-500/20',
    capability: 'Product image transformation',
    modalTitle: 'AI Image Enhancement',
    modalSubtitle: 'Transform product photos into professional marketing assets',
    instructions: {
      title: 'How It Works',
      steps: [
        {
          title: 'Upload Your Product Image',
          description: 'Upload a clear photo of your product, storefront, or brand asset. This will be your base image that gets enhanced.'
        },
        {
          title: 'Add Style Reference',
          description: 'Upload a second image that represents the style, mood, or aesthetic you want. This inspiration image guides the AI on lighting, colors, and overall feel. Tag both images with descriptive text to help the AI understand your vision.'
        },
        {
          title: 'Generate & Save',
          description: 'The AI will enhance your product image using the style reference as inspiration. Your enhanced image will automatically save to your Media Library for easy access.'
        }
      ]
    }
  },
  video: {
    title: 'Video Production',
    subtitle: 'Dynamic commercial content',
    description: 'Create engaging video advertisements from static images with professional motion and transitions.',
    icon: <FiVideo size={20} />,
    gradient: 'from-emerald-500 to-teal-600',
    borderGradient: 'from-emerald-500/20 to-teal-600/20',
    glowColor: 'shadow-emerald-500/20',
    capability: 'Video generation & editing',
    modalTitle: 'AI Video Production',
    modalSubtitle: 'Create dynamic commercials from product images',
    instructions: {
      title: 'How It Works',
      description: 'Create engaging video content from your images with two quality options.',
      options: [
        {
          type: 'Standard (Keyframes)',
          features: [
            'Upload two images to create smooth transitions between scenes',
            'Perfect for before/after reveals, product showcases, or storytelling',
            'AI creates fluid motion between your two images',
            'Fast processing, reliable results'
          ]
        },
        {
          type: 'Premium (High Quality)',
          features: [
            'Upload a single base image and transform it into dynamic video',
            'Superior quality with enhanced details and smoother motion',
            'Faster processing time',
            'Ideal for hero videos and premium marketing content'
          ]
        }
      ],
      finalStep: 'Your video will automatically save to your Media Library once processing is complete.'
    }
  },
  tts: {
    title: 'Voice Synthesis',
    subtitle: 'Professional narration',
    description: 'Generate high-quality voiceovers and narration using advanced AI voice synthesis technology.',
    icon: <FiMic size={20} />,
    gradient: 'from-orange-500 to-red-500',
    borderGradient: 'from-orange-500/20 to-red-500/20',
    glowColor: 'shadow-orange-500/20',
    capability: 'AI voice generation',
    modalTitle: 'AI Voice Synthesis',
    modalSubtitle: 'Generate professional narration and voiceovers'
  }
};


// Updated EnterpriseContentGenerator component
const EnterpriseContentGenerator = ({ type, remaining, onGenerate, isModal = false }) => {
  const config = typeConfig[type];
  
  return (
    <div className={isModal ? "space-y-6" : ""}>
      {/* Instructions Section - Only show for image and video */}
      {(type === 'image' || type === 'video') && config.instructions && (
        <div className="mb-8 p-6 rounded-xl bg-gradient-to-r from-slate-800/30 to-slate-700/30 border border-slate-600/30">
          <h4 className="text-white font-semibold mb-4 flex items-center">
            <FiInfo className="w-4 h-4 mr-2 text-blue-400" />
            {config.instructions.title}
          </h4>
          
          {/* Image Enhancement Instructions */}
          {type === 'image' && (
            <div className="space-y-4">
              {config.instructions.steps.map((step, index) => (
                <div key={index} className="space-y-2">
                  <h5 className="text-white font-medium text-sm">
                    Step {index + 1}: {step.title}
                  </h5>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Video Production Instructions */}
          {type === 'video' && (
            <div className="space-y-4">
              <p className="text-slate-300 text-sm leading-relaxed mb-4">
                {config.instructions.description}
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {config.instructions.options.map((option, index) => (
                  <div key={index} className="p-4 rounded-lg bg-slate-900/40 border border-slate-600/20">
                    <h6 className="text-white font-medium text-sm mb-3">{option.type}</h6>
                    <ul className="space-y-1">
                      {option.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="text-slate-400 text-xs flex items-start">
                          <span className="text-emerald-400 mr-2">•</span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <p className="text-blue-300 text-sm">
                  <strong>Important:</strong> {config.instructions.finalStep}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Professional form styling for modal */}
      <div className="space-y-6">
        <ContentGenerator
          type={type}
          remaining={remaining}
          onGenerate={onGenerate}
          className="enterprise-generator"
          darkMode={true}
        />
      </div>
      
      {/* Remove the old Runway References Guide since it was incorrectly placed on video */}
      
      {/* Add custom styles */}
      <style jsx>{`
        .enterprise-generator textarea {
          background: rgba(30, 41, 59, 0.5) !important;
          border: 1px solid rgba(71, 85, 105, 0.3) !important;
          border-radius: 12px !important;
          padding: 16px !important;
          color: white !important;
          font-size: 14px !important;
          line-height: 1.5 !important;
          transition: all 0.2s ease !important;
        }
        
        .enterprise-generator textarea:focus {
          background: rgba(30, 41, 59, 0.8) !important;
          border-color: rgba(99, 102, 241, 0.5) !important;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1) !important;
          outline: none !important;
        }
        
        .enterprise-generator input[type="file"] + div {
          background: rgba(30, 41, 59, 0.3) !important;
          border: 2px dashed rgba(71, 85, 105, 0.4) !important;
          border-radius: 12px !important;
          padding: 24px !important;
          transition: all 0.2s ease !important;
        }
        
        .enterprise-generator input[type="file"] + div:hover {
          background: rgba(30, 41, 59, 0.5) !important;
          border-color: rgba(99, 102, 241, 0.4) !important;
        }
        
        .enterprise-generator button[type="submit"] {
          background: linear-gradient(135deg, #6366f1, #8b5cf6) !important;
          border: none !important;
          border-radius: 12px !important;
          padding: 16px 24px !important;
          font-weight: 600 !important;
          font-size: 14px !important;
          transition: all 0.2s ease !important;
        }
        
        .enterprise-generator button[type="submit"]:hover:not(:disabled) {
          background: linear-gradient(135deg, #5b59ed, #7c3aed) !important;
          transform: translateY(-1px) !important;
          box-shadow: 0 8px 25px rgba(99, 102, 241, 0.25) !important;
        }
        
        .enterprise-generator select {
          background: rgba(30, 41, 59, 0.5) !important;
          border: 1px solid rgba(71, 85, 105, 0.3) !important;
          border-radius: 8px !important;
          color: white !important;
          padding: 8px 12px !important;
        }
      `}</style>
    </div>
  );
};

const UserDashboard = ({ debug = false }) => {
  const [userPlan, setUserPlan] = useState("basic");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [usage, setUsage] = useState(0);
  const [error, setError] = useState("");
  const [darkMode, setDarkMode] = useState(true);
  const [loading, setLoading] = useState(true);
  const [showDemoVideo, setShowDemoVideo] = useState(false);
  const [previews, setPreviews] = useState({
    text: "",
    image: "",
    video: "",
    audio: ""
  });

  const [fileKey, setFileKey] = useState(uuidv4());
  const [editableAssets, setEditableAssets] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('generators');
  const [fullscreenPreview, setFullscreenPreview] = useState(null);
  const [paymentError, setPaymentError] = useState(null);
  const userEmail = currentUser?.email || '';

  const handleLogout = async () => {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        window.location.reload();
    } catch (err) {
        setError(err.message);
    }
  };

  useEffect(() => {
    let isMounted = true;
    
    const fetchDashboardData = async () => {
        try {
            // First get the current session to ensure we have a valid token
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            if (sessionError) {
                console.error("Session error:", sessionError);
                throw new Error("Authentication required");
            }
            
            if (!session) {
                console.error("No active session found");
                throw new Error("Authentication required");
            }
            
            // Log token expiry info for debugging
            console.log("Token expires at:", new Date(session?.expires_at * 1000));
            console.log("Current time:", new Date());
            
            // Refresh session if token is close to expiry (less than 5 minutes)
            const expiresAt = new Date(session?.expires_at * 1000);
            const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);
            
            if (expiresAt < fiveMinutesFromNow) {
                console.log("Token expiring soon, refreshing...");
                await supabase.auth.refreshSession();
                const { data: { session: freshSession } } = await supabase.auth.getSession();
                
                if (freshSession) {
                    console.log("Session refreshed successfully");
                } else {
                    console.error("Failed to refresh session");
                }
            }

            // Then get the user details
            const { data: { user }, error: authError } = await supabase.auth.getUser();
            if (authError) {
                console.error("Auth error:", authError);
                throw new Error("Authentication required");
            }
            
            if (!user) {
                console.error("User data not found");
                throw new Error("Authentication required");
            }

            setCurrentUser(user);
    
            // Fetch all data in parallel
            const [planRes, usageRes, assetsRes, cloudinaryRes] = await Promise.all([
                // User plan info
                supabase.from("users").select("plan, stripe_id").eq("id", user.id).single(),
                
                // Usage data
                supabase.from("user_usage")
                    .select("content_generated")
                    .eq("user_id", user.id)
                    .eq("month_year", new Date().toISOString().slice(0, 7))
                    .maybeSingle(),
                
                // Generated content from database
                supabase.from("generated_content")
                    .select("id, content, type, created_at, metadata")
                    .eq("user_id", user.id)
                    .order("created_at", { ascending: false }),
                
                // Improved Cloudinary assets fetching with better error handling
                (async () => {
                    try {
                        // Make sure we have a fresh session
                        const { data: { session: currentSession }, error: refreshError } = await supabase.auth.getSession();
                        
                        if (refreshError) {
                            console.error("Failed to get session:", refreshError);
                            return [];
                        }
                        
                        if (!currentSession) {
                            console.error("No valid session available");
                            return [];
                        }
                        
                        console.log("Using token for assets:", 
                            currentSession.access_token.substring(0, 15) + "..." + 
                            currentSession.access_token.substring(currentSession.access_token.length - 5)
                        );
                        
                        const response = await fetch(`/user-assets?user_id=${user.id}`, {
                            method: 'GET',
                            headers: {
                                'Authorization': `Bearer ${currentSession.access_token}`,
                                'Content-Type': 'application/json'
                            }
                        });
                        
                        // Detailed error logging
                        if (!response.ok) {
                            const responseText = await response.text();
                            console.error(`Asset fetch error (${response.status}):`, responseText);
                            throw new Error(`Asset fetch failed: ${response.status} - ${responseText}`);
                        }
                        
                        const data = await response.json();
                        console.log(`Successfully fetched ${data.length} assets`);
                        return data;
                    } catch (error) {
                        console.warn("Assets fetch warning:", error.message);
                        return []; // Return empty array if fetch fails
                    }
                })()
            ]);
            
            // Check for errors in the individual requests
            if (planRes.error) {
                console.warn("Plan info fetch error:", planRes.error);
            }
            
            if (usageRes.error) {
                console.warn("Usage fetch error:", usageRes.error);
            }
            
            if (assetsRes.error) {
                console.warn("Database assets fetch error:", assetsRes.error);
            }

            // ADMIN OVERRIDE - Check for your email first
            let plan;
            if (user.email === 'mariasheikh0113@outlook.com') {
                plan = 'enterprise';
                console.log("Admin override in UserDashboard: plan set to enterprise");
            } else {
                plan = (
                    user.user_metadata?.plan?.toLowerCase() || 
                    planRes.data?.plan?.toLowerCase() || 
                    "basic"
                );
            }
            
            // Updated valid plans to match new pricing structure
            const validPlans = [
                'free', 'trial', 'trial_expired',
                'starter', 'professional', 'business', 'enterprise',
                // Legacy plans for backward compatibility
                'basic', 'premium', 'pro'
            ];
            
            if (!validPlans.includes(plan)) {
                console.warn(`Invalid subscription plan detected: ${plan}`);
                throw new Error("Invalid subscription plan");
            }
    
            // Process database assets
            let userAssets = [];
            if (assetsRes.data && Array.isArray(assetsRes.data)) {
                userAssets = assetsRes.data.map(asset => ({
                    id: asset.id,
                    content: asset.content,
                    type: asset.type || 'image',
                    createdAt: asset.created_at,
                    metadata: asset.metadata || {},
                    source: 'database'
                }));
            }

            // Process Cloudinary assets
            let cloudinaryAssets = [];
            if (Array.isArray(cloudinaryRes)) {
                cloudinaryAssets = cloudinaryRes.map(asset => ({
                    id: asset.public_id || asset.id,
                    content: asset.content || asset.secure_url,
                    type: asset.type || asset.resource_type || 'image',
                    createdAt: asset.created_at || asset.createdAt || new Date().toISOString(),
                    metadata: asset.metadata || {
                        format: asset.format,
                        bytes: asset.bytes,
                        width: asset.width,
                        height: asset.height
                    },
                    source: 'cloudinary',
                    thumbnail: asset.thumbnail
                }));
            }

            // Merge and sort all assets by creation date
            const allAssets = [...userAssets, ...cloudinaryAssets]
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

            if (isMounted) {
                setUserPlan(plan);
                setUsage(usageRes.data?.content_generated || 0);
                setEditableAssets(allAssets);
                
                if (debug) {
                    console.log("Initialized dashboard data", {
                        plan,
                        usage: usageRes.data,
                        assetCount: allAssets.length
                    });
                }
            }
    
        } catch (err) {
            if (isMounted) {
                const errorMessage = err.message || "Unknown error";
                setError(errorMessage.includes("Authentication") ? 
                    "Session expired - Please login" : 
                    errorMessage
                );
                console.error("Dashboard error:", err);
            }
        } finally {
            if (isMounted) {
                setLoading(false);
            }
        }
    };
    
    fetchDashboardData();
    
    return () => {
        isMounted = false;
    };
  }, [debug]);
        

    
// Define API_BASE once at the top level of your component
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);


// Enhanced rate limiting helper
const withRateLimit = async (apiCall, maxRetries = 3, baseDelay = 8000) => {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await apiCall();
      return response;
    } catch (error) {
      const is429Error = error.message.includes('429') || 
                        error.message.includes('Too Many Requests') ||
                        error.message.includes('Status 429') ||
                        error.status === 429 ||
                        (error.response && error.response.status === 429);
      
      if (is429Error && attempt < maxRetries - 1) {
        const waitTime = baseDelay + (attempt * 5000); // 8s, 13s, 18s
        console.log(`Rate limited. Waiting ${waitTime}ms before retry ${attempt + 1}/${maxRetries}`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      throw error;
    }
  }
};

const pollVideoStatus = useCallback(async (taskId, accessToken) => {
  const pollEndpoint = `${API_BASE}/video-status/${taskId}`;
  let attempts = 0;
  const maxAttempts = 20;
  
  while (attempts < maxAttempts) {
    try {
      const result = await withRateLimit(async () => {
        const response = await fetch(pollEndpoint, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.status === 429) {
          throw new Error('Status 429');
        }
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error(`Video polling error: Status ${response.status}`, errorData);
          throw new Error(errorData.error || `Status check failed (${response.status})`);
        }
        
        return await response.json();
      });
      
      const status = result.status?.toUpperCase() || 'UNKNOWN';
      
      if (status === 'SUCCEEDED') {
        return {
          video_url: result.video_url || result.url || result.output?.[0],
          ...result
        };
      } 
      else if (status === 'FAILED') {
        console.error('Video generation failed with server error:', result.error);
        throw new Error(result.error || 'Video generation failed');
      }
      
      // Wait 20 seconds between video polling attempts
      await new Promise(resolve => setTimeout(resolve, 20000));
      attempts++;
    } catch (error) {
      console.error('Video polling error:', error);
      throw error;
    }
  }
  
  throw new Error('Video generation timed out');
}, []);

const pollSDXLResult = useCallback(async (generationId, accessToken) => {
  const pollEndpoint = `${API_BASE}/api/v1/stable-diffusion/image-result/${generationId}`;
  let attempts = 0;
  const maxAttempts = 20; // Increased from 10 to 20 (5 minutes total)
  
  while (attempts < maxAttempts) {
    try {
      const result = await withRateLimit(async () => {
        const response = await fetch(pollEndpoint, {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });
        
        if (response.status === 429) {
          throw new Error('Status 429');
        }
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error(`Image polling error: Status ${response.status}`, errorData);
          throw new Error(errorData.error || `Status check failed (${response.status})`);
        }
        
        return await response.json();
      });
      
      if (result.status === 'completed') {
        return result;
      } else if (result.status === 'failed') {
        console.error('Image generation failed with server error:', result.error);
        throw new Error(result.error || 'Image generation failed');
      }
      
      // Wait 30 seconds between image polling attempts (increased from 15)
      await new Promise(resolve => setTimeout(resolve, 30000));
      attempts++;
    } catch (error) {
      console.error('Image polling error:', error);
      throw error;
    }
  }
  
  throw new Error('Image generation timed out');
}, []);

// ADD THIS NEW FUNCTION FOR JOB_ID POLLING
const pollVideoStatusByJobId = useCallback(async (jobId, accessToken) => {
  const maxAttempts = 60; // 10 minutes max
  let attempts = 0;
  
  console.log(`🔄 Starting to poll video status for job_id: ${jobId}`);
  
  while (attempts < maxAttempts) {
    try {
      console.log(`📡 Polling attempt ${attempts + 1}/${maxAttempts} for job ${jobId}`);
      
      const response = await withRateLimit(async () => {
        const response = await fetch(`${API_BASE}/video-status/${jobId}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.status === 429) {
          throw new Error('Status 429');
        }
        
        return response;
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error(`Video polling error: Status ${response.status}`, errorData);
        throw new Error(errorData.error || `Status check failed (${response.status})`);
      }
      
      const result = await response.json();
      console.log(`📊 Job ${jobId} status: ${result.status}`);
      
      if (result.status === 'completed') {
        console.log(`✅ Video job ${jobId} completed:`, result.video_url || result.supabase_url);
        return {
          video_url: result.video_url || result.supabase_url,
          supabase_url: result.supabase_url,
          permanent_url: result.supabase_url,
          metadata: result.metadata,
          api_provider: result.api_provider,
          ...result
        };
      } 
      else if (result.status === 'failed') {
        console.error('Video job failed with server error:', result.error);
        throw new Error(result.error || 'Video generation failed');
      }
      else if (result.status === 'not_found') {
        throw new Error('Video job not found');
      }
      
      // Still processing, wait before next attempt
      await new Promise(resolve => setTimeout(resolve, 10000)); // 10 seconds
      attempts++;
      
    } catch (error) {
      console.error('Video job polling error:', error);
      
      // Handle rate limiting
      if (error.message.includes('429') || error.message.includes('Status 429')) {
        await new Promise(resolve => setTimeout(resolve, 15000)); // Wait 15 seconds for rate limit
      } else {
        await new Promise(resolve => setTimeout(resolve, 10000)); // Regular wait
      }
      
      attempts++;
      
      if (attempts >= maxAttempts) {
        throw error;
      }
    }
  }
  
  throw new Error('Video generation timed out after 10 minutes');
}, []);

// First, fix your API_BASE constant - remove the extra "http://"


const handleGeneration = async (content) => {
  const debug = {
    stage: 'init',
    requestDetails: {},
    responseDetails: {},
    errors: []
  };
  
  let expectedResponseFormat = 'standard';
  
  // Helper function to safely extract error details
  const getErrorDetails = (errorData) => {
    let errorType = '';
    let errorMessage = '';
    let detailString = '';
    
    if (typeof errorData.detail === 'string') {
      // Detail is a string (old format)
      errorType = errorData.detail;
      errorMessage = errorData.detail;
      detailString = errorData.detail;
    } else if (typeof errorData.detail === 'object' && errorData.detail !== null) {
      // Detail is an object (new format)
      errorType = errorData.detail.error || '';
      errorMessage = errorData.detail.message || errorData.detail.error || 'Unknown error';
      detailString = errorMessage; // Use message for string operations
    } else {
      // Fallback
      errorType = 'unknown_error';
      errorMessage = errorData.message || 'An unexpected error occurred';
      detailString = errorMessage;
    }
    
    return { errorType, errorMessage, detailString };
  };
  
  try {
    debug.stage = 'auth';
    let sessionResponse, userResponse;
    
    try {
      console.log("Starting authentication check");
      sessionResponse = await supabase.auth.getSession();
      console.log("Auth session response received:", sessionResponse ? "Success" : "Failed");
      
      const { data: { session }, error: sessionError } = sessionResponse;
      
      if (sessionError) {
        console.error("Session error details:", sessionError);
        debug.errors.push({ 
          stage: 'auth-session', 
          error: sessionError,
          code: sessionError.code || 'unknown',
          status: sessionError.status || 'unknown'
        });
      }
      
      userResponse = await supabase.auth.getUser();
      console.log("Auth user response received:", userResponse ? "Success" : "Failed");
    } catch (authApiError) {
      console.error("Auth API error:", authApiError);
      debug.errors.push({ stage: 'auth-api', error: authApiError.message });
    }
    
    const { data: { session }, error: sessionError } = sessionResponse || { data: {} };
    const { data: { user } } = userResponse || { data: {} };

    if (sessionError || !session || !user) {
      console.error("Authentication error:", {
        sessionError,
        hasSession: !!session,
        hasUser: !!user,
        sessionExpiry: session ? new Date(session.expires_at * 1000).toISOString() : 'N/A'
      });
      debug.errors.push({ stage: 'auth', error: sessionError });
      throw new Error("session");
    }

    debug.userId = user.id;
    debug.userEmail = user.email;
    debug.sessionActive = !!session;
    debug.sessionExpiresAt = session.expires_at;
    
   debug.stage = 'plan-check';
const planLimits = {
  free: 3,
  trial: 3,
  starter: 25,
  professional: 50,
  business: 100,
  enterprise: Infinity,
  // Legacy plan support
  basic: 25,      // Map to starter
  premium: 50,    // Map to professional
  pro: Infinity   // Map to enterprise
};
    
    console.log(`User plan check: plan=${userPlan}, used=${usage}, limit=${planLimits[userPlan] || 'unknown'}`);
    
    if (userPlan !== 'enterprise' && userPlan !== 'pro' && usage >= planLimits[userPlan]) {
      debug.errors.push({ 
        stage: 'plan-check', 
        error: 'limit_reached', 
        plan: userPlan, 
        usage, 
        limit: planLimits[userPlan],
        percentage: Math.round((usage / planLimits[userPlan]) * 100)
      });
      throw new Error("limit_reached");
    }

    const type = content?.type || 'text';
    let endpoint;
    let requestOptions = {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${session.access_token}`,
        "X-User-ID": user.id
      },
      credentials: 'include'
    };

    debug.stage = 'prepare-request';
    debug.contentType = type;

    let body;
    try {
      if (type === 'video') {
        endpoint = `${API_BASE}/api/generate-video-json`;
        requestOptions.headers['Content-Type'] = 'application/json';
        
        // Handle keyframes mode (2 images)
        if (content.videoMode === 'keyframes' && content.lastFrameImage) {
          console.log('Using keyframes mode with two images');
          
          // UPDATED: Block keyframes for veo2 model
          if (content.model === 'veo2') {
            throw new Error('Keyframes mode is not yet supported with Premium model. Please use single image mode or switch to Standard model.');
          }
          
          // Upload first frame image
          let firstFrameUrl = null;
          if (content.image) {
            console.log('Uploading first frame image...');
            const imageFormData = new FormData();
            imageFormData.append('image', content.image);
            
            const imageUploadResponse = await fetch(`${API_BASE}/api/upload-image`, {
              method: 'POST',
              headers: {
                "Authorization": `Bearer ${session.access_token}`,
                "X-User-ID": user.id
              },
              body: imageFormData,
              credentials: 'include'
            });
            
            if (!imageUploadResponse.ok) {
              const errorData = await imageUploadResponse.json().catch(() => ({}));
              throw new Error(`Failed to upload first frame: ${errorData.detail || imageUploadResponse.statusText}`);
            }
            
            const imageData = await imageUploadResponse.json();
            firstFrameUrl = imageData.url || imageData.image_url;
            console.log('First frame uploaded successfully:', firstFrameUrl);
          }
          
          // Upload last frame image
          let lastFrameUrl = null;
          if (content.lastFrameImage) {
            console.log('Uploading last frame image...');
            const lastImageFormData = new FormData();
            lastImageFormData.append('image', content.lastFrameImage);
            
            const lastImageUploadResponse = await fetch(`${API_BASE}/api/upload-image`, {
              method: 'POST',
              headers: {
                "Authorization": `Bearer ${session.access_token}`,
                "X-User-ID": user.id
              },
              body: lastImageFormData,
              credentials: 'include'
            });
            
            if (!lastImageUploadResponse.ok) {
              const errorData = await lastImageUploadResponse.json().catch(() => ({}));
              throw new Error(`Failed to upload last frame: ${errorData.detail || lastImageUploadResponse.statusText}`);
            }
            
            const lastImageData = await lastImageUploadResponse.json();
            lastFrameUrl = lastImageData.url || lastImageData.image_url;
            console.log('Last frame uploaded successfully:', lastFrameUrl);
          }
          
          if (!firstFrameUrl || !lastFrameUrl) {
            throw new Error("Both first and last frame images are required for keyframes mode");
          }
          
          // Send keyframes request WITH DURATION
          body = JSON.stringify({
            promptImageUrl: firstFrameUrl,
            lastFrameImageUrl: lastFrameUrl,
            promptText: content.prompt?.trim() || '',
            videoMode: "keyframes",
            model: "gen3a_turbo", // Force gen3a_turbo for keyframes
            ratio: content.ratio || "1280:768",
            duration: content.duration || 10
          });
          
          console.log('Keyframes video generation request:', {
            endpoint,
            promptText: content.prompt?.trim() || '',
            firstFrameUrl,
            lastFrameUrl,
            model: "gen3a_turbo",
            duration: content.duration || 10
          });
        } 
        // Handle single image mode (existing logic)
        else {
          console.log('Using single image mode');
          
          // First, upload the image to get a URL
          let imageUrl = null;
          if (content.image) {
            console.log('Uploading image for video generation...');
            
            const imageFormData = new FormData();
            imageFormData.append('image', content.image);
            
            const imageUploadResponse = await fetch(`${API_BASE}/api/upload-image`, {
              method: 'POST',
              headers: {
                "Authorization": `Bearer ${session.access_token}`,
                "X-User-ID": user.id
              },
              body: imageFormData,
              credentials: 'include'
            });
            
            if (!imageUploadResponse.ok) {
              const errorData = await imageUploadResponse.json().catch(() => ({}));
              throw new Error(`Failed to upload image: ${errorData.detail || imageUploadResponse.statusText}`);
            }
            
            const imageData = await imageUploadResponse.json();
            imageUrl = imageData.url || imageData.image_url;
            console.log('Image uploaded successfully:', imageUrl);
          }
          
          if (!imageUrl) {
            throw new Error("Image is required for video generation");
          }
          
          // UPDATED: Now send JSON request with image URL AND DURATION
          body = JSON.stringify({
            promptImageUrl: imageUrl,
            promptText: content.prompt?.trim() || '',
            referenceImageUrl: content.referenceImageUrl || null,
            videoMode: "image_to_video", // UPDATED: Use correct mode name
            model: content.model || "gen3a_turbo", // UPDATED: Support both veo2 and gen3a_turbo
            ratio: content.ratio || "1280:720",
            duration: content.duration || 10
          });
          
          console.log('Video generation request:', {
            endpoint,
            promptText: content.prompt?.trim() || '',
            imageUrl,
            model: content.model || "gen3a_turbo",
            ratio: content.ratio || "1280:720",
            duration: content.duration || 10
          });
        }
      } 
      else if (type === 'tts') {
        endpoint = `${API_BASE}/api/elevenlabs/text-to-speech/${encodeURIComponent(content.voice_id)}`;
        requestOptions.headers['Content-Type'] = 'application/json';
        requestOptions.headers['Accept'] = 'audio/mpeg';
        const ttsPayload = {
          text: content.prompt?.trim() || '',
          model_id: "eleven_multilingual_v2",
          stability: content.stability || 0.5,
          similarity_boost: content.similarity_boost || 0.75
        };
        body = JSON.stringify(ttsPayload);
        console.log(`TTS generation request: ${endpoint}`, {
          voice_id: content.voice_id,
          textLength: (content.prompt?.trim() || '').length,
          stability: ttsPayload.stability,
          similarity_boost: ttsPayload.similarity_boost
        });
      } 
      else if (type === 'image') {
        // FIXED: Use the new branded ad endpoint with guaranteed product consistency
        let referenceImage = content.referenceImage || content.reference_image || content.refImage || content.referenceFile;
        
        // NEW: Use the fixed product consistency endpoint
        endpoint = `${API_BASE}/api/generate-branded-ad`;
        
        if (referenceImage) {
            console.log("🎯 Using NEW PRODUCT CONSISTENCY mode with guaranteed preservation");
        } else {
            console.log("🎯 Using new standard mode with product preservation");
        }
        
        const formData = new FormData();
        
        if (!content.image) {
          throw new Error("Source image is required for image generation");
        }
        
        const imageSize = content.image.size / (1024 * 1024);
        if (imageSize > 10) {
          throw new Error(`Image size (${imageSize.toFixed(2)}MB) exceeds the 10MB limit`);
        }
        
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(content.image.type)) {
          throw new Error(`Unsupported image type: ${content.image.type}. Use JPEG, PNG or WebP`);
        }
        
        // NEW: Use 'product_image' instead of 'image' to match new endpoint
        formData.append('product_image', content.image);
        
        if (referenceImage) {
          console.log("🔍 Reference image details:", {
            name: referenceImage.name,
            size: referenceImage.size,
            type: referenceImage.type
          });
          
          const refImageSize = referenceImage.size / (1024 * 1024);
          if (refImageSize > 10) {
            throw new Error(`Reference image size (${refImageSize.toFixed(2)}MB) exceeds the 10MB limit`);
          }
          
          if (!allowedTypes.includes(referenceImage.type)) {
            throw new Error(`Unsupported reference image type: ${referenceImage.type}. Use JPEG, PNG or WebP`);
          }
          
          // NEW: Use 'reference_image' to match new endpoint
          formData.append('reference_image', referenceImage);
          console.log("✅ Reference image added for background styling only");
        }
        
        if (!content.prompt || (content.prompt?.trim() || '').length < 3) {
          throw new Error("Prompt text is required");
        }
        
        // NEW: Clean prompt handling - no @ref1 requirement
        const cleanPrompt = content.prompt?.trim() || '';
        formData.append('prompt', cleanPrompt);
        
        body = formData;
        delete requestOptions.headers['Content-Type'];
        
        console.log("🔍 FormData contents for NEW endpoint:");
        for (let [key, value] of formData.entries()) {
          if (value instanceof File) {
            console.log(`  ${key}: File(${value.name}, ${value.size} bytes, ${value.type})`);
          } else {
            console.log(`  ${key}: ${value}`);
          }
        }
        
        console.log(`NEW PRODUCT CONSISTENCY request: ${endpoint}`, {
          prompt: cleanPrompt,
          imageType: content.image.type,
          imageSize: `${imageSize.toFixed(2)}MB`,
          hasReferenceImage: !!referenceImage,
          referenceImageType: referenceImage?.type || 'none',
          guaranteedConsistency: true
        });
        
        // NEW: Set response validation flag for new endpoint format
        expectedResponseFormat = 'branded-ad';
      }
      else {
        endpoint = `${API_BASE}/api/generate-text`;
        requestOptions.headers['Content-Type'] = 'application/json';
        
        const promptText = content.prompt?.trim() || '';
        body = JSON.stringify({
          prompt: promptText
        });
        
        debug.requestDetails.textPrompt = promptText;
        debug.requestDetails.textPromptLength = promptText.length;
        debug.requestDetails.textPromptWords = promptText.split(/\s+/).length;
        
        console.log('Text generation request prepared:', {
          endpoint,
          promptLength: promptText.length,
          promptWords: promptText.split(/\s+/).length,
          contentType: requestOptions.headers['Content-Type']
        });
      }
    } catch (error) {
      console.error("Error preparing request:", error);
      debug.errors.push({ 
        stage: 'prepare-request', 
        error: error.message,
        stack: error.stack,
        contentType: type
      });
      throw error;
    }

    if (body !== null) {
      requestOptions.body = body;
    }
    debug.requestDetails.endpoint = endpoint;
    debug.requestDetails.method = requestOptions.method;
    debug.requestDetails.headers = { ...requestOptions.headers };

    console.log(`API request details:`, {
      url: endpoint,
      method: requestOptions.method,
      headers: { ...requestOptions.headers },
      bodyType: typeof body,
      bodyPreview: typeof body === 'string' ? body.substring(0, 100) + '...' : '[non-string body]',
      duration: content.duration || 'not specified'
    });

    debug.stage = 'fetch';
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.error(`Request timeout for ${endpoint} after 120 seconds`);
      controller.abort();
    }, 120000);
    requestOptions.signal = controller.signal;

    try {
      console.log(`Making request to endpoint: ${endpoint}`);
      
      let response;
      try {
        const startTime = Date.now();
        response = await withRateLimit(async () => {
          const fetchResponse = await fetch(endpoint, requestOptions);
          
          if (fetchResponse.status === 429) {
            throw new Error(`Status 429`);
          }
          
          return fetchResponse;
        });
        const endTime = Date.now();
        console.log(`Request time: ${endTime - startTime}ms`);
      } catch (networkError) {
        console.error("Network-level fetch error:", networkError);
        debug.errors.push({ 
          stage: 'network', 
          error: networkError.message,
          name: networkError.name
        });
        
        if (networkError.message.includes('Failed to fetch')) {
          throw new Error("Server connection failed. Please check your internet connection or try again later.");
        }
        throw networkError;
      }

      clearTimeout(timeoutId);
      
      debug.responseDetails.status = response.status;
      debug.responseDetails.statusText = response.statusText;
      debug.responseDetails.contentType = response.headers.get('Content-Type');
      debug.responseDetails.headers = Object.fromEntries(response.headers.entries());
      
      console.log(`API response received: status=${response.status}, contentType=${response.headers.get('Content-Type')}`);
      
      if (!response.ok) {
        debug.stage = 'handle-error';
        const contentType = response.headers.get('Content-Type') || '';
        let errorData = {};
        let responseText = '';
        
        try {
          if (contentType.includes('application/json')) {
            errorData = await response.json();
            debug.responseDetails.errorJson = errorData;
          } else {
            responseText = await response.text();
            debug.responseDetails.errorText = responseText;
            errorData = { message: responseText };
          }
        } catch (parseError) {
          console.error('Error parsing error response:', parseError);
          console.error('Failed response status:', response.status);
          console.error('Failed response headers:', Object.fromEntries(response.headers.entries()));
          
          debug.errors.push({ 
            stage: 'parse-error', 
            error: parseError.message,
            responseStatus: response.status,
            responseStatusText: response.statusText
          });
          errorData = { message: 'Failed to parse error response' };
        }
        
        console.error(`API Error (${type}): Status ${response.status}`, {
          endpoint,
          errorData,
          headers: Object.fromEntries(response.headers.entries())
        });
        
        console.log('Complete debug information:', debug);
        
        let errorMessage;
        
        switch (response.status) {
          case 400:
            errorMessage = errorData.detail || errorData.message || 
                         'Invalid input parameters. Please check your submission.';
            break;
          case 401:
          case 403:
            errorMessage = 'Authentication or authorization failed. Please login again.';
            break;
          case 404:
            errorMessage = 'Endpoint not found. Please check your URL and try again.';
            
            console.error('404 Not Found Details:', {
              endpointAttempted: endpoint,
              fullUrl: window.location.origin + endpoint,
              availableEndpoints: 'Use /routes endpoint to check available routes',
              recommendation: 'Ensure endpoint exists in FastAPI app and Vite proxy is configured correctly',
              responseText: responseText || 'No response text'
            });
            break;
          case 413:
            errorMessage = 'File size too large. Please use a smaller file.';
            break;
          case 415:
            errorMessage = 'Unsupported media type. Please use compatible file formats.';
            break;
          case 429:
            errorMessage = `Status check failed (${response.status})`;
            break;
          case 500:
          case 502:
          case 503:
          case 504:
            errorMessage = `Server error (${response.status}). Please try again later.`;
            break;
          default:
            errorMessage = errorData.detail || errorData.message || 
                        `Request failed with status ${response.status}`;
        }
        
        // FIXED ERROR HANDLING: Use the helper function to safely extract error details
        const { errorType, errorMessage: extractedMessage, detailString } = getErrorDetails(errorData);

        // Handle specific error types first (from structured responses)
        if (errorType === 'trial_expired') {
          errorMessage = 'Your trial has expired. Upgrade to continue creating!';
        } else if (errorType === 'no_credits' || errorType === 'generation_limit_reached') {
          errorMessage = extractedMessage || 'You\'ve reached your generation limit. Upgrade to continue!';
        } else if (errorType === 'feature_locked') {
          errorMessage = extractedMessage || 'This feature is not available in trial. Upgrade to access all features.';
        } else if (errorType === 'premium_feature_locked') {  // UPDATED: Handle premium feature locked
          errorMessage = extractedMessage || 'Premium model is not available in trial. Upgrade to access advanced AI models!';
        } else if (errorType === 'video_generation_failed') {
          errorMessage = extractedMessage || 'Video generation failed. Please try again.';
        }
        // Handle by content type and string matching (for backward compatibility)
        else if (type === 'image') {
          if (detailString.includes('image processing')) {
            errorMessage = 'Failed to process source image. Try a different image.';
          } else if (detailString.includes('nsfw')) {
            errorMessage = 'Content filtered - Please modify your prompt or image.';
          } else if (detailString.includes('invalid image') || detailString.includes('unsupported format')) {
            errorMessage = 'Invalid image format. Please use JPEG, PNG or WebP.';
          } else if (detailString.includes('file size')) {
            errorMessage = 'Image file is too large. Maximum size is 10MB.';
          } else if (detailString.includes('missing image')) {
            errorMessage = 'No image was provided. Please select an image.';
          } else {
            errorMessage = extractedMessage || 'Image generation failed. Please try again.';
          }
        }
        else if (type === 'tts') {
          if (detailString.includes('voice_id')) {
            errorMessage = 'Invalid voice selected. Please try a different voice.';
          } else if (detailString.includes('text too long')) {
            errorMessage = 'Text is too long. Please shorten your input.';
          } else {
            errorMessage = extractedMessage || 'Text-to-speech generation failed. Please try again.';
          }
        }
        else if (type === 'video') {
          if (detailString.includes('processing queue')) {
            errorMessage = 'Video processing queue full. Please try again later.';
          } else if (detailString.includes('Duration must be')) {
            errorMessage = 'Invalid duration selected. Please choose 5 or 10 seconds.';
          } else if (detailString.includes('duration')) {
            errorMessage = 'Duration parameter error. Please try again.';
          } else if (detailString.includes('Last frame image required')) {
            errorMessage = 'Please upload the last frame image for keyframes mode.';
          } else if (detailString.includes('Invalid last frame image URL')) {
            errorMessage = 'Invalid last frame image. Please try uploading again.';
          } else if (detailString.includes('Keyframes mode is not yet supported with Premium model')) {  // UPDATED: Handle veo2 keyframes error
            errorMessage = 'Keyframes mode is not yet supported with Premium model. Please use single image mode or switch to Standard model.';
          } else if (detailString.includes('rate limit') || detailString.includes('Rate limited')) {
            errorMessage = 'Rate limited by video service. Please wait 5-10 minutes before trying again.';
          } else if (detailString.includes('content') || detailString.includes('moderation')) {
            errorMessage = 'Content moderation issue. Try different images or prompt.';
          } else if (detailString.includes('credit') || detailString.includes('billing')) {
            errorMessage = 'Video service billing issue. Please try again later.';
          } else if (detailString.includes('format') || detailString.includes('size')) {
            errorMessage = 'Image format or size issue. Try smaller images (under 1MB).';
          } else {
            errorMessage = extractedMessage || 'Video generation failed. Please try again.';
          }
        }
        else {
          // Default case for any content type
          errorMessage = extractedMessage || 'Generation failed. Please try again.';
        }
        
        throw new Error(errorMessage);
      }
       debug.stage = 'process-response';
      const contentType = response.headers.get('Content-Type') || '';
      let result = {};
      const previewUpdate = {};
      
      if (type === 'tts') {
        if (!contentType.includes('audio/')) {
          const errorText = await response.text();
          console.error('TTS Error: Expected audio, received:', contentType, errorText);
          throw new Error('Server returned invalid audio format');
        }
        
        const blob = await response.blob();
        if (blob.size < 100) {
          console.error('TTS Error: Received too small audio file', blob.size);
          throw new Error('Generated audio file is invalid');
        }
      
        const audioUrl = URL.createObjectURL(blob);
        
        previewUpdate.audio = audioUrl;
        previewUpdate.audioElement = (
          <div className="mt-4">
            <audio controls className="w-full">
              <source src={audioUrl} type="audio/mpeg" />
            </audio>
            <a
              href={audioUrl}
              download={`tts_${content.voice_id}_${Date.now()}.mp3`}
              className="text-blue-600 hover:text-blue-800 text-sm block mt-2"
            >
              Download Audio
            </a>
          </div>
        );
        result.audio_data = blob;
      } 
      else if (type === 'video') {
        if (!contentType.includes('application/json')) {
          const errorText = await response.text();
          console.error('Video Error: Expected JSON, received:', contentType, errorText);
          throw new Error('Server returned invalid response format');
        }
        
        const data = await response.json();
        Object.assign(result, data);

        // UPDATED: Handle new async video response format
        if (data.job_id) {
          console.log(`✅ Video generation started with job_id: ${data.job_id}`);
          console.log('🔄 Video will be processed asynchronously');
          
          // START POLLING FOR THE ASYNC JOB
          try {
            console.log(`🔄 Starting polling for job_id: ${data.job_id}`);
            
            // Start polling in the background
            const pollResult = await pollVideoStatusByJobId(data.job_id, session.access_token);
            
            if (pollResult && pollResult.video_url) {
              // Clean up video URL for mobile compatibility
              let videoUrl = pollResult.video_url;
              
              // Apply the same CloudFront to Supabase conversion if needed
              if (videoUrl && videoUrl.includes('cloudfront.net')) {
                const taskId = data.job_id;
                videoUrl = `https://afyuizwemllouyulpkir.supabase.co/storage/v1/object/public/videos/videos/${user.id}/${taskId}.mp4`;
                console.log('🔧 Converted CloudFront URL to Supabase URL:', videoUrl);
              }

              // Clean polling URLs
              if (videoUrl) {
                videoUrl = videoUrl.replace(/[?&]$/, '');
                
                // Additional mobile-specific cleaning
                const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
                if (isMobile) {
                  console.log('📱 Mobile device detected - cleaning video URL for compatibility');
                  
                  try {
                    const urlObj = new URL(videoUrl);
                    // Reconstruct clean URL without problematic query parameters
                    videoUrl = `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}`;
                    console.log('📱 Cleaned video URL for mobile:', videoUrl);
                  } catch (urlError) {
                    console.error('📱 URL cleaning failed, using original:', urlError);
                  }
                }
                
                console.log('🧹 Cleaned polling video URL:', videoUrl);
              }

              // Update previews with completed video
              const videoDuration = pollResult.metadata?.duration || data.duration || 10;
              
              previewUpdate.video = videoUrl;
              previewUpdate.videoElement = {
                type: 'video',
                url: videoUrl,
                id: `video_${Date.now()}`,
                downloadUrl: videoUrl,
                duration: videoDuration,
                metadata: {
                  duration: videoDuration,
                  model: pollResult.metadata?.model || data.model,
                  ratio: pollResult.metadata?.ratio || data.ratio,
                  videoMode: pollResult.metadata?.video_mode || data.videoMode,
                  api_provider: pollResult.api_provider || data.api_provider
                }
              };
              
              // Update the result object
              Object.assign(result, {
                video_url: videoUrl,
                supabase_url: videoUrl,
                permanent_url: videoUrl,
                duration: videoDuration
              });
              
              console.log('✅ Async video generation completed:', videoUrl);
              
              // Clear file inputs after successful generation
              setFileKey(Date.now().toString());
              
            } else {
              throw new Error('Polling completed but no video URL received');
            }
            
          } catch (pollError) {
            console.error('❌ Video polling failed:', pollError);
            throw new Error(`Video generation failed: ${pollError.message}`);
          }
        }
        // Legacy handling for immediate video URLs (if any)
        else {
          let videoUrl = data.supabase_url || data.permanent_url || data.video_url || data.url;
          
          // Get duration from response data
          const videoDuration = data.duration || content.duration || 10;
          
          // TEMPORARY FIX: If we get a CloudFront URL, convert it to Supabase URL
          if (videoUrl && videoUrl.includes('cloudfront.net')) {
            console.log('⚠️ Got CloudFront URL, attempting to construct Supabase URL...');
            
            // Extract the task ID from the response or URL
            const taskId = data.task_id || videoUrl.match(/([a-f0-9-]{36})/)?.[1];
            
            if (taskId) {
              // Construct the Supabase URL based on your pattern from the logs
              const supabaseUrl = `https://afyuizwemllouyulpkir.supabase.co/storage/v1/object/public/videos/videos/${user.id}/${taskId}.mp4`;
              
              console.log('🔧 Converted CloudFront URL to Supabase URL:', {
                original: videoUrl,
                converted: supabaseUrl,
                taskId: taskId,
                userId: user.id
              });
              
              videoUrl = supabaseUrl;
            }
          }

          // FIXED: Clean up video URL for mobile compatibility
          if (videoUrl) {
            // Remove trailing ? or & that cause mobile issues
            videoUrl = videoUrl.replace(/[?&]$/, '');
            
            // Additional mobile-specific cleaning
            const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
            if (isMobile) {
              console.log('📱 Mobile device detected - cleaning video URL for compatibility');
              
              try {
                const urlObj = new URL(videoUrl);
                // Reconstruct clean URL without problematic query parameters
                videoUrl = `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}`;
                console.log('📱 Cleaned video URL for mobile:', videoUrl);
              } catch (urlError) {
                console.error('📱 URL cleaning failed, using original:', urlError);
              }
            }
            
            console.log('🧹 Final cleaned video URL:', videoUrl);
          }
          
          console.log('Video response data:', {
            supabase_url: data.supabase_url,
            video_url: data.video_url,
            permanent_url: data.permanent_url,
            task_id: data.task_id,
            job_id: data.job_id,
            duration: videoDuration,
            finalUrl: videoUrl,
            isCloudFront: videoUrl?.includes('cloudfront.net'),
            isSupabase: videoUrl?.includes('supabase.co')
          });

          if (data.task_id && !videoUrl) {
            try {
              console.log(`Polling for video result with task ID: ${data.task_id}`);
              const pollResult = await pollVideoStatus(data.task_id, session.access_token);
              
              // FIXED: Prefer permanent URLs from polling result
              videoUrl = pollResult.supabase_url || pollResult.permanent_url || pollResult.video_url || pollResult.url;
              
              // Apply the same CloudFront to Supabase conversion for polling results
              if (videoUrl && videoUrl.includes('cloudfront.net')) {
                const taskId = data.task_id;
                videoUrl = `https://afyuizwemllouyulpkir.supabase.co/storage/v1/object/public/videos/videos/${user.id}/${taskId}.mp4`;
                console.log('🔧 Converted polling CloudFront URL to Supabase URL:', videoUrl);
              }

              // FIXED: Clean polling URLs too
              if (videoUrl) {
                videoUrl = videoUrl.replace(/[?&]$/, '');
                console.log('🧹 Cleaned polling video URL:', videoUrl);
              }
              
              console.log('Polling result URLs:', {
                supabase_url: pollResult.supabase_url,
                video_url: pollResult.video_url,
                permanent_url: pollResult.permanent_url,
                finalUrl: videoUrl
              });
              
            } catch (pollError) {
              console.error('Video polling failed:', pollError);
              throw new Error(`Video generation processing error: ${pollError.message}`);
            }
          }

          if (!videoUrl) {
            console.error('Video generation completed but no URL received', data);
            throw new Error("No video URL received from server");
          }

          // FIXED: Better URL validation
          try {
            const urlObj = new URL(videoUrl);
            console.log('Using video URL:', videoUrl);
            
            // Check if it's a Supabase URL (preferred) or other valid URL
            if (videoUrl.includes('supabase.co')) {
              console.log('✅ Using permanent Supabase URL - should work on mobile');
            } else if (videoUrl.includes('cloudfront.net')) {
              console.log('⚠️ Using temporary CloudFront URL - may not work on mobile');
            } else {
              console.log('ℹ️ Using other video URL:', urlObj.hostname);
            }
            
          } catch (urlError) {
            console.error('Invalid video URL received:', videoUrl);
            throw new Error('Server returned invalid video URL');
          }

          // FIXED: Add error handling for video loading WITH DURATION
          previewUpdate.video = videoUrl;
          previewUpdate.videoElement = {
            type: 'video',
            url: videoUrl,
            id: `video_${Date.now()}`,
            downloadUrl: videoUrl,
            duration: videoDuration,
            metadata: {
              duration: videoDuration,
              model: data.model || content.model,
              ratio: data.ratio || content.ratio,
              videoMode: data.video_mode || content.videoMode,
              api_provider: data.api_provider
            }
          };
            
          // FIXED: Clear file inputs after successful generation
          setFileKey(Date.now().toString());
        }
      }
      else if (type === 'image') {
        if (!contentType.includes('application/json')) {
          const errorText = await response.text();
          console.error('Image Error: Expected JSON, received:', contentType, errorText);
          throw new Error('Server returned invalid response format');
        }
        
        const data = await response.json();
        Object.assign(result, data);
        
        // Handle different response formats based on endpoint
        if (expectedResponseFormat === 'branded-ad') {
          // NEW: Validation for the branded ad endpoint
          console.log("🔍 Branded ad response received:", data);
          
          if (!data.success) {
            console.log("❌ Backend reported failure:", data.error || 'Unknown error');
            throw new Error(data.error || "Generation failed");
          }
          
          if (!data.imageUrl) {
            console.log("❌ Missing imageUrl in successful response:", Object.keys(data));
            throw new Error("Missing image URL in response");
          }
          
          console.log("✅ Branded ad generation successful");
          
          previewUpdate.image = data.imageUrl;
          previewUpdate.sourceImage = URL.createObjectURL(content.image);
          previewUpdate.metadata = data.metadata || {};
          
        } else {
          // OLD: Original validation for other endpoints
          // Check if we got an immediate image URL (synchronous response)
          if (data.image_url) {
            try {
              new URL(data.image_url);
            } catch (urlError) {
              console.error('Invalid image URL received:', data.image_url);
              throw new Error('Server returned invalid image URL');
            }
            
            previewUpdate.image = data.image_url;
            previewUpdate.sourceImage = URL.createObjectURL(content.image);
            previewUpdate.metadata = data.metadata || {};
          } 
          // If we got a generation_id, poll for the result
          else if (data.generation_id) {
            console.log(`Image generation started with ID: ${data.generation_id}. Starting polling...`);
            
            try {
              const pollResult = await pollSDXLResult(data.generation_id, session.access_token);
              
              if (!pollResult.image_url) {
                console.error('Polling completed but no image URL received:', pollResult);
                throw new Error('No image URL received after polling');
              }
              
              try {
                new URL(pollResult.image_url);
              } catch (urlError) {
                console.error('Invalid image URL received from polling:', pollResult.image_url);
                throw new Error('Server returned invalid image URL');
              }
              
              previewUpdate.image = pollResult.image_url;
              previewUpdate.sourceImage = URL.createObjectURL(content.image);
              previewUpdate.metadata = pollResult.metadata || {};
              
              // Update result with polling data
              Object.assign(result, pollResult);
              
            } catch (pollError) {
              console.error('Image polling failed:', pollError);
              throw new Error(`Image generation processing error: ${pollError.message}`);
            }
          } else {
            console.error('Image response missing required data:', data);
            throw new Error('Missing image URL or generation ID in response');
          }
        }
      }
      else {
        debug.stage = 'process-text-response';
        try {
          console.log('Processing text generation response');
          
          let data;
          try {
            data = await response.json();
          } catch (jsonParseError) {
            console.error('JSON parse error:', jsonParseError);
            console.error('Raw response:', await response.text());
            throw new Error('Invalid JSON response from server');
          }
          
          console.log('Text generation response data:', {
            hasGeneratedText: !!data.generated_text,
            textLength: data.generated_text ? data.generated_text.length : 0,
            usageInfo: data.usage || 'none'
          });
          
          Object.assign(result, data);
          previewUpdate.text = data.generated_text || data.text;
          if (data.tokens_used) {
            previewUpdate.tokens_used = data.tokens_used;
          }
          
          debug.responseDetails.textLength = previewUpdate.text ? previewUpdate.text.length : 0;
          debug.responseDetails.hasUsageInfo = !!data.usage;
        } catch (jsonError) {
          console.error('Error parsing JSON response:', jsonError);
          debug.errors.push({ 
            stage: 'json-parse', 
            error: jsonError.message,
            stack: jsonError.stack
          });
          throw new Error('Failed to parse response data');
        }
      }

      setPreviews(prev => ({ ...prev, ...previewUpdate }));
      setUsage(prev => prev + 1);
      
      debug.stage = 'complete';
      debug.success = true;

      return {
        success: true,
        data: result,
        preview: previewUpdate,
        contentType: type
      };
    } catch (fetchError) {
      debug.stage = 'fetch-error';
      debug.errors.push({ 
        stage: 'fetch-error', 
        error: fetchError.message,
        name: fetchError.name,
        stack: fetchError.stack
      });
      
      if (fetchError.name === 'AbortError') {
        console.error(`${type} generation request timed out after 120 seconds`);
        throw new Error(`${type.charAt(0).toUpperCase() + type.slice(1)} generation timed out`);
      }
      
      if (fetchError.message.includes('CORS') || 
          fetchError.message.includes('cross-origin') || 
          fetchError.message.includes('Access-Control')) {
        console.error('CORS error detected:', fetchError);
        throw new Error('Cross-origin request blocked. This is likely a server configuration issue.');
      }
      
      throw fetchError;
    }
  } catch (err) {
    debug.stage = 'global-error-handler';
    debug.errors.push({ 
      stage: 'global-error-handler', 
      error: err.message,
      stack: err.stack,
      time: new Date().toISOString()
    });
    
    console.error('Generation Error:', err);
    console.error('Complete debug information:', debug);
    
    const errorMessages = {
      "session": "Please login again",
      "limit_reached": `You've reached your ${userPlan} plan limit`,
      "Invalid ElevenLabs API credentials": "Server configuration issue",
      "401": "Authentication failed",
      "404": "Endpoint not found",
      "422": "Invalid input data",
      "500": "Server error"
    };

    let userMessage = errorMessages[err.message] || err.message || "Generation failed - please try again";
    
    if (err.stack) {
      console.error("Stack trace:", err.stack);
    }
    
    switch (content?.type) {
      case 'image':
        toast.error(`Image generation failed: ${userMessage}`);
        break;
      case 'video':
        const duration = content.duration || 10;
        const modelType = content.model === 'veo2' ? 'Premium' : 'Standard';
        toast.error(`${duration}s ${modelType} video generation failed: ${userMessage}`);
        break; 
      case 'tts':
        toast.error(`Voice generation failed: ${userMessage}`);
        break;
      default:
        toast.error(userMessage);
    }
    
    setError(userMessage);
    return { 
      success: false, 
      error: userMessage,
      status: err.message.includes("status") ? 
            parseInt(err.message.split("status ")[1]) : 500,
      originalError: err.message,
      debug: {
        time: new Date().toISOString(),
        stage: debug.stage,
        endpoint: debug.requestDetails.endpoint,
        errors: debug.errors
      }
    };
  } finally {
    const endTime = new Date().toISOString();
    console.log(`Generation attempt completed at ${endTime} for type: ${content?.type || 'text'}`);
  }
};
  // Rest of your component code remains the same
    

  
  
  const FullscreenPreview = ({ type, content, onClose, videoDetails }) => {
  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex flex-col items-center justify-center p-4">
      <div className="relative w-full h-full flex items-center justify-center">
        {type === 'image' && (
          <img 
            src={content} 
            className="max-w-full max-h-full object-contain"
            alt="Fullscreen preview" 
          />
        )}
        {type === 'video' && (
          <div className="flex flex-col items-center">
            <video
              controls
              autoPlay
              className="max-w-full max-h-[80vh]"
              poster={videoDetails?.thumbnail} // Optional: Add thumbnail if available
            >
              <source src={content} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
            <div className="mt-4 flex gap-4">
              <a
                href={content}
                download={videoDetails?.filename || `merged_video_${Date.now()}.mp4`}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2"
              >
                <FiDownload /> Download Video
              </a>
              {videoDetails?.processing_info && (
                <div className="text-white text-sm">
                  Duration: {videoDetails.processing_info.video_duration}s | 
                  Size: {(videoDetails.file_size / (1024 * 1024)).toFixed(2)}MB
                </div>
              )}
            </div>
          </div>
        )}
        <div className="absolute top-4 right-4 flex gap-2">
          <button 
            onClick={onClose}
            className={`p-2 rounded-full ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}`}
            title="Close"
          >
            <FiX /> {/* Changed from FiMaximize to FiX for better close icon */}
          </button>
        </div>
      </div>
    </div>
  );
};
    
    if (loading) {
        return (
            <div className={`flex justify-center items-center min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }
    
    if (error) {
        return (
            <div className={`p-6 ${darkMode ? 'text-red-400' : 'text-red-500'}`}>
                {error} - <button onClick={() => window.location.reload()} className="underline">Retry</button>
            </div>
        );
    }
    
    const planLimits = {
    free: 3,
    trial: 3,
    starter: 25,
    professional: 50,
    business: 100,
    enterprise: Infinity,
    // Legacy plan support
    basic: 25,      // Map to starter
    premium: 50,    // Map to professional
    pro: Infinity   // Map to enterprise
};
    
    const AssetThumbnail = ({ asset }) => {
        const isImage = asset.type === 'image';
        const isVideo = asset.type === 'video';
        
        return (
            <div className="group relative rounded-lg overflow-hidden border border-gray-700">
                {isImage && (
                    <img 
                        src={asset.content} 
                        className="w-full h-32 object-cover"
                        alt="Generated content"
                    />
                )}
                {isVideo && (
                    <video className="w-full h-32 object-cover">
                        <source src={asset.content} type="video/mp4" />
                    </video>
                )}
                {!isImage && !isVideo && (
                    <div className="w-full h-32 flex items-center justify-center bg-gray-800">
                        <FiFileText className="w-8 h-8 text-gray-600" />
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                    <span className="text-xs truncate w-full text-gray-300">
                        {new Date(asset.createdAt).toLocaleDateString()}
                    </span>
                </div>
            </div>
        );
    };
    
// Demo Video Component Import (add this to your imports at the top)


// Add this state with your other useState declarations
// Demo Video Component Import (add this to your imports at the top)

// ADD THIS IMPORT at the top of your UserDashboard.jsx file (with other imports):


const DashboardSidebar = ({ userPlan, activeTab, setActiveTab, usage, planLimits, sidebarOpen, setSidebarOpen }) => {
  const navigate = useNavigate();

  const navSections = [
    {
      title: "CREATIVE SUITE",
      items: [
        { id: 'generators', label: 'Campaign Studio', icon: <FiLayers size={18} />, description: 'Generate professional assets' },
        { 
          id: 'creative-studio', 
          label: 'Creative Studio', 
          icon: <RiMagicLine size={18} />, 
          description: 'AI background & try-on tools'
        },
        { id: 'editor', label: 'Image Editor', icon: <FiEdit size={18} />, description: 'Advanced editing tools', premium: true },
        { id: 'ffmpeg', label: 'Media Production', icon: <FiVideo size={18} />, description: 'Video & audio processing', premium: true },
      ]
    },
    {
      title: "ASSET MANAGEMENT", 
      items: [
        { id: 'library', label: 'Media Library', icon: <FiFolder size={18} />, description: 'Organize your assets' },
        { id: 'analytics', label: 'Performance', icon: <FiBarChart2 size={18} />, description: 'Campaign insights', premium: true },
      ]
    }
  ];

  return (
    <>
      {/* Sidebar */}
      <div className={`w-72 flex flex-col h-full fixed lg:relative z-40 transition-all duration-300 ${
        sidebarOpen ? 'left-0' : '-left-72 lg:left-0'
      } bg-[#0f1419] border-r border-slate-800/50 top-0 overflow-y-auto overscroll-contain`}>
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800/50">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center">
              <span className="text-white font-bold">CF</span>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">CF Studio</h2>
              <p className="text-slate-400 text-sm">Creative AI Platform</p>
            </div>
          </div>
          
          {/* Plan Badge */}
          <div className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium ${
            userPlan === 'enterprise' 
              ? 'bg-gradient-to-r from-indigo-500/20 to-purple-600/20 text-indigo-300 border border-indigo-500/30' 
              : userPlan === 'premium'
              ? 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-300 border border-blue-500/30'
              : 'bg-slate-800/50 text-slate-300 border border-slate-700/50'
          }`}>
            <div className="w-2 h-2 rounded-full bg-current mr-2"></div>
            {userPlan.charAt(0).toUpperCase() + userPlan.slice(1)} Plan
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-6 overflow-y-auto min-h-0">
          {navSections.map((section) => (
            <div key={section.title}>
              <h3 className="text-xs font-semibold uppercase mb-3 tracking-wider text-slate-500">
                {section.title}
              </h3>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const isActive = activeTab === item.id;
                  const isAvailable = !item.premium || ['premium', 'enterprise'].includes(userPlan);
                  
                  return (
                    <div
                      key={item.id}
                      className={`${item.indent ? 'ml-4' : ''}`}
                    >
                      <button
                        onClick={() => {
                          if (item.id === 'profile') {
                            navigate('/profile');
                          } else if (item.id === 'settings') {
                            navigate('/settings');
                          } else {
                            setActiveTab(item.id);
                          }
                          setSidebarOpen(false);
                        }}
                        disabled={!isAvailable}
                        className={`w-full group relative overflow-hidden rounded-lg p-3 transition-all duration-200 ${
                          isActive 
                            ? 'bg-gradient-to-r from-indigo-500/20 to-purple-600/20 border border-indigo-500/30' 
                            : isAvailable
                            ? 'hover:bg-slate-800/50 border border-transparent hover:border-slate-700/50'
                            : 'opacity-50 cursor-not-allowed border border-transparent'
                        }`}
                      >
                        <div className="relative flex items-center space-x-3">
                          <div className={`flex-shrink-0 transition-colors ${
                            isActive ? 'text-indigo-300' : 'text-slate-400 group-hover:text-slate-300'
                          }`}>
                            {item.icon}
                          </div>
                          <div className="flex-1 text-left">
                            <div className="flex items-center justify-between">
                              <h4 className={`font-medium ${
                                isActive ? 'text-white' : 'text-slate-200 group-hover:text-white'
                              }`}>
                                {item.label}
                              </h4>
                              {item.premium && !['premium', 'enterprise'].includes(userPlan) && (
                                <div className="text-xs px-2 py-0.5 bg-slate-700/50 text-slate-400 rounded">
                                  Pro
                                </div>
                              )}
                            </div>
                            <p className={`text-xs mt-0.5 ${
                              isActive ? 'text-indigo-200' : 'text-slate-500 group-hover:text-slate-400'
                            }`}>
                              {item.description}
                            </p>
                          </div>
                        </div>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
 {/* Usage Display */}
        <div className="p-4 border-t border-slate-800/50">
          <div className="relative overflow-hidden rounded-lg bg-slate-800/30 p-4 border border-slate-700/30">
            <div className="relative">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center">
                  <FiZap className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h4 className="font-medium text-white text-sm">Generation Credits</h4>
                  <p className="text-slate-400 text-xs">
                    {userPlan === 'enterprise' ? 'Unlimited access' : 'Monthly allocation'}
                  </p>
                </div>
              </div>

              {userPlan === 'enterprise' ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-indigo-300 font-medium text-sm">Unlimited</span>
                    <span className="text-slate-300 text-xs">{usage} created</span>
                  </div>
                  <div className="w-full h-2 bg-slate-700/50 rounded-full overflow-hidden">
                    <div className="w-full h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full"></div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-white font-medium text-sm">{usage}/{planLimits[userPlan]}</span>
                    <span className="text-slate-300 text-xs">{planLimits[userPlan] - usage} remaining</span>
                  </div>
                  <div className="w-full h-2 bg-slate-700/50 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all duration-1000"
                      style={{ width: `${Math.min(100, (usage / planLimits[userPlan]) * 100)}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Upgrade Button for trial/free users */}
        {['trial', 'free', 'trial_expired'].includes(userPlan?.toLowerCase()) && (
          <div className="p-4 border-t border-slate-800/50">
            <UpgradeButton userPlan={userPlan} userEmail={userEmail || ''} />
          </div>
        )}

        {/* Account Actions */}
        <div className="p-4 border-t border-slate-800/50 space-y-1">
          <button 
            onClick={() => navigate('/settings')}
            className="w-full flex items-center space-x-3 p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/50 transition-colors"
          >
            <Settings size={16} />
            <span className="text-sm">Settings</span>
          </button>
          <button 
            onClick={() => navigate('/profile')}
            className="w-full flex items-center space-x-3 p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/50 transition-colors"
          >
            <User size={16} />
            <span className="text-sm">Profile</span>
          </button>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 p-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
          >
            <LogOut size={16} />
            <span className="text-sm">Sign Out</span>
          </button>
        </div>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </>
  );
};

// Professional Modal Component
const ProfessionalModal = ({ isOpen, onClose, title, subtitle, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative z-10 w-full max-w-4xl mx-4 max-h-[90vh] overflow-auto">
        <div className="bg-[#0f1419] border border-slate-700/50 rounded-2xl shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
            <div>
              <h2 className="text-xl font-bold text-white">{title}</h2>
              <p className="text-slate-400 text-sm mt-1">{subtitle}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 text-slate-400 hover:text-white transition-colors"
            >
              <FiX size={20} />
            </button>
          </div>
          
          {/* Content */}
          <div className="p-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

// Updated Professional Generator Card with PREMIUM LIGHTING EFFECTS
const ProfessionalGeneratorCard = ({ type, remaining, onGenerate, userPlan }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
// Updated typeConfig with clear instructions
const typeConfig = {
  text: {
    title: 'Copy Generation',
    subtitle: 'Professional marketing copy',
    description: 'Generate compelling headlines, product descriptions, and marketing content optimized for conversion.',
    icon: <FiFileText size={20} />,
    gradient: 'from-blue-500 to-cyan-500',
    borderGradient: 'from-blue-500/20 to-cyan-500/20',
    glowColor: 'shadow-blue-500/20',
    capability: 'AI-powered copywriting',
    modalTitle: 'AI Copy Generation',
    modalSubtitle: 'Create professional marketing copy that converts'
  },
  image: {
    title: 'Image Enhancement',
    subtitle: 'Professional product photography',
    description: 'Transform product photos into polished marketing visuals with advanced AI styling and background enhancement.',
    icon: <FiImage size={20} />,
    gradient: 'from-indigo-500 to-purple-600',
    borderGradient: 'from-indigo-500/20 to-purple-600/20',
    glowColor: 'shadow-indigo-500/20',
    capability: 'Product image transformation',
    modalTitle: 'AI Image Enhancement',
    modalSubtitle: 'Transform product photos into professional marketing assets',
    instructions: {
      title: 'How It Works',
      steps: [
        {
          title: 'Upload Your Product Image',
          description: 'Upload a clear photo of your product, storefront, or brand asset. This will be your base image that gets enhanced.'
        },
        {
          title: 'Add Style Reference',
          description: 'Upload a second image that represents the style, mood, or aesthetic you want. This inspiration image guides the AI on lighting, colors, and overall feel. Tag both images with descriptive text to help the AI understand your vision.'
        },
        {
          title: 'Generate & Save',
          description: 'The AI will enhance your product image using the style reference as inspiration. Your enhanced image will automatically save to your Media Library for easy access.'
        }
      ]
    }
  },
  video: {
    title: 'Video Production',
    subtitle: 'Dynamic commercial content',
    description: 'Create engaging video advertisements from static images with professional motion and transitions.',
    icon: <FiVideo size={20} />,
    gradient: 'from-emerald-500 to-teal-600',
    borderGradient: 'from-emerald-500/20 to-teal-600/20',
    glowColor: 'shadow-emerald-500/20',
    capability: 'Video generation & editing',
    modalTitle: 'AI Video Production',
    modalSubtitle: 'Create dynamic commercials from product images',
    instructions: {
      title: 'How It Works',
      description: 'Create engaging video content from your images with two quality options.',
      options: [
        {
          type: 'Standard (Keyframes)',
          features: [
            'Upload two images to create smooth transitions between scenes',
            'Perfect for before/after reveals, product showcases, or storytelling',
            'AI creates fluid motion between your two images',
            'Fast processing, reliable results'
          ]
        },
        {
          type: 'Premium (High Quality)',
          features: [
            'Upload a single base image and transform it into dynamic video',
            'Superior quality with enhanced details and smoother motion',
            'Faster processing time',
            'Ideal for hero videos and premium marketing content'
          ]
        }
      ],
      finalStep: 'Your video will automatically save to your Media Library once processing is complete.'
    }
  },
  tts: {
    title: 'Voice Synthesis',
    subtitle: 'Professional narration',
    description: 'Generate high-quality voiceovers and narration using advanced AI voice synthesis technology.',
    icon: <FiMic size={20} />,
    gradient: 'from-orange-500 to-red-500',
    borderGradient: 'from-orange-500/20 to-red-500/20',
    glowColor: 'shadow-orange-500/20',
    capability: 'AI voice generation',
    modalTitle: 'AI Voice Synthesis',
    modalSubtitle: 'Generate professional narration and voiceovers'
  }
}

  const config = typeConfig[type];

  const handleLaunch = () => {
    if (remaining <= 0 && userPlan !== 'enterprise') {
      return;
    }
    setIsModalOpen(true);
  };

  const handleGenerate = async (content) => {
    const result = await onGenerate(content);
    if (result?.success) {
      setIsModalOpen(false);
    }
    return result;
  };

  return (
    <>
      <div className="group relative">
        {/* Premium Lighting Effects - Outer Glow */}
        <div className={`absolute -inset-0.5 bg-gradient-to-r ${config.gradient} rounded-2xl blur opacity-20 group-hover:opacity-40 transition-all duration-500`}></div>
        
        {/* Main Card with Enhanced Shadows */}
        <div className={`relative overflow-hidden rounded-2xl bg-slate-900/50 backdrop-blur border border-slate-800/50 hover:border-slate-700/50 transition-all duration-500 hover:transform hover:scale-[1.02] shadow-xl ${config.glowColor} hover:shadow-2xl group-hover:${config.glowColor.replace('/20', '/30')}`}>
          
          {/* Subtle Inner Glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] via-transparent to-transparent pointer-events-none"></div>
          
          {/* Header with Enhanced Styling */}
          <div className="p-6 border-b border-slate-800/50 relative">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${config.gradient} flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 group-hover:scale-110`}>
                  <div className="text-white">{config.icon}</div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:bg-clip-text group-hover:from-white group-hover:to-slate-200 transition-all duration-300">{config.title}</h3>
                  <p className="text-slate-400 text-sm">{config.subtitle}</p>
                </div>
              </div>
              
              {/* Credits Display with Glow */}
              <div className="text-right">
                <div className={`inline-flex items-center px-3 py-1.5 rounded-lg bg-gradient-to-r ${config.borderGradient} border border-slate-600/30 shadow-lg hover:shadow-xl transition-all duration-300`}>
                  <span className="text-white font-medium text-sm">
                    {userPlan === 'enterprise' ? '∞' : remaining}
                  </span>
                  <span className="text-slate-400 ml-1 text-xs">
                    {userPlan === 'enterprise' ? '' : 'credits'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Content with Enhanced Spacing */}
          <div className="p-6 relative">
            {/* Description */}
            <p className="text-slate-300 leading-relaxed mb-6">{config.description}</p>

            {/* Capability Badge with Premium Styling */}
            <div className="mb-6">
              <div className={`inline-flex items-center px-3 py-1.5 rounded-full bg-gradient-to-r ${config.borderGradient} border border-slate-600/30 shadow-md hover:shadow-lg transition-all duration-300`}>
                <div className="w-2 h-2 rounded-full bg-current mr-2 animate-pulse"></div>
                <span className="text-slate-300 text-xs font-medium">{config.capability}</span>
              </div>
            </div>

            {/* Premium Launch Button with Enhanced Effects */}
            <button
              onClick={handleLaunch}
              disabled={remaining <= 0 && userPlan !== 'enterprise'}
              className={`w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-500 flex items-center justify-center space-x-3 relative overflow-hidden ${
                remaining <= 0 && userPlan !== 'enterprise'
                  ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                  : `bg-gradient-to-r ${config.gradient} hover:shadow-2xl ${config.glowColor} hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] hover:-translate-y-0.5`
              }`}
            >
              {/* Button Shine Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
              
              <div className="text-white relative z-10">{config.icon}</div>
              <span className="relative z-10">
                {remaining <= 0 && userPlan !== 'enterprise' 
                  ? 'No Credits Remaining' 
                  : `Launch ${config.title}`
                }
              </span>
            </button>
          </div>
          
          {/* Subtle Border Highlight */}
          <div className={`absolute inset-0 rounded-2xl bg-gradient-to-r ${config.gradient} opacity-0 group-hover:opacity-10 transition-all duration-500 pointer-events-none`}></div>
        </div>
      </div>

      {/* Professional Modal */}
      <ProfessionalModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={config.modalTitle}
        subtitle={config.modalSubtitle}
      >
        <EnterpriseContentGenerator
          type={type}
          remaining={remaining}
          onGenerate={handleGenerate}
          isModal={true}
        />
      </ProfessionalModal>
    </>
  );
};

return (
  <div className="flex flex-col min-h-screen bg-[#0a0e13]">
    {/* Demo Video Modal */}
    <DemoVideo 
      isOpen={showDemoVideo}
      onClose={() => setShowDemoVideo(false)}
      title="CF Studio Tutorial"
      description="Complete walkthrough of our AI marketing tools and features"
    />
    
    {/* Fullscreen Preview Modal */}
    {fullscreenPreview && (
      <FullscreenPreview 
        type={fullscreenPreview.type} 
        content={fullscreenPreview.content} 
        onClose={() => setFullscreenPreview(null)} 
      />
    )}

    {/* Professional Header - REMOVED DUPLICATE LOGO */}
    <header className="border-b px-6 py-4 flex justify-between items-center sticky top-0 z-10 bg-[#0f1419]/90 backdrop-blur-xl border-slate-800/50">
      <div className="flex items-center space-x-4">
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="lg:hidden p-2.5 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50 text-white transition-all duration-200"
          style={{ minHeight: '44px', minWidth: '44px' }}
        >
          {sidebarOpen ? <FiX className="w-5 h-5" /> : <FiMenu className="w-5 h-5" />}
        </button>
        
        {/* Removed duplicate CF Studio logo/branding from header since it's already in sidebar */}
      </div>
      
      <div className="flex items-center space-x-4">
        {/* Plan Status */}
        <div className={`hidden sm:flex items-center px-3 py-1.5 rounded-lg text-sm font-medium ${
          userPlan === 'enterprise' 
            ? 'bg-gradient-to-r from-indigo-500/20 to-purple-600/20 text-indigo-300 border border-indigo-500/30'
            : userPlan === 'premium'
            ? 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-300 border border-blue-500/30'
            : 'bg-slate-800/50 text-slate-300 border border-slate-700/50'
        }`}>
          <div className="w-2 h-2 rounded-full bg-current mr-2"></div>
          {userPlan.charAt(0).toUpperCase() + userPlan.slice(1)}
        </div>

        {/* User Menu */}
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => navigate('/profile')}
            className="p-2 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 hover:text-white transition-colors"
            title="Profile"
          >
            <User size={16} />
          </button>
          
          <button 
            onClick={handleLogout}
            className="flex items-center px-3 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors border border-red-500/20"
          >
            <LogOut size={14} className="mr-1.5" />
            <span className="hidden sm:inline text-sm">Sign Out</span>
          </button>
        </div>
      </div>
    </header>

    <div className="flex flex-1">
      {/* Sidebar */}
      <DashboardSidebar 
        userPlan={userPlan} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        usage={usage}
        planLimits={planLimits}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />
    
      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-gradient-to-br from-[#0a0e13] via-[#0f1419] to-[#0a0e13]">
        {/* Campaign Studio */}
        {activeTab === 'generators' && (
          <div className="px-6 py-8">
            <div className="max-w-7xl mx-auto">
              {/* Professional Header */}
              <div className="mb-12">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent mb-2">
                      Campaign Studio
                    </h1>
                    <p className="text-lg text-slate-400 max-w-2xl">
                      Professional AI-powered tools for creating high-impact marketing campaigns
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="px-4 py-2 bg-slate-800/50 backdrop-blur rounded-lg border border-slate-700/50">
                      <span className="text-slate-300 text-sm font-medium">
                        {userPlan === 'enterprise' ? 'Unlimited Access' : `${planLimits[userPlan] - usage} credits remaining`}
                      </span>
                    </div>
                    <button 
                      onClick={() => setShowDemoVideo(true)}
                      className="flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium"
                    >
                      <FiPlay size={16} className="mr-2" />
                      View Demo
                    </button>
                  </div>
                </div>

                {/* Professional Stats with Premium Lighting */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl blur opacity-20 group-hover:opacity-30 transition-all duration-300"></div>
                    <div className="relative bg-slate-900/50 backdrop-blur border border-slate-800/50 rounded-xl p-6 hover:border-slate-700/50 transition-all duration-300 shadow-lg hover:shadow-blue-500/10">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg">
                          <FiZap className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-white">98%</div>
                          <div className="text-slate-400 text-sm">Cost Reduction</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl blur opacity-20 group-hover:opacity-30 transition-all duration-300"></div>
                    <div className="relative bg-slate-900/50 backdrop-blur border border-slate-800/50 rounded-xl p-6 hover:border-slate-700/50 transition-all duration-300 shadow-lg hover:shadow-emerald-500/10">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
                          <FiClock className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-white">10x</div>
                          <div className="text-slate-400 text-sm">Faster Creation</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl blur opacity-20 group-hover:opacity-30 transition-all duration-300"></div>
                    <div className="relative bg-slate-900/50 backdrop-blur border border-slate-800/50 rounded-xl p-6 hover:border-slate-700/50 transition-all duration-300 shadow-lg hover:shadow-indigo-500/10">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                          <FiTrendingUp className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-white">$5000+</div>
                          <div className="text-slate-400 text-sm">Campaign Value</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Professional Generator Grid with Premium Effects */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <ProfessionalGeneratorCard 
                  type="image" 
                  remaining={planLimits[userPlan] - usage} 
                  onGenerate={handleGeneration}
                  userPlan={userPlan}
                />
                <ProfessionalGeneratorCard 
                  type="video" 
                  remaining={planLimits[userPlan] - usage} 
                  onGenerate={handleGeneration}
                  userPlan={userPlan}
                />
                <ProfessionalGeneratorCard 
                  type="tts" 
                  remaining={planLimits[userPlan] - usage} 
                  onGenerate={handleGeneration}
                  userPlan={userPlan}
                />
                <ProfessionalGeneratorCard 
                  type="text" 
                  remaining={planLimits[userPlan] - usage} 
                  onGenerate={handleGeneration}
                  userPlan={userPlan}
                />
              </div>
            </div>
          </div>
        )}

        {/* Creative Studio - NEW SECTION */}
        {activeTab === 'creative-studio' && (
          <div className="px-6 py-8">
            <GenerateBackground 
              userPlan={userPlan}
              usage={usage}
              onUsageUpdate={() => {
                // Refresh usage data after generation
                window.location.reload();
              }}
            />
          </div>
        )}

        {/* Image Editor */}
        {activeTab === 'editor' && (
          <div className="px-6 py-8">
            <div className="max-w-7xl mx-auto">
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl blur opacity-15 group-hover:opacity-25 transition-all duration-500"></div>
                <div className="relative rounded-2xl bg-slate-900/50 backdrop-blur border border-slate-800/50 overflow-hidden shadow-xl hover:shadow-blue-500/10 transition-all duration-500">
                  <div className="p-8">
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <h2 className="text-2xl font-bold text-white mb-2">Advanced Image Editor</h2>
                        <p className="text-slate-400">Professional image editing and transformation tools</p>
                      </div>
                      <div className="px-4 py-2 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-300 rounded-lg border border-blue-500/30 shadow-lg">
                        Professional Tools
                      </div>
                    </div>
                    <CloudinaryEditor 
                      darkMode={true}
                      userPlan={userPlan}
                      onImageEdit={(editedImage) => {
                        console.log('Image edited:', editedImage);
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Media Production */}
        {activeTab === 'ffmpeg' && (
          <div className="px-6 py-8">
            <div className="max-w-7xl mx-auto">
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl blur opacity-15 group-hover:opacity-25 transition-all duration-500"></div>
                <div className="relative rounded-2xl bg-slate-900/50 backdrop-blur border border-slate-800/50 overflow-hidden shadow-xl hover:shadow-emerald-500/10 transition-all duration-500">
                  <div className="p-8">
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <h2 className="text-2xl font-bold text-white mb-2">Media Production Suite</h2>
                        <p className="text-slate-400">Professional video editing and audio processing</p>
                      </div>
                      <div className="px-4 py-2 bg-gradient-to-r from-emerald-500/20 to-teal-600/20 text-emerald-300 rounded-lg border border-emerald-500/30 shadow-lg">
                        Server Processing
                      </div>
                    </div>
                    <BackendFFmpeg darkMode={true} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Performance Analytics */}
        {activeTab === 'analytics' && (
          <div className="px-6 py-8">
            <div className="max-w-7xl mx-auto">
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl blur opacity-15 group-hover:opacity-25 transition-all duration-500"></div>
                <div className="relative rounded-2xl bg-slate-900/50 backdrop-blur border border-slate-800/50 overflow-hidden shadow-xl hover:shadow-indigo-500/10 transition-all duration-500">
                  <div className="p-16 text-center">
                    <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-6 bg-slate-800/50 shadow-lg">
                      <FiBarChart2 className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="text-xl font-bold mb-4 text-white">
                      Performance Analytics
                    </h3>
                    <p className="text-slate-400 mb-8 max-w-md mx-auto">
                      Advanced campaign performance tracking and ROI analytics coming soon
                    </p>
                    <div className="flex items-center justify-center gap-3">
                      <span className="px-4 py-2 bg-gradient-to-r from-indigo-500/20 to-purple-600/20 text-indigo-300 text-sm font-medium rounded-lg border border-indigo-500/30 shadow-lg">
                        Enterprise Feature
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Media Library */}
        {activeTab === 'library' && (
          <div className="px-6 py-8">
            <div className="max-w-7xl mx-auto">
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-slate-600 to-slate-500 rounded-2xl blur opacity-10 group-hover:opacity-20 transition-all duration-500"></div>
                <div className="relative rounded-2xl bg-slate-900/50 backdrop-blur border border-slate-800/50 overflow-hidden shadow-xl hover:shadow-slate-500/5 transition-all duration-500">
                  <div className="p-8">
                    {/* Header */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 space-y-4 lg:space-y-0">
                      <div>
                        <h2 className="text-2xl font-bold text-white mb-2">Media Library</h2>
                        <p className="text-slate-400">Organize and manage your creative assets</p>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center bg-slate-800/50 rounded-lg p-1 border border-slate-700/50">
                          <select className="bg-transparent text-white px-4 py-2 outline-none rounded-lg">
                            <option>All Assets</option>
                            <option>Images</option>
                            <option>Videos</option>
                            <option>Audio</option>
                            <option>Documents</option>
                          </select>
                        </div>
                        
                        <button 
                          onClick={() => {
                            const fileInput = document.createElement('input');
                            fileInput.type = 'file';
                            fileInput.multiple = true;
                            fileInput.accept = 'image/*,video/*,audio/*';
                            fileInput.onchange = (e) => {
                              if (e.target.files && e.target.files.length > 0) {
                                toast.success(`${e.target.files.length} file(s) uploaded successfully`);
                              }
                            };
                            fileInput.click();
                          }}
                          className="flex items-center px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg hover:shadow-indigo-500/25 transition-all duration-300 transform hover:scale-105"
                        >
                          <Upload size={16} className="mr-2" />
                          Import Assets
                        </button>
                      </div>
                    </div>
                    
                    {/* Content Grid with Premium Effects */}
                    <div className="space-y-8">
                      {/* Text Content */}
                      {previews.text && (
                        <div className="group relative overflow-hidden rounded-xl bg-slate-800/30 border border-slate-700/50 p-6 hover:border-slate-600/50 transition-all duration-300 shadow-lg hover:shadow-xl">
                          <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-xl blur opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
                          <div className="relative">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center space-x-4">
                                <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg">
                                  <FiFileText className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                  <h3 className="text-lg font-semibold text-white">Generated Copy</h3>
                                  <p className="text-slate-400 text-sm">Created {new Date().toLocaleDateString()}</p>
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                <button 
                                  onClick={() => {
                                    const blob = new Blob([previews.text], { type: 'text/plain' });
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = `content_${Date.now()}.txt`;
                                    document.body.appendChild(a);
                                    a.click();
                                    URL.revokeObjectURL(url);
                                    document.body.removeChild(a);
                                    toast.success('Content downloaded');
                                  }}
                                  className="p-2.5 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 text-white transition-colors shadow-md hover:shadow-lg"
                                >
                                  <FiDownload size={16} />
                                </button>
                              </div>
                            </div>
                            
                            <div className="prose prose-invert max-w-none">
                              <ReactMarkdown>{previews.text}</ReactMarkdown>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Image Content */}
                      {previews.image && (
                        <div className="group relative overflow-hidden rounded-xl bg-slate-800/30 border border-slate-700/50 hover:border-slate-600/50 transition-all duration-300 shadow-lg hover:shadow-xl">
                          <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500/10 to-purple-600/10 rounded-xl blur opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
                          <div className="relative grid lg:grid-cols-2 gap-8 p-6">
                            {/* Original Image */}
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h3 className="text-lg font-semibold text-white">Source Image</h3>
                                  <p className="text-slate-400 text-sm">Original product photo</p>
                                </div>
                              </div>
                              <div className="relative aspect-square rounded-lg overflow-hidden border border-slate-600/50 shadow-lg">
                                <img 
                                  src={previews.sourceImage} 
                                  className="w-full h-full object-cover" 
                                  alt="Source content" 
                                />
                              </div>
                            </div>

                            {/* Enhanced Image */}
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h3 className="text-lg font-semibold text-white">Enhanced Result</h3>
                                  <p className="text-slate-400 text-sm">AI-enhanced marketing asset</p>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <a
                                    href={previews.image}
                                    download={`enhanced_${Date.now()}.png`}
                                    className="p-2.5 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 text-white transition-colors shadow-md hover:shadow-lg"
                                  >
                                    <FiDownload size={16} />
                                  </a>
                                  <button
                                    onClick={() => setFullscreenPreview({ type: 'image', content: previews.image })}
                                    className="p-2.5 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 text-white transition-colors shadow-md hover:shadow-lg"
                                  >
                                    <FiMaximize size={16} />
                                  </button>
                                </div>
                              </div>
                              <div className="relative aspect-square rounded-lg overflow-hidden border border-slate-600/50 shadow-lg">
                                <img 
                                  src={previews.image} 
                                  className="w-full h-full object-cover" 
                                  alt="Enhanced content" 
                                />
                              </div>
                              {previews.metadata && (
                                <div className="mt-4 p-4 rounded-lg bg-slate-700/30 border border-slate-600/30 shadow-md">
                                  <h4 className="text-white font-medium mb-2 text-sm">Generation Details</h4>
                                  <div className="space-y-1 text-xs text-slate-300">
                                    <p><span className="text-slate-400">Prompt:</span> {previews.metadata.prompt}</p>
                                    <p><span className="text-slate-400">Seed:</span> {previews.metadata.seed || 'Random'}</p>
                                    <p><span className="text-slate-400">Strength:</span> {previews.metadata.image_strength}</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Video Content */}
                      {previews.video && (
                        <div className="group relative overflow-hidden rounded-xl bg-slate-800/30 border border-slate-700/50 p-6 hover:border-slate-600/50 transition-all duration-300 shadow-lg hover:shadow-xl">
                          <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500/10 to-teal-600/10 rounded-xl blur opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
                          <div className="relative">
                            <div className="flex items-start justify-between mb-6">
                              <div className="flex items-center space-x-4">
                                <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
                                  <FiVideo className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                  <h3 className="text-lg font-semibold text-white">Generated Video</h3>
                                  <p className="text-slate-400 text-sm">Professional commercial content</p>
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                <div className="px-3 py-1 bg-gradient-to-r from-emerald-500/20 to-teal-600/20 text-emerald-300 rounded-lg border border-emerald-500/30 text-xs font-medium shadow-md">
                                  Professional Quality
                                </div>
                                <a
                                  href={previews.video}
                                  download={`video_${Date.now()}.mp4`}
                                  className="p-2.5 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 text-white transition-colors shadow-md hover:shadow-lg"
                                >
                                  <FiDownload size={16} />
                                </a>
                                <button
                                  onClick={() => setFullscreenPreview({ type: 'video', content: previews.video })}
                                  className="p-2.5 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 text-white transition-colors shadow-md hover:shadow-lg"
                                >
                                  <FiMaximize size={16} />
                                </button>
                              </div>
                            </div>
                            
                            <div className="rounded-lg overflow-hidden border border-slate-600/50 shadow-lg">
                              <video
                                controls
                                className="w-full rounded-lg"
                                playsInline
                                webkit-playsinline="true"
                                muted
                                preload="metadata"
                              >
                                <source src={previews.video} type="video/mp4" />
                                Your browser does not support the video tag.
                              </video>
                            </div>
                            
                            <div className="mt-4 text-center">
                              <p className="text-xs text-slate-400 mb-2">
                                Alternative access options:
                              </p>
                              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                                <a
                                  href={previews.video}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-indigo-400 hover:text-indigo-300 text-sm underline"
                                >
                                  Open in new tab
                                </a>
                                <a
                                  href={previews.video}
                                  download={`video_${Date.now()}.mp4`}
                                  className="text-emerald-400 hover:text-emerald-300 text-sm underline"
                                >
                                  Direct download
                                </a>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Audio Content */}
                      {previews.audio && (
                        <div className="group relative overflow-hidden rounded-xl bg-slate-800/30 border border-slate-700/50 p-6 hover:border-slate-600/50 transition-all duration-300 shadow-lg hover:shadow-xl">
                          <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-500/10 to-red-500/10 rounded-xl blur opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
                          <div className="relative">
                            <div className="flex items-start justify-between mb-6">
                              <div className="flex items-center space-x-4">
                                <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center shadow-lg">
                                  <FiMic className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                  <h3 className="text-lg font-semibold text-white">Generated Audio</h3>
                                  <p className="text-slate-400 text-sm">Professional voice synthesis</p>
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                <div className="px-3 py-1 bg-gradient-to-r from-orange-500/20 to-red-500/20 text-orange-300 rounded-lg border border-orange-500/30 text-xs font-medium shadow-md">
                                  Studio Quality
                                </div>
                                <a
                                  href={previews.audio}
                                  download={`audio_${Date.now()}.mp3`}
                                  className="p-2.5 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 text-white transition-colors shadow-md hover:shadow-lg"
                                >
                                  <FiDownload size={16} />
                                </a>
                              </div>
                            </div>
                            
                            <div className="p-6 rounded-lg bg-slate-700/30 border border-slate-600/30 shadow-md">
                              {previews.audioElement}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Empty State */}
                      {!previews.text && !previews.image && !previews.video && !previews.audio && (
                        <div className="text-center py-16">
                          <div className="w-20 h-20 mx-auto rounded-2xl bg-slate-800/50 flex items-center justify-center mb-6 shadow-lg">
                            <FiFolder className="w-10 h-10 text-slate-500" />
                          </div>
                          <h3 className="text-xl font-bold text-white mb-4">No assets created yet</h3>
                          <p className="text-slate-400 mb-8 max-w-md mx-auto">
                            Start creating professional marketing assets with our AI-powered campaign studio
                          </p>
                          <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <button 
                              onClick={() => setActiveTab('generators')}
                              className="px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-indigo-500/25 transition-all duration-300 transform hover:scale-105"
                            >
                              Launch Campaign Studio
                            </button>
                            <button 
                              onClick={() => {
                                const fileInput = document.createElement('input');
                                fileInput.type = 'file';
                                fileInput.multiple = true;
                                fileInput.accept = 'image/*,video/*,audio/*';
                                fileInput.onchange = (e) => {
                                  if (e.target.files && e.target.files.length > 0) {
                                    toast.success(`${e.target.files.length} file(s) uploaded`);
                                  }
                                };
                                fileInput.click();
                              }}
                              className="px-8 py-4 bg-slate-800/50 hover:bg-slate-700/50 text-white rounded-xl font-semibold border border-slate-600/50 hover:border-slate-500/50 transition-all duration-300 shadow-lg hover:shadow-xl"
                            >
                              <Upload size={18} className="inline mr-2" />
                              Import Existing Assets
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  </div>
);
};

export default UserDashboard;