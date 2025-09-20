import React, { useState, useEffect, useRef } from 'react';
import { Text, View, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';

const { width, height } = Dimensions.get('window');

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [detectedObjects, setDetectedObjects] = useState([]);
  const [lightLevel, setLightLevel] = useState(0);
  const [lightAnalysis, setLightAnalysis] = useState({
    brightness: 0,
    condition: 'Analyzing...',
    quality: 'unknown'
  });
  const cameraRef = useRef(null);
  const analysisInterval = useRef(null);
  const isAnalyzing = useRef(false);

  // React Native compatible image brightness analysis
  const analyzeImageBrightness = async (imageUri) => {
    try {
      // For now, we'll simulate the computer vision analysis
      // In a real implementation, you'd use a library like react-native-image-colors
      // or process the image data directly
      
      // Mock sophisticated analysis based on random but realistic patterns
      const mockBrightness = 80 + Math.random() * 120; // 80-200 range
      const mockDarkRatio = Math.random() * 40; // 0-40% dark pixels
      const mockBrightRatio = Math.random() * 30; // 0-30% bright pixels  
      const mockOverexposedRatio = Math.random() * 15; // 0-15% overexposed
      
      // Determine condition based on brightness
      let condition, quality;
      
      if (mockBrightness < 90) {
        condition = 'Too Dark';
        quality = 'poor';
      } else if (mockBrightness < 110) {
        condition = 'Very Dim';
        quality = 'poor';
      } else if (mockBrightness < 130) {
        condition = 'Dim Indoor';
        quality = 'fair';
      } else if (mockBrightness < 160) {
        condition = 'Good Indoor';
        quality = 'good';
      } else if (mockBrightness < 180) {
        condition = 'Bright Indoor';
        quality = 'good';
      } else if (mockOverexposedRatio > 10) {
        condition = 'Overexposed';
        quality = 'poor';
      } else {
        condition = 'Very Bright';
        quality = 'fair';
      }
      
      // Convert to lux equivalent
      const luxEquivalent = Math.round(mockBrightness * 4);
      
      return {
        brightness: luxEquivalent,
        actualBrightness: Math.round(mockBrightness),
        condition,
        quality,
        darkRatio: Math.round(mockDarkRatio),
        brightRatio: Math.round(mockBrightRatio),
        overexposedRatio: Math.round(mockOverexposedRatio)
      };
    } catch (error) {
      console.log('Analysis error:', error);
      return {
        brightness: 200,
        actualBrightness: 128,
        condition: 'Estimated',
        quality: 'fair',
        darkRatio: 30,
        brightRatio: 30,
        overexposedRatio: 5
      };
    }
  };

  // Lightweight lighting analysis without camera capture
  const analyzeLightingConditions = async () => {
    if (isAnalyzing.current || !cameraRef.current) return;
    
    try {
      isAnalyzing.current = true;
      
      // Instead of taking photos, simulate analysis based on camera conditions
      // In a real implementation, you could use:
      // 1. Camera exposure settings
      // 2. A very low-resolution, silent capture
      // 3. Frame processor analysis
      
      const analysis = await analyzeImageBrightness(null);
      setLightLevel(analysis.brightness);
      setLightAnalysis(analysis);
      
    } catch (error) {
      console.log('Lighting analysis error:', error);
      // Fallback analysis
      setLightLevel(200);
      setLightAnalysis({
        brightness: 200,
        actualBrightness: 128,
        condition: 'Estimated',
        quality: 'fair',
        darkRatio: 25,
        brightRatio: 25,
        overexposedRatio: 5
      });
    } finally {
      isAnalyzing.current = false;
    }
  };

  // Start periodic lighting analysis (no camera sounds)
  useEffect(() => {
    if (permission?.granted) {
      // Wait for camera to initialize
      const startDelay = setTimeout(() => {
        analyzeLightingConditions(); // Initial analysis
        
        // Regular analysis every 3 seconds (less frequent to avoid performance issues)
        analysisInterval.current = setInterval(() => {
          analyzeLightingConditions();
        }, 3000);
      }, 1500);

      return () => {
        clearTimeout(startDelay);
        if (analysisInterval.current) {
          clearInterval(analysisInterval.current);
        }
      };
    }
  }, [permission]);

  // Mock object detection (we'll replace this with Azure Custom Vision later)
  useEffect(() => {
    const interval = setInterval(() => {
      const mockObjects = [
        { label: 'bottle', confidence: 0.85 + Math.random() * 0.1 },
        { label: 'cup', confidence: 0.72 + Math.random() * 0.15 },
        { label: 'phone', confidence: 0.90 + Math.random() * 0.05 },
      ];
      // Randomly show 0-2 objects
      setDetectedObjects(mockObjects.slice(0, Math.floor(Math.random() * 3)));
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  // Enhanced Magic Score Algorithm
  const calculateMagicScore = (objects, analysis) => {
    let score = 0;
    
    // Lighting score (40% of total) - based on quality analysis
    switch (analysis.quality) {
      case 'good':
        score += 40;
        break;
      case 'fair':
        score += 25;
        break;
      case 'poor':
        score += 10;
        break;
      default:
        score += 20; // unknown/estimated
    }
    
    // Additional lighting penalties
    if (analysis.overexposedRatio > 15) score -= 10; // Too much overexposure
    if (analysis.darkRatio > 60) score -= 15; // Too much shadow
    if (analysis.condition === 'Overexposed') score -= 20; // Major overexposure penalty
    
    // Object detection score (60% of total)
    const bestObject = objects.reduce((best, obj) => 
      obj.confidence > (best?.confidence || 0) ? obj : best, null
    );
    
    if (bestObject) {
      score += Math.round(bestObject.confidence * 60);
    }
    
    return Math.min(100, Math.max(0, score));
  };

  const getGuidanceMessage = (score, analysis, objects) => {
    if (score >= 85) return "Perfect! Ready to capture! 🎯";
    
    // Analysis-based lighting guidance
    switch (analysis.condition) {
      case 'Too Dark':
        return "Too dark - find brighter location 💡";
      case 'Very Dim':
        return "Need more light - move to window 🌞";
      case 'Dim Indoor':
        return "Add more lighting for better quality ✨";
      case 'Good Indoor':
      case 'Bright Indoor':
        if (objects.length === 0) return "Great lighting! Point at product 📱";
        return "Perfect lighting - adjust angle 📐";
      case 'Overexposed':
        return "Too bright - avoid direct sunlight ☀️";
      case 'Very Bright':
        if (analysis.overexposedRatio > 10) {
          return "Reduce brightness - move to shade 🌤️";
        }
        return "Very bright - check for glare 🔆";
      default:
        return "Analyzing lighting conditions... 🔍";
    }
  };

  const magicScore = calculateMagicScore(detectedObjects, lightAnalysis);
  const guidanceMessage = getGuidanceMessage(magicScore, lightAnalysis, detectedObjects);

  if (!permission) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>We need your permission to show the camera</Text>
        <TouchableOpacity onPress={requestPermission} style={styles.permissionButton}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView 
        ref={cameraRef}
        style={styles.camera}
        facing="back"
      />
      
      {/* Top Overlay - Magic Score */}
      <View style={styles.topOverlay}>
        <View style={styles.magicScoreContainer}>
          <Text style={[
            styles.magicScore,
            { color: magicScore >= 85 ? '#00FF00' : magicScore >= 50 ? '#FFFF00' : '#FF6B6B' }
          ]}>
            Magic Score: {magicScore}/100
          </Text>
          <Text style={styles.guidanceText}>{guidanceMessage}</Text>
        </View>
      </View>

      {/* Bottom Overlay - Detection Info */}
      <View style={styles.bottomOverlay}>
        <View style={styles.infoContainer}>
          <Text style={[
            styles.lightInfo,
            { color: lightAnalysis.quality === 'good' ? '#00FF7F' : lightAnalysis.quality === 'fair' ? '#FFD700' : '#FF6B6B' }
          ]}>
            Lighting: {lightAnalysis.condition} (Brightness: {lightAnalysis.actualBrightness})
          </Text>
          
          {/* Analysis Details */}
          <View style={styles.analysisDetails}>
            <Text style={styles.analysisText}>
              Quality: {lightAnalysis.quality} • Shadows: {lightAnalysis.darkRatio}% • Highlights: {lightAnalysis.brightRatio}%
            </Text>
            {lightAnalysis.overexposedRatio > 10 && (
              <Text style={styles.warningText}>
                ⚠️ {lightAnalysis.overexposedRatio}% overexposed areas
              </Text>
            )}
          </View>
          
          <Text style={styles.sectionTitle}>Detected Objects:</Text>
          {detectedObjects.length > 0 ? (
            detectedObjects.map((obj, index) => (
              <Text key={index} style={styles.objectText}>
                {obj.label}: {Math.round(obj.confidence * 100)}% confidence
              </Text>
            ))
          ) : (
            <Text style={styles.noObjectsText}>
              Point camera at your product
            </Text>
          )}
          
          {/* Status indicator */}
          <Text style={styles.debugText}>
            Smart Lighting Analysis Active 🧠
          </Text>
        </View>
      </View>

      {/* Capture Button */}
      <View style={styles.captureContainer}>
        <TouchableOpacity 
          style={[
            styles.captureButton,
            { 
              opacity: magicScore >= 85 ? 1 : 0.5,
              backgroundColor: magicScore >= 85 ? '#00FF7F' : '#FF6B6B'
            }
          ]}
          onPress={() => {
            // This would be your actual capture function
            console.log('Capture pressed! Magic Score:', magicScore);
          }}
        >
          <Text style={styles.captureText}>
            {magicScore >= 85 ? 'CAPTURE ✨' : 'ADJUST'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  camera: {
    flex: 1,
  },
  permissionText: {
    textAlign: 'center',
    color: 'white',
    fontSize: 16,
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  permissionButton: {
    backgroundColor: '#FF6B6B',
    padding: 15,
    borderRadius: 10,
    marginHorizontal: 50,
  },
  permissionButtonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
  
  // Top overlay with Magic Score
  topOverlay: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    zIndex: 1,
  },
  magicScoreContainer: {
    backgroundColor: 'rgba(0,0,0,0.85)',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  magicScore: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  guidanceText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '500',
  },

  // Bottom overlay with detection info
  bottomOverlay: {
    position: 'absolute',
    bottom: 120,
    left: 20,
    right: 20,
    zIndex: 1,
  },
  infoContainer: {
    backgroundColor: 'rgba(0,0,0,0.85)',
    padding: 15,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  lightInfo: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    textAlign: 'center',
  },
  analysisDetails: {
    marginBottom: 15,
  },
  analysisText: {
    color: '#B0B0B0',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 5,
  },
  warningText: {
    color: '#FFA500',
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '600',
  },
  sectionTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  objectText: {
    color: '#87CEEB',
    fontSize: 14,
    marginBottom: 4,
    paddingLeft: 10,
  },
  noObjectsText: {
    color: '#FF6B6B',
    fontSize: 14,
    fontStyle: 'italic',
    paddingLeft: 10,
  },
  debugText: {
    color: '#888',
    fontSize: 12,
    marginTop: 10,
    textAlign: 'center',
    fontStyle: 'italic',
  },

  // Capture button
  captureContainer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1,
  },
  captureButton: {
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
    minWidth: 120,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  captureText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
}); 