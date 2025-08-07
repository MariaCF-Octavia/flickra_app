 // components/GenerateBackground.jsx - FIXED VERSION
import React, { useState, useCallback, useRef } from 'react';
import { toast } from 'react-toastify';
import { 
  FiImage, FiUpload, FiPlay, FiDownload, FiMaximize, FiX, 
  FiCheck, FiClock, FiAlertCircle, FiRefreshCw, FiEye 
} from 'react-icons/fi';
import { RiMagicLine } from 'react-icons/ri';
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
  
  const fileInputRef = useRef(null);
  const pollInterval = useRef(null);

  // FIXED: Robust token retrieval function
  const getAuthToken = async () => {
    try {
      // Method 1: Get token from Supabase session (most reliable)
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        console.log('🔑 Got token from Supabase session');
        return session.access_token;
      }

      // Method 2: Try different localStorage keys
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
            // If it's a JSON object, parse it
            const parsed = JSON.parse(stored);
            if (parsed.access_token) {
              console.log(`🔑 Got token from localStorage key: ${key}`);
              return parsed.access_token;
            }
          } catch {
            // If not JSON, check if it's a raw token
            if (stored.length > 20) { // Tokens are usually longer than 20 chars
              console.log(`🔑 Got raw token from localStorage key: ${key}`);
              return stored;
            }
          }
        }
      }

      // Method 3: Check if user is authenticated but token is missing
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

  // Style options
  const styleOptions = [
    { value: 'professional', label: 'Professional', description: 'Clean, business-focused backgrounds' },
    { value: 'lifestyle', label: 'Lifestyle', description: 'Natural, everyday environments' },
    { value: 'studio', label: 'Studio', description: 'Minimalist studio setups' },
    { value: 'artistic', label: 'Artistic', description: 'Creative, artistic environments' },
    { value: 'minimal', label: 'Minimal', description: 'Simple, clean backgrounds' },
    { value: 'creative', label: 'Creative', description: 'Bold, imaginative settings' }
  ];

  // Resolution options
  const resolutionOptions = [
    { value: '1024x1024', label: '1024×1024', description: 'Square format' },
    { value: '1280x720', label: '1280×720', description: 'Landscape HD' },
    { value: '1920x1080', label: '1920×1080', description: 'Full HD' }
  ];

  // File upload handler
  const handleImageUpload = useCallback((event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be smaller than 10MB');
      return;
    }

    setSelectedImage(file);
    
    // Create preview
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

  // FIXED: Poll for generation status with better URL extraction
  const pollGenerationStatus = useCallback(async (jobId) => {
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
          toast.error('Authentication expired. Please refresh the page and try again.');
          return;
        }
        throw new Error('Failed to check status');
      }

      const data = await response.json();
      console.log('📊 Status response:', data); // Debug log
      
      setGenerationStatus(data.status);

      if (data.status === 'completed') {
        // FIXED: Try multiple ways to get the image URL
        let imageUrl = null;
        
        // Method 1: Direct image_url field
        if (data.image_url) {
          imageUrl = data.image_url;
          console.log('✅ Got image URL from image_url field:', imageUrl);
        }
        // Method 2: result_url field  
        else if (data.result_url) {
          imageUrl = data.result_url;
          console.log('✅ Got image URL from result_url field:', imageUrl);
        }
        // Method 3: Check metadata
        else if (data.metadata?.final_image_url) {
          imageUrl = data.metadata.final_image_url;
          console.log('✅ Got image URL from metadata:', imageUrl);
        }
        // Method 4: Any URL-like field
        else {
          // Look for any field that looks like a URL
          const urlFields = ['url', 'final_url', 'generated_url', 'output_url'];
          for (const field of urlFields) {
            if (data[field] && typeof data[field] === 'string' && data[field].includes('http')) {
              imageUrl = data[field];
              console.log(`✅ Got image URL from ${field}:`, imageUrl);
              break;
            }
          }
        }

        if (imageUrl) {
          setGeneratedImage(imageUrl);
          setIsGenerating(false);
          toast.success('Background generated successfully!');
          
          // Update usage
          if (onUsageUpdate) {
            onUsageUpdate();
          }
          
          // Clear polling
          if (pollInterval.current) {
            clearInterval(pollInterval.current);
            pollInterval.current = null;
          }
        } else {
          console.error('❌ No image URL found in response:', data);
          toast.error('Generation completed but no image URL found. Check console for details.');
          setIsGenerating(false);
          
          if (pollInterval.current) {
            clearInterval(pollInterval.current);
            pollInterval.current = null;
          }
        }
      } else if (data.status === 'failed') {
        setIsGenerating(false);
        toast.error(data.error || 'Background generation failed');
        
        if (pollInterval.current) {
          clearInterval(pollInterval.current);
          pollInterval.current = null;
        }
      }
      // Continue polling if still processing
    } catch (error) {
      console.error('Status check error:', error);
      if (error.message.includes('Authentication') || error.message.includes('token')) {
        toast.error('Authentication expired. Please refresh the page and try again.');
      } else {
        toast.error('Failed to check generation status');
      }
    }
  }, [onUsageUpdate]);

  // FIXED: Start background generation with proper token handling
  const handleGenerate = async () => {
    // Validation
    if (!selectedImage) {
      toast.error('Please select a product image');
      return;
    }

    if (!prompt.trim()) {
      toast.error('Please enter a background description');
      return;
    }

    // Check credits
    const remaining = usage?.remaining || 0;
    if (userPlan !== 'enterprise' && remaining <= 0) {
      toast.error('No credits remaining. Please upgrade your plan.');
      return;
    }

    setIsGenerating(true);
    setGenerationStatus('uploading');
    setGeneratedImage(null); // Clear previous result
    
    try {
      // Upload image first
      const imageUrl = await uploadImageToSupabase(selectedImage);
      
      // FIXED: Get token properly
      const token = await getAuthToken();
      
      console.log('🚀 Starting background generation with token:', token.substring(0, 20) + '...');
      
      // Start generation
      const response = await fetch(`${API_BASE}/api/generate-background`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          imageUrl,
          prompt: prompt.trim(),
          style,
          removeBackground,
          autoPosition,
          resolution
        })
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication expired. Please refresh the page and log in again.');
        }
        
        const errorData = await response.json();
        throw new Error(errorData.detail?.message || `Request failed with status ${response.status}`);
      }

      const data = await response.json();
      console.log('🎯 Generation started:', data);
      
      setJobId(data.job_id);
      setGenerationStatus('processing');
      
      toast.success('Background generation started!');
      
      // Start polling for status immediately, then every 2 seconds
      pollGenerationStatus(data.job_id);
      pollInterval.current = setInterval(() => {
        pollGenerationStatus(data.job_id);
      }, 2000);

    } catch (error) {
      console.error('Generation error:', error);
      
      if (error.message.includes('Authentication') || error.message.includes('token')) {
        toast.error('Please refresh the page and log in again.');
      } else {
        toast.error(error.message || 'Failed to start generation');
      }
      
      setIsGenerating(false);
      setGenerationStatus(null);
    }
  };

  // Reset form
  const handleReset = () => {
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
    
    if (pollInterval.current) {
      clearInterval(pollInterval.current);
      pollInterval.current = null;
    }
  };

  // Status display component
  const StatusDisplay = () => {
    if (!generationStatus) return null;

    const statusConfig = {
      uploading: { icon: <FiUpload />, text: 'Uploading image...', color: 'text-blue-400' },
      processing: { icon: <FiRefreshCw className="animate-spin" />, text: 'Generating background...', color: 'text-indigo-400' },
      completed: { icon: <FiCheck />, text: 'Generation complete!', color: 'text-green-400' },
      failed: { icon: <FiAlertCircle />, text: 'Generation failed', color: 'text-red-400' }
    };

    const config = statusConfig[generationStatus] || statusConfig.processing;

    return (
      <div className="flex items-center justify-center space-x-3 p-4 bg-slate-800/30 rounded-lg border border-slate-700/50">
        <div className={config.color}>{config.icon}</div>
        <span className={`font-medium ${config.color}`}>{config.text}</span>
        {/* ADDED: Show job ID for debugging */}
        {jobId && (
          <span className="text-slate-500 text-xs ml-2">
            ID: {jobId.substring(0, 8)}...
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-4 mb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
            <RiMagicLine className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
              Generate Background
            </h1>
            <p className="text-lg text-slate-400">
              Transform product photos with AI-generated backgrounds
            </p>
          </div>
        </div>

        {/* Credits display */}
        <div className="flex items-center space-x-4">
          <div className="px-4 py-2 bg-slate-800/50 backdrop-blur rounded-lg border border-slate-700/50">
            <span className="text-slate-300 text-sm font-medium">
              {userPlan === 'enterprise' 
                ? 'Unlimited generations' 
                : `${usage?.remaining || 0} credits remaining`
              }
            </span>
          </div>
          
          {generatedImage && (
            <button
              onClick={handleReset}
              className="flex items-center px-4 py-2 bg-slate-700/50 hover:bg-slate-600/50 text-white rounded-lg transition-colors"
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
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500/20 to-purple-600/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
            <div className="relative bg-slate-900/50 backdrop-blur border border-slate-800/50 rounded-2xl p-6 hover:border-slate-700/50 transition-all duration-300">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center space-x-2">
                <FiImage size={20} />
                <span>Product Image</span>
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
                    <p className="text-white font-medium mb-1">Upload product image</p>
                    <p className="text-slate-400 text-sm">PNG, JPG up to 10MB</p>
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
                </div>
              )}
            </div>
          </div>

          {/* Background Prompt */}
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
            <div className="relative bg-slate-900/50 backdrop-blur border border-slate-800/50 rounded-2xl p-6 hover:border-slate-700/50 transition-all duration-300">
              <h3 className="text-xl font-semibold text-white mb-4">Background Description</h3>
              
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the background you want... (e.g., 'modern minimalist studio with soft lighting', 'cozy living room setting', 'professional office environment')"
                className="w-full h-24 bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all resize-none"
                maxLength={500}
              />
              
              <div className="flex justify-between items-center mt-2">
                <span className="text-slate-400 text-sm">
                  {prompt.length}/500 characters
                </span>
              </div>
            </div>
          </div>

          {/* Style & Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Style Selection */}
            <div className="bg-slate-900/50 backdrop-blur border border-slate-800/50 rounded-xl p-4">
              <h4 className="text-lg font-semibold text-white mb-3">Style</h4>
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500/50"
              >
                {styleOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="text-slate-400 text-xs mt-1">
                {styleOptions.find(o => o.value === style)?.description}
              </p>
            </div>

            {/* Resolution Selection */}
            <div className="bg-slate-900/50 backdrop-blur border border-slate-800/50 rounded-xl p-4">
              <h4 className="text-lg font-semibold text-white mb-3">Resolution</h4>
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
              <p className="text-slate-400 text-xs mt-1">
                {resolutionOptions.find(o => o.value === resolution)?.description}
              </p>
            </div>
          </div>

          {/* Advanced Options */}
          <div className="bg-slate-900/50 backdrop-blur border border-slate-800/50 rounded-xl p-4">
            <h4 className="text-lg font-semibold text-white mb-3">Advanced Options</h4>
            <div className="space-y-3">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={removeBackground}
                  onChange={(e) => setRemoveBackground(e.target.checked)}
                  className="w-4 h-4 text-indigo-500 bg-slate-800 border-slate-600 rounded focus:ring-indigo-500 focus:ring-2"
                />
                <span className="text-white">Remove existing background</span>
              </label>
              
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={autoPosition}
                  onChange={(e) => setAutoPosition(e.target.checked)}
                  className="w-4 h-4 text-indigo-500 bg-slate-800 border-slate-600 rounded focus:ring-indigo-500 focus:ring-2"
                />
                <span className="text-white">Auto-position product</span>
              </label>
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !selectedImage || !prompt.trim() || (userPlan !== 'enterprise' && (usage?.remaining || 0) <= 0)}
            className="w-full py-4 px-6 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:from-slate-700 disabled:to-slate-600 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg hover:shadow-indigo-500/25 disabled:hover:scale-100 disabled:hover:shadow-none flex items-center justify-center space-x-3"
          >
            {isGenerating ? (
              <>
                <FiRefreshCw className="animate-spin" size={20} />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <RiMagicLine size={20} />
                <span>Generate Background</span>
              </>
            )}
          </button>
        </div>

        {/* Right Panel - Output */}
        <div className="space-y-6">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500/20 to-teal-600/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
            <div className="relative bg-slate-900/50 backdrop-blur border border-slate-800/50 rounded-2xl p-6 hover:border-slate-700/50 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-white flex items-center space-x-2">
                  <FiEye size={20} />
                  <span>Generated Result</span>
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
                      download={`background_${Date.now()}.png`}
                      className="p-2 bg-slate-700/50 hover:bg-slate-600/50 text-white rounded-lg transition-colors"
                      title="Download"
                    >
                      <FiDownload size={16} />
                    </a>
                  </div>
                )}
              </div>
              
              <div className="aspect-square rounded-xl border border-slate-700/50 overflow-hidden bg-slate-800/30 flex items-center justify-center">
                {generatedImage ? (
                  <img
                    src={generatedImage}
                    alt="Generated background"
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      console.error('Image load error:', e);
                      toast.error('Failed to load generated image');
                    }}
                  />
                ) : isGenerating ? (
                  <div className="text-center space-y-4">
                    <StatusDisplay />
                  </div>
                ) : (
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-slate-700/50 flex items-center justify-center">
                      <FiImage size={32} className="text-slate-500" />
                    </div>
                    <div>
                      <p className="text-white font-medium mb-1">Generated image will appear here</p>
                      <p className="text-slate-400 text-sm">Upload an image and add a description to get started</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen Modal */}
      {fullscreenImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="relative max-w-7xl max-h-full">
            <button
              onClick={() => setFullscreenImage(null)}
              className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 text-white rounded-lg transition-colors z-10"
            >
              <FiX size={20} />
            </button>
            <img
              src={fullscreenImage}
              alt="Generated background fullscreen"
              className="max-w-full max-h-full object-contain rounded-xl"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default GenerateBackground;