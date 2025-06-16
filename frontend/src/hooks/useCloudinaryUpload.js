import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false
    }
  }
);

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
      const response = await fetch('/cloudinary/signature', {
        method: 'POST',
        headers,
        body: JSON.stringify({ user_id: userId })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to get signature');
      }

      return await response.json();
    } catch (err) {
      console.error('Signature error:', err);
      setError(err.message);
      throw err;
    }
  };

  const saveToDatabase = async (public_id, url) => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/cloudinary/save', {
        method: 'POST',
        headers,
        body: JSON.stringify({ 
          public_id,
          url,
          user_id: userId
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

  const validateFile = (file) => {
    const validTypes = ['image/jpeg', 'image/png'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!file) throw new Error('No file selected');
    if (!validTypes.includes(file.type)) throw new Error('Only JPG/PNG allowed');
    if (file.size > maxSize) throw new Error('File must be <5MB');
  };

  const uploadFile = async (file) => {
    try {
      validateFile(file);
      setIsLoading(true);
      setError(null);
      setProgress(0);

      const { 
        signature, 
        timestamp, 
        api_key, 
        upload_preset,
        cloud_name,
        folder,
        source
      } = await getCloudinarySignature();

      const formData = new FormData();
      formData.append('file', file);
      formData.append('api_key', api_key);
      formData.append('signature', signature);
      formData.append('folder', folder);
      formData.append('source', source);
      formData.append('timestamp', timestamp);
      formData.append('upload_preset', upload_preset);

      const result = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloud_name}/upload`);

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            setProgress(Math.round((e.loaded / e.total) * 100));
          }
        };

        xhr.onload = () => {
          if (xhr.status === 200) {
            try {
              const data = JSON.parse(xhr.responseText);
              if (!data.secure_url) throw new Error('No URL in response');
              resolve(data);
            } catch (e) {
              reject(new Error('Invalid response'));
            }
          } else {
            reject(new Error(`Upload failed: ${xhr.statusText}`));
          }
        };

        xhr.onerror = () => reject(new Error('Network error'));
        xhr.send(formData);
      });

      await saveToDatabase(result.public_id, result.secure_url);
      setPublicId(result.public_id);

      return {
        url: result.secure_url,
        public_id: result.public_id,
        thumbnail_url: result.thumbnail_url || result.secure_url,
        width: result.width,
        height: result.height,
        format: result.format
      };

    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // ... (keep your existing openUploadWidget function)



  const openUploadWidget = (options = {}) => {
    return new Promise(async (resolve, reject) => {
      try {
        setIsLoading(true);
        setError(null);
        
        const { 
          signature, 
          timestamp, 
          api_key, 
          upload_preset,
          cloud_name,
          folder
        } = await getCloudinarySignature();

        if (!window.cloudinary) {
          throw new Error('Cloudinary widget not loaded');
        }

        const widgetOptions = {
          cloudName: cloud_name,
          apiKey: api_key,
          uploadSignatureTimestamp: timestamp,
          uploadSignature: signature,
          uploadPreset: upload_preset,
          folder: folder,
          cropping: plan !== 'basic',
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
            ...(plan !== 'basic' ? ['image/gif', 'video/mp4'] : [])
          ],
          maxFileSize: 5 * 1024 * 1024,
          resourceType: 'auto',
          showPoweredBy: false
        };

        const widget = window.cloudinary.createUploadWidget(
          widgetOptions,
          (error, result) => {
            setIsLoading(false);
            
            if (error) {
              setError(error.message);
              options.onError?.(error);
              reject(error);
              return;
            }
            
            if (result.event === 'success') {
              setPublicId(result.info.public_id);
              options.onSuccess?.(result);
              resolve(result);
            }

            if (result.event === 'progress') {
              setProgress(result.info.progress);
            }

            if (result.event === 'close') {
              options.onCancel?.();
            }
          }
        );

        setProgress(0);
        widget.open();
      } catch (err) {
        setIsLoading(false);
        setError(err.message);
        options.onError?.(err);
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