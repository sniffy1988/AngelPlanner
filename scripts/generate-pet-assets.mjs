import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function solidPng(width, height, r, g, b) {
  const row = Buffer.alloc(1 + width * 3);
  row[0] = 0;
  for (let x = 0; x < width; x++) {
    row[1 + x * 3] = r;
    row[1 + x * 3 + 1] = g;
    row[1 + x * 3 + 2] = b;
  }
  const raw = Buffer.alloc((1 + width * 3) * height);
  for (let y = 0; y < height; y++) row.copy(raw, y * row.length);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  const idat = zlib.deflateSync(raw);
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const assets = [
  { file: 'egg.png', color: [255, 228, 181] },
  { file: 'baby_happy.png', color: [144, 238, 144] },
  { file: 'baby_sad.png', color: [176, 196, 222] },
  { file: 'teen_happy.png', color: [255, 215, 0] },
  { file: 'teen_sad.png', color: [169, 169, 169] },
  { file: 'adult_happy.png', color: [255, 140, 0] },
  { file: 'adult_sad.png', color: [128, 128, 128] },
];

const dir = path.join(process.cwd(), 'assets', 'pets');
fs.mkdirSync(dir, { recursive: true });

for (const { file, color } of assets) {
  const png = solidPng(128, 128, color[0], color[1], color[2]);
  fs.writeFileSync(path.join(dir, file), png);
  console.log('Created', file);
}
