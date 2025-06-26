// Create this as: src/components/BackendFFmpeg.js
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { toast } from 'react-toastify';
import { Upload, Download, Video, Music, CheckCircle, AlertCircle, Loader, Trash2, Eye } from 'lucide-react';

// Import the VideoPreviewModal component
const VideoPreviewModal = ({ 
  isOpen, 
  onClose, 
  videoData, 
  darkMode, 
  onDownload 
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const videoRef = React.useRef(null);
  const modalRef = React.useRef(null);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setIsPlaying(false);
      setCurrentTime(0);
      setIsFullscreen(false);
    }
  }, [isOpen]);

  // Handle video events
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    const handleDurationChange = () => setDuration(video.duration);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('durationchange', handleDurationChange);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('durationchange', handleDurationChange);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
    };
  }, [isOpen]);

  // Handle fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'Escape':
          if (isFullscreen) {
            exitFullscreen();
          } else {
            onClose();
          }
          break;
        case ' ':
          e.preventDefault();
          togglePlayPause();
          break;
        case 'm':
          toggleMute();
          break;
        case 'f':
          toggleFullscreen();
          break;
        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [isOpen, isFullscreen]);

  const togglePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const toggleFullscreen = async () => {
    if (!modalRef.current) return;

    try {
      if (isFullscreen) {
        await document.exitFullscreen();
      } else {
        await modalRef.current.requestFullscreen();
      }
    } catch (error) {
      console.error('Fullscreen error:', error);
    }
  };

  const exitFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error('Exit fullscreen error:', error);
    }
  };

  const handleSeek = (e) => {
    const video = videoRef.current;
    if (!video || !duration) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newTime = percent * duration;
    video.currentTime = newTime;
  };

  const handleVolumeChange = (e) => {
    const video = videoRef.current;
    if (!video) return;

    const newVolume = parseFloat(e.target.value);
    video.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!isOpen || !videoData) return null;

  return (
    <div 
      ref={modalRef}
      className={`fixed inset-0 z-50 flex items-center justify-center ${
        isFullscreen ? 'bg-black' : `${darkMode ? 'bg-black/90' : 'bg-black/75'} backdrop-blur-sm`
      }`}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isFullscreen) {
          onClose();
        }
      }}
    >
      <div className={`relative w-full h-full max-w-6xl max-h-screen ${
        isFullscreen ? '' : 'mx-4 my-8'
      } ${darkMode ? 'bg-gray-900' : 'bg-white'} ${
        isFullscreen ? '' : 'rounded-lg shadow-2xl'
      } overflow-hidden flex flex-col`}>
        
        {/* Header */}
        {!isFullscreen && (
          <div className={`flex items-center justify-between p-4 border-b ${
            darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
          }`}>
            <div>
              <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Video Preview
              </h2>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {videoData.filename} • {formatFileSize(videoData.size)}
              </p>
            </div>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors ${
                darkMode ? 'hover:bg-gray-700 text-gray-400 hover:text-white' : 'hover:bg-gray-200 text-gray-600 hover:text-gray-900'
              }`}
            >
              ✕
            </button>
          </div>
        )}

        {/* Video Container */}
        <div className="flex-1 relative bg-black">
          <video
            ref={videoRef}
            src={videoData.url}
            className="w-full h-full object-contain"
            preload="metadata"
            onClick={togglePlayPause}
          />

          {/* Video Controls Overlay */}
          <div className="absolute inset-0 group">
            {/* Play/Pause Button Overlay */}
            <div 
              className="absolute inset-0 flex items-center justify-center cursor-pointer"
              onClick={togglePlayPause}
            >
              <div className={`p-4 rounded-full bg-black/50 transition-opacity ${
                isPlaying ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'
              }`}>
                {isPlaying ? '⏸️' : '▶️'}
              </div>
            </div>

            {/* Bottom Controls */}
            <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 transition-opacity ${
              isPlaying ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'
            }`}>
              
              {/* Progress Bar */}
              <div className="mb-3">
                <div 
                  className="w-full h-2 bg-white/30 rounded-full cursor-pointer"
                  onClick={handleSeek}
                >
                  <div 
                    className="h-full bg-blue-500 rounded-full transition-all"
                    style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                  />
                </div>
              </div>

              {/* Control Buttons */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={togglePlayPause}
                    className="p-2 text-white hover:text-blue-400 transition-colors"
                  >
                    {isPlaying ? '⏸️' : '▶️'}
                  </button>

                  <button
                    onClick={toggleMute}
                    className="p-2 text-white hover:text-blue-400 transition-colors"
                  >
                    {isMuted ? '🔇' : '🔊'}
                  </button>

                  <div className="flex items-center space-x-2">
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={isMuted ? 0 : volume}
                      onChange={handleVolumeChange}
                      className="w-20 h-1 bg-white/30 rounded-lg cursor-pointer"
                    />
                  </div>

                  <span className="text-white text-sm">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={onDownload}
                    className="flex items-center px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors text-sm"
                  >
                    📥 Download
                  </button>

                  <button
                    onClick={toggleFullscreen}
                    className="p-2 text-white hover:text-blue-400 transition-colors"
                  >
                    {isFullscreen ? '🗗' : '⛶'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Keyboard Shortcuts Info */}
        {!isFullscreen && (
          <div className={`p-3 border-t text-xs ${
            darkMode ? 'border-gray-700 bg-gray-800 text-gray-400' : 'border-gray-200 bg-gray-50 text-gray-600'
          }`}>
            <span className="mr-4">Space: Play/Pause</span>
            <span className="mr-4">M: Mute</span>
            <span className="mr-4">F: Fullscreen</span>
            <span>ESC: Close</span>
          </div>
        )}
      </div>
    </div>
  );
};

const BackendFFmpeg = ({ darkMode }) => {
  const [videoFile, setVideoFile] = useState(null);
  const [audioFile, setAudioFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processedVideo, setProcessedVideo] = useState(null);
  const [userVideos, setUserVideos] = useState([]);
  const [ffmpegStatus, setFfmpegStatus] = useState(null);
  const [dragOver, setDragOver] = useState({ video: false, audio: false });
  
  // New state for video preview
  const [showPreview, setShowPreview] = useState(false);
  const [previewVideo, setPreviewVideo] = useState(null);

  // Check FFmpeg server status on mount
  useEffect(() => {
    checkFFmpegStatus();
    fetchUserVideos();
  }, []);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

  const checkFFmpegStatus = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(`${API_BASE_URL}/api/ffmpeg/status`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      const status = await response.json();
      setFfmpegStatus(status);
    } catch (error) {
      console.error('Error checking FFmpeg status:', error);
      setFfmpegStatus({ ffmpeg_available: false, error: 'Connection failed' });
    }
  };

  const fetchUserVideos = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(`${API_BASE_URL}/api/ffmpeg/user-videos`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        setUserVideos(result.videos || []);
      }
    } catch (error) {
      console.error('Error fetching user videos:', error);
    }
  };

  // File handling functions
  const handleFileSelect = (event, type) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file size (100MB max)
    if (file.size > 100 * 1024 * 1024) {
      toast.error(`File is too large (max 100MB): ${file.name}`);
      return;
    }

    // Validate file types
    if (type === 'video') {
      const videoTypes = ['video/mp4', 'video/quicktime', 'video/avi'];
      if (!videoTypes.includes(file.type)) {
        toast.error(`Unsupported video format: ${file.name}`);
        return;
      }
      setVideoFile(file);
    } else if (type === 'audio') {
      const audioTypes = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp3', 'audio/m4a'];
      if (!audioTypes.includes(file.type)) {
        toast.error(`Unsupported audio format: ${file.name}`);
        return;
      }
      setAudioFile(file);
    }
  };

  const handleFileDrop = (event, type) => {
    event.preventDefault();
    setDragOver(prev => ({ ...prev, [type]: false }));

    const file = event.dataTransfer.files[0];
    if (!file) return;

    // Create a fake event object to reuse handleFileSelect
    const fakeEvent = {
      target: {
        files: [file]
      }
    };
    handleFileSelect(fakeEvent, type);
  };

  const mergeVideoAudio = async () => {
    if (!videoFile || !audioFile) {
      toast.error('Please select both video and audio files');
      return;
    }

    setIsProcessing(true);
    setProcessingProgress(0);
    setProcessedVideo(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Please login to process videos');
      }

      const formData = new FormData();
      formData.append('video', videoFile);
      formData.append('audio', audioFile);

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProcessingProgress(prev => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 10;
        });
      }, 500);

      const response = await fetch(`${API_BASE_URL}/api/ffmpeg/merge-video-audio`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        },
        body: formData
      });

      clearInterval(progressInterval);
      setProcessingProgress(100);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Processing failed');
      }

      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        // S3 URL response
        const result = await response.json();
        const videoData = {
          url: result.video_url,
          filename: result.filename,
          size: result.file_size,
          type: 'url'
        };
        setProcessedVideo(videoData);
        
        // Auto-open preview modal
        setPreviewVideo(videoData);
        setShowPreview(true);
        
        toast.success('Video processed and uploaded successfully!');
      } else {
        // Direct file download
        const blob = await response.blob();
        const downloadUrl = URL.createObjectURL(blob);
        const filename = response.headers.get('content-disposition')?.match(/filename="(.+)"/)?.[1] || 'merged_video.mp4';
        
        const videoData = {
          url: downloadUrl,
          filename: filename,
          size: blob.size,
          type: 'blob'
        };
        setProcessedVideo(videoData);
        
        // Auto-open preview modal
        setPreviewVideo(videoData);
        setShowPreview(true);
        
        toast.success('Video processed successfully!');
      }

      // Refresh user videos list
      await fetchUserVideos();

    } catch (error) {
      console.error('Video processing error:', error);
      toast.error(error.message || 'Video processing failed');
    } finally {
      setIsProcessing(false);
      setProcessingProgress(0);
    }
  };

  const clearFiles = () => {
    setVideoFile(null);
    setAudioFile(null);
    setProcessedVideo(null);
  };

  const downloadVideo = (video) => {
    const link = document.createElement('a');
    link.href = video.url;
    link.download = video.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openPreview = (video) => {
    setPreviewVideo(video);
    setShowPreview(true);
  };

  const closePreview = () => {
    setShowPreview(false);
    setPreviewVideo(null);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!ffmpegStatus) {
    return (
      <div className={`p-8 text-center ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
        <Loader className="w-8 h-8 animate-spin mx-auto mb-4" />
        <p>Checking video processing capabilities...</p>
      </div>
    );
  }

  if (!ffmpegStatus.ffmpeg_available) {
    return (
      <div className={`p-8 text-center ${darkMode ? 'bg-red-900/20 border border-red-800 text-red-300' : 'bg-red-50 border border-red-200 text-red-700'} rounded-lg`}>
        <AlertCircle className="w-12 h-12 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Video Processing Unavailable</h3>
        <p className="mb-4">The server's video processing system is not available.</p>
        <p className="text-sm opacity-75">Error: {ffmpegStatus.error}</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Status Banner */}
        <div className={`p-4 rounded-lg border ${darkMode ? 'bg-green-900/20 border-green-800 text-green-300' : 'bg-green-50 border-green-200 text-green-700'}`}>
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 mr-2" />
            <span className="font-medium">Server-side video processing ready</span>
          </div>
        </div>

        {/* File Upload Section */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Video Upload */}
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              dragOver.video
                ? (darkMode ? 'border-blue-400 bg-blue-900/20' : 'border-blue-400 bg-blue-50')
                : (darkMode ? 'border-gray-600 hover:border-gray-500' : 'border-gray-300 hover:border-gray-400')
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(prev => ({ ...prev, video: true }));
            }}
            onDragLeave={() => setDragOver(prev => ({ ...prev, video: false }))}
            onDrop={(e) => handleFileDrop(e, 'video')}
          >
            <Video className={`w-12 h-12 mx-auto mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
            
            {videoFile ? (
              <div>
                <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {videoFile.name}
                </p>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {formatFileSize(videoFile.size)}
                </p>
              </div>
            ) : (
              <div>
                <p className={`mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Drop video file here or click to browse
                </p>
                <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                  MP4, MOV, AVI (max 100MB)
                </p>
              </div>
            )}
            
            <input
              type="file"
              accept="video/mp4,video/quicktime,video/avi"
              onChange={(e) => handleFileSelect(e, 'video')}
              className="hidden"
              id="video-upload"
            />
            <label
              htmlFor="video-upload"
              className={`mt-4 inline-flex items-center px-4 py-2 rounded cursor-pointer ${
                darkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              <Upload className="w-4 h-4 mr-2" />
              Choose Video
            </label>
          </div>

          {/* Audio Upload */}
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              dragOver.audio
                ? (darkMode ? 'border-purple-400 bg-purple-900/20' : 'border-purple-400 bg-purple-50')
                : (darkMode ? 'border-gray-600 hover:border-gray-500' : 'border-gray-300 hover:border-gray-400')
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(prev => ({ ...prev, audio: true }));
            }}
            onDragLeave={() => setDragOver(prev => ({ ...prev, audio: false }))}
            onDrop={(e) => handleFileDrop(e, 'audio')}
          >
            <Music className={`w-12 h-12 mx-auto mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
            
            {audioFile ? (
              <div>
                <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {audioFile.name}
                </p>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {formatFileSize(audioFile.size)}
                </p>
              </div>
            ) : (
              <div>
                <p className={`mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Drop audio file here or click to browse
                </p>
                <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                  MP3, WAV, OGG (max 100MB)
                </p>
              </div>
            )}
            
            <input
              type="file"
              accept="audio/mpeg,audio/wav,audio/ogg,audio/mp3,audio/m4a"
              onChange={(e) => handleFileSelect(e, 'audio')}
              className="hidden"
              id="audio-upload"
            />
            <label
              htmlFor="audio-upload"
              className={`mt-4 inline-flex items-center px-4 py-2 rounded cursor-pointer ${
                darkMode ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-purple-600 hover:bg-purple-700 text-white'
              }`}
            >
              <Upload className="w-4 h-4 mr-2" />
              Choose Audio
            </label>
          </div>
        </div>

        {/* Processing Controls */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
          <button
            onClick={mergeVideoAudio}
            disabled={!videoFile || !audioFile || isProcessing}
            className={`px-6 py-3 rounded-lg font-medium flex items-center ${
              !videoFile || !audioFile || isProcessing
                ? (darkMode ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gray-300 text-gray-500 cursor-not-allowed')
                : 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white'
            }`}
          >
            {isProcessing ? (
              <>
                <Loader className="w-5 h-5 mr-2 animate-spin" />
                Processing... {Math.round(processingProgress)}%
              </>
            ) : (
              <>
                <Video className="w-5 h-5 mr-2" />
                Merge Video + Audio
              </>
            )}
          </button>

          {(videoFile || audioFile) && !isProcessing && (
            <button
              onClick={clearFiles}
              className={`px-4 py-2 rounded border ${
                darkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Trash2 className="w-4 h-4 mr-2 inline" />
              Clear Files
            </button>
          )}
        </div>

        {/* Processing Progress */}
        {isProcessing && (
          <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
            <div className="flex justify-between text-sm mb-2">
              <span>Processing video...</span>
              <span>{Math.round(processingProgress)}%</span>
            </div>
            <div className={`w-full rounded-full h-2 ${darkMode ? 'bg-gray-700' : 'bg-gray-300'}`}>
              <div 
                className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${processingProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Processed Video Result */}
        {processedVideo && (
          <div className={`p-6 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
            <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              ✅ Video Processed Successfully!
            </h3>
            
            <div className="space-y-4">
              <div className={`p-4 rounded ${darkMode ? 'bg-gray-700' : 'bg-white'}`}>
                <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {processedVideo.filename}
                </p>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Size: {formatFileSize(processedVideo.size)}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => openPreview(processedVideo)}
                  className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Preview Video
                </button>
                
                <button
                  onClick={() => downloadVideo(processedVideo)}
                  className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Video
                </button>
                
                {processedVideo.type === 'url' && (
                  <a
                    href={processedVideo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center px-4 py-2 border border-blue-600 text-blue-600 hover:bg-blue-50 rounded"
                  >
                    View Online
                  </a>
                )}
              </div>
            </div>
          </div>
        )}

        {/* User Videos History */}
        {userVideos.length > 0 && (
          <div className={`p-6 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Recent Processed Videos
            </h3>
            
            <div className="space-y-3">
              {userVideos.slice(0, 5).map((video) => (
                <div key={video.id} className={`flex items-center justify-between p-3 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <div>
                    <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {video.filename}
                    </p>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {formatDate(video.created_at)} • {formatFileSize(video.file_size)}
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    {video.video_url && (
                      <>
                        <button
                          onClick={() => openPreview({
                            url: video.video_url,
                            filename: video.filename,
                            size: video.file_size,
                            type: 'url'
                          })}
                          className="flex items-center px-3 py-1 text-sm bg-green-600 hover:bg-green-700 text-white rounded"
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          Preview
                        </button>
                        
                        <a
                          href={video.video_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded"
                        >
                          <Download className="w-3 h-3 mr-1" />
                          Download
                        </a>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Video Preview Modal */}
      <VideoPreviewModal
        isOpen={showPreview}
        onClose={closePreview}
        videoData={previewVideo}
        darkMode={darkMode}
        onDownload={() => {
          if (previewVideo) {
            downloadVideo(previewVideo);
          }
        }}
      />
    </>
  );
};

export default BackendFFmpeg;