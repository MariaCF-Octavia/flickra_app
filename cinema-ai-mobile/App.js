import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { Camera, useCameraDevice, useFrameProcessor } from 'react-native-vision-camera';
import { useImageLabeler } from 'react-native-vision-camera-v3-image-labeling';
import { runAsync, runAtTargetFps } from 'react-native-vision-camera';
import { useSharedValue, runOnJS } from 'react-native-reanimated';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function App() {
  const [hasPermission, setHasPermission] = useState(false);
  const [selectedIndustry, setSelectedIndustry] = useState('electronics');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  
  // Real-time detection scores
  const [objectScore, setObjectScore] = useState(0);
  const [lightingScore, setLightingScore] = useState(50);
  const [framingScore, setFramingScore] = useState(0);
  const [magicScore, setMagicScore] = useState(0);
  
  // Detection state
  const [detectedObject, setDetectedObject] = useState(null);
  const [guidanceMessage, setGuidanceMessage] = useState("Point camera at product");
  const [lastDetectionTime, setLastDetectionTime] = useState(0);
  
  const device = useCameraDevice('back');
  const cameraRef = useRef(null);
  
  // Shared values for frame processor
  const isProcessingFrame = useSharedValue(false);
  
  // Industry mappings for ML Kit labels
  const INDUSTRY_KEYWORDS = {
    electronics: [
      'mobile phone', 'cell phone', 'smartphone', 'phone', 'iphone',
      'laptop', 'computer', 'tablet', 'ipad', 'headphones',
      'camera', 'television', 'tv', 'monitor', 'screen',
      'keyboard', 'mouse', 'speaker', 'remote control', 'gamepad'
    ],
    beauty: [
      'bottle', 'cosmetics', 'perfume', 'lipstick', 'makeup',
      'lotion', 'cream', 'spray bottle', 'container',
      'beauty product', 'shampoo', 'conditioner', 'nail polish'
    ],
    food: [
      'apple', 'banana', 'fruit', 'food', 'snack',
      'drink', 'beverage', 'can', 'package', 'box',
      'orange', 'coffee cup', 'bottle', 'sandwich', 'pizza'
    ]
  };

  const industries = [
    { key: 'electronics', label: 'Electronics', icon: '📱' },
    { key: 'beauty', label: 'Beauty', icon: '💄' },
    { key: 'food', label: 'Food', icon: '🍎' }
  ];

  // Initialize ML Kit image labeler
  const { labelImage } = useImageLabeler();

  // Setup on mount
  useEffect(() => {
    requestCameraPermission();
    testConnection();
  }, []);

  // Update Magic Score when components change
  useEffect(() => {
    const newMagicScore = Math.round(
      objectScore * 0.5 +     // 50% object detection
      lightingScore * 0.3 +   // 30% lighting
      framingScore * 0.2      // 20% framing
    );
    setMagicScore(Math.max(0, Math.min(100, newMagicScore)));
    updateGuidanceMessage(newMagicScore);
  }, [objectScore, lightingScore, framingScore]);

  const requestCameraPermission = async () => {
    try {
      const permission = await Camera.requestCameraPermission();
      console.log('Camera permission:', permission);
      setHasPermission(permission === 'granted');
    } catch (error) {
      console.error('Camera permission error:', error);
      setHasPermission(false);
    }
  };

  const testConnection = async () => {
    try {
      const response = await fetch('https://fastapi-app-production-ac48.up.railway.app/health');
      const data = await response.json();
      setIsConnected(data.status === 'healthy');
      console.log('Backend connection:', data.status);
    } catch (error) {
      console.error('Backend connection failed:', error);
      setIsConnected(false);
    }
  };

  // Real-time frame processor with ML Kit
  const frameProcessor = useFrameProcessor((frame) => {
    'worklet';
    
    // Prevent overlapping processing
    if (isProcessingFrame.value) return;
    
    // Process at 2 FPS for performance
    runAtTargetFps(2, () => {
      'worklet';
      
      isProcessingFrame.value = true;
      
      try {
        console.log('Processing frame...');
        
        // Use ML Kit to detect objects
        const labels = labelImage(frame);
        
        // Process results asynchronously
        runAsync(frame, () => {
          'worklet';
          
          if (labels && labels.length > 0) {
            console.log('Detected labels:', labels.map(l => `${l.text} (${Math.round(l.confidence * 100)}%)`));
            
            // Find best match for selected industry
            const industryKeywords = INDUSTRY_KEYWORDS[selectedIndustry];
            let bestMatch = null;
            let highestConfidence = 0;
            
            for (const label of labels) {
              const labelText = label.text.toLowerCase();
              const confidence = label.confidence;
              
              // Check if this label matches our industry
              const isMatch = industryKeywords.some(keyword => 
                labelText.includes(keyword.toLowerCase()) || 
                keyword.toLowerCase().includes(labelText)
              );
              
              if (isMatch && confidence > highestConfidence && confidence > 0.3) {
                bestMatch = label;
                highestConfidence = confidence;
              }
            }
            
            if (bestMatch) {
              // Found matching object
              const objectConfidence = Math.round(bestMatch.confidence * 100);
              const framingEstimate = Math.min(90, objectConfidence + 15);
              const lightingEstimate = estimateLighting();
              
              runOnJS(updateDetectionScores)(
                objectConfidence,
                framingEstimate,
                lightingEstimate,
                bestMatch
              );
            } else {
              // Objects detected but wrong industry
              runOnJS(updateDetectionScores)(
                Math.round(labels[0].confidence * 30), // Low score for wrong type
                20,
                estimateLighting(),
                { text: labels[0].text + ' (wrong type)', confidence: labels[0].confidence }
              );
            }
          } else {
            // No objects detected
            runOnJS(updateDetectionScores)(0, 0, estimateLighting(), null);
          }
          
          isProcessingFrame.value = false;
        });
      } catch (error) {
        console.log('Frame processing error:', error);
        isProcessingFrame.value = false;
      }
    });
  }, [labelImage, selectedIndustry]);

  const estimateLighting = () => {
    // Simple lighting estimation based on time
    const hour = new Date().getHours();
    if (hour >= 9 && hour <= 17) return Math.random() * 20 + 70; // Daytime
    if (hour >= 7 && hour <= 8 || hour >= 18 && hour <= 20) return Math.random() * 30 + 50; // Dawn/dusk
    return Math.random() * 40 + 30; // Night
  };

  const updateDetectionScores = (objScore, frameScore, lightScore, detected) => {
    setObjectScore(objScore);
    setFramingScore(frameScore);
    setLightingScore(Math.round(lightScore));
    setDetectedObject(detected);
    setLastDetectionTime(Date.now());
    
    console.log('Updated scores:', {
      object: objScore,
      framing: frameScore,
      lighting: Math.round(lightScore),
      detected: detected?.text
    });
  };

  const updateGuidanceMessage = (score) => {
    if (score >= 80) {
      setGuidanceMessage("Perfect shot! Tap to capture");
    } else if (score >= 60) {
      setGuidanceMessage("Good! Ready to capture");
    } else if (objectScore === 0) {
      setGuidanceMessage(`Hold ${selectedIndustry} product in view`);
    } else if (detectedObject?.text?.includes('wrong type')) {
      setGuidanceMessage(`Switch to correct industry or hold ${selectedIndustry} product`);
    } else if (objectScore > 0 && objectScore < 50) {
      setGuidanceMessage("Product detected - improve positioning");
    } else if (lightingScore < 50) {
      setGuidanceMessage("Move to brighter area");
    } else {
      setGuidanceMessage("Keep adjusting position...");
    }
  };

  const handleCapture = async () => {
    if (!isConnected) {
      Alert.alert('Connection Error', 'Cannot connect to Lumira servers. Check internet connection.');
      return;
    }

    if (magicScore < 50) {
      const improvements = [];
      if (objectScore === 0) improvements.push(`• Point at ${selectedIndustry} product`);
      if (objectScore > 0 && objectScore < 50) improvements.push('• Improve product positioning');
      if (lightingScore < 50) improvements.push('• Move to brighter lighting');
      if (framingScore < 50) improvements.push('• Center the product better');
      
      Alert.alert(
        'Improve Your Shot',
        `Magic Score: ${magicScore}%\n\nSuggestions:\n${improvements.join('\n')}\n\nCapture anyway?`,
        [
          { text: 'Keep Improving', style: 'default' },
          { text: 'Capture Now', onPress: () => capturePhoto() }
        ]
      );
      return;
    }

    await capturePhoto();
  };

  const capturePhoto = async () => {
    if (!cameraRef.current) {
      Alert.alert('Error', 'Camera not ready');
      return;
    }
    
    setIsProcessing(true);
    
    try {
      console.log('Taking photo...');
      const photo = await cameraRef.current.takePhoto({
        quality: 0.8,
        enableAutoDistortionCorrection: true,
      });

      console.log('Photo captured:', photo.path);
      
      if (photo?.path) {
        // Convert to base64 for backend
        const base64Image = await convertImageToBase64(photo.path);
        await sendToBackend(base64Image);
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Camera Error', 'Failed to capture image. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const convertImageToBase64 = async (imagePath) => {
    // For now, return placeholder - in production you'd use react-native-fs
    // or similar to convert the image file to base64
    return `data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=`;
  };

  const sendToBackend = async (base64Image) => {
    try {
      console.log('Sending to backend...');
      
      const requestData = {
        image_data: base64Image,
        business_type: selectedIndustry,
        style: 'modern',
        user_intent: `Professional ${selectedIndustry} commercial with AI object detection`,
        magic_score: magicScore,
        detection_metadata: {
          detected_object: detectedObject?.text || 'unknown',
          confidence: detectedObject?.confidence || 0,
          object_score: objectScore,
          framing_score: framingScore,
          lighting_score: lightingScore,
          detection_timestamp: lastDetectionTime
        }
      };

      const response = await fetch('https://fastapi-app-production-ac48.up.railway.app/api/generate-commercial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      });

      const result = await response.json();
      console.log('Backend response:', result.success);
      
      if (result.success) {
        Alert.alert(
          '🎬 Commercial Generated!',
          `✅ AI Detection Results:\n\n` +
          `🎯 Object: ${detectedObject?.text || 'Product'}\n` +
          `📊 Confidence: ${Math.round((detectedObject?.confidence || 0) * 100)}%\n` +
          `💡 Lighting: ${lightingScore}%\n` +
          `📐 Framing: ${framingScore}%\n\n` +
          `⭐ Final Magic Score: ${magicScore}%\n\n` +
          `🔧 APIs used: ${result.summary?.apis_used || 0}/${result.summary?.total_apis || 4}`,
          [{ text: 'Done' }]
        );
      } else {
        Alert.alert('Processing Issue', result.message || 'Something went wrong');
      }
    } catch (error) {
      console.error('Backend error:', error);
      Alert.alert('Connection Error', 'Failed to connect to Lumira servers.');
    }
  };

  // Permission and device checks
  if (!hasPermission) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Camera permission required for AI object detection</Text>
        <TouchableOpacity onPress={requestCameraPermission} style={styles.button}>
          <Text style={styles.buttonText}>Grant Camera Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#6c5ce7" />
        <Text style={styles.message}>Loading camera...</Text>
      </View>
    );
  }

  const getScoreColor = (score) => {
    if (score >= 70) return '#00b894';
    if (score >= 50) return '#fdcb6e';
    return '#e17055';
  };

  const timeSinceDetection = Math.round((Date.now() - lastDetectionTime) / 1000);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <Camera
        ref={cameraRef}
        style={styles.camera}
        device={device}
        isActive={true}
        frameProcessor={frameProcessor}
        photo={true}
      >
        {/* Connection Status */}
        <View style={styles.connectionStatus}>
          <View style={[styles.connectionDot, { backgroundColor: isConnected ? '#00b894' : '#e17055' }]} />
          <Text style={styles.connectionText}>
            {isConnected ? 'Connected' : 'Offline'}
          </Text>
        </View>

        {/* Industry Selection */}
        <View style={styles.industrySelector}>
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
        </View>

        {/* AI Detection Feedback */}
        {detectedObject && (
          <View style={styles.detectionFeedback}>
            <Text style={styles.detectionText}>
              🤖 {detectedObject.text}
            </Text>
            <Text style={styles.confidenceText}>
              {Math.round(detectedObject.confidence * 100)}% confidence
            </Text>
          </View>
        )}

        {/* Guidance Frame */}
        <View style={[styles.guidanceFrame, { borderColor: getScoreColor(magicScore) }]}>
          <Text style={styles.frameText}>
            {detectedObject ? 
              `✅ ${detectedObject.text.split(' ')[0]} detected` : 
              `Point at ${selectedIndustry} product`
            }
          </Text>
        </View>

        {/* Magic Score Display */}
        <View style={styles.scoreContainer}>
          <View style={[styles.scoreCircle, { borderColor: getScoreColor(magicScore) }]}>
            <Text style={[styles.scoreText, { color: getScoreColor(magicScore) }]}>
              {magicScore}%
            </Text>
            <Text style={styles.scoreLabel}>Magic Score</Text>
          </View>
          
          <Text style={styles.guidanceText}>{guidanceMessage}</Text>
          
          {magicScore >= 60 && (
            <Text style={styles.readyText}>✨ Ready to capture!</Text>
          )}
        </View>

        {/* Real-time AI Metrics */}
        <View style={styles.metricsContainer}>
          <Text style={styles.metricsTitle}>🤖 Live AI Analysis:</Text>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>🎯 Object:</Text>
            <Text style={[styles.metricValue, { color: getScoreColor(objectScore) }]}>
              {objectScore}%
            </Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>💡 Lighting:</Text>
            <Text style={[styles.metricValue, { color: getScoreColor(lightingScore) }]}>
              {lightingScore}%
            </Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>📐 Framing:</Text>
            <Text style={[styles.metricValue, { color: getScoreColor(framingScore) }]}>
              {framingScore}%
            </Text>
          </View>
          <Text style={styles.updateText}>
            Updated {timeSinceDetection}s ago
          </Text>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity style={styles.controlButton} onPress={testConnection}>
            <Text style={styles.controlText}>🔌</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.captureButton,
              magicScore >= 50 && styles.captureButtonReady,
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
                magicScore >= 50 && styles.captureInnerReady
              ]} />
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.controlButton}
            onPress={() => setSelectedIndustry(current => {
              const industries = ['electronics', 'beauty', 'food'];
              const currentIndex = industries.indexOf(current);
              return industries[(currentIndex + 1) % industries.length];
            })}
          >
            <Text style={styles.controlText}>🔄</Text>
          </TouchableOpacity>
        </View>

        {/* Processing Overlay */}
        {isProcessing && (
          <View style={styles.processingOverlay}>
            <Text style={styles.processingText}>
              Creating AI-powered commercial...
            </Text>
            <Text style={styles.processingSubtext}>
              Using detection: {detectedObject?.text || 'Product'} • Score: {magicScore}%
            </Text>
          </View>
        )}
      </Camera>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
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
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  camera: {
    flex: 1,
    width: screenWidth,
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
  industrySelector: {
    position: 'absolute',
    top: 80,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  industryButton: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    minWidth: 80,
  },
  industryButtonActive: {
    backgroundColor: '#6c5ce7',
    borderColor: '#6c5ce7',
  },
  industryIcon: {
    fontSize: 16,
    marginBottom: 2,
  },
  industryButtonText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
    fontWeight: '500',
  },
  industryButtonTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  detectionFeedback: {
    position: 'absolute',
    top: 120,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  detectionText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
    backgroundColor: 'rgba(0,200,100,0.9)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 15,
    marginBottom: 4,
  },
  confidenceText: {
    color: '#fff',
    fontSize: 12,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  guidanceFrame: {
    position: 'absolute',
    top: '35%',
    left: '15%',
    right: '15%',
    bottom: '45%',
    borderWidth: 3,
    borderStyle: 'dashed',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  frameText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  scoreContainer: {
    position: 'absolute',
    top: 180,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  scoreCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  scoreText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  scoreLabel: {
    color: '#fff',
    fontSize: 11,
    opacity: 0.8,
  },
  guidanceText: {
    color: '#fff',
    fontSize: 16,
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
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  metricsContainer: {
    position: 'absolute',
    bottom: 200,
    left: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 12,
    borderRadius: 10,
  },
  metricsTitle: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
    minWidth: 150,
  },
  metricLabel: {
    color: '#fff',
    fontSize: 11,
  },
  metricValue: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  updateText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 9,
    marginTop: 4,
    textAlign: 'center',
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
    fontSize: 20,
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
    backgroundColor: 'rgba(0,0,0,0.8)',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  processingText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  processingSubtext: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
}); 