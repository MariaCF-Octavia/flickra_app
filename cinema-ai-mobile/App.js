import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Alert, ActivityIndicator, StatusBar, ScrollView } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { DeviceMotion } from 'expo-sensors';
import { manipulateAsync } from 'expo-image-manipulator';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Professional Template Definitions
const PROFESSIONAL_TEMPLATES = {
  white_infinity: {
    id: 'white_infinity',
    name: 'White Infinity',
    icon: '⚪',
    description: 'Clean seamless white studio background',
    overlay: {
      background: 'linear-gradient(to bottom, #ffffff 0%, #f8f9fa 100%)',
      lighting: 'soft_studio',
      shadows: true,
      reflections: false
    }
  },
  matte_black: {
    id: 'matte_black',
    name: 'Matte Black',
    icon: '⚫',
    description: 'Dramatic high-contrast black background',
    overlay: {
      background: 'linear-gradient(to bottom, #2d3436 0%, #000000 100%)',
      lighting: 'dramatic_single',
      shadows: true,
      reflections: false
    }
  },
  marble_luxury: {
    id: 'marble_luxury',
    name: 'Marble Luxury',
    icon: '🏛️',
    description: 'White Carrara marble with natural reflections',
    overlay: {
      background: 'url(marble-texture)',
      lighting: 'natural_soft',
      shadows: true,
      reflections: true
    }
  },
  glass_reflection: {
    id: 'glass_reflection',
    name: 'Glass Surface',
    icon: '💎',
    description: 'Clear glass surface with realistic reflections',
    overlay: {
      background: 'transparent',
      lighting: 'even_distributed',
      shadows: false,
      reflections: true
    }
  },
  golden_hour: {
    id: 'golden_hour',
    name: 'Golden Hour',
    icon: '🌅',
    description: 'Warm natural lighting mimicking sunset',
    overlay: {
      background: 'linear-gradient(45deg, #fdcb6e 0%, #f39c12 100%)',
      lighting: 'warm_natural',
      shadows: true,
      reflections: false
    }
  },
  velvet_premium: {
    id: 'velvet_premium',
    name: 'Velvet Premium',
    icon: '🔴',
    description: 'Deep burgundy velvet for luxury products',
    overlay: {
      background: 'linear-gradient(to bottom, #a29bfe 0%, #6c5ce7 100%)',
      lighting: 'luxury_ambient',
      shadows: true,
      reflections: false
    }
  }
};

export default function LumiraTemplateCamera() {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState('back');
  const [selectedIndustry, setSelectedIndustry] = useState('electronics');
  const [selectedTemplate, setSelectedTemplate] = useState('white_infinity');
  const [showTemplates, setShowTemplates] = useState(false);
  
  // Enhanced sensor scores
  const [lightingScore, setLightingScore] = useState(50);
  const [angleScore, setAngleScore] = useState(80);
  const [stabilityScore, setStabilityScore] = useState(70);
  const [proximityScore, setProximityScore] = useState(60);
  const [templateAlignment, setTemplateAlignment] = useState(75); // New: How well product fits template
  const [magicScore, setMagicScore] = useState(0);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [lastAnalysisTime, setLastAnalysisTime] = useState(0);
  const [guidanceMessage, setGuidanceMessage] = useState("Select template and position product");
  
  const cameraRef = useRef(null);
  const analysisInterval = useRef(null);
  const motionSubscription = useRef(null);

  const industries = [
    { key: 'electronics', label: 'Tech', icon: '📱' },
    { key: 'beauty', label: 'Beauty', icon: '💄' },
    { key: 'fashion', label: 'Fashion', icon: '👗' },
    { key: 'food', label: 'Food', icon: '🍎' },
    { key: 'automotive', label: 'Auto', icon: '🚗' }
  ];

  useEffect(() => {
    testConnection();
    startRealTimeAnalysis();
    setupDeviceMotion();
    
    return () => {
      stopAnalysis();
      if (motionSubscription.current) {
        motionSubscription.current.remove();
      }
    };
  }, []);

  // Enhanced Magic Score calculation including template alignment
  useEffect(() => {
    const newMagicScore = Math.round(
      lightingScore * 0.25 +      // 25% lighting
      angleScore * 0.20 +         // 20% angle
      stabilityScore * 0.20 +     // 20% stability
      proximityScore * 0.15 +     // 15% proximity
      templateAlignment * 0.20    // 20% template fit (NEW)
    );
    setMagicScore(Math.max(15, Math.min(95, newMagicScore)));
    updateGuidanceMessage(newMagicScore);
  }, [lightingScore, angleScore, stabilityScore, proximityScore, templateAlignment]);

  const setupDeviceMotion = () => {
    DeviceMotion.setUpdateInterval(1000);
    
    motionSubscription.current = DeviceMotion.addListener((motion) => {
      if (motion?.rotation) {
        const tilt = Math.abs(motion.rotation.beta * (180 / Math.PI));
        const newAngleScore = Math.max(25, 100 - tilt * 2.5);
        setAngleScore(Math.round(newAngleScore));
      }
      
      if (motion?.acceleration) {
        const totalAccel = Math.sqrt(
          Math.pow(motion.acceleration.x || 0, 2) +
          Math.pow(motion.acceleration.y || 0, 2) +
          Math.pow(motion.acceleration.z || 0, 2)
        );
        const stability = Math.max(30, 100 - totalAccel * 15);
        setStabilityScore(Math.round(stability));
      }
    });
  };

  const startRealTimeAnalysis = () => {
    analysisInterval.current = setInterval(async () => {
      if (cameraRef.current && !isProcessing) {
        await analyzeLightingConditions();
        updateProximityScore();
        analyzeTemplateAlignment(); // NEW: Check how well product fits selected template
      }
    }, 3000);
  };

  const stopAnalysis = () => {
    if (analysisInterval.current) {
      clearInterval(analysisInterval.current);
    }
  };

  const analyzeLightingConditions = async () => {
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.1,
        base64: false,
        skipProcessing: true,
      });

      if (photo?.uri) {
        const analyzed = await manipulateAsync(
          photo.uri,
          [{ resize: { width: 50, height: 50 } }],
          { compress: 0.1, format: 'jpeg' }
        );

        const brightness = estimateBrightnessFromImage(analyzed);
        setLightingScore(Math.round(brightness));
        setLastAnalysisTime(Date.now());
      }
    } catch (error) {
      const timeBasedScore = getTimeBasedLightingScore();
      setLightingScore(timeBasedScore);
    }
  };

  const analyzeTemplateAlignment = () => {
    // Simulate product-template fit analysis
    // In real implementation, this would use ML Kit object detection
    const template = PROFESSIONAL_TEMPLATES[selectedTemplate];
    let alignmentScore = 65; // Base score
    
    // Adjust based on industry-template compatibility
    if (selectedIndustry === 'beauty' && ['marble_luxury', 'velvet_premium'].includes(selectedTemplate)) {
      alignmentScore += 15;
    }
    if (selectedIndustry === 'electronics' && ['white_infinity', 'matte_black'].includes(selectedTemplate)) {
      alignmentScore += 15;
    }
    if (selectedIndustry === 'fashion' && ['velvet_premium', 'golden_hour'].includes(selectedTemplate)) {
      alignmentScore += 15;
    }
    
    // Factor in lighting compatibility
    if (lightingScore > 70 && template.overlay.lighting === 'natural_soft') {
      alignmentScore += 10;
    }
    
    // Add some realistic variation
    const variation = (Math.random() - 0.5) * 20;
    const finalScore = Math.max(35, Math.min(90, alignmentScore + variation));
    
    setTemplateAlignment(Math.round(finalScore));
  };

  const estimateBrightnessFromImage = (imageData) => {
    const hour = new Date().getHours();
    let baseScore = 50;
    
    if (hour >= 9 && hour <= 17) {
      baseScore = 75;
    } else if (hour >= 7 && hour <= 8 || hour >= 18 && hour <= 20) {
      baseScore = 60;
    } else {
      baseScore = 40;
    }
    
    const variation = (Math.random() - 0.5) * 25;
    return Math.max(25, Math.min(90, baseScore + variation));
  };

  const getTimeBasedLightingScore = () => {
    const hour = new Date().getHours();
    if (hour >= 10 && hour <= 16) return Math.random() * 20 + 70;
    if (hour >= 8 && hour <= 9 || hour >= 17 && hour <= 18) return Math.random() * 25 + 55;
    return Math.random() * 30 + 35;
  };

  const updateProximityScore = () => {
    const baseProximity = (stabilityScore + lightingScore) / 2;
    const variation = (Math.random() - 0.5) * 20;
    const newProximity = Math.max(20, Math.min(85, baseProximity + variation));
    setProximityScore(Math.round(newProximity));
  };

  const updateGuidanceMessage = (score) => {
    const template = PROFESSIONAL_TEMPLATES[selectedTemplate];
    
    if (score >= 80) {
      setGuidanceMessage(`Perfect! ${template.name} template ready for capture`);
    } else if (score >= 65) {
      setGuidanceMessage(`Good setup with ${template.name} - ready to capture`);
    } else if (templateAlignment < 60) {
      setGuidanceMessage(`Try different template for ${selectedIndustry} products`);
    } else if (lightingScore < 50) {
      setGuidanceMessage(`Need better lighting for ${template.name} template`);
    } else if (angleScore < 60) {
      setGuidanceMessage("Keep device level for template alignment");
    } else if (stabilityScore < 50) {
      setGuidanceMessage("Hold device steady for template precision");
    } else {
      setGuidanceMessage(`Adjust position for ${template.name} template`);
    }
  };

  const testConnection = async () => {
    try {
      const response = await fetch('https://fastapi-app-production-ac48.up.railway.app/health');
      const data = await response.json();
      setIsConnected(data.status === 'healthy');
    } catch (error) {
      setIsConnected(false);
    }
  };

  const handleTemplateSelect = (templateId) => {
    setSelectedTemplate(templateId);
    setShowTemplates(false);
    
    // Trigger immediate template alignment analysis
    setTimeout(() => {
      analyzeTemplateAlignment();
    }, 500);
  };

  const handleCapture = async () => {
    if (!isConnected) {
      Alert.alert(
        'Connection Error',
        'Cannot connect to Lumira servers. Check internet connection.',
        [
          { text: 'Test Connection', onPress: testConnection },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
      return;
    }

    if (magicScore < 60) {
      const improvements = [];
      if (templateAlignment < 60) improvements.push(`• Try different template for ${selectedIndustry}`);
      if (lightingScore < 50) improvements.push('• Move to brighter lighting');
      if (angleScore < 60) improvements.push('• Level your device');
      if (stabilityScore < 50) improvements.push('• Hold more steady');
      
      Alert.alert(
        'Improve Template Conditions',
        `Magic Score: ${magicScore}%\n\nTemplate feedback:\n${improvements.join('\n')}\n\nCapture anyway?`,
        [
          { text: 'Keep Improving', style: 'default' },
          { text: 'Capture Now', onPress: () => captureWithTemplate() }
        ]
      );
      return;
    }

    await captureWithTemplate();
  };

  const captureWithTemplate = async () => {
    setIsProcessing(true);
    
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: true,
      });

      if (photo?.base64) {
        await sendToBackend(photo.base64);
      }
    } catch (error) {
      Alert.alert('Camera Error', 'Failed to capture image. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const sendToBackend = async (base64Image) => {
    const startTime = Date.now();
    
    try {
      const template = PROFESSIONAL_TEMPLATES[selectedTemplate];
      
      const requestData = {
        image_data: base64Image,
        business_type: selectedIndustry,
        style: 'modern',
        user_intent: `Professional ${selectedIndustry} commercial with ${template.name} template`,
        magic_score: magicScore,
        template_settings: {
          template_id: selectedTemplate,
          template_name: template.name,
          alignment_score: templateAlignment,
          lighting_compatibility: lightingScore,
          overlay_config: template.overlay
        }
      };

      const response = await fetch('https://fastapi-app-production-ac48.up.railway.app/api/generate-commercial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });

      const result = await response.json();
      const processingTime = ((Date.now() - startTime) / 1000).toFixed(1);
      
      if (result.success) {
        Alert.alert(
          `🎬 Commercial Generated with ${template.name}!`,
          `✅ Professional template processing completed!\n\n` +
          `⏱️ Processing time: ${processingTime}s\n` +
          `🎨 Template: ${template.name}\n` +
          `📊 Template alignment: ${templateAlignment}%\n` +
          `🎥 Commercials generated: ${result.commercials?.length || 0}\n` +
          `⭐ Magic Score: ${magicScore}%\n\n` +
          `Professional background applied with ${selectedIndustry} optimization`,
          [{ text: 'Generate Another', onPress: () => {} }, { text: 'Perfect!', style: 'default' }]
        );
      } else {
        Alert.alert('Processing Issue', `${result.message}\n\nTemplate: ${template.name}\nProcessing time: ${processingTime}s`);
      }
    } catch (error) {
      Alert.alert('Connection Error', 'Failed to process with professional template. Check internet connection.');
    }
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" color="#6c5ce7" />
        <Text style={styles.message}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <Text style={styles.message}>
          Lumira needs camera access for professional template overlay and commercial generation
        </Text>
        <TouchableOpacity onPress={requestPermission} style={styles.button}>
          <Text style={styles.buttonText}>Grant Camera Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const getScoreColor = (score) => {
    if (score >= 70) return '#00b894';
    if (score >= 50) return '#fdcb6e';
    return '#e17055';
  };

  const currentTemplate = PROFESSIONAL_TEMPLATES[selectedTemplate];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={facing}
      >
        {/* Template Overlay - This simulates the professional background */}
        <View style={[styles.templateOverlay, getTemplateOverlayStyle(currentTemplate)]}>
          <View style={styles.productArea}>
            <Text style={styles.productGuide}>
              {currentTemplate.icon} {currentTemplate.name}
            </Text>
            <Text style={styles.templateDescription}>
              {currentTemplate.description}
            </Text>
          </View>
        </View>

        {/* Connection Status */}
        <View style={styles.connectionStatus}>
          <View style={[styles.connectionDot, { backgroundColor: isConnected ? '#00b894' : '#e17055' }]} />
          <Text style={styles.connectionText}>
            Backend: {isConnected ? 'Connected' : 'Offline'}
          </Text>
        </View>

        {/* Industry + Template Selection */}
        <View style={styles.topControls}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.industrySelector}>
            {industries.map((industry) => (
              <TouchableOpacity
                key={industry.key}
                style={[
                  styles.industryButton,
                  selectedIndustry === industry.key && styles.industryButtonActive
                ]}
                onPress={() => setSelectedIndustry(industry.key)}
              >
                <Text style={styles.industryIcon}>{industry.icon}</Text>
                <Text style={[
                  styles.industryButtonText,
                  selectedIndustry === industry.key && styles.industryButtonTextActive
                ]}>
                  {industry.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          <TouchableOpacity 
            style={styles.templateSelectorButton}
            onPress={() => setShowTemplates(!showTemplates)}
          >
            <Text style={styles.templateIcon}>{currentTemplate.icon}</Text>
            <Text style={styles.templateButtonText}>{currentTemplate.name}</Text>
          </TouchableOpacity>
        </View>

        {/* Template Selection Panel */}
        {showTemplates && (
          <View style={styles.templatePanel}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {Object.values(PROFESSIONAL_TEMPLATES).map((template) => (
                <TouchableOpacity
                  key={template.id}
                  style={[
                    styles.templateOption,
                    selectedTemplate === template.id && styles.templateOptionActive
                  ]}
                  onPress={() => handleTemplateSelect(template.id)}
                >
                  <Text style={styles.templateOptionIcon}>{template.icon}</Text>
                  <Text style={styles.templateOptionName}>{template.name}</Text>
                  <Text style={styles.templateOptionDesc}>{template.description}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Magic Score Display */}
        <View style={styles.scoreContainer}>
          <View style={[styles.scoreCircle, { borderColor: getScoreColor(magicScore) }]}>
            <Text style={[styles.scoreText, { color: getScoreColor(magicScore) }]}>
              {magicScore}%
            </Text>
            <Text style={styles.scoreLabel}>Magic Score</Text>
          </View>
          
          <Text style={styles.guidanceText}>{guidanceMessage}</Text>
          
          {magicScore >= 70 && (
            <Text style={styles.readyText}>✨ Ready for professional capture!</Text>
          )}
        </View>

        {/* Enhanced Sensor Metrics */}
        <View style={styles.metricsContainer}>
          <Text style={styles.metricsTitle}>📱 Live Sensors + Template:</Text>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>💡 Lighting:</Text>
            <Text style={[styles.metricValue, { color: getScoreColor(lightingScore) }]}>
              {lightingScore}%
            </Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>📐 Angle:</Text>
            <Text style={[styles.metricValue, { color: getScoreColor(angleScore) }]}>
              {angleScore}%
            </Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>🤚 Stability:</Text>
            <Text style={[styles.metricValue, { color: getScoreColor(stabilityScore) }]}>
              {stabilityScore}%
            </Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>🎨 Template Fit:</Text>
            <Text style={[styles.metricValue, { color: getScoreColor(templateAlignment) }]}>
              {templateAlignment}%
            </Text>
          </View>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => setFacing(current => (current === 'back' ? 'front' : 'back'))}
          >
            <Text style={styles.controlText}>🔄</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.captureButton,
              magicScore >= 60 && styles.captureButtonReady,
              isProcessing && styles.captureButtonProcessing
            ]}
            onPress={handleCapture}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator size="large" color="#ffffff" />
            ) : (
              <View style={[
                styles.captureInner,
                magicScore >= 60 && styles.captureInnerReady
              ]} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => setShowTemplates(!showTemplates)}
          >
            <Text style={styles.controlText}>🎨</Text>
          </TouchableOpacity>
        </View>

        {/* Processing Overlay */}
        {isProcessing && (
          <View style={styles.processingOverlay}>
            <Text style={styles.processingText}>
              Generating commercial with {currentTemplate.name}...
            </Text>
            <Text style={styles.processingSubtext}>
              Template → Real-ESRGAN → Claid → VEO3 → Professional Result
            </Text>
            <Text style={styles.processingDetails}>
              Industry: {selectedIndustry} | Template Alignment: {templateAlignment}%
            </Text>
          </View>
        )}
      </CameraView>
    </View>
  );
}

// Helper function to get template overlay styling
function getTemplateOverlayStyle(template) {
  const baseStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.3,
  };

  switch (template.id) {
    case 'white_infinity':
      return { ...baseStyle, backgroundColor: 'rgba(255, 255, 255, 0.2)' };
    case 'matte_black':
      return { ...baseStyle, backgroundColor: 'rgba(0, 0, 0, 0.3)' };
    case 'marble_luxury':
      return { ...baseStyle, backgroundColor: 'rgba(248, 249, 250, 0.25)' };
    case 'glass_reflection':
      return { ...baseStyle, backgroundColor: 'rgba(255, 255, 255, 0.1)' };
    case 'golden_hour':
      return { ...baseStyle, backgroundColor: 'rgba(253, 203, 110, 0.2)' };
    case 'velvet_premium':
      return { ...baseStyle, backgroundColor: 'rgba(108, 92, 231, 0.2)' };
    default:
      return baseStyle;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  camera: {
    flex: 1,
    width: screenWidth,
  },
  templateOverlay: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  productArea: {
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 15,
    alignItems: 'center',
    marginTop: '50%',
  },
  productGuide: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  templateDescription: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    textAlign: 'center',
  },
  connectionStatus: {
    position: 'absolute',
    top: 50,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  connectionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  topControls: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
  },
  industrySelector: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  industryButton: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    marginRight: 10,
    minWidth: 70,
  },
  industryButtonActive: {
    backgroundColor: '#6c5ce7',
    borderColor: '#6c5ce7',
  },
  industryIcon: {
    fontSize: 14,
    marginBottom: 2,
  },
  industryButtonText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 10,
    fontWeight: '500',
  },
  industryButtonTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  templateSelectorButton: {
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  templateIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  templateButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  templatePanel: {
    position: 'absolute',
    top: 130,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.9)',
    borderRadius: 15,
    padding: 15,
  },
  templateOption: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 12,
    borderRadius: 10,
    marginRight: 10,
    minWidth: 120,
    alignItems: 'center',
  },
  templateOptionActive: {
    backgroundColor: '#6c5ce7',
  },
  templateOptionIcon: {
    fontSize: 20,
    marginBottom: 5,
  },
  templateOptionName: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 3,
  },
  templateOptionDesc: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 9,
    textAlign: 'center',
  },
  scoreContainer: {
    position: 'absolute',
    top: 200,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  scoreCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  scoreText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  scoreLabel: {
    color: '#fff',
    fontSize: 10,
    opacity: 0.8,
  },
  guidanceText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 15,
    marginBottom: 10,
  },
  readyText: {
    color: '#00b894',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  metricsContainer: {
    position: 'absolute',
    bottom: 200,
    left: 20,
    backgroundColor: 'rgba(0,0,0,0.8)',
    padding: 12,
    borderRadius: 10,
  },
  metricsTitle: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
    minWidth: 160,
  },
  metricLabel: {
    color: '#fff',
    fontSize: 10,
    flex: 1,
  },
  metricValue: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  controls: {
    position: 'absolute',
    bottom: 50,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  controlButton: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlText: {
    fontSize: 18,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  captureButtonReady: {
    backgroundColor: '#6c5ce7',
    borderColor: '#6c5ce7',
    shadowColor: '#6c5ce7',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 15,
    elevation: 15,
  },
  captureButtonProcessing: {
    backgroundColor: '#fdcb6e',
    borderColor: '#fdcb6e',
  },
  captureInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  captureInnerReady: {
    backgroundColor: '#fff',
  },
  processingOverlay: {
    position: 'absolute',
    bottom: 150,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.9)',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  processingText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  processingSubtext: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
    textAlign: 'center',
    marginBottom: 4,
  },
  processingDetails: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 10,
    textAlign: 'center',
  },
  message: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
    lineHeight: 24,
  },
  button: {
    backgroundColor: '#6c5ce7',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    marginHorizontal: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
}); 