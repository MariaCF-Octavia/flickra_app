import React, { useState, useCallback } from 'react';
import { FiUploadCloud } from 'react-icons/fi';
import PropTypes from 'prop-types';
import { v4 as uuidv4 } from 'uuid';
import VoiceSelector from './VoiceSelector';

const ContentGenerator = ({ type, remaining, onGenerate, debug, className }) => {
    const [input, setInput] = useState('');
    const [file, setFile] = useState(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState('');
    const [fileKey, setFileKey] = useState(uuidv4());
    const [videoUrl, setVideoUrl] = useState(null);
    const [selectedVoice, setSelectedVoice] = useState('');
    const [previewUrl, setPreviewUrl] = useState(null);
    const [generatedImageUrl, setGeneratedImageUrl] = useState(null);
    const [generationMetadata, setGenerationMetadata] = useState(null);

    const getPlaceholder = useCallback(() => {
        const examples = {
            text: "Describe what you want to generate...",
            image: "Describe how you want to transform the image...",
            video: "Describe your video scene...",
            tts: "Enter text to convert to speech..."
        };
        return examples[type];
    }, [type]);

    const handleFileChange = useCallback((e) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            setError('');
            
            // Create preview for images/videos
            const url = URL.createObjectURL(selectedFile);
            setPreviewUrl(url);
        }
    }, []);

    const validateInput = useCallback(() => {
        const userInput = input.trim();
        
        if (userInput.split(/\s+/).length < 3) {
            throw new Error("Please enter at least 3 descriptive words");
        }

        if (type === 'tts' && !selectedVoice) {
            throw new Error("voice_required");
        }

        if (type === 'video' || type === 'image') {
            if (!file) throw new Error("upload");
            if (!['image/jpeg', 'image/png'].includes(file.type)) {
                throw new Error("file_type");
            }
            if (file.size > 5 * 1024 * 1024) {
                throw new Error("file_size");
            }
        }

        return userInput;
    }, [input, type, selectedVoice, file]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setVideoUrl(null);
        setGeneratedImageUrl(null);

        try {
            const userInput = validateInput();
            setIsGenerating(true);
            
            // Add Cloudinary upload for image/video types
            let cloudinaryUrl = null;
            if ((type === 'video' || type === 'image') && file) {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('upload_preset', process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET);
                
                const uploadResponse = await fetch(
                    `https://api.cloudinary.com/v1_1/${process.env.REACT_APP_CLOUDINARY_CLOUD_NAME}/upload`,
                    {
                        method: 'POST',
                        body: formData
                    }
                );
                
                if (!uploadResponse.ok) {
                    throw new Error('Failed to upload image to Cloudinary');
                }
                
                const uploadData = await uploadResponse.json();
                cloudinaryUrl = uploadData.secure_url;
            }

            const generationPayload = {
                type,
                prompt: userInput,
                ...((type === 'video' || type === 'image') && { 
                    image: file,
                    cloudinary_url: cloudinaryUrl
                }),
                ...(type === 'tts' && { 
                    voice_id: selectedVoice,
                    model_id: "eleven_monolingual_v1",
                    stability: 0.5,
                    similarity_boost: 0.75,
                    text: userInput
                })
            };

            if (debug) {
                console.log('Generation payload:', generationPayload);
            }

            const response = await onGenerate(generationPayload);

            if (!response?.success) {
                throw new Error(response.error || "Generation failed");
            }

            if (type === 'video' && response.data?.url) {
                setVideoUrl(response.data.url);
            }

            if (type === 'image' && response.data?.image_url) {
                setGeneratedImageUrl(response.data.image_url);
                setGenerationMetadata(response.data.metadata || null);
            }

            // Reset form on success
            setInput('');
            if (type === 'video' || type === 'image') {
                setFile(null);
                setPreviewUrl(null);
                setFileKey(uuidv4());
            }

        } catch (err) {
            const errorMap = {
                "upload": "Please select an image file first",
                "file_type": "Only JPEG/PNG images are allowed (max 5MB)",
                "file_size": "Image must be smaller than 5MB",
                "session": "Your session expired - please login again",
                "limit_reached": `You've reached your generation limit (${remaining} remaining)`,
                "voice_required": "Please select a voice first",
                "voice_not_found": "Selected voice not available - please choose another",
                "Failed to upload image to Cloudinary": "Image upload failed - please try again",
                "default": err.message || "Generation failed - please try again"
            };
            
            setError(errorMap[err.message] || errorMap.default);
            
            if (err.message.includes("voice_not_found")) {
                console.error("Voice not found - available voices may need to be refreshed");
            }
        } finally {
            setIsGenerating(false);
        }
    };

    const renderFilePreview = () => {
        if (type === 'video') {
            if (videoUrl) {
                return (
                    <div className="mt-4 border rounded-lg overflow-hidden">
                        <video 
                            controls 
                            className="w-full"
                            onError={() => setError('Failed to load video preview')}
                            preload="metadata"
                        >
                            <source src={videoUrl} type="video/mp4" />
                        </video>
                        <div className="p-2 bg-gray-50 flex justify-between items-center">
                            <span className="text-sm text-gray-600">Your generated video</span>
                            <a 
                                href={videoUrl} 
                                download={`generated-video-${Date.now()}.mp4`}
                                className="text-blue-600 hover:text-blue-800 text-sm"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                Download
                            </a>
                        </div>
                    </div>
                );
            }

            if (previewUrl) {
                return (
                    <div className="mt-4 border rounded-lg overflow-hidden">
                        <img 
                            src={previewUrl} 
                            alt="Upload preview" 
                            className="w-full h-40 object-cover"
                        />
                        <div className="p-2 bg-gray-50 text-sm text-gray-600">
                            Image ready for video generation
                        </div>
                    </div>
                );
            }
        }

        if (type === 'image') {
            if (generatedImageUrl) {
                return (
                    <div className="mt-4 border rounded-lg overflow-hidden">
                        <img 
                            src={generatedImageUrl} 
                            alt="Generated image" 
                            className="w-full h-auto object-cover"
                        />
                        <div className="p-2 bg-gray-50 flex justify-between items-center">
                            <div className="text-sm text-gray-600">
                                {generationMetadata && (
                                    <div className="space-y-1">
                                        <p><strong>Prompt:</strong> {generationMetadata.prompt}</p>
                                        <p><strong>Seed:</strong> {generationMetadata.seed || 'Random'}</p>
                                        <p><strong>Strength:</strong> {generationMetadata.image_strength || 0.35}</p>
                                    </div>
                                )}
                            </div>
                            <a 
                                href={generatedImageUrl} 
                                download={`generated-image-${Date.now()}.png`}
                                className="text-blue-600 hover:text-blue-800 text-sm"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                Download
                            </a>
                        </div>
                    </div>
                );
            }

            if (previewUrl) {
                return (
                    <div className="mt-4 border rounded-lg overflow-hidden">
                        <img 
                            src={previewUrl} 
                            alt="Upload preview" 
                            className="w-full h-40 object-cover"
                        />
                        <div className="p-2 bg-gray-50 text-sm text-gray-600">
                            Image ready for transformation
                        </div>
                    </div>
                );
            }
        }

        return null;
    };

    return (
        <div className={`bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all ${className}`}>
            <div className="flex items-center gap-2 mb-4">
                <h3 className="text-lg font-semibold capitalize">
                    {type === 'tts' ? 'Text-to-Speech' : `${type} Generation`}
                </h3>
                {typeof remaining === 'number' && (
                    <span className={`text-sm ${
                        remaining <= 0 ? 'text-red-500' : 'text-gray-500'
                    }`}>
                        {remaining > 0 ? `${remaining} remaining` : 'Limit reached'}
                    </span>
                )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={getPlaceholder()}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-300 disabled:bg-gray-100"
                    rows={4}
                    disabled={isGenerating}
                    required
                />

                {type === 'tts' && (
                    <div className="mt-2">
                        <VoiceSelector 
                            onSelect={setSelectedVoice}
                            initialVoiceId={selectedVoice}
                        />
                    </div>
                )}

                {(type === 'video' || type === 'image') && (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                        <label className="cursor-pointer">
                            <input
                                key={fileKey}
                                type="file"
                                accept="image/jpeg,image/png"
                                onChange={handleFileChange}
                                className="hidden"
                                disabled={isGenerating}
                                required
                            />
                            <div className="space-y-2">
                                <FiUploadCloud className="w-8 h-8 text-gray-400 mx-auto" />
                                <p className="text-sm text-gray-600">
                                    {file ? file.name : `Upload ${type === 'image' ? 'source' : 'base'} image (JPEG/PNG, max 5MB)`}
                                </p>
                                {file && (
                                    <p className={`text-xs ${
                                        file.size > 5 * 1024 * 1024 ? 'text-red-500' : 'text-gray-500'
                                    }`}>
                                        Size: {(file.size / 1024 / 1024).toFixed(2)} MB
                                    </p>
                                )}
                            </div>
                        </label>
                    </div>
                )}

                {renderFilePreview()}

                {error && (
                    <p className="text-red-500 text-sm animate-pulse">
                        {error}
                    </p>
                )}

                <button
                    type="submit"
                    disabled={isGenerating || (typeof remaining === 'number' && remaining <= 0)}
                    className={`w-full py-3 rounded-lg font-medium transition-all ${
                        isGenerating || remaining <= 0
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white hover:shadow-lg'
                    }`}
                >
                    {isGenerating ? (
                        <span className="flex items-center justify-center gap-2">
                            <span className="animate-spin inline-block w-4 h-4 border-2 border-current rounded-full border-t-transparent" />
                            Generating...
                        </span>
                    ) : (
                        type === 'tts' ? 'Generate Speech' : `Create ${type.charAt(0).toUpperCase() + type.slice(1)}`
                    )}
                </button>
            </form>
        </div>
    );
};

ContentGenerator.propTypes = {
    type: PropTypes.oneOf(['text', 'image', 'video', 'tts']).isRequired,
    remaining: PropTypes.number,
    onGenerate: PropTypes.func.isRequired,
    debug: PropTypes.bool,
    className: PropTypes.string
};

ContentGenerator.defaultProps = {
    debug: false,
    className: ''
};

export default ContentGenerator;