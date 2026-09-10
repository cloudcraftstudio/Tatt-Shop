const url = "https://lights-out-tattoo.d65bf9722cfa47c2ec5fc1f30ba18007.r2.cloudflarestorage.com/1788925103897-jifxzd-test.txt?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=c9d191f8c748841810da7cf873644d3c%2F20260909%2Fauto%2Fs3%2Faws4_request&X-Amz-Date=20260909T033823Z&X-Amz-Expires=3600&X-Amz-Signature=5a49ee178e6e52ca8f108ff999e81041ffeab972d125c97f60f042cbba3f2bee&X-Amz-SignedHeaders=host&x-amz-checksum-crc32=AAAAAA%3D%3D&x-amz-sdk-checksum-algorithm=CRC32&x-id=PutObject";

fetch(url, {
  method: 'PUT',
  headers: {
    'Content-Type': 'text/plain'
  },
  body: 'Hello from AI Studio!'
}).then(res => {
  console.log('Status:', res.status, res.statusText);
  return res.text();
}).then(text => console.log('Response:', text))
.catch(err => console.error(err));
