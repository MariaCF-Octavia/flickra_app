// components/GenerateBackground.jsx - FIXED VERSION
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from 'react-toastify';
import { 
  FiImage, FiUpload, FiPlay, FiDownload, FiMaximize, FiX, 
  FiCheck, FiClock, FiAlertCircle, FiRefreshCw, FiEye, FiInfo,
  FiZap, FiCamera, FiLayers, FiScissors, FiPlus
} from 'react-icons/fi';
import { RiMagicLine, RiSparklingFill, RiPaletteLine } from 'react-icons/ri';
import supabase from "../supabaseClient";

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://fastapi-app-production-ac48.up.railway.app';

const GenerateBackground = ({ userPlan, usage, onUsageUpdate }) => {
  // State management
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedImagePreview, setSelectedImagePreview] = useState(null);
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('professional');
  const [resolution, setResolution] = useState('1024x1024');
  const [removeBackground, setRemoveBackground] = useState(true);
  const [autoPosition, setAutoPosition] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [jobId, setJobId] = useState(null);
  const [generationStatus, setGenerationStatus] = useState(null);
  const [fullscreenImage, setFullscreenImage] = useState(null);
  const [showInfoModal, setShowInfoModal] = useState(false);
  
  const fileInputRef = useRef(null);
  const pollInterval = useRef(null);
  const componentMounted = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    componentMounted.current = true;
    return () => {
      componentMounted.current = false;
      if (pollInterval.current) {
        clearInterval(pollInterval.current);
        pollInterval.current = null;
      }
    };
  }, []);

  // Token retrieval function with better error handling
  const getAuthToken = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        console.log('🔑 Got token from Supabase session');
        return session.access_token;
      }

      const tokenKeys = [
        'sb-afyuizwemllouyulpkir-auth-token',
        'supabase.auth.token', 
        'sb-access-token',
        'supabase-auth-token'
      ];
      
      for (const key of tokenKeys) {
        const stored = localStorage.getItem(key);
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (parsed.access_token) {
              console.log(`🔑 Got token from localStorage key: ${key}`);
              return parsed.access_token;
            }
          } catch {
            if (stored.length > 20) {
              console.log(`🔑 Got raw token from localStorage key: ${key}`);
              return stored;
            }
          }
        }
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        console.log('🔑 User found but no token - attempting refresh');
        const { data: { session: newSession }, error } = await supabase.auth.refreshSession();
        if (newSession?.access_token && !error) {
          return newSession.access_token;
        }
      }

      throw new Error('No valid authentication token found');
    } catch (error) {
      console.error('Token retrieval error:', error);
      throw error;
    }
  };

  // Enhanced style options with better descriptions
  const styleOptions = [
    { 
      value: 'professional', 
      label: 'Professional', 
      description: 'Clean, business-focused environments perfect for corporate presentations',
      icon: '💼'
    },
    { 
      value: 'lifestyle', 
      label: 'Lifestyle', 
      description: 'Natural, everyday settings that show products in real-life contexts',
      icon: '🏠'
    },
    { 
      value: 'studio', 
      label: 'Studio', 
      description: 'Minimalist studio setups with professional lighting and clean aesthetics',
      icon: '📸'
    },
    { 
      value: 'artistic', 
      label: 'Artistic', 
      description: 'Creative, visually striking environments with unique artistic appeal',
      icon: '🎨'
    },
    { 
      value: 'minimal', 
      label: 'Minimal', 
      description: 'Simple, uncluttered backgrounds that highlight your product',
      icon: '✨'
    },
    { 
      value: 'creative', 
      label: 'Creative', 
      description: 'Bold, imaginative settings designed for standout marketing campaigns',
      icon: '🚀'
    }
  ];

  // Resolution options
  const resolutionOptions = [
    { value: '1024x1024', label: '1024×1024', description: 'Square format - Perfect for Instagram, social media posts' },
    { value: '1280x720', label: '1280×720', description: 'Landscape HD - Ideal for websites, presentations, YouTube thumbnails' },
    { value: '1920x1080', label: '1920×1080', description: 'Full HD - High-resolution for print, large displays, professional marketing' }
  ];

  // Example prompts for inspiration
  const examplePrompts = [
    "Modern minimalist kitchen with marble countertops and warm natural lighting",
    "Cozy living room with soft throw pillows and golden hour sunlight streaming through windows",
    "Professional office desk with green plants and contemporary decor elements",
    "Rustic wooden dining table in a bright, airy garden setting with soft shadows",
    "Elegant spa environment with natural stone textures and calming ambient lighting",
    "Vibrant outdoor picnic scene with fresh green grass and clear blue sky background"
  ];

  // File upload handler
  const handleImageUpload = useCallback((event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be smaller than 10MB');
      return;
    }

    setSelectedImage(file);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      setSelectedImagePreview(e.target.result);
    };
    reader.readAsDataURL(file);
  }, []);

  // Upload image to get URL
  const uploadImageToSupabase = async (file) => {
    try {
      const fileName = `temp/${Date.now()}_${file.name}`;
      const { data, error } = await supabase.storage
        .from('images')
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Upload error:', error);
      throw new Error('Failed to upload image');
    }
  };

  // Poll for generation status with better state management
  const pollGenerationStatus = useCallback(async (jobId) => {
    // Don't poll if component is unmounted
    if (!componentMounted.current) {
      return;
    }

    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE}/background-status/${jobId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          console.error('Authentication failed during status check');
          // Don't redirect, just show error
          if (componentMounted.current) {
            toast.error('Session expired. Please refresh and try again.');
            setIsGenerating(false);
            setGenerationStatus('failed');
          }
          return;
        }
        throw new Error(`Status check failed: ${response.status}`);
      }

      const data = await response.json();
      console.log('📊 Status response:', data);
      
      // Only update state if component is still mounted
      if (!componentMounted.current) {
        return;
      }
      
      setGenerationStatus(data.status);

      if (data.status === 'completed') {
        let imageUrl = null;
        
        // Try multiple fields for the image URL
        if (data.image_url) {
          imageUrl = data.image_url;
          console.log('✅ Got image URL from image_url field:', imageUrl);
        } else if (data.result_url) {
          imageUrl = data.result_url;
          console.log('✅ Got image URL from result_url field:', imageUrl);
        } else if (data.metadata?.final_image_url) {
          imageUrl = data.metadata.final_image_url;
          console.log('✅ Got image URL from metadata:', imageUrl);
        } else if (data.url) {
          imageUrl = data.url;
          console.log('✅ Got image URL from url field:', imageUrl);
        } else {
          // Check for any field that looks like a URL
          const urlFields = ['final_url', 'generated_url', 'output_url', 'file_url'];
          for (const field of urlFields) {
            if (data[field] && typeof data[field] === 'string' && data[field].includes('http')) {
              imageUrl = data[field];
              console.log(`✅ Got image URL from ${field}:`, imageUrl);
              break;
            }
          }
        }

        if (imageUrl && componentMounted.current) {
          // Validate the image URL before setting it
          const img = new Image();
          img.onload = () => {
            if (componentMounted.current) {
              setGeneratedImage(imageUrl);
              setIsGenerating(false);
              
              // Show success with generation type info
              const generationType = data.metadata?.generation_type || 'unknown';
              if (generationType === 'scene_generation') {
                toast.success('🎨 Scene created successfully! Your product now has a beautiful new environment.');
              } else {
                toast.success('✂️ Background removed successfully! Clean product image ready.');
              }
              
              if (onUsageUpdate) {
                onUsageUpdate();
              }
            }
          };
          
          img.onerror = () => {
            console.error('Generated image URL is not valid:', imageUrl);
            if (componentMounted.current) {
              toast.error('Generated image could not be loaded. Please try again.');
              setIsGenerating(false);
              setGenerationStatus('failed');
            }
          };
          
          img.src = imageUrl;
          
          // Clear polling interval
          if (pollInterval.current) {
            clearInterval(pollInterval.current);
            pollInterval.current = null;
          }
        } else {
          console.error('❌ No valid image URL found in response:', data);
          if (componentMounted.current) {
            toast.error('Generation completed but no image was returned. Please try again.');
            setIsGenerating(false);
            setGenerationStatus('failed');
          }
          
          if (pollInterval.current) {
            clearInterval(pollInterval.current);
            pollInterval.current = null;
          }
        }
      } else if (data.status === 'failed') {
        if (componentMounted.current) {
          setIsGenerating(false);
          setGenerationStatus('failed');
          toast.error(data.error || 'Background generation failed. Please try again.');
        }
        
        if (pollInterval.current) {
          clearInterval(pollInterval.current);
          pollInterval.current = null;
        }
      }
    } catch (error) {
      console.error('Status check error:', error);
      if (componentMounted.current) {
        // Don't show error for every poll attempt, only if it's a persistent issue
        if (error.message.includes('Authentication') || error.message.includes('token')) {
          toast.error('Session expired. Please refresh and try again.');
          setIsGenerating(false);
          setGenerationStatus('failed');
        }
        // Don't show network errors as they might be temporary
      }
    }
  }, [onUsageUpdate]);

  // Start background generation with better error handling
  const handleGenerate = async () => {
    if (!selectedImage) {
      toast.error('Please select a product image');
      return;
    }

    const remaining = usage?.remaining || 0;
    if (userPlan !== 'enterprise' && remaining <= 0) {
      toast.error('No credits remaining. Please upgrade your plan.');
      return;
    }

    // Clear any previous results
    setGeneratedImage(null);
    setJobId(null);
    setGenerationStatus(null);
    setIsGenerating(true);
    
    try {
      // Upload image first
      setGenerationStatus('uploading');
      const imageUrl = await uploadImageToSupabase(selectedImage);
      
      if (!componentMounted.current) {
        return; // Component unmounted during upload
      }
      
      const token = await getAuthToken();
      
      console.log('🚀 Starting creative studio processing with prompt:', prompt);
      
      setGenerationStatus('processing');
      
      const requestBody = {
        imageUrl,
        prompt: prompt.trim(),
        style,
        removeBackground,
        autoPosition,
        resolution
      };
      
      console.log('📤 Sending request:', requestBody);
      
      const response = await fetch(`${API_BASE}/api/generate-background`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!componentMounted.current) {
        return; // Component unmounted during request
      }

      if (!response.ok) {
        let errorMessage = `Request failed with status ${response.status}`;
        
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail?.message || errorData.message || errorMessage;
        } catch (e) {
          console.warn('Could not parse error response:', e);
        }
        
        if (response.status === 401) {
          errorMessage = 'Session expired. Please refresh the page and log in again.';
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('🎯 Generation started:', data);
      
      if (!data.job_id) {
        throw new Error('No job ID returned from server');
      }
      
      setJobId(data.job_id);
      setGenerationStatus('processing');
      
      toast.success('🎨 Creative studio processing started! This may take 30-60 seconds...');
      
      // Start polling for status
      const startPolling = () => {
        if (!componentMounted.current) return;
        
        pollGenerationStatus(data.job_id);
        pollInterval.current = setInterval(() => {
          if (componentMounted.current) {
            pollGenerationStatus(data.job_id);
          } else {
            // Component unmounted, clear interval
            if (pollInterval.current) {
              clearInterval(pollInterval.current);
              pollInterval.current = null;
            }
          }
        }, 3000); // Poll every 3 seconds instead of 2 to reduce server load
      };
      
      startPolling();

    } catch (error) {
      console.error('Generation error:', error);
      
      if (componentMounted.current) {
        setIsGenerating(false);
        setGenerationStatus('failed');
        
        if (error.message.includes('Session expired') || error.message.includes('Authentication')) {
          toast.error('Please refresh the page and log in again.');
        } else {
          toast.error(error.message || 'Failed to start generation. Please try again.');
        }
      }
    }
  };

  // Reset form
  const handleReset = () => {
    // Clear polling interval first
    if (pollInterval.current) {
      clearInterval(pollInterval.current);
      pollInterval.current = null;
    }
    
    setSelectedImage(null);
    setSelectedImagePreview(null);
    setPrompt('');
    setStyle('professional');
    setResolution('1024x1024');
    setRemoveBackground(true);
    setAutoPosition(true);
    setGeneratedImage(null);
    setJobId(null);
    setGenerationStatus(null);
    setIsGenerating(false);
  };

  // Enhanced status display
  const StatusDisplay = () => {
    if (!generationStatus) return null;

    const statusConfig = {
      uploading: { 
        icon: <FiUpload />, 
        text: 'Uploading your product image...', 
        color: 'text-blue-400',
        description: 'Preparing your image for creative processing'
      },
      processing: { 
        icon: <FiRefreshCw className="animate-spin" />, 
        text: 'Creating your perfect scene...', 
        color: 'text-indigo-400',
        description: 'Analyzing your product and crafting the ideal background environment'
      },
      completed: { 
        icon: <FiCheck />, 
        text: 'Creation complete!', 
        color: 'text-green-400',
        description: 'Your professional product photo is ready!'
      },
      failed: { 
        icon: <FiAlertCircle />, 
        text: 'Generation failed', 
        color: 'text-red-400',
        description: 'Something went wrong, please try again'
      }
    };

    const config = statusConfig[generationStatus] || statusConfig.processing;

    return (
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-3 p-6 bg-slate-800/30 rounded-xl border border-slate-700/50">
          <div className={`${config.color} text-2xl`}>{config.icon}</div>
          <div className="text-left">
            <div className={`font-medium ${config.color} text-lg`}>{config.text}</div>
            <div className="text-slate-400 text-sm">{config.description}</div>
          </div>
        </div>
        {jobId && (
          <div className="text-slate-500 text-xs">
            Job ID: {jobId.substring(0, 8)}...
          </div>
        )}
      </div>
    );
  };

  // Info Modal Component
  const InfoModal = () => {
    if (!showInfoModal) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
        <div className="relative max-w-3xl w-full bg-slate-900 rounded-2xl border border-slate-700 p-6 max-h-[90vh] overflow-y-auto">
          <button
            onClick={() => setShowInfoModal(false)}
            className="absolute top-4 right-4 p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            <FiX size={20} />
          </button>
          
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white mb-2 flex items-center space-x-2">
              <RiPaletteLine className="text-indigo-400" />
              <span>Creative Studio</span>
            </h2>
            <p className="text-slate-300">Professional product photography made simple with intelligent background processing</p>
          </div>

          <div className="space-y-6">
            {/* What We Do Section */}
            <div>
              <h3 className="font-semibold text-white mb-4 text-lg">🎯 What Creative Studio Does</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-800/50 rounded-xl p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <FiScissors className="text-red-400" size={20} />
                    <h4 className="font-semibold text-white">Smart Background Removal</h4>
                  </div>
                  <p className="text-slate-300 text-sm mb-2">Automatically detects and removes existing backgrounds from your product images</p>
                  <div className="bg-slate-700/30 rounded p-2 text-xs text-slate-400">
                    <strong>When:</strong> Always happens first to ensure clean product isolation
                  </div>
                </div>
                
                <div className="bg-slate-800/50 rounded-xl p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <FiPlus className="text-green-400" size={20} />
                    <h4 className="font-semibold text-white">Scene Creation</h4>
                  </div>
                  <p className="text-slate-300 text-sm mb-2">Generates photorealistic environments based on your description</p>
                  <div className="bg-slate-700/30 rounded p-2 text-xs text-slate-400">
                    <strong>When:</strong> After removal, when you provide a scene description
                  </div>
                </div>
              </div>
            </div>

            {/* Processing Flow */}
            <div>
              <h3 className="font-semibold text-white mb-4 text-lg">🔄 How Processing Works</h3>
              <div className="space-y-3">
                <div className="flex items-start space-x-3 p-3 bg-slate-800/30 rounded-lg">
                  <div className="bg-blue-500 text-white rounded-full w-6 h-6 text-xs flex items-center justify-center mt-0.5">1</div>
                  <div>
                    <p className="text-white font-medium">Background Analysis & Removal</p>
                    <p className="text-slate-400 text-sm">System analyzes your image and intelligently removes the existing background, leaving just your product</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3 p-3 bg-slate-800/30 rounded-lg">
                  <div className="bg-purple-500 text-white rounded-full w-6 h-6 text-xs flex items-center justify-center mt-0.5">2</div>
                  <div>
                    <p className="text-white font-medium">Scene Generation (If Description Provided)</p>
                    <p className="text-slate-400 text-sm">Creates a new photorealistic environment based on your text description</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3 p-3 bg-slate-800/30 rounded-lg">
                  <div className="bg-green-500 text-white rounded-full w-6 h-6 text-xs flex items-center justify-center mt-0.5">3</div>
                  <div>
                    <p className="text-white font-medium">Smart Product Placement</p>
                    <p className="text-slate-400 text-sm">Intelligently positions your product in the new scene with proper lighting, shadows, and perspective</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Two Modes */}
            <div>
              <h3 className="font-semibold text-white mb-4 text-lg">📸 Two Creation Modes</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-slate-600 rounded-xl p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <FiScissors className="text-orange-400" />
                    <h4 className="font-semibold text-white">Background Removal Only</h4>
                  </div>
                  <p className="text-slate-300 text-sm mb-3">Perfect when you want a clean product cutout for your own designs</p>
                  <div className="bg-slate-800/50 rounded p-3">
                    <p className="text-slate-400 text-xs"><strong>Result:</strong> Transparent PNG with just your product</p>
                    <p className="text-slate-400 text-xs"><strong>Best for:</strong> Design templates, product catalogs, custom layouts</p>
                  </div>
                </div>
                
                <div className="border border-slate-600 rounded-xl p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <RiSparklingFill className="text-purple-400" />
                    <h4 className="font-semibold text-white">Complete Scene Creation</h4>
                  </div>
                  <p className="text-slate-300 text-sm mb-3">Creates stunning product photography with custom environments</p>
                  <div className="bg-slate-800/50 rounded p-3">
                    <p className="text-slate-400 text-xs"><strong>Result:</strong> Professional product photo in custom scene</p>
                    <p className="text-slate-400 text-xs"><strong>Best for:</strong> Marketing, e-commerce, social media, advertising</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Advanced Options Explained */}
            <div>
              <h3 className="font-semibold text-white mb-4 text-lg">⚙️ Processing Options Explained</h3>
              <div className="space-y-3">
                <div className="bg-slate-800/30 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <FiScissors className="text-blue-400" size={16} />
                    <span className="text-white font-medium">Smart Background Removal</span>
                  </div>
                  <p className="text-slate-300 text-sm mb-2">Uses advanced image analysis to automatically detect and remove existing backgrounds</p>
                  <div className="text-xs text-slate-400 space-y-1">
                    <p><strong>✓ Enabled:</strong> Removes background first, then adds new scene (recommended)</p>
                    <p><strong>✗ Disabled:</strong> Overlays new background without removing existing one (may look unnatural)</p>
                  </div>
                </div>
                
                <div className="bg-slate-800/30 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <FiLayers className="text-green-400" size={16} />
                    <span className="text-white font-medium">Intelligent Positioning</span>
                  </div>
                  <p className="text-slate-300 text-sm mb-2">Automatically determines the best placement, size, and angle for your product</p>
                  <div className="text-xs text-slate-400 space-y-1">
                    <p><strong>✓ Enabled:</strong> System chooses optimal product placement and perspective (recommended)</p>
                    <p><strong>✗ Disabled:</strong> Product stays in original position (may not fit scene naturally)</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/30 rounded-lg p-4">
              <h4 className="font-medium text-white mb-2">💡 Pro Tips for Best Results:</h4>
              <ul className="text-slate-300 text-sm space-y-1">
                <li>• <strong>Image Quality:</strong> Use high-resolution images with clear, defined edges</li>
                <li>• <strong>Lighting Details:</strong> Specify lighting in descriptions ("soft morning light", "dramatic shadows")</li>
                <li>• <strong>Material Mentions:</strong> Include surface materials ("marble counter", "wooden table", "concrete floor")</li>
                <li>• <strong>Mood Setting:</strong> Add atmosphere descriptors ("cozy", "modern", "luxurious", "minimalist")</li>
                <li>• <strong>Specific Scenes:</strong> Be detailed rather than vague ("rustic kitchen with warm lighting" vs "nice background")</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Enhanced Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
              <RiPaletteLine className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                Creative Studio
              </h1>
              <p className="text-lg text-slate-400">
                Transform product photos with intelligent background processing
              </p>
            </div>
          </div>
          
          <button
            onClick={() => setShowInfoModal(true)}
            className="p-3 bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 hover:text-white rounded-xl transition-colors"
            title="How it works"
          >
            <FiInfo size={20} />
          </button>
        </div>

        {/* Enhanced feature highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700/50">
            <div className="flex items-center space-x-2 mb-2">
              <FiScissors className="text-red-400" size={16} />
              <span className="text-white font-medium">Smart Removal</span>
            </div>
            <p className="text-slate-400 text-sm">Automatically detects and removes existing backgrounds with precision</p>
          </div>
          
          <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700/50">
            <div className="flex items-center space-x-2 mb-2">
              <FiCamera className="text-blue-400" size={16} />
              <span className="text-white font-medium">Scene Creation</span>
            </div>
            <p className="text-slate-400 text-sm">Generates photorealistic environments from your descriptions</p>
          </div>
          
          <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700/50">
            <div className="flex items-center space-x-2 mb-2">
              <RiSparklingFill className="text-purple-400" size={16} />
              <span className="text-white font-medium">Professional Results</span>
            </div>
            <p className="text-slate-400 text-sm">Studio-quality images with proper lighting and positioning</p>
          </div>
        </div>

        {/* Processing Mode Indicator */}
        <div className="mb-6 p-4 bg-slate-800/20 rounded-xl border border-slate-700/30">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <FiScissors className="text-orange-400" size={16} />
              <span className="text-white text-sm font-medium">Background Removal: Always Active</span>
            </div>
            <div className="text-slate-400">→</div>
            <div className="flex items-center space-x-2">
              {prompt.trim() ? (
                <>
                  <RiSparklingFill className="text-purple-400" size={16} />
                  <span className="text-white text-sm font-medium">Scene Creation: Active</span>
                </>
              ) : (
                <>
                  <FiImage className="text-slate-500" size={16} />
                  <span className="text-slate-400 text-sm">Scene Creation: Add description to activate</span>
                </>
              )}
            </div>
          </div>
          <p className="text-slate-500 text-xs mt-2">
            {prompt.trim() 
              ? "Your product will be placed in a custom scene based on your description" 
              : "Currently: Remove background only • Add scene description for full creative processing"
            }
          </p>
        </div>

        {/* Credits display */}
        <div className="flex items-center space-x-4">
          <div className="px-4 py-2 bg-slate-800/50 backdrop-blur rounded-lg border border-slate-700/50">
            <span className="text-slate-300 text-sm font-medium">
              {userPlan === 'enterprise' 
                ? '✨ Unlimited creations' 
                : `🎯 ${usage?.remaining || 0} credits remaining`
              }
            </span>
          </div>
          
          {generatedImage && (
            <button
              onClick={handleReset}
              className="flex items-center px-4 py-2 bg-slate-700/50 hover:bg-slate-600/50 text-white rounded-lg transition-colors"
            >
              <FiRefreshCw size={16} className="mr-2" />
              New Creation
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Panel - Input */}
        <div className="space-y-6">
          {/* Image Upload */}
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500/20 to-purple-600/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
            <div className="relative bg-slate-900/50 backdrop-blur border border-slate-800/50 rounded-2xl p-6 hover:border-slate-700/50 transition-all duration-300">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center space-x-2">
                <FiImage size={20} />
                <span>1. Upload Product Image</span>
              </h3>
              
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
              />
              
              {!selectedImagePreview ? (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-64 border-2 border-dashed border-slate-600 rounded-xl hover:border-slate-500 transition-colors flex flex-col items-center justify-center space-y-4 group"
                >
                  <div className="w-16 h-16 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <FiUpload size={24} className="text-white" />
                  </div>
                  <div className="text-center">
                    <p className="text-white font-medium mb-1">Upload your product image</p>
                    <p className="text-slate-400 text-sm">PNG, JPG up to 10MB • Background will be automatically removed</p>
                  </div>
                </button>
              ) : (
                <div className="relative">
                  <img
                    src={selectedImagePreview}
                    alt="Selected product"
                    className="w-full h-64 object-contain rounded-xl border border-slate-600/50"
                  />
                  <button
                    onClick={() => {
                      setSelectedImage(null);
                      setSelectedImagePreview(null);
                    }}
                    className="absolute top-2 right-2 p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                  >
                    <FiX size={16} />
                  </button>
                  <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur rounded px-2 py-1 text-xs text-white">
                    ✂️ Background will be removed automatically
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Enhanced Background Prompt */}
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
            <div className="relative bg-slate-900/50 backdrop-blur border border-slate-800/50 rounded-2xl p-6 hover:border-slate-700/50 transition-all duration-300">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center space-x-2">
                <RiMagicLine size={20} />
                <span>2. Describe Your Scene</span>
                <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded">Optional</span>
              </h3>
              
              <div className="mb-3 p-3 bg-slate-800/30 rounded-lg border border-slate-700/30">
                <p className="text-slate-300 text-sm">
                  <strong>Leave empty</strong> for background removal only, or <strong>describe a scene</strong> to create a custom environment for your product.
                </p>
              </div>
              
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the environment you want... Examples: 'modern kitchen with marble countertops', 'cozy living room with natural lighting', 'professional office setting'"
                className="w-full h-24 bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all resize-none"
                maxLength={500}
              />
              
              <div className="flex justify-between items-center mt-2 mb-4">
                <span className="text-slate-400 text-sm">
                  {prompt.length}/500 characters
                </span>
                <span className="text-slate-400 text-xs">
                  {prompt.trim() ? "🎨 Scene creation mode" : "✂️ Background removal only"}
                </span>
              </div>

              {/* Example prompts */}
              <div>
                <p className="text-slate-400 text-sm mb-2">💡 Scene ideas to try:</p>
                <div className="grid grid-cols-1 gap-2">
                  {examplePrompts.slice(0, 3).map((example, index) => (
                    <button
                      key={index}
                      onClick={() => setPrompt(example)}
                      className="text-left p-2 bg-slate-800/30 hover:bg-slate-700/50 rounded-lg text-slate-300 hover:text-white text-sm transition-colors"
                    >
                      "{example}"
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Style & Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Style Selection */}
            <div className="bg-slate-900/50 backdrop-blur border border-slate-800/50 rounded-xl p-4">
              <h4 className="text-lg font-semibold text-white mb-3 flex items-center space-x-2">
                <span>3. Choose Style</span>
                {!prompt.trim() && <span className="text-xs bg-slate-600 text-slate-300 px-2 py-1 rounded">Removal only</span>}
              </h4>
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                disabled={!prompt.trim()}
                className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {styleOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.icon} {option.label}
                  </option>
                ))}
              </select>
              <p className="text-slate-400 text-xs mt-2">
                {prompt.trim() 
                  ? styleOptions.find(o => o.value === style)?.description
                  : "Add scene description to enable style selection"
                }
              </p>
            </div>

            {/* Resolution Selection */}
            <div className="bg-slate-900/50 backdrop-blur border border-slate-800/50 rounded-xl p-4">
              <h4 className="text-lg font-semibold text-white mb-3 flex items-center space-x-2">
                <span>4. Output Size</span>
              </h4>
              <select
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500/50"
              >
                {resolutionOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="text-slate-400 text-xs mt-2">
                {resolutionOptions.find(o => o.value === resolution)?.description}
              </p>
            </div>
          </div>

          {/* Enhanced Advanced Options */}
          <div className="bg-slate-900/50 backdrop-blur border border-slate-800/50 rounded-xl p-4">
            <h4 className="text-lg font-semibold text-white mb-3 flex items-center space-x-2">
              <FiLayers size={16} />
              <span>5. Processing Options</span>
            </h4>
            <div className="space-y-4">
              <label className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  checked={removeBackground}
                  onChange={(e) => setRemoveBackground(e.target.checked)}
                  className="w-4 h-4 text-indigo-500 bg-slate-800 border-slate-600 rounded focus:ring-indigo-500 focus:ring-2 mt-1"
                />
                <div>
                  <span className="text-white font-medium">Smart Background Removal</span>
                  <p className="text-slate-400 text-sm">Automatically detects and removes the existing background before processing</p>
                  <p className="text-slate-500 text-xs mt-1">
                    <strong>Recommended:</strong> Ensures clean product isolation for better scene integration
                  </p>
                </div>
              </label>
              
              <label className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  checked={autoPosition}
                  onChange={(e) => setAutoPosition(e.target.checked)}
                  disabled={!prompt.trim()}
                  className="w-4 h-4 text-indigo-500 bg-slate-800 border-slate-600 rounded focus:ring-indigo-500 focus:ring-2 mt-1 disabled:opacity-50"
                />
                <div>
                  <span className="text-white font-medium">Intelligent Positioning</span>
                  <p className="text-slate-400 text-sm">
                    {prompt.trim() 
                      ? "Automatically determines optimal product placement within the new scene"
                      : "Only available when creating custom scenes (add description above)"
                    }
                  </p>
                  <p className="text-slate-500 text-xs mt-1">
                    <strong>When enabled:</strong> System handles sizing, rotation, and positioning for natural scene integration
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Enhanced Generate Button */}
          <div className="relative">
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !selectedImage || (userPlan !== 'enterprise' && (usage?.remaining || 0) <= 0)}
              className="w-full py-5 px-6 bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-500 hover:from-indigo-600 hover:via-purple-700 hover:to-pink-600 disabled:from-slate-700 disabled:to-slate-600 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-2xl hover:shadow-indigo-500/25 disabled:hover:scale-100 disabled:hover:shadow-none flex items-center justify-center space-x-3 text-lg"
            >
              {isGenerating ? (
                <>
                  <FiRefreshCw className="animate-spin" size={24} />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  {prompt.trim() ? <RiSparklingFill size={24} /> : <FiScissors size={24} />}
                  <span>
                    {prompt.trim() 
                      ? "✨ Create Scene" 
                      : "✂️ Remove Background"
                    }
                  </span>
                </>
              )}
            </button>
            
            {!isGenerating && !selectedImage && (
              <div className="absolute inset-x-0 -bottom-8 text-center">
                <p className="text-slate-400 text-sm">
                  Upload an image to continue
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Enhanced Output */}
        <div className="space-y-6">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500/20 to-teal-600/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
            <div className="relative bg-slate-900/50 backdrop-blur border border-slate-800/50 rounded-2xl p-6 hover:border-slate-700/50 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-white flex items-center space-x-2">
                  <FiEye size={20} />
                  <span>Creative Result</span>
                </h3>
                
                {generatedImage && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setFullscreenImage(generatedImage)}
                      className="p-2 bg-slate-700/50 hover:bg-slate-600/50 text-white rounded-lg transition-colors"
                      title="View fullscreen"
                    >
                      <FiMaximize size={16} />
                    </button>
                    <a
                      href={generatedImage}
                      download={`creative_studio_${Date.now()}.jpg`}
                      className="p-2 bg-slate-700/50 hover:bg-slate-600/50 text-white rounded-lg transition-colors"
                      title="Download HD image"
                    >
                      <FiDownload size={16} />
                    </a>
                  </div>
                )}
              </div>
              
              <div className="aspect-square rounded-xl border border-slate-700/50 overflow-hidden bg-slate-800/30 flex items-center justify-center">
                {generatedImage ? (
                  <div className="relative w-full h-full group">
                    <img
                      src={generatedImage}
                      alt="Creative studio result"
                      className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => {
                        console.error('Image load error:', e);
                        toast.error('Failed to load generated image');
                      }}
                    />
                    {/* Overlay with generation info */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <div className="bg-white/90 backdrop-blur rounded-lg p-3 text-center">
                        <p className="text-slate-800 font-medium">✨ Created by Studio</p>
                        <p className="text-slate-600 text-sm">Click to view fullscreen</p>
                      </div>
                    </div>
                  </div>
                ) : isGenerating ? (
                  <StatusDisplay />
                ) : (
                  <div className="text-center space-y-6 p-8">
                    <div className="relative">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-r from-indigo-500/20 to-purple-600/20 flex items-center justify-center mx-auto mb-4">
                        {prompt.trim() ? (
                          <RiSparklingFill size={40} className="text-slate-500" />
                        ) : (
                          <FiScissors size={40} className="text-slate-500" />
                        )}
                      </div>
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">✨</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-white font-semibold text-lg mb-2">Your creative result will appear here</p>
                      <p className="text-slate-400 text-sm mb-4">
                        {prompt.trim() 
                          ? "Product will be placed in your custom scene"
                          : "Background will be cleanly removed from your product"
                        }
                      </p>
                      
                      {/* Preview features */}
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="bg-slate-800/50 rounded-lg p-3">
                          <FiCamera className="text-blue-400 mb-1 mx-auto" size={16} />
                          <div className="text-slate-300">Studio Quality</div>
                        </div>
                        <div className="bg-slate-800/50 rounded-lg p-3">
                          <FiZap className="text-yellow-400 mb-1 mx-auto" size={16} />
                          <div className="text-slate-300">30-60 seconds</div>
                        </div>
                        <div className="bg-slate-800/50 rounded-lg p-3">
                          {prompt.trim() ? (
                            <>
                              <RiSparklingFill className="text-purple-400 mb-1 mx-auto" size={16} />
                              <div className="text-slate-300">Scene Creation</div>
                            </>
                          ) : (
                            <>
                              <FiScissors className="text-orange-400 mb-1 mx-auto" size={16} />
                              <div className="text-slate-300">Background Removal</div>
                            </>
                          )}
                        </div>
                        <div className="bg-slate-800/50 rounded-lg p-3">
                          <FiDownload className="text-green-400 mb-1 mx-auto" size={16} />
                          <div className="text-slate-300">HD Download</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Processing explanation */}
              {!generatedImage && !isGenerating && (
                <div className="mt-4 p-4 bg-slate-800/30 rounded-lg border border-slate-700/30">
                  <h4 className="text-white font-medium mb-2 flex items-center space-x-2">
                    <span>🔄</span>
                    <span>What happens when you create:</span>
                  </h4>
                  <div className="space-y-2 text-slate-400 text-sm">
                    <div className="flex items-center space-x-2">
                      <span className="text-orange-400">1.</span>
                      <span>Smart background removal from your product image</span>
                    </div>
                    {prompt.trim() && (
                      <div className="flex items-center space-x-2">
                        <span className="text-purple-400">2.</span>
                        <span>Generate custom scene based on your description</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-2">
                      <span className="text-green-400">{prompt.trim() ? "3." : "2."}</span>
                      <span>{prompt.trim() ? "Intelligent product placement with proper lighting" : "Clean product cutout ready for use"}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Generation Stats (when completed) */}
          {generatedImage && (
            <div className="bg-slate-900/50 backdrop-blur border border-slate-800/50 rounded-xl p-4">
              <h4 className="text-white font-medium mb-3 flex items-center space-x-2">
                <FiCheck className="text-green-400" />
                <span>Creation Complete</span>
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-400">Processing Type:</span>
                  <p className="text-white">
                    {prompt.trim() ? "Scene Creation" : "Background Removal"}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400">Resolution:</span>
                  <p className="text-white">{resolution}</p>
                </div>
                <div>
                  <span className="text-slate-400">Style Used:</span>
                  <p className="text-white capitalize">
                    {prompt.trim() ? style : "N/A"}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400">Quality:</span>
                  <p className="text-white">Professional</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Fullscreen Modal */}
      {fullscreenImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
          <div className="relative max-w-7xl max-h-full">
            <div className="absolute top-4 right-4 flex items-center space-x-2 z-10">
              <a
                href={fullscreenImage}
                download={`creative_studio_${Date.now()}.jpg`}
                className="p-3 bg-black/50 hover:bg-black/70 text-white rounded-lg transition-colors"
                title="Download"
              >
                <FiDownload size={20} />
              </a>
              <button
                onClick={() => setFullscreenImage(null)}
                className="p-3 bg-black/50 hover:bg-black/70 text-white rounded-lg transition-colors"
                title="Close"
              >
                <FiX size={20} />
              </button>
            </div>
            <img
              src={fullscreenImage}
              alt="Creative studio result fullscreen"
              className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
            />
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 backdrop-blur rounded-lg px-4 py-2">
              <p className="text-white text-sm">✨ Created by Creative Studio • Professional Quality</p>
            </div>
          </div>
        </div>
      )}

      {/* Info Modal */}
      <InfoModal />
    </div>
  );
};

export default GenerateBackground;
