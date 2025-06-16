 import React from 'react';
import { Link } from 'react-router-dom';
import { Star, Sparkles, Globe, BarChart3, Check, Image, Film, Zap, Edit, ArrowLeft, Heart } from 'lucide-react';

const AboutUs = () => {
  // Premium theme with animations and glass effects
  const themeStyles = {
    bg: "bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950",
    text: "text-white",
    textSecondary: "text-gray-300",
    cardBg: "bg-gray-900/70 backdrop-blur-md",
    navBg: "bg-gray-900/80 backdrop-blur-lg border-b border-gray-800/50",
    button: "bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700",
    border: "border-gray-800/50",
    feature: "border border-gray-800/30 bg-gray-900/50 backdrop-blur-md hover:border-violet-500/50 hover:bg-gray-900/70",
    glow: "shadow-[0_0_35px_rgba(124,58,237,0.2)]"
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
            <Link to="/contact" className="hover:text-indigo-400 transition-colors">Contact</Link>
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

      {/* About Us Content */}
      <div className="relative z-10 pb-20">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="text-center mb-16">
              <h1 className="text-4xl md:text-5xl font-bold mb-6 animate-fade-in-up">
                About <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-violet-500">CF Studio</span>
              </h1>
              <div className="w-24 h-1 bg-gradient-to-r from-indigo-500 to-violet-600 mx-auto mb-8 rounded-full"></div>
              <p className={`text-xl ${themeStyles.textSecondary} leading-relaxed animate-fade-in-up animation-delay-200 max-w-3xl mx-auto`}>
                CF Studio transforms product photos into complete advertising campaigns in minutes. Upload an image, generate professional ads, videos, and social content—all in one platform.
              </p>
            </div>

            {/* Our Story */}
            <div className={`p-8 rounded-xl ${themeStyles.cardBg} mb-12 animate-fade-in-up animation-delay-400`}>
              <h2 className="text-3xl font-semibold mb-6 flex items-center">
                <div className="p-3 rounded-lg bg-gradient-to-br from-indigo-500/20 to-violet-600/20 text-indigo-400 mr-4">
                  <Heart className="w-6 h-6" />
                </div>
                Our Story
              </h2>
              <p className={`text-lg ${themeStyles.textSecondary} leading-relaxed`}>
                I built CF Studio because creating quality advertising shouldn't require weeks, thousands of dollars, or a production team. As a solo founder, I saw businesses struggling with fragmented AI tools that still left gaps in their creative workflow.
              </p>
              <p className={`text-lg ${themeStyles.textSecondary} leading-relaxed mt-4`}>
                So I built the complete solution: end-to-end campaign creation from a single product photo.
              </p>
            </div>

            {/* What Makes Us Different */}
            <div className="mb-16 animate-fade-in-up animation-delay-600">
              <h2 className="text-3xl font-semibold mb-8 text-center">What Makes Us Different</h2>
              <div className="grid grid-cols-1 md:grid-cols-1 gap-8">
                {[
                  {
                    title: "Reference-Guided Generation",
                    description: "Upload style references to guide your content's look and feel—maintain brand consistency while exploring new creative directions.",
                    icon: <Sparkles className="w-6 h-6" />
                  },
                  {
                    title: "Keyframes Control", 
                    description: "Direct your video content like a filmmaker—control camera angles, transitions, and narrative flow.",
                    icon: <Film className="w-6 h-6" />
                  },
                  {
                    title: "Complete Workflow",
                    description: "Generate images, videos, voiceovers, and music in one integrated platform. No tool switching, no manual integration.",
                    icon: <Zap className="w-6 h-6" />
                  }
                ].map((feature, index) => (
                  <div key={index} className={`p-8 rounded-xl ${themeStyles.feature} transition-all duration-300 hover:translate-y-[-5px] ${themeStyles.glow}`}>
                    <div className="flex items-start mb-4">
                      <div className="p-3 rounded-lg bg-gradient-to-br from-indigo-500/20 to-violet-600/20 text-indigo-400 mr-4 flex-shrink-0">
                        {feature.icon}
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                        <p className={`${themeStyles.textSecondary} leading-relaxed`}>{feature.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Our Mission */}
            <div className={`p-8 rounded-xl ${themeStyles.cardBg} mb-12 animate-fade-in-up animation-delay-800`}>
              <h2 className="text-3xl font-semibold mb-6 flex items-center">
                <div className="p-3 rounded-lg bg-gradient-to-br from-indigo-500/20 to-violet-600/20 text-indigo-400 mr-4">
                  <Star className="w-6 h-6" />
                </div>
                Our Mission
              </h2>
              <p className={`text-lg ${themeStyles.textSecondary} leading-relaxed`}>
                Every business deserves professional-quality marketing content, regardless of budget or technical expertise. CF Studio exists to democratize creative production and let great ideas shine.
              </p>
            </div>

            {/* Call to Action */}
            <div className="text-center animate-fade-in-up animation-delay-1000">
              <Link to="/signup" className={`inline-flex items-center px-8 py-4 rounded-full ${themeStyles.button} text-white font-medium hover:shadow-lg hover:shadow-violet-500/20 transition-all mr-4`}>
                Start Creating Today
              </Link>
              <Link to="/contact" className={`inline-flex items-center px-8 py-4 rounded-full border ${themeStyles.border} text-white font-medium hover:bg-gray-800/30 transition-all`}>
                Get in Touch
              </Link>
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
        
        .animation-delay-800 {
          animation-delay: 0.8s;
        }
        
        .animation-delay-1000 {
          animation-delay: 1s;
        }
      `}</style>
    </div>
  );
};

export default AboutUs;