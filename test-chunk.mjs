import fs from 'fs';

// Mock file
const buffer = Buffer.alloc(5000000); // 5MB
for(let i=0; i<5000000; i++) buffer[i] = i % 256;

const CHUNK_SIZE = 1000000;
let base64 = '';

for(let i=0; i<5; i++) {
  const slice = buffer.subarray(i*CHUNK_SIZE, (i+1)*CHUNK_SIZE);
  base64 += slice.toString('base64');
}

const directBase64 = buffer.toString('base64');
console.log(base64 === directBase64); // Should be true

