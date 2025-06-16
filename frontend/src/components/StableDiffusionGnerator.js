 // components/StableDiffusionGenerator.js
import { useState, useRef } from 'react';
import { FiImage, FiVideo, FiUpload, FiDownload } from 'react-icons/fi';

export default function StableDiffusionGenerator({ onGenerationComplete, darkMode, results }) {
    const [mode, setMode] = useState('image'); // 'image' or 'video'
    const [prompt, setPrompt] = useState('');
    const [file, setFile] = useState(null);
    const [generationState, setGenerationState] = useState('idle'); // 'idle', 'generating', 'completed'
    const [progress, setProgress] = useState(0);
    const fileInputRef = useRef();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file || !prompt) return;

        setGenerationState('generating');
        setProgress(0);

        try {
            const formData = new FormData();
            formData.append('image', file);
            formData.append('prompt', prompt);
            
            if (mode === 'video') {
                formData.append('motion_bucket_id', 40); // Example parameter
            }

            const endpoint = mode === 'image' 
                ? '/stable-diffusion/image-to-image' 
                : '/stable-diffusion/image-to-video';

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: formData
            });

            if (!response.ok) {
                throw new Error('Failed to start generation');
            }

            const { generation_id, polling_url, db_record_id } = await response.json();

            // Poll for results
            await pollGenerationResult(polling_url, generation_id, db_record_id);

        } catch (error) {
            console.error('Generation failed:', error);
            setGenerationState('failed');
        }
    };

    const pollGenerationResult = async (pollingUrl, generationId, dbRecordId) => {
        let attempts = 0;
        const maxAttempts = 30;
        const baseDelay = 2000;

        while (attempts < maxAttempts) {
            try {
                const response = await fetch(pollingUrl, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                
                const data = await response.json();
                
                if (data.status === 'completed') {
                    const result = {
                        id: generationId,
                        type: mode,
                        url: data.image_url || data.video_url,
                        prompt,
                        createdAt: new Date().toISOString()
                    };
                    
                    onGenerationComplete(result);
                    setGenerationState('completed');
                    return;
                }

                if (data.status === 'failed') {
                    throw new Error(data.error || 'Generation failed');
                }

                // Update progress
                if (data.progress) {
                    setProgress(parseInt(data.progress));
                }

                // Exponential backoff
                const delay = Math.min(baseDelay * Math.pow(2, attempts), 30000);
                await new Promise(resolve => setTimeout(resolve, delay));
                attempts++;

            } catch (error) {
                console.error('Polling error:', error);
                setGenerationState('failed');
                return;
            }
        }

        throw new Error('Max polling attempts reached');
    };

    return (
        <div className={`rounded-lg p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
            <div className="flex space-x-4 mb-6">
                <button
                    className={`flex items-center px-4 py-2 rounded-md ${mode === 'image' ? (darkMode ? 'bg-gray-700' : 'bg-blue-100 text-blue-600') : (darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100')}`}
                    onClick={() => setMode('image')}
                >
                    <FiImage className="mr-2" />
                    Image to Image
                </button>
                <button
                    className={`flex items-center px-4 py-2 rounded-md ${mode === 'video' ? (darkMode ? 'bg-gray-700' : 'bg-blue-100 text-blue-600') : (darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100')}`}
                    onClick={() => setMode('video')}
                >
                    <FiVideo className="mr-2" />
                    Image to Video
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className={`block mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Prompt
                    </label>
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        className={`w-full p-3 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                        placeholder="Describe what you want to generate..."
                        rows={4}
                        required
                    />
                </div>

                <div>
                    <label className={`block mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Input Image
                    </label>
                    <div 
                        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer ${darkMode ? 'border-gray-600 hover:border-gray-500' : 'border-gray-300 hover:border-gray-400'}`}
                        onClick={() => fileInputRef.current.click()}
                    >
                        {file ? (
                            <div className="relative">
                                <img 
                                    src={URL.createObjectURL(file)} 
                                    alt="Preview" 
                                    className="max-h-64 mx-auto rounded-lg"
                                />
                                <button
                                    type="button"
                                    className={`absolute top-2 right-2 p-1 rounded-full ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-white hover:bg-gray-100'} shadow`}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setFile(null);
                                    }}
                                >
                                    <FiX className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <FiUpload className="mx-auto w-8 h-8" />
                                <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                    Click to upload or drag and drop
                                </p>
                                <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                    PNG or JPG (max. 10MB)
                                </p>
                            </div>
                        )}
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={(e) => setFile(e.target.files[0])}
                            accept="image/png, image/jpeg"
                            className="hidden"
                            required
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={generationState === 'generating'}
                    className={`w-full py-3 px-4 rounded-lg font-medium flex items-center justify-center ${generationState === 'generating' ? (darkMode ? 'bg-gray-600' : 'bg-gray-300') : (darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-600 hover:bg-blue-700 text-white')}`}
                >
                    {generationState === 'generating' ? (
                        <>
                            <span className="mr-2">Generating ({progress}%)</span>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        </>
                    ) : (
                        `Generate ${mode === 'image' ? 'Image' : 'Video'}`
                    )}
                </button>
            </form>

            {generationState === 'completed' && (
                <div className={`mt-6 p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-green-50'}`}>
                    <p className={`${darkMode ? 'text-green-400' : 'text-green-600'} font-medium`}>
                        Generation complete!
                    </p>
                </div>
            )}

            {generationState === 'failed' && (
                <div className={`mt-6 p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-red-50'}`}>
                    <p className={`${darkMode ? 'text-red-400' : 'text-red-600'} font-medium`}>
                        Generation failed. Please try again.
                    </p>
                </div>
            )}

            {results.length > 0 && (
                <div className="mt-8">
                    <h3 className={`text-lg font-medium mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Your Recent Generations
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {results.map((item) => (
                            <div 
                                key={item.id} 
                                className={`rounded-lg overflow-hidden border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}
                            >
                                {item.type === 'image' ? (
                                    <img 
                                        src={item.url} 
                                        alt={item.prompt} 
                                        className="w-full h-48 object-cover"
                                    />
                                ) : (
                                    <video 
                                        src={item.url} 
                                        className="w-full h-48 object-cover"
                                        controls
                                    />
                                )}
                                <div className={`p-3 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                                    <p className={`text-sm mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                        {item.prompt.substring(0, 60)}{item.prompt.length > 60 ? '...' : ''}
                                    </p>
                                    <div className="flex justify-between items-center text-xs">
                                        <span className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                            {new Date(item.createdAt).toLocaleString()}
                                        </span>
                                        <a 
                                            href={item.url} 
                                            download
                                            className={`flex items-center ${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'}`}
                                        >
                                            <FiDownload className="mr-1" /> Download
                                        </a>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}