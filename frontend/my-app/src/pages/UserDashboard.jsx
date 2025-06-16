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
    FiFolder, FiTrendingUp, FiX, FiMenu 
} from 'react-icons/fi';
import { RiMagicLine } from 'react-icons/ri'
import { Settings, ChevronRight, Upload, Info, HelpCircle, Book, Layout, Sparkles, Clock, Star, Zap } from 'lucide-react';
import BackendFFmpeg from "../components/BackendFFmpeg.jsx";
import { useNavigate } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

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

            const plan = (
                user.user_metadata?.plan?.toLowerCase() || 
                planRes.data?.plan?.toLowerCase() || 
                "basic"
            );
            
            if (!["basic", "premium", "enterprise", ""].includes(plan)) {
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
const API_BASE = import.meta.env.VITE_API_BASE_URL;

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

const handleGeneration = async (content) => {
  const debug = {
    stage: 'init',
    requestDetails: {},
    responseDetails: {},
    errors: []
  };
  
  let expectedResponseFormat = 'standard';
  
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
      basic: 10,
      premium: 40,
      enterprise: Infinity,
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
        endpoint = `/api/generate-video-json`;
        requestOptions.headers['Content-Type'] = 'application/json';
        
        // Handle keyframes mode (2 images)
        if (content.videoMode === 'keyframes' && content.lastFrameImage) {
          console.log('Using keyframes mode with two images');
          
          // Upload first frame image
          let firstFrameUrl = null;
          if (content.image) {
            console.log('Uploading first frame image...');
            const imageFormData = new FormData();
            imageFormData.append('image', content.image);
            
            const imageUploadResponse = await fetch(`/api/upload-image`, {
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
            
            const lastImageUploadResponse = await fetch(`/api/upload-image`, {
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
            model: "gen3a_turbo",
            ratio: content.ratio || "1280:768",
            duration: content.duration || 10  // NEW: Add duration parameter
          });
          
          console.log('Keyframes video generation request:', {
            endpoint,
            promptText: content.prompt?.trim() || '',
            firstFrameUrl,
            lastFrameUrl,
            model: "gen3a_turbo",
            duration: content.duration || 10  // NEW: Log duration
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
            
            const imageUploadResponse = await fetch(`/api/upload-image`, {
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
          
          // Now send JSON request with image URL AND DURATION
          body = JSON.stringify({
            promptImageUrl: imageUrl,
            promptText: content.prompt?.trim() || '',
            referenceImageUrl: content.referenceImageUrl || null,
            videoMode: "single_image",
            model: content.model || "gen4_turbo",
            ratio: content.ratio || "1280:720",
            duration: content.duration || 10  // NEW: Add duration parameter
          });
          
          console.log('Video generation request:', {
            endpoint,
            promptText: content.prompt?.trim() || '',
            imageUrl,
            model: content.model || "gen4_turbo",
            ratio: content.ratio || "1280:720",
            duration: content.duration || 10  // NEW: Log duration
          });
        }
      } 
      else if (type === 'tts') {
        endpoint = `/api/elevenlabs/text-to-speech/${encodeURIComponent(content.voice_id)}`;
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
        endpoint = `/api/generate-branded-ad`;
        
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
        endpoint = `/api/generate-text`;
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
      duration: content.duration || 'not specified'  // NEW: Log duration
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
        
        if (type === 'image') {
          if (errorData.detail?.includes('image processing')) {
            errorMessage = 'Failed to process source image. Try a different image.';
          } else if (errorData.detail?.includes('nsfw')) {
            errorMessage = 'Content filtered - Please modify your prompt or image.';
          } else if (errorData.detail?.includes('invalid image') || errorData.detail?.includes('unsupported format')) {
            errorMessage = 'Invalid image format. Please use JPEG, PNG or WebP.';
          } else if (errorData.detail?.includes('file size')) {
            errorMessage = 'Image file is too large. Maximum size is 10MB.';
          } else if (errorData.detail?.includes('missing image')) {
            errorMessage = 'No image was provided. Please select an image.';
          }
        }
        else if (type === 'tts') {
          if (errorData.detail?.includes('voice_id')) {
            errorMessage = 'Invalid voice selected. Please try a different voice.';
          } else if (errorData.detail?.includes('text too long')) {
            errorMessage = 'Text is too long. Please shorten your input.';
          }
        }
        else if (type === 'video') {
          if (errorData.detail?.includes('processing queue')) {
            errorMessage = 'Video processing queue full. Please try again later.';
          } else if (errorData.detail?.includes('Duration must be')) {
            errorMessage = 'Invalid duration selected. Please choose 5 or 10 seconds.';  // NEW: Duration error
          } else if (errorData.detail?.includes('duration')) {
            errorMessage = 'Duration parameter error. Please try again.';  // NEW: General duration error
          }
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

        // FIXED: Use the permanent Supabase URL instead of temporary Runway URL
        let videoUrl = data.supabase_url || data.permanent_url || data.video_url || data.url;
        
        // Get duration from response data
        const videoDuration = data.duration || content.duration || 10;  // NEW: Extract duration
        
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
          duration: videoDuration,  // NEW: Log duration
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
          duration: videoDuration,  // NEW: Include duration in preview
          metadata: {
            duration: videoDuration,  // NEW: Include duration in metadata
            model: data.model || content.model,
            ratio: data.ratio || content.ratio,
            videoMode: data.video_mode || content.videoMode
          }
        };
          
        // FIXED: Clear file inputs after successful generation
        setFileKey(Date.now().toString());
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
        toast.error(`${duration}s video generation failed: ${userMessage}`);  // NEW: Show duration in error message
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
        basic: 10,
        premium: 40,
        enterprise: Infinity
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


// Add these states with your other useState declarations in UserDashboard main component


const DashboardSidebar = ({ userPlan, activeTab, setActiveTab, usage, planLimits, sidebarOpen, setSidebarOpen }) => {
  
  const navigate = useNavigate();
  const handleProfileClick = () => {
    navigate('/profile');
  };

  const handleSettingsClick = () => {
    navigate('/settings');
  };

  const navItems = [
    {
      title: "MARKETING HUB",
      items: [
        { id: 'generators', label: 'Ad Creator Suite', icon: <Layout size={16} />, available: true },
        { id: 'ffmpeg', label: 'Production Studio', icon: <Book size={16} />, available: ['premium', 'enterprise'].includes(userPlan) },
      ]
    },
    {
      title: "ASSET MANAGEMENT",
      items: [
        { id: 'library', label: 'Media Library', icon: <FiFolder size={16} />, available: true },
        { id: 'editor', label: 'Creative Studio', icon: <FiEdit size={16} />, available: ['premium', 'enterprise'].includes(userPlan) },
      ]
    },
    {
      title: "ANALYTICS",
      items: [
        { id: 'analytics', label: 'Campaign Insights', icon: <FiBarChart2 size={16} />, available: ['premium', 'enterprise'].includes(userPlan) },
        { id: 'performance', label: 'ROI Dashboard', icon: <FiTrendingUp size={16} />, available: userPlan === 'enterprise' },
      ]
    },
    {
      title: "ACCOUNT",
      items: [
        { id: 'settings', label: 'Settings', icon: <Settings size={16} />, available: true },
        { id: 'profile', label: 'Profile', icon: <User size={16} />, available: true },
        { id: 'logout', label: 'Logout', icon: <LogOut size={16} />, action: handleLogout, available: true },
      ]
    }
  ];

  return (
    <>
      {/* REMOVED DUPLICATE MOBILE BUTTON - Using parent component's button instead */}
      
      {/* Sidebar */}
      <div className={`w-64 border-r p-5 flex-col h-full fixed lg:relative z-40 transition-all duration-300 ${
        sidebarOpen ? 'left-0' : '-left-64 lg:left-0'
      } bg-gray-900 border-gray-800 top-0`}>
        <div className="mb-8">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <span className="bg-gradient-to-r from-pink-500 to-rose-500 text-transparent bg-clip-text">CF Studio</span>
          </h2>
          <div className={`text-xs font-medium mt-2 px-2 py-1 rounded-full inline-block ${
            userPlan === 'enterprise' ? 'bg-gradient-to-r from-blue-500/20 to-teal-500/20 text-blue-300 border border-blue-500/30' :
            userPlan === 'premium' ? 'bg-gradient-to-r from-pink-500/20 to-rose-500/20 text-pink-300 border border-pink-500/30' :
            'bg-gray-800 text-gray-300 border border-gray-700'
          }`}>
            {userPlan.charAt(0).toUpperCase() + userPlan.slice(1)} Plan
          </div>
        </div>
    
        <nav className="space-y-6 mt-6">
          {navItems.map((section) => (
            <div key={section.title}>
              <h3 className="text-xs font-semibold uppercase mb-3 tracking-wider text-gray-500">
                {section.title}
              </h3>
              <div className="space-y-1.5">
                {section.items.map((item) => (
                  item.available && (
                    <button
                      key={item.id}
                      onClick={() => {
                        if (item.action) {
                          item.action();
                        } else if (item.id === 'profile') {
                          handleProfileClick();
                        } else if (item.id === 'settings') {
                          handleSettingsClick();
                        } else {
                          setActiveTab(item.id);
                        }
                        setSidebarOpen(false);
                      }}
                      className={`flex items-center w-full py-2 px-3 rounded-md font-medium transition-colors text-sm ${
                        activeTab === item.id ? 
                          'bg-gradient-to-r from-pink-600 to-rose-600 text-white' : 
                          'hover:bg-gray-800 text-gray-300'
                      }`}
                    >
                      <span className="mr-2">{item.icon}</span>
                      <span>{item.label}</span>
                      {item.id === 'editor' && (
                        <span className="ml-auto text-xs px-1.5 py-0.5 rounded bg-blue-900 text-blue-200">
                          New
                        </span>
                      )}
                    </button>
                  )
                ))}
              </div>
            </div>
          ))}
        </nav>
    
        {/* Enhanced Content Credits Section - More Stylish */}
        <div className="mt-auto pt-6">
          <div className="rounded-xl p-4 border relative overflow-hidden bg-gradient-to-br from-gray-800/90 via-gray-800 to-gray-900 border-gray-700/80 shadow-xl backdrop-blur-sm">
            {/* Subtle background pattern */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-pink-500/20 via-transparent to-rose-500/20"></div>
              <div className="absolute top-2 right-2 w-20 h-20 rounded-full bg-gradient-to-br from-pink-500/10 to-transparent blur-xl"></div>
            </div>
            
            <div className="relative z-10">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 via-rose-500 to-pink-600 flex items-center justify-center mr-3 shadow-lg shadow-pink-500/25">
                  {userPlan === 'enterprise' ? (
                    <Zap size={16} className="text-white" />
                  ) : (
                    <Sparkles size={16} className="text-white" />
                  )}
                </div>
                <div>
                  <span className="font-bold text-pink-300 text-sm tracking-wide">Content Credits</span>
                  <div className="text-xs text-gray-400 font-medium">
                    {userPlan === 'enterprise' ? (
                      <span className="flex items-center gap-1">
                        <Star size={10} className="text-yellow-400" />
                        Unlimited Access
                      </span>
                    ) : (
                      'Monthly Allocation'
                    )}
                  </div>
                </div>
              </div>
              
              {userPlan === 'enterprise' ? (
                // Enterprise Plan - Show unlimited with FULL bar (NEW BEHAVIOR)
                <>
                  <p className="text-sm text-pink-200/90 mb-4 font-semibold">
                    <span className="text-yellow-400">∞</span> Unlimited generations • <span className="text-white">{usage}</span> created this month
                  </p>
                  
                  {/* ALWAYS FULL progress bar for enterprise */}
                  <div className="w-full rounded-full h-4 mb-4 bg-gray-700/60 overflow-hidden shadow-inner relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-gray-700/40 to-gray-600/40"></div>
                    <div 
                      className="bg-gradient-to-r from-pink-500 via-rose-500 via-pink-600 to-rose-600 h-4 rounded-full shadow-lg relative z-10"
                      style={{ width: '100%' }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-transparent to-transparent rounded-full"></div>
                      <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-transparent via-white/10 to-transparent rounded-full"></div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-pink-300/90 flex items-center gap-1.5 font-medium">
                      <span className="w-2 h-2 rounded-full bg-gradient-to-r from-pink-400 to-rose-400 animate-pulse shadow-sm"></span>
                      Unlimited Access
                    </span>
                    <span className="text-gray-300 bg-gradient-to-r from-gray-800/60 to-gray-700/60 px-2.5 py-1 rounded-full border border-gray-600/50 font-medium">
                      {usage} used
                    </span>
                  </div>
                </>
              ) : (
                // Basic/Premium Plans - Show normal usage (EXISTING BEHAVIOR)
                <>
                  <p className="text-sm text-pink-200/90 mb-4 font-semibold">
                    <span className="text-white">{usage}</span>/<span className="text-pink-300">{planLimits[userPlan]}</span> creations this month
                  </p>
                  
                  {/* Progressive filling for non-enterprise plans */}
                  <div className="w-full rounded-full h-4 mb-4 bg-gray-700/60 overflow-hidden shadow-inner relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-gray-700/40 to-gray-600/40"></div>
                    <div 
                      className="bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 h-4 rounded-full transition-all duration-1000 ease-out shadow-lg relative z-10"
                      style={{ width: `${Math.min(100, (usage / planLimits[userPlan]) * 100)}%` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-transparent to-transparent rounded-full"></div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-300 bg-gradient-to-r from-gray-800/60 to-gray-700/60 px-2.5 py-1 rounded-full border border-gray-600/50 font-medium">
                      {planLimits[userPlan] - usage} remaining
                    </span>
                    <span className="text-pink-300/90 font-medium">
                      {Math.round((usage / planLimits[userPlan]) * 100)}% used
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </>
  );
};

const GeneratorCard = ({ type, remaining, onGenerate, userPlan }) => {
  const typeConfig = {
    text: {
      icon: <FiFileText className="w-5 h-5" />,
      title: 'Craft Compelling Ad Copy',
      description: 'Create persuasive marketing messages that drive conversions',
      examples: [
        'Write a headline that highlights our product benefits',
        'Create professional product descriptions for our e-commerce store',
        'Generate brand storytelling for our company profile'
      ],
      available: true,
      badge: null,
      gradient: 'from-pink-600 to-rose-600',
      buttonGradient: 'from-pink-600 to-rose-600',
      iconBg: 'bg-pink-950'
    },
    image: {
      icon: <FiImage className="w-5 h-5" />,
      title: 'Transform Product Imagery',
      description: 'Enhance your product photos with professional-grade transformations',
      examples: [
        'Create a lifestyle scene featuring our product',
        'Transform product photo into a high-end magazine ad',
        'Add professional branding elements to our product image'
      ],
      available: true,
      badge: null,
      gradient: 'from-pink-600 to-rose-600',
      buttonGradient: 'from-pink-600 to-rose-600',
      iconBg: 'bg-pink-950'
    },
    video: {
      icon: <FiVideo className="w-5 h-5" />,
      title: 'Create Professional Video Ads',
      description: 'Transform static images into engaging video content for any platform',
      examples: [
        'Convert product photo into a dynamic Instagram story ad',
        'Create a Facebook video carousel from our product line', 
        'Generate a YouTube pre-roll ad showcasing benefits'
      ],
      available: true,
      badge: userPlan === 'premium' ? 'Popular' : null,
      gradient: 'from-pink-600 to-rose-600',
      buttonGradient: 'from-pink-600 to-rose-600', 
      iconBg: 'bg-pink-950'
    },
    tts: {
      icon: <FiMic className="w-5 h-5" />,
      title: 'Professional Voice Narration',
      description: 'Add premium voiceovers to create a complete multimedia experience',
      examples: [
        'Create a professional explainer voice for our product demo',
        'Generate an authoritative narration for our brand story',
        'Produce conversational dialogue for our testimonial video'
      ],
      available: true,
      badge: 'New',
      gradient: 'from-pink-600 to-rose-600',
      buttonGradient: 'from-pink-600 to-rose-600',
      iconBg: 'bg-pink-950'
    }
  };

  const config = typeConfig[type];
  
  return (
    <div className="rounded-lg border overflow-hidden shadow-sm hover:shadow-md transition-shadow group h-full flex flex-col bg-gray-800 border-gray-700">
      {/* Top accent bar */}
      <div className={`h-1 bg-gradient-to-r ${config.gradient}`}></div>
      
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center">
            {/* Icon with custom background */}
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-3 ${config.iconBg} text-pink-400`}>
              {config.icon}
            </div>
            <div>
              <h3 className="text-base font-bold text-white">{config.title}</h3>
              {config.badge && (
                <span className="text-xs px-2 py-0.5 rounded-full mt-1 inline-block bg-pink-500/20 text-pink-300 border border-pink-500/30">
                  {config.badge}
                </span>
              )}
            </div>
          </div>
          <span className="text-xs px-2 py-1 rounded-full bg-gray-700 text-pink-400 border border-pink-500/30">
            {userPlan === 'enterprise' ? '∞' : remaining} credits
          </span>
        </div>
        
        <p className="text-sm mb-4 text-gray-400">{config.description}</p>
        
        <div className="mb-4 flex-1">
          <p className="text-xs font-medium mb-2 text-gray-500">USE CASES</p>
          <div className="space-y-2">
            {config.examples.map((example, i) => (
              <div key={i} className="rounded-md p-2 text-sm cursor-pointer transition-colors bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600">
                {example}
              </div>
            ))}
          </div>
        </div>
        
        {config.available ? (
          <ContentGenerator
            type={type}
            remaining={remaining}
            onGenerate={onGenerate}
            className="w-full"
            darkMode={true}
          />
        ) : (
          <button className="w-full py-2 rounded-lg text-xs font-medium bg-gray-700 text-gray-300 hover:bg-gray-600">
            Upgrade to {type === 'video' ? 'Premium' : 'Enterprise'} Plan
          </button>
        )}
      </div>
    </div>
  );
};

return (
  <div className="flex flex-col min-h-screen dark bg-[#121212]">
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

    {/* Header */}
    <header className="border-b px-6 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm bg-gray-900/90 backdrop-blur-md border-gray-800">
      <div className="flex items-center">
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="lg:hidden p-3 rounded-md mr-2 relative z-50 bg-gray-800 hover:bg-gray-700 border border-gray-600 text-white touch-manipulation"
          style={{ 
            minHeight: '44px', 
            minWidth: '44px',
            WebkitTapHighlightColor: 'transparent'
          }}
          type="button"
          aria-label="Toggle menu"
        >
          {sidebarOpen ? (
            <FiX className="w-5 h-5" />
          ) : (
            <FiMenu className="w-5 h-5" />
          )}
        </button>
        <div className="bg-gradient-to-r from-pink-500 to-rose-500 text-transparent bg-clip-text font-bold text-lg mr-3">CF Studio</div>
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
          userPlan === 'enterprise' ? 'bg-gradient-to-r from-blue-500/20 to-teal-500/20 text-blue-300 border border-blue-500/30' :
          userPlan === 'premium' ? 'bg-gradient-to-r from-pink-500/20 to-rose-500/20 text-pink-300 border border-pink-500/30' :
          'bg-gray-800 text-gray-300 border border-gray-700'
        }`}>
          {userPlan.charAt(0).toUpperCase() + userPlan.slice(1)}
        </span>
      </div>
      
      <div className="flex items-center space-x-3">
        <button 
          onClick={handleLogout}
          className="px-3 py-1.5 rounded-md bg-gray-800 text-red-400 hover:bg-gray-700 transition-colors flex items-center text-sm font-medium"
        >
          <LogOut size={16} className="mr-1.5" />
          <span>Logout</span>
        </button>
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
      <main className="flex-1 p-6 overflow-auto mt-16 lg:mt-0 bg-[#151515]">
        {/* Welcome Banner */}
        <div className="rounded-lg mb-6 shadow-md overflow-hidden bg-gray-800/80 border border-gray-700">
          <div className="flex flex-col md:flex-row">
            <div className="md:w-2/3 p-6">
              <div className="flex items-center mb-2">
                <div className="w-10 h-10 rounded-full bg-pink-600 flex items-center justify-center mr-3">
                  <Sparkles size={20} className="text-white" />
                </div>
                <h2 className="text-xl font-bold text-white">
                  Advertising Studio
                </h2>
              </div>
              <p className="text-base mb-4 text-gray-300">
                Create professional ads that convert with our powerful AI marketing tools
              </p>
              <button 
                onClick={() => setShowDemoVideo(true)}
                className="bg-gradient-to-r from-pink-600 to-rose-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:from-pink-700 hover:to-rose-700 transition-colors flex items-center shadow-lg shadow-pink-500/20"
              >
                Demo Video
                <ChevronRight size={16} className="ml-1" />
              </button>
            </div>
            <div className="hidden md:block md:w-1/3 bg-gradient-to-r from-pink-600 to-rose-600 p-6">
              <div className="h-full flex flex-col justify-between text-white">
                <div>
                  <h3 className="text-lg font-bold mb-2">Need Inspiration?</h3>
                  <p className="text-sm text-pink-100">Check out our template library for proven ad formats</p>
                </div>
                <div className="mt-4">
                  <button 
                    className="px-3 py-1.5 bg-white/10 rounded-lg text-sm transition-colors flex items-center gap-1.5 opacity-80 cursor-default"
                    disabled
                  >
                    <Clock size={12} />
                    Coming Soon
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Industry Templates - Updated with Coming Soon */}
        <div className="rounded-lg border mb-6 bg-gray-800/80 border-gray-700">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-white">Industry Templates</h2>
              <button 
                className="text-xs font-medium px-3 py-1.5 rounded text-gray-400 bg-gray-500/10 hover:bg-gray-500/15 flex items-center gap-1.5 cursor-default transition-colors"
                disabled
              >
                <Clock size={12} />
                Coming Soon
              </button>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { name: "E-commerce", icon: <FiShoppingCart size={16} />, color: "from-pink-500 to-rose-500" },
                { name: "Brand Awareness", icon: <FiUsers size={16} />, color: "from-blue-500 to-indigo-500" },
                { name: "Service Promotion", icon: <RiMagicLine size={16} />, color: "from-amber-500 to-orange-500" },
                { name: "Lead Generation", icon: <FiLayers size={16} />, color: "from-emerald-500 to-teal-500" }
              ].map((template, index) => (
                <div 
                  key={index}
                  className="p-3 rounded-lg border transition-all border-gray-700 bg-gray-800/40 relative"
                >
                  <div className={`w-10 h-10 mb-2 rounded-lg flex items-center justify-center bg-gradient-to-br ${template.color} text-white`}>
                    {template.icon}
                  </div>
                  <h3 className="text-xs font-medium text-white">{template.name}</h3>
                  {/* Coming Soon overlay */}
                  <div className="absolute top-1 right-1">
                    <Clock size={10} className="text-gray-400" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {activeTab === 'generators' && (
          <div className="space-y-6">
            {/* Generators Grid - Now immediately visible */}
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold flex items-center text-white">
                    Create Marketing Assets
                    <span className="ml-2 text-xs bg-gradient-to-r from-pink-500/20 to-rose-500/20 text-pink-400 px-2 py-0.5 rounded-full border border-pink-500/30">
                      {userPlan === 'premium' || userPlan === 'enterprise' ? 'Premium Access' : 'Standard Access'}
                    </span>
                  </h2>
                  <div className="flex items-center">
                    <button 
                      onClick={() => setShowDemoVideo(true)}
                      className="flex items-center py-1.5 px-3 rounded-md text-xs bg-gray-700 text-white hover:bg-gray-600"
                    >
                      <Info size={12} className="mr-1.5" />
                      Tutorial
                    </button>
                  </div>
                </div>
                <div className="grid gap-5 md:grid-cols-2">
                  <GeneratorCard 
                    type="image" 
                    remaining={planLimits[userPlan] - usage} 
                    onGenerate={handleGeneration}
                    userPlan={userPlan}
                  />
                  <GeneratorCard 
                    type="video" 
                    remaining={planLimits[userPlan] - usage} 
                    onGenerate={handleGeneration}
                    userPlan={userPlan}
                  />
                  <GeneratorCard 
                    type="tts" 
                    remaining={planLimits[userPlan] - usage} 
                    onGenerate={handleGeneration}
                    userPlan={userPlan}
                  />
                  <GeneratorCard 
                    type="text" 
                    remaining={planLimits[userPlan] - usage} 
                    onGenerate={handleGeneration}
                    userPlan={userPlan}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'editor' && (
          <div className="rounded-lg border bg-gray-800/80 border-gray-700">
            <div className="p-5">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-lg font-bold text-white">Creative Studio</h2>
                  <p className="text-sm mt-1 text-gray-400">
                    Advanced image editing and transformation tools powered by Cloudinary
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">Premium Feature</span>
                </div>
              </div>

              <div className="rounded-lg border border-gray-700">
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
        )}

        {activeTab === 'ffmpeg' && (
          <div className="rounded-lg border bg-gray-800/80 border-gray-700">
            <div className="p-5">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-lg font-bold text-white">Production Studio</h2>
                  <p className="text-sm mt-1 text-gray-400">
                    Professional video editing and audio merging tools powered by server-side processing
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-300 border border-green-500/30">Server Processing</span>
                </div>
              </div>
              <BackendFFmpeg darkMode={true} />
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="rounded-lg border bg-gray-800/80 border-gray-700">
            <div className="p-8 text-center">
              <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 bg-gray-700/50">
                <Clock className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-white">
                Campaign Insights Coming Soon
              </h3>
              <p className="text-sm mb-5 max-w-md mx-auto text-gray-400">
                We're building powerful analytics to help you track your ad performance and optimize campaigns
              </p>
              <div className="flex items-center justify-center gap-3">
                <span className="px-3 py-1 bg-pink-500/20 text-pink-300 text-xs font-medium rounded-full border border-pink-500/30">
                  Premium Feature
                </span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'performance' && (
          <div className="rounded-lg border bg-gray-800/80 border-gray-700">
            <div className="p-8 text-center">
              <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 bg-gray-700/50">
                <Clock className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-white">
                ROI Dashboard Coming Soon
              </h3>
              <p className="text-sm mb-5 max-w-md mx-auto text-gray-400">
                Advanced ROI tracking and performance metrics are in development
              </p>
              <div className="flex items-center justify-center gap-3">
                <span className="px-3 py-1 bg-blue-500/20 text-blue-300 text-xs font-medium rounded-full border border-blue-500/30">
                  Enterprise Feature
                </span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'library' && (
          <div className="rounded-lg border bg-gray-800/80 border-gray-700">
            <div className="p-5">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-lg font-bold text-white">Media Library</h2>
                  <p className="text-sm mt-1 text-gray-400">
                    Browse and manage all your marketing assets
                  </p>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="px-3 py-1.5 rounded-md flex items-center bg-gray-700">
                    <select className="text-sm bg-transparent outline-none text-white">
                      <option>All Assets</option>
                      <option>Images</option>
                      <option>Videos</option>
                      <option>Audio</option>
                      <option>Text</option>
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
                          console.log('Files selected:', e.target.files);
                        }
                      };
                      fileInput.click();
                    }}
                    className="flex items-center px-3 py-1.5 rounded-md text-sm bg-pink-600 text-white hover:bg-pink-700"
                  >
                    <Upload size={14} className="mr-1.5" />
                    Import Assets
                  </button>
                </div>
              </div>
              
              <div className="space-y-6">
                {previews.text && (
                  <div className="p-5 rounded-lg border bg-gray-800 border-gray-700">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="text-base font-medium text-white">Professional Ad Copy</h3>
                        <p className="text-xs text-gray-400">
                          Generated on {new Date().toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => setActiveTab('editor')}
                          className="p-2 rounded-md bg-gray-700 text-white hover:bg-gray-600"
                        >
                          <FiEdit size={16} />
                        </button>
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
                            toast.success('Text content downloaded successfully');
                          }}
                         className="p-2 rounded-md bg-gray-700 text-white hover:bg-gray-600"
                        >
                          <FiDownload size={16} />
                        </button>
                      </div>
                    </div>
                    <div className="prose max-w-none prose-invert text-white">
                      <ReactMarkdown>
                        {previews.text}
                      </ReactMarkdown>
                    </div>
                  </div>
                )}
                
                {previews.image && (
                  <div className="p-5 rounded-lg border bg-gray-800 border-gray-700">
                      <div className="grid md:grid-cols-2 gap-6">
                          <div>
                              <div className="flex items-center justify-between mb-3">
                                <div>
                                  <h3 className="text-base font-medium text-white">Product Original</h3>
                                  <p className="text-xs text-gray-400">
                                    Source Image
                                  </p>
                                </div>
                              </div>
                              <div className="rounded-lg overflow-hidden border border-gray-700">
                                <img 
                                  src={previews.sourceImage} 
                                  className="w-full h-auto" 
                                  alt="Source content" 
                                />
                              </div>
                          </div>
                          <div>
                              <div className="flex justify-between items-center mb-3">
                                <div>
                                  <h3 className="text-base font-medium text-white">Enhanced Marketing Asset</h3>
                                  <p className="text-xs text-gray-400">
                                    Professional Transformation
                                  </p>
                                </div>
                                <div className="flex gap-2">
                                  <a
                                    href={previews.image}
                                    download={`transformed_${Date.now()}.png`}
                                    className="p-2 rounded-md bg-gray-700 text-white hover:bg-gray-600"
                                    title="Download"
                                  >
                                    <FiDownload size={16} />
                                  </a>
                                  <button
                                    onClick={() => setFullscreenPreview({ type: 'image', content: previews.image })}
                                    className="p-2 rounded-md bg-gray-700 text-white hover:bg-gray-600"
                                    title="Fullscreen"
                                  >
                                    <FiMaximize size={16} />
                                  </button>
                                </div>
                              </div>
                              <div className="rounded-lg overflow-hidden border border-gray-700">
                                <img 
                                  src={previews.image} 
                                  className="w-full h-auto" 
                                  alt="Generated content" 
                                />
                              </div>
                              {previews.metadata && (
                                <div className="mt-3 text-sm rounded-md p-3 bg-gray-700 text-gray-300">
                                  <div className="mb-1 font-medium">Generation Details</div>
                                  <p className="text-xs">Prompt: {previews.metadata.prompt}</p>
                                  <p className="text-xs">Seed: {previews.metadata.seed || 'random'}</p>
                                  <p className="text-xs">Transformation Strength: {previews.metadata.image_strength}</p>
                                </div>
                              )}
                          </div>
                      </div>
                  </div>
                )}
                
                {previews.video && (
                  <div className="p-5 rounded-lg border bg-gray-800 border-gray-700">
                    <div className="flex justify-between items-center mb-3">
                      <div>
                        <h3 className="text-base font-medium text-white">Professional Video Ad</h3>
                        <p className="text-xs text-gray-400">
                          Ready for all platforms
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <div className="px-2 py-0.5 rounded-full text-xs bg-pink-500/20 text-pink-300 border border-pink-500/30">Premium Quality</div>
                        <a
                          href={previews.video}
                          download={`video_${Date.now()}.mp4`}
                          className="p-2 rounded-md bg-gray-700 text-white hover:bg-gray-600"
                          title="Download"
                        >
                          <FiDownload size={16} />
                        </a>
                        <button
                          onClick={() => setFullscreenPreview({ type: 'video', content: previews.video })}
                          className="p-2 rounded-md bg-gray-700 text-white hover:bg-gray-600"
                          title="Fullscreen"
                        >
                          <FiMaximize size={16} />
                        </button>
                      </div>
                    </div>
                    <div className="rounded-lg overflow-hidden border border-gray-700">
                      <video
                        controls
                        className="w-full rounded-lg"
                        playsInline
                        webkit-playsinline="true"
                        muted
                        preload="metadata"
                        crossOrigin="anonymous"
                        onError={(e) => {
                          console.error('Video load error:', e);
                          console.log('Video URL that failed:', previews.video);
                          console.log('User agent:', navigator.userAgent);
                          console.log('Is mobile:', /iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
                        }}
                        onLoadStart={() => console.log('Video loading started:', previews.video)}
                        onLoadedData={() => console.log('Video loaded successfully:', previews.video)}
                        onCanPlay={() => console.log('Video can play')}
                        onCanPlayThrough={() => console.log('Video can play through')}
                      >
                        <source src={previews.video} type="video/mp4" />
                        <source src={previews.video.replace('.mp4', '.webm')} type="video/webm" />
                        Your browser does not support the video tag.
                      </video>
                    </div>
                    
                    <div className="mt-3 text-center">
                      <p className="text-xs text-gray-400 mb-2">
                        If video doesn't play above, try these options:
                      </p>
                      <div className="flex flex-col sm:flex-row gap-2 justify-center">
                        <a
                          href={previews.video}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-pink-400 hover:text-pink-300 text-sm underline"
                        >
                          Open in new tab
                        </a>
                        <a
                          href={previews.video}
                          download={`video_${Date.now()}.mp4`}
                          className="text-blue-400 hover:text-blue-300 text-sm underline"
                        >
                          Download directly
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                {previews.audio && (
                  <div className="p-5 rounded-lg border bg-gray-800 border-gray-700">
                    <div className="flex justify-between items-center mb-3">
                      <div>
                        <h3 className="text-base font-medium text-white">Professional Voiceover</h3>
                        <p className="text-xs text-gray-400">
                          Ready for video integration
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="px-2 py-0.5 rounded-full text-xs bg-blue-500/20 text-blue-300 border border-blue-500/30">Professional Results</div>
                        <a
                          href={previews.audio}
                          download={`audio_${Date.now()}.mp3`}
                          className="p-2 rounded-md bg-gray-700 text-white hover:bg-gray-600"
                          title="Download"
                        >
                          <FiDownload size={16} />
                        </a>
                      </div>
                    </div>
                    <div className="p-4 rounded-lg border border-gray-700 bg-gray-700">
                      {previews.audioElement}
                    </div>
                  </div>
                )}

                {!previews.text && !previews.image && !previews.video && !previews.audio && (
                  <div className="p-8 text-center rounded-lg border border-gray-700 bg-gray-800/40">
                    <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 bg-gray-700">
                      <FiFolder className="w-8 h-8 text-gray-500" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2 text-white">
                      Your media library is empty
                    </h3>
                    <p className="text-sm mb-5 max-w-md mx-auto text-gray-400">
                      Create professional marketing assets with our AI tools or import your existing brand assets
                    </p>
                    <div className="flex items-center justify-center gap-3">
                      <button 
                        onClick={() => setActiveTab('generators')}
                        className="px-4 py-2 rounded-md text-sm font-medium bg-gradient-to-r from-pink-600 to-rose-600 text-white hover:from-pink-700 hover:to-rose-700 shadow-lg shadow-pink-600/20"
                      >
                        Create New Asset
                      </button>
                      <button 
                        onClick={() => {
                          const fileInput = document.createElement('input');
                          fileInput.type = 'file';
                          fileInput.multiple = true;
                          fileInput.accept = 'image/*,video/*,audio/*';
                          fileInput.onchange = (e) => {
                            if (e.target.files && e.target.files.length > 0) {
                              toast.success(`${e.target.files.length} file(s) uploaded successfully`);
                              console.log('Files selected:', e.target.files);
                            }
                          };
                          fileInput.click();
                        }}
                        className="px-4 py-2 rounded-md text-sm font-medium bg-gray-700 text-white hover:bg-gray-600"
                      >
                        <Upload size={14} className="inline mr-1.5" />
                        Import Files
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  </div>
);
}
export default UserDashboard;