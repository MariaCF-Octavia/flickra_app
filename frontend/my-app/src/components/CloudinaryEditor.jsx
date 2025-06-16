import React, { useState, useEffect } from 'react';
import { FiUploadCloud, FiExternalLink, FiTrash2 } from 'react-icons/fi';
import { supabase } from '../supabaseClient';
import { toast } from 'react-toastify';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

const SimpleFileUpload = ({ plan = 'basic', userId, onEditComplete }) => {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [previewAsset, setPreviewAsset] = useState(null);
  const [editModal, setEditModal] = useState(null);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 10000000) { // 10MB
      toast.error('File size must be less than 10MB');
      return;
    }

    setUploading(true);

    try {
      // Get signature
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Please log in again');
      
      const signatureResponse = await fetch(`${API_BASE}/api/cloudinary/signature`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!signatureResponse.ok) {
        throw new Error('Failed to get upload signature');
      }

      const signatureData = await signatureResponse.json();
      console.log('Got signature for direct upload');

      // Create form data for Cloudinary - MUST match backend signature exactly
      const formData = new FormData();
      formData.append('file', file);
      formData.append('cloud_name', signatureData.cloud_name);
      formData.append('api_key', signatureData.api_key);
      formData.append('timestamp', signatureData.timestamp);
      formData.append('signature', signatureData.signature);
      formData.append('folder', signatureData.folder);
      formData.append('upload_preset', signatureData.upload_preset);
      formData.append('source', signatureData.source); // This was missing!

      // Upload directly to Cloudinary
      const uploadResponse = await fetch(`https://api.cloudinary.com/v1_1/${signatureData.cloud_name}/image/upload`, {
        method: 'POST',
        body: formData
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.error?.message || 'Upload failed');
      }

      const uploadResult = await uploadResponse.json();
      console.log('Upload successful:', uploadResult);

      // Save to your backend database as well
      try {
        const saveResponse = await fetch(`${API_BASE}/cloudinary/save`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ public_id: uploadResult.public_id })
        });

        if (!saveResponse.ok) {
          console.warn('Failed to save to database, but upload succeeded');
        }
      } catch (saveErr) {
        console.warn('Failed to save to database:', saveErr);
      }

      // Create new asset
      const newAsset = {
        id: uploadResult.asset_id || Date.now().toString(),
        publicId: uploadResult.public_id,
        url: uploadResult.secure_url,
        type: uploadResult.resource_type || 'image',
        thumbnail: uploadResult.secure_url,
        metadata: {
          width: uploadResult.width,
          height: uploadResult.height,
          format: uploadResult.format,
          created_at: new Date().toISOString()
        },
        format: uploadResult.format
      };

      setAssets(prev => [newAsset, ...prev]);
      onEditComplete?.(uploadResult.secure_url);
      toast.success('Upload successful!');

      // Reset file input
      event.target.value = '';

    } catch (err) {
      console.error('Upload error:', err);
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (asset) => {
    // Create a comprehensive edit interface using Cloudinary transformations
    const baseUrl = `https://res.cloudinary.com/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`;
    const publicId = asset.publicId;
    
    // Create different transformation categories
    const editOptions = [
      // Basic
      { name: 'Original', url: asset.url, category: 'Basic' },
      
      // Cropping & Resizing
      { name: 'Square (500x500)', url: `${baseUrl}/c_fill,w_500,h_500/${publicId}`, category: 'Crop & Resize' },
      { name: 'Portrait (400x600)', url: `${baseUrl}/c_fill,w_400,h_600/${publicId}`, category: 'Crop & Resize' },
      { name: 'Landscape (600x400)', url: `${baseUrl}/c_fill,w_600,h_400/${publicId}`, category: 'Crop & Resize' },
      { name: 'Circle Crop', url: `${baseUrl}/c_fill,w_400,h_400,r_max/${publicId}`, category: 'Crop & Resize' },
      
      // Color Effects
      { name: 'Grayscale', url: `${baseUrl}/e_grayscale/${publicId}`, category: 'Color Effects' },
      { name: 'Sepia', url: `${baseUrl}/e_sepia/${publicId}`, category: 'Color Effects' },
      { name: 'Black & White', url: `${baseUrl}/e_blackwhite/${publicId}`, category: 'Color Effects' },
      { name: 'Negate', url: `${baseUrl}/e_negate/${publicId}`, category: 'Color Effects' },
      { name: 'Red Tint', url: `${baseUrl}/e_colorize:60,co_red/${publicId}`, category: 'Color Effects' },
      { name: 'Blue Tint', url: `${baseUrl}/e_colorize:60,co_blue/${publicId}`, category: 'Color Effects' },
      
      // Lighting & Contrast
      { name: 'Brighten', url: `${baseUrl}/e_brightness:30/${publicId}`, category: 'Lighting' },
      { name: 'Darken', url: `${baseUrl}/e_brightness:-30/${publicId}`, category: 'Lighting' },
      { name: 'High Contrast', url: `${baseUrl}/e_contrast:40/${publicId}`, category: 'Lighting' },
      { name: 'Low Contrast', url: `${baseUrl}/e_contrast:-30/${publicId}`, category: 'Lighting' },
      { name: 'Auto Enhance', url: `${baseUrl}/e_auto_brightness,e_auto_contrast,e_auto_color/${publicId}`, category: 'Lighting' },
      
      // Artistic Effects
      { name: 'Oil Paint', url: `${baseUrl}/e_oil_paint/${publicId}`, category: 'Artistic' },
      { name: 'Cartoon', url: `${baseUrl}/e_cartoonify/${publicId}`, category: 'Artistic' },
      { name: 'Sketch', url: `${baseUrl}/e_outline:15,co_black/${publicId}`, category: 'Artistic' },
      { name: 'Vintage', url: `${baseUrl}/e_sepia,e_brightness:-10,e_contrast:15/${publicId}`, category: 'Artistic' },
      
      // Blur & Sharpen
      { name: 'Soft Blur', url: `${baseUrl}/e_blur:200/${publicId}`, category: 'Focus' },
      { name: 'Motion Blur', url: `${baseUrl}/e_motion:15/${publicId}`, category: 'Focus' },
      { name: 'Sharpen', url: `${baseUrl}/e_sharpen:80/${publicId}`, category: 'Focus' },
      { name: 'Unsharp Mask', url: `${baseUrl}/e_unsharp_mask:100/${publicId}`, category: 'Focus' },
      
      // Instagram-style Filters
      { name: 'Warm Filter', url: `${baseUrl}/e_brightness:10,e_contrast:10,e_saturation:20,e_colorize:20,co_orange/${publicId}`, category: 'Instagram Style' },
      { name: 'Cool Filter', url: `${baseUrl}/e_brightness:5,e_contrast:15,e_colorize:15,co_blue/${publicId}`, category: 'Instagram Style' },
      { name: 'Dramatic', url: `${baseUrl}/e_contrast:30,e_saturation:40,e_brightness:-5/${publicId}`, category: 'Instagram Style' },
      { name: 'Soft Glow', url: `${baseUrl}/e_brightness:15,e_contrast:-10,e_saturation:-20/${publicId}`, category: 'Instagram Style' },
      
      // Background Effects (for images with transparent backgrounds)
      { name: 'White Background', url: `${baseUrl}/b_white/${publicId}`, category: 'Background' },
      { name: 'Black Background', url: `${baseUrl}/b_black/${publicId}`, category: 'Background' },
      { name: 'Blue Background', url: `${baseUrl}/b_blue/${publicId}`, category: 'Background' }
    ];
    
    // Group options by category
    const groupedOptions = editOptions.reduce((acc, option) => {
      if (!acc[option.category]) {
        acc[option.category] = [];
      }
      acc[option.category].push(option);
      return acc;
    }, {});
    
    // Show edit modal
    setEditModal({ asset, options: editOptions, groupedOptions });
  };

  const applyEdit = async (newUrl, optionName) => {
    try {
      // Update the asset with the new transformed URL
      setAssets(prev => prev.map(a => a.id === editModal.asset.id ? {
        ...a,
        url: newUrl,
        thumbnail: newUrl,
        metadata: {
          ...a.metadata,
          transformation: optionName,
          updated_at: new Date().toISOString()
        }
      } : a));
      
      setEditModal(null);
      toast.success(`Applied ${optionName} effect!`);
      onEditComplete?.(newUrl);
    } catch (err) {
      console.error('Edit error:', err);
      toast.error('Failed to apply edit');
    }
  };

  const handleView = (asset) => {
    window.open(asset.url, '_blank');
  };

  const handleDelete = async (publicId) => {
    if (!window.confirm('Delete this asset?')) return;
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Please log in again');
      
      const response = await fetch(`${API_BASE}/api/cloudinary/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ public_id: publicId })
      });

      if (response.ok) {
        setAssets(prev => prev.filter(a => a.publicId !== publicId));
        toast.success('Asset deleted');
      } else {
        throw new Error('Delete failed');
      }
    } catch (err) {
      console.error('Delete error:', err);
      toast.error('Failed to delete asset');
    }
  };

  // Load user assets
  useEffect(() => {
    const loadAssets = async () => {
      try {
        setLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) return;
    
        const response = await fetch(`${API_BASE}/user-assets?user_id=${userId}`, {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        });
    
        if (response.ok) {
          const data = await response.json();
          const processedAssets = data.map(asset => ({
            id: asset.id,
            publicId: asset.public_id || asset.publicId,
            url: asset.content || asset.url,
            type: asset.type || 'image',
            thumbnail: asset.thumbnail || asset.content || asset.url,
            metadata: asset.metadata || {},
            format: asset.metadata?.format
          })).filter(asset => asset.url);
          
          setAssets(processedAssets);
        }
      } catch (err) {
        console.error('Failed to load assets:', err);
      } finally {
        setLoading(false);
      }
    };
  
    if (userId) loadAssets();
  }, [userId]);

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Image Upload</h2>
            <p className="text-gray-600">Simple image upload with editing capabilities</p>
          </div>
          <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
            {(plan || 'basic').charAt(0).toUpperCase() + (plan || 'basic').slice(1)}
          </span>
        </div>

        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            disabled={uploading}
            className="hidden"
            id="file-upload"
          />
          <label htmlFor="file-upload" className={`cursor-pointer ${uploading ? 'pointer-events-none' : ''}`}>
            <div className="space-y-4">
              <FiUploadCloud className="w-12 h-12 text-gray-400 mx-auto" />
              {uploading ? (
                <div className="space-y-2">
                  <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="text-gray-600">Uploading...</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-lg text-gray-700 font-medium">Click to upload images</p>
                  <p className="text-sm text-gray-500">PNG, JPG, WebP up to 10MB</p>
                </div>
              )}
            </div>
          </label>
        </div>
      </div>

      {assets.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {assets.map(asset => (
            <div key={asset.id} className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div 
                className="relative aspect-square group cursor-pointer"
                onClick={() => setPreviewAsset(asset)}
              >
                <img 
                  src={asset.thumbnail || asset.url} 
                  alt="Uploaded content"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = asset.url;
                  }}
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(asset);
                    }}
                    className="opacity-0 group-hover:opacity-100 bg-blue-500 text-white px-3 py-1 rounded text-sm font-medium transition-all hover:bg-blue-600"
                    title="Edit with filters"
                  >
                    Edit
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleView(asset);
                    }}
                    className="opacity-0 group-hover:opacity-100 bg-white px-3 py-1 rounded text-sm font-medium transition-all hover:bg-gray-100"
                    title="View full size"
                  >
                    <FiExternalLink className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(asset.publicId);
                    }}
                    className="opacity-0 group-hover:opacity-100 bg-red-500 text-white px-3 py-1 rounded text-sm font-medium transition-all hover:bg-red-600"
                    title="Delete"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="p-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500 truncate">
                    {asset.publicId?.split('/')?.pop()?.split('.')[0] || 'Image'}
                  </span>
                  <button
                    onClick={() => handleView(asset)}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    View
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {assets.length === 0 && !loading && (
        <div className="bg-white p-8 rounded-xl shadow-sm text-center">
          <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <FiUploadCloud className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No images yet</h3>
          <p className="text-gray-500 mb-4">Upload your first image to get started</p>
        </div>
      )}

      {/* Edit Modal */}
      {editModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={() => setEditModal(null)}>
          <div className="relative bg-white p-6 rounded-lg max-w-4xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => setEditModal(null)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-xl font-bold w-8 h-8 flex items-center justify-center"
            >
              ×
            </button>
            
            <h3 className="text-xl font-bold text-gray-800 mb-4">Edit Image - Advanced Transformations</h3>
            
            {/* Show grouped options by category */}
            <div className="space-y-6 max-h-[70vh] overflow-y-auto">
              {Object.entries(editModal.groupedOptions).map(([category, options]) => (
                <div key={category} className="border rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-gray-700 mb-3 border-b pb-2">{category}</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {options.map((option, index) => (
                      <div key={index} className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow bg-white">
                        <div className="relative">
                          <img 
                            src={option.url} 
                            alt={option.name}
                            className="w-full h-24 object-cover"
                            loading="lazy"
                          />
                          {/* Loading overlay for slow transformations */}
                          <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 transition-all"></div>
                        </div>
                        <div className="p-2">
                          <p className="text-xs font-medium text-gray-800 mb-1 truncate" title={option.name}>
                            {option.name}
                          </p>
                          <button
                            onClick={() => applyEdit(option.url, option.name)}
                            className="w-full px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition"
                          >
                            {option.name === 'Original' ? 'Restore' : 'Apply'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                💡 <strong>Tip:</strong> These transformations are powered by Cloudinary's advanced image processing. 
                Click any effect to instantly apply it to your image!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewAsset && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={() => setPreviewAsset(null)}>
          <div className="relative bg-white p-4 rounded-lg max-w-4xl max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => setPreviewAsset(null)}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-xl font-bold w-8 h-8 flex items-center justify-center"
            >
              ×
            </button>
            <img 
              src={previewAsset.url} 
              className="max-h-[80vh] max-w-full object-contain"
              alt="Preview" 
            />
            <div className="flex justify-center mt-4 gap-4">
              <button
                onClick={() => {
                  handleEdit(previewAsset);
                  setPreviewAsset(null);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Edit
              </button>
              <button
                onClick={() => {
                  handleView(previewAsset);
                  setPreviewAsset(null);
                }}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Open Full Size
              </button>
              <button
                onClick={() => {
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
    </div>
  );
};

export default SimpleFileUpload; 