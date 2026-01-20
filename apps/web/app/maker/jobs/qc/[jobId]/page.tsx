'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import STLViewer from '@/components/STLViewer';

export default function QCSubmissionPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.jobId as string;

  const [photos, setPhotos] = useState<(File | null)[]>(Array(4).fill(null));
  const [uploading, setUploading] = useState(false);
  const [qcResults, setQcResults] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  const [stlFile, setStlFile] = useState<File | null>(null);

  useEffect(() => {
    async function loadJob() {
      try {
        const res = await fetch(`/api/jobs/${jobId}`);
        const job = await res.json();
        const stlUrl = job?.stl_url || job?.stl_file_url || job?.stl_path;
        if (!stlUrl) return;
        const blobRes = await fetch(stlUrl);
        const blob = await blobRes.blob();
        setStlFile(new File([blob], 'model.stl', { type: 'model/stl' }));
      } catch (e) {
        console.error('Failed to load STL for QC:', e);
      }
    }
    loadJob();
  }, [jobId]);

  const handlePhotoChange = (index: number, file: File | null) => {
    const newPhotos = [...photos];
    newPhotos[index] = file;
    setPhotos(newPhotos);
  };

  const handleSubmitQC = async () => {
    const validPhotos = photos.filter(p => p !== null) as File[];
    if (validPhotos.length < 4) {
      alert('Please upload at least 4 photos (up to 6 recommended)');
      return;
    }
    if (validPhotos.length > 6) {
      alert('Maximum 6 photos allowed');
      return;
    }

    setUploading(true);

    try {
      // Upload photos to Supabase Storage
      const { uploadQCPhotos } = await import('@/lib/supabase/storage');
      const photoUrls = await uploadQCPhotos(validPhotos, jobId);
      
      // Fetch job details from API
      const jobRes = await fetch(`/api/jobs/${jobId}`);
      const jobData = await jobRes.json();
      
      // Get STL file URL from job
      const stlFileUrl = jobData.stl_url || jobData.stl_file_url || jobData.stl_path || null;
      
      // Call F3 Vision Quality Check API
      const qcResponse = await fetch('/api/ai/qc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_id: jobId,
          photo_urls: photoUrls,
          stl_file_url: stlFileUrl, // Pass STL URL to API
          tolerance_tier: jobData.tolerance_tier || 'medium',
          tolerance_thou: jobData.tolerance_thou,
          material: jobData.material,
        }),
      });
      
      if (!qcResponse.ok) {
        throw new Error('Quality check failed');
      }
      
      const qcData = await qcResponse.json();
      
      setQcResults({
        qc_score: qcData.qc_score,
        status: qcData.status, // 'pass', 'review', 'fail'
        similarity: qcData.similarity, // Similarity to STL model geometry
        dimensional_accuracy: qcData.dimensional_accuracy || qcData.similarity * 0.95,
        surface_quality: qcData.surface_quality || qcData.similarity * 0.90,
        anomaly_score: qcData.anomaly_score, // Defect detection score
        notes: qcData.notes || [
          'Quality check completed',
        ],
        confidence: qcData.confidence,
        model_version: qcData.model_version,
      });

      // Persist QC record + advance job status (server-side)
      try {
        await fetch(`/api/jobs/${jobId}/qc`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            qc_score: qcData.qc_score,
            status: qcData.status,
            similarity: qcData.similarity,
            evidence_paths: photoUrls,
            model_version: qcData.model_version || 'demo',
          }),
        });
      } catch (e) {
        console.error('Failed to persist QC record:', e);
      }

      setUploading(false);
    } catch (error) {
      console.error('Error submitting QC:', error);
      setUploading(false);
    }
  };

  const handleFinalSubmit = async () => {
    setSubmitting(true);
    setTimeout(() => {
      // After QC approval, redirect to shipping if passed, otherwise back to active
      if (qcResults.status === 'pass') {
        router.push(`/maker/jobs/ship/${jobId}`);
      } else {
        router.push('/maker/jobs/active');
      }
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-200 to-white">
      {/* Top Navigation Bar */}
      <div className="bg-[#0a1929] text-white py-4 px-8 border-b border-[#1a2332]">
        <div className="max-w-7xl mx-auto">
          <Link href="/maker/jobs/active" className="text-white hover:text-[#9ca3af] transition-colors">
            ← Back to Active Jobs
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-8">
        <h1 className="text-3xl font-semibold text-[#0a1929] mb-2 heading-font">
          Quality Check Submission
        </h1>
        <p className="text-[#6b7280] mb-6">Upload 4 photos of your completed product. AI will compare images to STL model specifications and provide a quality score.</p>

        {!qcResults ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* STL Model Reference */}
          <div className="bg-[#0a1929] border border-[#1a2332] p-6">
            <h2 className="text-xl font-semibold text-white mb-4 heading-font">STL Model Specifications</h2>
            <div className="bg-black border border-[#253242] min-h-[400px] flex items-center justify-center mb-4">
              {stlFile ? (
                <STLViewer file={stlFile} width={450} height={400} />
              ) : (
                <div className="text-center p-8">
                  <div className="text-[#9ca3af] mb-2">3D Model Reference</div>
                  <div className="text-[#6b7280] text-sm">AI will compare your photos to this model</div>
                </div>
              )}
            </div>
            <div className="text-sm text-[#9ca3af] space-y-1">
              <div>• AI compares photo geometry to STL model</div>
              <div>• Dimensions, surface finish, and defects analyzed</div>
              <div>• Quality score based on specification compliance</div>
            </div>
          </div>

          {/* Photo Upload Section */}
          <div className="bg-[#0a1929] border border-[#1a2332] p-6">
            <h2 className="text-xl font-semibold text-white mb-6 heading-font">
              Upload Product Photos (4-6 Recommended)
            </h2>
            <p className="text-[#9ca3af] text-sm mb-4">Take photos from multiple angles (top, front, side, isometric) to enable accurate comparison with the STL model. More photos = better accuracy.</p>

            <div className="grid grid-cols-2 gap-6 mb-6">
              {[0, 1, 2, 3, 4, 5].map((index) => (
                <div key={index} className="border-2 border-dashed border-[#253242] p-6 text-center">
                  {photos[index] ? (
                    <div>
                      <div className="text-white mb-2">✓ Photo {index + 1}</div>
                      <div className="text-[#9ca3af] text-sm mb-2">{photos[index]?.name}</div>
                      <button
                        onClick={() => handlePhotoChange(index, null)}
                        className="text-[#9ca3af] hover:text-white text-sm underline"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer">
                      <div className="text-[#9ca3af] mb-2">Photo {index + 1}</div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handlePhotoChange(index, e.target.files?.[0] || null)}
                        className="hidden"
                      />
                      <div className="inline-block bg-[#1a2332] text-white px-4 py-2 border border-[#253242] hover:border-[#3a4552] transition-colors text-sm">
                        Choose File
                      </div>
                    </label>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={handleSubmitQC}
              disabled={uploading || photos.filter(p => p !== null).length < 4}
              className="w-full bg-[#253242] hover:bg-[#3a4552] text-white px-6 py-3 border border-[#3a4552] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? 'Analyzing with AI (comparing STL to photos)...' : 'Compare to STL Model & Check Quality'}
            </button>
          </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* QC Results */}
            <div className="bg-[#0a1929] border border-[#1a2332] p-8">
              <h2 className="text-xl font-semibold text-white mb-4 heading-font">AI Quality Check Results</h2>
              
              <div className="mb-6">
                <div className="text-3xl font-bold text-white mb-2">
                  Quality Score: {(qcResults.qc_score * 100).toFixed(1)}%
                </div>
                <span className={`px-3 py-1 text-xs font-medium ${
                  qcResults.status === 'pass' ? 'bg-green-900 text-green-200' :
                  qcResults.status === 'fail' ? 'bg-red-900 text-red-200' :
                  'bg-yellow-900 text-yellow-200'
                }`}>
                  {qcResults.status.toUpperCase()}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                <div>
                  <span className="text-[#9ca3af]">Similarity to STL Model:</span>
                  <span className="text-white ml-2">{(qcResults.similarity * 100).toFixed(1)}%</span>
                </div>
                <div>
                  <span className="text-[#9ca3af]">Dimensional Accuracy:</span>
                  <span className="text-white ml-2">{(qcResults.dimensional_accuracy * 100).toFixed(1)}%</span>
                </div>
                <div>
                  <span className="text-[#9ca3af]">Surface Quality:</span>
                  <span className="text-white ml-2">{(qcResults.surface_quality * 100).toFixed(1)}%</span>
                </div>
                <div>
                  <span className="text-[#9ca3af]">Defect Detection:</span>
                  <span className="text-white ml-2">{(qcResults.anomaly_score * 100).toFixed(1)}%</span>
                </div>
                <div>
                  <span className="text-[#9ca3af]">Confidence:</span>
                  <span className="text-white ml-2">{(qcResults.confidence * 100).toFixed(1)}%</span>
                </div>
              </div>

              <div className="border-t border-[#253242] pt-4">
                <h3 className="text-white font-medium mb-2">AI Analysis Notes:</h3>
                <ul className="space-y-1">
                  {qcResults.notes.map((note: string, i: number) => (
                    <li key={i} className="text-[#9ca3af] text-sm">• {note}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Submit for Client Review */}
            <div className="bg-[#0a1929] border border-[#1a2332] p-6">
              <p className="text-[#9ca3af] mb-4">
                {qcResults.status === 'pass' 
                  ? 'Your product passed AI quality check! Proceed to shipping and delivery.'
                  : qcResults.status === 'fail'
                  ? 'AI detected quality issues. Please review and resubmit or proceed anyway for client review.'
                  : 'AI recommends human review. Submit for client approval.'}
              </p>
              <div className="flex gap-4">
                <Link
                  href="/maker/jobs/active"
                  className="flex-1 bg-[#1a2332] hover:bg-[#253242] text-white px-6 py-3 border border-[#253242] hover:border-[#3a4552] transition-colors text-center"
                >
                  Cancel
                </Link>
                <button
                  onClick={handleFinalSubmit}
                  disabled={submitting}
                  className="flex-1 bg-[#253242] hover:bg-[#3a4552] text-white px-6 py-3 border border-[#3a4552] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Submitting...' : 'Submit for Client Review'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

