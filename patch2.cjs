const fs = require('fs');
let code = fs.readFileSync('src/services/storage.ts', 'utf8');

code = code.replace(
  `  // Utility to read local file to base64 with reliable JPEG compression or direct passthrough for GIFs/Videos
  fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      // Pass through GIFs and Videos directly to preserve animation/video format
      if (file.type === 'image/gif' || file.type.startsWith('video/')) {
        // Enforce strict size limit for Firestore (1MB limit per document -> ~700KB max raw size)
        if (file.size > 800000) {
          reject(new Error(\`File \${file.name} is too large (\${(file.size/1024/1024).toFixed(2)}MB). GIFs and Videos must be under 800KB for cloud storage. Consider adding a web link instead.\`));
          return;
        }
        
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Failed to read GIF/Video file'));
        reader.readAsDataURL(file);
        return;
      }

      // Standard image compression (JPG, PNG, WEBP)
      const objectUrl = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);`,
  `  // Utility to read local file to base64 with reliable JPEG compression or direct passthrough for GIFs/Videos
  fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      // For videos/gifs we handle it in the component now using uploadLargeMedia directly
      // So we'll just return raw for them up to 50MB and let the component handle chunking
      if (file.type === 'image/gif' || file.type.startsWith('video/')) {
        if (file.size > 50000000) { // 50MB limit
          reject(new Error(\`File \${file.name} is too large. Limit is 50MB.\`));
          return;
        }
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Failed to read GIF/Video file'));
        reader.readAsDataURL(file);
        return;
      }

      // Standard image compression (JPG, PNG, WEBP)
      const objectUrl = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);`
);

fs.writeFileSync('src/services/storage.ts', code);
