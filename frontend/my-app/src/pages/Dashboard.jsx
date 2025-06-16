import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Play, Image, Mic, Music, Edit, Share, ChevronRight, BarChart3, Check, ArrowRight, 
         Star, XCircle, Shield, Sparkles, Globe, Clock, Film, Zap } from 'lucide-react';

// Imported assets
import waterad from "../assets/water ad.webp";
import fendiad from "../assets/fendiadCf.mp4";
import perfume from "../assets/perfume.jpg";
import curology from "../assets/cfcurologyad.mp4";
import givenchy from "../assets/givenchyadCF.mp4";
import adForCf1 from "../assets/AdForCf1.mp4";
import adForCf4 from "../assets/AdForCf4.mp4";
import skincare from "../assets/skincare.jpeg";
import phone from "../assets/phonead.jpg";
import CFDemoUse from "../assets/CFDemoUse.mp4";

import DemoVideo from "../components/DemoVideo.jsx";

const HomeDashboard = () => {
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [currentVideo, setCurrentVideo] = useState(null);
  const [showDemoVideo, setShowDemoVideo] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [videoLoaded, setVideoLoaded] = useState({});
  const [hoveredFeature, setHoveredFeature] = useState(null);
  const [activeSection, setActiveSection] = useState('hero');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const videoRefs = useRef({});
  const sectionRefs = useRef({});
  const observerRef = useRef(null);
  
  const heroMedia = [
    { type: 'video', src: adForCf4, alt: 'CF Ad 4' },
    { type: 'video', src: givenchy, alt: 'Givenchy Campaign' },
    { type: 'video', src: adForCf1, alt: 'CF Ad 1' },
    { type: 'video', src: fendiad, alt: 'Fendi Luxury Campaign' },
    { type: 'video', src: curology, alt: 'Curology Ad' },
    { type: 'image', src: waterad, alt: 'Water Ad Campaign' },
    { type: 'image', src: skincare, alt: 'Skincare Campaign' },
  ];

  const themeStyles = {
    bg: "bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950",
    text: "text-white",
    textSecondary: "text-gray-300",
    cardBg: "bg-gray-900/70 backdrop-blur-md",
    navBg: isScrolled ? "bg-gray-900/80 backdrop-blur-lg border-b border-gray-800/50" : "bg-transparent",
    button: "bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700",
    buttonSecondary: "bg-gray-800/70 backdrop-blur-sm hover:bg-gray-700/70",
    accent: "text-violet-400",
    border: "border-gray-800/50",
    input: "bg-gray-800/70 backdrop-blur-sm border-gray-700/50",
    highlight: "bg-gradient-to-r from-indigo-500/10 to-violet-600/10",
    glow: "shadow-[0_0_35px_rgba(124,58,237,0.2)]",
    feature: "border border-gray-800/30 bg-gray-900/50 backdrop-blur-md hover:border-violet-500/50 hover:bg-gray-900/70"
  };

  const sections = ['hero', 'features', 'showcase', 'pricing'];

  const features = [
    {
      icon: <Film className="w-6 h-6" />,
      title: "End-to-End AI Workflow",
      description: "First platform to offer complete ad creation from concept to final output with revolutionary keyframes technology",
      highlight: "REVOLUTIONARY"
    },
    {
      icon: <Sparkles className="w-6 h-6" />,
      title: "Reference Style Transfer",
      description: "Upload any ad style you love and our AI applies that exact aesthetic to your product instantly",
      highlight: "UNIQUE"
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Keyframes Technology",
      description: "Define camera angles, transitions, and scenes with unprecedented control over your video narrative",
      highlight: "PROPRIETARY"
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: "Minutes, Not Weeks",
      description: "What used to take expensive photoshoots and weeks of editing now happens in minutes",
      highlight: null
    },
    {
      icon: <Globe className="w-6 h-6" />,
      title: "Phone to Professional",
      description: "Start with any product photo and transform it into studio-quality ad creative instantly",
      highlight: null
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "AI-Powered Iteration",
      description: "Seamlessly refine backgrounds, lighting, and composition with intelligent editing tools",
      highlight: "SMART"
    }
  ];

  const showcaseAds = [
    { type: 'video', src: adForCf4, title: 'Premium Product Launch', category: 'Fashion' },
    { type: 'video', src: fendiad, title: 'Fendi Luxury Campaign', category: 'Luxury' },
    { type: 'video', src: adForCf1, title: 'Brand Storytelling', category: 'Lifestyle' },
    { type: 'video', src: givenchy, title: 'Givenchy Elegance', category: 'Beauty' },
    { type: 'video', src: curology, title: 'Curology Skincare Video', category: 'Beauty' },
    { type: 'image', src: waterad, title: 'Water Brand Campaign', category: 'Lifestyle' },
    { type: 'image', src: skincare, title: 'Premium Skincare Line', category: 'Beauty' },
    { type: 'image', src: phone, title: 'Phone Advertisement', category: 'Technology' }
  ];

  const pricingTiers = [
    {
      name: "Basic",
      price: "$99",
      period: "per month",
      features: [
        "10 generations per month",
        "Image, Video, Text & Voice AI",
        "Standard quality output",
        "Basic support",
        "Core features access"
      ],
      cta: "Start Creating",
      popular: false
    },
    {
      name: "Premium",
      price: "$179",
      period: "per month",
      features: [
        "40 generations per month",
        "Advanced editing tools",
        "4K upscale (coming soon)",
        "Social media analytics (coming soon)",
        "Priority support",
        "All AI features"
      ],
      cta: "Go Premium",
      popular: true
    },
    {
      name: "Enterprise",
      price: "$299",
      period: "per month",
      features: [
        "Unlimited generations",
        "Team access (coming soon)",
        "White labeling (coming soon)",
        "Advanced analytics",
        "Dedicated support",
        "API access"
      ],
      cta: "Contact Sales",
      popular: false
    }
  ];

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
    const loadVideos = () => {
      heroMedia.forEach((media, index) => {
        if (media.type === 'video') {
          if (videoRefs.current[index]) {
            const video = videoRefs.current[index];
            
            if (video.getAttribute('data-loaded') === 'true') return;
            video.setAttribute('data-loaded', 'true');
            
            video.addEventListener('loadstart', () => {
              console.log(`Loading ${media.alt}...`);
            });
            
            video.addEventListener('error', (e) => {
              console.error(`Error loading ${media.alt}:`, e);
              setVideoLoaded(prev => ({ ...prev, [index]: false }));
            });
            
            video.load();
            video.onloadeddata = () => {
              setVideoLoaded(prev => ({ ...prev, [index]: true }));
              console.log(`${media.alt} loaded successfully`);
            };
          }
        }
      });
    };
    
    loadVideos();
    
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % heroMedia.length);
    }, 8000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    heroMedia.forEach((media, index) => {
      if (media.type === 'video' && videoRefs.current[index]) {
        if (index === activeSlide) {
          videoRefs.current[index].play().catch(() => {});
        } else {
          videoRefs.current[index].pause();
        }
      }
    });
  }, [activeSlide]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (mobileMenuOpen && !event.target.closest('nav')) {
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [mobileMenuOpen]);

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
  };

  return (
    <div className={`min-h-screen ${themeStyles.bg} ${themeStyles.text} font-sans relative`}>
      <DemoVideo 
        isOpen={showDemoVideo}
        onClose={() => setShowDemoVideo(false)}
        title="CF Studio Tutorial"
        description="Complete walkthrough of our AI marketing tools and features"
        videoUrl={CFDemoUse}
      />

      <div className="fixed inset-0 overflow-hidden z-0">
        <div className="absolute top-0 -left-40 w-96 h-96 bg-indigo-700/20 rounded-full filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute top-1/3 -right-20 w-96 h-96 bg-violet-700/20 rounded-full filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-96 h-96 bg-fuchsia-700/20 rounded-full filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <nav className={`fixed w-full z-50 transition-all duration-300 ${themeStyles.navBg} ${isScrolled ? 'py-3' : 'py-5'}`}>
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center">
            <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-violet-500">CF Studio</div>
            <div className="ml-3 px-3 py-1 text-xs font-bold rounded-full bg-gradient-to-r from-indigo-500/20 to-violet-600/20 text-indigo-300 border border-indigo-500/30">BETA</div>
          </div>
          <div className="hidden md:flex items-center space-x-8">
            {['features', 'showcase', 'pricing'].map((section) => (
              <button 
                key={section}
                onClick={() => scrollToSection(section)}
                className={`hover:text-indigo-400 transition-colors relative ${activeSection === section ? 'text-indigo-400' : ''}`}
              >
                {section.charAt(0).toUpperCase() + section.slice(1)}
                {activeSection === section && (
                  <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full"></span>
                )}
              </button>
            ))}
            <Link to="/about" className="hover:text-indigo-400 transition-colors">About</Link>
            <Link to="/contact" className="hover:text-indigo-400 transition-colors">Contact</Link>
            <Link to="/login" className="hover:text-indigo-400 transition-colors">Login</Link>
            <Link to="/signup" className={`px-5 py-2.5 rounded-full ${themeStyles.button} text-white font-medium shadow-lg shadow-violet-500/20 transition-all hover:shadow-xl hover:shadow-violet-500/30`}>
              Get Started Now
            </Link>
          </div>
          <button 
            className="md:hidden p-2" 
            aria-label="Menu"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        <div className={`md:hidden transition-all duration-300 ease-in-out ${
          mobileMenuOpen 
            ? 'max-h-96 opacity-100' 
            : 'max-h-0 opacity-0 overflow-hidden'
        } ${themeStyles.cardBg} border-t ${themeStyles.border}`}>
          <div className="px-6 py-4 space-y-4">
            {['features', 'showcase', 'pricing'].map((section) => (
              <button 
                key={section}
                onClick={() => {
                  scrollToSection(section);
                  setMobileMenuOpen(false);
                }}
                className={`block w-full text-left hover:text-indigo-400 transition-colors py-2 ${
                  activeSection === section ? 'text-indigo-400' : ''
                }`}
              >
                {section.charAt(0).toUpperCase() + section.slice(1)}
              </button>
            ))}
            <Link 
              to="/about" 
              className="block hover:text-indigo-400 transition-colors py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              About
            </Link>
            <Link 
              to="/contact" 
              className="block hover:text-indigo-400 transition-colors py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Contact
            </Link>
            <Link 
              to="/login" 
              className="block hover:text-indigo-400 transition-colors py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Login
            </Link>
            <Link 
              to="/signup" 
              className={`block px-5 py-2.5 rounded-full ${themeStyles.button} text-white font-medium text-center mt-4`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Get Started Now
            </Link>
          </div>
        </div>
      </nav>

      <section id="hero" className="relative min-h-screen flex items-center">
        <div className="absolute inset-0 z-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-gray-900/90 via-gray-900/80 to-gray-900/60 z-10"></div>
        </div>
        <div className="container mx-auto px-6 z-10 pt-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="max-w-md lg:max-w-lg">
              <div className="mb-6">
                <span className="inline-block px-3 py-1 text-sm rounded-full bg-gradient-to-r from-indigo-500/20 to-violet-600/20 text-indigo-300 mb-4 animate-fade-in-up">
                  <span className="flex items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mr-2 animate-pulse"></span>
                    Revolutionary AI Platform
                  </span>
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight tracking-tight animate-fade-in-up animation-delay-200">
                From Photo to <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-violet-500">Professional Ad</span> in Minutes
              </h1>
              <p className="text-lg mb-8 opacity-90 leading-relaxed animate-fade-in-up animation-delay-400">
                Upload any product photo and create studio-quality ads with AI. video,images, voice - all in one platform.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 animate-fade-in-up animation-delay-600">
                <Link to="/signup" className={`px-6 py-3.5 rounded-full ${themeStyles.button} text-white font-medium text-center shadow-lg shadow-violet-500/20 hover:shadow-xl hover:shadow-violet-500/30 transition-all`}>
                  Start Creating Today
                </Link>
                <button 
                  onClick={() => setShowDemoVideo(true)}
                  className={`px-6 py-3.5 rounded-full border ${themeStyles.border} hover:bg-gray-800/30 transition-colors text-center group`}
                >
                  <span className="inline-flex items-center">
                    <Play className="mr-2 w-4 h-4 group-hover:scale-110 transition-transform" />
                    Watch Demo
                  </span>
                </button>
              </div>
            </div>
            
            <div className="relative h-[75vh] flex items-center justify-center lg:justify-end animate-fade-in-up animation-delay-600">
              <div className="relative w-full h-full max-w-3xl">
                <div className={`absolute -inset-4 bg-gradient-to-r from-indigo-500/20 to-violet-600/20 rounded-2xl blur-xl opacity-70 ${themeStyles.glow}`}></div>
                
                <div className="relative w-full h-full rounded-xl overflow-hidden shadow-2xl border border-gray-800/50 backdrop-blur-sm">
                  {heroMedia.map((media, index) => (
                    <div 
                      key={index}
                      className={`absolute inset-0 transition-all duration-1000 ${
                        activeSlide === index 
                          ? 'opacity-100 z-10 scale-100' 
                          : 'opacity-0 z-0 scale-105'
                      }`}
                    >
                      {media.type === 'video' ? (
                        <>
                          {!videoLoaded[index] && (
                            <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                              <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                          )}
                          <video
                            ref={el => videoRefs.current[index] = el}
                            src={media.src}
                            loop
                            muted
                            playsInline
                            preload="metadata"
                            className={`w-full h-full ${
                              media.src === fendiad ? 'object-contain bg-black' : 'object-cover'
                            }`}
                          />
                        </>
                      ) : (
                        <img 
                          src={media.src} 
                          alt={media.alt} 
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                  ))}
                </div>
                
                <div className="absolute -bottom-10 left-0 right-0 flex justify-center space-x-2">
                  {heroMedia.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setActiveSlide(index)}
                      className={`h-2 rounded-full transition-all ${
                        activeSlide === index 
                          ? 'bg-gradient-to-r from-indigo-500 to-violet-600 w-10' 
                          : 'bg-gray-600 w-2 hover:bg-gray-500'
                      }`}
                      aria-label={`Go to slide ${index + 1}`}
                    />
                  ))}
                </div>
                
                <button 
                  onClick={() => setActiveSlide((prev) => (prev === 0 ? heroMedia.length - 1 : prev - 1))}
                  className="absolute top-1/2 left-4 transform -translate-y-1/2 p-3 rounded-full bg-black/30 backdrop-blur-md text-white hover:bg-black/50 transition-all border border-white/10"
                  aria-label="Previous slide"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button 
                  onClick={() => setActiveSlide((prev) => (prev + 1) % heroMedia.length)}
                  className="absolute top-1/2 right-4 transform -translate-y-1/2 p-3 rounded-full bg-black/30 backdrop-blur-md text-white hover:bg-black/50 transition-all border border-white/10"
                  aria-label="Next slide"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                
                <div className="absolute top-4 right-4 px-4 py-1.5 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs font-medium flex items-center space-x-2 shadow-lg border border-white/10">
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
                  <span>Created with CF Studio</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex flex-col items-center animate-bounce">
          <span className="text-sm text-gray-400 mb-2">Scroll to explore</span>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </section>

      <section id="features" className={`py-32 relative z-10`}>
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 animate-fade-in-up">
              Revolutionary <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-violet-500">AI Technology</span>
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-indigo-500 to-violet-600 mx-auto mb-6 rounded-full"></div>
            <p className={`text-lg ${themeStyles.textSecondary} leading-relaxed animate-fade-in-up animation-delay-200`}>
              Complete ad creation workflow with proprietary keyframes technology, voice generation, and copy creation.
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
                  <div className={`p-3 rounded-lg bg-gradient-to-br from-indigo-500/20 to-violet-600/20 text-indigo-400`}>
                    {feature.icon}
                  </div>
                  {feature.highlight && (
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      feature.highlight === 'REVOLUTIONARY' 
                        ? 'bg-red-500/20 text-red-400' 
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
                <p className={`${themeStyles.textSecondary} text-sm`}>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="showcase" className={`py-32 ${themeStyles.cardBg} relative z-10`}>
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 animate-fade-in-up">
              Studio-Quality Results, <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-violet-500">AI-Generated</span>
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-indigo-500 to-violet-600 mx-auto mb-6 rounded-full"></div>
            <p className={`text-lg ${themeStyles.textSecondary} leading-relaxed animate-fade-in-up animation-delay-200`}>
              Every ad below was created in minutes using CF Studio. No expensive shoots, no weeks of editing.
            </p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-3 mb-12 animate-fade-in-up animation-delay-400">
            {['All', 'Fashion', 'Beauty', 'Luxury', 'Lifestyle', 'Technology'].map((category, index) => (
              <button 
                key={index}
                className={`px-4 py-2 rounded-full text-sm transition-all ${
                  index === 0 
                    ? 'bg-gradient-to-r from-indigo-500 to-violet-600 text-white' 
                    : 'bg-gray-800/50 backdrop-blur-sm text-gray-300 hover:bg-gray-700/50'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {showcaseAds.map((ad, index) => (
              <div 
                key={index} 
                className={`overflow-hidden rounded-xl border ${themeStyles.border} group cursor-pointer hover:shadow-lg hover:shadow-violet-500/10 hover:border-violet-500/50 transition-all animate-fade-in-up backdrop-blur-sm ${themeStyles.glow}`}
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
                      className={`w-full h-full transform group-hover:scale-105 transition-transform duration-700 ${
                        ad.src === fendiad ? 'object-contain bg-black' : 'object-cover'
                      }`}
                      muted
                      loop
                      playsInline
                      preload="auto"
                      onMouseOver={(e) => e.target.play().catch(() => {})}
                      onMouseOut={(e) => e.target.pause()}
                      onCanPlay={(e) => {
                        e.target.currentTime = 0.5;
                      }}
                      style={{
                        backgroundImage: `url(${ad.src})`,
                        backgroundSize: ad.src === fendiad ? 'contain' : 'cover',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat'
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
                  <span className="inline-block px-2 py-1 text-xs rounded-full bg-gray-800/80 text-gray-300 mb-3">{ad.category}</span>
                  <h3 className="text-xl font-medium mb-2">{ad.title}</h3>
                  <p className={`text-sm ${themeStyles.textSecondary} flex items-center`}>
                    <span className="w-3 h-3 rounded-full bg-gradient-to-r from-indigo-500 to-violet-600 mr-2"></span>
                    Created with CF Studio in minutes
                  </p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-16 text-center animate-fade-in-up animation-delay-600">
            <Link to="/gallery" className={`inline-flex items-center px-8 py-4 rounded-full ${themeStyles.button} text-white font-medium hover:shadow-lg hover:shadow-violet-500/20 transition-all`}>
              <span>Explore full gallery</span>
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      <section id="pricing" className={`py-32 relative z-10`}>
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 animate-fade-in-up">
              Simple <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-violet-500">Pricing Plans</span>
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-indigo-500 to-violet-600 mx-auto mb-6 rounded-full"></div>
            <p className={`text-lg ${themeStyles.textSecondary} leading-relaxed animate-fade-in-up animation-delay-200`}>
              Start creating professional ads today. Scale as you grow.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {pricingTiers.map((tier, index) => (
              <div 
                key={index} 
                className={`rounded-2xl overflow-hidden transition-all duration-300 animate-fade-in-up hover:translate-y-[-5px] relative ${
                  tier.popular 
                    ? 'border-2 border-violet-500 ' + themeStyles.glow
                    : 'border border-gray-800/50'
                } ${themeStyles.cardBg}`}
                style={{ animationDelay: `${200 + index * 100}ms` }}
              >
                {tier.popular && (
                  <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-indigo-600 to-violet-600 text-center py-1.5 text-white text-xs font-semibold">
                    MOST POPULAR
                  </div>
                )}
                <div className={`p-8 ${tier.popular ? 'pt-12' : ''}`}>
                  <h3 className="text-2xl font-semibold mb-2">{tier.name}</h3>
                  <div className="mt-4 mb-6">
                    <span className="text-4xl font-bold">{tier.price}</span>
                    <span className="text-gray-400 ml-2">{tier.period}</span>
                  </div>
                  <ul className="space-y-4 mb-8">
                    {tier.features.map((feature, i) => (
                      <li key={i} className="flex items-start">
                        <Check className="w-5 h-5 text-indigo-400 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link 
                    to="/signup" 
                    className={`block w-full py-3 rounded-full text-center font-medium transition-all ${
                      tier.popular
                        ? themeStyles.button + ' text-white shadow-lg shadow-violet-500/20 hover:shadow-xl hover:shadow-violet-500/30'
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

      <section className="py-24 relative z-10">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto rounded-2xl overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-violet-700 opacity-90"></div>
            <div className="absolute inset-0 bg-[url('noise.png')] opacity-10"></div>
            
            <div className="absolute top-0 left-0 w-64 h-64 bg-indigo-500 rounded-full filter blur-3xl opacity-30 -translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-violet-500 rounded-full filter blur-3xl opacity-30 translate-x-1/2 translate-y-1/2"></div>
            
            <div className="relative p-12 md:p-16 text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">Ready to Transform Your Ad Creation?</h2>
              <p className="text-indigo-100 mb-8 max-w-2xl mx-auto">
                Join thousands of creators already using CF Studio to generate professional ads in minutes.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/signup" className="px-8 py-4 rounded-full bg-white text-indigo-700 font-medium hover:shadow-lg hover:shadow-indigo-700/20 transition-all text-center">
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

      <footer className={`pt-20 pb-8 border-t ${themeStyles.border} relative z-10`}>
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-16">
            <div>
              <div className="flex items-center mb-4">
                <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-violet-500">CF Studio</div>
                <div className="ml-3 px-3 py-1 text-xs font-bold rounded-full bg-gradient-to-r from-indigo-500/20 to-violet-600/20 text-indigo-300 border border-indigo-500/30">BETA</div>
              </div>
              <p className="text-gray-400 mb-4">
                The revolutionary AI platform for creating professional ads from any product photo.
              </p>
              <div className="flex space-x-4">
                {['twitter', 'facebook', 'instagram', 'linkedin'].map((social, i) => (
                  <a href="#" key={i} className="text-gray-400 hover:text-indigo-400 transition-colors">
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
                {['Features', 'Pricing', 'Demo'].map((item, i) => (
                  <li key={i}>
                    {item === 'Demo' ? (
                      <button 
                        onClick={() => setShowDemoVideo(true)}
                        className="text-gray-400 hover:text-indigo-400 transition-colors"
                      >
                        {item}
                      </button>
                    ) : (
                      <a href="#" className="text-gray-400 hover:text-indigo-400 transition-colors">{item}</a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-lg mb-4">Company</h3>
              <ul className="space-y-3">
                <li><Link to="/about" className="text-gray-400 hover:text-indigo-400 transition-colors">About</Link></li>
                <li><Link to="/contact" className="text-gray-400 hover:text-indigo-400 transition-colors">Contact</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-lg mb-4">Resources</h3>
              <ul className="space-y-3">
                {['Documentation', 'Help Center', 'Community'].map((item, i) => (
                  <li key={i}><a href="#" className="text-gray-400 hover:text-indigo-400 transition-colors">{item}</a></li>
                ))}
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-500">© 2025 CF Studio. All rights reserved.</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link to="/privacy-policy" className="text-sm text-gray-500 hover:text-indigo-400 transition-colors">Privacy Policy</Link>
              <Link to="/terms-of-service" className="text-sm text-gray-500 hover:text-indigo-400 transition-colors">Terms of Service</Link>
              <Link to="/cookie-policy" className="text-sm text-gray-500 hover:text-indigo-400 transition-colors">Cookie Policy</Link>
            </div>
          </div>
        </div>
      </footer>

      {showVideoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md transition-all">
          <div className="relative w-full max-w-5xl mx-4">
            <button 
              onClick={() => setShowVideoModal(false)}
              className="absolute -top-16 right-0 text-white hover:text-gray-300 transition-colors p-2"
              aria-label="Close video"
            >
              <XCircle className="h-8 w-8" />
            </button>
            <div className="aspect-video bg-black rounded-lg overflow-hidden border border-gray-800/50 shadow-2xl">
              <video 
                src={currentVideo}
                controls
                autoPlay
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </div>
      )}

      <button 
        onClick={scrollToTop}
        className={`fixed bottom-8 right-8 p-3 rounded-full ${themeStyles.button} text-white shadow-lg transition-all duration-300 hover:shadow-xl hover:shadow-violet-500/30 z-20 animate-pulse-slow`}
        aria-label="Scroll to top"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
      </button>

      <style>{`
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
        
        @keyframes pulse-slow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        
        .animate-blob {
          animation: blob 12s infinite ease-in-out;
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out forwards;
        }
        
        .animate-pulse-slow {
          animation: pulse-slow 3s infinite;
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
      `}</style>
    </div>
  );
};

export default HomeDashboard;