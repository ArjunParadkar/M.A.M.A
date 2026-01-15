'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { createClientSupabase } from '@/lib/supabaseClient';

interface EvidenceUploaderProps {
  jobId: string;
  onUploadComplete?: (paths: string[]) => void;
}

export function EvidenceUploader({ jobId, onUploadComplete }: EvidenceUploaderProps) {
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClientSupabase();

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      setUploading(true);
      setError(null);

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          throw new Error('Not authenticated');
        }

        const uploadedPaths: string[] = [];

        for (const file of acceptedFiles) {
          // Determine file type (image or video)
          const isImage = file.type.startsWith('image/');
          const isVideo = file.type.startsWith('video/');
          
          if (!isImage && !isVideo) {
            console.warn(`Skipping unsupported file type: ${file.type}`);
            continue;
          }

          const fileExt = file.name.split('.').pop();
          const fileName = `evidence/${jobId}/${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
          
          const bucket = isImage ? 'evidence-images' : 'evidence-videos';
          
          const { error: uploadError } = await supabase.storage
            .from(bucket)
            .upload(fileName, file);

          if (uploadError) {
            throw uploadError;
          }

          // Get public URL
          const { data: urlData } = supabase.storage
            .from(bucket)
            .getPublicUrl(fileName);

          if (urlData?.publicUrl) {
            uploadedPaths.push(urlData.publicUrl);
          }
        }

        setUploadedFiles((prev) => [...prev, ...uploadedPaths]);
        
        if (onUploadComplete) {
          onUploadComplete([...uploadedFiles, ...uploadedPaths]);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to upload files');
      } finally {
        setUploading(false);
      }
    },
    [jobId, uploadedFiles, onUploadComplete, supabase]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
      'video/*': ['.mp4', '.mov', '.avi', '.webm'],
    },
    multiple: true,
  });

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Upload Evidence (Photos/Video)
        </label>
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive
              ? 'border-indigo-500 bg-indigo-50'
              : 'border-gray-300 hover:border-gray-400'
          } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <input {...getInputProps()} disabled={uploading} />
          {uploading ? (
            <p className="text-sm text-gray-600">Uploading...</p>
          ) : (
            <>
              <p className="text-sm text-gray-600 mb-2">
                Drag and drop photos or video here, or click to select
              </p>
              <p className="text-xs text-gray-500">
                Supports: JPG, PNG, GIF, WebP, MP4, MOV, AVI
              </p>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {uploadedFiles.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Uploaded Files ({uploadedFiles.length})
          </label>
          <div className="space-y-2">
            {uploadedFiles.map((path, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-gray-50 rounded px-3 py-2"
              >
                <a
                  href={path}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-indigo-600 hover:text-indigo-800 flex-1 truncate"
                >
                  {path.split('/').pop()}
                </a>
                <button
                  onClick={() => removeFile(index)}
                  className="ml-2 text-red-600 hover:text-red-800"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
