 import React, { useState, useEffect } from 'react';
import { FiUpload, FiUser, FiZap, FiDownload, FiMaximize, FiRefreshCw } from 'react-icons/fi';

const FashionStudio = ({ userPlan, usage, onUsageUpdate }) => {
  const [selectedModelImage, setSelectedModelImage] = useState(null);
  const [modelImagePreview, setModelImagePreview] = useState(null);
  const [modelImageFile, setModelImageFile] = useState(null);
  const [clothingFile, setClothingFile] = useState(null);
  const [clothingPreview, setClothingPreview] = useState(null);
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedResult, setGeneratedResult] = useState(null);
  
  // Sample model images users can choose from - More diverse options
  const sampleModels = [
    {
      id: 'sample-1',
      name: 'Professional Female',
      image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=600&fit=crop&crop=face'
    },
    {
      id: 'sample-2', 
      name: 'Professional Male',
      image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=600&fit=crop&crop=face'
    },
    {
      id: 'sample-3',
      name: 'Casual Female',
      image: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400&h=600&fit=crop&crop=face'
    },
    {
      id: 'sample-4',
      name: 'Casual Male',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop&crop=face'
    },
    {
      id: 'sample-5',
      name: 'Fashion Female',
      image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=600&fit=crop&crop=face'
    },
    {
      id: 'sample-6',
      name: 'Business Male',
      image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=600&fit=crop&crop=face'
    },
    {
      id: 'sample-7',
      name: 'Trendy Female',
      image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=600&fit=crop&crop=face'
    },
    {
      id: 'sample-8',
      name: 'Sporty Male',
      image: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&h=600&fit=crop&crop=face'
    }
  ];

  // Load available models
  useEffect(() => {
    // Set first sample model as default
    if (sampleModels.length > 0) {
      setSelectedModelImage(sampleModels[0].image);
      setModelImagePreview(sampleModels[0].image);
    }
  }, []);

  const handleModelImageUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      console.log('Please upload a valid image file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      console.log('Image must be smaller than 10MB');
      return;
    }

    setModelImageFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setModelImagePreview(e.target.result);
      setSelectedModelImage(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const selectSampleModel = (model) => {
    setSelectedModelImage(model.image);
    setModelImagePreview(model.image);
    setModelImageFile(null); // Clear uploaded file
  };

  const handleClothingUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      console.log('Please upload a valid image file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      console.log('Image must be smaller than 10MB');
      return;
    }

    setClothingFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setClothingPreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleTryOn = async () => {
    if (!clothingFile || !selectedModelImage) {
      console.log('Please upload clothing and select/upload a model image');
      return;
    }

    // Check credits
    if (userPlan !== 'enterprise' && usage <= 0) {
      console.log('No credits remaining');
      return;
    }

    setIsGenerating(true);
    
    try {
      const formData = new FormData();
      formData.append('clothing_image', clothingFile);
      
      // If user uploaded their own model image, use that; otherwise use selected sample
      if (modelImageFile) {
        formData.append('model_image', modelImageFile);
      } else {
        // Convert URL to blob for sample models
        const response = await fetch(selectedModelImage);
        const blob = await response.blob();
        formData.append('model_image', blob, 'model.jpg');
      }
      
      formData.append('category', 'auto'); // Let FASHN auto-detect
      formData.append('mode', 'quality');
      formData.append('garment_photo_type', 'flat-lay');
      formData.append('num_samples', '1');
      if (prompt) {
        formData.append('prompt', prompt);
      }

      const token = localStorage.getItem('token');
      const response = await fetch('/api/fashion-studio/try-on', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setGeneratedResult({
          image_url: data.image_url,
          task_id: data.task_id,
          metadata: data.metadata,
          model_image: selectedModelImage,
          clothing_filename: clothingFile.name
        });
        
        console.log('Fashion try-on completed!');
        
        // Update usage if callback provided
        if (onUsageUpdate) {
          onUsageUpdate();
        }
        
      } else {
        throw new Error(data.error || 'Try-on generation failed');
      }
      
    } catch (error) {
      console.error('Try-on generation failed:', error);
      console.log(error.message || 'Failed to generate try-on');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadResult = () => {
    if (!generatedResult?.image_url) return;
    
    const link = document.createElement('a');
    link.href = generatedResult.image_url;
    link.download = `fashion-tryon-${generatedResult.task_id}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    console.log('Download started');
  };

  const resetStudio = () => {
    setClothingFile(null);
    setClothingPreview(null);
    setPrompt('');
    setGeneratedResult(null);
    setModelImageFile(null);
    setModelImagePreview(sampleModels[0]?.image);
    setSelectedModelImage(sampleModels[0]?.image);
    // Reset file inputs
    const clothingInput = document.getElementById('clothing-upload');
    const modelInput = document.getElementById('model-upload');
    if (clothingInput) clothingInput.value = '';
    if (modelInput) modelInput.value = '';
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent mb-2">
          Fashion Studio
        </h1>
        <p className="text-lg text-slate-400 max-w-2xl">
          Upload your clothing and see it on professional models with realistic virtual try-on technology
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Column - Input Section */}
        <div className="space-y-6">
          
          {/* Clothing Upload */}
          <div className="bg-slate-900/50 backdrop-blur border border-slate-800/50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <FiUpload className="mr-2" />
              Upload Clothing
            </h3>
            
            <div className="border-2 border-dashed border-slate-600 hover:border-slate-500 rounded-lg p-8 text-center transition-all duration-300">
              <input
                id="clothing-upload"
                type="file"
                accept="image/*"
                onChange={handleClothingUpload}
                className="hidden"
              />
              
              <label htmlFor="clothing-upload" className="cursor-pointer block">
                {clothingPreview ? (
                  <div className="space-y-4">
                    <img 
                      src={clothingPreview} 
                      alt="Clothing preview" 
                      className="w-32 h-32 object-cover rounded-lg mx-auto border border-slate-600"
                    />
                    <div>
                      <p className="text-white font-medium">{clothingFile?.name}</p>
                      <p className="text-slate-400 text-sm">Click to change</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <FiUpload className="w-12 h-12 text-slate-400 mx-auto" />
                    <div>
                      <p className="text-white font-medium">Upload clothing image</p>
                      <p className="text-slate-400 text-sm">PNG, JPG up to 10MB</p>
                    </div>
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* Model Selection */}
          <div className="bg-slate-900/50 backdrop-blur border border-slate-800/50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <FiUser className="mr-2" />
              Select or Upload Model
            </h3>
            
            {/* Sample Models - More Options */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-300 mb-3">Choose Sample Model</label>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {sampleModels.map((model) => (
                  <button
                    key={model.id}
                    onClick={() => selectSampleModel(model)}
                    className={`relative rounded-xl overflow-hidden border-2 transition-all duration-300 transform hover:scale-105 ${
                      selectedModelImage === model.image && !modelImageFile
                        ? 'border-indigo-500 ring-2 ring-indigo-500/30 shadow-lg shadow-indigo-500/25'
                        : 'border-slate-600 hover:border-slate-500 hover:shadow-lg'
                    }`}
                  >
                    <img 
                      src={model.image} 
                      alt={model.name}
                      className="w-full h-28 object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
                    <div className="absolute bottom-1 left-1 right-1">
                      <p className="text-white text-xs font-semibold truncate">{model.name}</p>
                    </div>
                    {selectedModelImage === model.image && !modelImageFile && (
                      <div className="absolute top-1 right-1 bg-indigo-500 text-white text-xs px-1.5 py-0.5 rounded-full font-medium">
                        ✓
                      </div>
                    )}
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-500 mt-2">
                💡 Tip: Choose a model that matches your target audience and clothing style
              </p>
            </div>

            {/* Style Instructions */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Style Instructions (Optional)
              </label>
              <div className="space-y-3">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe the desired style, lighting, or setting... (e.g., 'studio lighting, professional pose, clean background' or 'outdoor setting, natural lighting, casual atmosphere')"
                  className="w-full p-3 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-indigo-500 focus:outline-none resize-none text-sm"
                  rows={3}
                />
                <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-3">
                  <p className="text-xs text-slate-400 mb-2">
                    <span className="text-indigo-400 font-medium">💡 Style Tips:</span> Describe the photo style:
                  </p>
                  <ul className="text-xs text-slate-500 space-y-1">
                    <li>• Lighting: "studio lighting", "natural light", "dramatic shadows"</li>
                    <li>• Setting: "clean background", "outdoor scene", "urban environment"</li>
                    <li>• Pose: "professional pose", "relaxed stance", "dynamic pose"</li>
                    <li>• Style: "editorial style", "casual lifestyle", "commercial shoot"</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Upload Custom Model */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-300 mb-2">Or Upload Your Own Model Image</label>
              <div className="border-2 border-dashed border-slate-600 hover:border-slate-500 rounded-lg p-6 text-center transition-all duration-300 hover:bg-slate-800/30">
                <input
                  id="model-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleModelImageUpload}
                  className="hidden"
                />
                <label htmlFor="model-upload" className="cursor-pointer block">
                  <FiUpload className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                  <p className="text-white text-sm font-medium mb-1">Upload model photo</p>
                  <p className="text-slate-400 text-xs">PNG, JPG up to 10MB</p>
                </label>
              </div>
            </div>

            {/* Current Model Preview */}
            {modelImagePreview && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Current Model Preview</label>
                <div className="relative">
                  <img 
                    src={modelImagePreview} 
                    alt="Selected model" 
                    className="w-full h-48 object-cover rounded-lg border border-slate-600 shadow-lg"
                  />
                  {modelImageFile && (
                    <div className="absolute top-3 right-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs px-3 py-1 rounded-full font-medium shadow-lg">
                      Custom Upload
                    </div>
                  )}
                  {!modelImageFile && (
                    <div className="absolute top-3 right-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs px-3 py-1 rounded-full font-medium shadow-lg">
                      Sample Model
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Style Prompt - Removed since integrated above */}

          {/* Generate Button */}
          <button
            onClick={handleTryOn}
            disabled={!clothingFile || !selectedModelImage || isGenerating || (userPlan !== 'enterprise' && usage <= 0)}
            className={`w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-300 flex items-center justify-center space-x-3 ${
              isGenerating || !clothingFile || !selectedModelImage || (userPlan !== 'enterprise' && usage <= 0)
                ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:shadow-lg hover:shadow-indigo-500/25 transform hover:scale-[1.02]'
            }`}
          >
            {isGenerating ? (
              <>
                <div className="animate-spin w-5 h-5 border-2 border-current border-t-transparent rounded-full"></div>
                <span>Generating try-on...</span>
              </>
            ) : (
              <>
                <FiZap className="w-5 h-5" />
                <span>
                  {!clothingFile ? 'Upload clothing first' :
                   !selectedModelImage ? 'Select or upload a model' :
                   userPlan !== 'enterprise' && usage <= 0 ? 'No credits remaining' :
                   'Generate Fashion Try-On'}
                </span>
              </>
            )}
          </button>

          {/* Usage Info */}
          <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-slate-300 text-sm">Credits remaining:</span>
              <span className="text-white font-medium">
                {userPlan === 'enterprise' ? '∞' : usage}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column - Results Section */}
        <div className="space-y-6">
          
          {generatedResult ? (
            <div className="bg-slate-900/50 backdrop-blur border border-slate-800/50 rounded-xl overflow-hidden">
              {/* Result Header */}
              <div className="p-6 border-b border-slate-800/50">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">✨ Your Try-On Result</h3>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={downloadResult}
                      className="p-2 bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 hover:text-white rounded-lg transition-colors"
                      title="Download"
                    >
                      <FiDownload size={16} />
                    </button>
                    <button
                      onClick={resetStudio}
                      className="p-2 bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 hover:text-white rounded-lg transition-colors"
                      title="Reset"
                    >
                      <FiRefreshCw size={16} />
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Result Image */}
              <div className="p-6">
                <div className="relative group">
                  <img 
                    src={generatedResult.image_url} 
                    alt="Fashion try-on result"
                    className="w-full rounded-lg shadow-lg"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300 rounded-lg"></div>
                  <div className="absolute top-3 right-3 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                    ✅ Complete
                  </div>
                </div>
                
                {/* Result Metadata */}
                <div className="mt-4 p-4 bg-slate-800/30 rounded-lg">
                  <h4 className="text-white font-medium mb-2">Generation Details</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Model:</span>
                      <span className="text-slate-200">{modelImageFile ? 'Custom Upload' : 'Sample Model'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Clothing:</span>
                      <span className="text-slate-200">{generatedResult.clothing_filename}</span>
                    </div>
                    {generatedResult.metadata?.generation_time && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Generation time:</span>
                        <span className="text-slate-200">{generatedResult.metadata.generation_time}s</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900/50 backdrop-blur border border-slate-800/50 rounded-xl p-8">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto rounded-full bg-slate-800/50 flex items-center justify-center mb-4">
                  <FiUser className="w-10 h-10 text-slate-500" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Ready for Try-On</h3>
                <p className="text-slate-400 mb-6">
                  Your generated try-on result will appear here. Upload clothing and select/describe a model to get started!
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                  <div className="p-4 bg-slate-800/30 rounded-lg">
                    <FiUpload className="w-6 h-6 text-indigo-400 mx-auto mb-2" />
                    <p className="text-sm text-slate-300">1. Upload Clothing</p>
                  </div>
                  <div className="p-4 bg-slate-800/30 rounded-lg">
                    <FiUser className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                    <p className="text-sm text-slate-300">2. Select/Describe Model</p>
                  </div>
                  <div className="p-4 bg-slate-800/30 rounded-lg">
                    <FiZap className="w-6 h-6 text-green-400 mx-auto mb-2" />
                    <p className="text-sm text-slate-300">3. Generate Result</p>
                  </div>
                </div>
                <div className="mt-6 p-4 bg-indigo-500/10 border border-indigo-500/30 rounded-lg">
                  <p className="text-indigo-300 text-sm">
                    💡 <strong>Results appear instantly here</strong> - no need to navigate anywhere else!
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Features Section */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900/30 backdrop-blur border border-slate-800/50 rounded-xl p-6 text-center">
          <div className="w-12 h-12 mx-auto bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center mb-4">
            <FiZap className="w-6 h-6 text-white" />
          </div>
          <h4 className="text-lg font-semibold text-white mb-2">Realistic Results</h4>
          <p className="text-slate-400 text-sm">
            Advanced technology creates photorealistic try-on images with natural draping and lighting
          </p>
        </div>
        
        <div className="bg-slate-900/30 backdrop-blur border border-slate-800/50 rounded-xl p-6 text-center">
          <div className="w-12 h-12 mx-auto bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center mb-4">
            <FiUser className="w-6 h-6 text-white" />
          </div>
          <h4 className="text-lg font-semibold text-white mb-2">Diverse Models</h4>
          <p className="text-slate-400 text-sm">
            Professional models representing different body types, ethnicities, and styles
          </p>
        </div>
        
        <div className="bg-slate-900/30 backdrop-blur border border-slate-800/50 rounded-xl p-6 text-center">
          <div className="w-12 h-12 mx-auto bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center mb-4">
            <FiDownload className="w-6 h-6 text-white" />
          </div>
          <h4 className="text-lg font-semibold text-white mb-2">Instant Download</h4>
          <p className="text-slate-400 text-sm">
            High-quality images ready for marketing campaigns, social media, or product catalogs
          </p>
        </div>
      </div>
    </div>
  );
};

export default FashionStudio;