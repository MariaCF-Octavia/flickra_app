 import React, { useState } from 'react';
import { X, Play, Volume2, VolumeX } from 'lucide-react';

// Import your demo video from assets
import CFDemoUse from '../assets/CFDemoUse.mp4';

const DemoVideo = ({ 
  isOpen, 
  onClose, 
  title = "CF Studio Demo", 
  description = "See how our AI marketing tools can transform your content creation workflow",
  videoUrl = CFDemoUse
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [videoRef, setVideoRef] = useState(null);

  const handlePlay = () => {
    if (videoRef) {
      videoRef.play();
      setIsPlaying(true);
    }
  };

  const handlePause = () => {
    if (videoRef) {
      videoRef.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    if (videoRef) {
      videoRef.muted = !videoRef.muted;
      setIsMuted(videoRef.muted);
    }
  };

  const handleVideoEnd = () => {
    setIsPlaying(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl mx-4 bg-gray-900 rounded-xl overflow-hidden shadow-2xl border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div>
            <h2 className="text-xl font-bold text-white">{title}</h2>
            <p className="text-sm text-gray-400 mt-1">{description}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-colors"
            aria-label="Close demo video"
          >
            <X size={20} />
          </button>
        </div>

        {/* Video Container */}
        <div className="relative bg-black">
          <video
            ref={setVideoRef}
            className="w-full h-auto max-h-[70vh]"
            muted={isMuted}
            playsInline
            onEnded={handleVideoEnd}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            controls
            src={videoUrl}
          >
            <p className="text-white p-4">
              Your browser doesn't support HTML video. 
              <a href={videoUrl} className="text-blue-400 hover:text-blue-300 underline ml-1">
                Download the video
              </a> instead.
            </p>
          </video>

          {/* Custom Play Button Overlay (shows when paused) */}
          {!isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40">
              <button
                onClick={handlePlay}
                className="w-20 h-20 rounded-full bg-pink-600 hover:bg-pink-700 flex items-center justify-center transition-all transform hover:scale-105 shadow-lg"
                aria-label="Play demo video"
              >
                <Play size={32} className="text-white ml-1" />
              </button>
            </div>
          )}

          {/* Custom Controls */}
          <div className="absolute bottom-4 right-4 flex gap-2">
            <button
              onClick={toggleMute}
              className="p-2 rounded-lg bg-gray-900 bg-opacity-80 hover:bg-opacity-100 text-white transition-all"
              aria-label={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-800/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-pink-500 animate-pulse"></div>
              <span className="text-sm text-gray-300">
                Create professional marketing content in minutes
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  onClose();
                  // Add navigation logic here if needed
                }}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white text-sm font-medium transition-colors shadow-lg"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DemoVideo;