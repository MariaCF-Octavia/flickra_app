// src/utils/voiceOptions.js

// Predefined voice options (fallback if API fails)

// This should be at the TOP of your voiceOptions.js file
// Define predefined voices as fallback
import { supabase } from '../supabaseClient';

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

    // Updated endpoint with /api prefix
    const response = await fetch('api/voices', {
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      },
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `Voice service error (HTTP ${response.status})`
      );
    }

    const data = await response.json();
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
