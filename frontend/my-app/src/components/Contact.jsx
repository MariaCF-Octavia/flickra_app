 import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Edit, Clock, Share, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null); // 'success', 'error', or null

  // Premium theme with animations and glass effects
  const themeStyles = {
    bg: "bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950",
    text: "text-white",
    textSecondary: "text-gray-300",
    cardBg: "bg-gray-900/70 backdrop-blur-md",
    navBg: "bg-gray-900/80 backdrop-blur-lg border-b border-gray-800/50",
    button: "bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700",
    border: "border-gray-800/50",
    input: "bg-gray-800/70 backdrop-blur-sm border-gray-700/50",
    feature: "border border-gray-800/30 bg-gray-900/50 backdrop-blur-md hover:border-violet-500/50 hover:bg-gray-900/70"
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      // Create email content
      const emailBody = `
New Contact Form Submission from CF Studio Website

Name: ${formData.name}
Email: ${formData.email}
Company: ${formData.company}
Subject: ${formData.subject}

Message:
${formData.message}

---
Sent from CF Studio Contact Form
      `;

      // Create mailto link (this will open the user's default email client)
      const mailtoLink = `mailto:support@contentfactory.ai?subject=CF Studio Contact: ${formData.subject}&body=${encodeURIComponent(emailBody)}`;
      
      // Open email client
      window.location.href = mailtoLink;
      
      // Show success message
      setSubmitStatus('success');
      
      // Reset form after a delay
      setTimeout(() => {
        setFormData({
          name: '',
          email: '',
          company: '',
          subject: '',
          message: ''
        });
        setSubmitStatus(null);
      }, 3000);
      
    } catch (error) {
      console.error('Error sending email:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`min-h-screen ${themeStyles.bg} ${themeStyles.text} font-sans relative`}>
      {/* Animated background gradient elements */}
      <div className="fixed inset-0 overflow-hidden z-0">
        <div className="absolute top-0 -left-40 w-96 h-96 bg-indigo-700/20 rounded-full filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute top-1/3 -right-20 w-96 h-96 bg-violet-700/20 rounded-full filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-96 h-96 bg-fuchsia-700/20 rounded-full filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Navigation Bar */}
      <nav className={`fixed w-full z-50 transition-all duration-300 ${themeStyles.navBg} py-3`}>
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <Link to="/" className="flex items-center">
            <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-violet-500">CF Studio</div>
            <div className="ml-3 px-3 py-1 text-xs font-bold rounded-full bg-gradient-to-r from-indigo-500/20 to-violet-600/20 text-indigo-300 border border-indigo-500/30">BETA</div>
          </Link>
          <div className="flex items-center space-x-6">
            <Link to="/" className="hover:text-indigo-400 transition-colors">Home</Link>
            <Link to="/about" className="hover:text-indigo-400 transition-colors">About</Link>
            <Link to="/login" className="hover:text-indigo-400 transition-colors">Login</Link>
            <Link to="/signup" className={`px-5 py-2.5 rounded-full ${themeStyles.button} text-white font-medium shadow-lg shadow-violet-500/20 transition-all hover:shadow-xl hover:shadow-violet-500/30`}>
              Get Started Now
            </Link>
          </div>
        </div>
      </nav>

      {/* Back to Home Link */}
      <div className="pt-24 pb-8 relative z-10">
        <div className="container mx-auto px-6">
          <Link to="/" className="inline-flex items-center text-indigo-400 hover:text-indigo-300 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
        </div>
      </div>

      {/* Contact Content */}
      <div className="relative z-10 pb-20">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="text-center mb-16">
              <h1 className="text-4xl md:text-5xl font-bold mb-6 animate-fade-in-up">
                Get in <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-violet-500">Touch</span>
              </h1>
              <div className="w-24 h-1 bg-gradient-to-r from-indigo-500 to-violet-600 mx-auto mb-8 rounded-full"></div>
              <p className={`text-lg ${themeStyles.textSecondary} leading-relaxed animate-fade-in-up animation-delay-200`}>
                Ready to transform your content creation? We'd love to hear from you.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Contact Form */}
              <div className={`p-8 rounded-xl ${themeStyles.feature} animate-fade-in-up animation-delay-400`}>
                <h2 className="text-2xl font-semibold mb-6 flex items-center">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500/20 to-violet-600/20 text-indigo-400 mr-3">
                    <Edit className="w-5 h-5" />
                  </div>
                  Send us a Message
                </h2>

                {/* Success/Error Messages */}
                {submitStatus === 'success' && (
                  <div className="mb-6 p-4 rounded-lg bg-green-500/20 border border-green-500/50 flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-400 mr-3" />
                    <span className="text-green-300">Your email client should now open. Thanks for reaching out!</span>
                  </div>
                )}

                {submitStatus === 'error' && (
                  <div className="mb-6 p-4 rounded-lg bg-red-500/20 border border-red-500/50 flex items-center">
                    <AlertCircle className="w-5 h-5 text-red-400 mr-3" />
                    <span className="text-red-300">There was an error. Please email us directly at support@contentfactory.ai</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Name *</label>
                      <input 
                        type="text" 
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className={`w-full px-4 py-3 rounded-lg ${themeStyles.input} border ${themeStyles.border} focus:border-indigo-500 focus:outline-none transition-colors`}
                        placeholder="Your name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Email *</label>
                      <input 
                        type="email" 
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className={`w-full px-4 py-3 rounded-lg ${themeStyles.input} border ${themeStyles.border} focus:border-indigo-500 focus:outline-none transition-colors`}
                        placeholder="your@email.com"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Company</label>
                    <input 
                      type="text" 
                      name="company"
                      value={formData.company}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 rounded-lg ${themeStyles.input} border ${themeStyles.border} focus:border-indigo-500 focus:outline-none transition-colors`}
                      placeholder="Your company name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Subject *</label>
                    <select 
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      required
                      className={`w-full px-4 py-3 rounded-lg ${themeStyles.input} border ${themeStyles.border} focus:border-indigo-500 focus:outline-none transition-colors`}
                    >
                      <option value="">Select a topic</option>
                      <option value="Request Demo">Request Demo</option>
                      <option value="Technical Support">Technical Support</option>
                      <option value="Partnership Inquiry">Partnership Inquiry</option>
                      <option value="Billing Question">Billing Question</option>
                      <option value="Feature Request">Feature Request</option>
                      <option value="Feedback">Feedback</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Message *</label>
                    <textarea 
                      rows="5"
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      required
                      className={`w-full px-4 py-3 rounded-lg ${themeStyles.input} border ${themeStyles.border} focus:border-indigo-500 focus:outline-none transition-colors resize-none`}
                      placeholder="Tell us about your project or how we can help..."
                    ></textarea>
                  </div>
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full py-3 rounded-lg ${themeStyles.button} text-white font-medium hover:shadow-lg hover:shadow-violet-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {isSubmitting ? 'Sending...' : 'Send Message'}
                  </button>
                  <p className="text-xs text-gray-400 text-center">
                    * Required fields. This will open your email client to send the message.
                  </p>
                </form>
              </div>

              {/* Contact Information */}
              <div className="space-y-8 animate-fade-in-up animation-delay-600">
                {/* Direct Email */}
                <div className={`p-6 rounded-xl border ${themeStyles.border} hover:border-violet-500/50 transition-all`}>
                  <div className="flex items-center mb-4">
                    <div className="p-3 rounded-lg bg-gradient-to-br from-indigo-500/20 to-violet-600/20 text-indigo-400 mr-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold">Direct Email</h3>
                      <p className={themeStyles.textSecondary}>Prefer to email us directly?</p>
                    </div>
                  </div>
                  <a 
                    href="mailto:support@contentfactory.ai" 
                    className="text-indigo-400 hover:text-indigo-300 transition-colors font-medium text-lg"
                  >
                    support@contentfactory.ai
                  </a>
                  <p className="text-sm text-gray-400 mt-2">
                    Click to open your email client or copy this address
                  </p>
                </div>

                {/* Response Time */}
                <div className={`p-6 rounded-xl border ${themeStyles.border} hover:border-violet-500/50 transition-all`}>
                  <div className="flex items-center mb-4">
                    <div className="p-3 rounded-lg bg-gradient-to-br from-indigo-500/20 to-violet-600/20 text-indigo-400 mr-4">
                      <Clock className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold">Response Time</h3>
                      <p className={themeStyles.textSecondary}>We typically respond within 24 hours</p>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className={themeStyles.textSecondary}>Technical Support:</span>
                      <span className="text-indigo-400"> 12 hours</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={themeStyles.textSecondary}>General Inquiries:</span>
                      <span className="text-indigo-400"> 24 hours</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={themeStyles.textSecondary}>Partnership Inquiries:</span>
                      <span className="text-indigo-400"> 48 hours</span>
                    </div>
                  </div>
                </div>

                {/* Business Hours */}
                <div className={`p-6 rounded-xl border ${themeStyles.border} hover:border-violet-500/50 transition-all`}>
                  <div className="flex items-center mb-4">
                    <div className="p-3 rounded-lg bg-gradient-to-br from-indigo-500/20 to-violet-600/20 text-indigo-400 mr-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold">Business Hours</h3>
                      <p className={themeStyles.textSecondary}>When our team is most responsive</p>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className={themeStyles.textSecondary}>Monday - Friday:</span>
                      <span className="text-indigo-400">9:00 AM - 6:00 PM PST</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={themeStyles.textSecondary}>Saturday:</span>
                      <span className="text-indigo-400">10:00 AM - 2:00 PM PST</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={themeStyles.textSecondary}>Sunday:</span>
                      <span className="text-gray-500">Closed</span>
                    </div>
                  </div>
                </div>

                {/* FAQ Link */}
                <div className={`p-6 rounded-xl border ${themeStyles.border} hover:border-violet-500/50 transition-all`}>
                  <div className="flex items-center mb-4">
                    <div className="p-3 rounded-lg bg-gradient-to-br from-indigo-500/20 to-violet-600/20 text-indigo-400 mr-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold">Quick Help</h3>
                      <p className={themeStyles.textSecondary}>Find answers to common questions</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <a href="#" className="block text-indigo-400 hover:text-indigo-300 transition-colors">
                      • Getting Started Guide
                    </a>
                    <a href="#" className="block text-indigo-400 hover:text-indigo-300 transition-colors">
                      • API Documentation
                    </a>
                    <a href="#" className="block text-indigo-400 hover:text-indigo-300 transition-colors">
                      • Billing & Pricing FAQ
                    </a>
                    <a href="#" className="block text-indigo-400 hover:text-indigo-300 transition-colors">
                      • Feature Tutorials
                    </a>
                  </div>
                </div>

                {/* Social Media */}
                <div className={`p-6 rounded-xl border ${themeStyles.border} hover:border-violet-500/50 transition-all`}>
                  <div className="flex items-center mb-4">
                    <div className="p-3 rounded-lg bg-gradient-to-br from-indigo-500/20 to-violet-600/20 text-indigo-400 mr-4">
                      <Share className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold">Follow Us</h3>
                      <p className={themeStyles.textSecondary}>Stay updated with the latest news</p>
                    </div>
                  </div>
                  <div className="flex space-x-4">
                    {[
                      { name: 'Twitter', icon: 'M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z' },
                      { name: 'LinkedIn', icon: 'M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z M4 6a2 2 0 100-4 2 2 0 000 4z' },
                      { name: 'YouTube', icon: 'M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z M9.75 15.02l5.75-3.27-5.75-3.27v6.54z' }
                    ].map((social, index) => (
                      <a 
                        key={index}
                        href="#" 
                        className="w-10 h-10 rounded-full bg-gray-800/50 hover:bg-indigo-600/20 flex items-center justify-center transition-all hover:scale-110"
                        aria-label={social.name}
                      >
                        <svg className="w-5 h-5 text-gray-400 hover:text-indigo-400 transition-colors" fill="currentColor" viewBox="0 0 24 24">
                          <path d={social.icon} />
                        </svg>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Alternative Contact Methods */}
            <div className="mt-16 text-center">
              <h2 className="text-2xl font-semibold mb-8">Prefer a Different Way to Connect?</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Link to="/signup" className={`p-6 rounded-xl ${themeStyles.feature} hover:scale-105 transition-all text-center`}>
                  <div className="text-2xl mb-3">🚀</div>
                  <h3 className="font-semibold mb-2">Start Free Trial</h3>
                  <p className="text-sm text-gray-400">Jump right in and experience CF Studio</p>
                </Link>
                
                <a href="mailto:support@contentfactory.ai?subject=Demo Request" className={`p-6 rounded-xl ${themeStyles.feature} hover:scale-105 transition-all text-center`}>
                  <div className="text-2xl mb-3">📅</div>
                  <h3 className="font-semibold mb-2">Request Demo</h3>
                  <p className="text-sm text-gray-400">See CF Studio in action</p>
                </a>
                
                <a href="mailto:support@contentfactory.ai?subject=Partnership Inquiry" className={`p-6 rounded-xl ${themeStyles.feature} hover:scale-105 transition-all text-center`}>
                  <div className="text-2xl mb-3">🤝</div>
                  <h3 className="font-semibold mb-2">Partner With Us</h3>
                  <p className="text-sm text-gray-400">Explore partnership opportunities</p>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add keyframes for animations */}
      <style jsx>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(10px, -10px) scale(1.05); }
          50% { transform: translate(0, 20px) scale(0.95); }
          75% { transform: translate(-10px, -15px) scale(1.05); }
        }
        
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-blob {
          animation: blob 12s infinite ease-in-out;
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out forwards;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        
        .animation-delay-200 {
          animation-delay: 0.2s;
        }
        
        .animation-delay-400 {
          animation-delay: 0.4s;
        }
        
        .animation-delay-600 {
          animation-delay: 0.6s;
        }
      `}</style>
    </div>
  );
};

export default Contact;