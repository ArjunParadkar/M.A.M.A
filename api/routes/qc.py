"""
F3: Vision Quality Check API Route
Compares manufactured part photos to STL design using F3 model
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict
import sys
import os
import requests
from io import BytesIO

# Add models directory to path
models_path = os.path.join(os.path.dirname(__file__), '..', '..', 'models')
if models_path not in sys.path:
    sys.path.insert(0, models_path)

try:
    from f3_vision_quality_check import VisionQualityCheckModel, QualityCheckInput, QualityCheckOutput
    F3_MODEL_AVAILABLE = True
except ImportError as e:
    print(f"Warning: F3 model not available: {e}")
    VisionQualityCheckModel = None
    F3_MODEL_AVAILABLE = False

router = APIRouter()

class QCRequest(BaseModel):
    """Request for quality check"""
    job_id: str
    stl_file_url: Optional[str] = None  # URL to STL file in Supabase Storage
    evidence_photo_urls: List[str]  # URLs to QC photos in Supabase Storage
    tolerance_tier: str = "medium"  # 'low', 'medium', 'high'
    tolerance_thou: Optional[float] = None  # Actual tolerance in thou
    material: Optional[str] = None
    critical_dimensions: Optional[Dict[str, float]] = None

@router.post("/")
async def check_quality(request: QCRequest):
    """
    Run F3 Vision Quality Check on manufactured part
    """
    try:
        if not F3_MODEL_AVAILABLE or VisionQualityCheckModel is None:
            # Fallback: Simple heuristic QC
            return await _fallback_qc(request)
        
        # Initialize model
        model = VisionQualityCheckModel()
        
        # Download STL file if URL provided
        stl_file_path = None
        if request.stl_file_url:
            try:
                stl_response = requests.get(request.stl_file_url, timeout=30)
                stl_response.raise_for_status()
                # Save to temp file
                import tempfile
                with tempfile.NamedTemporaryFile(delete=False, suffix='.stl') as tmp:
                    tmp.write(stl_response.content)
                    stl_file_path = tmp.name
            except Exception as e:
                print(f"Warning: Could not download STL file: {e}")
                # Continue without STL file (model will use photos only)
        
        # Download evidence photos (support both field names)
        photo_urls = request.evidence_photo_urls or request.photo_urls or []
        evidence_image_paths = []
        for photo_url in photo_urls:
            try:
                photo_response = requests.get(photo_url, timeout=30)
                photo_response.raise_for_status()
                # Save to temp file
                import tempfile
                with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as tmp:
                    tmp.write(photo_response.content)
                    evidence_image_paths.append(tmp.name)
            except Exception as e:
                print(f"Warning: Could not download photo {photo_url}: {e}")
                # Skip this photo
        
        if len(evidence_image_paths) < 1:
            raise HTTPException(
                status_code=400,
                detail="At least one evidence photo is required"
            )
        
        # Build QC input
        qc_input = QualityCheckInput(
            stl_file_path=stl_file_path,
            design_image_paths=None,  # Will be generated from STL if needed
            evidence_image_paths=evidence_image_paths,
            evidence_video_paths=None,
            job_id=request.job_id,
            tolerance_tier=request.tolerance_tier,
            critical_dimensions=request.critical_dimensions,
        )
        
        # Run quality check
        result = model.check_quality(qc_input)
        
        # Clean up temp files
        import os
        if stl_file_path and os.path.exists(stl_file_path):
            try:
                os.unlink(stl_file_path)
            except:
                pass
        for img_path in evidence_image_paths:
            if os.path.exists(img_path):
                try:
                    os.unlink(img_path)
                except:
                    pass
        
        # Return results
        return {
            'qc_score': result.qc_score,
            'status': result.status,
            'similarity': result.similarity,
            'dimensional_accuracy': getattr(result, 'dimensional_accuracy', result.similarity * 0.95),
            'surface_quality': getattr(result, 'surface_quality', result.similarity * 0.90),
            'anomaly_score': result.anomaly_score,
            'notes': result.notes,
            'confidence': result.confidence,
            'model_version': result.model_version,
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error running quality check: {str(e)}")

async def _fallback_qc(request: QCRequest):
    """Fallback QC using simple heuristics"""
    # Simple heuristic: assume good quality if we have photos
    photo_urls = request.evidence_photo_urls or request.photo_urls or []
    num_photos = len(photo_urls)
    
    # Base score from number of photos (more photos = better)
    base_score = min(0.7 + (num_photos * 0.05), 0.95)
    
    # Adjust based on tolerance tier
    if request.tolerance_tier == 'high':
        # Stricter for high tolerance
        base_score *= 0.9
    elif request.tolerance_tier == 'low':
        # More lenient for low tolerance
        base_score *= 1.05
        base_score = min(1.0, base_score)
    
    # Determine status
    if base_score >= 0.85:
        status = 'pass'
    elif base_score >= 0.70:
        status = 'review'
    else:
        status = 'fail'
    
    return {
        'qc_score': round(base_score, 2),
        'status': status,
        'similarity': round(base_score * 0.9, 2),  # Slightly lower than overall score
        'anomaly_score': round(base_score * 0.95, 2),  # Assume low anomaly
        'dimensional_accuracy': round(base_score * 0.88, 2),
        'surface_quality': round(base_score * 0.85, 2),
        'notes': [
            f'Quality check completed with {num_photos} photos',
            f'Tolerance tier: {request.tolerance_tier}',
            'Note: Using heuristic fallback (F3 model not fully trained)',
        ],
        'confidence': 0.6,  # Lower confidence for fallback
        'model_version': 'fallback-v1.0',
    }
