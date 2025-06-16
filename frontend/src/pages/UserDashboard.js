import React, { useEffect, useState, useCallback } from "react";
import ReactMarkdown from 'react-markdown';
import { supabase } from "../supabaseClient";
import ContentGenerator from "../components/ContentGenerator";
import CloudinaryEditor from "../components/CloudinaryEditor";
import UsageMeter from "../components/UsageMeter";
import { loadStripe } from '@stripe/stripe-js';
import { v4 as uuidv4 } from 'uuid';
import { Bell, User, LogOut } from 'lucide-react';
import { toast } from 'react-toastify';
import { 
    FiHome, FiFileText, FiImage, FiVideo, FiMic, FiEdit, 
    FiBarChart2, FiUsers, FiShoppingCart, FiMoon, FiSun, 
    FiUser, FiLogOut, FiDownload, FiMaximize, FiLayers, 
    FiFolder, FiTrendingUp, FiX, FiMenu 
} from 'react-icons/fi';
import { RiMagicLine } from 'react-icons/ri'
import { Settings, ChevronRight, Upload, Info, HelpCircle, Book, Layout, Sparkles } from 'lucide-react';
import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';

// Initialize Stripe outside the component
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY);

const UserDashboard = ({ debug = false }) => {
  const [userPlan, setUserPlan] = useState("basic");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [usage, setUsage] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [previews, setPreviews] = useState({
    text: "",
    image: "",
    video: "",
    audio: ""
  });
  const [remainingCredits, setRemainingCredits] = useState(0);
  const [fileKey, setFileKey] = useState(uuidv4());
  const [editableAssets, setEditableAssets] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('generators');
  const [darkMode, setDarkMode] = useState(false);
  const [fullscreenPreview, setFullscreenPreview] = useState(null);
  const [ffmpegLoading, setFfmpegLoading] = useState(false);
  const [ffmpegProgress, setFfmpegProgress] = useState(0);
  const [mergedVideoUrl, setMergedVideoUrl] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState(null);

  // Handle logout
  const handleLogout = async () => {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        window.location.reload();
    } catch (err) {
        setError(err.message);
    }
  };

  // Handle plan upgrade with Stripe
  const handleUpgradePlan = async (plan) => {
    try {
      setIsProcessingPayment(true);
      setPaymentError(null);

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) throw new Error("Authentication required");

      const response = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          plan: plan.toLowerCase(),
          success_url: `${window.location.origin}/dashboard?payment=success`,
          cancel_url: `${window.location.origin}/dashboard?payment=cancel`
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create payment session');
      }

      const { sessionId } = await response.json();
      const stripe = await stripePromise;
      const { error: stripeError } = await stripe.redirectToCheckout({ sessionId });

      if (stripeError) throw stripeError;

    } catch (err) {
      console.error('Payment error:', err);
      setPaymentError(err.message);
    } finally {
      setIsProcessingPayment(false);
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
            
            if (!["basic", "premium", "enterprise", "trial"].includes(plan)) {
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

  // ... (keep all your existing code below exactly as it was) ...


  // ... (keep all your existing state declarations the same) ...



  // In your component state (replace your current FFmpeg state):
 

  

  
  // Create FFmpeg instance
  const [ffmpeg] = useState(() => {
    const ffmpegInstance = createFFmpeg({ 
      log: true,
      // Remove the corePath to let the library find its own core files
      progress: ({ ratio }) => {
        setFfmpegProgress(Math.round(ratio * 100));
      }
      // Remove mainName: 'main' as it's not supported in version 0.11.0
    });
    return ffmpegInstance;
  });
  // Load FFmpeg when needed
  useEffect(() => {
    const loadFFmpeg = async () => {
      if (ffmpeg.isLoaded()) {
        console.log('FFmpeg already loaded');
        return;
      }

      // Check if SharedArrayBuffer is supported
      const isSharedArrayBufferSupported = typeof SharedArrayBuffer !== 'undefined';
      
      if (!isSharedArrayBufferSupported) {
        const errorMsg = 'Your browser does not support SharedArrayBuffer, which is required for FFmpeg. Please use Chrome or Firefox and ensure the site is served over HTTPS with proper security headers.';
        console.error(errorMsg);
        setError(errorMsg);
        setFfmpegLoading(false);
        return;
      }

      try {
        setFfmpegLoading(true);
        setError('');
        setFfmpegProgress(0);
        console.log("Initializing FFmpeg...");

        await ffmpeg.load();
        console.log("FFmpeg successfully loaded and ready!");
      } catch (err) {
        console.error('FFmpeg initialization failed:', err);
        let errorMsg = 'Video processor failed to load. Please refresh the page.';
        
        if (err.message && err.message.includes('404')) {
          errorMsg = 'Failed to load FFmpeg core files. Check your internet connection.';
        } else if (err.message && err.message.includes('Aborted')) {
          errorMsg = 'FFmpeg loading was interrupted. Please try again.';
        } else if (err.message && err.message.includes('SharedArrayBuffer')) {
          errorMsg = 'Browser security restriction detected. Try using Chrome or Firefox.';
        } else if (err.message && err.message.includes('Failed to fetch')) {
          errorMsg = 'Network error when loading FFmpeg. Check your internet connection.';
        }
        
        setError(errorMsg);
        throw err;
      } finally {
        setFfmpegLoading(false);
      }
    };

  
  
  // Other functions and JSX for your component...

 


    if (activeTab === 'ffmpeg') {
      console.log('FFmpeg tab active - loading FFmpeg');
      loadFFmpeg().catch(err => {
        console.error('Unhandled error in FFmpeg load:', err);
      });
    }
  }, [activeTab, ffmpeg]);
  
  // Merge audio + video
  const handleVideoAudioMerge = async (videoFile, audioFile) => {
    if (!ffmpeg.isLoaded()) {
      const errorMsg = 'Video processor not ready yet. Please wait for initialization.';
      console.error(errorMsg);
      setError(errorMsg);
      return;
    }
  
    try {
      setFfmpegLoading(true);
      setMergedVideoUrl('');
      setError('');
      setFfmpegProgress(0);
  
      console.log("Starting file processing...");
      console.log(`Video file: ${videoFile.name}, size: ${(videoFile.size / (1024 * 1024)).toFixed(2)}MB`);
      console.log(`Audio file: ${audioFile.name}, size: ${(audioFile.size / (1024 * 1024)).toFixed(2)}MB`);
  
      console.log("Writing files to FFmpeg filesystem...");
      await Promise.all([
        ffmpeg.FS('writeFile', 'input.mp4', await fetchFile(videoFile)),
        ffmpeg.FS('writeFile', 'audio.mp3', await fetchFile(audioFile))
      ]);
  
      console.log("Merging video and audio...");
      await ffmpeg.run(
        '-i', 'input.mp4',
        '-i', 'audio.mp3',
        '-c:v', 'copy',
        '-map', '0:v:0',
        '-map', '1:a:0',
        '-shortest',
        'output.mp4'
      );
  
      console.log("Reading output file...");
      const data = ffmpeg.FS('readFile', 'output.mp4');
      console.log(`Output file size: ${(data.length / (1024 * 1024)).toFixed(2)}MB`);
  
      const url = URL.createObjectURL(new Blob([data.buffer], { type: 'video/mp4' }));
      setMergedVideoUrl(url);
      console.log("Video successfully merged and URL created");
  
    } catch (err) {
      console.error('Video processing failed:', err);
      let errorMsg = 'Failed to process files. Please try different files.';
      
      if (err.message && err.message.includes('Invalid data')) {
        errorMsg = 'Invalid file format. Please use supported video/audio formats.';
      } else if (err.message && err.message.includes('File not found')) {
        errorMsg = 'File processing error. Please try again.';
      }
      
      setError(errorMsg);
      throw err;
    } finally {
      setFfmpegLoading(false);
      // Cleanup FFmpeg filesystem
      try {
        ['input.mp4', 'audio.mp3', 'output.mp4'].forEach(file => {
          if (ffmpeg.FS('readdir', '/').includes(file)) {
            ffmpeg.FS('unlink', file);
          }
        });
      } catch (cleanupErr) {
        console.error('Error during filesystem cleanup:', cleanupErr);
      }
    }
  };
  
  // Upload handler with enhanced validation
  const handleFileUpload = async (e) => {
    e.preventDefault();
    
    try {
      const videoFile = e.target.video?.files[0];
      const audioFile = e.target.audio?.files[0];
  
      if (!videoFile || !audioFile) {
        const errorMsg = 'Please select both video and audio files';
        console.error(errorMsg);
        setError(errorMsg);
        return;
      }
  
      // Validate file types
      const validVideoTypes = ['video/mp4', 'video/quicktime'];
      const validAudioTypes = ['audio/mpeg', 'audio/wav', 'audio/ogg'];
      
      if (!validVideoTypes.includes(videoFile.type)) {
        const errorMsg = `Unsupported video format: ${videoFile.type}. Please use MP4 or MOV.`;
        console.error(errorMsg);
        setError(errorMsg);
        return;
      }
  
      if (!validAudioTypes.includes(audioFile.type)) {
        const errorMsg = `Unsupported audio format: ${audioFile.type}. Please use MP3, WAV, or OGG.`;
        console.error(errorMsg);
        setError(errorMsg);
        return;
      }
  
      console.log('Starting video/audio merge process');
      await handleVideoAudioMerge(videoFile, audioFile);
    } catch (err) {
      console.error('Unhandled error in file upload:', err);
      setError('An unexpected error occurred. Please try again.');
    }
  };
        
        

    

    const pollVideoStatus = useCallback(async (taskId, accessToken) => {
      const pollEndpoint = `/video-status/${taskId}`;
      let attempts = 0;
      const maxAttempts = 12;
      const delay = 5000;
      
      while (attempts < maxAttempts) {
          try {
              const response = await fetch(pollEndpoint, {
                  headers: {
                      'Authorization': `Bearer ${accessToken}`,
                      'Content-Type': 'application/json'
                  }
              });
              
              if (!response.ok) {
                  const errorData = await response.json().catch(() => ({}));
                  throw new Error(errorData.error || `Status check failed (${response.status})`);
              }
              
              const result = await response.json();
              const status = result.status?.toUpperCase() || 'UNKNOWN';
              
              if (status === 'SUCCEEDED') {
                  return {
                      video_url: result.video_url || result.url || result.output?.[0],
                      ...result
                  };
              } 
              else if (status === 'FAILED') {
                  throw new Error(result.error || 'Video generation failed');
              }
              
              await new Promise(resolve => setTimeout(resolve, delay));
              attempts++;
          } catch (error) {
              console.error('Polling error:', error);
              throw error;
          }
      }
      
      throw new Error('Video generation timed out after 60 seconds');
  }, []);
  
  const pollSDXLResult = useCallback(async (generationId, accessToken) => {
      const pollEndpoint = `/api/v1/stable-diffusion/image-result/${generationId}`;
      let attempts = 0;
      const maxAttempts = 30;
      const delay = 2000;
      
      while (attempts < maxAttempts) {
          try {
              const response = await fetch(pollEndpoint, {
                  headers: {
                      'Authorization': `Bearer ${accessToken}`
                  }
              });
              
              if (!response.ok) {
                  const errorData = await response.json().catch(() => ({}));
                  throw new Error(errorData.error || `Status check failed (${response.status})`);
              }
              
              const result = await response.json();
              
              if (result.status === 'completed') {
                  return result;
              } else if (result.status === 'failed') {
                  throw new Error(result.error || 'Image generation failed');
              }
              
              await new Promise(resolve => setTimeout(resolve, delay));
              attempts++;
          } catch (error) {
              console.error('Polling error:', error);
              throw error;
          }
      }
      
      throw new Error('Image generation timed out after 60 seconds');
  }, []);
  
  const handleGeneration = async (content) => {
      try {
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          const { data: { user } } = await supabase.auth.getUser();
  
          if (sessionError || !session || !user) {
              throw new Error("session");
          }
  
          const planLimits = {
              basic: 10,
              premium: 40,
              enterprise: Infinity,
              trial: 3
          };
          if (userPlan !== 'enterprise' && usage >= planLimits[userPlan]) {
              throw new Error("limit_reached");
          }
  
          const type = content?.type || 'text';
          let endpoint;
          let requestOptions = {
              method: "POST",
              headers: {
                  "Authorization": `Bearer ${session.access_token}`,
                  "X-User-ID": user.id
              }
          };
  
          let body;
          if (type === 'video') {
              endpoint = '/generate-video/';
              const formData = new FormData();
              formData.append('prompt_text', content.prompt.trim());
              if (content.image) formData.append('image', content.image);
              body = formData;
              delete requestOptions.headers['Content-Type'];
          } 
          else if (type === 'tts') {
              endpoint = `/api/elevenlabs/text-to-speech/${encodeURIComponent(content.voice_id)}`;
              requestOptions.headers['Content-Type'] = 'application/json';
              requestOptions.headers['Accept'] = 'audio/mpeg';
              body = JSON.stringify({
                  text: content.prompt.trim(),
                  model_id: "eleven_multilingual_v2",
                  stability: content.stability || 0.5,
                  similarity_boost: content.similarity_boost || 0.75
              });
          } 
          else if (type === 'image') {
              endpoint = '/stable-diffusion/image-to-image';
              const formData = new FormData();
              formData.append('image', content.image);
              formData.append('prompt', content.prompt.trim());
              if (content.seed) formData.append('seed', content.seed);
              formData.append('cfg_scale', content.cfg_scale || 7);
              formData.append('image_strength', content.image_strength || 0.35);
              body = formData;
              delete requestOptions.headers['Content-Type'];
          }
          else {
              endpoint = '/generate-text/';
              requestOptions.headers['Content-Type'] = 'application/json';
              body = JSON.stringify({
                  prompt: content.prompt.trim()
              });
          }
  
          requestOptions.body = body;
  
          const response = await fetch(endpoint, requestOptions);
          
          if (!response.ok) {
              const error = await response.json().catch(() => null);
              const errorMsg = error?.detail || 
                             error?.message || 
                             `Request failed with status ${response.status}`;
              throw new Error(errorMsg);
          }
  
          const result = {};
          const previewUpdate = {};
  
          if (type === 'tts') {
              const blob = await response.blob();
              const audioUrl = URL.createObjectURL(blob);
              
              previewUpdate.audio = audioUrl;
              previewUpdate.audioElement = (
                  <div className="mt-4">
                      <audio 
                          controls 
                          className="w-full"
                          onError={() => setError('Failed to load audio')}
                      >
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
              const data = await response.json();
              Object.assign(result, data);
  
              let videoUrl = data.video_url || data.url;
              if (data.task_id && !videoUrl) {
                  const pollResult = await pollVideoStatus(data.task_id, session.access_token);
                  videoUrl = pollResult.video_url || pollResult.url;
              }
  
              if (!videoUrl) throw new Error("No video URL received");
  
              previewUpdate.video = videoUrl;
              previewUpdate.videoElement = (
                  <div className="mt-4">
                      <video
                          controls
                          className="w-full rounded-lg"
                          style={{ maxHeight: '500px' }}
                          onError={() => setError('Failed to load video')}
                      >
                          <source src={videoUrl} type="video/mp4" />
                      </video>
                      <a
                          href={videoUrl}
                          download={`video_${Date.now()}.mp4`}
                          className="text-blue-600 hover:text-blue-800 text-sm block mt-2"
                      >
                          Download Video
                      </a>
                  </div>
              );
              setFileKey(Date.now().toString());
          }
          else if (type === 'image') {
              const data = await response.json();
              Object.assign(result, data);
              
              // For SDXL image-to-image, we get the URL immediately
              if (data.image_url) {
                  previewUpdate.image = data.image_url;
                  previewUpdate.sourceImage = URL.createObjectURL(content.image);
                  previewUpdate.metadata = data.metadata || {};
              } 
              // If we need to poll (for async processing)
              else if (data.generation_id) {
                  const pollResult = await pollSDXLResult(data.generation_id, session.access_token);
                  previewUpdate.image = pollResult.image_url;
                  previewUpdate.sourceImage = URL.createObjectURL(content.image);
                  previewUpdate.metadata = pollResult.metadata || {};
              }
          }
          else {
              const data = await response.json();
              Object.assign(result, data);
              previewUpdate.text = data.generated_text || data.text;
              if (data.tokens_used) {
                  previewUpdate.tokens_used = data.tokens_used;
              }
          }
  
          setPreviews(prev => ({ ...prev, ...previewUpdate }));
          setUsage(prev => prev + 1);
  
          return {
              success: true,
              data: result,
              preview: previewUpdate,
              contentType: type
          };
  
      } catch (err) {
          console.error('Generation Error:', err);
          
          const errorMessages = {
              "session": "Please login again",
              "limit_reached": `You've reached your ${userPlan} plan limit`,
              "Invalid ElevenLabs API credentials": "Server configuration issue",
              "401": "Authentication failed",
              "404": "Endpoint not found",
              "422": "Invalid input data",
              "500": "Server error"
          };
  
          const userMessage = errorMessages[err.message] || 
                            err.message || 
                            "Generation failed - please try again";
  
          setError(userMessage);
          return { 
              success: false, 
              error: userMessage,
              status: err.message.includes("status") ? 
                    parseInt(err.message.split("status ")[1]) : 500
          };
      }
  };
  
  const FullscreenPreview = ({ type, content, onClose }) => {
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
                      <video
                          controls
                          autoPlay
                          className="max-w-full max-h-full"
                      >
                          <source src={content} type="video/mp4" />
                      </video>
                  )}
                  <div className="absolute top-4 right-4 flex gap-2">
                      <a
                          href={content}
                          download={`content_${Date.now()}.${type === 'image' ? 'png' : 'mp4'}`}
                          className={`p-2 rounded-full ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}`}
                          title="Download"
                      >
                          <FiDownload />
                      </a>
                      <button 
                          onClick={onClose}
                          className={`p-2 rounded-full ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}`}
                      >
                          <FiMaximize />
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
    
    const AssetThumbnail = ({ asset, darkMode }) => {
        const isImage = asset.type === 'image';
        const isVideo = asset.type === 'video';
        
        return (
            <div className={`group relative rounded-lg overflow-hidden border ${
                darkMode ? 'border-gray-700' : 'border-gray-200'
            }`}>
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
                    <div className={`w-full h-32 flex items-center justify-center ${
                        darkMode ? 'bg-gray-800' : 'bg-gray-100'
                    }`}>
                        <FiFileText className={`w-8 h-8 ${
                            darkMode ? 'text-gray-600' : 'text-gray-400'
                        }`} />
                    </div>
                )}
                <div className={`absolute inset-0 bg-gradient-to-t ${
                    darkMode ? 'from-gray-900/80 to-transparent' : 'from-gray-900/60 to-transparent'
                } opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2`}>
                    <span className={`text-xs truncate w-full ${
                        darkMode ? 'text-gray-300' : 'text-white'
                    }`}>
                        {new Date(asset.createdAt).toLocaleDateString()}
                    </span>
                </div>
            </div>
        );
    };
    
    const DashboardSidebar = ({ userPlan, activeTab, setActiveTab, darkMode }) => {
      const [sidebarOpen, setSidebarOpen] = useState(false);
      const navItems = [
        {
          title: "CREATE",
          items: [
            { id: 'generators', label: 'Content Generators', icon: <Layout size={16} />, available: true },
            { id: 'ffmpeg', label: 'Video Editor', icon: <Book size={16} />, available: ['premium', 'enterprise'].includes(userPlan) },
          ]
        },
        {
          title: "MANAGE",
          items: [
            { id: 'library', label: 'Content Library', icon: <FiFolder size={16} />, available: true },
            { id: 'editor', label: 'Editor', icon: <FiEdit size={16} />, available: ['premium', 'enterprise'].includes(userPlan) },
          ]
        },
        {
          title: "ANALYZE",
          items: [
            { id: 'analytics', label: 'Analytics', icon: <FiBarChart2 size={16} />, available: ['premium', 'enterprise'].includes(userPlan) },
            { id: 'performance', label: 'Performance', icon: <FiTrendingUp size={16} />, available: userPlan === 'enterprise' },
          ]
        }
      ];
    
      return (
        <>
          {/* Mobile menu button */}
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden fixed top-4 left-4 z-30 p-2 rounded-full bg-white/10 backdrop-blur-sm border border-gray-700"
          >
            {sidebarOpen ? (
              <FiX className="w-5 h-5" />
            ) : (
              <FiMenu className="w-5 h-5" />
            )}
          </button>
    
          {/* Sidebar */}
          <div className={`w-64 border-r p-5 flex-col h-full fixed lg:relative z-20 transition-all duration-300 ${
            sidebarOpen ? 'left-0' : '-left-64 lg:left-0'
          } ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-slate-200'}`}>
            <div className="mb-8">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <span className="bg-gradient-to-r from-indigo-600 to-purple-600 text-transparent bg-clip-text">ContentFactory</span>
              </h2>
              <div className={`text-xs font-medium mt-2 px-2 py-1 rounded-full inline-block ${
                userPlan === 'enterprise' ? 'bg-gradient-to-r from-teal-100 to-blue-100 text-teal-800' :
                userPlan === 'premium' ? 'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {userPlan.charAt(0).toUpperCase() + userPlan.slice(1)} Plan
              </div>
            </div>
        
            <nav className="space-y-6 mt-6">
              {navItems.map((section) => (
                <div key={section.title}>
                  <h3 className={`text-xs font-semibold uppercase mb-3 tracking-wider ${
                    darkMode ? 'text-gray-500' : 'text-slate-500'
                  }`}>
                    {section.title}
                  </h3>
                  <div className="space-y-2">
                    {section.items.map((item) => (
                      item.available && (
                        <button
                          key={item.id}
                          onClick={() => {
                            setActiveTab(item.id);
                            setSidebarOpen(false);
                          }}
                          className={`flex items-center w-full py-2.5 px-3 rounded-md font-medium transition-colors text-sm ${
                            activeTab === item.id ? 
                              'bg-gradient-to-r from-indigo-500 to-purple-500 text-white' : 
                              (darkMode ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-slate-50 text-slate-700')
                          }`}
                        >
                          <span className="mr-2">{item.icon}</span>
                          <span>{item.label}</span>
                          {item.id === 'templates' && (
                            <span className={`ml-auto text-xs px-1.5 py-0.5 rounded ${
                              darkMode ? 'bg-blue-900 text-blue-200' : 'bg-emerald-100 text-emerald-700'
                            }`}>
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
        
            <div className="mt-auto pt-6">
              <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-lg p-4 text-white">
                <div className="flex items-center mb-3">
                  <Sparkles size={16} className="mr-2 text-yellow-300" />
                  <span className="font-medium">Premium Features</span>
                </div>
                <p className="text-sm text-indigo-100 mb-3">You've used {usage}/{planLimits[userPlan]} generations this month</p>
                <div className="w-full bg-purple-400 bg-opacity-40 rounded-full h-2 mb-4">
                  <div 
                    className="bg-gradient-to-r from-yellow-300 to-pink-300 h-2 rounded-full" 
                    style={{ width: `${Math.min(100, (usage / planLimits[userPlan]) * 100)}%` }}
                  ></div>
                </div>
                <button className="w-full bg-white text-indigo-600 py-1.5 rounded text-sm font-medium hover:bg-indigo-50 transition-colors">
                  Upgrade Plan
                </button>
              </div>
            </div>
          </div>
    
          {/* Overlay for mobile */}
          {sidebarOpen && (
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 z-10 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}
        </>
      );
    };
    
    const GeneratorCard = ({ type, remaining, onGenerate, userPlan, darkMode }) => {
      const typeConfig = {
          text: {
              icon: <FiFileText className="w-5 h-5" />,
              title: 'Text Generator',
              description: 'Create ad copy, product descriptions, and blog posts',
              examples: ['Ad headline: "Summer Sale 50% Off"', 'Product description', 'Blog post intro'],
              available: true,
              badge: null,
              gradient: 'from-purple-400 to-pink-400',
              buttonGradient: 'from-indigo-500 via-purple-500 to-pink-500',
              iconBg: 'bg-purple-100'
          },
          image: {
            icon: <FiImage className="w-5 h-5" />,
            title: 'Image Transformation',
            description: 'Transform images using AI with text prompts',
            examples: [
                'Make this product photo look professional', 
                'Change background to beach scene',
                'Convert sketch to realistic image'
            ],
            available: true,
            badge: null,
            gradient: 'from-purple-400 to-pink-400',
            buttonGradient: 'from-indigo-500 via-purple-500 to-pink-500',
            iconBg: 'bg-purple-100'
        
          },
          video: {
              icon: <FiVideo className="w-5 h-5" />,
              title: 'Video Creator',
              description: 'Turn images into marketing videos',
              examples: ['Product demo video', 'Social media ad', 'Explainer video'],
              available: true,
              badge: userPlan === 'premium' ? 'Popular' : null,
              gradient: 'from-purple-400 to-pink-400',
              buttonGradient: 'from-indigo-500 via-purple-500 to-pink-500', 
              iconBg: 'bg-purple-100'
          },
          tts: {
              icon: <FiMic className="w-5 h-5" />,
              title: 'Voiceover Studio',
              description: 'Natural sounding AI voice generation',
              examples: ['Video narration', 'Podcast intro', 'Audio ad'],
              available: true,
              badge: 'New',
              gradient: 'from-purple-400 to-pink-400',
              buttonGradient: 'from-indigo-500 via-purple-500 to-pink-500',
              iconBg: 'bg-purple-100'
          }
      };
  
      const config = typeConfig[type];
      
      return (
          <div className={`rounded-lg border overflow-hidden shadow-sm hover:shadow-md transition-shadow group ${
              darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-slate-200'
          }`}>
              {/* Top accent bar - now with lighter purple/pink gradient */}
              <div className={`h-1 bg-gradient-to-r ${config.gradient}`}></div>
              
              <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center">
                          {/* Icon with light purple background */}
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-2 ${
                              darkMode ? 'bg-gray-700' : config.iconBg
                          }`}>
                              {config.icon}
                          </div>
                          <h3 className={`text-sm font-bold ${
                              darkMode ? 'text-white' : 'text-slate-800'
                          }`}>{config.title}</h3>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                          darkMode ? 'bg-gradient-to-r from-indigo-800 via-purple-800 to-pink-800 text-purple-200' : 'bg-gradient-to-r from-indigo-100 via-purple-100 to-pink-100 text-purple-600'
                      }`}>
                          {remaining} remaining
                      </span>
                  </div>
                  
                  <p className={`text-xs mb-3 ${
                      darkMode ? 'text-gray-400' : 'text-slate-600'
                  }`}>{config.description}</p>
                  
                  <div className="mb-3">
                      <p className={`text-xs font-medium mb-1 ${
                          darkMode ? 'text-gray-500' : 'text-slate-500'
                      }`}>EXAMPLE PROMPTS</p>
                      <div className="space-y-1">
                          {config.examples.map((example, i) => (
                              <div key={i} className={`rounded-md p-1.5 text-xs cursor-pointer transition-colors ${
                                  darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 
                                  'bg-purple-50 hover:bg-purple-100 text-slate-700'
                              }`}>
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
                          darkMode={darkMode}
                          buttonGradient={config.buttonGradient}
              />
            ) : (
              <button className={`w-full py-2 rounded-lg text-xs font-medium ${
                darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}>
                Upgrade to {type === 'video' ? 'Premium' : 'Enterprise'} Plan
              </button>
            )}
          </div>
        </div>
      );
    };
    
    return (
      <div className={`flex flex-col min-h-screen ${darkMode ? 'dark bg-gray-950' : 'bg-gradient-to-br from-indigo-50 to-pink-50'}`}>
        {/* Fullscreen Preview Modal */}
        {fullscreenPreview && (
          <FullscreenPreview 
            type={fullscreenPreview.type} 
            content={fullscreenPreview.content} 
            onClose={() => setFullscreenPreview(null)} 
          />
        )}
    
        {/* Header */}
        <header className={`border-b px-4 py-3 flex flex-col sm:flex-row justify-between items-center sticky top-0 z-10 shadow-sm ${
          darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center mb-2 sm:mb-0 w-full sm:w-auto justify-between">
            <div className="flex items-center">
              <button 
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-full mr-2"
              >
                {sidebarOpen ? (
                  <FiX className="w-5 h-5" />
                ) : (
                  <FiMenu className="w-5 h-5" />
                )}
              </button>
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-transparent bg-clip-text font-bold text-lg mr-3">ContentFactory</div>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                userPlan === 'enterprise' ? 'bg-gradient-to-r from-teal-600 to-blue-600 text-white' :
                userPlan === 'premium' ? 'bg-gradient-to-r from-violet-600 to-pink-600 text-white' :
                'bg-gray-200 text-gray-800'
              }`}>
                {userPlan.charAt(0).toUpperCase() + userPlan.slice(1)}
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-2 w-full sm:w-auto justify-between sm:justify-end">
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-full ${darkMode ? 'bg-gray-800 text-yellow-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}
            >
              {darkMode ? <FiSun size={18} /> : <FiMoon size={18} />}
            </button>
            <button className={`p-2 rounded-full ${darkMode ? 'text-gray-300 hover:bg-gray-800' : 'text-slate-500 hover:bg-slate-100'} transition-colors relative`}>
              <Bell size={18} />
              <span className="absolute top-0 right-0 w-2 h-2 bg-pink-500 rounded-full"></span>
            </button>
            <button className={`p-2 rounded-full ${darkMode ? 'text-gray-300 hover:bg-gray-800' : 'text-slate-500 hover:bg-slate-100'} transition-colors`}>
              <Settings size={18} />
            </button>
            <button className={`p-2 rounded-full ${darkMode ? 'bg-gray-800 text-gray-300' : 'bg-gradient-to-r from-violet-100 to-fuchsia-100 text-purple-700'} hover:opacity-90 transition-opacity`}>
              <User size={18} />
            </button>
            <button 
              onClick={handleLogout}
              className={`px-3 py-1 rounded-md ${darkMode ? 'bg-gray-800 text-red-400 hover:bg-gray-700' : 'bg-red-50 text-red-600 hover:bg-red-100'} transition-colors flex items-center text-sm font-medium`}
            >
              <LogOut size={16} className="mr-1" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>
    
        <div className="flex flex-1">
          {/* Sidebar */}
          <DashboardSidebar 
            userPlan={userPlan} 
            activeTab={activeTab} 
            setActiveTab={setActiveTab} 
            darkMode={darkMode} 
          />
        
         {/* Main Content */}
<main className={`flex-1 p-4 overflow-auto mt-16 lg:mt-0 ${
darkMode ? 'bg-gray-950' : 'bg-gradient-to-br from-indigo-50 to-pink-50'
}`}>
{/* Welcome Banner */}
<div className={`rounded-lg mb-4 p-4 flex flex-col sm:flex-row justify-between items-center shadow-md ${
  userPlan === 'enterprise' ? 'bg-gradient-to-r from-teal-600 to-blue-600' :
  userPlan === 'premium' ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600' :
  'bg-gradient-to-r from-indigo-600 to-indigo-700'
} text-white`}>
  <div className="mb-3 sm:mb-0">
    <h2 className="text-lg font-bold mb-1">Welcome back!</h2>
    <p className="text-xs text-purple-100">Generate amazing content with just a few clicks</p>
  </div>
  <button className="bg-white bg-opacity-20 backdrop-blur-sm text-white border border-white border-opacity-30 px-3 py-1.5 rounded-md text-xs font-medium hover:bg-opacity-30 transition-colors flex items-center">
    Quick Tutorial
    <ChevronRight size={14} className="ml-1" />
  </button>
</div>

  {/* Usage Stats - All Four Cards */}
  <div className="grid grid-cols-2 gap-3 mb-4">
    {/* Text Generated */}
    <div className={`p-3 rounded-lg border shadow-sm hover:shadow-md transition-shadow ${
      darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-slate-200'
    }`}>
      <div className="flex items-center justify-between mb-1">
        <span className={`text-xs font-medium ${
          darkMode ? 'text-gray-400' : 'text-slate-500'
        }`}>Text Generated</span>
        <FiFileText size={14} className="text-indigo-500" />
      </div>
      <p className={`text-lg font-bold ${
        darkMode ? 'text-indigo-400' : 'text-indigo-600'
      }`}>0</p>
      <p className={`text-xs ${
        darkMode ? 'text-gray-500' : 'text-slate-500'
      }`}>Last 30 days</p>
    </div>

    {/* Images Created */}
    <div className={`p-3 rounded-lg border shadow-sm hover:shadow-md transition-shadow ${
      darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-slate-200'
    }`}>
      <div className="flex items-center justify-between mb-1">
        <span className={`text-xs font-medium ${
          darkMode ? 'text-gray-400' : 'text-slate-500'
        }`}>Images Created</span>
        <FiImage size={14} className="text-purple-500" />
      </div>
      <p className={`text-lg font-bold ${
        darkMode ? 'text-purple-400' : 'text-purple-600'
      }`}>0</p>
      <p className={`text-xs ${
        darkMode ? 'text-gray-500' : 'text-slate-500'
      }`}>Last 30 days</p>
    </div>

    {/* Videos Generated */}
    <div className={`p-3 rounded-lg border shadow-sm hover:shadow-md transition-shadow ${
      darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-slate-200'
    }`}>
      <div className="flex items-center justify-between mb-1">
        <span className={`text-xs font-medium ${
          darkMode ? 'text-gray-400' : 'text-slate-500'
        }`}>Videos Generated</span>
        <FiVideo size={14} className="text-pink-500" />
      </div>
      <p className={`text-lg font-bold ${
        darkMode ? 'text-pink-400' : 'text-pink-600'
      }`}>0</p>
      <p className={`text-xs ${
        darkMode ? 'text-gray-500' : 'text-slate-500'
      }`}>Last 30 days</p>
    </div>

    {/* Voice Clips */}
    <div className={`p-3 rounded-lg border shadow-sm hover:shadow-md transition-shadow ${
      darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-slate-200'
    }`}>
      <div className="flex items-center justify-between mb-1">
        <span className={`text-xs font-medium ${
          darkMode ? 'text-gray-400' : 'text-slate-500'
        }`}>Voice Clips</span>
        <FiMic size={14} className="text-emerald-500" />
      </div>
      <p className={`text-lg font-bold ${
        darkMode ? 'text-emerald-400' : 'text-emerald-600'
      }`}>0</p>
      <p className={`text-xs ${
        darkMode ? 'text-gray-500' : 'text-slate-500'
      }`}>Last 30 days</p>
    
                </div>
                {/* Repeat similar structure for other stats cards */}
              </div>
      
              {activeTab === 'generators' && (
  <div className="space-y-6">
    {/* Generators Grid */}
    <div className="space-y-6">
      <div>
        <h2 className={`text-lg font-bold mb-4 flex items-center ${
          darkMode ? 'text-white' : 'text-slate-800'
        }`}>
          Content Generators
          <span className="ml-2 text-xs bg-gradient-to-r from-indigo-100 to-purple-100 text-purple-700 px-2 py-0.5 rounded-full">All Features</span>
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <GeneratorCard 
            type="text" 
            remaining={planLimits[userPlan] - usage} 
            onGenerate={handleGeneration}
            userPlan={userPlan}
            darkMode={darkMode}
          />
          <GeneratorCard 
            type="image" 
            remaining={planLimits[userPlan] - usage} 
            onGenerate={handleGeneration}
            userPlan={userPlan}
            darkMode={darkMode}
          />
          <GeneratorCard 
            type="video" 
            remaining={planLimits[userPlan] - usage} 
            onGenerate={handleGeneration}
            userPlan={userPlan}
            darkMode={darkMode}
          />
          <GeneratorCard 
            type="tts" 
            remaining={planLimits[userPlan] - usage} 
            onGenerate={handleGeneration}
            userPlan={userPlan}
            darkMode={darkMode}
          />
        </div>
      </div>
    </div>

    {/* Recent Activity Section */}
    <div className={`rounded-lg border ${
      darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-slate-200'
    } p-4`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className={`text-lg font-bold ${
          darkMode ? 'text-white' : 'text-slate-800'
        }`}>Recent Activity</h2>
        <button className={`text-xs font-medium ${
          darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'
        }`}>View All</button>
      </div>
      
      {editableAssets.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {editableAssets.slice(0, 4).map(asset => (
            <div key={asset.id} className={`rounded-lg border overflow-hidden shadow-sm hover:shadow-md transition-shadow ${
              darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-slate-200'
            }`}>
              <div className={`h-24 ${
                darkMode ? 'bg-gray-700' : 'bg-slate-100'
              } flex items-center justify-center`}>
                {asset.type === 'image' ? (
                  <img 
                    src={asset.content} 
                    className="w-full h-full object-cover"
                    alt="Generated content"
                  />
                ) : asset.type === 'video' ? (
                  <video className="w-full h-full object-cover">
                    <source src={asset.content} type="video/mp4" />
                  </video>
                ) : (
                  <FiFileText className={`w-6 h-6 ${
                    darkMode ? 'text-gray-500' : 'text-slate-400'
                  }`} />
                )}
              </div>
              <div className="p-2">
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-medium ${
                    darkMode ? 'text-gray-300' : 'text-slate-700'
                  }`}>
                    {asset.type === 'image' ? 'Generated Image' : 
                     asset.type === 'video' ? 'Generated Video' : 
                     'Generated Content'}
                  </span>
                  <span className={`text-xs ${
                    darkMode ? 'text-gray-500' : 'text-slate-500'
                  }`}>
                    {new Date(asset.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={`py-6 text-center ${
          darkMode ? 'text-gray-500' : 'text-slate-400'
        }`}>
          No recent activity yet
        </div>
      )}
    </div>
  </div>
)}

{activeTab === 'library' && (
  <div className={`rounded-lg border ${
    darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-slate-200'
  }`}>
    <div className="p-4">
      <h2 className={`text-lg font-bold mb-4 ${
        darkMode ? 'text-white' : 'text-slate-800'
      }`}>Content Library</h2>
      
      <div className="space-y-4">
        {previews.text && (
          <div className={`p-3 rounded-lg border ${
            darkMode ? 'bg-gray-800 border-gray-700' : 'bg-slate-50 border-slate-200'
          }`}>
            <h3 className={`text-xs font-medium mb-2 ${
              darkMode ? 'text-gray-300' : 'text-slate-600'
            }`}>Generated Text</h3>
            <div className={`prose max-w-none text-sm ${
              darkMode ? 'prose-invert' : ''
            }`}>
              <ReactMarkdown>
                {previews.text}
              </ReactMarkdown>
            </div>
          </div>
        )}
        
        {previews.image && (
          <div className={`p-3 rounded-lg border ${
              darkMode ? 'bg-gray-800 border-gray-700' : 'bg-slate-50 border-slate-200'
          }`}>
              <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                      <h3 className={`text-xs font-medium mb-2 ${
                          darkMode ? 'text-gray-300' : 'text-slate-600'
                      }`}>Original Image</h3>
                      <img 
                          src={previews.sourceImage} 
                          className="rounded-lg w-full h-auto max-h-64 object-contain" 
                          alt="Source content" 
                      />
                  </div>
                  <div>
                      <div className="flex justify-between items-center mb-2">
                          <h3 className={`text-xs font-medium ${
                              darkMode ? 'text-gray-300' : 'text-slate-600'
                          }`}>Transformed Image</h3>
                          <div className="flex gap-1">
                              <a
                                  href={previews.image}
                                  download={`transformed_${Date.now()}.png`}
                                  className={`p-1 rounded ${
                                      darkMode ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-slate-200 text-slate-800 hover:bg-slate-300'
                                  }`}
                                  title="Download"
                              >
                                  <FiDownload className="w-3 h-3" />
                              </a>
                              <button
                                  onClick={() => setFullscreenPreview({ type: 'image', content: previews.image })}
                                  className={`p-1 rounded ${
                                      darkMode ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-slate-200 text-slate-800 hover:bg-slate-300'
                                  }`}
                                  title="Fullscreen"
                              >
                                  <FiMaximize className="w-3 h-3" />
                              </button>
                          </div>
                      </div>
                      <img 
                          src={previews.image} 
                          className="rounded-lg w-full h-auto max-h-64 object-contain" 
                          alt="Generated content" 
                      />
                      {previews.metadata && (
                          <div className={`mt-2 text-xs ${
                              darkMode ? 'text-gray-400' : 'text-slate-500'
                          }`}>
                              <p>Prompt: {previews.metadata.prompt}</p>
                              <p>Seed: {previews.metadata.seed || 'random'}</p>
                              <p>Strength: {previews.metadata.image_strength}</p>
                          </div>
                      )}
                  </div>
              </div>
          </div>
        )}
        
        {previews.video && (
          <div className={`p-3 rounded-lg border ${
            darkMode ? 'bg-gray-800 border-gray-700' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex justify-between items-center mb-2">
              <h3 className={`text-xs font-medium ${
                darkMode ? 'text-gray-300' : 'text-slate-600'
              }`}>Generated Video</h3>
              <div className="flex gap-1">
                <a
                  href={previews.video}
                  download={`video_${Date.now()}.mp4`}
                  className={`p-1 rounded ${
                    darkMode ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-slate-200 text-slate-800 hover:bg-slate-300'
                  }`}
                  title="Download"
                >
                  <FiDownload className="w-3 h-3" />
                </a>
                <button
                  onClick={() => setFullscreenPreview({ type: 'video', content: previews.video })}
                  className={`p-1 rounded ${
                    darkMode ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-slate-200 text-slate-800 hover:bg-slate-300'
                  }`}
                  title="Fullscreen"
                >
                  <FiMaximize className="w-3 h-3" />
                </button>
              </div>
            </div>
            <video
              controls
              className="w-full rounded-lg"
            >
              <source src={previews.video} type="video/mp4" />
            </video>
          </div>
        )}
        
        {previews.audio && (
          <div className={`p-3 rounded-lg border ${
            darkMode ? 'bg-gray-800 border-gray-700' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex justify-between items-center mb-2">
              <h3 className={`text-xs font-medium ${
                darkMode ? 'text-gray-300' : 'text-slate-600'
              }`}>Generated Audio</h3>
              <a
                href={previews.audio}
                download={`audio_${Date.now()}.mp3`}
                className={`p-1 rounded ${
                  darkMode ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-slate-200 text-slate-800 hover:bg-slate-300'
                }`}
                title="Download"
              >
                <FiDownload className="w-3 h-3" />
              </a>
            </div>
            {previews.audioElement}
          </div>
        )}
        
        {!previews.text && !previews.image && !previews.video && !previews.audio && (
          <div className={`p-6 text-center rounded-lg border ${
            darkMode ? 'bg-gray-800 border-gray-700' : 'bg-slate-50 border-slate-200'
          }`}>
            Content preview will appear here after generation
          </div>
        )}
      </div>
    </div>
  </div>
)}

{activeTab === 'editor' && (
  <div className={`rounded-lg border ${
    darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-slate-200'
  } p-4`}>
    <h2 className={`text-lg font-bold mb-4 ${
      darkMode ? 'text-white' : 'text-slate-800'
    }`}>Editing Tools</h2>
    
    <div className="grid gap-4 md:grid-cols-2">
      <div className={`p-3 rounded-lg border ${
        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-slate-200'
      }`}>
        <h3 className={`text-md font-semibold mb-2 ${
          darkMode ? 'text-white' : 'text-slate-900'
        }`}>Content Editor</h3>
        {currentUser && (
          <CloudinaryEditor 
            plan={userPlan} 
            userId={currentUser.id}
            darkMode={darkMode}
            onEditComplete={(editedAsset) => {
              if (previews.image === editedAsset.originalUrl) {
                setPreviews(prev => ({
                  ...prev,
                  image: editedAsset.url
                }));
              }
              setEditableAssets(prev => 
                prev.map(asset => 
                  asset.content === editedAsset.originalUrl 
                    ? { ...asset, content: editedAsset.url } 
                    : asset
                )
              );
              toast.success('Image edited successfully!');
            }}
            onEditStart={(assetUrl) => {
              setPreviews(prev => ({
                ...prev,
                image: assetUrl
              }));
            }}
          />
        )}
        <div className="mt-3">
          <h4 className={`text-xs font-medium mb-1 ${
            darkMode ? 'text-gray-300' : 'text-slate-600'
          }`}>Your Editable Content</h4>
          <div className="grid grid-cols-2 gap-2">
            {editableAssets.slice(0, 4).map(asset => (
              <div key={asset.id} className="relative group">
                <img 
                  src={asset.content} 
                  className="rounded-md w-full h-16 object-cover cursor-pointer hover:opacity-80"
                  alt="Editable content"
                  onClick={() => setPreviews(prev => ({
                    ...prev,
                    image: asset.content
                  }))}
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setPreviews(prev => ({
                      ...prev,
                      image: asset.content
                    }));
                    if (window.cloudinaryEditor) {
                      window.cloudinaryEditor.openEditor(asset.content);
                    }
                  }}
                  className={`absolute bottom-1 right-1 p-1 rounded-full text-xs ${
                    darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-white hover:bg-gray-100'
                  } shadow-sm opacity-0 group-hover:opacity-100 transition-opacity`}
                >
                  ✏️
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className={`p-3 rounded-lg border ${
        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-slate-200'
      }`}>
        <h3 className={`text-md font-semibold mb-2 ${
          darkMode ? 'text-white' : 'text-slate-900'
        }`}>Social Integrations</h3>
        <button className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
          darkMode ? 'bg-blue-800 text-blue-100 hover:bg-blue-700' : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
        }`}>
          Connect Accounts
        </button>
      </div>
    </div>
  </div>
)}

{activeTab === 'ffmpeg' && (
  <div className={`rounded-lg border ${
    darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-slate-200'
  } p-4`}>
    <h2 className={`text-lg font-bold mb-4 ${
      darkMode ? 'text-white' : 'text-slate-800'
    }`}>Video Editor</h2>
    
    <div className="space-y-4">
      {!ffmpeg ? (
        <div className={`p-4 text-center rounded-lg ${
          darkMode ? 'bg-gray-800' : 'bg-gray-100'
        }`}>
          Loading FFmpeg engine...
        </div>
      ) : (
        <>
          <form onSubmit={handleFileUpload} className="space-y-4">
            <div>
              <label className={`block text-sm font-medium mb-1 ${
                darkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Video File
              </label>
              <input 
                type="file" 
                name="video"
                accept="video/*"
                className={`block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold ${
                  darkMode ? 
                    'file:bg-gray-700 file:text-white hover:file:bg-gray-600 bg-gray-800 text-gray-300' : 
                    'file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 bg-white text-gray-700'
                }`}
                required
              />
            </div>
            
            <div>
              <label className={`block text-sm font-medium mb-1 ${
                darkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Audio File (Voice/Music)
              </label>
              <input 
                type="file" 
                name="audio"
                accept="audio/*"
                className={`block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold ${
                  darkMode ? 
                    'file:bg-gray-700 file:text-white hover:file:bg-gray-600 bg-gray-800 text-gray-300' : 
                    'file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 bg-white text-gray-700'
                }`}
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={ffmpegLoading}
              className={`w-full py-2 px-4 rounded-md font-medium ${
                ffmpegLoading ? 
                  'bg-gray-300 cursor-not-allowed' : 
                  'bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-600 hover:to-purple-600'
              }`}
            >
              {ffmpegLoading ? `Processing... ${ffmpegProgress}%` : 'Merge Video & Audio'}
            </button>
          </form>
          
          {mergedVideoUrl && (
            <div className={`mt-4 p-3 rounded-lg border ${
              darkMode ? 'bg-gray-800 border-gray-700' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex justify-between items-center mb-2">
                <h3 className={`text-sm font-medium ${
                  darkMode ? 'text-gray-300' : 'text-slate-600'
                }`}>Result</h3>
                <a
                  href={mergedVideoUrl}
                  download={`edited-video-${Date.now()}.mp4`}
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    darkMode ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-slate-200 text-slate-800 hover:bg-slate-300'
                  }`}
                >
                  <FiDownload className="inline mr-1" /> Download
                </a>
              </div>
              <video
                controls
                className="w-full rounded-lg"
                src={mergedVideoUrl}
              />
            </div>
          )}
        </>
      )}
    </div>
  </div>
)}
            </main>
          </div>
        </div>
      );
    }

export default UserDashboard;