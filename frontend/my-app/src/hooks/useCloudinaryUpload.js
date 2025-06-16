import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase credentials. Check your .env file');
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  }
});

export const useCloudinaryUpload = ({ userId, plan }) => {
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [publicId, setPublicId] = useState(null);

  const getAuthHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) throw new Error('No active session');
    return {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json'
    };
  };

  const getCloudinarySignature = async () => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/cloudinary/signature`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ user_id: userId })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to get signature');
      }

      return await response.json();
    } catch (err) {
      console.error('Signature error:', err);
      setError(err.message);
      throw err;
    }
  };

  const saveToDatabase = async (public_id, url, metadata = {}) => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/cloudinary/save`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ 
          public_id,
          url,
          user_id: userId,
          metadata
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save file metadata');
      }
    } catch (err) {
      console.error('Database save error:', err);
      throw err;
    }
  };

  const validateFile = (file, resourceType = 'image') => {
    const validImageTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const validVideoTypes = ['video/mp4', 'video/quicktime', 'video/webm'];
    const maxSize = plan === 'enterprise' ? 100 * 1024 * 1024 : // 100MB for enterprise
                    plan === 'premium' ? 20 * 1024 * 1024 : // 20MB for premium
                    5 * 1024 * 1024; // 5MB for basic

    if (!file) throw new Error('No file selected');
    if (file.size > maxSize) throw new Error(`File must be <${maxSize/1024/1024}MB`);

    if (resourceType === 'image' && !validImageTypes.includes(file.type)) {
      throw new Error('Only JPG/PNG/WEBP allowed');
    }

    if (resourceType === 'video' && !validVideoTypes.includes(file.type)) {
      throw new Error('Only MP4/MOV/WEBM allowed');
    }
  };

  const uploadFile = async (file, resourceType = 'auto') => {
    try {
      validateFile(file, resourceType);
      setIsLoading(true);
      setError(null);
      setProgress(0);

      const { 
        signature, 
        timestamp, 
        api_key, 
        cloud_name,
        upload_preset = 'ml_default',
        folder = `user_uploads/${userId}`
      } = await getCloudinarySignature();

      const formData = new FormData();
      formData.append('file', file);
      formData.append('api_key', api_key);
      formData.append('signature', signature);
      formData.append('timestamp', timestamp);
      formData.append('upload_preset', upload_preset);
      formData.append('folder', folder);
      if (resourceType !== 'auto') formData.append('resource_type', resourceType);

      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloud_name}/upload`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'Upload failed');
      }

      const result = await response.json();
      await saveToDatabase(
        result.public_id, 
        result.secure_url,
        {
          width: result.width,
          height: result.height,
          format: result.format,
          resource_type: result.resource_type
        }
      );

      setPublicId(result.public_id);
      return {
        url: result.secure_url,
        public_id: result.public_id,
        thumbnail_url: result.thumbnail_url || result.secure_url,
        width: result.width,
        height: result.height,
        format: result.format,
        resource_type: result.resource_type
      };

    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const openUploadWidget = () => {
    return new Promise(async (resolve, reject) => {
      try {
        setIsLoading(true);
        setError(null);
        setProgress(0);
        
        const { 
          signature, 
          timestamp, 
          api_key, 
          cloud_name,
          upload_preset = 'ml_default',
          folder = `user_uploads/${userId}`
        } = await getCloudinarySignature();

        if (!window.cloudinary) {
          throw new Error('Cloudinary widget not loaded');
        }

        const widget = window.cloudinary.createUploadWidget({
          cloudName: cloud_name,
          apiKey: api_key,
          uploadSignatureTimestamp: timestamp,
          uploadSignature: signature,
          uploadPreset: upload_preset,
          folder: folder,
          cropping: plan !== 'basic',
          croppingAspectRatio: plan === 'enterprise' ? null : 1,
          showAdvancedOptions: plan === 'enterprise',
          sources: [
            'local',
            ...(plan === 'premium' ? ['url'] : []),
            ...(plan === 'enterprise' ? ['camera', 'dropbox', 'google_drive'] : [])
          ],
          multiple: plan === 'enterprise',
          maxFiles: plan === 'enterprise' ? 10 : 1,
          clientAllowedFormats: [
            'image/jpeg',
            'image/png',
            ...(plan !== 'basic' ? ['image/gif', 'video/mp4', 'video/quicktime'] : [])
          ],
          maxFileSize: plan === 'enterprise' ? 100000000 : 5000000,
          resourceType: 'auto',
          showPoweredBy: false,
          styles: {
            palette: {
              window: "#FFFFFF",
              sourceBg: "#F4F4F5",
              windowBorder: "#90a0b3",
              tabIcon: "#000000",
              inactiveTabIcon: "#555a5f",
              menuIcons: "#555a5f",
              link: "#3f83f8",
              action: "#3f83f8",
              inProgress: "#3f83f8",
              complete: "#10b981",
              error: "#ef4444",
              textDark: "#000000",
              textLight: "#FFFFFF"
            }
          }
        }, (error, result) => {
          setIsLoading(false);
          
          if (error) {
            setError(error.message);
            reject(error);
            return;
          }
          
          if (result.event === 'success') {
            saveToDatabase(
              result.info.public_id,
              result.info.secure_url,
              {
                width: result.info.width,
                height: result.info.height,
                format: result.info.format,
                resource_type: result.info.resource_type
              }
            ).catch(console.error);
            
            setPublicId(result.info.public_id);
            resolve({
              event: 'success',
              info: {
                public_id: result.info.public_id,
                secure_url: result.info.secure_url,
                thumbnail_url: result.info.thumbnail_url || result.info.secure_url,
                width: result.info.width,
                height: result.info.height,
                format: result.info.format,
                resource_type: result.info.resource_type,
                asset_id: result.info.asset_id
              }
            });
          }

          if (result.event === 'progress') {
            setProgress(Math.floor(result.info.progress));
          }

          if (result.event === 'close') {
            reject(new Error('Upload cancelled'));
          }
        });

        widget.open();
      } catch (err) {
        setIsLoading(false);
        setError(err.message);
        reject(err);
      }
    });
  };

  return { 
    uploadFile,
    openUploadWidget,
    error,
    progress,
    isLoading,
    publicId,
    reset: () => {
      setError(null);
      setProgress(0);
      setPublicId(null);
    }
  };
};