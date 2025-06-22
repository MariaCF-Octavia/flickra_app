 import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Edit, Clock, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';

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

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Enhanced dark theme to match HomeDashboard
  const themeStyles = {
    bg: "bg-gradient-to-b from-black via-gray-950 to-black",
    text: "text-white",
    textSecondary: "text-gray-400",
    cardBg: "bg-black/60 backdrop-blur-xl border border-gray-800/30",
    navBg: "bg-black/90 backdrop-blur-xl border-b border-gray-800/50",
    button: "bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 hover:from-purple-700 hover:via-violet-700 hover:to-indigo-700",
    buttonSecondary: "bg-gray-900/80 backdrop-blur-sm hover:bg-gray-800/80 border border-gray-700/50",
    border: "border-gray-800/30",
    input: "bg-gray-900/80 backdrop-blur-sm border-gray-700/50",
    feature: "border border-gray-800/30 bg-black/40 backdrop-blur-xl hover:border-purple-500/50 hover:bg-black/60",
    glow: "shadow-[0_0_50px_rgba(139,92,246,0.3)]"
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
    <div className={`min-h-screen ${themeStyles.bg} ${themeStyles.text} font-sans relative overflow-x-hidden`}>
      {/* Enhanced background effects to match HomeDashboard */}
      <div className="fixed inset-0 overflow-hidden z-0">
        <div className="absolute top-0 -left-40 w-96 h-96 bg-purple-700/20 rounded-full filter blur-3xl opacity-40 animate-blob"></div>
        <div className="absolute top-1/3 -right-20 w-96 h-96 bg-violet-700/20 rounded-full filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-96 h-96 bg-indigo-700/20 rounded-full filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
        <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-fuchsia-700/15 rounded-full filter blur-3xl opacity-25 animate-blob animation-delay-6000"></div>
      </div>

      {/* Navigation Bar */}
      <nav className={`fixed w-full z-50 transition-all duration-300 ${themeStyles.navBg} py-3`}>
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <Link to="/" className="flex items-center">
            <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-violet-400 to-indigo-400">CF Studio</div>
            <div className="ml-3 px-3 py-1 text-xs font-bold rounded-full bg-gradient-to-r from-purple-500/20 to-indigo-500/20 text-purple-300 border border-purple-500/30">BETA</div>
          </Link>
          
          {/* Mobile-friendly navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <Link to="/" className="hover:text-purple-400 transition-colors">Home</Link>
            <Link to="/about" className="hover:text-purple-400 transition-colors">About</Link>
            <Link to="/login" className="hover:text-purple-400 transition-colors">Login</Link>
            <Link to="/signup" className={`px-5 py-2.5 rounded-full ${themeStyles.button} text-white font-medium shadow-lg shadow-purple-500/20 transition-all hover:shadow-xl hover:shadow-purple-500/30`}>
              Get Started Now
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Link to="/signup" className={`px-4 py-2 rounded-full ${themeStyles.button} text-white text-sm font-medium`}>
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Back to Home Link */}
      <div className="pt-24 pb-8 relative z-10">
        <div className="container mx-auto px-6">
          <Link to="/" className="inline-flex items-center text-purple-400 hover:text-purple-300 transition-colors">
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
                Get in <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-violet-400 to-indigo-400">Touch</span>
              </h1>
              <div className="w-24 h-1 bg-gradient-to-r from-purple-500 to-indigo-600 mx-auto mb-8 rounded-full"></div>
              <p className={`text-lg ${themeStyles.textSecondary} leading-relaxed animate-fade-in-up animation-delay-200`}>
                Ready to transform your content creation? We'd love to hear from you.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
              {/* Contact Form */}
              <div className={`p-6 lg:p-8 rounded-xl ${themeStyles.feature} animate-fade-in-up animation-delay-400 ${themeStyles.glow}`}>
                <h2 className="text-xl lg:text-2xl font-semibold mb-6 flex items-center">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-indigo-600/20 text-purple-400 mr-3">
                    <Edit className="w-5 h-5" />
                  </div>
                  Send us a Message
                </h2>

                {/* Success/Error Messages */}
                {submitStatus === 'success' && (
                  <div className="mb-6 p-4 rounded-lg bg-green-500/20 border border-green-500/50 flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-green-300 text-sm">Your email client should now open. Thanks for reaching out!</span>
                  </div>
                )}

                {submitStatus === 'error' && (
                  <div className="mb-6 p-4 rounded-lg bg-red-500/20 border border-red-500/50 flex items-start">
                    <AlertCircle className="w-5 h-5 text-red-400 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-red-300 text-sm">There was an error. Please email us directly at support@contentfactory.ai</span>
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
                        className={`w-full px-4 py-3 rounded-lg ${themeStyles.input} border ${themeStyles.border} focus:border-purple-500 focus:outline-none transition-colors text-white placeholder-gray-500`}
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
                        className={`w-full px-4 py-3 rounded-lg ${themeStyles.input} border ${themeStyles.border} focus:border-purple-500 focus:outline-none transition-colors text-white placeholder-gray-500`}
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
                      className={`w-full px-4 py-3 rounded-lg ${themeStyles.input} border ${themeStyles.border} focus:border-purple-500 focus:outline-none transition-colors text-white placeholder-gray-500`}
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
                      className={`w-full px-4 py-3 rounded-lg ${themeStyles.input} border ${themeStyles.border} focus:border-purple-500 focus:outline-none transition-colors text-white`}
                    >
                      <option value="" className="bg-gray-900 text-gray-300">Select a topic</option>
                      <option value="Request Demo" className="bg-gray-900 text-white">Request Demo</option>
                      <option value="Technical Support" className="bg-gray-900 text-white">Technical Support</option>
                      <option value="Partnership Inquiry" className="bg-gray-900 text-white">Partnership Inquiry</option>
                      <option value="Billing Question" className="bg-gray-900 text-white">Billing Question</option>
                      <option value="Feature Request" className="bg-gray-900 text-white">Feature Request</option>
                      <option value="Feedback" className="bg-gray-900 text-white">Feedback</option>
                      <option value="Other" className="bg-gray-900 text-white">Other</option>
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
                      className={`w-full px-4 py-3 rounded-lg ${themeStyles.input} border ${themeStyles.border} focus:border-purple-500 focus:outline-none transition-colors resize-none text-white placeholder-gray-500`}
                      placeholder="Tell us about your project or how we can help..."
                    ></textarea>
                  </div>
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full py-3 rounded-lg ${themeStyles.button} text-white font-medium hover:shadow-lg hover:shadow-purple-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {isSubmitting ? 'Sending...' : 'Send Message'}
                  </button>
                  <p className="text-xs text-gray-500 text-center">
                    * Required fields. This will open your email client to send the message.
                  </p>
                </form>
              </div>

              {/* Contact Information */}
              <div className="space-y-6 lg:space-y-8 animate-fade-in-up animation-delay-600">
                {/* Direct Email */}
                <div className={`p-6 rounded-xl ${themeStyles.feature} hover:border-purple-500/50 transition-all`}>
                  <div className="flex items-center mb-4">
                    <div className="p-3 rounded-lg bg-gradient-to-br from-purple-500/20 to-indigo-600/20 text-purple-400 mr-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg lg:text-xl font-semibold">Direct Email</h3>
                      <p className={`${themeStyles.textSecondary} text-sm lg:text-base`}>Prefer to email us directly?</p>
                    </div>
                  </div>
                  <a 
                    href="mailto:support@contentfactory.ai" 
                    className="text-purple-400 hover:text-purple-300 transition-colors font-medium text-base lg:text-lg break-all"
                  >
                    support@contentfactory.ai
                  </a>
                  <p className="text-xs lg:text-sm text-gray-500 mt-2">
                    Click to open your email client or copy this address
                  </p>
                </div>

                {/* Response Time */}
                <div className={`p-6 rounded-xl ${themeStyles.feature} hover:border-purple-500/50 transition-all`}>
                  <div className="flex items-center mb-4">
                    <div className="p-3 rounded-lg bg-gradient-to-br from-purple-500/20 to-indigo-600/20 text-purple-400 mr-4">
                      <Clock className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg lg:text-xl font-semibold">Response Time</h3>
                      <p className={`${themeStyles.textSecondary} text-sm lg:text-base`}>We typically respond within 24 hours</p>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className={themeStyles.textSecondary}>Technical Support:</span>
                      <span className="text-purple-400">12 hours</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={themeStyles.textSecondary}>General Inquiries:</span>
                      <span className="text-purple-400">24 hours</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={themeStyles.textSecondary}>Partnership Inquiries:</span>
                      <span className="text-purple-400">48 hours</span>
                    </div>
                  </div>
                </div>

                {/* Business Hours */}
                <div className={`p-6 rounded-xl ${themeStyles.feature} hover:border-purple-500/50 transition-all`}>
                  <div className="flex items-center mb-4">
                    <div className="p-3 rounded-lg bg-gradient-to-br from-purple-500/20 to-indigo-600/20 text-purple-400 mr-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg lg:text-xl font-semibold">Business Hours</h3>
                      <p className={`${themeStyles.textSecondary} text-sm lg:text-base`}>When our team is most responsive</p>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className={themeStyles.textSecondary}>Monday - Friday:</span>
                      <span className="text-purple-400">9:00 AM - 6:00 PM PST</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={themeStyles.textSecondary}>Saturday:</span>
                      <span className="text-purple-400">10:00 AM - 2:00 PM PST</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={themeStyles.textSecondary}>Sunday:</span>
                      <span className="text-gray-500">Closed</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced styles to match HomeDashboard */}
      <style jsx>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(15px, -15px) scale(1.1); }
          50% { transform: translate(0, 25px) scale(0.9); }
          75% { transform: translate(-15px, -20px) scale(1.05); }
        }
        
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-blob {
          animation: blob 15s infinite ease-in-out;
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out forwards;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        
        .animation-delay-6000 {
          animation-delay: 6s;
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