const fs = require('fs');

const code = `import { db } from '../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

const CHUNK_SIZE = 3 * 250000; // 750,000 bytes per chunk (produces exactly 1,000,000 base64 chars)

const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

export const uploadLargeMedia = async (file: File): Promise<string> => {
  // If it's very small, just read the whole thing at once
  if (file.size < CHUNK_SIZE) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
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
      reader.onload = () => resolve(arrayBufferToBase64(reader.result as ArrayBuffer));
      reader.onerror = () => reject(new Error('Failed to read file chunk'));
      reader.readAsArrayBuffer(blobChunk);
    });

    await setDoc(doc(db, 'media_chunks', \`\${mediaId}_\${i}\`), {
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

  return \`media://\${mediaId}\`;
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
    let base64 = \`data:\${type};base64,\`;
    
    for (let i = 0; i < totalChunks; i++) {
      const chunkDoc = await getDoc(doc(db, 'media_chunks', \`\${mediaId}_\${i}\`));
      if (chunkDoc.exists()) {
        base64 += chunkDoc.data().data;
      }
    }
    
    mediaCache.set(mediaUri, base64);
    return base64;
  } catch (e) {
    console.error('Failed to resolve media chunk', e);
    return '';
  }
};
`;

fs.writeFileSync('src/services/mediaStore.ts', code);
