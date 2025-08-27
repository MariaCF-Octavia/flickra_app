import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Alert, StatusBar, TextInput, ScrollView, Animated, Platform, Image } from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';

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
  const [guidance, setGuidance] = useState("Hold your perfume bottle steady, Lumira is analyzing...");
  const [showWorkflow, setShowWorkflow] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [showLoadingScreen, setShowLoadingScreen] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [userIntent, setUserIntent] = useState('');
  const [detectedProduct, setDetectedProduct] = useState('perfume');
  const [detectedStyle, setDetectedStyle] = useState('luxury');
  const [animationValues, setAnimationValues] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [lastAnalysisTime, setLastAnalysisTime] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [detectedObjects, setDetectedObjects] = useState([]);
  const [autoAnalysisEnabled, setAutoAnalysisEnabled] = useState(false);
  const [guidanceStage, setGuidanceStage] = useState(0);
  
  // Loading states
  const [loadingStage, setLoadingStage] = useState(0);
  const [loadingMessages] = useState([
    "Creating dramatic red silk backdrop...",
    "Enhancing golden perfume lighting...",
    "Generating rose petal variations...",
    "Finalizing luxury brand presentation..."
  ]);
  
  const cameraRef = useRef(null);
  const scrollViewRef = useRef(null);

  // Initialize animations
  useEffect(() => {
    const animations = Array(6).fill(0).map(() => new Animated.Value(0));
    setAnimationValues(animations);
    
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

  // Simple slideshow timer
  useEffect(() => {
    if (showOnboarding) {
      const timer = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % 3);
      }, 8000);
      return () => clearInterval(timer);
    }
  }, [showOnboarding]);

  // REALISTIC FAKE GUIDANCE SEQUENCE
  const guidanceSequence = [
    "Point your camera at your perfume bottle - Lumira is analyzing...",
    "Perfect! Lumira sees your YSL perfume. It's a bit dark - turn on a light or move toward a window...",
    "Much better lighting! Now step back slightly to capture the full elegance...",
    "Excellent positioning! Your luxury perfume is perfectly framed - tap capture when ready!"
  ];

  // Auto-progress guidance stages
  useEffect(() => {
    if (!showOnboarding && autoAnalysisEnabled && !isCapturing) {
      const interval = setInterval(() => {
        setGuidanceStage(prev => {
          const next = Math.min(prev + 1, guidanceSequence.length - 1);
          setGuidance(guidanceSequence[next]);
          
          // Update scores as guidance progresses
          if (next === 1) {
            setProductScore(82);
            setLightingScore(78);
            setCompositionScore(75);
            setMagicScore(78);
            setDetectedObjects([{ class: 'bottle', score: 0.89 }]);
          } else if (next === 2) {
            setProductScore(89);
            setLightingScore(85);
            setCompositionScore(83);
            setMagicScore(86);
            setPerfectShot(true);
            setDetectedObjects([{ class: 'bottle', score: 0.92 }]);
          }
          
          return next;
        });
      }, 4000); // 4 seconds between stages

      return () => clearInterval(interval);
    }
  }, [showOnboarding, autoAnalysisEnabled, isCapturing]);

  const handleStartCreating = () => {
    if (detectedProduct === 'general' && userIntent.trim().length < 5) {
      Alert.alert("Tell Lumira more!", "Please select a business type or describe your commercial");
      return;
    }
    
    setShowOnboarding(false);
    setAutoAnalysisEnabled(true);
    setGuidanceStage(0);
    setGuidance(guidanceSequence[0]);
  };

  // DEMO CAPTURE FUNCTION - NO BACKEND
  const capturePhoto = async () => {
    setIsCapturing(true);
    setShowLoadingScreen(true);
    
    // Simulate photo capture
    setTimeout(() => {
      setIsCapturing(false);
      startLoadingSequence();
    }, 1000);
  };

  const startLoadingSequence = () => {
    let currentStage = 0;
    
    const loadingInterval = setInterval(() => {
      if (currentStage < loadingMessages.length) {
        setLoadingStage(currentStage);
        currentStage++;
      } else {
        clearInterval(loadingInterval);
        // Show results after loading
        setTimeout(() => {
          setShowLoadingScreen(false);
          setShowResults(true);
        }, 1000);
      }
    }, 3000); // 3 seconds per stage
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#10B981';
    if (score >= 65) return '#F59E0B';
    if (score >= 50) return '#EF4444';
    return '#DC2626';
  };

  // Score Item Component
  const ScoreItem = ({ label, score, isReal, hasObjects }) => (
    <View style={styles.scoreItem}>
      <View style={styles.scoreItemHeader}>
        <Text style={styles.scoreLabel}>{label}</Text>
        {isReal && <View style={styles.realIndicator} />}
        {hasObjects && <View style={styles.objectDetectedIndicator} />}
      </View>
      <Text style={[styles.scoreValue, { color: getScoreColor(score) }]}>
        {score}
      </Text>
    </View>
  );

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

  // LOADING SCREEN COMPONENT
  const LoadingScreen = () => {
    const [dots, setDots] = useState('');
    
    useEffect(() => {
      const interval = setInterval(() => {
        setDots(prev => prev.length >= 3 ? '' : prev + '.');
      }, 500);
      
      return () => clearInterval(interval);
    }, []);

    return (
      <View style={styles.loadingContainer}>
        <StatusBar hidden />
        <View style={styles.loadingContent}>
          <Text style={styles.loadingTitle}>🎬 Lumira Creating Your Commercial{dots}</Text>
          
          <View style={styles.loadingStages}>
            {loadingMessages.map((message, index) => (
              <Animated.View
                key={index}
                style={[
                  styles.loadingStage,
                  {
                    opacity: index <= loadingStage ? 1 : 0.3,
                    transform: [{
                      scale: index === loadingStage ? 1.05 : 1
                    }]
                  }
                ]}
              >
                <Text style={[
                  styles.loadingStageText,
                  { color: index <= loadingStage ? '#10B981' : '#6B7280' }
                ]}>
                  {index < loadingStage ? '✅' : index === loadingStage ? '🔄' : '⏳'} {message}
                </Text>
              </Animated.View>
            ))}
          </View>
          
          <View style={styles.loadingProgress}>
            <View style={styles.progressBar}>
              <Animated.View 
                style={[
                  styles.progressFill,
                  { width: `${((loadingStage + 1) / loadingMessages.length) * 100}%` }
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {Math.round(((loadingStage + 1) / loadingMessages.length) * 100)}% Complete
            </Text>
          </View>
        </View>
      </View>
    );
  };

  // RESULTS SCREEN COMPONENT
  const ResultsScreen = () => {
    const [cardAnimations] = useState(() => 
      Array(6).fill(0).map(() => ({
        opacity: new Animated.Value(0),
        translateY: new Animated.Value(50)
      }))
    );

    useEffect(() => {
      cardAnimations.forEach((anim, index) => {
        setTimeout(() => {
          Animated.parallel([
            Animated.timing(anim.opacity, {
              toValue: 1,
              duration: 800,
              useNativeDriver: true
            }),
            Animated.timing(anim.translateY, {
              toValue: 0,
              duration: 800,
              useNativeDriver: true
            })
          ]).start();
        }, index * 200);
      });
    }, []);

    return (
      <View style={styles.resultsContainer}>
        <StatusBar hidden />
        <ScrollView style={styles.resultsScroll} contentContainerStyle={styles.resultsContent}>
          <Text style={styles.resultsTitle}>🎉 Your Luxury Perfume Commercials Are Ready!</Text>
          <Text style={styles.resultsSubtitle}>Lumira generated 6 premium variations</Text>
          
          <View style={styles.commercialsGrid}>
            {[
              {
                id: 1,
                title: "Botanical Elegance",
                description: "YSL perfume with lush greenery and soft pink gradient",
                source: require('./assets/images/perfume_1.jpg')
              },
              {
                id: 2,
                title: "Dramatic Red Silk",
                description: "YSL Collection 2024 with flowing crimson fabric backdrop",
                source: require('./assets/images/perfume_2.jpg')
              },
              {
                id: 3,
                title: "Rose Petals Romance",
                description: "Floating rose petals with sophisticated presentation",
                source: require('./assets/images/perfume_3.jpg')
              },
              {
                id: 4,
                title: "The Art of Seduction",
                description: "Minimalist red luxury with premium gold accents",
                source: require('./assets/images/perfume_4.jpg')
              },
              {
                id: 5,
                title: "Brand Heritage",
                description: "Classic YSL presentation with premium gold details",
                source: require('./assets/images/perfume_5.jpg')
              },
              {
                id: 6,
                title: "Cinematic Studio",
                description: "Professional commercial-grade presentation",
                source: require('./assets/images/perfume_6.jpg')
              }
            ].map((commercial, index) => (
              <Animated.View
                key={commercial.id}
                style={[
                  styles.commercialCard,
                  {
                    opacity: cardAnimations[index]?.opacity || 1,
                    transform: [{ translateY: cardAnimations[index]?.translateY || 0 }]
                  }
                ]}
              >
                <Image
                  style={styles.imagePreview}
                  source={commercial.source}
                  resizeMode="cover"
                />
                <View style={styles.commercialInfo}>
                  <Text style={styles.commercialTitle}>{commercial.title}</Text>
                  <Text style={styles.commercialDesc}>{commercial.description}</Text>
                </View>
              </Animated.View>
            ))}
          </View>
          
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => {
              setShowResults(false);
              setShowOnboarding(true);
              setGuidanceStage(0);
              setPerfectShot(false);
              setAutoAnalysisEnabled(false);
            }}
          >
            <Text style={styles.backButtonText}>🎬 Create Another Commercial</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  };

  // Onboarding Screen with FIXED ScrollView
  const OnboardingScreen = () => (
    <View style={styles.onboardingContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A1A" />
      
      <View style={styles.backgroundGradient} />
      
      <ScrollView 
        ref={scrollViewRef}
        style={styles.scrollContainer}
        contentContainerStyle={styles.onboardingScroll} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        bounces={false}
        scrollEnabled={true}
        nestedScrollEnabled={false}
        automaticallyAdjustContentInsets={false}
        automaticallyAdjustKeyboardInsets={false}
        contentInsetAdjustmentBehavior="never"
        keyboardDismissMode="none"
      >
        
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

        <Slideshow />

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

        <View style={styles.customInputContainer}>
          <Text style={styles.sectionTitle}>Describe your vision to Lumira:</Text>
          <Text style={styles.sectionSubtitle}>Tell Lumira exactly what commercial you want to create</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.intentInput}
              placeholder="e.g., 'Luxury perfume with ocean sunset backdrop' or 'Premium fragrance commercial'"
              placeholderTextColor="#6B7280"
              value={userIntent}
              onChangeText={setUserIntent}
              multiline={true}
              numberOfLines={3}
              textAlignVertical="top"
              returnKeyType="done"
              blurOnSubmit={true}
              scrollEnabled={false}
              onFocus={() => {
                // Prevent any scroll behavior
                if (scrollViewRef.current) {
                  scrollViewRef.current.setNativeProps({ scrollEnabled: false });
                }
              }}
              onBlur={() => {
                // Re-enable scroll after blur
                if (scrollViewRef.current) {
                  scrollViewRef.current.setNativeProps({ scrollEnabled: true });
                }
              }}
            />
          </View>
        </View>

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
            🚀 Start Creating with Lumira • {detectedProduct.charAt(0).toUpperCase() + detectedProduct.slice(1)} Commercial
          </Text>
        </TouchableOpacity>

        <View style={styles.footerContainer}>
          <Text style={styles.footerText}>
            Powered by Lumira AI & CF Studio • Professional results in 15 minutes
          </Text>
        </View>

      </ScrollView>
    </View>
  );

  // Permission checks
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

  // Main render logic
  if (showOnboarding) {
    return <OnboardingScreen />;
  }

  if (showLoadingScreen) {
    return <LoadingScreen />;
  }

  if (showResults) {
    return <ResultsScreen />;
  }

  // Camera Screen
  return (
    <View style={styles.container}>
      <StatusBar hidden />
      
      <CameraView style={styles.camera} facing={facing} ref={cameraRef} />
      
      <View style={styles.overlay} />
      
      {/* Magic Score Circle */}
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
      
      {/* Score Breakdown */}
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
        
        <View style={[styles.placementZone, { 
          borderColor: perfectShot ? '#10B981' : 'rgba(255,255,255,0.5)' 
        }]} />
      </View>
      
      {/* Lumira's Real-Time Guidance */}
      <View style={styles.guidanceContainer}>
        <View style={styles.guidanceBox}>
          <Text style={styles.guidanceBrand}>Lumira AI:</Text>
          <Text style={styles.guidanceText}>{guidance}</Text>
          {detectedObjects.length > 0 && (
            <Text style={styles.detectedObjectsText}>
              👁️ Detected: {detectedObjects.map(obj => `${obj.class} (${Math.round(obj.score * 100)}%)`).join(', ')}
            </Text>
          )}
          {perfectShot && (
            <Text style={styles.perfectShotText}>🎯 Perfect shot ready - tap capture!</Text>
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
              <Text style={styles.captureLoadingText}>📸</Text>
            </View>
          ) : (
            <View style={[styles.captureInner, { 
              backgroundColor: perfectShot ? '#059669' : '#ffffff' 
            }]} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

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
  
  // LOADING SCREEN STYLES
  loadingContent: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  loadingTitle: {
    color: '#A855F7',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 40,
  },
  loadingStages: {
    width: '100%',
    marginBottom: 40,
  },
  loadingStage: {
    padding: 16,
    marginBottom: 12,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 12,
  },
  loadingStageText: {
    fontSize: 16,
    fontWeight: '500',
  },
  loadingProgress: {
    width: '100%',
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 4,
  },
  progressText: {
    color: '#10B981',
    fontSize: 16,
    fontWeight: 'bold',
  },

  // RESULTS SCREEN STYLES
  resultsContainer: {
    flex: 1,
    backgroundColor: '#020617',
  },
  resultsScroll: {
    flex: 1,
  },
  resultsContent: {
    padding: 24,
    paddingTop: 60,
  },
  resultsTitle: {
    color: '#A855F7',
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  resultsSubtitle: {
    color: '#E5E7EB',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 40,
  },
  commercialsGrid: {
    gap: 24,
    marginBottom: 40,
  },
  commercialCard: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#374151',
    shadowColor: '#A855F7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  videoPreview: {
    width: '100%',
    height: 200,
    backgroundColor: '#000',
  },
  imagePreview: {
    width: '100%',
    height: 200,
    backgroundColor: '#000',
  },
  commercialInfo: {
    padding: 16,
  },
  commercialTitle: {
    color: '#10B981',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  commercialDesc: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  backButton: {
    backgroundColor: '#5B21B6',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#5B21B6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  backButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },

  // EXISTING STYLES (keeping all your original styles)
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
  captureLoadingText: {
    fontSize: 20,
    color: 'white',
  },
  
  // ONBOARDING STYLES
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
  scrollContainer: {
    flex: 1,
  },
  onboardingScroll: {
    padding: 24,
    paddingBottom: 80,
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
  
  customInputContainer: {
    marginBottom: 32,
  },
  inputWrapper: {
    position: 'relative',
    zIndex: 1,
  },
  intentInput: {
    backgroundColor: '#0F172A',
    borderWidth: 3,
    borderColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    color: 'white',
    fontSize: 16,
    minHeight: 100,
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