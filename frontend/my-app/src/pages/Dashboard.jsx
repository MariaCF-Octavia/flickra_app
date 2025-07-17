import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Play, Image, Mic, Music, Edit, Share, ChevronRight, BarChart3, Check, ArrowRight, 
         Star, XCircle, Shield, Sparkles, Globe, Clock, Film, Zap, ArrowDown, DollarSign, TrendingUp, Menu, X } from 'lucide-react';

// Your imported assets (keeping all original imports + new ones)
import loreadpink from "../assets/lorealpinkad.png";
import keresteorg from "../assets/keresteorg.jpg";
import kerestead from "../assets/kerestead.jpg";
import thalgo from "../assets/thalgoorg.jpg";
import thalgoad from "../assets/thalgo2ad.png";
import daeorg from "../assets/daeorg.jpg";
import dae from"../assets/daead2.png";
import anemone from"../assets/anemonecf.webp";
import anemonelo from "../assets/anemonelotion.webp";
import estrella from "../assets/estrellacf.webp";
import lofbergs from "../assets/löfbergs.png";
import celsius from "../assets/celsiusafter.webp";
import curologyimg from "../assets/curologyimg.jpg";
import spacurology from "../assets/spa.jpg"; 
import curology from "../assets/cfcurologyad (2).mp4";
import givenchy from "../assets/givechy vid ad.mp4";
import adForCf1 from "../assets/lorealad.mp4";
import adForCf4 from "../assets/AdForCf4.mp4";
import phone from "../assets/phonead.jpg";
import CFDemoUse from "../assets/CFDemoUse.mp4";
// Removed fendiad import as requested
import DemoVideo from "../components/DemoVideo.jsx";
import givenchyperfume from "../assets/givenchyperfume.jpg";
import perfumestand from "../assets/perfumestand.jpg";
import iphone16 from "../assets/iphone16.jpeg";
import phonestand from "../assets/phonestand.jpg";
import versaceimg from "../assets/versaceimgb4.webp"; 
import versacead from "../assets/versacead.png";
import yslimg from "../assets/ysl.webp"; 
import ysladcf from "../assets/ysladcf.png";
import ordinaryimg from "../assets/ordinary..webp";
import ordinaryad from "../assets/ordinaryad2.png";

const HomeDashboard = () => {
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [currentVideo, setCurrentVideo] = useState(null);
  const [showDemoVideo, setShowDemoVideo] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeTransformation, setActiveTransformation] = useState(0);
  const [transformationPhase, setTransformationPhase] = useState('before');
  const [videoLoaded, setVideoLoaded] = useState({});
  const [hoveredFeature, setHoveredFeature] = useState(null);
  const [activeSection, setActiveSection] = useState('hero');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const videoRefs = useRef({});
  const sectionRefs = useRef({});
  const observerRef = useRef(null);
  
  // UPDATED: Added new transformations and removed Fendi
  const transformations = [
    // 1. Curology (Original → Reference → Results)
    {
      before: { type: 'image', src: curologyimg, alt: 'Curology Product' },
      during: { type: 'image', src: spacurology, alt: 'Spa Reference Style' },
      after: { type: 'video', src: curology, alt: 'Curology Ad Results' },
      title: 'Curology Skincare Campaign',
      category: 'Beauty & Wellness',
      hasReference: true
    },
    // 2. YSL (Original → Results)
    {
      before: { type: 'image', src: yslimg, alt: 'YSL Product Original' },
      during: { type: 'image', src: yslimg, alt: 'YSL Product Original' },
      after: { type: 'image', src: ysladcf, alt: 'YSL Campaign Results' },
      title: 'YSL Luxury Campaign',
      category: 'Beauty & Fashion',
      hasReference: true
    },
    // 3. Givenchy (Original → Reference → Results)
    {
      before: { type: 'image', src: givenchyperfume, alt: 'Givenchy Perfume Photo' },
      during: { type: 'image', src: perfumestand, alt: 'Reference Style' },
      after: { type: 'video', src: givenchy, alt: 'Givenchy Ad Results' },
      title: 'Givenchy Luxury Campaign',
      category: 'Beauty & Fragrance',
      hasReference: true
    },
    // 4. iPhone (Original → Reference → Results)
    {
      before: { type: 'image', src: iphone16, alt: 'iPhone 16 Product' },
      during: { type: 'image', src: phonestand, alt: 'Reference Style' },
      after: { type: 'image', src: phone, alt: 'Phone Ad Results' },
      title: 'iPhone Professional Campaign',
      category: 'Technology',
      hasReference: true
    },
    // 5. Versace (Original → Results)
    {
      before: { type: 'image', src: versaceimg, alt: 'Versace Product Original' },
      during: { type: 'image', src: versaceimg, alt: 'Versace Product Original' },
      after: { type: 'image', src: versacead, alt: 'Versace Campaign Results' },
      title: 'Versace Premium Campaign',
      category: 'Luxury Fashion',
      hasReference: true
    },
    // 6. The Ordinary (Original → Results)
    {
      before: { type: 'image', src: ordinaryimg, alt: 'The Ordinary Product Original' },
      during: { type: 'image', src: ordinaryimg, alt: 'The Ordinary Product Original' },
      after: { type: 'image', src: ordinaryad, alt: 'The Ordinary Campaign Results' },
      title: 'The Ordinary Skincare Campaign',
      category: 'Beauty & Skincare',
      hasReference: true
    },
    // NEW TRANSFORMATIONS - Added your new .org/.ad pairs
    // 7. Kereste (Original → Results)
    {
      before: { type: 'image', src: keresteorg, alt: 'Kereste Product Original' },
      during: { type: 'image', src: keresteorg, alt: 'Kereste Product Original' },
      after: { type: 'image', src: kerestead, alt: 'Kereste Campaign Results' },
      title: 'Kereste Brand Campaign',
      category: 'Lifestyle',
      hasReference: false
    },
    // 8. Thalgo (Original → Results)
    {
      before: { type: 'image', src: thalgo, alt: 'Thalgo Product Original' },
      during: { type: 'image', src: thalgo, alt: 'Thalgo Product Original' },
      after: { type: 'image', src: thalgoad, alt: 'Thalgo Campaign Results' },
      title: 'Thalgo Beauty Campaign',
      category: 'Beauty & Skincare',
      hasReference: false
    },
    // 9. Dae (Original → Results)
    {
      before: { type: 'image', src: daeorg, alt: 'Dae Product Original' },
      during: { type: 'image', src: daeorg, alt: 'Dae Product Original' },
      after: { type: 'image', src: dae, alt: 'Dae Campaign Results' },
      title: 'Dae Haircare Campaign',
      category: 'Beauty & Haircare',
      hasReference: false
    },
    // 10. Anemone (Original → Results)
    {
      before: { type: 'image', src: anemone, alt: 'Anemone Product Original' },
      during: { type: 'image', src: anemone, alt: 'Anemone Product Original' },
      after: { type: 'image', src: anemonelo, alt: 'Anemone Campaign Results' },
      title: 'Anemone Skincare Campaign',
      category: 'Beauty & Skincare',
      hasReference: false
    },
    // Standalone ads - just show once as they are
    {
      before: { type: 'video', src: adForCf1, alt: 'Premium Ad Campaign' },
      during: { type: 'video', src: adForCf1, alt: 'Premium Ad Campaign' },
      after: { type: 'video', src: adForCf1, alt: 'Premium Ad Campaign' },
      title: 'Premium Ad Campaign',
      category: 'Video',
      hasReference: false
    },
    {
      before: { type: 'video', src: adForCf4, alt: 'Luxury Fashion Campaign' },
      during: { type: 'video', src: adForCf4, alt: 'Luxury Fashion Campaign' },
      after: { type: 'video', src: adForCf4, alt: 'Luxury Fashion Campaign' },
      title: 'Luxury Fashion Campaign',
      category: 'Video',
      hasReference: false
    },
    // NEW STANDALONE ADS
    {
      before: { type: 'image', src: estrella, alt: 'Estrella Brand Campaign' },
      during: { type: 'image', src: estrella, alt: 'Estrella Brand Campaign' },
      after: { type: 'image', src: estrella, alt: 'Estrella Brand Campaign' },
      title: 'Estrella Brand Campaign',
      category: 'Lifestyle',
      hasReference: false
    },
    {
      before: { type: 'image', src: lofbergs, alt: 'Löfbergs Coffee Campaign' },
      during: { type: 'image', src: lofbergs, alt: 'Löfbergs Coffee Campaign' },
      after: { type: 'image', src: lofbergs, alt: 'Löfbergs Coffee Campaign' },
      title: 'Löfbergs Coffee Campaign',
      category: 'Food & Beverage',
      hasReference: false
    },
    {
      before: { type: 'image', src: celsius, alt: 'Celsius Energy Campaign' },
      during: { type: 'image', src: celsius, alt: 'Celsius Energy Campaign' },
      after: { type: 'image', src: celsius, alt: 'Celsius Energy Campaign' },
      title: 'Celsius Energy Campaign',
      category: 'Food & Beverage',
      hasReference: false
    },
    {
      before: { type: 'image', src: loreadpink, alt: 'L\'Oreal Pink Campaign' },
      during: { type: 'image', src: loreadpink, alt: 'L\'Oreal Pink Campaign' },
      after: { type: 'image', src: loreadpink, alt: 'L\'Oreal Pink Campaign' },
      title: 'L\'Oreal Pink Campaign',
      category: 'Beauty',
      hasReference: false
    }
  ];

  // Enhanced dark theme
  const themeStyles = {
    bg: "bg-gradient-to-b from-black via-gray-950 to-black",
    text: "text-white",
    textSecondary: "text-gray-400",
    cardBg: "bg-black/60 backdrop-blur-xl border border-gray-800/30",
    navBg: isScrolled ? "bg-black/90 backdrop-blur-xl border-b border-gray-800/50" : "bg-transparent",
    button: "bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 hover:from-purple-700 hover:via-violet-700 hover:to-indigo-700",
    buttonSecondary: "bg-gray-900/80 backdrop-blur-sm hover:bg-gray-800/80 border border-gray-700/50",
    accent: "text-violet-400",
    border: "border-gray-800/30",
    input: "bg-gray-900/80 backdrop-blur-sm border-gray-700/50",
    highlight: "bg-gradient-to-r from-purple-500/10 via-violet-500/10 to-indigo-500/10",
    glow: "shadow-[0_0_50px_rgba(139,92,246,0.3)]",
    feature: "border border-gray-800/30 bg-black/40 backdrop-blur-xl hover:border-purple-500/50 hover:bg-black/60"
  };

  const sections = ['hero', 'features', 'showcase', 'pricing'];

  // Enhanced features with platform focus
  const features = [
    {
      icon: <Film className="w-6 h-6" />,
      title: "Complete Ad Production Pipeline", 
      description: "Image generation, video creation, voiceover, music, and editing. Everything agencies do, but automated and instant.",
      highlight: "WORLD'S FIRST",
      valueProposition: "End-to-end workflow"
    },
    {
      icon: <Sparkles className="w-6 h-6" />,
      title: "Reference Style Technology",
      description: "Upload any ad style as reference and our AI applies that exact aesthetic to your product. No complex prompts needed.",
      highlight: "REVOLUTIONARY",
      valueProposition: "Copy any style instantly"
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "15-Minute Campaign Creation", 
      description: "What takes agencies 3 weeks and $5000, CF Studio delivers in 15 minutes. Complete campaigns ready for launch.",
      highlight: "SPEED",
      valueProposition: "1000x faster than agencies"
    },
    {
      icon: <DollarSign className="w-6 h-6" />,
      title: "Built-in ROI Tracking",
      description: "Performance analytics, CTR tracking, and conversion monitoring. Know what works before you scale.",
      highlight: "ENTERPRISE",
      valueProposition: "Data-driven optimization"
    },
    {
      icon: <Globe className="w-6 h-6" />,
      title: "Direct Social Publishing", 
      description: "Create, preview, and publish directly to TikTok, Instagram, YouTube, LinkedIn. No downloads or uploads needed.",
      highlight: "SEAMLESS",
      valueProposition: "One-click publishing"
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: "Agency-Quality Output",
      description: "Studio-grade results that rival $10,000 productions. Professional voiceover, custom music, cinematic visuals.",
      highlight: "PROFESSIONAL",
      valueProposition: "Agency results, AI speed"
    }
  ];

  // UPDATED: Added new showcase ads and removed Fendi
  const showcaseAds = [
    { type: 'video', src: givenchy, title: 'Givenchy Luxury Campaign', category: 'Beauty' },
    { type: 'video', src: curology, title: 'Curology Skincare Campaign', category: 'Beauty' },
    { type: 'video', src: adForCf4, title: 'Premium Fashion Campaign', category: 'Fashion' },
    { type: 'video', src: adForCf1, title: 'Premium Ad Campaign', category: 'Lifestyle' },
    { type: 'image', src: phone, title: 'iPhone Professional Ad', category: 'Technology' },
    { type: 'image', src: ysladcf, title: 'YSL Luxury Campaign', category: 'Beauty' },
    { type: 'image', src: versacead, title: 'Versace Premium Campaign', category: 'Fashion' },
    { type: 'image', src: ordinaryad, title: 'The Ordinary Skincare Campaign', category: 'Beauty' },
    // NEW SHOWCASE ADS
    { type: 'image', src: kerestead, title: 'Kereste Brand Campaign', category: 'Lifestyle' },
    { type: 'image', src: thalgoad, title: 'Thalgo Beauty Campaign', category: 'Beauty' },
    { type: 'image', src: dae, title: 'Dae Haircare Campaign', category: 'Beauty' },
    { type: 'image', src: anemonelo, title: 'Anemone Skincare Campaign', category: 'Beauty' },
    { type: 'image', src: estrella, title: 'Estrella Brand Campaign', category: 'Lifestyle' },
    { type: 'image', src: lofbergs, title: 'Löfbergs Coffee Campaign', category: 'Food & Beverage' },
    { type: 'image', src: celsius, title: 'Celsius Energy Campaign', category: 'Food & Beverage' },
    { type: 'image', src: loreadpink, title: 'L\'Oreal Pink Campaign', category: 'Beauty' }
  ];

 const pricingTiers = [
  {
    name: "Starter",
    price: "$49",
    period: "/month",
    features: [
      "25 generations/month",
      "Basic templates",
      "Standard quality",
      "Email support"
    ],
    cta: "Choose Starter",
    popular: false,
    savings: "Everything you need to get started"
  },
  {
    name: "Professional",
    price: "$89",
    period: "/month",
    features: [
      "50 generations/month",
      "Premium templates",
      "HD quality",
      "Priority support",
      "Advanced editing"
    ],
    cta: "Choose Professional",
    popular: true,
    savings: "Perfect for growing businesses"
  },
  {
    name: "Business",
    price: "$159",
    period: "/month",
    features: [
      "100 generations/month",
      "All templates",
      "4K quality",
      "24/7 support",
      "Team collaboration",
      "API access"
    ],
    cta: "Choose Business",
    popular: false,
    savings: "For agencies and large teams"
  },
  {
    name: "Enterprise",
    price: "$249",
    period: "/month",
    features: [
      "Unlimited generations",
      "Custom templates",
      "8K quality",
      "Dedicated support",
      "White-label option",
      "Custom integrations"
    ],
    cta: "Choose Enterprise",
    popular: false,
    savings: "For enterprise-level needs"
  }
];

  // Success metrics to build trust
  const successMetrics = [
    { number: "98%", label: "Cost Reduction", description: "vs traditional video production" },
    { number: "10x", label: "Faster Creation", description: "Minutes instead of weeks" },
    { number: "$1000+", label: "Resale Value", description: "Per video created" },
    { number: "50+", label: "Business Categories", description: "Fashion, beauty, tech & more" }
  ];

  // Transformation cycle effect - Different timing for 2-phase vs 3-phase transformations
  useEffect(() => {
    const interval = setInterval(() => {
      setTransformationPhase(prev => {
        const currentTransformation = transformations[activeTransformation];
        
        if (currentTransformation.hasReference) {
          const is2Phase = currentTransformation.title.includes('YSL') || 
                          currentTransformation.title.includes('Versace') || 
                          currentTransformation.title.includes('The Ordinary');
          
          if (is2Phase) {
            if (prev === 'before') return 'after';
            if (prev === 'after') {
              setActiveTransformation(prev => (prev + 1) % transformations.length);
              return 'before';
            }
          } else {
            if (prev === 'before') return 'transition';
            if (prev === 'transition') return 'after';
            if (prev === 'after') {
              setActiveTransformation(prev => (prev + 1) % transformations.length);
              return 'before';
            }
          }
        } else {
          setActiveTransformation(prev => (prev + 1) % transformations.length);
          return 'before';
        }
        return 'before';
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [transformations.length, activeTransformation]);

  // Enhanced video handling with better loading detection
  useEffect(() => {
    const loadVideos = () => {
      transformations.forEach((transformation, index) => {
        if (transformation.after.type === 'video') {
          const videoKey = `after-${index}`;
          if (videoRefs.current[videoKey]) {
            const video = videoRefs.current[videoKey];
            
            if (video.getAttribute('data-loaded') === 'true') return;
            video.setAttribute('data-loaded', 'true');
            
            video.addEventListener('loadstart', () => {
              console.log(`Loading ${transformation.after.alt}...`);
            });
            
            video.addEventListener('error', (e) => {
              console.error(`Error loading ${transformation.after.alt}:`, e);
              setVideoLoaded(prev => ({ ...prev, [videoKey]: false }));
            });
            
            video.load();
            video.onloadeddata = () => {
              setVideoLoaded(prev => ({ ...prev, [videoKey]: true }));
              console.log(`${transformation.after.alt} loaded successfully`);
            };
          }
        }
      });
    };
    
    loadVideos();
  }, []);

  // ENHANCED: Better video playback control for all phases
  useEffect(() => {
    transformations.forEach((transformation, index) => {
      ['before', 'during', 'after'].forEach(phase => {
        const videoKey = `${phase}-${index}`;
        const phaseData = transformation[phase === 'during' ? 'during' : phase === 'before' ? 'before' : 'after'];
        
        if (phaseData?.type === 'video' && videoRefs.current[videoKey]) {
          const video = videoRefs.current[videoKey];
          
          const shouldPlay = index === activeTransformation && 
            ((phase === 'before' && transformationPhase === 'before') ||
             (phase === 'during' && transformationPhase === 'transition') ||
             (phase === 'after' && transformationPhase === 'after'));
          
          if (shouldPlay) {
            setTimeout(() => {
              video.play().catch((error) => {
                console.log(`Video play failed for ${phaseData.alt}:`, error);
              });
            }, 100);
          } else {
            video.pause();
            video.currentTime = 0;
          }
        }
      });
    });
  }, [activeTransformation, transformationPhase, transformations]);

  useEffect(() => {
    sectionRefs.current = sections.reduce((acc, id) => {
      acc[id] = document.getElementById(id);
      return acc;
    }, {});

    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    }, { threshold: 0.3 });

    Object.values(sectionRefs.current).forEach(section => {
      if (section) observerRef.current.observe(section);
    });

    return () => {
      if (observerRef.current) {
        Object.values(sectionRefs.current).forEach(section => {
          if (section) observerRef.current.unobserve(section);
        });
      }
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    
    const handleEscKey = (event) => {
      if (event.key === 'Escape' && showVideoModal) {
        setShowVideoModal(false);
      }
      if (event.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('keydown', handleEscKey);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('keydown', handleEscKey);
    };
  }, [showVideoModal, mobileMenuOpen]);

  const playVideo = (videoSrc) => {
    setCurrentVideo(videoSrc);
    setShowVideoModal(true);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const scrollToSection = (sectionId) => {
    const section = document.getElementById(sectionId);
    if (section) {
      window.scrollTo({
        top: section.offsetTop - 80,
        behavior: "smooth"
      });
    }
    setMobileMenuOpen(false); // Close mobile menu when navigating
  };

  return (
    <div className={`min-h-screen ${themeStyles.bg} ${themeStyles.text} font-sans relative overflow-x-hidden`}>
      <DemoVideo 
        isOpen={showDemoVideo}
        onClose={() => setShowDemoVideo(false)}
        title="CF Studio Tutorial"
        description="Complete walkthrough of our AI marketing tools and features"
        videoUrl={CFDemoUse}
      />

      {/* Enhanced background effects */}
      <div className="fixed inset-0 overflow-hidden z-0">
        <div className="absolute top-0 -left-40 w-96 h-96 bg-purple-700/20 rounded-full filter blur-3xl opacity-40 animate-blob"></div>
        <div className="absolute top-1/3 -right-20 w-96 h-96 bg-violet-700/20 rounded-full filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-96 h-96 bg-indigo-700/20 rounded-full filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
        <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-fuchsia-700/15 rounded-full filter blur-3xl opacity-25 animate-blob animation-delay-6000"></div>
      </div>

      {/* UPDATED Navigation with Mobile Menu */}
      <nav className={`fixed w-full z-50 transition-all duration-300 ${themeStyles.navBg} ${isScrolled ? 'py-3' : 'py-5'}`}>
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center">
            <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-violet-400 to-indigo-400">CF Studio</div>
            <div className="ml-3 px-3 py-1 text-xs font-bold rounded-full bg-gradient-to-r from-purple-500/20 to-indigo-500/20 text-purple-300 border border-purple-500/30">BETA</div>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {['features', 'showcase', 'pricing'].map((section) => (
              <button 
                key={section}
                onClick={() => scrollToSection(section)}
                className={`hover:text-purple-400 transition-colors relative ${activeSection === section ? 'text-purple-400' : ''}`}
              >
                {section.charAt(0).toUpperCase() + section.slice(1)}
                {activeSection === section && (
                  <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full"></span>
                )}
              </button>
            ))}
            <Link to="/about" className="hover:text-purple-400 transition-colors">About</Link>
            <Link to="/contact" className="hover:text-purple-400 transition-colors">Contact</Link>
            <Link to="/login" className="hover:text-purple-400 transition-colors">Login</Link>
            {/* UPDATED: Get Started Now goes to trial */}
            <Link to="/signup?mode=trial" className={`px-5 py-2.5 rounded-full ${themeStyles.button} text-white font-medium shadow-lg shadow-purple-500/20 transition-all hover:shadow-xl hover:shadow-purple-500/30`}>
              Get Started Now
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden p-2 rounded-lg bg-gray-800/50 border border-gray-700/50"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-black/95 backdrop-blur-xl border-b border-gray-800/50">
            <div className="px-6 py-4 space-y-4">
              {['features', 'showcase', 'pricing'].map((section) => (
                <button 
                  key={section}
                  onClick={() => scrollToSection(section)}
                  className="block w-full text-left py-2 hover:text-purple-400 transition-colors"
                >
                  {section.charAt(0).toUpperCase() + section.slice(1)}
                </button>
              ))}
              <Link to="/about" className="block py-2 hover:text-purple-400 transition-colors">About</Link>
              <Link to="/contact" className="block py-2 hover:text-purple-400 transition-colors">Contact</Link>
              <Link to="/login" className="block py-2 hover:text-purple-400 transition-colors">Login</Link>
              
              {/* Mobile CTA Buttons */}
              <div className="pt-4 border-t border-gray-800 space-y-3">
                <Link 
                  to="/signup?mode=trial" 
                  className="block w-full px-4 py-3 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium text-center"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Sparkles className="w-4 h-4 inline mr-2" />
                  Try for Free
                </Link>
                <Link 
                  to="/signup" 
                  className={`block w-full px-4 py-3 rounded-lg ${themeStyles.button} text-white font-medium text-center`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Full Access
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* UPDATED HERO SECTION - Changed button routing */}
      <section id="hero" className="relative min-h-screen flex items-center pt-20">
        <div className="container mx-auto px-6 z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-16 items-center">
            {/* Left side - Business-focused Content */}
            <div className="max-w-xl mb-8 lg:mb-0">
              <div className="mb-8">
                <span className="inline-block px-4 py-2 text-sm rounded-full bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-300 mb-6 animate-fade-in-up border border-green-500/30">
                  <span className="flex items-center">
                    <DollarSign className="w-4 h-4 mr-2" />
                    Save $4,900+ per campaign
                  </span>
                </span>
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold mb-6 md:mb-8 leading-tight tracking-tight animate-fade-in-up animation-delay-200">
                Replace Your <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-violet-400 to-indigo-400">Ad Agency</span> 
                <br />
                with <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-violet-400 to-indigo-400">AI</span>
              </h1>
              
              {/* Mobile: Shorter description */}
              <p className="text-lg md:text-xl mb-4 md:mb-6 opacity-90 leading-relaxed animate-fade-in-up animation-delay-400 text-gray-300">
                <span className="block md:hidden">Turn product photos into $5,000 commercials in 15 minutes. Complete AI platform for video, images, voice, music, and editing.</span>
                <span className="hidden md:block">Turn any product photo into a $5,000 commercial in 15 minutes. Complete AI platform for video, images, voice, music, and editing.</span>
              </p>

              {/* Success Metrics - More compact on mobile */}
              <div className="grid grid-cols-2 gap-3 md:gap-4 mb-6 md:mb-10 animate-fade-in-up animation-delay-500">
                <div className="bg-black/30 backdrop-blur-sm border border-purple-500/30 rounded-lg p-3 md:p-4">
                  <div className="text-xl md:text-2xl font-bold text-green-400">98%</div>
                  <div className="text-xs md:text-sm text-gray-400">Cost Reduction</div>
                </div>
                <div className="bg-black/30 backdrop-blur-sm border border-purple-500/30 rounded-lg p-3 md:p-4">
                  <div className="text-xl md:text-2xl font-bold text-purple-400">10x</div>
                  <div className="text-xs md:text-sm text-gray-400">Faster Creation</div>
                </div>
              </div>
              
              {/* UPDATED CTA Buttons - Start Creating Today goes to trial */}
              <div className="flex flex-col sm:flex-row gap-3 md:gap-4 animate-fade-in-up animation-delay-600">
                <Link to="/signup?mode=trial" className={`px-6 md:px-8 py-3 md:py-4 rounded-full ${themeStyles.button} text-white font-medium text-center shadow-lg shadow-purple-500/20 hover:shadow-xl hover:shadow-purple-500/30 transition-all text-base md:text-lg`}>
                  Start Creating Today
                </Link>
                <button 
                  onClick={() => setShowDemoVideo(true)}
                  className={`px-6 md:px-8 py-3 md:py-4 rounded-full ${themeStyles.buttonSecondary} transition-colors text-center group text-base md:text-lg`}
                >
                  <span className="inline-flex items-center">
                    <Play className="mr-2 w-4 md:w-5 h-4 md:h-5 group-hover:scale-110 transition-transform" />
                    Watch Demo
                  </span>
                </button>
              </div>

              {/* Trust indicators - Hidden on mobile to reduce clutter */}
              <div className="hidden md:block mt-8 text-sm text-gray-400 animate-fade-in-up animation-delay-700">
              </div>
            </div>
          
            
            {/* Right side - Before/After Transformation Showcase - Reduced height on mobile */}
            <div className="relative h-[60vh] md:h-[80vh] flex items-center justify-center animate-fade-in-up animation-delay-800">
              <div className="relative w-full h-full max-w-2xl">
                {/* Glowing background effect */}
                <div className={`absolute -inset-8 bg-gradient-to-r from-purple-500/30 via-violet-500/30 to-indigo-500/30 rounded-3xl blur-2xl opacity-60 ${themeStyles.glow}`}></div>
                
                {/* Main transformation container */}
                <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl border border-gray-700/50 backdrop-blur-sm bg-black/20">
                  {/* Phase indicator - Show different indicators based on transformation type */}
                  {transformations[activeTransformation].hasReference && (
                    <div className="absolute top-3 md:top-6 left-3 md:left-6 z-20 flex items-center space-x-2 md:space-x-3">
                      <div className={`px-2 md:px-4 py-1 md:py-2 rounded-full text-xs md:text-sm font-bold transition-all ${
                        transformationPhase === 'before' 
                          ? 'bg-blue-600/80 text-white border-2 border-blue-400 shadow-lg shadow-blue-500/50' 
                          : 'bg-gray-800/80 text-gray-300 border border-gray-600'
                      }`}>
                        Original
                      </div>
                      
                      {/* Only show Reference step for transformations that actually have a reference image */}
                      {(transformations[activeTransformation].title.includes('Curology') || 
                        transformations[activeTransformation].title.includes('Givenchy') || 
                        transformations[activeTransformation].title.includes('iPhone')) && (
                        <>
                          <div className="w-4 md:w-8 h-0.5 bg-gray-600 relative overflow-hidden">
                            <div className={`absolute inset-0 bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-1000 ${
                              transformationPhase === 'before' ? 'w-0' : 
                              transformationPhase === 'transition' ? 'w-1/2' : 'w-full'
                            }`}></div>
                          </div>
                          <div className={`px-2 md:px-4 py-1 md:py-2 rounded-full text-xs md:text-sm font-bold transition-all ${
                            transformationPhase === 'transition' 
                              ? 'bg-yellow-600/80 text-white border-2 border-yellow-400 shadow-lg shadow-yellow-500/50' 
                              : 'bg-gray-800/80 text-gray-300 border border-gray-600'
                          }`}>
                            Reference
                          </div>
                        </>
                      )}
                      
                      <div className="w-4 md:w-8 h-0.5 bg-gray-600 relative overflow-hidden">
                        <div className={`absolute inset-0 bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-1000 ${
                          transformationPhase === 'after' ? 'w-full' : 
                          (transformations[activeTransformation].title.includes('YSL') || 
                           transformations[activeTransformation].title.includes('Versace') ||
                           transformations[activeTransformation].title.includes('The Ordinary')) && transformationPhase === 'transition' ? 'w-1/2' : 'w-0'
                        }`}></div>
                      </div>
                      <div className={`px-2 md:px-4 py-1 md:py-2 rounded-full text-xs md:text-sm font-bold transition-all ${
                        transformationPhase === 'after' 
                          ? 'bg-green-600/80 text-white border-2 border-green-400 shadow-lg shadow-green-500/50' 
                          : 'bg-gray-800/80 text-gray-300 border border-gray-600'
                      }`}>
                        Results
                      </div>
                    </div>
                  )}

                  {/* Transformation display */}
                  <div className="relative w-full h-full">
                    {transformations.map((transformation, index) => (
                      <div 
                        key={index}
                        className={`absolute inset-0 transition-all duration-1000 ${
                          activeTransformation === index 
                            ? 'opacity-100 z-10 scale-100' 
                            : 'opacity-0 z-0 scale-105'
                        }`}
                      >
                        {/* Before phase - Only show if has reference */}
                        {transformation.hasReference ? (
                          <div className={`absolute inset-0 transition-all duration-1000 ${
                            transformationPhase === 'before' ? 'opacity-100' : 'opacity-0'
                          }`}>
                            <img 
                              src={transformation.before.src} 
                              alt={transformation.before.alt}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                console.error(`Failed to load image: ${transformation.before.src}`);
                                e.target.style.display = 'none';
                              }}
                              onLoad={() => console.log(`Loaded: ${transformation.before.alt}`)}
                            />
                            <div className="absolute bottom-3 md:bottom-6 left-3 md:left-6 right-3 md:right-6">
                              <p className="text-white font-medium text-sm md:text-lg bg-black/60 backdrop-blur-sm rounded-lg px-3 md:px-4 py-2">
                                📷 Original: {transformation.before.alt}
                              </p>
                            </div>
                          </div>
                        ) : (
                          // For standalone ads, show the result in all phases
                          <div className={`absolute inset-0 transition-all duration-1000 ${
                            transformationPhase === 'before' ? 'opacity-100' : 'opacity-0'
                          }`}>
                            {transformation.before.type === 'video' ? (
                              <video
                                ref={el => videoRefs.current[`before-${index}`] = el}
                                src={transformation.before.src}
                                loop
                                muted
                                playsInline
                                preload="metadata"
                                className="w-full h-full object-cover"
                                onLoadedData={() => console.log(`Video loaded: ${transformation.before.alt}`)}
                              />
                            ) : (
                              <img 
                                src={transformation.before.src} 
                                alt={transformation.before.alt}
                                className="w-full h-full object-cover"
                              />
                            )}
                            {transformation.hasReference && (
                              <div className="absolute bottom-3 md:bottom-6 left-3 md:left-6 right-3 md:right-6">
                                <div className="bg-black/60 backdrop-blur-sm rounded-lg px-3 md:px-4 py-3">
                                  <p className="text-white font-medium text-sm md:text-lg mb-1">
                                    ✨ {transformation.title}
                                  </p>
                                  <p className="text-purple-300 text-xs md:text-sm">
                                    {transformation.category}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Transition phase - Only show if has reference */}
                        {transformation.hasReference ? (
                          <div className={`absolute inset-0 transition-all duration-500 ${
                            transformationPhase === 'transition' ? 'opacity-100' : 'opacity-0'
                          }`}>
                            <img 
                              src={transformation.during.src} 
                              alt={transformation.during.alt}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                console.error(`Failed to load during image: ${transformation.during.src}`);
                                e.target.style.display = 'none';
                              }}
                              onLoad={() => console.log(`Loaded during: ${transformation.during.alt}`)}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                            <div className="absolute bottom-3 md:bottom-6 left-3 md:left-6 right-3 md:right-6">
                              <p className="text-white font-medium text-sm md:text-lg bg-black/60 backdrop-blur-sm rounded-lg px-3 md:px-4 py-2">
                                🎨 Reference: {transformation.during.alt}
                              </p>
                            </div>
                          </div>
                        ) : (
                          // For standalone ads, show the result in all phases
                          <div className={`absolute inset-0 transition-all duration-500 ${
                            transformationPhase === 'transition' ? 'opacity-100' : 'opacity-0'
                          }`}>
                            {transformation.during.type === 'video' ? (
                              <video
                                ref={el => videoRefs.current[`during-${index}`] = el}
                                src={transformation.during.src}
                                loop
                                muted
                                playsInline
                                preload="auto"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <img 
                                src={transformation.during.src} 
                                alt={transformation.during.alt}
                                className="w-full h-full object-cover"
                              />
                            )}
                            {transformation.hasReference && (
                              <div className="absolute bottom-3 md:bottom-6 left-3 md:left-6 right-3 md:right-6">
                                <div className="bg-black/60 backdrop-blur-sm rounded-lg px-3 md:px-4 py-3">
                                  <p className="text-white font-medium text-sm md:text-lg mb-1">
                                    ✨ {transformation.title}
                                  </p>
                                  <p className="text-purple-300 text-xs md:text-sm">
                                    {transformation.category}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* After phase - Results for all */}
                        <div className={`absolute inset-0 transition-all duration-1000 ${
                          transformationPhase === 'after' ? 'opacity-100' : 'opacity-0'
                        }`}>
                          {transformation.after.type === 'video' ? (
                            <div className="relative w-full h-full">
                              <video
                                ref={el => videoRefs.current[`after-${index}`] = el}
                                src={transformation.after.src}
                                loop
                                muted
                                playsInline
                                preload="auto"
                                className="w-full h-full object-cover"
                                onLoadedData={() => {
                                  setVideoLoaded(prev => ({ ...prev, [`after-${index}`]: true }));
                                  console.log(`Video loaded: ${transformation.after.alt}`);
                                }}
                                onError={(e) => {
                                  console.error(`Video error: ${transformation.after.src}`, e);
                                  setVideoLoaded(prev => ({ ...prev, [`after-${index}`]: false }));
                                }}
                              />
                            </div>
                          ) : (
                            <img 
                              src={transformation.after.src} 
                              alt={transformation.after.alt}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                console.error(`Failed to load image: ${transformation.after.src}`);
                              }}
                            />
                          )}
                          <div className="absolute bottom-3 md:bottom-6 left-3 md:left-6 right-3 md:right-6">
                            <div className="bg-black/60 backdrop-blur-sm rounded-lg px-3 md:px-4 py-3">
                              <p className="text-white font-medium text-sm md:text-lg mb-1">
                                {transformation.hasReference ? '✨ Results: ' : '✨ '}{transformation.title}
                              </p>
                              <p className="text-purple-300 text-xs md:text-sm">
                                {transformation.category}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Transformation selector dots */}
                <div className="absolute -bottom-8 md:-bottom-12 left-0 right-0 flex justify-center space-x-2">
                  {transformations.map((transformation, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setActiveTransformation(index);
                        setTransformationPhase('before');
                      }}
                      className={`h-2 md:h-3 rounded-full transition-all relative ${
                        activeTransformation === index 
                          ? 'bg-gradient-to-r from-purple-500 to-indigo-500 w-8 md:w-12' 
                          : 'bg-gray-600 w-2 md:w-3 hover:bg-gray-500'
                      }`}
                      aria-label={`View transformation ${index + 1}: ${transformation.title}`}
                    >
                      {activeTransformation === index && (
                        <div className={`absolute inset-0 rounded-full transition-all duration-500 ${
                          transformationPhase === 'before' ? 'bg-red-400/50' :
                          transformationPhase === 'transition' ? 'bg-yellow-400/50' :
                          'bg-green-400/50'
                        }`}></div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SCROLL INDICATOR */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex flex-col items-center animate-bounce z-30">
          <span className="text-sm text-gray-400 mb-2">Scroll to explore</span>
          <ArrowDown className="h-5 w-5 text-gray-400" />
        </div>
      </section>

      {/* SUCCESS METRICS SECTION */}
      <section className="py-16 bg-black/30 backdrop-blur-sm border-y border-gray-800/50 relative z-10">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {successMetrics.map((metric, index) => (
              <div key={index} className="text-center animate-fade-in-up" style={{ animationDelay: `${index * 100}ms` }}>
                <div className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-400 mb-2">
                  {metric.number}
                </div>
                <div className="font-semibold text-white mb-1">{metric.label}</div>
                <div className="text-sm text-gray-400">{metric.description}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ENHANCED FEATURES SECTION WITH BUSINESS VALUE */}
      <section id="features" className={`py-32 relative z-10`}>
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 animate-fade-in-up">
              The World's First <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-400">End-to-End AI Ad Platform</span>
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-purple-500 to-indigo-600 mx-auto mb-6 rounded-full"></div>
            <p className={`text-lg ${themeStyles.textSecondary} leading-relaxed animate-fade-in-up animation-delay-200`}>
              From concept to campaign launch - image generation, video creation, voiceover, music, editing, and social publishing. All in one platform.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                className={`rounded-xl p-6 ${themeStyles.feature} transition-all duration-300 animate-fade-in-up hover:translate-y-[-5px] ${themeStyles.glow}`}
                style={{ animationDelay: `${200 + index * 100}ms` }}
                onMouseEnter={() => setHoveredFeature(index)}
                onMouseLeave={() => setHoveredFeature(null)}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className={`p-3 rounded-lg bg-gradient-to-br from-purple-500/20 to-indigo-600/20 text-purple-400`}>
                    {feature.icon}
                  </div>
                  {feature.highlight && (
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      feature.highlight === 'ROI' 
                        ? 'bg-green-500/20 text-green-400' 
                        : feature.highlight === 'SCALE' 
                        ? 'bg-blue-500/20 text-blue-400'
                        : feature.highlight === 'VISUAL' 
                        ? 'bg-orange-500/20 text-orange-400'
                        : feature.highlight === 'UNIQUE'
                        ? 'bg-amber-500/20 text-amber-400'
                        : feature.highlight === 'PROPRIETARY'
                        ? 'bg-purple-500/20 text-purple-400'
                        : 'bg-indigo-500/20 text-indigo-400'
                    }`}>
                      {feature.highlight}
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className={`${themeStyles.textSecondary} text-sm mb-3`}>{feature.description}</p>
                <div className="text-xs font-semibold text-green-400 bg-green-500/10 px-3 py-1 rounded-full inline-block">
                  {feature.valueProposition}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ENHANCED SHOWCASE SECTION */}
      <section id="showcase" className={`py-32 ${themeStyles.cardBg} relative z-10`}>
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 animate-fade-in-up">
              Studio-Quality Results, <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-400">AI-Generated</span>
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-purple-500 to-indigo-600 mx-auto mb-6 rounded-full"></div>
            <p className={`text-lg ${themeStyles.textSecondary} leading-relaxed animate-fade-in-up animation-delay-200`}>
              Every ad below was created in minutes using CF Studio. We use real-life products from home and fashion inspiration found online to showcase what's possible. No brand deals, no agencies, just AI and your imagination.
            </p>
          </div>
          
          <div className="mb-12 animate-fade-in-up animation-delay-400">
            <div className="max-w-4xl mx-auto text-center">
              <p className="text-gray-300 text-lg leading-relaxed">
                Professional-grade results from simple product photos and online inspiration
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {showcaseAds.map((ad, index) => (
              <div 
                key={index} 
                className={`overflow-hidden rounded-xl border ${themeStyles.border} group cursor-pointer hover:shadow-lg hover:shadow-purple-500/10 hover:border-purple-500/50 transition-all animate-fade-in-up backdrop-blur-sm ${themeStyles.glow}`}
                style={{ animationDelay: `${200 + index * 100}ms` }}
              >
                {ad.type === 'video' ? (
                  <div className="relative aspect-[16/9]" onClick={() => playVideo(ad.src)}>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-xl flex items-center justify-center transform group-hover:scale-105 transition-transform border border-white/20">
                        <Play className="h-8 w-8 text-white fill-white" />
                      </div>
                    </div>
                    <video 
                      src={ad.src}
                      className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                      muted
                      loop
                      playsInline
                      preload="metadata"
                      autoPlay={false}
                      onMouseOver={(e) => {
                        if (window.innerWidth > 768) {
                          e.target.play().catch(() => {});
                        }
                      }}
                      onMouseOut={(e) => {
                        if (window.innerWidth > 768) {
                          e.target.pause();
                        }
                      }}
                      onLoadedMetadata={(e) => {
                        e.target.currentTime = 0.1;
                      }}
                      onCanPlay={(e) => {
                        e.target.currentTime = 0.1;
                      }}
                      style={{
                        visibility: 'visible',
                        opacity: 1
                      }}
                    />
                  </div>
                ) : (
                  <div className="relative aspect-[16/9]">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <img 
                      src={ad.src} 
                      alt={ad.title} 
                      className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                    />
                  </div>
                )}
                <div className="p-6 relative">
                  <div className="flex justify-between items-center mb-3">
                    <span className="inline-block px-2 py-1 text-xs rounded-full bg-gray-800/80 text-gray-300">{ad.category}</span>
                  </div>
                  <h3 className="text-xl font-medium mb-2">{ad.title}</h3>
                  <p className={`text-sm ${themeStyles.textSecondary} flex items-center`}>
                    <span className="w-3 h-3 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 mr-2"></span>
                    Created with CF Studio in minutes
                  </p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-16 text-center animate-fade-in-up animation-delay-600">
            <Link to="/gallery" className={`inline-flex items-center px-8 py-4 rounded-full ${themeStyles.button} text-white font-medium hover:shadow-lg hover:shadow-purple-500/20 transition-all`}>
              <span>Explore full gallery</span>
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ENHANCED PRICING SECTION WITH BUSINESS VALUE */}
      <section id="pricing" className={`py-32 relative z-10`}>
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 animate-fade-in-up">
              Our <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-400">Pricing</span>
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-purple-500 to-indigo-600 mx-auto mb-6 rounded-full"></div>
            <p className={`text-lg ${themeStyles.textSecondary} leading-relaxed animate-fade-in-up animation-delay-200`}>
              Choose the plan that works for you. All plans include access to our complete AI ad creation platform.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {pricingTiers.map((tier, index) => (
              <div 
                key={index} 
                className={`rounded-2xl overflow-hidden transition-all duration-300 animate-fade-in-up hover:translate-y-[-5px] relative ${
                  tier.popular 
                    ? 'border-2 border-purple-500 ' + themeStyles.glow
                    : 'border border-gray-800/50'
                } ${themeStyles.cardBg}`}
                style={{ animationDelay: `${200 + index * 100}ms` }}
              >
                {tier.popular && (
                  <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-purple-600 to-indigo-600 text-center py-1.5 text-white text-xs font-semibold">
                    MOST POPULAR
                  </div>
                )}
                <div className={`p-8 ${tier.popular ? 'pt-12' : ''}`}>
                  <h3 className="text-2xl font-semibold mb-2">{tier.name}</h3>
                  <div className="mt-4 mb-4">
                    <span className="text-4xl font-bold">{tier.price}</span>
                    <span className="text-gray-400 ml-2">{tier.period}</span>
                  </div>
                  <div className="bg-blue-500/10 text-blue-400 text-sm font-semibold px-3 py-2 rounded-lg mb-6">
                    {tier.savings}
                  </div>
                  <ul className="space-y-4 mb-8">
                    {tier.features.map((feature, i) => (
                      <li key={i} className="flex items-start">
                        <Check className="w-5 h-5 text-purple-400 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link 
                    to={tier.cta === "Contact Sales" ? "/contact" : "/signup"}
                    className={`block w-full py-3 rounded-full text-center font-medium transition-all ${
                      tier.popular
                        ? themeStyles.button + ' text-white shadow-lg shadow-purple-500/20 hover:shadow-xl hover:shadow-purple-500/30'
                        : 'bg-gray-800 hover:bg-gray-700 text-white border border-gray-700'
                    }`}
                  >
                    {tier.cta}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* UPDATED CTA SECTION */}
      <section className="py-24 relative z-10">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto rounded-2xl overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-700 opacity-90"></div>
            <div className="absolute inset-0 bg-[url('noise.png')] opacity-10"></div>
            
            <div className="absolute top-0 left-0 w-64 h-64 bg-purple-500 rounded-full filter blur-3xl opacity-30 -translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-indigo-500 rounded-full filter blur-3xl opacity-30 translate-x-1/2 translate-y-1/2"></div>
            
            <div className="relative p-12 md:p-16 text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">Ready to Transform Your Ad Creation?</h2>
              <p className="text-purple-100 mb-8 max-w-2xl mx-auto">
                Start creating professional ads in minutes. No long-term contracts, cancel anytime.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {/* UPDATED: Start Creating Now goes to trial */}
                <Link to="/signup?mode=trial" className="px-8 py-4 rounded-full bg-white text-purple-700 font-medium hover:shadow-lg hover:shadow-purple-700/20 transition-all text-center">
                  Start Creating Now
                </Link>
                <button 
                  onClick={() => setShowDemoVideo(true)}
                  className="px-8 py-4 rounded-full border border-white/30 text-white hover:bg-white/10 transition-all text-center flex items-center justify-center"
                >
                  <Play className="mr-2 w-4 h-4" />
                  Watch Demo Video
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* UPDATED FOOTER */}
      <footer className={`pt-20 pb-8 border-t ${themeStyles.border} relative z-10`}>
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-16">
            <div>
              <div className="flex items-center mb-4">
                <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-400">CF Studio</div>
                <div className="ml-3 px-3 py-1 text-xs font-bold rounded-full bg-gradient-to-r from-purple-500/20 to-indigo-500/20 text-purple-300 border border-purple-500/30">BETA</div>
              </div>
              <p className="text-gray-400 mb-4">
                The complete AI platform for turning product photos into professional ads.
              </p>
              <div className="flex space-x-4">
                {['twitter', 'facebook', 'instagram', 'linkedin'].map((social, i) => (
                  <a href="#" key={i} className="text-gray-400 hover:text-purple-400 transition-colors">
                    <span className="sr-only">{social}</span>
                    <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path fillRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 1.5a8.5 8.5 0 100 17 8.5 8.5 0 000-17z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </a>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold text-lg mb-4">Product</h3>
              <ul className="space-y-3">
                <li>
                  <button 
                    onClick={() => scrollToSection('features')}
                    className="text-gray-400 hover:text-purple-400 transition-colors"
                  >
                    Features
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => scrollToSection('pricing')}
                    className="text-gray-400 hover:text-purple-400 transition-colors"
                  >
                    Pricing
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => setShowDemoVideo(true)}
                    className="text-gray-400 hover:text-purple-400 transition-colors"
                  >
                    Demo
                  </button>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-lg mb-4">Company</h3>
              <ul className="space-y-3">
                <li><Link to="/about" className="text-gray-400 hover:text-purple-400 transition-colors">About</Link></li>
                <li><Link to="/contact" className="text-gray-400 hover:text-purple-400 transition-colors">Contact</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-lg mb-4">Documentation</h3>
              <ul className="space-y-3">
                <li><Link to="/privacy-policy" className="text-gray-400 hover:text-purple-400 transition-colors">Privacy Policy</Link></li>
                <li><Link to="/terms-of-service" className="text-gray-400 hover:text-purple-400 transition-colors">Terms of Service</Link></li>
                <li><Link to="/cookie-policy" className="text-gray-400 hover:text-purple-400 transition-colors">Cookie Policy</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-500">© 2025 CF Studio. All rights reserved.</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <span className="text-sm text-gray-500">Transforming businesses worldwide</span>
            </div>
          </div>
        </div>
      </footer>

      {/* VIDEO MODAL - UPDATED WITH CLOSE BUTTON */}
      {showVideoModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md transition-all"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowVideoModal(false);
              setCurrentVideo(null);
            }
          }}
        >
          <div className="relative w-full max-w-5xl mx-4">
            <button
              onClick={() => {
                setShowVideoModal(false);
                setCurrentVideo(null);
              }}
              className="absolute -top-12 right-0 z-60 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 transition-all flex items-center justify-center"
              aria-label="Close video"
            >
              <XCircle className="w-6 h-6" />
            </button>
            
            <div className="aspect-video bg-black rounded-lg overflow-hidden border border-gray-800/50 shadow-2xl">
              <video 
                src={currentVideo}
                controls
                autoPlay
                className="w-full h-full object-contain"
                onError={() => {
                  console.error('Video failed to load:', currentVideo);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* SCROLL TO TOP BUTTON */}
      <button 
        onClick={scrollToTop}
        className={`fixed bottom-8 right-8 p-3 rounded-full ${themeStyles.button} text-white shadow-lg transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/30 z-40`}
        aria-label="Scroll to top"
        style={{ display: isScrolled ? 'block' : 'none' }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
      </button>

      <style>{`
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
        
        .animation-delay-800 {
          animation-delay: 0.8s;
        }
        
        .duration-3000 {
          transition-duration: 3000ms;
        }

        /* Optimized video performance */
        video {
          backface-visibility: hidden;
          perspective: 1000px;
          transform: translate3d(0, 0, 0);
        }
        
        @media (max-width: 768px) {
          video {
            will-change: auto;
            transform: translateZ(0);
          }
          
          .animate-fade-in-up {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
};

export default HomeDashboard; 