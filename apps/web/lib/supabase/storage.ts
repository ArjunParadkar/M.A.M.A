/**
 * Supabase Storage Utilities
 * Helper functions for uploading and downloading files
 */

import { createClient } from './client';

const STL_FILES_BUCKET = 'stl-files';
const QC_PHOTOS_BUCKET = 'qc-photos';

/**
 * Upload STL file to Supabase Storage
 */
export async function uploadSTLFile(file: File, userId: string): Promise<string> {
  const supabase = createClient();
  
  // Generate unique filename
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}/${Date.now()}.${fileExt}`;
  const filePath = `${fileName}`;
  
  // Upload file
  const { data, error } = await supabase.storage
    .from(STL_FILES_BUCKET)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });
  
  if (error) {
    throw new Error(`Failed to upload STL file: ${error.message}`);
  }
  
  // Get public URL
  const { data: urlData } = supabase.storage
    .from(STL_FILES_BUCKET)
    .getPublicUrl(filePath);
  
  return urlData.publicUrl;
}

/**
 * Upload QC photo to Supabase Storage
 */
export async function uploadQCPhoto(
  file: File,
  jobId: string,
  photoNumber: number
): Promise<string> {
  const supabase = createClient();
  
  // Generate filename
  const fileExt = file.name.split('.').pop() || 'jpg';
  const fileName = `${jobId}/photo-${photoNumber}.${fileExt}`;
  const filePath = `${fileName}`;
  
  // Upload file
  const { data, error } = await supabase.storage
    .from(QC_PHOTOS_BUCKET)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });
  
  if (error) {
    throw new Error(`Failed to upload QC photo: ${error.message}`);
  }
  
  // Get public URL
  const { data: urlData } = supabase.storage
    .from(QC_PHOTOS_BUCKET)
    .getPublicUrl(filePath);
  
  return urlData.publicUrl;
}

/**
 * Upload multiple QC photos (4 required)
 */
export async function uploadQCPhotos(
  files: File[],
  jobId: string
): Promise<string[]> {
  if (files.length !== 4) {
    throw new Error('Exactly 4 photos are required for QC submission');
  }
  
  const uploadPromises = files.map((file, index) =>
    uploadQCPhoto(file, jobId, index + 1)
  );
  
  return Promise.all(uploadPromises);
}

/**
 * Get STL file URL
 */
export async function getSTLFileUrl(filePath: string): Promise<string> {
  const supabase = createClient();
  
  const { data } = supabase.storage
    .from(STL_FILES_BUCKET)
    .getPublicUrl(filePath);
  
  return data.publicUrl;
}

/**
 * Download file from storage
 */
export async function downloadFile(bucket: string, filePath: string): Promise<Blob> {
  const supabase = createClient();
  
  const { data, error } = await supabase.storage
    .from(bucket)
    .download(filePath);
  
  if (error) {
    throw new Error(`Failed to download file: ${error.message}`);
  }
  
  return data;
}

