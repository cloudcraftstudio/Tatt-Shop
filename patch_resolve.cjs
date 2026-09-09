const fs = require('fs');
let code = fs.readFileSync('src/services/mediaStore.ts', 'utf8');

const newResolve = `export const resolveMediaUrl = async (mediaUri: string | undefined): Promise<string> => {
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
      const chunkDoc = await getDoc(doc(db, 'media_chunks', \`\${mediaId}_\${i}\`));
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
};`;

code = code.replace(/export const resolveMediaUrl = async [\s\S]*?^};/m, newResolve);
fs.writeFileSync('src/services/mediaStore.ts', code);
