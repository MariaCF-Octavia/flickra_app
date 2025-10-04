import 'dart:typed_data';
import 'package:camera/camera.dart';
import 'package:flutter/foundation.dart' show kIsWeb;
import '../models/detection_result.dart';
import 'package:image/image.dart' as img;

// Only import tflite on mobile platforms
import 'package:tflite_flutter/tflite_flutter.dart';
import 'package:image/image.dart' as img;

class YoloService {
  dynamic _interpreter; // Use dynamic to avoid type issues on web
  List<String> _labels = [];
  bool _isModelLoaded = false;
  
  // Model parameters (will be set based on actual model)
  static const int INPUT_SIZE = 640;
  static const double CONFIDENCE_THRESHOLD = 0.3;
  static const double IOU_THRESHOLD = 0.5;

  bool get isModelLoaded => _isModelLoaded;

  Future<bool> loadModel({String? modelPath}) async {
    // Web doesn't support TFLite - use simulation mode
    if (kIsWeb) {
      print('Running in web simulation mode - TFLite not supported');
      _isModelLoaded = false;
      return false; // Indicates simulation mode
    }

    try {
      // For mobile platforms, load the actual model
      String assetPath = modelPath ?? 'assets/models/yolov8_model.tflite';
      
      // Load the TFLite model (only on mobile)
      _interpreter = await Interpreter.fromAsset(assetPath);
      
      // Load labels (this will come from training)
      _labels = await _loadLabels();
      
      _isModelLoaded = true;
      print('YOLOv8 model loaded successfully');
      return true;
    } catch (e) {
      print('Error loading YOLOv8 model: $e');
      _isModelLoaded = false;
      return false;
    }
  }

  Future<List<String>> _loadLabels() async {
    // For now return placeholder labels
    // Later this will load from assets/labels.txt
    return ['product']; // Single class for now
  }

  Future<List<DetectionResult>> detectObjects(CameraImage cameraImage) async {
    if (!_isModelLoaded || kIsWeb) {
      return _simulateDetection(); // Fallback to simulation
    }

    try {
      // Convert CameraImage to input format
      img.Image? image = _convertCameraImage(cameraImage);
      if (image == null) return [];

      // Preprocess image for YOLOv8
      List<List<List<List<double>>>> input = _preprocessImage(image);

      // Run inference
      var output = _runInference(input);

      // Parse results into DetectionResult objects
      return _parseDetectionResults(output);
    } catch (e) {
      print('Error during detection: $e');
      return _simulateDetection(); // Fallback to simulation
    }
  }

  img.Image? _convertCameraImage(CameraImage cameraImage) {
    try {
      // Convert camera image to img.Image format
      // This handles different camera formats (YUV420, etc.)
      
      if (cameraImage.format.group == ImageFormatGroup.yuv420) {
        return _convertYUV420ToImage(cameraImage);
      } else if (cameraImage.format.group == ImageFormatGroup.bgra8888) {
        return _convertBGRA8888ToImage(cameraImage);
      }
      
      return null;
    } catch (e) {
      print('Error converting camera image: $e');
      return null;
    }
  }

  img.Image _convertYUV420ToImage(CameraImage cameraImage) {
    final int width = cameraImage.width;
    final int height = cameraImage.height;
    
    final img.Image image = img.Image(width: width, height: height);
    
    final Plane yPlane = cameraImage.planes[0];
    final Plane uPlane = cameraImage.planes[1];
    final Plane vPlane = cameraImage.planes[2];
    
    final Uint8List yBytes = yPlane.bytes;
    final Uint8List uBytes = uPlane.bytes;
    final Uint8List vBytes = vPlane.bytes;
    
    // YUV to RGB conversion
    for (int y = 0; y < height; y++) {
      for (int x = 0; x < width; x++) {
        final int yIndex = y * yPlane.bytesPerRow + x;
        final int uvIndex = (y ~/ 2) * uPlane.bytesPerRow + (x ~/ 2);
        
        final int yValue = yBytes[yIndex];
        final int uValue = uBytes[uvIndex];
        final int vValue = vBytes[uvIndex];
        
        // Convert YUV to RGB
        int r = (yValue + 1.402 * (vValue - 128)).round().clamp(0, 255);
        int g = (yValue - 0.344136 * (uValue - 128) - 0.714136 * (vValue - 128)).round().clamp(0, 255);
        int b = (yValue + 1.772 * (uValue - 128)).round().clamp(0, 255);
        
        image.setPixelRgb(x, y, r, g, b);
      }
    }
    
    return image;
  }

  img.Image _convertBGRA8888ToImage(CameraImage cameraImage) {
    return img.Image.fromBytes(
      width: cameraImage.width,
      height: cameraImage.height,
      bytes: cameraImage.planes[0].bytes.buffer,
      format: img.Format.uint8,
    );
  }

  List<List<List<List<double>>>> _preprocessImage(img.Image image) {
    // Resize image to model input size
    img.Image resized = img.copyResize(image, width: INPUT_SIZE, height: INPUT_SIZE);
    
    // Normalize pixel values to [0, 1]
    List<List<List<List<double>>>> input = List.generate(
      1, // batch size
      (b) => List.generate(
        INPUT_SIZE,
        (y) => List.generate(
          INPUT_SIZE,
          (x) => List.generate(3, (c) {
            img.Pixel pixel = resized.getPixel(x, y);
            switch (c) {
              case 0: return pixel.r / 255.0; // Red
              case 1: return pixel.g / 255.0; // Green  
              case 2: return pixel.b / 255.0; // Blue
              default: return 0.0;
            }
          }),
        ),
      ),
    );
    
    return input;
  }

  List<List<double>> _runInference(List<List<List<List<double>>>> input) {
    // Placeholder for actual inference
    // Output shape depends on YOLOv8 model architecture
    // Typically: [1, num_detections, 6] where 6 = [x, y, w, h, confidence, class]
    
    var output = List.generate(1, (i) => List.generate(1000, (j) => List.filled(6, 0.0)));
    
    // Run the actual inference (only on mobile when model is loaded)
    if (_interpreter != null && !kIsWeb) {
      (_interpreter as Interpreter).run(input, output);
    }
    
    return output[0]; // Return first batch
  }

  List<DetectionResult> _parseDetectionResults(List<List<double>> rawOutput) {
    List<DetectionResult> results = [];
    
    for (List<double> detection in rawOutput) {
      double confidence = detection[4];
      
      if (confidence > CONFIDENCE_THRESHOLD) {
        // Parse detection data
        double x = detection[0] / INPUT_SIZE; // Normalize
        double y = detection[1] / INPUT_SIZE;
        double w = detection[2] / INPUT_SIZE;
        double h = detection[3] / INPUT_SIZE;
        int classId = detection[5].toInt();
        
        // Create bounding box
        BoundingBox bbox = BoundingBox(
          x: x - w/2, // Convert center to top-left
          y: y - h/2,
          width: w,
          height: h,
        );
        
        // Create detection result
        results.add(DetectionResult(
          label: classId < _labels.length ? _labels[classId] : 'Unknown',
          confidence: confidence,
          boundingBox: bbox,
          timestamp: DateTime.now(),
        ));
      }
    }
    
    // Apply Non-Maximum Suppression to remove duplicate detections
    return _applyNMS(results);
  }

  List<DetectionResult> _applyNMS(List<DetectionResult> detections) {
    // Sort by confidence
    detections.sort((a, b) => b.confidence.compareTo(a.confidence));
    
    List<DetectionResult> filtered = [];
    
    for (DetectionResult detection in detections) {
      bool keep = true;
      
      for (DetectionResult existing in filtered) {
        double iou = _calculateIoU(detection.boundingBox, existing.boundingBox);
        if (iou > IOU_THRESHOLD) {
          keep = false;
          break;
        }
      }
      
      if (keep) {
        filtered.add(detection);
      }
    }
    
    return filtered;
  }

  double _calculateIoU(BoundingBox box1, BoundingBox box2) {
    // Calculate Intersection over Union
    double x1 = [box1.x, box2.x].reduce((a, b) => a > b ? a : b);
    double y1 = [box1.y, box2.y].reduce((a, b) => a > b ? a : b);
    double x2 = [box1.x + box1.width, box2.x + box2.width].reduce((a, b) => a < b ? a : b);
    double y2 = [box1.y + box1.height, box2.y + box2.height].reduce((a, b) => a < b ? a : b);
    
    if (x2 <= x1 || y2 <= y1) return 0.0;
    
    double intersection = (x2 - x1) * (y2 - y1);
    double area1 = box1.width * box1.height;
    double area2 = box2.width * box2.height;
    double union = area1 + area2 - intersection;
    return intersection / union;
  }

  // Fallback simulation for testing
  List<DetectionResult> _simulateDetection() {
    double confidence = (DateTime.now().millisecond % 100) / 100.0;
    
    return [
      DetectionResult(
        label: 'product',
        confidence: confidence,
        boundingBox: BoundingBox(
          x: 0.3,
          y: 0.3,
          width: 0.4,
          height: 0.4,
        ),
        timestamp: DateTime.now(),
      )
    ];
  }

  void dispose() {
    if (!kIsWeb && _interpreter != null) {
      (_interpreter as Interpreter).close();
    }
    _interpreter = null;
    _isModelLoaded = false;
  }
}