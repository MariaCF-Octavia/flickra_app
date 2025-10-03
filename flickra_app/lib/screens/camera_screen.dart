import 'package:flutter/material.dart';
import 'package:camera/camera.dart';
import 'package:permission_handler/permission_handler.dart';
import '../services/yolo_service.dart';
import '../models/detection_result.dart';

class CameraScreen extends StatefulWidget {
  @override
  _CameraScreenState createState() => _CameraScreenState();
}

class _CameraScreenState extends State<CameraScreen> {
  CameraController? controller;
  YoloService yoloService = YoloService();
  List<DetectionResult> detectionResults = [];
  bool isDetecting = false;
  bool isModelLoaded = false;
  double magicScore = 0.0;
  String guidanceText = "Press play to start detection";
  bool _isProcessing = false;

  @override
  void initState() {
    super.initState();
    initializeCamera();
    initializeYolo();
  }

  Future<void> initializeCamera() async {
    // Request camera permission
    final status = await Permission.camera.request();
    if (status != PermissionStatus.granted) {
      print('Camera permission denied');
      return;
    }

    // Get available cameras
    final cameras = await availableCameras();
    
    if (cameras.isEmpty) {
      print('No cameras available');
      return;
    }

    controller = CameraController(
      cameras[0], // Use first available camera
      ResolutionPreset.medium,
      enableAudio: false,
    );

    try {
      await controller!.initialize();
      if (mounted) {
        setState(() {});
      }
    } catch (e) {
      print('Error initializing camera: $e');
    }
  }

  Future<void> initializeYolo() async {
    try {
      // Try to load the model, will fallback to simulation if no model exists
      bool loaded = await yoloService.loadModel();
      setState(() {
        isModelLoaded = loaded;
        guidanceText = loaded 
          ? "AI Director ready! Press play to start" 
          : "Using simulation mode - press play to start";
      });
    } catch (e) {
      print('Error initializing YOLO: $e');
      setState(() {
        isModelLoaded = false;
        guidanceText = "Using simulation mode - press play to start";
      });
    }
  }

  void startDetection() {
    if (!isDetecting && controller != null && controller!.value.isInitialized) {
      setState(() {
        isDetecting = true;
      });
      
      controller!.startImageStream((CameraImage image) {
        if (isDetecting && !_isProcessing) {
          processImage(image);
        }
      });
    }
  }

  void stopDetection() {
    if (isDetecting) {
      setState(() {
        isDetecting = false;
        guidanceText = "Detection stopped - press play to restart";
        magicScore = 0.0;
      });
      controller?.stopImageStream();
    }
  }

  Future<void> processImage(CameraImage image) async {
    if (_isProcessing) return;
    
    _isProcessing = true;
    
    try {
      // Use YoloService for detection
      List<DetectionResult> results = await yoloService.detectObjects(image);
      
      if (mounted) {
        setState(() {
          detectionResults = results;
          
          if (results.isNotEmpty) {
            // Use the best detection (highest confidence)
            DetectionResult bestDetection = results.reduce((a, b) => 
              a.confidence > b.confidence ? a : b);
            
            magicScore = bestDetection.magicScore;
            guidanceText = bestDetection.getGuidanceText();
          } else {
            magicScore = 0.0;
            guidanceText = "No product detected - show your product to camera";
          }
        });
      }
    } catch (e) {
      print('Error processing image: $e');
    } finally {
      _isProcessing = false;
    }
  }

  Color getScoreColor() {
    if (magicScore < 50) return Colors.red;
    if (magicScore < 85) return Colors.orange;
    return Colors.green;
  }

  Widget _buildDetectionOverlay() {
    if (detectionResults.isEmpty || controller == null) return Container();
    
    return CustomPaint(
      size: Size.infinite,
      painter: DetectionPainter(
        detectionResults: detectionResults,
        previewSize: controller!.value.previewSize!,
        screenSize: MediaQuery.of(context).size,
      ),
    );
  }

  @override
  void dispose() {
    stopDetection();
    controller?.dispose();
    yoloService.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (controller == null || !controller!.value.isInitialized) {
      return Scaffold(
        backgroundColor: Colors.black,
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              CircularProgressIndicator(color: Colors.blue),
              SizedBox(height: 20),
              Text(
                'Initializing Camera...',
                style: TextStyle(color: Colors.white, fontSize: 18),
              ),
            ],
          ),
        ),
      );
    }

    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          'AI Director',
          style: TextStyle(color: Colors.white),
        ),
      ),
      body: Stack(
        fit: StackFit.expand,
        children: [
          // Camera Preview
          CameraPreview(controller!),
          
          // Detection Overlay (bounding boxes)
          _buildDetectionOverlay(),
          
          // Model Status Indicator
          Positioned(
            top: 20,
            right: 20,
            child: Container(
              padding: EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: isModelLoaded ? Colors.green : Colors.orange,
                borderRadius: BorderRadius.circular(20),
              ),
              child: Text(
                isModelLoaded ? 'AI Ready' : 'Simulation',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ),
          
          // Magic Score Display
          Positioned(
            top: 80,
            left: 20,
            right: 20,
            child: Container(
              padding: EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.black.withOpacity(0.7),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Column(
                children: [
                  Text(
                    'Magic Score',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  SizedBox(height: 8),
                  Text(
                    '${magicScore.toInt()}/100',
                    style: TextStyle(
                      color: getScoreColor(),
                      fontSize: 32,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  SizedBox(height: 8),
                  LinearProgressIndicator(
                    value: magicScore / 100,
                    backgroundColor: Colors.grey,
                    valueColor: AlwaysStoppedAnimation<Color>(getScoreColor()),
                  ),
                ],
              ),
            ),
          ),
          
          // Guidance Text
          Positioned(
            bottom: 150,
            left: 20,
            right: 20,
            child: Container(
              padding: EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.black.withOpacity(0.7),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                guidanceText,
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 18,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
          ),
          
          // Control Buttons
          Positioned(
            bottom: 40,
            left: 0,
            right: 0,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                // Detection Toggle
                GestureDetector(
                  onTap: isDetecting ? stopDetection : startDetection,
                  child: Container(
                    width: 70,
                    height: 70,
                    decoration: BoxDecoration(
                      color: isDetecting ? Colors.red : Colors.green,
                      shape: BoxShape.circle,
                      border: Border.all(color: Colors.white, width: 3),
                    ),
                    child: Icon(
                      isDetecting ? Icons.stop : Icons.play_arrow,
                      color: Colors.white,
                      size: 35,
                    ),
                  ),
                ),
                
                // Capture Button
                GestureDetector(
                  onTap: magicScore >= 85 ? () {
                    // Capture image logic here
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text('Perfect shot captured! Magic Score: ${magicScore.toInt()}'),
                        backgroundColor: Colors.green,
                        duration: Duration(seconds: 2),
                      ),
                    );
                  } : null,
                  child: Container(
                    width: 80,
                    height: 80,
                    decoration: BoxDecoration(
                      color: magicScore >= 85 ? Colors.blue : Colors.grey,
                      shape: BoxShape.circle,
                      border: Border.all(color: Colors.white, width: 4),
                    ),
                    child: Icon(
                      Icons.camera_alt,
                      color: Colors.white,
                      size: 40,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// Custom painter for drawing detection bounding boxes
class DetectionPainter extends CustomPainter {
  final List<DetectionResult> detectionResults;
  final Size previewSize;
  final Size screenSize;

  DetectionPainter({
    required this.detectionResults,
    required this.previewSize,
    required this.screenSize,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = Colors.blue
      ..style = PaintingStyle.stroke
      ..strokeWidth = 3.0;

    final textPainter = TextPainter(
      textDirection: TextDirection.ltr,
    );

    for (DetectionResult detection in detectionResults) {
      // Convert normalized coordinates to screen coordinates
      final bbox = detection.boundingBox.toPixelCoordinates(
        screenSize.width,
        screenSize.height,
      );

      // Draw bounding box
      final rect = Rect.fromLTWH(
        bbox.x,
        bbox.y,
        bbox.width,
        bbox.height,
      );
      
      // Change color based on confidence
      paint.color = detection.confidence > 0.7 ? Colors.green : 
                   detection.confidence > 0.4 ? Colors.orange : Colors.red;
      
      canvas.drawRect(rect, paint);

      // Draw label
      textPainter.text = TextSpan(
        text: '${detection.label} ${(detection.confidence * 100).toInt()}%',
        style: TextStyle(
          color: paint.color,
          fontSize: 16,
          fontWeight: FontWeight.bold,
        ),
      );
      
      textPainter.layout();
      textPainter.paint(
        canvas,
        Offset(bbox.x, bbox.y - 25),
      );
    }
  }

  @override
  bool shouldRepaint(DetectionPainter oldDelegate) {
    return detectionResults != oldDelegate.detectionResults;
  }
} 