import React, { useState, useEffect } from 'react';
import { FiUpload, FiUser, FiZap, FiDownload, FiMaximize, FiRefreshCw } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

const FashionStudio = ({ userPlan, usage, onUsageUpdate }) => {
  const [selectedModel, setSelectedModel] = useState(null);
  const [clothingFile, setClothingFile] = useState(null);
  const [clothingPreview, setClothingPreview] = useState(null);
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedResult, setGeneratedResult] = useState(null);
  const [models, setModels] = useState([]);
  const [loadingModels, setLoadingModels] = useState(true);

  // Load available models
  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/fashion-studio/models', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setModels(data.models);
        if (data.models.length > 0) {
          setSelectedModel(data.models[0]);
        }
      }
    } catch (error) {
      console.error('Failed to load models:', error);
      toast.error('Failed to load models');
    } finally {
      setLoadingModels(false);
    }
  };

  const handleClothingUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload a valid image file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be smaller than 10MB');
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
    if (!clothingFile || !selectedModel) {
      toast.error('Please upload clothing and select a model');
      return;
    }

    // Check credits
    if (userPlan !== 'enterprise' && usage <= 0) {
      toast.error('No credits remaining');
      return;
    }

    setIsGenerating(true);
    
    try {
      const formData = new FormData();
      formData.append('clothing_image', clothingFile);
      formData.append('model_id', selectedModel.id);
      formData.append('prompt', prompt);

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
          model: selectedModel,
          clothing_filename: clothingFile.name
        });
        
        toast.success('Fashion try-on completed!');
        
        // Update usage if callback provided
        if (onUsageUpdate) {
          onUsageUpdate();
        }
        
      } else {
        throw new Error(data.detail || 'Try-on generation failed');
      }
      
    } catch (error) {
      console.error('Try-on generation failed:', error);
      toast.error(error.message || 'Failed to generate try-on');
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
    toast.success('Download started');
  };

  const resetStudio = () => {
    setClothingFile(null);
    setClothingPreview(null);
    setPrompt('');
    setGeneratedResult(null);
    // Reset file input
    const fileInput = document.getElementById('clothing-upload');
    if (fileInput) fileInput.value = '';
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
              Select Model
            </h3>
            
            {loadingModels ? (
              <div className="text-center py-8">
                <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                <p className="text-slate-400">Loading models...</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {models.map((model) => (
                  <button
                    key={model.id}
                    onClick={() => setSelectedModel(model)}
                    className={`relative rounded-lg overflow-hidden border-2 transition-all duration-300 ${
                      selectedModel?.id === model.id
                        ? 'border-indigo-500 ring-2 ring-indigo-500/20'
                        : 'border-slate-600 hover:border-slate-500'
                    }`}
                  >
                    <img 
                      src={model.image} 
                      alt={model.name}
                      className="w-full h-32 object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    <div className="absolute bottom-2 left-2 right-2">
                      <p className="text-white text-sm font-medium truncate">{model.name}</p>
                      <p className="text-slate-300 text-xs">{model.category}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Style Prompt */}
          <div className="bg-slate-900/50 backdrop-blur border border-slate-800/50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Style Instructions (Optional)
            </h3>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the desired style, lighting, or pose... (e.g., 'studio lighting, professional pose, clean background')"
              className="w-full p-3 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-indigo-500 focus:outline-none resize-none"
              rows={3}
            />
          </div>

          {/* Generate Button */}
          <button
            onClick={handleTryOn}
            disabled={!clothingFile || !selectedModel || isGenerating || (userPlan !== 'enterprise' && usage <= 0)}
            className={`w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-300 flex items-center justify-center space-x-3 ${
              isGenerating || !clothingFile || !selectedModel || (userPlan !== 'enterprise' && usage <= 0)
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
                   !selectedModel ? 'Select a model' :
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
                  <h3 className="text-lg font-semibold text-white">Generated Result</h3>
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
                </div>
                
                {/* Result Metadata */}
                <div className="mt-4 p-4 bg-slate-800/30 rounded-lg">
                  <h4 className="text-white font-medium mb-2">Generation Details</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Model:</span>
                      <span className="text-slate-200">{generatedResult.model.name}</span>
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
                  Upload your clothing image and select a model to see the magic happen
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                  <div className="p-4 bg-slate-800/30 rounded-lg">
                    <FiUpload className="w-6 h-6 text-indigo-400 mx-auto mb-2" />
                    <p className="text-sm text-slate-300">Upload Clothing</p>
                  </div>
                  <div className="p-4 bg-slate-800/30 rounded-lg">
                    <FiUser className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                    <p className="text-sm text-slate-300">Select Model</p>
                  </div>
                  <div className="p-4 bg-slate-800/30 rounded-lg">
                    <FiZap className="w-6 h-6 text-green-400 mx-auto mb-2" />
                    <p className="text-sm text-slate-300">Generate</p>
                  </div>
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