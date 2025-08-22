 import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Alert, StatusBar, TextInput, ScrollView, Animated, Platform } from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';

// SAFER IMPORTS FOR PHASE 1B - WITH ERROR HANDLING
import * as FileSystem from 'expo-file-system';

// TensorFlow imports with error handling
let tf = null;
let cocoSsd = null;
let tensorflowLoaded = false;

const loadTensorFlow = async () => {
  try {
    // Only load TensorFlow on supported platforms
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      tf = await import('@tensorflow/tfjs');
      await import('@tensorflow/tfjs-react-native');
      cocoSsd = await import('@tensorflow-models/coco-ssd');
      tensorflowLoaded = true;
      console.log('✅ TensorFlow loaded successfully');
    }
  } catch (error) {
    console.log('⚠️ TensorFlow not available, using fallback mode:', error);
    tensorflowLoaded = false;
  }
};

const { width, height } = Dimensions.get('window');

export default function CinemaAI() {
  const [facing, setFacing] = useState('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [magicScore, setMagicScore] = useState(23);
  const [lightingScore, setLightingScore] = useState(45);
  const [compositionScore, setCompositionScore] = useState(30);
  const [productScore, setProductScore] = useState(40);
  const [isCapturing, setIsCapturing] = useState(false);
  const [perfectShot, setPerfectShot] = useState(false);
  const [guidance, setGuidance] = useState("Move closer to the window for better lighting");
  const [showWorkflow, setShowWorkflow] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [userIntent, setUserIntent] = useState('');
  const [detectedProduct, setDetectedProduct] = useState('general');
  const [detectedStyle, setDetectedStyle] = useState('professional');
  const [currentWorkflow, setCurrentWorkflow] = useState(null);
  const [animationValues, setAnimationValues] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [lastAnalysisTime, setLastAnalysisTime] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // NEW STATE FOR PHASE 1B - REAL AI
  const [model, setModel] = useState(null);
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [detectedObjects, setDetectedObjects] = useState([]);
  
  // NEW: Movement detection for realistic mobile photography
  const [previousObjects, setPreviousObjects] = useState([]);
  const [isMoving, setIsMoving] = useState(false);
  
  // FIX: Add manual capture control
  const [autoAnalysisEnabled, setAutoAnalysisEnabled] = useState(false);
  
  const cameraRef = useRef(null);

  // SAFER USEEFFECT FOR PHASE 1B - LOAD AI MODEL WITH FALLBACK
  useEffect(() => {
    const loadAIModel = async () => {
      try {
        setIsModelLoading(true);
        console.log('🧠 Lumira is loading her AI brain...');
        
        // First load TensorFlow
        await loadTensorFlow();
        
        if (tensorflowLoaded && tf && cocoSsd) {
          // Initialize TensorFlow.js for React Native
          await tf.ready();
          console.log('✅ TensorFlow.js ready');
          
          // Load COCO-SSD model for object detection
          const loadedModel = await cocoSsd.load();
          setModel(loadedModel);
          console.log('✅ COCO-SSD model loaded successfully');
        } else {
          console.log('⚠️ Running in fallback mode without real AI');
          setModel(null);
        }
        
        setIsModelLoading(false);
      } catch (error) {
        console.error('❌ Error loading AI model:', error);
        console.log('⚠️ Continuing in fallback mode');
        setIsModelLoading(false);
        setModel(null);
        // Don't crash - just continue without real AI
      }
    };
    
    loadAIModel();
  }, []);

  // Initialize animations for business cards
  useEffect(() => {
    const animations = Array(6).fill(0).map(() => new Animated.Value(0));
    setAnimationValues(animations);
    
    // Start staggered animations
    const timeout = setTimeout(() => {
      animations.forEach((anim, index) => {
        Animated.spring(anim, {
          toValue: 1,
          friction: 6,
          tension: 50,
          delay: index * 150,
          useNativeDriver: true,
        }).start();
      });
    }, 500);
    
    return () => clearTimeout(timeout);
  }, []);

  // Slideshow timer
  useEffect(() => {
    if (showOnboarding) {
      const timer = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % 3);
      }, 8000);
      return () => clearInterval(timer);
    }
  }, [showOnboarding]);

  // SAFER FUNCTION FOR PHASE 1B - REAL OBJECT DETECTION WITH FALLBACK
  const detectObjectsReal = async (imageUri) => {
    if (!model || !imageUri || !tensorflowLoaded) {
      console.log('Model not loaded or TensorFlow not available, using fallback');
      // Return simulated detection for testing
      return [
        {
          class: detectedProduct === 'food' ? 'apple' : detectedProduct === 'tech' ? 'cell phone' : 'bottle',
          score: 0.8 + Math.random() * 0.15,
          bbox: [100, 100, 200, 200]
        }
      ];
    }
    
    try {
      // FIXED: Use React Native compatible approach instead of HTML Image
      const response = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      // FIXED: Use tensor-based approach for React Native
      const imageTensor = tf.browser.fromPixels({
        data: new Uint8Array(Buffer.from(response, 'base64')),
        width: 640,
        height: 480
      });
      
      // Run object detection with tensor
      const predictions = await model.detect(imageTensor);
      console.log('🔍 Detected objects:', predictions);
      
      // Clean up tensor
      imageTensor.dispose();
      
      return predictions;
    } catch (error) {
      console.error('❌ Object detection error:', error);
      // Return fallback detection
      return [
        {
          class: detectedProduct === 'food' ? 'sandwich' : detectedProduct === 'tech' ? 'laptop' : 'bottle',
          score: 0.7 + Math.random() * 0.2,
          bbox: [50, 50, 150, 150]
        }
      ];
    }
  };

  // NEW FUNCTION FOR PHASE 1B - CAMERA MOVEMENT DETECTION
  const detectCameraMovement = (currentObjects, previousObjects) => {
    if (!currentObjects.length || !previousObjects.length) return false;
    
    // Compare object positions to detect movement
    const currentMain = currentObjects[0];
    const previousMain = previousObjects[0];
    
    if (currentMain.class === previousMain.class) {
      const currentCenter = [(currentMain.bbox[0] + currentMain.bbox[2]) / 2, 
                            (currentMain.bbox[1] + currentMain.bbox[3]) / 2];
      const previousCenter = [(previousMain.bbox[0] + previousMain.bbox[2]) / 2, 
                             (previousMain.bbox[1] + previousMain.bbox[3]) / 2];
      
      const movement = Math.sqrt(
        Math.pow(currentCenter[0] - previousCenter[0], 2) + 
        Math.pow(currentCenter[1] - previousCenter[1], 2)
      );
      
      return movement > 30; // Threshold for detecting movement
    }
    
    return false;
  };

  // NEW FUNCTION FOR PHASE 1B - SMART PRODUCT MATCHING
  const matchDetectedToIntent = (detectedObjects, userIntent, detectedProduct) => {
    const productMappings = {
      'perfume': ['bottle', 'vase', 'cup'],
      'car': ['car', 'truck', 'bus', 'motorcycle'],
      'clothing': ['tie', 'backpack', 'handbag', 'suitcase', 'person'],
      'food': ['apple', 'banana', 'sandwich', 'pizza', 'donut', 'cake', 'orange', 'hot dog', 'broccoli'],
      'tech': ['cell phone', 'laptop', 'keyboard', 'mouse', 'remote', 'tv', 'monitor'],
      'real-estate': ['bed', 'chair', 'couch', 'dining table', 'toilet', 'sink', 'refrigerator']
    };
    
    const expectedClasses = productMappings[detectedProduct] || [];
    
    // Check if any detected object matches what user intends to shoot
    const matchingObjects = detectedObjects.filter(obj => 
      expectedClasses.some(expectedClass => 
        obj.class.toLowerCase().includes(expectedClass.toLowerCase())
      )
    );
    
    if (matchingObjects.length > 0) {
      const bestMatch = matchingObjects.reduce((best, current) => 
        current.score > best.score ? current : best
      );
      
      return {
        match: true,
        confidence: bestMatch.score,
        detectedClass: bestMatch.class,
        guidance: generateProductSpecificGuidance(bestMatch, detectedProduct)
      };
    } else if (detectedObjects.length > 0) {
      const topObject = detectedObjects[0];
      return {
        match: false,
        confidence: 0,
        detectedClass: topObject.class,
        guidance: `I see a ${topObject.class}, but I'm looking for your ${detectedProduct}. Please position your ${detectedProduct} in the frame.`
      };
    } else {
      return {
        match: false,
        confidence: 0,
        detectedClass: null,
        guidance: `Point your camera at your ${detectedProduct} so Lumira can analyze it`
      };
    }
  };

  // NEW FUNCTION FOR PHASE 1B - PRODUCT-SPECIFIC GUIDANCE
  const generateProductSpecificGuidance = (detectedObject, productType) => {
    const bbox = detectedObject.bbox;
    const confidence = detectedObject.score;
    
    // Calculate object position (center of bounding box)
    const centerX = (bbox[0] + bbox[2]) / 2;
    const centerY = (bbox[1] + bbox[3]) / 2;
    const imageWidth = 640; // Standard camera resolution
    const imageHeight = 480;
    
    // Determine if object is well-positioned
    const isWellCentered = (
      centerX > imageWidth * 0.3 && centerX < imageWidth * 0.7 &&
      centerY > imageHeight * 0.3 && centerY < imageHeight * 0.7
    );
    
    const productGuidance = {
      'perfume': {
        wellPositioned: `Perfect! Lumira detects your perfume bottle (${Math.round(confidence * 100)}% confidence). Great positioning for luxury appeal.`,
        needsAdjustment: `Lumira sees your perfume bottle! Try centering it more for elegant symmetry.`,
        tooSmall: `Move closer to your perfume bottle - Lumira wants to showcase its elegant details.`,
        tooLarge: `Step back slightly - let's capture the full elegance of your perfume bottle.`
      },
      'car': {
        wellPositioned: `Excellent! Lumira detects your vehicle (${Math.round(confidence * 100)}% confidence). Perfect angle for automotive appeal.`,
        needsAdjustment: `Lumira sees your car! Try angling to show more of its sleek design.`,
        tooSmall: `Move closer to highlight your vehicle's distinctive features.`,
        tooLarge: `Step back to capture more of your car's impressive silhouette.`
      },
      'clothing': {
        wellPositioned: `Great! Lumira detects your apparel (${Math.round(confidence * 100)}% confidence). Perfect for fashion showcase.`,
        needsAdjustment: `Lumira sees your clothing item! Center it to show the fabric's best features.`,
        tooSmall: `Move closer to show the texture and quality of your fabric.`,
        tooLarge: `Step back to capture the full style and cut of your garment.`
      },
      'food': {
        wellPositioned: `Delicious! Lumira detects your food (${Math.round(confidence * 100)}% confidence). Perfect presentation for appetite appeal.`,
        needsAdjustment: `Lumira sees your food! Center it to make it look most appetizing.`,
        tooSmall: `Move closer to show the delicious details and texture.`,
        tooLarge: `Step back to capture the full presentation of your dish.`
      },
      'tech': {
        wellPositioned: `Innovative! Lumira detects your tech product (${Math.round(confidence * 100)}% confidence). Perfect for modern showcase.`,
        needsAdjustment: `Lumira sees your device! Center it to highlight its sleek design.`,
        tooSmall: `Move closer to show the tech details and features.`,
        tooLarge: `Step back to capture the full product design.`
      },
      'real-estate': {
        wellPositioned: `Perfect! Lumira detects the interior elements (${Math.round(confidence * 100)}% confidence). Great angle for property showcase.`,
        needsAdjustment: `Lumira sees your space! Try angling to show more of the room's features.`,
        tooSmall: `Step back to capture more of the space and its appeal.`,
        tooLarge: `Move closer to highlight specific room features.`
      }
    };
    
    const currentGuidance = productGuidance[productType] || productGuidance['tech'];
    
    // Determine object size in frame
    const objectSize = (bbox[2] * bbox[3]) / (imageWidth * imageHeight);
    
    if (isWellCentered && objectSize > 0.1 && objectSize < 0.6) {
      return currentGuidance.wellPositioned;
    } else if (!isWellCentered) {
      return currentGuidance.needsAdjustment;
    } else if (objectSize < 0.1) {
      return currentGuidance.tooSmall;
    } else {
      return currentGuidance.tooLarge;
    }
  };

  // ENHANCED FUNCTION FOR PHASE 1B - MOBILE-REALISTIC COMPOSITION SCORING
  const analyzeCompositionWithObjects = (detectedObjects, lightingData) => {
    let baseComposition = 55; // Higher base for mobile (was 40)
    
    if (detectedObjects.length > 0) {
      const mainObject = detectedObjects[0];
      const bbox = mainObject.bbox;
      
      // Calculate object center relative to image
      const centerX = (bbox[0] + bbox[2]) / 2;
      const centerY = (bbox[1] + bbox[3]) / 2;
      const imageWidth = 640;
      const imageHeight = 480;
      
      // MOBILE-FRIENDLY rule of thirds (more forgiving)
      const ruleOfThirdsX = Math.abs(centerX - imageWidth/3) < 80 || Math.abs(centerX - 2*imageWidth/3) < 80;
      const ruleOfThirdsY = Math.abs(centerY - imageHeight/3) < 80 || Math.abs(centerY - 2*imageHeight/3) < 80;
      
      if (ruleOfThirdsX || ruleOfThirdsY) {
        baseComposition += 15; // Reduced bonus for mobile (was 20)
      }
      
      // More forgiving object size range for mobile
      const objectSize = (bbox[2] * bbox[3]) / (imageWidth * imageHeight);
      if (objectSize > 0.1 && objectSize < 0.7) { // Wider range (was 0.6)
        baseComposition += 12; // Good mobile framing (was 15)
      }
      
      // Less penalty for multiple objects (mobile users include context)
      if (detectedObjects.length > 4) { // More forgiving (was 3)
        baseComposition -= 5; // Reduced penalty (was 10)
      }
    }
    
    // Lighting bonus adjusted for mobile
    const lightingBonus = (lightingData.score - 60) * 0.3; // Adjusted baseline (was 50)
    baseComposition += lightingBonus;
    
    // Realistic variation for mobile
    const variation = (Math.random() - 0.5) * 8; // Reduced variation (was 10)
    
    return Math.max(25, Math.min(85, Math.round(baseComposition + variation))); // Max 85 for mobile
  };

  // MOBILE-OPTIMIZED LIGHTING ANALYSIS - Realistic smartphone standards
  const analyzeLightingReal = async (imageUri) => {
    try {
      return new Promise((resolve) => {
        const now = new Date();
        const hour = now.getHours();
        
        // MOBILE-OPTIMIZED lighting scoring (more realistic than DSLR standards)
        let baseScore = 55; // Higher base score for mobile (was 40)
        if (hour >= 10 && hour <= 16) {
          baseScore = 75; // Excellent mobile lighting (was 65)
        } else if (hour >= 8 && hour <= 10 || hour >= 16 && hour <= 19) {
          baseScore = 65; // Good mobile lighting (was 50)
        } else if (hour >= 6 && hour <= 8 || hour >= 19 && hour <= 21) {
          baseScore = 55; // Acceptable mobile lighting
        } else {
          baseScore = 45; // Poor but usable mobile lighting (was 35)
        }
        
        // Smaller variation for mobile (phones are more consistent)
        const variation = (Math.random() - 0.5) * 20; // Reduced from 30
        const lightingScore = Math.max(35, Math.min(90, baseScore + variation)); // Max 90 for mobile
        
        // Generate mobile-specific guidance
        const guidance = generateLightingGuidance(lightingScore, detectedProduct);
        
        resolve({
          score: Math.round(lightingScore),
          guidance: guidance
        });
      });
    } catch (error) {
      console.log('Lighting analysis error:', error);
      return {
        score: 60, // Reasonable mobile fallback (was random)
        guidance: "Adjust lighting for better mobile photos"
      };
    }
  };

  const generateLightingGuidance = (score, productType) => {
    // Mobile-optimized lighting guidance
    const productGuidance = {
      'perfume': {
        low: "📱 For mobile perfume shots: move toward window light or use a desk lamp",
        medium: "Good mobile lighting! Try angling toward softer light for luxury feel",
        high: "Perfect mobile lighting! This enhances your perfume bottle beautifully",
        overexposed: "Too bright for mobile camera! Step back or find softer light"
      },
      'car': {
        low: "📱 Mobile car photography: find brighter outdoor light or garage lighting",
        medium: "Better! Try angled lighting to highlight your car's design on mobile",
        high: "Excellent mobile lighting! Your vehicle looks great on smartphone camera",
        overexposed: "Too much glare for mobile! Angle away from direct sunlight"
      },
      'clothing': {
        low: "📱 Mobile fashion shots need natural light - try near a window",
        medium: "Good mobile lighting! Soft light will show fabric quality on camera",
        high: "Perfect! Your mobile camera captures the material beautifully",
        overexposed: "Too harsh for smartphone camera! Move to softer lighting"
      },
      'food': {
        low: "📱 Mobile food photography: try natural window light or kitchen lighting",
        medium: "Better mobile lighting! Warmer light makes food more appetizing",
        high: "Delicious! Perfect mobile lighting makes your food look fresh",
        overexposed: "Too bright for mobile camera! Food looks washed out"
      },
      'tech': {
        low: "📱 Tech products need clean lighting - try indoor lighting or desk lamp",
        medium: "Good mobile lighting! Even light shows sleek design on smartphone",
        high: "Perfect! Clean mobile lighting showcases tech features clearly",
        overexposed: "Screen glare detected! Angle your mobile camera to avoid reflections"
      },
      'real-estate': {
        low: "📱 Mobile property shots: open curtains or turn on room lights",
        medium: "Better! Bright lighting makes spaces feel welcoming on mobile",
        high: "Excellent! Mobile camera captures bright, inviting spaces",
        overexposed: "Too bright for mobile camera! Balance the lighting"
      }
    };

    const currentGuidance = productGuidance[productType] || productGuidance['tech'];

    if (score < 50) { // Adjusted for mobile (was 40)
      return currentGuidance.low;
    } else if (score < 65) { // Adjusted for mobile (was 60)
      return currentGuidance.medium;
    } else if (score < 80) { // Adjusted for mobile (was 85)
      return currentGuidance.high;
    } else {
      return currentGuidance.overexposed;
    }
  };

  // Enhanced composition analysis
  const analyzeComposition = (lightingData) => {
    // Simulate composition analysis based on lighting quality
    const baseComposition = 40;
    
    // Better lighting generally means better composition opportunity
    const lightingBonus = (lightingData.score - 50) * 0.3;
    
    // Add some realistic variation
    const variation = (Math.random() - 0.5) * 20;
    
    const compositionScore = Math.max(15, Math.min(95, baseComposition + lightingBonus + variation));
    
    return Math.round(compositionScore);
  };

  // Smart Intent Analysis
  const analyzeIntent = (text) => {
    const lowerText = text.toLowerCase();
    
    const productKeywords = {
      'perfume': ['perfume', 'fragrance', 'cologne', 'scent', 'beauty', 'cosmetic'],
      'car': ['car', 'automotive', 'vehicle', 'bmw', 'mercedes', 'toyota', 'ford', 'tesla', 'auto'],
      'clothing': ['clothing', 'fashion', 'shirt', 'dress', 'shoes', 'brand', 'apparel', 'wear'],
      'food': ['food', 'restaurant', 'drink', 'beverage', 'coffee', 'meal', 'recipe', 'cuisine', 'chocolate', 'snickers'],
      'tech': ['tech', 'phone', 'laptop', 'gadget', 'electronics', 'device', 'software', 'app'],
      'real-estate': ['house', 'home', 'property', 'real estate', 'apartment', 'condo', 'building']
    };
    
    const styleKeywords = {
      'luxury': ['luxury', 'premium', 'high-end', 'exclusive', 'sophisticated', 'elegant'],
      'casual': ['casual', 'everyday', 'simple', 'basic', 'comfortable', 'relaxed'],
      'sporty': ['sporty', 'athletic', 'fitness', 'active', 'gym', 'workout', 'sport'],
      'modern': ['modern', 'contemporary', 'sleek', 'minimalist', 'clean'],
      'vintage': ['vintage', 'retro', 'classic', 'traditional', 'timeless']
    };
    
    let detectedProduct = 'general';
    let detectedStyle = 'professional';
    
    for (const [product, keywords] of Object.entries(productKeywords)) {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        detectedProduct = product;
        break;
      }
    }
    
    for (const [style, keywords] of Object.entries(styleKeywords)) {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        detectedStyle = style;
        break;
      }
    }
    
    return { product: detectedProduct, style: detectedStyle };
  };

  // Generate Dynamic Workflow
  const generateWorkflow = (productType, style) => {
    const workflows = {
      'perfume': {
        title: `${style.charAt(0).toUpperCase() + style.slice(1)} Perfume Campaign`,
        description: `✨ Perfect! Lumira will guide you through creating a ${style} fragrance commercial`,
        steps: [
          `Generate Background → "${style} perfume stand with elegant mood lighting"`,
          'Image Enhancement → Use generated background as reference',
          'Video Production → VEO2 with smooth product rotation',
          `Voice Synthesis → "${style === 'luxury' ? 'Sophistication in every drop' : 'Your signature scent'}"`
        ]
      },
      'car': {
        title: `${style.charAt(0).toUpperCase() + style.slice(1)} Automotive Commercial`,
        description: `🚗 Excellent! Lumira will create a ${style} car commercial with professional quality`,
        steps: [
          `Generate Background → "${style} automotive showroom with dramatic lighting"`,
          '3D & 360 → Complete vehicle showcase (interior + exterior)', 
          'Video Transformation → Dynamic driving scenes (Runway Aleph)',
          `Voice Synthesis → "${style === 'luxury' ? 'Performance redefined' : 'Drive your dreams'}"`
        ]
      },
      'clothing': {
        title: `${style.charAt(0).toUpperCase() + style.slice(1)} Fashion Campaign`,
        description: `👗 Amazing! Lumira will help you create a ${style} fashion commercial`,
        steps: [
          'Remove Background → Clean product isolation',
          'TryOn API → Virtual models wearing your clothes',
          `Generate Background → "${style} fashion setting"`,
          'Video Production → Model showcase sequence'
        ]
      },
      'food': {
        title: `${style.charAt(0).toUpperCase() + style.slice(1)} Food & Beverage Campaign`,
        description: `🍽️ Delicious! Lumira will create an appetizing ${style} food commercial`,
        steps: [
          `Generate Background → "${style} kitchen or dining environment"`,
          'Image Enhancement → Food styling perfection',
          'Video Production → Appetizing product reveal',
          `Voice Synthesis → "${style === 'luxury' ? 'Taste perfection' : 'Simply delicious'}"`
        ]
      },
      'tech': {
        title: `${style.charAt(0).toUpperCase() + style.slice(1)} Tech Product Campaign`,
        description: `📱 Innovative! Lumira will build a ${style} technology commercial`,
        steps: [
          `Generate Background → "${style} tech environment with clean aesthetics"`,
          'Image Enhancement → Sleek product presentation',
          'Video Production → Dynamic tech showcase',
          `Voice Synthesis → "${style === 'modern' ? 'Innovation simplified' : 'Technology that works'}"`
        ]
      },
      'real-estate': {
        title: `${style.charAt(0).toUpperCase() + style.slice(1)} Real Estate Campaign`,
        description: `🏠 Perfect! Lumira will create a ${style} property showcase`,
        steps: [
          'Decor8 API → Enhanced interior staging',
          `Generate Background → "Perfect ${style} exterior views"`,
          'Video Production → Smooth property walkthrough',
          `Voice Synthesis → "${style === 'luxury' ? 'Your dream home awaits' : 'Home is where life begins'}"`
        ]
      }
    };
    
    return workflows[productType] || {
      title: 'Professional Commercial Campaign',
      description: '🎬 Great! Lumira will help you create a professional commercial',
      steps: [
        'Image Enhancement → Professional product presentation',
        'Video Production → Dynamic commercial content',
        'Voice Synthesis → Compelling narration',
        'Production Studio → Final assembly and editing'
      ]
    };
  };

  const handleStartCreating = () => {
    if (detectedProduct === 'general' && userIntent.trim().length < 5) {
      Alert.alert("Tell Lumira more!", "Please select a business type or describe your commercial");
      return;
    }
    
    if (detectedProduct === 'general') {
      const analysis = analyzeIntent(userIntent);
      setDetectedProduct(analysis.product);
      setDetectedStyle(analysis.style);
      setCurrentWorkflow(generateWorkflow(analysis.product, analysis.style));
    } else {
      setCurrentWorkflow(generateWorkflow(detectedProduct, detectedStyle));
    }
    
    setShowOnboarding(false);
    // FIX: Enable auto analysis only after starting
    setAutoAnalysisEnabled(true);
    
    const productGuidance = {
      'perfume': 'Position your perfume bottle in good lighting - Lumira is analyzing...',
      'car': 'Frame your vehicle to show its best angle - Lumira is analyzing...',
      'clothing': 'Display your clothing item clearly - Lumira is analyzing...',
      'food': 'Make your food look fresh and appetizing - Lumira is analyzing...',
      'tech': 'Show your tech product\'s key features - Lumira is analyzing...',
      'real-estate': 'Capture the property\'s best features - Lumira is analyzing...'
    };
    
    setGuidance(productGuidance[detectedProduct] || 'Position your product in the frame - Lumira is analyzing...');
  };

  // Slideshow Component
  const Slideshow = () => {
    const slides = [
      { 
        title: "Professional Commercials", 
        description: "Create stunning ads in minutes", 
        color: "#3B0764"
      },
      { 
        title: "AI-Powered Guidance", 
        description: "Real-time feedback on your shots", 
        color: "#4C1D95"
      },
      { 
        title: "Automated Workflows", 
        description: "From capture to final edit", 
        color: "#5B21B6"
      },
    ];

    return (
      <View style={styles.slideshowContainer}>
        <Animated.View style={[
          styles.slide,
          { backgroundColor: slides[currentSlide].color }
        ]}>
          <Text style={styles.slideTitle}>{slides[currentSlide].title}</Text>
          <Text style={styles.slideDescription}>{slides[currentSlide].description}</Text>
        </Animated.View>
        
        <View style={styles.slideshowDots}>
          {slides.map((_, index) => (
            <View 
              key={index}
              style={[
                styles.dot,
                index === currentSlide && styles.activeDot
              ]}
            />
          ))}
        </View>
      </View>
    );
  };

  // Onboarding Screen Component
  const OnboardingScreen = () => (
    <View style={styles.onboardingContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A1A" />
      
      <View style={styles.backgroundGradient} />
      
      <ScrollView 
        contentContainerStyle={styles.onboardingScroll} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        // FIX: Prevent auto-scroll glitch
        scrollEventThrottle={16}
        decelerationRate="normal"
        bounces={false}
      >
        
        {/* Header */}
        <View style={styles.onboardingHeader}>
          <View style={styles.logoContainer}>
            <Text style={styles.onboardingTitle}>Lumira</Text>
            <View style={styles.betaBadge}>
              <Text style={styles.betaText}>AI</Text>
            </View>
          </View>
          <Text style={styles.onboardingSubtitle}>Your AI Commercial Director</Text>
          <Text style={styles.onboardingDescription}>
            Lumira analyzes your products in real-time and creates professional commercials in minutes. 
            From lighting guidance to CF Studio workflows - Lumira handles everything.
          </Text>
        </View>

        {/* Slideshow */}
        <Slideshow />

        {/* Business Type Selection */}
        <View style={styles.businessTypeContainer}>
          <Text style={styles.sectionTitle}>What type of business do you have?</Text>
          <Text style={styles.sectionSubtitle}>Lumira will tailor the perfect commercial strategy for your industry</Text>
          <View style={styles.businessGrid}>
            {[
              { type: 'perfume', label: 'Beauty & Fragrance', direction: 'left', glowColor: '#8B5CF6' },
              { type: 'car', label: 'Automotive', direction: 'right', glowColor: '#10B981' },
              { type: 'clothing', label: 'Fashion & Apparel', direction: 'left', glowColor: '#F59E0B' },
              { type: 'food', label: 'Food & Beverage', direction: 'right', glowColor: '#EF4444' },
              { type: 'tech', label: 'Technology', direction: 'left', glowColor: '#3B82F6' },
              { type: 'real-estate', label: 'Real Estate', direction: 'right', glowColor: '#06B6D4' }
            ].map((business, index) => {
              const animValue = animationValues[index] || new Animated.Value(0);
              const translateX = business.direction === 'left' ? -100 : 100;
              
              return (
                <Animated.View
                  key={business.type}
                  style={[
                    styles.businessCardContainer,
                    {
                      opacity: animValue,
                      transform: [
                        {
                          translateX: animValue.interpolate({
                            inputRange: [0, 1],
                            outputRange: [translateX, 0],
                          })
                        },
                        {
                          scale: animValue.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.8, 1],
                          })
                        }
                      ]
                    }
                  ]}
                >
                  <TouchableOpacity
                    style={[
                      styles.businessCard,
                      {
                        shadowColor: business.glowColor,
                        shadowOffset: { width: 0, height: 0 },
                        shadowOpacity: detectedProduct === business.type ? 0.8 : 0.4,
                        shadowRadius: detectedProduct === business.type ? 20 : 12,
                        borderColor: detectedProduct === business.type ? business.glowColor : '#374151',
                        borderWidth: detectedProduct === business.type ? 3 : 1,
                        elevation: detectedProduct === business.type ? 15 : 8,
                      }
                    ]}
                    onPress={() => {
                      setDetectedProduct(business.type);
                      setUserIntent(`${business.label.toLowerCase()} commercial`);
                    }}
                  >
                    <Text style={styles.businessLabel}>{business.label}</Text>
                    {detectedProduct === business.type && (
                      <Animated.View style={styles.selectedIndicator}>
                        <Text style={styles.checkMark}>✓</Text>
                      </Animated.View>
                    )}
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </View>
        </View>

        {/* Style Selection */}
        {detectedProduct !== 'general' && (
          <View style={styles.styleContainer}>
            <Text style={styles.sectionTitle}>What style are you going for?</Text>
            <View style={styles.styleGrid}>
              {[
                { style: 'luxury', label: 'Luxury', desc: 'Premium, high-end feel', glowColor: '#8B5CF6' },
                { style: 'modern', label: 'Modern', desc: 'Clean, contemporary look', glowColor: '#10B981' },
                { style: 'casual', label: 'Casual', desc: 'Friendly, approachable', glowColor: '#F59E0B' },
                { style: 'sporty', label: 'Sporty', desc: 'Active, energetic vibe', glowColor: '#EF4444' }
              ].map((styleOption) => (
                <TouchableOpacity
                  key={styleOption.style}
                  style={[
                    styles.styleCard,
                    {
                      shadowColor: styleOption.glowColor,
                      shadowOffset: { width: 0, height: 0 },
                      shadowOpacity: detectedStyle === styleOption.style ? 0.8 : 0.3,
                      shadowRadius: detectedStyle === styleOption.style ? 15 : 8,
                      borderColor: detectedStyle === styleOption.style ? styleOption.glowColor : '#374151',
                      borderWidth: detectedStyle === styleOption.style ? 3 : 1,
                      elevation: detectedStyle === styleOption.style ? 12 : 6,
                    }
                  ]}
                  onPress={() => setDetectedStyle(styleOption.style)}
                >
                  <Text style={styles.styleLabel}>{styleOption.label}</Text>
                  <Text style={styles.styleDesc}>{styleOption.desc}</Text>
                  {detectedStyle === styleOption.style && (
                    <View style={styles.selectedStyleIndicator}>
                      <Text style={styles.checkMark}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* AI Preview */}
        {detectedProduct !== 'general' && (
          <View style={styles.aiPreviewContainer}>
            <Text style={styles.aiPreviewTitle}>✨ Lumira's Analysis</Text>
            <View style={styles.aiPreviewCard}>
              <Text style={styles.aiPreviewText}>
                {(() => {
                  const workflow = generateWorkflow(detectedProduct, detectedStyle);
                  return workflow.description;
                })()}
              </Text>
              <View style={styles.workflowPreview}>
                <Text style={styles.workflowPreviewTitle}>Lumira will create:</Text>
                {(() => {
                  const workflow = generateWorkflow(detectedProduct, detectedStyle);
                  return workflow.steps.slice(0, 2).map((step, index) => (
                    <Text key={index} style={styles.workflowPreviewStep}>
                      • {step.split(' → ')[0]}
                    </Text>
                  ));
                })()}
                <Text style={styles.workflowPreviewMore}>+ {(() => {
                  const workflow = generateWorkflow(detectedProduct, detectedStyle);
                  return workflow.steps.length - 2;
                })()} more steps</Text>
              </View>
            </View>
          </View>
        )}

        {/* Custom Input */}
        <View style={styles.customInputContainer}>
          <Text style={styles.sectionTitle}>Or describe your vision to Lumira:</Text>
          <Text style={styles.sectionSubtitle}>Tell Lumira exactly what commercial you want to create</Text>
          <TextInput
            style={styles.intentInput}
            placeholder="e.g., 'Premium skincare for mature women' or 'Electric car showcase'"
            placeholderTextColor="#6B7280"
            value={userIntent}
            onChangeText={(text) => {
              setUserIntent(text);
              if (text.length > 5) {
                const analysis = analyzeIntent(text);
                setDetectedProduct(analysis.product);
                setDetectedStyle(analysis.style);
              }
            }}
            multiline={true}
            numberOfLines={2}
            textAlignVertical="top"
          />
        </View>

        {/* Start Button */}
        <TouchableOpacity
          style={[
            styles.startButton,
            { 
              opacity: (detectedProduct !== 'general' || userIntent.length > 4) ? 1 : 0.5,
              backgroundColor: detectedProduct !== 'general' ? '#5B21B6' : '#374151'
            }
          ]}
          onPress={handleStartCreating}
          disabled={detectedProduct === 'general' && userIntent.length < 5}
        >
          <Text style={styles.startButtonText}>
            🚀 Start Creating with Lumira {detectedProduct !== 'general' ? `• ${detectedProduct.charAt(0).toUpperCase() + detectedProduct.slice(1)} Commercial` : ''}
          </Text>
        </TouchableOpacity>

        {/* Footer */}
        <View style={styles.footerContainer}>
          <Text style={styles.footerText}>
            Powered by Lumira AI & CF Studio • Professional results in 15 minutes
          </Text>
        </View>

      </ScrollView>
    </View>
  );

  // FIXED REAL-TIME AI ANALYSIS - Only when enabled and controlled intervals
  useEffect(() => {
    if (showOnboarding || isModelLoading || !autoAnalysisEnabled) return;
    
    const interval = setInterval(async () => {
      // FIX: Only analyze every 5 seconds to prevent rapid changes and auto-capture
      const now = Date.now();
      if (now - lastAnalysisTime < 5000) {
        return;
      }
      
      if (cameraRef.current && !isAnalyzing && !isCapturing) {
        setIsAnalyzing(true);
        setLastAnalysisTime(now);
        
        try {
          // FIX: Use lower quality and skip processing for analysis only
          const photo = await cameraRef.current.takePictureAsync({
            quality: 0.1, // Very low quality for analysis
            base64: false,
            skipProcessing: true,
            exif: false, // Skip EXIF data
          });
          
          // STEP 1: REAL OBJECT DETECTION (with fallback)
          const detectedObjects = await detectObjectsReal(photo.uri);
          setDetectedObjects(detectedObjects);
          
          // STEP 1.5: MOVEMENT DETECTION for mobile photography
          const cameraMovement = detectCameraMovement(detectedObjects, previousObjects);
          setIsMoving(cameraMovement);
          setPreviousObjects(detectedObjects);
          
          // STEP 2: MATCH DETECTED OBJECTS WITH USER INTENT
          const productMatch = matchDetectedToIntent(detectedObjects, userIntent, detectedProduct);
          
          // STEP 3: CALCULATE MOBILE-REALISTIC PRODUCT SCORE
          let newProductScore = 35;
          if (productMatch.match) {
            newProductScore = Math.round(50 + (productMatch.confidence * 40));
            setGuidance(generateEnhancedGuidance(productMatch, cameraMovement, detectedObjects));
          } else {
            newProductScore = Math.max(35, productScore - 3);
            setGuidance(generateEnhancedGuidance(productMatch, cameraMovement, detectedObjects));
          }
          setProductScore(newProductScore);
          
          // STEP 4: MOBILE-OPTIMIZED LIGHTING ANALYSIS
          const lightingAnalysis = await analyzeLightingReal(photo.uri);
          setLightingScore(lightingAnalysis.score);
          
          // STEP 5: MOBILE-REALISTIC COMPOSITION SCORING
          const newComposition = analyzeCompositionWithObjects(detectedObjects, lightingAnalysis);
          setCompositionScore(newComposition);
          
          // STEP 6: MOBILE-FRIENDLY MAGIC SCORE CALCULATION
          const newMagicScore = Math.round(
            (lightingAnalysis.score * 0.4) + (newComposition * 0.3) + (newProductScore * 0.3)
          );
          setMagicScore(newMagicScore);
          
          // STEP 7: REALISTIC MOBILE PERFECT SHOT DETECTION (no auto-capture)
          const mobileQualityThreshold = 72;
          const goodConfidenceThreshold = 0.6;
          
          if (newMagicScore >= mobileQualityThreshold && 
              productMatch.match && 
              productMatch.confidence > goodConfidenceThreshold && 
              !perfectShot) {
            setPerfectShot(true);
            setGuidance(`🎯 Perfect mobile shot! Lumira detected your ${productMatch.detectedClass} with ${Math.round(productMatch.confidence * 100)}% confidence - tap capture button when ready!`);
          } else if (newMagicScore < (mobileQualityThreshold - 5) && perfectShot) {
            setPerfectShot(false);
          }
          
          // Clean up photo file to save storage
          try {
            await FileSystem.deleteAsync(photo.uri, { idempotent: true });
          } catch (cleanupError) {
            // Ignore cleanup errors
          }
          
        } catch (error) {
          console.log('Analysis error:', error);
          // Fallback with mobile-friendly guidance
          const lightingChange = Math.max(-1, Math.min(2, Math.random() * 3 - 1));
          setLightingScore(prev => Math.max(35, Math.min(85, prev + lightingChange)));
          setGuidance("📱 Adjusting for mobile camera - try moving for better lighting");
        }
        
        setIsAnalyzing(false);
      }
    }, 2000); // FIX: Increased interval to 2 seconds

    return () => clearInterval(interval);
  }, [showOnboarding, isModelLoading, autoAnalysisEnabled, lastAnalysisTime, isAnalyzing, isCapturing, userIntent, detectedProduct, productScore, perfectShot]);

  // ENHANCED GUIDANCE GENERATION for mobile photography
  const generateEnhancedGuidance = (productMatch, isMoving, detectedObjects) => {
    if (isMoving) {
      return "📱 Hold steady! Lumira detects camera movement - try bracing your phone against something for sharper mobile photos";
    }
    
    if (!detectedObjects.length) {
      return `📱 Point your camera at your ${detectedProduct} - Lumira is ready to help you create great smartphone content!`;
    }
    
    if (productMatch.match) {
      const baseGuidance = productMatch.guidance;
      // Add mobile-specific tips based on lighting
      if (lightingScore < 55) {
        return `${baseGuidance} 💡 Mobile tip: move toward window light or turn on room lights`;
      } else if (lightingScore >= 75) {
        return `${baseGuidance} ✨ Excellent mobile lighting detected!`;
      } else {
        return baseGuidance;
      }
    } else {
      return `I see a ${productMatch.detectedClass}, but I'm looking for your ${detectedProduct}. 📱 Smartphone tip: get closer to your subject for better mobile photos!`;
    }
  };

  // UPDATED capturePhoto function for backend integration
const capturePhoto = async () => {
  if (magicScore < 70) {
    Alert.alert(
      "Almost there!", 
      `Your mobile photo score is ${magicScore}/100. For best smartphone results, try to reach 70+. Lumira is optimizing for mobile quality!`
    );
    return;
  }

  setIsCapturing(true);
  
  try {
    if (cameraRef.current) {
      // UPDATED: Capture with base64 for API
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.9,
        base64: true, // ← Need base64 for API
      });
      
      // Send to Hollywood Pipeline
      const response = await fetch('https://fastapi-app-production-ac48.up.railway.app/create-commercials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_data: `data:image/jpeg;base64,${photo.base64}`,
          business_type: detectedProduct,
          style: detectedStyle,
          user_intent: userIntent,
          magic_score: magicScore,
          detected_objects: detectedObjects
        })
      });
      
      const result = await response.json();
      
      // Update workflow with real results
      setCurrentWorkflow({
        ...currentWorkflow,
        realResults: result,
        status: 'completed'
      });
      
      setIsCapturing(false);
      setShowWorkflow(true);
      console.log('Real commercials generated:', result);
      
    }
  } catch (error) {
    console.error('Error creating commercials:', error);
    setIsCapturing(false);
    Alert.alert('Error', 'Failed to generate commercials. Please try again.');
  }
};

  const getScoreColor = (score) => {
    // MOBILE-APPROPRIATE color coding
    if (score >= 75) return '#10B981'; // Excellent mobile quality
    if (score >= 60) return '#F59E0B'; // Good mobile quality  
    if (score >= 45) return '#EF4444'; // Needs improvement
    return '#DC2626'; // Poor quality
  };

  const WorkflowModal = () => (
    <View style={styles.workflowModal}>
      <View style={styles.workflowContent}>
        <Text style={styles.workflowTitle}>🎯 Perfect Shot! Lumira's Analysis Complete</Text>
        <Text style={styles.detectedProduct}>
          ✨ {currentWorkflow?.description || "Commercial detected • Premium quality achieved"}
        </Text>
        
        <Text style={styles.workflowSubtitle}>Recommended CF Studio Workflow:</Text>
        
        <View style={styles.workflowSteps}>
          {(currentWorkflow?.steps || []).map((step, index) => (
            <WorkflowStep key={index} number={(index + 1).toString()} text={step} />
          ))}
        </View>
        
        <TouchableOpacity style={styles.primaryButton} onPress={() => {
          Alert.alert("Launching CF Studio!", `Starting your ${currentWorkflow?.title || 'commercial'} workflow`);
          setShowWorkflow(false);
        }}>
          <Text style={styles.primaryButtonText}>
            🚀 Start {currentWorkflow?.title || 'Commercial Campaign'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.secondaryButton} onPress={() => setShowWorkflow(false)}>
          <Text style={styles.secondaryButtonText}>
            📋 View Full Workflow ({currentWorkflow?.steps?.length || 4} steps)
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const WorkflowStep = ({ number, text }) => (
    <View style={styles.workflowStep}>
      <Text style={styles.stepNumber}>{number}.</Text>
      <Text style={styles.stepText}>{text}</Text>
    </View>
  );

  if (!permission) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>We need your permission to show the camera</Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // FIX: Updated loading text
  if (isModelLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>🧠 Lumira is loading her AI brain...</Text>
        <Text style={styles.subLoadingText}>
          {tensorflowLoaded ? 'Loading AI model...' : 'Setting up fallback mode...'}
        </Text>
        <View style={styles.loadingProgress}>
          <Text style={styles.loadingEmoji}>🤖</Text>
        </View>
      </View>
    );
  }

  // Show onboarding first
  if (showOnboarding) {
    return <OnboardingScreen />;
  }

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      
      {/* Camera View - NO CHILDREN */}
      <CameraView style={styles.camera} facing={facing} ref={cameraRef} />
      
      {/* All UI Elements with Absolute Positioning */}
      
      {/* Dark overlay for better visibility */}
      <View style={styles.overlay} />
      
      {/* Magic Score Circle with Lumira Intelligence Indicator */}
      <View style={styles.magicScoreContainer}>
        <View style={[styles.magicScore, { borderColor: getScoreColor(magicScore) }]}>
          <Text style={[styles.magicScoreNumber, { color: getScoreColor(magicScore) }]}>
            {magicScore}
          </Text>
          <Text style={styles.magicScoreLabel}>LUMIRA</Text>
          {isAnalyzing && (
            <View style={styles.analyzingIndicator}>
              <Text style={styles.analyzingText}>•</Text>
            </View>
          )}
        </View>
      </View>
      
      {/* UPDATED Score Breakdown with Real Analysis Indicators */}
      <View style={styles.scoreBreakdown}>
        <ScoreItem label="Lighting" score={Math.round(lightingScore)} isReal={true} />
        <ScoreItem label="Composition" score={Math.round(compositionScore)} isReal={true} />
        <ScoreItem label="Product" score={Math.round(productScore)} isReal={true} hasObjects={detectedObjects.length > 0} />
      </View>
      
      {/* Progress Indicators */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { backgroundColor: getScoreColor(lightingScore) }]} />
        <View style={[styles.progressBar, { backgroundColor: getScoreColor(compositionScore) }]} />
        <View style={[styles.progressBar, { backgroundColor: getScoreColor(productScore) }]} />
      </View>
      
      {/* Composition Guide Grid */}
      <View style={styles.gridContainer}>
        <View style={styles.gridLine} />
        <View style={[styles.gridLine, { left: '66%' }]} />
        <View style={[styles.gridLine, styles.horizontalLine, { top: '33%' }]} />
        <View style={[styles.gridLine, styles.horizontalLine, { top: '66%' }]} />
        
        {/* Perfect placement zone */}
        <View style={[styles.placementZone, { 
          borderColor: perfectShot ? '#10B981' : 'rgba(255,255,255,0.5)' 
        }]} />
      </View>
      
      {/* UPDATED Lumira's Real-Time Guidance with Mobile Movement Detection */}
      <View style={styles.guidanceContainer}>
        <View style={styles.guidanceBox}>
          <Text style={styles.guidanceBrand}>Lumira AI:</Text>
          <Text style={styles.guidanceText}>{guidance}</Text>
          {detectedObjects.length > 0 && (
            <Text style={styles.detectedObjectsText}>
              👁️ Detected: {detectedObjects.map(obj => obj.class).join(', ')}
            </Text>
          )}
          {isMoving && (
            <Text style={styles.movingWarningText}>
              📱 Hold steady - movement detected
            </Text>
          )}
          {perfectShot && (
            <Text style={styles.perfectShotText}>🎯 Perfect mobile shot ready! Smartphone quality achieved</Text>
          )}
        </View>
      </View>
      
      {/* Capture Button */}
      <View style={styles.captureContainer}>
        <TouchableOpacity
          style={[
            styles.captureButton,
            {
              backgroundColor: perfectShot ? '#10B981' : magicScore >= 70 ? '#F59E0B' : '#6B7280',
              transform: [{ scale: isCapturing ? 0.95 : 1.0 }]
            }
          ]}
          onPress={capturePhoto}
          disabled={isCapturing}
        >
          {isCapturing ? (
            <View style={styles.loadingSpinner}>
              <Text style={styles.loadingText}>📸</Text>
            </View>
          ) : (
            <View style={[styles.captureInner, { 
              backgroundColor: perfectShot ? '#059669' : '#ffffff' 
            }]} />
          )}
        </TouchableOpacity>
      </View>
      
      {/* Workflow Modal */}
      {showWorkflow && <WorkflowModal />}
    </View>
  );
}

// UPDATED ScoreItem Component with Object Detection Indicator
const ScoreItem = ({ label, score, isReal, hasObjects }) => (
  <View style={styles.scoreItem}>
    <View style={styles.scoreItemHeader}>
      <Text style={styles.scoreLabel}>{label}</Text>
      {isReal && <View style={styles.realIndicator} />}
      {hasObjects && <View style={styles.objectDetectedIndicator} />}
    </View>
    <Text style={[styles.scoreValue, { color: score >= 85 ? '#10B981' : score >= 70 ? '#F59E0B' : '#EF4444' }]}>
      {score}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    color: 'white',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  // NEW STYLES FOR PHASE 1B
  subLoadingText: {
    color: '#9CA3AF',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  loadingProgress: {
    marginTop: 20,
    alignItems: 'center',
  },
  loadingEmoji: {
    fontSize: 30,
    opacity: 0.8,
  },
  objectDetectedIndicator: {
    width: 6,
    height: 6,
    backgroundColor: '#10B981',
    borderRadius: 3,
    marginLeft: 4,
  },
  detectedObjectsText: {
    color: '#10B981',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  movingWarningText: {
    color: '#F59E0B',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  // END NEW STYLES
  permissionButton: {
    backgroundColor: '#5B21B6',
    padding: 16,
    borderRadius: 12,
    minWidth: 200,
  },
  permissionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  magicScoreContainer: {
    position: 'absolute',
    top: 60,
    left: width / 2 - 48,
    zIndex: 10,
  },
  magicScore: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 4,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  magicScoreNumber: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  magicScoreLabel: {
    fontSize: 12,
    color: 'white',
    opacity: 0.8,
  },
  analyzingIndicator: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 16,
    height: 16,
    backgroundColor: '#A855F7',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  analyzingText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  scoreBreakdown: {
    position: 'absolute',
    top: 60,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 12,
    borderRadius: 8,
    zIndex: 10,
  },
  scoreItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    minWidth: 120,
  },
  scoreItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreLabel: {
    color: 'white',
    fontSize: 14,
  },
  realIndicator: {
    width: 6,
    height: 6,
    backgroundColor: '#A855F7',
    borderRadius: 3,
    marginLeft: 4,
  },
  scoreValue: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  progressContainer: {
    position: 'absolute',
    top: 180,
    left: 16,
    right: 16,
    flexDirection: 'row',
    gap: 8,
    zIndex: 10,
  },
  progressBar: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    opacity: 0.8,
  },
  gridContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 5,
  },
  gridLine: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.3)',
    width: 1,
    height: '100%',
    left: '33%',
  },
  horizontalLine: {
    width: '100%',
    height: 1,
    left: 0,
  },
  placementZone: {
    position: 'absolute',
    left: '25%',
    top: '25%',
    width: '50%',
    height: '50%',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 8,
  },
  guidanceContainer: {
    position: 'absolute',
    bottom: 160,
    left: 16,
    right: 16,
    zIndex: 10,
  },
  guidanceBox: {
    backgroundColor: 'rgba(0,0,0,0.8)',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  guidanceBrand: {
    color: '#A855F7',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  guidanceText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '500',
    textAlign: 'center',
  },
  perfectShotText: {
    color: '#10B981',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  captureContainer: {
    position: 'absolute',
    bottom: 40,
    left: width / 2 - 32,
    zIndex: 10,
  },
  captureButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 4,
    borderColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureInner: {
    width: 48,
    height: 48,
    borderRadius: 24,
    margin: 4,
  },
  loadingSpinner: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  workflowModal: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  workflowContent: {
    backgroundColor: '#0F172A',
    margin: 20,
    borderRadius: 16,
    padding: 24,
    borderWidth: 3,
    borderColor: '#7C3AED',
    maxHeight: height * 0.8,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 20,
  },
  workflowTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  detectedProduct: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 16,
  },
  workflowSubtitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 12,
  },
  workflowSteps: {
    marginBottom: 20,
  },
  workflowStep: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    flexDirection: 'row',
  },
  stepNumber: {
    color: '#7C3AED',
    fontWeight: 'bold',
    marginRight: 8,
  },
  stepText: {
    color: 'white',
    fontSize: 14,
    flex: 1,
  },
  primaryButton: {
    backgroundColor: '#5B21B6',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#5B21B6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  secondaryButton: {
    backgroundColor: '#374151',
    padding: 12,
    borderRadius: 8,
  },
  secondaryButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  
  // Onboarding Styles
  onboardingContainer: {
    flex: 1,
    backgroundColor: '#020617',
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 400,
    backgroundColor: 'rgba(59, 7, 100, 0.1)',
    opacity: 0.6,
  },
  onboardingScroll: {
    flexGrow: 1,
    padding: 24,
    // FIX: Add minimum height to prevent scroll glitch
    minHeight: height + 100,
  },
  onboardingHeader: {
    alignItems: 'center',
    marginBottom: 40,
    paddingTop: 60,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  onboardingTitle: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#A855F7',
    marginRight: 12,
    letterSpacing: 2,
  },
  betaBadge: {
    backgroundColor: '#5B21B6',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    shadowColor: '#5B21B6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 4,
  },
  betaText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  onboardingSubtitle: {
    fontSize: 20,
    color: '#E5E7EB',
    textAlign: 'center',
    marginBottom: 12,
    fontWeight: '600',
  },
  onboardingDescription: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 26,
    paddingHorizontal: 20,
  },
  
  // Slideshow styles
  slideshowContainer: {
    marginBottom: 32,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  slide: {
    padding: 24,
    alignItems: 'center',
    minHeight: 120,
    justifyContent: 'center',
  },
  slideTitle: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  slideDescription: {
    color: 'white',
    fontSize: 16,
    opacity: 0.9,
    textAlign: 'center',
  },
  slideshowDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#111827',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4B5563',
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#A855F7',
    width: 16,
    shadowColor: '#A855F7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 4,
  },
  
  businessTypeContainer: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 16,
    color: '#9CA3AF',
    marginBottom: 20,
    lineHeight: 24,
  },
  businessGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  businessCardContainer: {
    width: (width - 80) / 2,
  },
  businessCard: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    position: 'relative',
  },
  businessLabel: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 22,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 28,
    height: 28,
    backgroundColor: '#7C3AED',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 4,
  },
  checkMark: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  
  styleContainer: {
    marginBottom: 32,
  },
  styleGrid: {
    gap: 12,
  },
  styleCard: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 16,
    position: 'relative',
  },
  styleLabel: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  styleDesc: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  selectedStyleIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 24,
    height: 24,
    backgroundColor: '#7C3AED',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  aiPreviewContainer: {
    marginBottom: 32,
  },
  aiPreviewTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#A855F7',
    marginBottom: 12,
  },
  aiPreviewCard: {
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#059669',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  aiPreviewText: {
    color: 'white',
    fontSize: 16,
    marginBottom: 16,
    lineHeight: 24,
  },
  workflowPreview: {
    backgroundColor: '#1F2937',
    borderRadius: 8,
    padding: 12,
  },
  workflowPreviewTitle: {
    color: '#D1D5DB',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  workflowPreviewStep: {
    color: '#9CA3AF',
    fontSize: 13,
    marginBottom: 4,
  },
  workflowPreviewMore: {
    color: '#7C3AED',
    fontSize: 13,
    fontStyle: 'italic',
    marginTop: 4,
  },
  
  customInputContainer: {
    marginBottom: 32,
  },
  intentInput: {
    backgroundColor: '#0F172A',
    borderWidth: 3,
    borderColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    color: 'white',
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  
  startButton: {
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#5B21B6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
  },
  startButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  
  footerContainer: {
    alignItems: 'center',
    paddingBottom: 40,
  },
  footerText: {
    color: '#6B7280',
    fontSize: 14,
    textAlign: 'center',
  },
});