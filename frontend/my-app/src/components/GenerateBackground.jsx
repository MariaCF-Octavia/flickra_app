 // components/GenerateBackground.jsx - FIXED VERSION
import React, { useState, useCallback, useRef } from 'react';
import { toast } from 'react-toastify';
import { 
  FiImage, FiUpload, FiPlay, FiDownload, FiMaximize, FiX, 
  FiCheck, FiClock, FiAlertCircle, FiRefreshCw, FiEye, FiInfo,
  FiZap, FiCamera, FiLayers
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

  // Token retrieval function
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
      description: 'Clean, business-focused backgrounds perfect for corporate use',
      icon: '💼'
    },
    { 
      value: 'lifestyle', 
      label: 'Lifestyle', 
      description: 'Natural, everyday environments that show products in real-life settings',
      icon: '🏠'
    },
    { 
      value: 'studio', 
      label: 'Studio', 
      description: 'Minimalist studio setups with professional lighting',
      icon: '📸'
    },
    { 
      value: 'artistic', 
      label: 'Artistic', 
      description: 'Creative, artistic environments with unique visual appeal',
      icon: '🎨'
    },
    { 
      value: 'minimal', 
      label: 'Minimal', 
      description: 'Simple, clean backgrounds that let your product shine',
      icon: '✨'
    },
    { 
      value: 'creative', 
      label: 'Creative', 
      description: 'Bold, imaginative settings for standout marketing',
      icon: '🚀'
    }
  ];

  // Resolution options
  const resolutionOptions = [
    { value: '1024x1024', label: '1024×1024', description: 'Square format - Perfect for social media' },
    { value: '1280x720', label: '1280×720', description: 'Landscape HD - Great for websites' },
    { value: '1920x1080', label: '1920×1080', description: 'Full HD - High-resolution marketing' }
  ];

  // Example prompts for inspiration
  const examplePrompts = [
    "Modern minimalist kitchen with marble countertops and warm lighting",
    "Cozy living room with soft pillows and natural sunlight",
    "Professional office desk with plants and modern decor",
    "Rustic wooden table in a sunlit garden setting",
    "Elegant spa environment with natural textures and calm ambiance",
    "Vibrant outdoor picnic scene with fresh grass and blue sky"
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

  // Poll for generation status
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
      console.log('📊 Status response:', data);
      
      setGenerationStatus(data.status);

      if (data.status === 'completed') {
        let imageUrl = null;
        
        if (data.image_url) {
          imageUrl = data.image_url;
          console.log('✅ Got image URL from image_url field:', imageUrl);
        } else if (data.result_url) {
          imageUrl = data.result_url;
          console.log('✅ Got image URL from result_url field:', imageUrl);
        } else if (data.metadata?.final_image_url) {
          imageUrl = data.metadata.final_image_url;
          console.log('✅ Got image URL from metadata:', imageUrl);
        } else {
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
          
          // Show success with generation type info
          const generationType = data.metadata?.generation_type || 'unknown';
          if (generationType === 'scene_generation') {
            toast.success('🎨 AI scene generated successfully! Your product is now in a beautiful new environment.');
          } else {
            toast.success('✂️ Background removed successfully! Product is ready for new scenes.');
          }
          
          if (onUsageUpdate) {
            onUsageUpdate();
          }
          
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
    } catch (error) {
      console.error('Status check error:', error);
      if (error.message.includes('Authentication') || error.message.includes('token')) {
        toast.error('Authentication expired. Please refresh the page and try again.');
      } else {
        toast.error('Failed to check generation status');
      }
    }
  }, [onUsageUpdate]);

  // Start background generation
  const handleGenerate = async () => {
    if (!selectedImage) {
      toast.error('Please select a product image');
      return;
    }

    if (!prompt.trim()) {
      toast.error('Please enter a background description');
      return;
    }

    const remaining = usage?.remaining || 0;
    if (userPlan !== 'enterprise' && remaining <= 0) {
      toast.error('No credits remaining. Please upgrade your plan.');
      return;
    }

    setIsGenerating(true);
    setGenerationStatus('uploading');
    setGeneratedImage(null);
    
    try {
      const imageUrl = await uploadImageToSupabase(selectedImage);
      const token = await getAuthToken();
      
      console.log('🚀 Starting AI background generation with prompt:', prompt);
      
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
      
      toast.success('🎨 AI background generation started! This may take 30-60 seconds...');
      
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

  // Enhanced status display
  const StatusDisplay = () => {
    if (!generationStatus) return null;

    const statusConfig = {
      uploading: { 
        icon: <FiUpload />, 
        text: 'Uploading your product image...', 
        color: 'text-blue-400',
        description: 'Preparing your image for AI processing'
      },
      processing: { 
        icon: <FiRefreshCw className="animate-spin" />, 
        text: 'AI is creating your background...', 
        color: 'text-indigo-400',
        description: 'Our AI is analyzing your product and generating the perfect scene'
      },
      completed: { 
        icon: <FiCheck />, 
        text: 'Generation complete!', 
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
        <div className="relative max-w-2xl w-full bg-slate-900 rounded-2xl border border-slate-700 p-6">
          <button
            onClick={() => setShowInfoModal(false)}
            className="absolute top-4 right-4 p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            <FiX size={20} />
          </button>
          
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white mb-2 flex items-center space-x-2">
              <RiSparklingFill className="text-indigo-400" />
              <span>AI Background Generation</span>
            </h2>
            <p className="text-slate-300">Transform your product photos with AI-powered backgrounds</p>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-800/50 rounded-xl p-4 text-center">
                <FiCamera className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                <h3 className="font-semibold text-white mb-1">Smart Analysis</h3>
                <p className="text-slate-400 text-sm">AI analyzes your product and automatically removes the background</p>
              </div>
              
              <div className="bg-slate-800/50 rounded-xl p-4 text-center">
                <RiMagicLine className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                <h3 className="font-semibold text-white mb-1">Scene Generation</h3>
                <p className="text-slate-400 text-sm">Creates photorealistic environments based on your description</p>
              </div>
              
              <div className="bg-slate-800/50 rounded-xl p-4 text-center">
                <FiLayers className="w-8 h-8 text-green-400 mx-auto mb-2" />
                <h3 className="font-semibold text-white mb-1">Perfect Placement</h3>
                <p className="text-slate-400 text-sm">Intelligently positions your product with proper lighting and shadows</p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-3">How it works:</h3>
              <ol className="space-y-2 text-slate-300">
                <li className="flex items-start space-x-2">
                  <span className="bg-indigo-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center mt-0.5">1</span>
                  <span>Upload your product image (PNG, JPG up to 10MB)</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="bg-indigo-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center mt-0.5">2</span>
                  <span>Describe the background scene you want in detail</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="bg-indigo-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center mt-0.5">3</span>
                  <span>Choose your style and resolution preferences</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="bg-indigo-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center mt-0.5">4</span>
                  <span>AI generates a professional scene with your product</span>
                </li>
              </ol>
            </div>

            <div className="bg-slate-800/30 rounded-lg p-4">
              <h4 className="font-medium text-white mb-2">💡 Pro Tips:</h4>
              <ul className="text-slate-300 text-sm space-y-1">
                <li>• Be specific in your descriptions (e.g., "marble kitchen counter with soft morning light")</li>
                <li>• Use high-quality product images with clear edges for best results</li>
                <li>• Different styles work better for different products - experiment!</li>
                <li>• The AI can create both realistic and creative environments</li>
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
              <RiMagicLine className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                AI Background Generator
              </h1>
              <p className="text-lg text-slate-400">
                Create stunning product photos with AI-generated scenes
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
              <FiZap className="text-yellow-400" size={16} />
              <span className="text-white font-medium">AI-Powered</span>
            </div>
            <p className="text-slate-400 text-sm">Advanced AI creates photorealistic scenes that perfectly match your product</p>
          </div>
          
          <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700/50">
            <div className="flex items-center space-x-2 mb-2">
              <FiCamera className="text-blue-400" size={16} />
              <span className="text-white font-medium">Professional Quality</span>
            </div>
            <p className="text-slate-400 text-sm">Studio-grade results with proper lighting, shadows, and positioning</p>
          </div>
          
          <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700/50">
            <div className="flex items-center space-x-2 mb-2">
              <RiSparklingFill className="text-purple-400" size={16} />
              <span className="text-white font-medium">Unlimited Creativity</span>
            </div>
            <p className="text-slate-400 text-sm">From minimalist studios to exotic locations - describe any scene</p>
          </div>
        </div>

        {/* Credits display */}
        <div className="flex items-center space-x-4">
          <div className="px-4 py-2 bg-slate-800/50 backdrop-blur rounded-lg border border-slate-700/50">
            <span className="text-slate-300 text-sm font-medium">
              {userPlan === 'enterprise' 
                ? '✨ Unlimited generations' 
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
                    <p className="text-slate-400 text-sm">PNG, JPG up to 10MB • Best with clear backgrounds</p>
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

          {/* Enhanced Background Prompt */}
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
            <div className="relative bg-slate-900/50 backdrop-blur border border-slate-800/50 rounded-2xl p-6 hover:border-slate-700/50 transition-all duration-300">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center space-x-2">
                <RiMagicLine size={20} />
                <span>2. Describe Your Scene</span>
              </h3>
              
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the background scene in detail... Be specific about lighting, materials, and atmosphere for best results!"
                className="w-full h-24 bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all resize-none"
                maxLength={500}
              />
              
              <div className="flex justify-between items-center mt-2 mb-4">
                <span className="text-slate-400 text-sm">
                  {prompt.length}/500 characters
                </span>
              </div>

              {/* Example prompts */}
              <div>
                <p className="text-slate-400 text-sm mb-2">💡 Try these examples:</p>
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
              </h4>
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500/50"
              >
                {styleOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.icon} {option.label}
                  </option>
                ))}
              </select>
              <p className="text-slate-400 text-xs mt-2">
                {styleOptions.find(o => o.value === style)?.description}
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
                  <p className="text-slate-400 text-sm">AI automatically detects and removes the existing background</p>
                </div>
              </label>
              
              <label className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  checked={autoPosition}
                  onChange={(e) => setAutoPosition(e.target.checked)}
                  className="w-4 h-4 text-indigo-500 bg-slate-800 border-slate-600 rounded focus:ring-indigo-500 focus:ring-2 mt-1"
                />
                <div>
                  <span className="text-white font-medium">Intelligent Positioning</span>
                  <p className="text-slate-400 text-sm">AI places your product optimally within the new scene</p>
                </div>
              </label>
            </div>
          </div>

          {/* Enhanced Generate Button */}
          <div className="relative">
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !selectedImage || !prompt.trim() || (userPlan !== 'enterprise' && (usage?.remaining || 0) <= 0)}
              className="w-full py-5 px-6 bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-500 hover:from-indigo-600 hover:via-purple-700 hover:to-pink-600 disabled:from-slate-700 disabled:to-slate-600 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-2xl hover:shadow-indigo-500/25 disabled:hover:scale-100 disabled:hover:shadow-none flex items-center justify-center space-x-3 text-lg"
            >
              {isGenerating ? (
                <>
                  <FiRefreshCw className="animate-spin" size={24} />
                  <span>AI is Working...</span>
                </>
              ) : (
                <>
                  <RiSparklingFill size={24} />
                  <span>✨ Generate AI Background</span>
                </>
              )}
            </button>
            
            {!isGenerating && (!selectedImage || !prompt.trim()) && (
              <div className="absolute inset-x-0 -bottom-8 text-center">
                <p className="text-slate-400 text-sm">
                  {!selectedImage ? "Upload an image to continue" : "Add a description to generate"}
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
                  <span>AI Generated Result</span>
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
                      download={`ai_background_${Date.now()}.jpg`}
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
                      alt="AI generated background"
                      className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => {
                        console.error('Image load error:', e);
                        toast.error('Failed to load generated image');
                      }}
                    />
                    {/* Overlay with generation info */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <div className="bg-white/90 backdrop-blur rounded-lg p-3 text-center">
                        <p className="text-slate-800 font-medium">✨ AI Generated</p>
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
                        <RiSparklingFill size={40} className="text-slate-500" />
                      </div>
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">✨</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-white font-semibold text-lg mb-2">Your AI masterpiece will appear here</p>
                      <p className="text-slate-400 text-sm mb-4">Upload a product image and describe your dream background to get started</p>
                      
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
                          <RiMagicLine className="text-purple-400 mb-1 mx-auto" size={16} />
                          <div className="text-slate-300">AI Powered</div>
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

              {/* Generation tips */}
              {!generatedImage && !isGenerating && (
                <div className="mt-4 p-4 bg-slate-800/30 rounded-lg border border-slate-700/30">
                  <h4 className="text-white font-medium mb-2 flex items-center space-x-2">
                    <span>💡</span>
                    <span>Pro Tips for Better Results</span>
                  </h4>
                  <ul className="text-slate-400 text-sm space-y-1">
                    <li>• Use high-resolution product images with clear edges</li>
                    <li>• Be specific about lighting (e.g., "soft morning light", "dramatic shadows")</li>
                    <li>• Mention materials and textures (e.g., "marble counter", "wooden table")</li>
                    <li>• Include mood descriptors (e.g., "cozy", "modern", "luxurious")</li>
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Generation Stats (when completed) */}
          {generatedImage && (
            <div className="bg-slate-900/50 backdrop-blur border border-slate-800/50 rounded-xl p-4">
              <h4 className="text-white font-medium mb-3 flex items-center space-x-2">
                <FiCheck className="text-green-400" />
                <span>Generation Complete</span>
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-400">Style Used:</span>
                  <p className="text-white capitalize">{style}</p>
                </div>
                <div>
                  <span className="text-slate-400">Resolution:</span>
                  <p className="text-white">{resolution}</p>
                </div>
                <div>
                  <span className="text-slate-400">AI Model:</span>
                  <p className="text-white">Claid v2 ✨</p>
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
                download={`ai_background_${Date.now()}.jpg`}
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
              alt="AI generated background fullscreen"
              className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
            />
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 backdrop-blur rounded-lg px-4 py-2">
              <p className="text-white text-sm">✨ Generated with AI • Professional Quality</p>
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