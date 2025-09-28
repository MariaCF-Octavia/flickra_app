import 'package:flutter/material.dart';
import 'package:camera/camera.dart';
import 'package:flutter_vision/flutter_vision.dart';
import 'package:permission_handler/permission_handler.dart';

List<CameraDescription> cameras = [];

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize cameras
  try {
    cameras = await availableCameras();
  } catch (e) {
    print('Error initializing cameras: $e');
  }
  
  runApp(MyApp());
}

class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Flickra',
      theme: ThemeData(
        primarySwatch: Colors.blue,
        visualDensity: VisualDensity.adaptivePlatformDensity,
      ),
      home: FlickraCamera(),
      debugShowCheckedModeBanner: false,
    );
  }
}

class FlickraCamera extends StatefulWidget {
  @override
  _FlickraCameraState createState() => _FlickraCameraState();
}

class _FlickraCameraState extends State<FlickraCamera> {
  CameraController? controller;
  FlutterVision? vision;
  List<Map<String, dynamic>> detectionResults = [];
  bool isDetecting = false;
  bool isModelLoaded = false;
  double magicScore = 0.0;

  @override
  void initState() {
    super.initState();
    initializeCamera();
    initializeVision();
  }

  Future<void> initializeCamera() async {
    // Request camera permission
    final status = await Permission.camera.request();
    if (status != PermissionStatus.granted) {
      print('Camera permission denied');
      return;
    }

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
      setState(() {});
    } catch (e) {
      print('Error initializing camera: $e');
    }
  }

  Future<void> initializeVision() async {
    vision = FlutterVision();
    // We'll add model loading here once we have the model file
    setState(() {
      isModelLoaded = true; // For now, mark as loaded for UI testing
    });
  }

  void startDetection() {
    if (!isDetecting && controller != null && controller!.value.isInitialized) {
      setState(() {
        isDetecting = true;
      });
      
      controller!.startImageStream((CameraImage image) {
        if (isDetecting) {
          processImage(image);
        }
      });
    }
  }

  void stopDetection() {
    if (isDetecting) {
      setState(() {
        isDetecting = false;
      });
      controller?.stopImageStream();
    }
  }

  Future<void> processImage(CameraImage image) async {
    // This is where we'll add YOLOv8 detection
    // For now, simulate detection results
    setState(() {
      magicScore = (DateTime.now().millisecond % 100).toDouble();
      detectionResults = [
        {
          'label': 'Product Detected',
          'confidence': magicScore / 100,
          'rect': {'x': 100, 'y': 100, 'w': 200, 'h': 200}
        }
      ];
    });
  }

  String getGuidanceText() {
    if (magicScore < 30) {
      return "Move closer to the product";
    } else if (magicScore < 50) {
      return "Adjust lighting - move to window";
    } else if (magicScore < 70) {
      return "Tilt phone slightly";
    } else if (magicScore < 85) {
      return "Almost perfect! Small adjustment needed";
    } else {
      return "Perfect shot! Tap to capture";
    }
  }

  Color getScoreColor() {
    if (magicScore < 50) return Colors.red;
    if (magicScore < 85) return Colors.orange;
    return Colors.green;
  }

  @override
  void dispose() {
    controller?.dispose();
    vision?.closeYoloModel();
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
      body: Stack(
        fit: StackFit.expand,
        children: [
          // Camera Preview
          CameraPreview(controller!),
          
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
                getGuidanceText(),
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
                        content: Text('Perfect shot captured!'),
                        backgroundColor: Colors.green,
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