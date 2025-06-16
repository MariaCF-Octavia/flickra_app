 // 1. Create an env.js file to handle environment variables
// src/utils/env.js
export const getEnv = (key, defaultValue = '') => {
    // Try to get from import.meta.env first (Vite)
    if (import.meta.env && import.meta.env[key] !== undefined) {
      return import.meta.env[key];
    }
    
    // Fallback to process.env (for older code or Node.js contexts)
    if (typeof process !== 'undefined' && process.env && process.env[key] !== undefined) {
      return process.env[key];
    }
    
    return defaultValue;
  };
  
  // Example usage:
  // import { getEnv } from './utils/env';
  // const apiBaseUrl = getEnv('VITE_API_BASE_URL');