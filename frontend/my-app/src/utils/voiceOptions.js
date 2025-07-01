// src/utils/voiceOptions.js

// Predefined voice options (fallback if API fails)

// This should be at the TOP of your voiceOptions.js file
// Define predefined voices as fallback
import { supabase } from '../supabaseClient';

// Add this at the top - same pattern as BackendFFmpeg
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://fastapi-app-production-ac48.up.railway.app';

export const predefinedVoices = {
  male: [
    {
      id: "pNInz6obpgDQGcFmaJgB",
      name: "Adam",
      description: "Young American male voice",
      category: "male",
      preview_url: "https://storage.googleapis.com/eleven-public-prod/premade/voices/Adam.mp3"
    },
    {
      id: "yoZ06aMxZJJ28mfd3POQ",
      name: "Antoni",
      description: "Deep male voice",
      category: "male",
      preview_url: "https://storage.googleapis.com/eleven-public-prod/premade/voices/Antoni.mp3"
    }
  ],
  female: [
    {
      id: "21m00Tcm4TlvDq8ikWAM",  // Free tier
      name: "Rachel",
      description: "Professional female voice",
      category: "female", 
      preview_url: "https://storage.googleapis.com/eleven-public-prod/premade/voices/Rachel.mp3"
    },
    {
      id: "EXAVITQu4vr4xnSDxMaL",  // Free tier
      name: "Bella",
      description: "Soft and friendly voice",
      category: "female",
      preview_url: "https://storage.googleapis.com/eleven-public-prod/premade/voices/Bella.mp3"
    },
    {
      id: "AZnzlk1XvdvUeBnXmlld",  // Free tier
      name: "Domi",
      description: "Strong and clear voice",
      category: "female",
      preview_url: "https://storage.googleapis.com/eleven-public-prod/premade/voices/Domi.mp3"
    }
  ]
}

/**
 * Fetches voices through backend proxy using Supabase session
 * @returns {Promise<{male: Array, female: Array, other: Array, _fallback?: boolean, _error?: string}>}
 */
export const fetchAvailableVoices = async () => {
  try {
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session?.access_token) {
      console.warn('No active session:', authError?.message || 'Not authenticated');
      return {
        ...predefinedVoices,
        _fallback: true,
        _error: authError?.message || 'Session expired'
      };
    }

    // FIXED: Use API_BASE_URL instead of relative path
    const endpoint = `${API_BASE_URL}/api/voices`;
    console.log(`Fetching voices from: ${endpoint}`);
    
    const response = await fetch(endpoint, {
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      },
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      // Check if response is likely HTML
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('text/html')) {
        throw new Error(`Received HTML instead of JSON (HTTP ${response.status}). Check endpoint URL.`);
      }
      
      try {
        const errorData = await response.json();
        throw new Error(errorData.message || `Voice service error (HTTP ${response.status})`);
      } catch (parseError) {
        throw new Error(`Error parsing response: ${parseError.message} (HTTP ${response.status})`);
      }
    }

    // Check content type before parsing
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.warn(`Unexpected content type: ${contentType}`);
    }

    const text = await response.text();
    let data;
    
    try {
      data = JSON.parse(text);
    } catch (parseError) {
      console.error('JSON Parse Error. Response body starts with:', text.substring(0, 100));
      throw new Error(`Invalid JSON response: ${parseError.message}`);
    }

    return {
      ...categorizeVoices(data.voices || data),
      _timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('Voice fetch error:', error);
    return {
      ...predefinedVoices,
      _fallback: true,
      _error: error.message.includes('timeout') 
        ? 'Request timed out' 
        : error.message
    };
  }
};

/**
 * Enhanced voice categorization with:
 * - Type safety checks
 * - Default voice preservation
 */
const categorizeVoices = (voices) => {
  if (!Array.isArray(voices)) {
    console.error('Invalid voices data type:', typeof voices);
    return {
      male: [...predefinedVoices.male],
      female: [...predefinedVoices.female],
      other: []
    };
  }

  const categorized = {
    male: [],
    female: [],
    other: []
  };

  const genderKeywords = {
    male: ['male', 'man', 'guy', 'adam', 'antoni', 'josh', 'thomas', 'charlie'],
    female: ['female', 'woman', 'lady', 'rachel', 'bella', 'domi', 'emily', 'elli']  // Added free tier names
  };

  voices.forEach(voice => {
    try {
      const name = String(voice.name || '').toLowerCase();
      const description = String(voice.description || '').toLowerCase();
      const labels = voice.labels || {};

      // Priority 1: Explicit labels
      if (labels.gender === 'male') return categorized.male.push(voice);
      if (labels.gender === 'female') return categorized.female.push(voice);

      // Priority 2: Name/description analysis
      const isMale = genderKeywords.male.some(k => 
        name.includes(k) || description.includes(k)
      );
      const isFemale = genderKeywords.female.some(k => 
        name.includes(k) || description.includes(k)
      );

      if (isMale) categorized.male.push(voice);
      else if (isFemale) categorized.female.push(voice);
      else categorized.other.push(voice);

    } catch (e) {
      console.warn('Failed to categorize voice:', voice, e);
      categorized.other.push(voice);
    }
  });

  // Preserve default voices if categories are empty
  if (categorized.male.length === 0) categorized.male = [...predefinedVoices.male];
  if (categorized.female.length === 0) categorized.female = [...predefinedVoices.female];

  return categorized;
};

/**
 * Safer voice flattening with null checks
 */
export function getAllVoices(voicesData) {
  if (!voicesData) return [...predefinedVoices.male, ...predefinedVoices.female];
  
  return [
    ...(voicesData.male || []),
    ...(voicesData.female || []),
    ...(voicesData.other || [])
  ];
}