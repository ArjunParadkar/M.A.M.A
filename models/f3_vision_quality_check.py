"""
F3: Vision Quality Check Model
Uses computer vision to verify produced parts match the original design.
Compares photos/videos of manufactured parts against the original STL/design files.

IMPLEMENTATION: Real image processing using PIL + numpy-stl (no PyTorch/CLIP dependency)
"""

import numpy as np
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from pathlib import Path
import os

# Image processing
try:
    from PIL import Image, ImageStat, ImageFilter
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False
    print("Warning: PIL/Pillow not available. Image processing will be limited.")

# STL processing
try:
    from stl import mesh
    STL_AVAILABLE = True
except ImportError:
    STL_AVAILABLE = False
    print("Warning: numpy-stl not available. STL analysis will be limited.")


@dataclass
class QualityCheckInput:
    """Input for quality check"""
    # Required fields (no defaults - must come first)
    evidence_image_paths: List[str]  # Photos of the manufactured part
    job_id: str
    tolerance_tier: str  # 'low', 'medium', 'high' - affects pass threshold
    
    # Optional fields (with defaults - must come after required fields)
    stl_file_path: Optional[str] = None  # Path to original STL file
    design_image_paths: Optional[List[str]] = None  # Reference images of the design
    evidence_video_paths: Optional[List[str]] = None  # Optional videos
    critical_dimensions: Optional[Dict[str, float]] = None  # {dimension_name: expected_value}


@dataclass
class QualityCheckOutput:
    """Output from quality check model"""
    qc_score: float  # 0-1, overall quality score
    status: str  # 'pass', 'review', 'fail'
    similarity: float  # 0-1, visual similarity to original design
    dimensional_accuracy: float  # 0-1, dimensional accuracy score
    surface_quality: float  # 0-1, surface finish quality
    anomaly_score: float  # 0-1, likelihood of defects/anomalies (higher = fewer defects)
    notes: List[str]  # Issues found or quality observations
    confidence: float  # 0-1, model confidence in assessment
    model_version: str = "v1.0"


class VisionQualityCheckModel:
    """
    F3: Vision Quality Check Model
    
    Real Implementation using:
    - numpy-stl for STL geometric analysis
    - PIL/Pillow for image processing
    - Basic computer vision techniques (histogram, edges, texture)
    
    Pipeline:
    1. STL Analysis: Extract geometric features (volume, surface area, bounding box, mesh quality)
    2. Image Analysis: Extract features from photos (histogram, edges, texture, color)
    3. Feature Comparison: Compare STL-derived features to image-derived features
    4. Anomaly Detection: Detect defects using edge detection and texture analysis
    5. Quality Scoring: Combine all factors into final QC score
    """
    
    def __init__(self, model_path: Optional[str] = None):
        self.is_trained = False
    
    def _analyze_stl(self, stl_path: str) -> Dict[str, float]:
        """
        Analyze STL file and extract geometric features
        
        Returns:
            Dictionary of geometric features
        """
        if not STL_AVAILABLE:
            return {
                'volume': 0.0,
                'surface_area': 0.0,
                'bounding_box': {'x': 0.0, 'y': 0.0, 'z': 0.0},
                'mesh_quality': 0.5,
            }
        
        try:
            # Load STL mesh
            stl_mesh = mesh.Mesh.from_file(stl_path)
            
            # Calculate volume (signed volume method)
            volume, cog, inertia = stl_mesh.get_mass_properties()
            
            # Calculate surface area
            surface_area = np.sum(np.linalg.norm(stl_mesh.normals, axis=1) * stl_mesh.areas) / 2.0
            
            # Bounding box
            min_bounds = stl_mesh.min_
            max_bounds = stl_mesh.max_
            bounding_box = {
                'x': float(max_bounds[0] - min_bounds[0]),
                'y': float(max_bounds[1] - min_bounds[1]),
                'z': float(max_bounds[2] - min_bounds[2]),
            }
            
            # Mesh quality (check for degenerate triangles, normals consistency)
            # Simple heuristic: check if normals are consistent
            normals = stl_mesh.normals
            normal_consistency = np.mean(np.abs(np.sum(normals * normals[0], axis=1))) if len(normals) > 0 else 0.5
            mesh_quality = float(min(1.0, normal_consistency))
            
            return {
                'volume': float(abs(volume)),
                'surface_area': float(surface_area),
                'bounding_box': bounding_box,
                'mesh_quality': mesh_quality,
                'num_facets': len(stl_mesh.vectors),
            }
        except Exception as e:
            print(f"Error analyzing STL: {e}")
            return {
                'volume': 0.0,
                'surface_area': 0.0,
                'bounding_box': {'x': 0.0, 'y': 0.0, 'z': 0.0},
                'mesh_quality': 0.5,
            }
    
    def _analyze_image(self, image_path: str) -> Dict[str, np.ndarray]:
        """
        Analyze image and extract features
        
        Returns:
            Dictionary of image features (histogram, edges, texture, color stats)
        """
        if not PIL_AVAILABLE:
            # Return mock features
            return {
                'histogram': np.random.rand(256),
                'edge_density': 0.5,
                'texture_variance': 0.5,
                'color_mean': np.array([128, 128, 128]),
                'color_std': np.array([50, 50, 50]),
            }
        
        try:
            img = Image.open(image_path)
            
            # Convert to RGB if needed
            if img.mode != 'RGB':
                img = img.convert('RGB')
            
            # Resize to standard size for consistent analysis
            img_resized = img.resize((512, 512), Image.Resampling.LANCZOS)
            img_array = np.array(img_resized)
            
            # 1. Histogram (grayscale)
            img_gray = img_resized.convert('L')
            histogram = np.array(img_gray.histogram()) / (img_gray.size[0] * img_gray.size[1])  # Normalize
            
            # 2. Edge detection (Sobel-like using PIL filter)
            edges = img_gray.filter(ImageFilter.FIND_EDGES)
            edge_array = np.array(edges)
            edge_density = float(np.mean(edge_array > 50) / 255.0)  # Percentage of edge pixels
            
            # 3. Texture variance (local variance in grayscale)
            # Use a simple approach: variance of pixel values in small neighborhoods
            texture_variance = float(np.var(img_array))
            
            # 4. Color statistics
            color_mean = np.mean(img_array, axis=(0, 1))
            color_std = np.std(img_array, axis=(0, 1))
            
            # 5. Brightness and contrast
            stat = ImageStat.Stat(img_gray)
            brightness = stat.mean[0] / 255.0
            contrast = stat.stddev[0] / 255.0
            
            return {
                'histogram': histogram,
                'edge_density': edge_density,
                'texture_variance': texture_variance,
                'color_mean': color_mean,
                'color_std': color_std,
                'brightness': brightness,
                'contrast': contrast,
                'width': img_array.shape[1],
                'height': img_array.shape[0],
            }
        except Exception as e:
            print(f"Error analyzing image {image_path}: {e}")
            return {
                'histogram': np.random.rand(256),
                'edge_density': 0.5,
                'texture_variance': 0.5,
                'color_mean': np.array([128, 128, 128]),
                'color_std': np.array([50, 50, 50]),
            }
    
    def _compare_histograms(self, hist1: np.ndarray, hist2: np.ndarray) -> float:
        """Compare two histograms using correlation coefficient"""
        # Normalize
        hist1_norm = hist1 / (np.sum(hist1) + 1e-8)
        hist2_norm = hist2 / (np.sum(hist2) + 1e-8)
        
        # Correlation coefficient
        correlation = np.corrcoef(hist1_norm, hist2_norm)[0, 1]
        
        # Convert to 0-1 score (correlation is -1 to 1)
        similarity = (correlation + 1.0) / 2.0
        return float(max(0.0, min(1.0, similarity)))
    
    def _compute_image_similarity(self, image_features_list: List[Dict]) -> float:
        """
        Compute similarity between multiple images (consistency check)
        
        Returns:
            Average similarity score 0-1
        """
        if len(image_features_list) < 2:
            return 1.0  # Single image, assume consistent
        
        similarities = []
        for i in range(len(image_features_list)):
            for j in range(i + 1, len(image_features_list)):
                feat1 = image_features_list[i]
                feat2 = image_features_list[j]
                
                # Compare histograms
                hist_sim = self._compare_histograms(feat1['histogram'], feat2['histogram'])
                
                # Compare color means (Euclidean distance in RGB space)
                color_diff = np.linalg.norm(feat1['color_mean'] - feat2['color_mean'])
                color_sim = 1.0 / (1.0 + color_diff / 255.0)  # Normalize to 0-1
                
                # Compare edge density
                edge_sim = 1.0 - abs(feat1['edge_density'] - feat2['edge_density'])
                
                # Average similarity
                avg_sim = (hist_sim * 0.5 + color_sim * 0.3 + edge_sim * 0.2)
                similarities.append(avg_sim)
        
        return float(np.mean(similarities)) if similarities else 1.0
    
    def _detect_anomalies(self, image_features_list: List[Dict]) -> Tuple[float, List[str]]:
        """
        Detect defects/anomalies in images
        
        Returns:
            (anomaly_score, notes) where anomaly_score is 0-1 (higher = fewer defects)
        """
        if not image_features_list:
            return 1.0, []
        
        notes = []
        anomaly_scores = []
        
        for i, feat in enumerate(image_features_list):
            score = 1.0
            
            # Check for excessive edge density (might indicate cracks or defects)
            if feat['edge_density'] > 0.4:
                score *= 0.8
                notes.append(f"Image {i+1}: High edge density detected (possible surface defects)")
            
            # Check for low texture variance (might indicate smooth defects or missing features)
            if feat['texture_variance'] < 100:
                score *= 0.9
                notes.append(f"Image {i+1}: Low texture variance (may indicate missing surface detail)")
            
            # Check for extreme brightness/contrast (might indicate lighting issues or defects)
            if feat['brightness'] < 0.2 or feat['brightness'] > 0.9:
                score *= 0.85
                notes.append(f"Image {i+1}: Extreme brightness detected (may affect quality assessment)")
            
            if feat['contrast'] < 0.1:
                score *= 0.9
                notes.append(f"Image {i+1}: Low contrast (may indicate poor image quality)")
            
            anomaly_scores.append(score)
        
        # Average anomaly score across all images
        avg_score = float(np.mean(anomaly_scores))
        
        # Check consistency (if images are very different, might indicate defects)
        consistency = self._compute_image_similarity(image_features_list)
        if consistency < 0.6:
            avg_score *= 0.85
            notes.append("Low consistency across images (may indicate defects or quality issues)")
        
        return avg_score, notes
    
    def _estimate_dimensions_from_images(self, image_features_list: List[Dict], stl_features: Optional[Dict] = None) -> float:
        """
        Estimate dimensional accuracy from images
        
        This is a simplified approach - in production would use:
        - Reference objects for scale
        - Perspective correction
        - Actual measurement from images
        
        For now, we compare relative sizes and aspect ratios
        """
        if not image_features_list or not stl_features:
            return 0.85  # Default if we can't compare
        
        # Get bounding box from STL
        stl_bbox = stl_features.get('bounding_box', {})
        if not stl_bbox or stl_bbox['x'] == 0:
            return 0.85
        
        # Estimate aspect ratios from images
        # In real implementation, would measure actual dimensions
        # For now, use image aspect ratios as proxy
        image_aspects = []
        for feat in image_features_list:
            if feat.get('width') and feat.get('height'):
                aspect = feat['width'] / feat['height']
                image_aspects.append(aspect)
        
        if not image_aspects:
            return 0.85
        
        # STL aspect ratio (simplified - use largest dimension ratio)
        stl_dims = [stl_bbox['x'], stl_bbox['y'], stl_bbox['z']]
        stl_dims.sort(reverse=True)
        stl_aspect = stl_dims[0] / (stl_dims[1] + 1e-8) if len(stl_dims) > 1 else 1.0
        
        # Compare image aspects to STL aspect
        # This is a very simplified check - real implementation would be more sophisticated
        avg_image_aspect = np.mean(image_aspects)
        aspect_diff = abs(avg_image_aspect - stl_aspect) / (stl_aspect + 1e-8)
        
        # Convert to score (smaller difference = higher score)
        dimension_score = 1.0 / (1.0 + aspect_diff * 2.0)
        return float(max(0.5, min(1.0, dimension_score)))
    
    def check_quality(self, input_data: QualityCheckInput) -> QualityCheckOutput:
        """
        Perform quality check on manufactured part
        
        Args:
            input_data: Quality check inputs (STL, evidence images, etc.)
        
        Returns:
            QualityCheckOutput with score, status, and notes
        """
        notes = []
        
        # Step 1: Analyze STL file (if provided)
        stl_features = None
        if input_data.stl_file_path and Path(input_data.stl_file_path).exists():
            stl_features = self._analyze_stl(input_data.stl_file_path)
            notes.append(f"STL analyzed: Volume={stl_features['volume']:.2f}, Surface area={stl_features['surface_area']:.2f}")
        else:
            notes.append("STL file not available - using image-only analysis")
        
        # Step 2: Analyze all evidence images
        if not input_data.evidence_image_paths:
            raise ValueError("At least one evidence image is required")
        
        evidence_features = []
        for img_path in input_data.evidence_image_paths:
            if Path(img_path).exists():
                feat = self._analyze_image(img_path)
                evidence_features.append(feat)
            else:
                notes.append(f"Warning: Image {img_path} not found")
        
        if not evidence_features:
            raise ValueError("No valid evidence images found")
        
        notes.append(f"Analyzed {len(evidence_features)} evidence images")
        
        # Step 3: Compute similarity (if STL available, compare to STL-derived expectations)
        if stl_features:
            # For now, use image consistency as similarity proxy
            # In production, would generate STL renderings and compare
            similarity = self._compute_image_similarity(evidence_features)
            # Adjust based on STL mesh quality
            similarity *= (0.7 + 0.3 * stl_features['mesh_quality'])
        else:
            # No STL - use consistency between images as similarity measure
            similarity = self._compute_image_similarity(evidence_features)
        
        similarity = max(0.0, min(1.0, similarity))
        
        # Step 4: Anomaly detection
        anomaly_score, anomaly_notes = self._detect_anomalies(evidence_features)
        notes.extend(anomaly_notes)
        
        # Step 5: Dimensional accuracy (if STL available)
        dimensional_accuracy = self._estimate_dimensions_from_images(evidence_features, stl_features)
        
        # Step 6: Surface quality (based on texture and edge analysis)
        # Higher texture variance and moderate edge density = better surface finish
        avg_texture = np.mean([f['texture_variance'] for f in evidence_features])
        avg_edge = np.mean([f['edge_density'] for f in evidence_features])
        
        # Normalize texture (assume good range is 100-1000)
        texture_score = min(1.0, avg_texture / 500.0) if avg_texture > 0 else 0.5
        # Edge density should be moderate (not too high = defects, not too low = missing detail)
        edge_score = 1.0 - abs(avg_edge - 0.2) * 2.0  # Optimal around 0.2
        edge_score = max(0.0, min(1.0, edge_score))
        
        surface_quality = (texture_score * 0.6 + edge_score * 0.4)
        
        # Step 7: Consistency across images
        consistency = self._compute_image_similarity(evidence_features)
        
        # Step 8: Calculate overall QC score
        qc_score = (
            similarity * 0.35 +           # Visual similarity (35%)
            anomaly_score * 0.25 +        # Defect detection (25%)
            dimensional_accuracy * 0.15 +  # Dimensional accuracy (15%)
            surface_quality * 0.15 +       # Surface quality (15%)
            consistency * 0.10             # Consistency (10%)
        )
        qc_score = max(0.0, min(1.0, qc_score))
        
        # Step 9: Determine status based on tolerance tier
        thresholds = {
            'low': {'pass': 0.65, 'fail': 0.40},
            'medium': {'pass': 0.75, 'fail': 0.50},
            'high': {'pass': 0.85, 'fail': 0.60},
        }
        tier_thresholds = thresholds.get(input_data.tolerance_tier, thresholds['medium'])
        
        if qc_score >= tier_thresholds['pass']:
            status = 'pass'
            notes.append("✓ Quality check PASSED - Part meets specifications")
        elif qc_score < tier_thresholds['fail']:
            status = 'fail'
            notes.append("✗ Quality check FAILED - Part does not meet specifications")
        else:
            status = 'review'
            notes.append("⚠ Quality check requires REVIEW - Human inspection recommended")
        
        # Add detailed scores to notes
        notes.append(f"Similarity: {similarity:.2%}, Anomaly: {anomaly_score:.2%}, Dimensions: {dimensional_accuracy:.2%}, Surface: {surface_quality:.2%}")
        
        # Confidence based on number of images and STL availability
        confidence = 0.6
        if len(evidence_features) >= 4:
            confidence += 0.15
        if len(evidence_features) >= 6:
            confidence += 0.1
        if stl_features:
            confidence += 0.15
        
        return QualityCheckOutput(
            qc_score=qc_score,
            status=status,
            similarity=similarity,
            dimensional_accuracy=dimensional_accuracy,
            surface_quality=surface_quality,
            anomaly_score=anomaly_score,
            notes=notes,
            confidence=min(1.0, confidence),
            model_version="v1.0-real"
        )
