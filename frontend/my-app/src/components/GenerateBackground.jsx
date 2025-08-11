// components/GenerateBackground.jsx - FINAL CLEAN VERSION
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from 'react-toastify';
import { 
  FiImage, FiUpload, FiDownload, FiMaximize, FiX, 
  FiCheck, FiAlertCircle, FiRefreshCw, FiEye, FiInfo,
  FiCamera, FiLayers, FiScissors
} from 'react-icons/fi';
import { RiMagicLine, RiSparklingFill } from 'react-icons/ri';
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

  // Component lifecycle management
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
              return parsed.access_token;
            }
          } catch {
            if (stored.length > 20) {
              return stored;
            }
          }
        }
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
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

  // Style options
  const styleOptions = [
    { value: 'professional', label: 'Professional', description: 'Clean, business-focused environments' },
    { value: 'lifestyle', label: 'Lifestyle', description: 'Natural, everyday settings' },
    { value: 'studio', label: 'Studio', description: 'Minimalist studio setups' },
    { value: 'artistic', label: 'Artistic', description: 'Creative, visually striking environments' },
    { value: 'minimal', label: 'Minimal', description: 'Simple, uncluttered backgrounds' },
    { value: 'creative', label: 'Creative', description: 'Bold, imaginative settings' }
  ];

  // Resolution options
  const resolutionOptions = [
    { value: '1024x1024', label: '1024×1024', description: 'Square format - Perfect for social media' },
    { value: '1280x720', label: '1280×720', description: 'Landscape HD - Ideal for websites and presentations' },
    { value: '1920x1080', label: '1920×1080', description: 'Full HD - High-resolution for print and large displays' }
  ];

  // Example prompts
  const examplePrompts = [
    "Modern minimalist kitchen with marble countertops and warm natural lighting",
    "Cozy living room with soft textures and golden hour sunlight",
    "Professional office desk with plants and contemporary decor",
    "Elegant spa environment with natural stone and calming atmosphere"
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

  // Upload image to Supabase
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

  // FIXED: Enhanced polling with proper URL extraction and no redirects
  const pollGenerationStatus = useCallback(async (jobId) => {
    if (!componentMounted.current) return;

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
      console.log('Status response:', data);
      
      if (!componentMounted.current) return;
      
      setGenerationStatus(data.status);

      if (data.status === 'completed') {
        let imageUrl = null;
        
        // CRITICAL FIX: Look for result_url first (matches your backend logs)
        if (data.result_url) {
          imageUrl = data.result_url;
          console.log('Found image URL in result_url:', imageUrl);
        } 
        else if (data.image_url) {
          imageUrl = data.image_url;
          console.log('Found image URL in image_url:', imageUrl);
        }
        else if (data.url && data.url.includes('supabase.co/storage')) {
          imageUrl = data.url;
          console.log('Found Supabase storage URL:', imageUrl);
        }
        else if (data.metadata?.final_image_url) {
          imageUrl = data.metadata.final_image_url;
          console.log('Found image URL in metadata:', imageUrl);
        }
        else {
          // Search all fields for Supabase URLs
          const allFields = Object.keys(data);
          for (const field of allFields) {
            const value = data[field];
            if (typeof value === 'string' && value.includes('supabase.co/storage')) {
              imageUrl = value;
              console.log(`Found Supabase URL in field '${field}':`, imageUrl);
              break;
            }
          }
        }

        if (imageUrl && componentMounted.current) {
          // Clean up the URL
          if (imageUrl.endsWith('?')) {
            imageUrl = imageUrl.slice(0, -1);
          }
          
          console.log('Final image URL:', imageUrl);
          
          // Set the image immediately - prevent any redirect issues
          setGeneratedImage(imageUrl);
          setIsGenerating(false);
          
          // Clear polling
          if (pollInterval.current) {
            clearInterval(pollInterval.current);
            pollInterval.current = null;
          }
          
          // Show success message
          if (prompt.trim()) {
            toast.success('Scene created successfully!');
          } else {
            toast.success('Background removed successfully!');
          }
          
          // Update usage
          if (onUsageUpdate) {
            onUsageUpdate();
          }
        } else {
          console.error('No valid image URL found in response:', data);
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
          toast.error(data.error || 'Generation failed. Please try again.');
        }
        
        if (pollInterval.current) {
          clearInterval(pollInterval.current);
          pollInterval.current = null;
        }
      }
    } catch (error) {
      console.error('Status check error:', error);
      // Don't show errors for network issues that might be temporary
      if (componentMounted.current && !error.message.includes('Failed to fetch')) {
        if (error.message.includes('Authentication') || error.message.includes('token')) {
          toast.error('Session expired. Please refresh and try again.');
          setIsGenerating(false);
          setGenerationStatus('failed');
        }
      }
    }
  }, [onUsageUpdate, prompt]);

  // Start background generation
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

    // Clear previous results and prevent any navigation
    setGeneratedImage(null);
    setJobId(null);
    setGenerationStatus(null);
    setIsGenerating(true);
    
    try {
      // Upload image
      setGenerationStatus('uploading');
      const imageUrl = await uploadImageToSupabase(selectedImage);
      
      if (!componentMounted.current) return;
      
      const token = await getAuthToken();
      
      console.log('Starting generation with prompt:', prompt);
      
      setGenerationStatus('processing');
      
      const requestBody = {
        imageUrl,
        prompt: prompt.trim(),
        style,
        removeBackground,
        autoPosition,
        resolution
      };
      
      const response = await fetch(`${API_BASE}/api/generate-background`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!componentMounted.current) return;

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
      console.log('Generation started:', data);
      
      if (!data.job_id) {
        throw new Error('No job ID returned from server');
      }
      
      setJobId(data.job_id);
      setGenerationStatus('processing');
      
      toast.success('Processing started! This may take 30-60 seconds...');
      
      // Start polling immediately, then every 3 seconds
      pollGenerationStatus(data.job_id);
      pollInterval.current = setInterval(() => {
        if (componentMounted.current) {
          pollGenerationStatus(data.job_id);
        } else {
          if (pollInterval.current) {
            clearInterval(pollInterval.current);
            pollInterval.current = null;
          }
        }
      }, 3000);

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

  // Status display
  const StatusDisplay = () => {
    if (!generationStatus) return null;

    const statusConfig = {
      uploading: { 
        icon: <FiUpload className="animate-pulse" />, 
        text: 'Uploading your image...', 
        color: 'text-blue-400',
        bgColor: 'bg-blue-400/10'
      },
      processing: { 
        icon: <FiRefreshCw className="animate-spin" />, 
        text: 'Creating your image...', 
        color: 'text-purple-400',
        bgColor: 'bg-purple-400/10'
      },
      completed: { 
        icon: <FiCheck />, 
        text: 'Complete!', 
        color: 'text-green-400',
        bgColor: 'bg-green-400/10'
      },
      failed: { 
        icon: <FiAlertCircle />, 
        text: 'Generation failed', 
        color: 'text-red-400',
        bgColor: 'bg-red-400/10'
      }
    };

    const config = statusConfig[generationStatus] || statusConfig.processing;

    return (
      <div className="text-center space-y-4">
        <div className={`flex items-center justify-center space-x-3 p-6 rounded-xl border ${config.bgColor} border-gray-700/50`}>
          <div className={`${config.color} text-2xl`}>{config.icon}</div>
          <div className="text-left">
            <div className={`font-medium ${config.color} text-lg`}>{config.text}</div>
            <div className="text-gray-400 text-sm">
              {generationStatus === 'uploading' && 'Preparing your image for processing'}
              {generationStatus === 'processing' && 'Analyzing and enhancing your product photo'}
              {generationStatus === 'completed' && 'Your professional image is ready!'}
              {generationStatus === 'failed' && 'Something went wrong, please try again'}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Info Modal Component
  const InfoModal = () => {
    if (!showInfoModal) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
        <div className="relative max-w-2xl w-full bg-gray-900 rounded-2xl border border-gray-700 p-6 max-h-[90vh] overflow-y-auto">
          <button
            onClick={() => setShowInfoModal(false)}
            className="absolute top-4 right-4 p-2 hover:bg-gray-800 text-gray-400 hover:text-white rounded-lg transition-colors"
          >
            <FiX size={20} />
          </button>
          
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white mb-2">How Creative Studio Works</h2>
            <p className="text-gray-300">Professional product photography made simple</p>
          </div>

          <div className="space-y-6">
            <div className="bg-gray-800/50 rounded-lg p-4">
              <h3 className="font-medium text-white mb-3">Process Overview</h3>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="bg-blue-500 text-white rounded-full w-6 h-6 text-xs flex items-center justify-center mt-0.5">1</div>
                  <div>
                    <p className="text-white font-medium">Background Removal</p>
                    <p className="text-gray-400 text-sm">Automatically detects and removes existing backgrounds</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="bg-purple-500 text-white rounded-full w-6 h-6 text-xs flex items-center justify-center mt-0.5">2</div>
                  <div>
                    <p className="text-white font-medium">Scene Creation (Optional)</p>
                    <p className="text-gray-400 text-sm">Creates new environments based on your description</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="bg-green-500 text-white rounded-full w-6 h-6 text-xs flex items-center justify-center mt-0.5">3</div>
                  <div>
                    <p className="text-white font-medium">Smart Positioning</p>
                    <p className="text-gray-400 text-sm">Intelligently places your product with proper lighting</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-800/50 rounded-lg p-4">
              <h3 className="font-medium text-white mb-3">Two Modes Available</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-gray-600 rounded-lg p-3">
                  <h4 className="font-medium text-white mb-2">Background Removal</h4>
                  <p className="text-gray-400 text-sm mb-2">Clean product cutout with transparent background</p>
                  <p className="text-gray-500 text-xs">Best for: Design templates, catalogs</p>
                </div>
                
                <div className="border border-gray-600 rounded-lg p-3">
                  <h4 className="font-medium text-white mb-2">Scene Creation</h4>
                  <p className="text-gray-400 text-sm mb-2">Professional photos in custom environments</p>
                  <p className="text-gray-500 text-xs">Best for: Marketing, e-commerce, social media</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
              <FiCamera className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-4 mb-1">
                <h1 className="text-3xl font-bold text-white">
                  Creative Studio
                </h1>
                <div className="px-3 py-1 bg-gradient-to-r from-red-500 to-red-600 text-white text-sm font-semibold rounded-full shadow-lg">
                  Launching Soon
                </div>
              </div>
              <p className="text-lg text-gray-400">
                Transform product photos with AI-powered background processing
              </p>
            </div>
          </div>
          
          <button
            onClick={() => setShowInfoModal(true)}
            className="p-3 bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 hover:text-white rounded-xl transition-colors"
            title="How it works"
          >
            <FiInfo size={20} />
          </button>
        </div>

        {/* Mode Indicator */}
        <div className="mb-6 p-4 bg-gray-800/30 rounded-xl border border-gray-700/30">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <FiScissors className="text-orange-400" size={16} />
              <span className="text-white text-sm font-medium">Background Removal: Always Active</span>
            </div>
            <div className="text-gray-400">→</div>
            <div className="flex items-center space-x-2">
              {prompt.trim() ? (
                <>
                  <RiSparklingFill className="text-purple-400" size={16} />
                  <span className="text-white text-sm font-medium">Scene Creation: Active</span>
                </>
              ) : (
                <>
                  <FiImage className="text-gray-500" size={16} />
                  <span className="text-gray-400 text-sm">Scene Creation: Add description to activate</span>
                </>
              )}
            </div>
          </div>
          <p className="text-gray-500 text-xs mt-2">
            {prompt.trim() 
              ? "Your product will be placed in a custom scene" 
              : "Currently: Background removal only"
            }
          </p>
        </div>

        {/* Credits display */}
        <div className="flex items-center space-x-4">
          <div className="px-4 py-2 bg-gray-800/50 backdrop-blur rounded-lg border border-gray-700/50">
            <span className="text-gray-300 text-sm font-medium">
              {userPlan === 'enterprise' 
                ? 'Unlimited generations' 
                : `${usage?.remaining || 0} credits remaining`
              }
            </span>
          </div>
          
          {generatedImage && (
            <button
              onClick={handleReset}
              className="flex items-center px-4 py-2 bg-gray-700/50 hover:bg-gray-600/50 text-white rounded-lg transition-colors"
            >
              <FiRefreshCw size={16} className="mr-2" />
              New Generation
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Panel - Input */}
        <div className="space-y-6">
          {/* Image Upload */}
          <div className="bg-gray-900/50 backdrop-blur border border-gray-800/50 rounded-2xl p-6">
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
                className="w-full h-64 border-2 border-dashed border-gray-600 rounded-xl hover:border-gray-500 transition-colors flex flex-col items-center justify-center space-y-4 group"
              >
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <FiUpload size={24} className="text-white" />
                </div>
                <div className="text-center">
                  <p className="text-white font-medium mb-1">Upload your product image</p>
                  <p className="text-gray-400 text-sm">PNG, JPG up to 10MB</p>
                </div>
              </button>
            ) : (
              <div className="relative">
                <img
                  src={selectedImagePreview}
                  alt="Selected product"
                  className="w-full h-64 object-contain rounded-xl border border-gray-600/50"
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
              </div>
            )}
          </div>

          {/* Scene Description */}
          <div className="bg-gray-900/50 backdrop-blur border border-gray-800/50 rounded-2xl p-6">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center space-x-2">
              <RiMagicLine size={20} />
              <span>2. Scene Description</span>
              <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded">Optional</span>
            </h3>
            
            <div className="mb-3 p-3 bg-gray-800/30 rounded-lg border border-gray-700/30">
              <p className="text-gray-300 text-sm">
                Leave empty for background removal only, or describe a scene to create a custom environment.
              </p>
            </div>
            
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the environment you want... Examples: 'modern kitchen with marble countertops', 'cozy living room with natural lighting'"
              className="w-full h-24 bg-gray-800/50 border border-gray-700/50 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all resize-none"
              maxLength={500}
            />
            
            <div className="flex justify-between items-center mt-2 mb-4">
              <span className="text-gray-400 text-sm">
                {prompt.length}/500 characters
              </span>
              <span className="text-gray-400 text-xs">
                {prompt.trim() ? "Scene creation mode" : "Background removal only"}
              </span>
            </div>

            {/* Example prompts */}
            <div>
              <p className="text-gray-400 text-sm mb-2">Example scenes:</p>
              <div className="grid grid-cols-1 gap-2">
                {examplePrompts.slice(0, 2).map((example, index) => (
                  <button
                    key={index}
                    onClick={() => setPrompt(example)}
                    className="text-left p-3 bg-gray-800/30 hover:bg-gray-700/50 rounded-lg text-gray-300 hover:text-white text-sm transition-colors"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Style Selection */}
            <div className="bg-gray-900/50 backdrop-blur border border-gray-800/50 rounded-xl p-4">
              <h4 className="text-lg font-semibold text-white mb-3">3. Style</h4>
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                disabled={!prompt.trim()}
                className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {styleOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="text-gray-400 text-xs mt-2">
                {prompt.trim() 
                  ? styleOptions.find(o => o.value === style)?.description
                  : "Add scene description to enable style selection"
                }
              </p>
            </div>

            {/* Resolution Selection */}
            <div className="bg-gray-900/50 backdrop-blur border border-gray-800/50 rounded-xl p-4">
              <h4 className="text-lg font-semibold text-white mb-3">4. Resolution</h4>
              <select
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500/50"
              >
                {resolutionOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="text-gray-400 text-xs mt-2">
                {resolutionOptions.find(o => o.value === resolution)?.description}
              </p>
            </div>
          </div>

          {/* Advanced Options */}
          <div className="bg-gray-900/50 backdrop-blur border border-gray-800/50 rounded-xl p-4">
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
                  className="w-4 h-4 text-blue-500 bg-gray-800 border-gray-600 rounded focus:ring-blue-500 focus:ring-2 mt-1"
                />
                <div>
                  <span className="text-white font-medium">Smart Background Removal</span>
                  <p className="text-gray-400 text-sm">Automatically detects and removes existing backgrounds</p>
                </div>
              </label>
              
              <label className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  checked={autoPosition}
                  onChange={(e) => setAutoPosition(e.target.checked)}
                  disabled={!prompt.trim()}
                  className="w-4 h-4 text-blue-500 bg-gray-800 border-gray-600 rounded focus:ring-blue-500 focus:ring-2 mt-1 disabled:opacity-50"
                />
                <div>
                  <span className="text-white font-medium">Intelligent Positioning</span>
                  <p className="text-gray-400 text-sm">
                    {prompt.trim() 
                      ? "Automatically determines optimal product placement within the scene"
                      : "Only available when creating custom scenes"
                    }
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Generate Button */}
          <div className="relative">
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !selectedImage || (userPlan !== 'enterprise' && (usage?.remaining || 0) <= 0)}
              className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 hover:from-blue-700 hover:via-purple-700 hover:to-blue-700 disabled:from-gray-700 disabled:to-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-300 flex items-center justify-center space-x-3 text-lg"
            >
              {isGenerating ? (
                <>
                  <FiRefreshCw className="animate-spin" size={20} />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  {prompt.trim() ? <RiSparklingFill size={20} /> : <FiScissors size={20} />}
                  <span>
                    {prompt.trim() 
                      ? "Create Scene" 
                      : "Remove Background"
                    }
                  </span>
                </>
              )}
            </button>
            
            {!isGenerating && !selectedImage && (
              <div className="absolute inset-x-0 -bottom-8 text-center">
                <p className="text-gray-400 text-sm">
                  Upload an image to continue
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Output */}
        <div className="space-y-6">
          <div className="bg-gray-900/50 backdrop-blur border border-gray-800/50 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white flex items-center space-x-2">
                <FiEye size={20} />
                <span>Result</span>
              </h3>
              
              {generatedImage && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setFullscreenImage(generatedImage)}
                    className="p-2 bg-gray-700/50 hover:bg-gray-600/50 text-white rounded-lg transition-colors"
                    title="View fullscreen"
                  >
                    <FiMaximize size={16} />
                  </button>
                  <a
                    href={generatedImage}
                    download={`creative_studio_${Date.now()}.jpg`}
                    className="p-2 bg-gray-700/50 hover:bg-gray-600/50 text-white rounded-lg transition-colors"
                    title="Download image"
                  >
                    <FiDownload size={16} />
                  </a>
                </div>
              )}
            </div>
            
            <div className="aspect-square rounded-xl border border-gray-700/50 overflow-hidden bg-gray-800/30 flex items-center justify-center">
              {generatedImage ? (
                <div className="relative w-full h-full group">
                  <img
                    src={generatedImage}
                    alt="Generated result"
                    className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
                    onError={(e) => {
                      console.error('Image load error:', e);
                      toast.error('Failed to load generated image');
                    }}
                    onLoad={() => {
                      console.log('Image loaded successfully');
                    }}
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <div className="bg-white/90 backdrop-blur rounded-lg p-3 text-center">
                      <p className="text-gray-800 font-medium">Click to view fullscreen</p>
                    </div>
                  </div>
                </div>
              ) : isGenerating ? (
                <StatusDisplay />
              ) : (
                <div className="text-center space-y-4 p-8">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-600/20 flex items-center justify-center mx-auto mb-4">
                    {prompt.trim() ? (
                      <RiSparklingFill size={32} className="text-gray-500" />
                    ) : (
                      <FiScissors size={32} className="text-gray-500" />
                    )}
                  </div>
                  <div>
                    <p className="text-white font-semibold text-lg mb-2">Your result will appear here</p>
                    <p className="text-gray-400 text-sm mb-4">
                      {prompt.trim() 
                        ? "Product will be placed in your custom scene"
                        : "Background will be cleanly removed from your product"
                      }
                    </p>
                    
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="bg-gray-800/50 rounded-lg p-3">
                        <FiCamera className="text-blue-400 mb-1 mx-auto" size={16} />
                        <div className="text-gray-300">Professional Quality</div>
                      </div>
                      <div className="bg-gray-800/50 rounded-lg p-3">
                        <FiRefreshCw className="text-purple-400 mb-1 mx-auto" size={16} />
                        <div className="text-gray-300">30-60 seconds</div>
                      </div>
                      <div className="bg-gray-800/50 rounded-lg p-3">
                        {prompt.trim() ? (
                          <>
                            <RiSparklingFill className="text-green-400 mb-1 mx-auto" size={16} />
                            <div className="text-gray-300">Scene Creation</div>
                          </>
                        ) : (
                          <>
                            <FiScissors className="text-orange-400 mb-1 mx-auto" size={16} />
                            <div className="text-gray-300">Background Removal</div>
                          </>
                        )}
                      </div>
                      <div className="bg-gray-800/50 rounded-lg p-3">
                        <FiDownload className="text-blue-400 mb-1 mx-auto" size={16} />
                        <div className="text-gray-300">HD Download</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Generation Stats */}
          {generatedImage && (
            <div className="bg-gray-900/50 backdrop-blur border border-gray-800/50 rounded-xl p-4">
              <h4 className="text-white font-medium mb-3 flex items-center space-x-2">
                <FiCheck className="text-green-400" />
                <span>Generation Complete</span>
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Type:</span>
                  <p className="text-white">
                    {prompt.trim() ? "Scene Creation" : "Background Removal"}
                  </p>
                </div>
                <div>
                  <span className="text-gray-400">Resolution:</span>
                  <p className="text-white">{resolution}</p>
                </div>
                <div>
                  <span className="text-gray-400">Style:</span>
                  <p className="text-white capitalize">
                    {prompt.trim() ? style : "N/A"}
                  </p>
                </div>
                <div>
                  <span className="text-gray-400">Quality:</span>
                  <p className="text-white">Professional</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Fullscreen Modal */}
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
              alt="Generated result fullscreen"
              className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
            />
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 backdrop-blur rounded-lg px-4 py-2">
              <p className="text-white text-sm">Created by Creative Studio</p>
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