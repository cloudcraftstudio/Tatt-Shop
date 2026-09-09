import fs from 'fs';

const buffer = Buffer.alloc(5000000); // 5MB
for(let i=0; i<5000000; i++) buffer[i] = i % 256;

const CHUNK_SIZE = 3 * 300000; // 900,000 bytes
let base64 = '';

for(let i=0; i<Math.ceil(buffer.length/CHUNK_SIZE); i++) {
  const slice = buffer.subarray(i*CHUNK_SIZE, Math.min((i+1)*CHUNK_SIZE, buffer.length));
  base64 += slice.toString('base64');
}

const directBase64 = buffer.toString('base64');
console.log(base64 === directBase64); // Should be true

