import React, { useState, useEffect } from 'react';
import supabase from '../supabaseClient';
import './Settings.css';

const Settings = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showGuide, setShowGuide] = useState(false);
  const [showFAQ, setShowFAQ] = useState(false);

  useEffect(() => {
    getCurrentUser();
  }, []);

  const getCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    } catch (error) {
      console.error('Error getting user:', error);
    }
  };

  const handleChangePassword = async () => {
    const newPassword = prompt("Enter your new password:");
    if (!newPassword || newPassword.length < 6) {
      alert("Password must be at least 6 characters long.");
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        alert(`Error: ${error.message}`);
      } else {
        alert("Password updated successfully!");
      }
    } catch (error) {
      alert("Error updating password");
    }
    setIsLoading(false);
  };

  return (
    <div className="settings-page dark-theme">
      <div className="settings-header">
        <h1>Settings</h1>
        <button onClick={() => window.history.back()} className="back-button">
          Back to Dashboard
        </button>
      </div>

      {/* Security Section */}
      <div className="settings-card">
        <div className="card-header">
          <h2>Security</h2>
        </div>
        <div className="card-content">
          <div className="setting-item">
            <div className="setting-info">
              <h3>Change Password</h3>
              <p>Update your account password for better security</p>
            </div>
            <button 
              onClick={handleChangePassword}
              disabled={isLoading}
              className="action-button"
            >
              {isLoading ? 'Updating...' : 'Change Password'}
            </button>
          </div>
        </div>
      </div>

      {/* Support Section */}
      <div className="settings-card">
        <div className="card-header">
          <h2>Support</h2>
        </div>
        <div className="card-content">
          <div className="support-grid">
            <div className="support-item">
              <h3>Contact Support</h3>
              <p>Get help with your account or technical issues</p>
              <div className="contact-info">
                <strong>Email:</strong> support@contentfactory.ai<br/>
                <strong>Response time:</strong> Within 24 hours
              </div>
            </div>
            
            <div className="support-item">
              <h3>Report a Bug</h3>
              <p>Found an issue? Let us know so we can fix it</p>
              <button 
                onClick={() => window.location.href = 'mailto:support@contentfactory.ai?subject=Bug Report'}
                className="support-button"
              >
                Report Bug
              </button>
            </div>

            <div className="support-item">
              <h3>Request Refund</h3>
              <p>Need to cancel your subscription or request a refund?</p>
              <button 
                onClick={() => window.location.href = 'mailto:support@contentfactory.ai?subject=Refund Request'}
                className="support-button"
              >
                Request Refund
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Documentation Section */}
      <div className="settings-card">
        <div className="card-header">
          <h2>Help & Documentation</h2>
        </div>
        <div className="card-content">
          <div className="docs-grid">
            <div className="doc-item">
              <h3>User Guide</h3>
              <p>Step-by-step guide on how to create professional ads with CF</p>
              <div className="guide-preview">
                <strong>Quick Overview:</strong>
                <ol>
                  <li>Upload original image + reference image</li>
                  <li>Add tags and prompts</li>
                  <li>Check Media Library for results</li>
                  <li>Create videos from images (single or keyframes)</li>
                  <li>Generate ad copy or voiceover</li>
                  <li>Merge everything in Production Studio</li>
                </ol>
              </div>
              <button 
                onClick={() => setShowGuide(!showGuide)}
                className="doc-link"
              >
                {showGuide ? 'Hide Guide' : 'View Full Guide'}
              </button>
            </div>
            
            <div className="doc-item">
              <h3>FAQ</h3>
              <p>Common questions and troubleshooting tips</p>
              <div className="faq-preview">
                <strong>Popular Questions:</strong>
                <ul>
                  <li>My image looks pasted/unrealistic</li>
                  <li>Platform performance issues</li>
                  <li>How to get better results</li>
                  <li>Billing and subscription questions</li>
                </ul>
              </div>
              <button 
                onClick={() => setShowFAQ(!showFAQ)}
                className="doc-link"
              >
                {showFAQ ? 'Hide FAQ' : 'View FAQ'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Guide Section - Toggleable */}
      {showGuide && (
        <div className="settings-card">
          <div className="card-header">
            <h2>Complete User Guide</h2>
          </div>
          <div className="card-content">
            <div className="guide-section">
              <h3>Creating Your First Ad</h3>
              <h4>Step 1: Image Generation with References</h4>
              <p>1. Upload your original image (your product, face, etc.)</p>
              <p>2. Upload a reference image (the style/mood you want)</p>
              <p>3. Tag both images - this is crucial for good results</p>
              <p>4. Write a clear prompt describing what you want</p>
              <p>5. Generate and check your Media Library for results</p>

              <h4>Step 2: Video Creation</h4>
              <p>Single Image Video: Use your generated image or upload a new one, add prompts for movement/animation</p>
              <p>Keyframes Video: Use two images for smooth transitions between scenes</p>

              <h4>Step 3: Ad Copy & Voiceover</h4>
              <p>Generate Ad Copy: Describe your product and ad style to get professional copy</p>
              <p>Create Voiceover: Use your ad copy or write custom script to generate speech</p>

              <h4>Step 4: Final Production</h4>
              <p>1. Go to Production Studio</p>
              <p>2. Upload your finished video and audio</p>
              <p>3. Merge them together</p>
              <p>4. Download your professional ad</p>

              <h4>Pro Tips</h4>
              <ul>
                <li>Always tag your images for better AI understanding</li>
                <li>Be specific in your prompts</li>
                <li>Test different reference styles for various moods</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* FAQ Section - Toggleable */}
      {showFAQ && (
        <div className="settings-card">
          <div className="card-header">
            <h2>Frequently Asked Questions</h2>
          </div>
          <div className="card-content">
            <div className="faq-section">
              <div className="faq-item">
                <h4>My generated image looks pasted or unrealistic</h4>
                <p>Make sure you're tagging both your original and reference images properly. The AI needs clear descriptions of both images to blend them naturally.</p>
              </div>

              <div className="faq-item">
                <h4>The platform is laggy</h4>
                <p>This is usually due to high server load. Wait for your current generation to complete before starting a new one.</p>
              </div>

              <div className="faq-item">
                <h4>How do I get better results?</h4>
                <ul>
                  <li>Use high-quality reference images</li>
                  <li>Write detailed, specific prompts</li>
                  <li>Always tag your images with descriptive keywords</li>
                </ul>
              </div>

              <div className="faq-item">
                <h4>Billing and subscription questions</h4>
                <p>Contact support with your account email and details about your issue.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;