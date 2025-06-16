// src/components/VoiceSelector.jsx
import React, { useState, useEffect } from 'react';
import { fetchAvailableVoices } from '../utils/voiceOptions';

// Free tier voice IDs
const FREE_TIER_VOICES = [
  "21m00Tcm4TlvDq8ikWAM", // Rachel
  "AZnzlk1XvdvUeBnXmlld", // Domi
  "EXAVITQu4vr4xnSDxMaL"  // Bella
];

const VoiceSelector = ({ onSelect, initialVoiceId = "" }) => {
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(initialVoiceId);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadVoices = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const voicesData = await fetchAvailableVoices();
        
        // Normalize the voices data to always be an array
        let normalizedVoices = [];
        
        if (Array.isArray(voicesData)) {
          normalizedVoices = voicesData;
        } else if (voicesData?.voices) {
          normalizedVoices = voicesData.voices;
        } else if (voicesData?.male || voicesData?.female) {
          normalizedVoices = [
            ...(voicesData.male || []),
            ...(voicesData.female || [])
          ];
        } else if (voicesData?._fallback) {
          // Handle fallback case from voiceOptions.js
          normalizedVoices = [
            ...(voicesData.male || []),
            ...(voicesData.female || [])
          ];
        }

        // Filter to prioritize free tier voices
        const freeTierVoices = normalizedVoices.filter(voice => 
          FREE_TIER_VOICES.includes(voice.id)
        );
        const otherVoices = normalizedVoices.filter(voice =>
          !FREE_TIER_VOICES.includes(voice.id)
        );

        setVoices([...freeTierVoices, ...otherVoices]);
        
        if (normalizedVoices.length > 0) {
          // Prefer a free tier voice if available
          const defaultVoice = freeTierVoices[0] || normalizedVoices[0];
          const voiceToSelect = initialVoiceId || defaultVoice.id;
          setSelectedVoice(voiceToSelect);
          onSelect(voiceToSelect);
        }
      } catch (err) {
        console.error('Failed to load voices:', err);
        setError(err.message || 'Failed to load available voices');
        setVoices([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadVoices();
  }, [initialVoiceId, onSelect]);

  const handleVoiceChange = (e) => {
    const voiceId = e.target.value;
    setSelectedVoice(voiceId);
    onSelect(voiceId);
  };

  const previewVoice = async () => {
    if (!selectedVoice) return;
    
    try {
      const token = localStorage.getItem('authToken');
      if (!token) throw new Error('Not authenticated');
      
      // Use free-tier compatible model
      const modelId = FREE_TIER_VOICES.includes(selectedVoice) 
        ? "eleven_monolingual_v1" 
        : "eleven_multilingual_v2";

      const response = await fetch(`/api/elevenlabs/text-to-speech/${encodeURIComponent(selectedVoice)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          text: "This is a voice preview",
          model_id: modelId,
          stability: 0.5,
          similarity_boost: 0.75
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Preview failed');
      }
      
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      audio.onended = () => URL.revokeObjectURL(audioUrl);
      audio.play();
    } catch (error) {
      console.error('Preview error:', error);
      setError(error.message || 'Preview unavailable');
    }
  };


  if (isLoading) {
    return <div className="p-2 text-gray-500">Loading voices...</div>;
  }

  if (error) {
    return (
      <div className="text-red-500 p-2">
        Error: {error}
        <button 
          onClick={() => window.location.reload()} 
          className="ml-2 text-blue-500 hover:text-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (voices.length === 0) {
    return <div className="p-2 text-gray-500">No voices available</div>;
  }

  return (
    <div className="space-y-4">
      <label htmlFor="voice-select" className="block text-sm font-medium text-gray-700">
        Select a Voice
      </label>
      
      <select
        id="voice-select"
        value={selectedVoice}
        onChange={handleVoiceChange}
        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
      >
        {voices.map((voice) => (
          <option key={voice.id} value={voice.id}>
            {voice.name} - {voice.description || 'No description available'}
          </option>
        ))}
      </select>

      {selectedVoice && (
        <button
          onClick={previewVoice}
          disabled={!selectedVoice}
          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Preview Voice
        </button>
      )}
    </div>
  );
};

export default VoiceSelector;