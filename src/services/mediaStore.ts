import { db } from '../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

const CHUNK_SIZE = 3 * 250000; // 750,000 bytes per chunk (produces exactly 1,000,000 base64 chars)

export const uploadLargeMedia = async (file: File): Promise<string> => {
  // (Removed small file base64 conversion - ALL files will now route to Cloudflare)

  // Attempt to use Cloudflare R2 / S3 Object Storage first
  try {
    const response = await fetch('/api/s3/presigned-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileName: file.name, contentType: file.type || 'video/mp4' })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error('Backend presigned URL generation failed: ' + errText);
    }
    if (response.ok) {
      const { uploadUrl, publicUrl } = await response.json();
      
      // Upload directly to Cloudflare R2 using the presigned URL
      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type || 'video/mp4'
        },
        body: file
      });

      if (!uploadRes.ok) {
        throw new Error('Failed to upload file to Cloudflare R2.');
      }

      // Return the direct public URL
      return publicUrl;
    }
  } catch (err) {
    console.warn('Cloudflare R2 not configured or upload failed. Falling back to Firestore chunking.', err);
  }
  
  // COMPLETELY BLOCK FIRESTORE CHUNKING TO PREVENT QUOTA EXHAUSTION
  // Since we know they hit the 20k write limit, do not attempt to write 70 chunks.
  if (file.size > CHUNK_SIZE) {
    throw new Error('Cloudflare upload failed, and this file is too large to safely store in the database without hitting quota limits. Please ensure Cloudflare R2 is configured correctly.');
  }

  // Enforce a sensible max size for Firestore (e.g. 50MB) to avoid ridiculous chunk loops
  if (file.size > 50000000) {
    throw new Error(`File ${file.name} is too large. Max limit is 50MB.`);
  }

  // For large files, chunk it first using Blob.slice() to avoid memory crashes
  const mediaId = 'media_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

  for (let i = 0; i < totalChunks; i++) {
    const start = i * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, file.size);
    const blobChunk = file.slice(start, end);
    
    const chunkBase64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        // Strip out the data URL prefix to get raw base64
        const b64 = dataUrl.substring(dataUrl.indexOf(',') + 1);
        resolve(b64);
      };
      reader.onerror = () => reject(new Error('Failed to read file chunk'));
      reader.readAsDataURL(blobChunk);
    });

    await setDoc(doc(db, 'media_chunks', `${mediaId}_${i}`), {
      mediaId,
      index: i,
      data: chunkBase64
    });
  }
  
  await setDoc(doc(db, 'media_meta', mediaId), {
    id: mediaId,
    totalChunks,
    type: file.type
  });

  return `media://${mediaId}`;
};

const mediaCache = new Map<string, string>();

export const resolveMediaUrl = async (mediaUri: string | undefined): Promise<string> => {
  if (!mediaUri) return '';
  if (!mediaUri.startsWith('media://')) return mediaUri;
  
  if (mediaCache.has(mediaUri)) {
    return mediaCache.get(mediaUri)!;
  }

  try {
    const mediaId = mediaUri.replace('media://', '');
    const metaDoc = await getDoc(doc(db, 'media_meta', mediaId));
    if (!metaDoc.exists()) return '';
    
    const { totalChunks, type } = metaDoc.data();
    
    // Instead of a massive 50MB data URI which crashes iOS Safari,
    // we convert the base64 chunks directly into Uint8Arrays and create a Blob URL.
    const chunks: Uint8Array[] = [];
    
    for (let i = 0; i < totalChunks; i++) {
      const chunkDoc = await getDoc(doc(db, 'media_chunks', `${mediaId}_${i}`));
      if (chunkDoc.exists()) {
        const b64 = chunkDoc.data().data;
        const binStr = atob(b64);
        const len = binStr.length;
        const bytes = new Uint8Array(len);
        for (let j = 0; j < len; j++) {
          bytes[j] = binStr.charCodeAt(j);
        }
        chunks.push(bytes);
      }
    }
    
    const blob = new Blob(chunks, { type });
    const objectUrl = URL.createObjectURL(blob);
    
    mediaCache.set(mediaUri, objectUrl);
    return objectUrl;
  } catch (e) {
    console.error('Failed to resolve media chunk', e);
    return '';
  }
};
