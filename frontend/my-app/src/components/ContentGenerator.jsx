 import React, { useState, useCallback, useEffect } from 'react';
import { FiUploadCloud, FiImage, FiLayers, FiClock, FiPlay, FiZap, FiVideo, FiMusic, FiStar} from 'react-icons/fi';
import PropTypes from 'prop-types';
import { v4 as uuidv4 } from 'uuid';
import VoiceSelector from './VoiceSelector.jsx';

const ContentGenerator = ({ type, remaining, onGenerate, debug, className, darkMode, buttonGradient }) => {
    const [input, setInput] = useState('');
    const [file, setFile] = useState(null);
    const [referenceFile, setReferenceFile] = useState(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState('');
    const [fileKey, setFileKey] = useState(uuidv4());
    const [videoUrl, setVideoUrl] = useState(null);
    const [selectedVoice, setSelectedVoice] = useState('');
    const [previewUrl, setPreviewUrl] = useState(null);
    const [referencePreviewUrl, setReferencePreviewUrl] = useState(null);
    const [generatedImageUrl, setGeneratedImageUrl] = useState(null);
    const [generationMetadata, setGenerationMetadata] = useState(null);
    const [generationId, setGenerationId] = useState(null);
    const [pollingAttempts, setPollingAttempts] = useState(0);

    // NEW: Video polling states
    const [videoJobId, setVideoJobId] = useState(null);
    const [videoPollingAttempts, setVideoPollingAttempts] = useState(0);
    const [generationStatus, setGenerationStatus] = useState('');
    
    // NEW: Prevent type changes during video generation
    const [lockedType, setLockedType] = useState(null);
    const effectiveType = lockedType || type;

    // Video mode states
    const [videoMode, setVideoMode] = useState('single_image');
    const [lastFrameFile, setLastFrameFile] = useState(null);
    const [lastFramePreviewUrl, setLastFramePreviewUrl] = useState(null);

    // Duration state for video generation
    const [duration, setDuration] = useState(10);

    // Model selection state for video - UPDATED to use veo2
    const [selectedModel, setSelectedModel] = useState('gen3a_turbo');

    // Video models configuration - UPDATED: Removed provider info and changed veo3 to veo2
    const videoModels = [
        {
            id: 'gen3a_turbo',
            name: 'Standard',
            icon: FiZap,
            description: 'Fast & reliable',
            badge: 'Fast',
            hasAudio: false,
            color: 'blue'
        },
        {
            id: 'veo2',  // CHANGED: veo3 -> veo2
            name: 'Premium',  // CHANGED: More generic name
            icon: FiStar,  // CHANGED: Removed music icon since veo2 doesn't have audio
            description: 'Highest quality',  // CHANGED: Removed audio reference
            badge: 'Pro',  // CHANGED: Removed audio badge
            hasAudio: false,  // CHANGED: veo2 doesn't have audio
            color: 'purple'
        }
    ];

    const getPlaceholder = useCallback(() => {
        const examples = {
            text: "Describe what you want to generate...",
            image: referenceFile 
                ? "Describe your desired scene (e.g., 'luxury spa environment with candles and marble')"
                : "Professional product photo (describe background/setting) make sure to @ both images",
            video: videoMode === 'keyframes' 
                ? "Describe the transition between images (e.g., 'woman picks up sunscreen and applies it smoothly')"
                : selectedModel === 'veo2'  // CHANGED: veo3 -> veo2, removed audio reference
                    ? "Describe your video scene in detail (e.g., 'elegant perfume commercial with smooth camera movement')"
                    : "Describe your video scene...",
            tts: "Enter text to convert to speech..."
        };
        
        return examples[type];
    }, [type, referenceFile, videoMode, selectedModel]);

    const handleFileChange = useCallback((e) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            if (selectedFile.size > 10 * 1024 * 1024) {
                setError('Product image must be less than 10MB');
                return;
            }
            setFile(selectedFile);
            setError('');
            setPreviewUrl(URL.createObjectURL(selectedFile));
            
            document.getElementById('prompt-input')?.focus();
        }
    }, []);

    const handleLastFrameChange = useCallback((e) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            if (selectedFile.size > 10 * 1024 * 1024) {
                setError('Last frame image must be less than 10MB');
                return;
            }
            setLastFrameFile(selectedFile);
            setLastFramePreviewUrl(URL.createObjectURL(selectedFile));
            setError('');
        }
    }, []);

    const handleReferenceChange = useCallback((e) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            if (selectedFile.size > 5 * 1024 * 1024) {
                setError('Reference image must be less than 5MB');
                return;
            }
            setReferenceFile(selectedFile);
            setReferencePreviewUrl(URL.createObjectURL(selectedFile));
            setError('');
        }
    }, []);

    const withRateLimit = async (apiCall, maxRetries = 3) => {
        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                const response = await apiCall();
                return response;
            } catch (error) {
                const is429Error = error.message.includes('429') || 
                                  error.message.includes('Too Many Requests') ||
                                  error.message.includes('Status 429');
                
                if (is429Error && attempt < maxRetries - 1) {
                    const waitTime = Math.pow(2, attempt + 1) * 2000;
                    console.log(`Rate limited. Waiting ${waitTime}ms before retry ${attempt + 1}/${maxRetries}`);
                    await new Promise(resolve => setTimeout(resolve, waitTime));
                    continue;
                }
                throw error;
            }
        }
    };

    const [isPolling, setIsPolling] = useState(false);
    const [consecutiveErrors, setConsecutiveErrors] = useState(0);

    // NEW: Video polling effect
      useEffect(() => {
        console.log("🔍 POLLING useEffect triggered - videoJobId:", videoJobId);
        console.log("🔍 POLLING useEffect triggered - effectiveType:", effectiveType);
        console.log("🔍 POLLING useEffect triggered - originalType:", type);
        console.log("🔍 POLLING useEffect triggered - isGenerating:", isGenerating);
        
        // FIX: Only check if videoJobId exists - ignore type changes from parent
        if (!videoJobId) {
            console.log("🔍 POLLING useEffect exiting early - no videoJobId");
            return;
        }
        
        console.log("🔍 STARTING POLLING for job:", videoJobId);

        let isMounted = true;
        let attempts = 0;
        let pollInterval;

        const pollVideoStatus = async () => {
            if (isPolling) return;
            setIsPolling(true);

            try {
                console.log(`Polling video status for job ${videoJobId}, attempt ${attempts + 1}`);
                
                // Use the correct endpoint format based on your backend
                const statusResponse = await fetch(`https://fastapi-app-production-ac48.up.railway.app/api/video-status/${videoJobId}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (!statusResponse.ok) {
                    throw new Error(`Status check failed: ${statusResponse.status}`);
                }

                const result = await statusResponse.json();
                
                if (!isMounted) return;

                console.log(`Video status response:`, result);

                // Update status message - UPDATED: Removed AI-specific references
                const statusMessages = {
                    'processing': 'Starting video generation...',
                    'calling_api': 'Connecting to AI service...',
                    'api_processing': selectedModel === 'veo2' ? 'Generating premium video...' : 'Generating video...',  // CHANGED: Removed audio reference
                    'completed': 'Video generation complete!',
                    'failed': 'Generation failed',
                    'not_found': 'Job not found'
                };
                
                setGenerationStatus(statusMessages[result.status] || 'Processing...');

                if (result.status === 'completed' && result.video_url) {
                    console.log('Video generation completed:', result.video_url);
                    setVideoUrl(result.video_url);
                    setGenerationMetadata({
                        ...(result.metadata || {}),
                        model: selectedModel,
                        has_native_audio: false,  // CHANGED: veo2 doesn't have audio
                    });
                    setVideoJobId(null);
                    setIsGenerating(false);
                    setConsecutiveErrors(0);
                    setGenerationStatus('');
                    setVideoPollingAttempts(0);
                    setLockedType(null); // Unlock type when video completes
                } else if (result.status === 'failed') {
                    const errorMsg = result.error || 'Video generation failed';
                    console.error('Video generation failed:', errorMsg);
                    setError(errorMsg);
                    setIsGenerating(false);
                    setVideoJobId(null);
                    setGenerationStatus('');
                    setVideoPollingAttempts(0);
                    setLockedType(null); // Unlock type on failure
                } else if (attempts >= 120) { // 10 minutes at 5-second intervals
                    console.error('Video generation timed out after 10 minutes');
                    setError('Video generation timed out. Please try again.');
                    setIsGenerating(false);
                    setVideoJobId(null);
                    setGenerationStatus('');
                    setVideoPollingAttempts(0);
                    setLockedType(null); // Unlock type on timeout
                } else {
                    // Continue polling
                    attempts++;
                    setVideoPollingAttempts(attempts);
                    
                    // Progressive delay: start with 5s, increase to 10s after 5 minutes
                    const delay = attempts > 60 ? 10000 : 5000;
                    pollInterval = setTimeout(pollVideoStatus, delay);
                }
            } catch (err) {
                if (!isMounted) return;
                
                console.error('Error polling video status:', err);
                
                const is429Error = err.message.includes('429') || 
                                   err.message.includes('Too Many Requests') ||
                                   err.message.includes('Status 429');
                
                if (is429Error) {
                    setConsecutiveErrors(prev => prev + 1);
                    
                    if (consecutiveErrors >= 3) {
                        setError('Too many rate limit errors. Please wait a few minutes before trying again.');
                        setIsGenerating(false);
                        setVideoJobId(null);
                        setGenerationStatus('');
                        setLockedType(null);
                        return;
                    }
                    
                    console.log('Rate limited during video polling, waiting longer before retry...');
                    const backoffDelay = Math.min(10000 + (consecutiveErrors * 5000), 30000);
                    pollInterval = setTimeout(pollVideoStatus, backoffDelay);
                } else {
                    setConsecutiveErrors(0);
                    
                    // For network errors, retry a few times before giving up
                    if (attempts < 5) {
                        console.log('Network error during polling, retrying...');
                        pollInterval = setTimeout(pollVideoStatus, 10000);
                        attempts++;
                    } else {
                        setError(`Network error: ${err.message}`);
                        setIsGenerating(false);
                        setVideoJobId(null);
                        setGenerationStatus('');
                        setLockedType(null);
                    }
                }
            } finally {
                setIsPolling(false);
            }
        };

        // Start polling after a short delay
        pollInterval = setTimeout(pollVideoStatus, 3000);

        return () => {
            isMounted = false;
            clearTimeout(pollInterval);
            setIsPolling(false);
        };
    }, [videoJobId, selectedModel, consecutiveErrors]); 

    // Existing image polling effect (unchanged)
    useEffect(() => {
        if (!generationId || type !== 'image') return;

        let isMounted = true;
        let attempts = 0;
        let pollInterval;

        const poll = async () => {
            if (isPolling) return;
            setIsPolling(true);

            try {
                const result = await withRateLimit(() => onGenerate({ 
                    type: 'poll_image',
                    generation_id: generationId,
                    reference_expected: !!referenceFile
                }));
                
                if (!isMounted) return;

                if (result.status === 'completed') {
                    setGeneratedImageUrl(result.image_url);
                    setGenerationMetadata({
                        ...(result.metadata || {}),
                        reference_used: !!referenceFile
                    });
                    setGenerationId(null);
                    setIsGenerating(false);
                    setConsecutiveErrors(0);
                } else if (attempts >= 20) {
                    setError('Image generation timed out');
                    setIsGenerating(false);
                    setGenerationId(null);
                } else {
                    attempts++;
                    const delay = Math.min(3000 + (attempts * 1000), 10000);
                    pollInterval = setTimeout(poll, delay);
                }
            } catch (err) {
                if (!isMounted) return;
                
                const is429Error = err.message.includes('429') || 
                                   err.message.includes('Too Many Requests') ||
                                   err.message.includes('Status 429');
                
                if (is429Error) {
                    setConsecutiveErrors(prev => prev + 1);
                    
                    if (consecutiveErrors >= 3) {
                        setError('Too many rate limit errors. Please wait a few minutes before trying again.');
                        setIsGenerating(false);
                        setGenerationId(null);
                        return;
                    }
                    
                    console.log('Rate limited during polling, waiting longer before retry...');
                    const backoffDelay = Math.min(10000 + (consecutiveErrors * 5000), 30000);
                    pollInterval = setTimeout(poll, backoffDelay);
                } else {
                    setConsecutiveErrors(0);
                    setError(err.message);
                    setIsGenerating(false);
                    setGenerationId(null);
                }
            } finally {
                setIsPolling(false);
            }
        };

        pollInterval = setTimeout(poll, 3000);

        return () => {
            isMounted = false;
            clearTimeout(pollInterval);
            setIsPolling(false);
        };
    }, [generationId, type, referenceFile, consecutiveErrors]);

    const validateInput = useCallback(() => {
        const userInput = input.trim();
        
        if (type === 'image') {
            if (userInput.split(/\s+/).length < 3) {
                throw new Error("Please enter at least 3 descriptive words");
            }
        }

        if (type === 'tts' && !selectedVoice) {
            throw new Error("voice_required");
        }

        if ((type === 'video' || type === 'image') && !file) {
            throw new Error("upload");
        }

        if (type === 'video' && videoMode === 'keyframes' && !lastFrameFile) {
            throw new Error("last_frame_required");
        }

        // UPDATED: veo2 doesn't support keyframes yet (similar to veo3)
        if (type === 'video' && selectedModel === 'veo2' && videoMode === 'keyframes') {
            throw new Error("veo2_keyframes_not_supported");
        }

        if (file) {
            if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
                throw new Error("file_type");
            }
            if (file.size > 10 * 1024 * 1024) {
                throw new Error("file_size");
            }
        }

        return userInput;
    }, [input, type, selectedVoice, file, referenceFile, videoMode, lastFrameFile, selectedModel]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setVideoUrl(null);
        setGeneratedImageUrl(null);
        setGenerationId(null);
        setVideoJobId(null); // NEW: Reset video job ID
        setPollingAttempts(0);
        setVideoPollingAttempts(0); // NEW: Reset video polling attempts
        setConsecutiveErrors(0);
        setGenerationStatus(''); // NEW: Reset status

        console.log("handleSubmit called, current state:", {
            type,
            hasFile: !!file,
            hasReferenceFile: !!referenceFile,
            videoMode,
            hasLastFrameFile: !!lastFrameFile,
            duration,
            selectedModel,
            inputLength: input?.length || 0,
            isGenerating
        });

        try {
            const buttonShouldBeDisabled = isGenerating || 
                (typeof remaining === 'number' && remaining <= 0);
            
            if (buttonShouldBeDisabled) {
                console.log("Submission prevented - button should be disabled");
                return;
            }

            const userInput = validateInput();
            console.log("Input validated:", userInput);
            
            setIsGenerating(true);

            let contentObject = {
                type: type,
                prompt: userInput
            };

            const formData = new FormData();
            formData.append('type', type);
            formData.append('prompt', userInput);

            console.log("Preparing content for type:", type);

            if (type === 'image') {
                if (!file) {
                    console.error("No file selected for image generation");
                    throw new Error("upload");
                }
                
                contentObject.image = file;
                
                if (referenceFile) {
                    contentObject.referenceImage = referenceFile;
                    console.log("Reference image added for background styling");
                }
            } 
            else if (type === 'video' && file) {
                console.log("Video generation with mode:", videoMode, "duration:", duration, "model:", selectedModel);
                
                contentObject.duration = duration;
                contentObject.model = selectedModel;
                
                if (videoMode === 'keyframes' && lastFrameFile) {
                    // UPDATED: Block veo2 keyframes for now
                    if (selectedModel === 'veo2') {
                        throw new Error("veo2_keyframes_not_supported");
                    }
                    
                    console.log("Using keyframes mode with two images");
                    
                    const uploadFormData1 = new FormData();
                    uploadFormData1.append('file', file);
                    uploadFormData1.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);
                    
                    const uploadFormData2 = new FormData();
                    uploadFormData2.append('file', lastFrameFile);
                    uploadFormData2.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);
                    
                    console.log("Uploading both images to Cloudinary...");
                    
                    const [uploadResponse1, uploadResponse2] = await Promise.all([
                        withRateLimit(async () => 
                            fetch(`https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/upload`, {
                                method: 'POST', 
                                body: uploadFormData1 
                            })
                        ),
                        withRateLimit(async () => 
                            fetch(`https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/upload`, {
                                method: 'POST', 
                                body: uploadFormData2 
                            })
                        )
                    ]);
                    
                    if (!uploadResponse1.ok || !uploadResponse2.ok) {
                        throw new Error('Failed to upload images to Cloudinary');
                    }
                    
                    const [uploadData1, uploadData2] = await Promise.all([
                        uploadResponse1.json(),
                        uploadResponse2.json()
                    ]);
                    
                    console.log("Both images uploaded successfully");
                    
                    contentObject.videoMode = 'keyframes';
                    contentObject.promptImageUrl = uploadData1.secure_url;
                    contentObject.lastFrameImageUrl = uploadData2.secure_url;
                    contentObject.image = file;
                    contentObject.lastFrameImage = lastFrameFile;
                    
                } else {
                    console.log("Using single image mode with model:", selectedModel);
                    
                    const uploadFormData = new FormData();
                    uploadFormData.append('file', file);
                    uploadFormData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);
                    
                    console.log("Uploading to Cloudinary...");
                    
                    const uploadResponse = await withRateLimit(async () => 
                        fetch(`https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/upload`, {
                            method: 'POST', 
                            body: uploadFormData 
                        })
                    );
                    
                    if (!uploadResponse.ok) {
                        console.error("Cloudinary upload failed:", await uploadResponse.text());
                        throw new Error('Failed to upload image to Cloudinary');
                    }
                    
                    const uploadData = await uploadResponse.json();
                    console.log("Cloudinary upload successful:", uploadData.secure_url);
                    
                    contentObject.videoMode = 'image_to_video';
                    contentObject.promptImageUrl = uploadData.secure_url;
                    contentObject.promptText = userInput;
                    contentObject.ratio = "1280:768";
                    contentObject.image = file;
                    
                    formData.append('cloudinary_url', uploadData.secure_url);
                    formData.append('image', file);
                }
            } 
            else if (type === 'tts') {
                if (!selectedVoice) {
                    console.error("No voice selected for TTS");
                    throw new Error("voice_required");
                }
                
                console.log("TTS generation with voice:", selectedVoice);
                
                contentObject.voice_id = selectedVoice;
                contentObject.stability = 0.5;
                contentObject.similarity_boost = 0.75;
                
                formData.append('voice_id', selectedVoice);
                formData.append('model_id', "eleven_monolingual_v1");
                formData.append('stability', "0.5");
                formData.append('similarity_boost', "0.75");
                formData.append('text', userInput);
            }

            console.log("Content objects prepared. Calling onGenerate...");
            
            let response;
            try {
                console.log("Trying object approach with:", contentObject);
                response = await withRateLimit(() => onGenerate(contentObject));
                console.log("Object approach response:", response);
            } catch (objError) {
                console.error("Object approach failed:", objError);
                console.log("Falling back to FormData approach");
                
                try {
                    response = await withRateLimit(() => onGenerate(formData));
                    console.log("FormData approach response:", response);
                } catch (formDataError) {
                    console.error("Both approaches failed:", formDataError);
                    throw new Error("Generation failed with both approaches");
                }
            }

            // NEW: Handle async video response ONLY
            if (type === 'video') {
                if (response?.success && (response.data?.job_id || response.data?.task_id)) {
                    const jobId = response.data?.job_id || response.data?.task_id;
                    console.log("Video generation started with job_id:", jobId);
                    setVideoJobId(jobId);
                    setLockedType('video'); // NEW: Lock the type to prevent parent changes
                    console.log("🔍 DEBUG: videoJobId set to:", jobId);
                    console.log("🔍 DEBUG: Current type:", type);
                    console.log("🔍 DEBUG: Locked type to video");
                    console.log("🔍 DEBUG: Should trigger polling useEffect");
                    setGenerationStatus('Video generation started...');
                    // Don't reset form yet - wait for completion
                    // Don't try to use any video URL from this response
                    return;
                } else {
                    throw new Error("Backend didn't return job_id for async processing");
                }
            }

            if (!response?.success) {
                console.error("Generation response indicated failure:", response);
                throw new Error(response.error || "Generation failed");
            }

            console.log("Generation successful:", response);

            // Handle other types (image, tts, etc.) - NOT video
            if (type === 'image') {
                if (response.data?.generation_id) {
                    console.log("Setting generation ID for polling:", response.data.generation_id);
                    setGenerationId(response.data.generation_id);
                } else if (response.data?.image_url) {
                    console.log("Setting generated image URL:", response.data.image_url);
                    setGeneratedImageUrl(response.data.image_url);
                    setGenerationMetadata({
                        ...(response.data.metadata || {}),
                        reference_used: !!referenceFile
                    });
                }
            }

            // Only reset form for non-polling generations (NOT video)
            if (type !== 'image' && type !== 'video') {
                console.log("Resetting form after successful generation");
                resetForm();
            } else if (type === 'image' && !response.data?.generation_id) {
                console.log("Resetting form after successful image generation");
                resetForm();
            }

        } catch (err) {
            console.error("Error in handleSubmit:", err);
            handleGenerationError(err);
        }
    };

    const resetForm = () => {
        setInput('');
        if (type === 'video' || type === 'image') {
            setFile(null);
            setReferenceFile(null);
            setLastFrameFile(null);
            setPreviewUrl(null);
            setReferencePreviewUrl(null);
            setLastFramePreviewUrl(null);
            setFileKey(uuidv4());
        }
        setIsGenerating(false);
        setConsecutiveErrors(0);
        setGenerationStatus(''); // NEW: Reset status
    };

    const handleGenerationError = (err) => {
        const errorMap = {
            "upload": "Please select an image file first",
            "file_type": "Only JPEG/PNG/WebP images are allowed (max 10MB)",
            "file_size": "Image must be smaller than 10MB",
            "last_frame_required": "Please upload the last frame image for keyframes mode",
            "veo2_keyframes_not_supported": "Keyframes mode is not yet supported with Premium model. Please use single image mode or switch to Standard model.",  // UPDATED: More generic message
            "session": "Your session expired - please login again",
            "limit_reached": `You've reached your generation limit (${remaining} remaining)`,
            "voice_required": "Please select a voice first",
            "voice_not_found": "Selected voice not available - please choose another",
            "Failed to upload image to Cloudinary": "Image upload failed - please try again",
            "no_image_data": "The AI didn't return any image data",
            "nsfw_content": "Content filtered - please try a different image/prompt",
            "default": err.message || "Generation failed - please try again"
        };
        
        const is429Error = err.message.includes('429') || 
                           err.message.includes('Too Many Requests') ||
                           err.message.includes('Status 429');
        
        if (is429Error) {
            setError("Server is busy. Please wait a moment before trying again.");
        } else {
            setError(errorMap[err.message] || errorMap.default);
        }
        
        setIsGenerating(false);
        setGenerationStatus(''); // NEW: Reset status on error
        
        if (debug) {
            console.error('Generation error:', err);
        }
    };

    const renderFilePreview = () => {
        if (type === 'video') {
            if (videoUrl) {
                const currentModel = videoModels.find(m => m.id === selectedModel);
                return (
                    <div className={`mt-3 border rounded-lg overflow-hidden ${
                        darkMode ? 'border-gray-600' : 'border-gray-200'
                    }`}>
                        <video 
                            controls 
                            className="w-full"
                            onError={() => setError('Failed to load video preview')}
                            preload="metadata"
                        >
                            <source src={videoUrl} type="video/mp4" />
                        </video>
                        <div className={`p-2 flex justify-between items-center ${
                            darkMode ? 'bg-gray-700' : 'bg-gray-50'
                        }`}>
                            <div className="flex items-center gap-2">
                                <span className={`text-xs ${
                                    darkMode ? 'text-gray-200' : 'text-gray-600'
                                }`}>Your generated video ({duration}s)</span>
                                {/* REMOVED: Audio badge since veo2 doesn't have audio */}
                            </div>
                            <a 
                                href={videoUrl} 
                                download={`generated-video-${Date.now()}.mp4`}
                                className="text-pink-400 hover:text-pink-300 text-xs"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                Download
                            </a>
                        </div>
                    </div>
                );
            }

            if (videoMode === 'keyframes' && (previewUrl || lastFramePreviewUrl)) {
                return (
                    <div className="grid grid-cols-2 gap-2 mt-3">
                        {previewUrl && (
                            <div className={`border rounded-lg overflow-hidden ${
                                darkMode ? 'border-gray-600' : 'border-gray-200'
                            }`}>
                                <img 
                                    src={previewUrl} 
                                    alt="First frame" 
                                    className="w-full h-20 object-cover"
                                />
                                <div className={`p-1 text-xs text-center ${
                                    darkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-50 text-gray-600'
                                }`}>
                                    Last Frame
                                </div>
                            </div>
                        )}
                    </div>
                );
            }

            if (previewUrl) {
                return (
                    <div className={`mt-3 border rounded-lg overflow-hidden ${
                        darkMode ? 'border-gray-600' : 'border-gray-200'
                    }`}>
                        <img 
                            src={previewUrl} 
                            alt="Upload preview" 
                            className="w-full h-24 object-cover"
                            onError={() => setError('Failed to load image preview')}
                        />
                        <div className={`p-1 text-xs ${
                            darkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-50 text-gray-600'
                        }`}>
                            Ready for video generation
                        </div>
                    </div>
                );
            }
        }

        if (type === 'image') {
            if (generatedImageUrl) {
                return (
                    <div className={`mt-3 border rounded-lg overflow-hidden ${
                        darkMode ? 'border-gray-600' : 'border-gray-200'
                    }`}>
                        <img 
                            src={generatedImageUrl} 
                            alt="Generated image" 
                            className="w-full h-auto object-cover"
                            onError={() => setError('Failed to load generated image')}
                        />
                        <div className={`p-2 flex justify-between items-center ${
                            darkMode ? 'bg-gray-700' : 'bg-gray-50'
                        }`}>
                            <div className={`text-xs ${
                                darkMode ? 'text-gray-200' : 'text-gray-600'
                            }`}>
                                {generationMetadata && (
                                    <div className="space-y-1">
                                        <p className={darkMode ? 'text-gray-200' : 'text-gray-700'}>
                                            <strong className={darkMode ? 'text-white' : 'text-gray-900'}>Prompt:</strong> {generationMetadata.prompt}
                                        </p>
                                        {generationMetadata.reference_used && (
                                            <p className={darkMode ? 'text-gray-200' : 'text-gray-700'}>
                                                <strong className={darkMode ? 'text-white' : 'text-gray-900'}>Style:</strong> Custom reference applied
                                            </p>
                                        )}
                                        <p className={darkMode ? 'text-gray-200' : 'text-gray-700'}>
                                            <strong className={darkMode ? 'text-white' : 'text-gray-900'}>Seed:</strong> {generationMetadata.seed || 'Random'}
                                        </p>
                                        <p className={darkMode ? 'text-gray-200' : 'text-gray-700'}>
                                            <strong className={darkMode ? 'text-white' : 'text-gray-900'}>Strength:</strong> {generationMetadata.image_strength || 0.85}
                                        </p>
                                    </div>
                                )}
                            </div>
                            <a 
                                href={generatedImageUrl} 
                                download={`generated-image-${Date.now()}.png`}
                                className="text-pink-400 hover:text-pink-300 text-xs"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                Download
                            </a>
                        </div>
                    </div>
                );
            }

            if (previewUrl || referencePreviewUrl) {
                return (
                    <div className="grid grid-cols-2 gap-2 mt-3">
                        {previewUrl && (
                            <div className={`border rounded-lg overflow-hidden ${
                                darkMode ? 'border-gray-600' : 'border-gray-200'
                            }`}>
                                <img 
                                    src={previewUrl} 
                                    alt="Product preview" 
                                    className="w-full h-20 object-cover"
                                />
                                <div className={`p-1 text-xs text-center ${
                                    darkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-50 text-gray-600'
                                }`}>
                                    Your Product
                                </div>
                            </div>
                        )}
                        {referencePreviewUrl && (
                            <div className={`border rounded-lg overflow-hidden ${
                                darkMode ? 'border-gray-600' : 'border-gray-200'
                            }`}>
                                <img 
                                    src={referencePreviewUrl} 
                                    alt="Style reference" 
                                    className="w-full h-20 object-cover"
                                />
                                <div className={`p-1 text-xs text-center ${
                                    darkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-50 text-gray-600'
                                }`}>
                                    Style Reference
                                </div>
                            </div>
                        )}
                    </div>
                );
            }
        }

        return null;
    };

    return (
        <div className={className}>
            <form onSubmit={handleSubmit} className="space-y-3">
                {/* Model Selector for Video - UPDATED: Removed provider info */}
                {type === 'video' && (
                    <div className="space-y-2">
                        <div className={`text-xs font-medium ${
                            darkMode ? 'text-gray-200' : 'text-gray-700'
                        }`}>
                            AI Model
                        </div>
                        <div className="grid grid-cols-1 gap-2">
                            {videoModels.map((model) => {
                                const Icon = model.icon;
                                const isSelected = selectedModel === model.id;
                                const colorClasses = {
                                    blue: isSelected 
                                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 border-blue-600 text-white' 
                                        : (darkMode 
                                            ? 'bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600' 
                                            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'),
                                    purple: isSelected 
                                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 border-purple-600 text-white' 
                                        : (darkMode 
                                            ? 'bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600' 
                                            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50')
                                };

                                return (
                                    <button
                                        key={model.id}
                                        type="button"
                                        onClick={() => {
                                            setSelectedModel(model.id);
                                            // Reset keyframes if switching to veo2
                                            if (model.id === 'veo2' && videoMode === 'keyframes') {
                                                setVideoMode('single_image');
                                                setLastFrameFile(null);
                                                setLastFramePreviewUrl(null);
                                            }
                                        }}
                                        className={`p-3 rounded-lg border text-sm font-medium transition-all flex items-center justify-between ${
                                            colorClasses[model.color]
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <Icon className="w-4 h-4" />
                                            <div className="text-left">
                                                <div className="font-medium">{model.name}</div>
                                                <div className={`text-xs ${
                                                    isSelected ? 'text-white/80' : (darkMode ? 'text-gray-400' : 'text-gray-500')
                                                }`}>
                                                    {model.description}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {/* REMOVED: Audio icon since veo2 doesn't have audio */}
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                                isSelected 
                                                    ? 'bg-white/20 text-white' 
                                                    : (model.color === 'purple' 
                                                        ? 'bg-purple-100 text-purple-800' 
                                                        : 'bg-blue-100 text-blue-800')
                                            }`}>
                                                {model.badge}
                                            </span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                        
                        {/* Show warning if veo2 + keyframes - UPDATED */}
                        {selectedModel === 'veo2' && videoMode === 'keyframes' && (
                            <div className="text-amber-400 text-xs bg-amber-500/10 border border-amber-500/20 rounded-lg p-2 flex items-center gap-2">
                                <FiZap className="w-3 h-3" />
                                Keyframes mode not yet supported with Premium model. Switching to single image mode.
                            </div>
                        )}
                    </div>
                )}

                {/* Video Mode Selector - More Compact */}
                {type === 'video' && (
                    <div className="space-y-2">
                        <div className={`text-xs font-medium ${
                            darkMode ? 'text-gray-200' : 'text-gray-700'
                        }`}>
                            Mode
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setVideoMode('single_image');
                                    setLastFrameFile(null);
                                    setLastFramePreviewUrl(null);
                                }}
                                className={`p-2 rounded-lg border text-xs font-medium transition-all flex items-center justify-center gap-1 ${
                                    videoMode === 'single_image'
                                        ? 'bg-gradient-to-r from-pink-600 to-rose-600 border-pink-600 text-white' 
                                        : (darkMode 
                                            ? 'bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600' 
                                            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50')
                                }`}
                            >
                                <FiImage className="w-3 h-3" />
                                Single
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    if (selectedModel === 'veo2') {
                                        setError('Keyframes mode not yet supported with Premium model. Please use single image mode or switch to Standard model.');
                                        return;
                                    }
                                    setVideoMode('keyframes');
                                }}
                                disabled={selectedModel === 'veo2'}
                                className={`p-2 rounded-lg border text-xs font-medium transition-all flex items-center justify-center gap-1 ${
                                    selectedModel === 'veo2'
                                        ? (darkMode ? 'bg-gray-800 border-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed')
                                        : videoMode === 'keyframes'
                                            ? 'bg-gradient-to-r from-pink-600 to-rose-600 border-pink-600 text-white'
                                            : (darkMode 
                                                ? 'bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600' 
                                                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50')
                                }`}
                            >
                                <FiLayers className="w-3 h-3" />
                                Keyframes
                                {selectedModel === 'veo2' && (
                                    <span className="text-xs opacity-60">(Soon)</span>
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {/* Duration Selector for Video - More Compact */}
                {type === 'video' && (
                    <div className="space-y-2">
                        <div className={`text-xs font-medium ${
                            darkMode ? 'text-gray-200' : 'text-gray-700'
                        }`}>
                            Duration
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => setDuration(5)}
                                className={`p-2 rounded-lg border text-xs font-medium transition-all flex items-center justify-center gap-1 ${
                                    duration === 5
                                        ? 'bg-gradient-to-r from-pink-600 to-rose-600 border-pink-600 text-white'
                                        : (darkMode 
                                            ? 'bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600' 
                                            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50')
                                }`}
                            >
                                <FiClock className="w-3 h-3" />
                                5s
                            </button>
                            <button
                                type="button"
                                onClick={() => setDuration(10)}
                                className={`p-2 rounded-lg border text-xs font-medium transition-all flex items-center justify-center gap-1 ${
                                    duration === 10
                                        ? 'bg-gradient-to-r from-pink-600 to-rose-600 border-pink-600 text-white'
                                        : (darkMode 
                                            ? 'bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600' 
                                            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50')
                                }`}
                            >
                                <FiZap className="w-3 h-3" />
                                10s
                            </button>
                        </div>
                    </div>
                )}

                {/* Compact Textarea */}
                <textarea
                    id="prompt-input"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={getPlaceholder()}
                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-pink-300 transition-colors resize-none ${
                        darkMode 
                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:bg-gray-600' 
                            : 'bg-white border-gray-300 text-gray-900 focus:bg-gray-50'
                    } ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}`}
                    rows={2}  // CHANGED: Removed veo3 condition since veo2 doesn't need extra rows for audio
                    disabled={isGenerating}
                    required
                />

                {/* REMOVED: Veo3 Audio Tip since veo2 doesn't have audio */}

                {/* Voice Selector for TTS */}
                {type === 'tts' && (
                    <div className="mt-2">
                        <VoiceSelector 
                            onSelect={setSelectedVoice}
                            initialVoiceId={selectedVoice}
                            darkMode={darkMode}
                        />
                    </div>
                )}

                {/* NEW: Video Generation Status - UPDATED messages */}
                {type === 'video' && isGenerating && generationStatus && (
                    <div className={`text-xs bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 ${
                        darkMode ? 'text-blue-400' : 'text-blue-600'
                    }`}>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="animate-spin inline-block w-3 h-3 border-2 border-current rounded-full border-t-transparent" />
                            <span className="font-medium">{generationStatus}</span>
                        </div>
                        {videoPollingAttempts > 0 && (
                            <div className="text-xs opacity-75">
                                Polling attempt {videoPollingAttempts} • This may take up to 10 minutes
                            </div>
                        )}
                        <div className="mt-2 text-xs opacity-75">
                            {selectedModel === 'veo2' 
                                ? "Premium model generates exceptional quality videos - worth the wait!" 
                                : "Video generation typically takes 2-5 minutes"}
                        </div>
                    </div>
                )}

                {/* File Upload Section - Compact Design */}
                {(type === 'video' || type === 'image') && (
                    <div className="space-y-2">
                        {/* Main File Upload */}
                        <div className={`border-2 border-dashed rounded-lg p-2 text-center transition-colors ${
                            darkMode 
                                ? 'border-gray-600 hover:border-gray-500 bg-gray-700/30' 
                                : 'border-gray-300 hover:border-gray-400 bg-gray-50'
                        }`}>
                            <label className="cursor-pointer block">
                                <input
                                    key={`product-${fileKey}`}
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    onChange={handleFileChange}
                                    className="hidden"
                                    disabled={isGenerating}
                                />
                                <div className="flex items-center justify-center gap-2 py-1">
                                    <FiUploadCloud className={`w-4 h-4 ${
                                        darkMode ? 'text-gray-400' : 'text-gray-400'
                                    }`} />
                                    <div>
                                        <p className={`text-xs font-medium ${
                                            darkMode ? 'text-gray-200' : 'text-gray-600'
                                        }`}>
                                            {file ? file.name.length > 25 ? file.name.substring(0, 22) + '...' : file.name : 
                                                type === 'video' && videoMode === 'keyframes' 
                                                    ? 'First frame'
                                                    : `${type === 'image' ? 'Product' : 'Base'} image`
                                            }
                                        </p>
                                        {file && (
                                            <p className={`text-xs ${
                                                file.size > 10 * 1024 * 1024 
                                                    ? 'text-red-400' 
                                                    : (darkMode ? 'text-gray-400' : 'text-gray-500')
                                            }`}>
                                                {(file.size / 1024 / 1024).toFixed(1)} MB
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </label>
                        </div>

                        {/* Last frame upload for keyframes mode - UPDATED condition */}
                        {type === 'video' && videoMode === 'keyframes' && selectedModel !== 'veo2' && (
                            <div className={`border-2 border-dashed rounded-lg p-2 text-center transition-colors ${
                                darkMode 
                                    ? 'border-blue-500/30 hover:border-blue-500/50 bg-blue-500/5' 
                                    : 'border-blue-300 hover:border-blue-400 bg-blue-50'
                            }`}>
                                <label className="cursor-pointer block">
                                    <input
                                        key={`lastframe-${fileKey}`}
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp"
                                        onChange={handleLastFrameChange}
                                        className="hidden"
                                        disabled={isGenerating}
                                    />
                                    <div className="flex items-center justify-center gap-2 py-1">
                                        <FiLayers className={`w-4 h-4 ${
                                            darkMode ? 'text-blue-400' : 'text-blue-400'
                                        }`} />
                                        <div>
                                            <p className={`text-xs font-medium ${
                                                darkMode ? 'text-blue-300' : 'text-blue-600'
                                            }`}>
                                                {lastFrameFile ? (lastFrameFile.name.length > 25 ? lastFrameFile.name.substring(0, 22) + '...' : lastFrameFile.name) : 'Last frame'}
                                            </p>
                                            {lastFrameFile && (
                                                <p className={`text-xs ${
                                                    lastFrameFile.size > 10 * 1024 * 1024 
                                                        ? 'text-red-400' 
                                                        : (darkMode ? 'text-blue-400' : 'text-blue-500')
                                                }`}>
                                                    {(lastFrameFile.size / 1024 / 1024).toFixed(1)} MB
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </label>
                            </div>
                        )}

                        {/* Style Reference for Image */}
                        {type === 'image' && (
                            <div className={`border-2 border-dashed rounded-lg p-2 text-center transition-colors ${
                                darkMode 
                                    ? 'border-pink-500/30 hover:border-pink-500/50 bg-pink-500/5' 
                                    : 'border-purple-300 hover:border-purple-400 bg-purple-50'
                            }`}>
                                <label className="cursor-pointer block">
                                    <input
                                        key={`reference-${fileKey}`}
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp"
                                        onChange={handleReferenceChange}
                                        className="hidden"
                                        disabled={isGenerating}
                                    />
                                    <div className="flex items-center justify-center gap-2 py-1">
                                        <FiImage className={`w-4 h-4 ${
                                            darkMode ? 'text-pink-400' : 'text-purple-400'
                                        }`} />
                                        <div>
                                            <p className={`text-xs font-medium ${
                                                darkMode ? 'text-pink-300' : 'text-purple-600'
                                            }`}>
                                                {referenceFile ? (referenceFile.name.length > 25 ? referenceFile.name.substring(0, 22) + '...' : referenceFile.name) : 'Style reference'}
                                            </p>
                                            {referenceFile && (
                                                <p className={`text-xs ${
                                                    referenceFile.size > 5 * 1024 * 1024 
                                                        ? 'text-red-400' 
                                                        : (darkMode ? 'text-pink-400' : 'text-purple-500')
                                                }`}>
                                                    {(referenceFile.size / 1024 / 1024).toFixed(1)} MB
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </label>
                            </div>
                        )}
                    </div>
                )}

                {/* File Preview */}
                {renderFilePreview()}

                {/* Error Message */}
                {error && (
                    <div className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg p-2">
                        {error}
                    </div>
                )}

                {/* Submit Button - UPDATED text */}
                <button
                    type="submit"
                    disabled={isGenerating || (typeof remaining === 'number' && remaining <= 0)}
                    onClick={() => {
                        console.log("Button clicked! State:", {
                            type,
                            hasFile: !!file,
                            videoMode,
                            selectedModel,
                            hasLastFrameFile: !!lastFrameFile,
                            duration,
                            isDisabled: isGenerating || (typeof remaining === 'number' && remaining <= 0)
                        });
                    }}
                    className={`w-full py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                        isGenerating || remaining <= 0
                            ? (darkMode ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gray-100 text-gray-400 cursor-not-allowed')
                            : 'bg-gradient-to-r from-pink-600 to-rose-600 text-white hover:shadow-lg hover:shadow-pink-500/20 hover:from-pink-700 hover:to-rose-700 transform hover:scale-[1.02] active:scale-[0.98]'
                    }`}
                >
                    {isGenerating ? (
                        <>
                            <span className="animate-spin inline-block w-4 h-4 border-2 border-current rounded-full border-t-transparent" />
                            <span className="text-sm">
                                {type === 'video' ? 
                                    selectedModel === 'veo2' 
                                        ? `Generating ${duration}s premium video...`  // CHANGED: Removed audio reference
                                        : `Generating ${duration}s video...`
                                : type === 'image' ? 'Creating image...' :
                                  type === 'tts' ? 'Generating speech...' :
                                  'Processing...'}
                            </span>
                        </>
                    ) : (
                        <>
                            {remaining <= 0 ? (
                                <span className="text-sm">No Credits Remaining</span>
                            ) : (type === 'image' || type === 'video') && !file ? (
                                <>
                                    <FiUploadCloud className="w-4 h-4" />
                                    <span className="text-sm">Select Image First</span>
                                </>
                            ) : type === 'video' && videoMode === 'keyframes' && !lastFrameFile ? (
                                <>
                                    <FiLayers className="w-4 h-4" />
                                    <span className="text-sm">Select Last Frame</span>
                                </>
                            ) : (
                                <>
                                    {type === 'tts' ? <FiPlay className="w-4 h-4" /> : 
                                     type === 'video' ? (
                                        selectedModel === 'veo2' ? <FiStar className="w-4 h-4" /> : <FiVideo className="w-4 h-4" />  // CHANGED: Star icon for premium
                                     ) :
                                     type === 'image' ? <FiImage className="w-4 h-4" /> :
                                     <FiZap className="w-4 h-4" />}
                                    <span className="text-sm">
                                        {type === 'tts' ? 'Generate Speech' : 
                                         type === 'video' ? 
                                            selectedModel === 'veo2' 
                                                ? `Create ${duration}s Premium Video`  // CHANGED: Removed audio reference
                                                : `Create ${duration}s Video`
                                        : type === 'image' ? 'Create Image' :
                                          type === 'text' ? 'Create Copy' :
                                          `Create ${type.charAt(0).toUpperCase() + type.slice(1)}`}
                                    </span>
                                </>
                            )}
                        </>
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
    className: PropTypes.string,
    darkMode: PropTypes.bool,
    buttonGradient: PropTypes.string
};

ContentGenerator.defaultProps = {
    debug: false,
    className: '',
    darkMode: false,
    buttonGradient: 'from-pink-600 to-rose-600'
};

export default ContentGenerator;