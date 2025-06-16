import React, { useState, useEffect } from 'react';
import { Cloudinary } from '@cloudinary/url-gen';
import { fill } from '@cloudinary/url-gen/actions/resize';
import { byRadius } from '@cloudinary/url-gen/actions/roundCorners';
import { autoGravity } from '@cloudinary/url-gen/qualifiers/gravity';
import { useCloudinaryUpload } from '../hooks/useCloudinaryUpload';
import { FiUploadCloud } from 'react-icons/fi';
import { supabase } from '../supabaseClient';
import { toast } from 'react-toastify';
import { AdvancedImage, placeholder } from '@cloudinary/react';

const CloudinaryEditor = ({ plan, userId, onEditComplete }) => {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploadMethod, setUploadMethod] = useState('widget');
  const [fileKey, setFileKey] = useState(Date.now());
  const [previewAsset, setPreviewAsset] = useState(null);
  const [editorLoaded, setEditorLoaded] = useState(false);
  
  const cld = new Cloudinary({ 
    cloud: { 
      cloudName: process.env.REACT_APP_CLOUDINARY_CLOUD_NAME || 'demo',
      apiKey: process.env.REACT_APP_CLOUDINARY_API_KEY
    } 
  });

  const { 
    uploadFile, 
    openUploadWidget, 
    error: uploadError, 
    isLoading: isUploading, 
    progress: uploadProgress 
  } = useCloudinaryUpload({ userId, plan });

  // Load Cloudinary scripts
  useEffect(() => {
    const loadScript = (src) => {
      return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) {
          resolve();
          return;
        }

        const script = document.createElement('script');
        script.src = src;
        script.async = true;
        script.onload = resolve;
        script.onerror = reject;
        document.body.appendChild(script);
      });
    };

    const loadCloudinary = async () => {
      try {
        await loadScript('https://upload-widget.cloudinary.com/global/all.js');
        await loadScript('https://media-editor.cloudinary.com/all.js');
        setEditorLoaded(true);
      } catch (err) {
        console.error('Failed to load Cloudinary scripts:', err);
        setError('Failed to load Cloudinary editor. Please refresh the page.');
      }
    };

    loadCloudinary();
  }, []);

  useEffect(() => {
    if (uploadError) {
      setError(uploadError);
    }
  }, [uploadError]);

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        window.location.href = '/login';
      }
    });

    return () => {
      if (authListener?.unsubscribe) {
        authListener.unsubscribe();
      }
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    
    const loadAssets = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session) {
          console.error("Session error:", sessionError);
          try {
            const { data: refreshData } = await supabase.auth.refreshSession();
            if (!refreshData?.session) {
              throw new Error('Please login to continue');
            }
          } catch (refreshErr) {
            throw new Error('Please login to continue');
          }
        }
    
        const currentSession = await supabase.auth.getSession();
        const accessToken = currentSession?.data?.session?.access_token;
        
        if (!accessToken) {
          throw new Error('Authentication error - missing token');
        }
    
        const assetsRes = await fetch(`/user-assets?user_id=${userId}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });
    
        if (!assetsRes.ok) {
          throw new Error(assetsRes.status === 401 
            ? 'Authentication error - please try again' 
            : 'Failed to load assets');
        }
        
        let assetsData = await assetsRes.json();
        
        const processedAssets = assetsData.map(asset => {
          try {
            const contentUrl = asset.content || asset.secure_url || asset.url;
            if (!contentUrl) {
              console.warn('Skipping asset with no URL:', asset.id);
              return null;
            }
    
            const publicId = asset.public_id || asset.publicId || 
                           (contentUrl.split('/').pop()?.split('.')[0]) || 
                           asset.id;
    
            let assetType = 'image';
            if (asset.type) {
              assetType = String(asset.type).toLowerCase().includes('video') ? 'video' : 'image';
            } else if (contentUrl.match(/\.(mp4|mov|webm|webp)$/i)) {
              assetType = 'video';
            }
    
            const thumbnail = asset.thumbnail || asset.thumbnail_url || 
                            (assetType === 'image' ? contentUrl : '');
    
            return {
              id: asset.id || `asset-${Date.now()}`,
              publicId,
              url: contentUrl,
              type: assetType,
              thumbnail: thumbnail || contentUrl,
              metadata: asset.metadata || {},
              format: asset.metadata?.format || contentUrl.split('.').pop()?.toLowerCase()
            };
          } catch (error) {
            console.error('Error processing asset:', asset, error);
            return null;
          }
        }).filter(asset => asset && asset.url);

        if (isMounted) {
          setAssets(processedAssets);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Failed to load assets');
          console.error('Error:', err);
          
          if (err.message.includes('login to continue')) {
            setTimeout(() => window.location.href = '/login', 3000);
          }
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };
  
    if (userId) {
      loadAssets();
    }
    
    return () => { isMounted = false };
  }, [userId]);

  const getSignature = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession(); // Add this
      const response = await fetch('/cloudinary/signature', {
        method: 'POST',
        credentials: 'include',
        headers: {  // Add authorization header
          'Authorization': `Bearer ${session?.access_token}`
        }
      });
      if (!response.ok) throw new Error('Failed to get signature');
      return await response.json();
    } catch (err) {
      console.error('Error getting signature:', err);
      throw err;
    }
  };

  const handleDirectUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
  
    try {
      setError(null);
      const result = await uploadFile(file);
      
      // Add better validation
      if (!result?.url) {
        throw new Error('Upload failed - no URL returned');
      }
  
      // Verify the URL is accessible
      const imgTest = new Image();
      imgTest.src = result.url;
      await new Promise((resolve, reject) => {
        imgTest.onload = resolve;
        imgTest.onerror = () => reject(new Error('Image failed to load'));
      });
  
      setAssets(prev => [...prev, {
        id: `upload-${Date.now()}`,
        publicId: result.public_id,
        url: result.url,
        thumbnail: result.thumbnail_url || result.url,
        type: file.type.startsWith('video') ? 'video' : 'image',
        metadata: {
          format: file.type.split('/')[1],
          bytes: file.size,
          created_at: new Date().toISOString()
        }
      }]);
      toast.success('Upload successful!');
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.message);
      toast.error('Upload failed: ' + err.message);
    } finally {
      setFileKey(Date.now());
    }
  };
  
  const handleWidgetUpload = () => {
    openUploadWidget({
      onSuccess: (result) => {
        if (!result?.info?.secure_url) {
          setError('Invalid upload response');
          return;
        }
        
        // Add URL validation
        const img = new Image();
        img.src = result.info.secure_url;
        img.onerror = () => {
          setError('Uploaded image is not accessible');
        };
        
        setAssets(prev => [...prev, {
          id: result.info.public_id,
          publicId: result.info.public_id,
          url: result.info.secure_url,
          thumbnail: result.info.thumbnail_url || result.info.secure_url,
          type: result.info.resource_type,
          metadata: {
            width: result.info.width,
            height: result.info.height,
            format: result.info.format
          }
        }]);
        toast.success('Upload completed!');
      },
      onError: (err) => {
        console.error('Widget error:', err);
        setError(err.message || 'Upload failed');
        toast.error('Upload failed: ' + (err.message || 'Unknown error'));
      }
    });
  };


  const handleEdit = async (publicId, e) => {
    if (e) e.stopPropagation(); // Prevent event bubbling if event is provided
      
    try {
      if (!editorLoaded) {
        toast.info('Editor is loading, please try again in a moment');
        return;
      }
  
      const asset = assets.find(a => a.publicId === publicId);
      if (!asset) {
        toast.error('Asset not found');
        return;
      }
  
      // Get fresh signature for editing with error handling
      const { signature, timestamp, api_key, cloud_name } = await getSignature()
        .catch(err => {
          console.error('Failed to get signature:', err);
          throw new Error('Failed to authenticate with Cloudinary');
        });
  
      // Validate we got all required parameters
      if (!signature || !timestamp || !api_key || !cloud_name) {
        throw new Error('Missing required Cloudinary parameters');
      }
  
      const editor = window.cloudinary.openMediaEditor({
        cloudName: cloud_name,
        apiKey: api_key,
        publicId: publicId,
        resourceType: asset.type === 'video' ? 'video' : 'image',
        uploadSignatureTimestamp: timestamp,
        uploadSignature: signature,
        tools: {
          crop: ['custom', 'square', '16:9', '4:3'],
          rotate: true,
          adjust: ['brightness', 'contrast', 'saturation'],
          filters: plan !== 'basic' ? ['blackwhite', 'sepia', 'vintage'] : [],
          overlays: plan === 'enterprise' ? ['text', 'images'] : []
        }
      });
  
      editor.on('export', (data) => {
        if (data.event === 'success') {
          // Verify the edited asset exists before updating state
          testImageAccess(data.info.secure_url).then(isAccessible => {
            if (isAccessible) {
              setAssets(prev => prev.map(a => 
                a.publicId === publicId ? {
                  ...a,
                  url: data.info.secure_url,
                  thumbnail: data.info.thumbnail_url || data.info.secure_url,
                  metadata: {
                    ...a.metadata,
                    width: data.info.width,
                    height: data.info.height
                  }
                } : a
              ));
              toast.success('Edit saved successfully!');
              if (onEditComplete) {
                onEditComplete(data.info.secure_url);
              }
            } else {
              toast.error('Failed to verify edited asset');
            }
          });
        }
      });
  
      editor.on('error', (err) => {
        console.error('Editor error:', err);
        toast.error(err.message || 'Failed to save edits');
      });
  
    } catch (err) {
      console.error('Edit error:', err);
      toast.error(err.message || 'Failed to start editor');
    }
  };
  
  const handleDelete = async (publicId) => {
    if (!window.confirm('Permanently delete this asset?')) return;
    
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch('/cloudinary/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ public_id: publicId })
      });
  
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Delete failed');
      }
  
      setAssets(prev => prev.filter(a => a.publicId !== publicId));
      
      if (result.status === 'partial_success') {
        toast.warning(result.message || 'Partial deletion completed');
      } else {
        toast.success('Asset deleted successfully');
      }
    } catch (err) {
      console.error('Delete error:', err);
      toast.error(err.message || 'Failed to delete asset');
    } finally {
      setLoading(false);
    }
  };
  
  async function testImageAccess(url) {
    try {
      const res = await fetch(url, { method: 'HEAD' });
      return res.ok;
    } catch {
      return false;
    }
  }
  
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
        <p>Loading editor...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Content Editor</h2>
            <p className="text-gray-600">Edit and manage your uploaded content</p>
          </div>
          <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
            {plan.charAt(0).toUpperCase() + plan.slice(1)} Plan
          </span>
        </div>

        <div className="flex gap-4 mb-4">
          <button
            onClick={() => setUploadMethod('direct')}
            className={`px-4 py-2 rounded-lg ${uploadMethod === 'direct' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            Direct Upload
          </button>
          <button
            onClick={() => setUploadMethod('widget')}
            className={`px-4 py-2 rounded-lg ${uploadMethod === 'widget' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            Cloudinary Widget
          </button>
        </div>

        {uploadMethod === 'direct' ? (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
            <label className="cursor-pointer">
              <input
                key={fileKey}
                type="file"
                accept="image/*,video/*"
                onChange={handleDirectUpload}
                className="hidden"
                disabled={isUploading}
              />
              <div className="space-y-2">
                <FiUploadCloud className="w-8 h-8 text-gray-400 mx-auto" />
                <p className="text-sm text-gray-600">
                  {isUploading 
                    ? `Uploading... ${uploadProgress}%` 
                    : 'Click to upload files directly'}
                </p>
              </div>
            </label>
          </div>
        ) : (
          <button
            onClick={handleWidgetUpload}
            disabled={isUploading}
            className={`w-full px-5 py-3 rounded-lg shadow-md transition-all
              ${!isUploading ? 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white' 
                       : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}
          >
            {isUploading ? (
              <div className="flex items-center justify-center gap-2">
                <span>Uploading... {Math.round(uploadProgress)}%</span>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <span>{plan === 'enterprise' ? 'Upload Multiple Files' : 'Upload Content'}</span>
            )}
          </button>
        )}
      </div>

      {assets.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {assets.map(asset => (
            <div 
              key={asset.id} 
              className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all"
            >
              <div 
                className="relative aspect-square group cursor-pointer"
                onClick={() => setPreviewAsset(asset)}
              >
                {asset.type === 'video' ? (
                  <video 
                    className="w-full h-full object-cover"
                    src={asset.url}
                    muted
                    loop
                    playsInline
                  />
                ) : (
                  <AdvancedImage 
  cldImg={cld.image(asset.publicId)
    .resize(fill().width(300).height(300).gravity(autoGravity()))
    .roundCorners(byRadius(8))
    .format('auto')
    .quality('auto')}
  plugins={[placeholder()]}
  className="w-full h-full object-cover"
  alt={`User upload ${asset.publicId.split('/').pop()}`}

                  />
                )}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(asset.publicId);
                    }}
                    className="opacity-0 group-hover:opacity-100 bg-white px-3 py-1 rounded text-sm font-medium shadow-md transform translate-y-2 group-hover:translate-y-0 transition-all hover:bg-gray-100"
                  >
                    Edit
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(asset.publicId);
                    }}
                    className="opacity-0 group-hover:opacity-100 bg-red-500 text-white px-3 py-1 rounded text-sm font-medium shadow-md transform translate-y-2 group-hover:translate-y-0 transition-all hover:bg-red-600"
                  >
                    Delete
                  </button>
                </div>
              </div>
              <div className="p-3 border-t border-gray-100">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500 truncate">
                    {asset.publicId?.split('/')?.pop()?.split('.')[0] || 'Untitled'}
                  </span>
                  <div className="flex gap-2">
                    <a
                      href={asset.url}
                      download
                      onClick={(e) => e.stopPropagation()}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Download
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white p-8 rounded-xl shadow-sm text-center">
          <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No content yet</h3>
          <p className="text-gray-500 mb-4">Upload your first file to get started</p>
          <button
            onClick={uploadMethod === 'direct' ? () => document.querySelector('input[type="file"]').click() : handleWidgetUpload}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Upload Files
          </button>
        </div>
      )}

      {previewAsset && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="relative bg-white p-4 rounded-lg max-w-4xl max-h-[90vh]">
            <button 
              onClick={() => setPreviewAsset(null)}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
            {previewAsset.type === 'image' ? (
              <img 
                src={previewAsset.url} 
                className="max-h-[80vh] max-w-full object-contain"
                alt="Preview" 
              />
            ) : (
              <video 
                src={previewAsset.url} 
                className="max-h-[80vh] max-w-full"
                controls
                autoPlay
              />
            )}
            <div className="flex justify-center mt-4 space-x-4">
  <button
    onClick={(e) => {
      e.stopPropagation();
      handleEdit(previewAsset.publicId, e);
      setPreviewAsset(null);
    }}
    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
  >
    Edit
  </button>
  <button
    onClick={(e) => {
      e.stopPropagation();
      handleDelete(previewAsset.publicId);
      setPreviewAsset(null);
    }}
    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
  >
    Delete
  </button>
</div>
          </div>
        </div>
      )}

      <div className="bg-white p-6 rounded-xl shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Your {plan} Plan Features</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plan === 'basic' && (
            <>
              <div className="p-4 border border-gray-200 rounded-lg hover:border-blue-200 hover:bg-blue-50 transition">
                <div className="text-2xl mb-2">✂️</div>
                <h4 className="font-medium text-gray-900">Basic Editing</h4>
                <p className="text-sm text-gray-600">Crop, rotate, and adjust your images</p>
              </div>
              <div className="p-4 border border-gray-200 rounded-lg hover:border-blue-200 hover:bg-blue-50 transition">
                <div className="text-2xl mb-2">📤</div>
                <h4 className="font-medium text-gray-900">File Uploads</h4>
                <p className="text-sm text-gray-600">Upload from your device</p>
              </div>
              <div className="p-4 border border-gray-200 rounded-lg hover:border-blue-200 hover:bg-blue-50 transition">
                <div className="text-2xl mb-2">🖼️</div>
                <h4 className="font-medium text-gray-900">Image Support</h4>
                <p className="text-sm text-gray-600">JPG, PNG formats</p>
              </div>
            </>
          )}
          {plan === 'premium' && (
            <>
              <div className="p-4 border border-gray-200 rounded-lg hover:border-blue-200 hover:bg-blue-50 transition">
                <div className="text-2xl mb-2">🎨</div>
                <h4 className="font-medium text-gray-900">Advanced Editing</h4>
                <p className="text-sm text-gray-600">Filters, effects, and enhancements</p>
              </div>
              <div className="p-4 border border-gray-200 rounded-lg hover:border-blue-200 hover:bg-blue-50 transition">
                <div className="text-2xl mb-2">🌐</div>
                <h4 className="font-medium text-gray-900">URL Uploads</h4>
                <p className="text-sm text-gray-600">Import from web URLs</p>
              </div>
              <div className="p-4 border border-gray-200 rounded-lg hover:border-blue-200 hover:bg-blue-50 transition">
                <div className="text-2xl mb-2">📹</div>
                <h4 className="font-medium text-gray-900">Video Support</h4>
                <p className="text-sm text-gray-600">MP4, MOV formats up to 5 minutes</p>
              </div>
            </>
          )}
          {plan === 'enterprise' && (
            <>
              <div className="p-4 border border-gray-200 rounded-lg hover:border-blue-200 hover:bg-blue-50 transition">
                <div className="text-2xl mb-2">✨</div>
                <h4 className="font-medium text-gray-900">Enterprise Tools</h4>
                <p className="text-sm text-gray-600">AI enhancements, text overlays, watermarks</p>
              </div>
              <div className="p-4 border border-gray-200 rounded-lg hover:border-blue-200 hover:bg-blue-50 transition">
                <div className="text-2xl mb-2">☁️</div>
                <h4 className="font-medium text-gray-900">Cloud Import</h4>
                <p className="text-sm text-gray-600">From Google Drive, Dropbox, and more</p>
              </div>
              <div className="p-4 border border-gray-200 rounded-lg hover:border-blue-200 hover:bg-blue-50 transition">
                <div className="text-2xl mb-2">⚡</div>
                <h4 className="font-medium text-gray-900">Priority Processing</h4>
                <p className="text-sm text-gray-600">Faster uploads and conversions</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CloudinaryEditor;