class DetectionResult {
  final String label;
  final double confidence;
  final BoundingBox boundingBox;
  final DateTime timestamp;

  DetectionResult({
    required this.label,
    required this.confidence,
    required this.boundingBox,
    required this.timestamp,
  });

  // Convert detection confidence to Magic Score (0-100)
  double get magicScore {
    // Base score from confidence
    double score = confidence * 100;
    
    // Adjust based on bounding box quality
    double sizeBonus = _calculateSizeBonus();
    double centeringBonus = _calculateCenteringBonus();
    
    // Combine scores with weights
    double finalScore = (score * 0.7) + (sizeBonus * 0.2) + (centeringBonus * 0.1);
    
    return finalScore.clamp(0.0, 100.0);
  }

  double _calculateSizeBonus() {
    // Bonus for objects that are not too small or too large
    double area = boundingBox.width * boundingBox.height;
    if (area > 0.1 && area < 0.6) {
      return 20.0; // Good size
    } else if (area > 0.05 && area < 0.8) {
      return 10.0; // Acceptable size
    }
    return 0.0; // Too small or too large
  }

  double _calculateCenteringBonus() {
    // Bonus for objects near center of frame
    double centerX = boundingBox.x + (boundingBox.width / 2);
    double centerY = boundingBox.y + (boundingBox.height / 2);
    
    double distanceFromCenter = ((centerX - 0.5).abs() + (centerY - 0.5).abs()) / 2;
    
    if (distanceFromCenter < 0.2) {
      return 15.0; // Well centered
    } else if (distanceFromCenter < 0.4) {
      return 8.0; // Reasonably centered
    }
    return 0.0; // Off center
  }

  String getGuidanceText() {
    if (confidence < 0.3) {
      return "Move closer to the product";
    } else if (magicScore < 30) {
      return "Improve lighting - move to window";
    } else if (magicScore < 50) {
      return "Center the product in frame";
    } else if (magicScore < 70) {
      return "Tilt phone slightly for better angle";
    } else if (magicScore < 85) {
      return "Almost perfect! Small adjustment needed";
    } else {
      return "Perfect shot! Tap to capture";
    }
  }

  Map<String, dynamic> toJson() {
    return {
      'label': label,
      'confidence': confidence,
      'boundingBox': boundingBox.toJson(),
      'timestamp': timestamp.toIso8601String(),
      'magicScore': magicScore,
    };
  }
}

class BoundingBox {
  final double x; // Normalized (0-1)
  final double y; // Normalized (0-1) 
  final double width; // Normalized (0-1)
  final double height; // Normalized (0-1)

  BoundingBox({
    required this.x,
    required this.y,
    required this.width,
    required this.height,
  });

  // Convert to pixel coordinates for display
  BoundingBox toPixelCoordinates(double imageWidth, double imageHeight) {
    return BoundingBox(
      x: x * imageWidth,
      y: y * imageHeight,
      width: width * imageWidth,
      height: height * imageHeight,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'x': x,
      'y': y,
      'width': width,
      'height': height,
    };
  }

  factory BoundingBox.fromJson(Map<String, dynamic> json) {
    return BoundingBox(
      x: json['x'].toDouble(),
      y: json['y'].toDouble(),
      width: json['width'].toDouble(),
      height: json['height'].toDouble(),
    );
  }
}

class TrainingData {
  final String productName;
  final List<String> imagePaths;
  final String modelId;
  final TrainingStatus status;
  final DateTime createdAt;
  final DateTime? completedAt;

  TrainingData({
    required this.productName,
    required this.imagePaths,
    required this.modelId,
    required this.status,
    required this.createdAt,
    this.completedAt,
  });

  Map<String, dynamic> toJson() {
    return {
      'productName': productName,
      'imagePaths': imagePaths,
      'modelId': modelId,
      'status': status.toString(),
      'createdAt': createdAt.toIso8601String(),
      'completedAt': completedAt?.toIso8601String(),
    };
  }
}

enum TrainingStatus {
  uploading,
  processing,
  training,
  completed,
  failed,
} 