// Вырезает кусок MP3 по времени без перекодирования (по границам MPEG-кадров).
// node tools/mp3cut.js вход.mp3 выход.mp3 начало_мс [конец_мс]
const fs = require("fs");

const BITRATES = {
  "1-3": [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320],   // MPEG1 Layer III
  "2-3": [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160],      // MPEG2/2.5 Layer III
};
const RATES = { 3: [44100, 48000, 32000], 2: [22050, 24000, 16000], 0: [11025, 12000, 8000] };

function frames(buf) {
  let i = 0;
  if (buf.slice(0, 3).toString() === "ID3") {
    const s = buf.slice(6, 10);
    i = 10 + ((s[0] & 0x7f) << 21 | (s[1] & 0x7f) << 14 | (s[2] & 0x7f) << 7 | (s[3] & 0x7f));
  }
  const out = [];
  let t = 0;
  while (i + 4 <= buf.length) {
    if (buf[i] !== 0xff || (buf[i + 1] & 0xe0) !== 0xe0) { i++; continue; }
    const ver = (buf[i + 1] >> 3) & 3, layer = (buf[i + 1] >> 1) & 3;
    const bri = buf[i + 2] >> 4, sri = (buf[i + 2] >> 2) & 3, pad = (buf[i + 2] >> 1) & 1;
    if (ver === 1 || layer !== 1 || bri === 0 || bri === 15 || sri === 3) { i++; continue; }
    const br = BITRATES[ver === 3 ? "1-3" : "2-3"][bri] * 1000, sr = RATES[ver][sri];
    const samples = ver === 3 ? 1152 : 576;
    const len = Math.floor(samples / 8 * br / sr) + pad;
    if (len < 4 || i + len > buf.length) break;
    const head = buf.slice(i, i + len);
    const isInfo = out.length === 0 && (head.includes("Xing") || head.includes("Info"));
    if (!isInfo) { out.push({ start: i, len, t }); t += samples / sr * 1000; }
    i += len;
  }
  return { list: out, duration: t };
}

function cut(src, dst, fromMs, toMs) {
  const buf = fs.readFileSync(src);
  const { list, duration } = frames(buf);
  const end = toMs == null ? Infinity : toMs;
  const keep = list.filter(f => f.t >= fromMs && f.t < end);
  fs.writeFileSync(dst, Buffer.concat(keep.map(f => buf.slice(f.start, f.start + f.len))));
  return { duration, kept: keep.length ? (keep[keep.length - 1].t - keep[0].t) : 0 };
}

// Склеивает несколько кусков одного файла: ranges = [[от_мс, до_мс], ...]
function cutRanges(src, dst, ranges) {
  const buf = fs.readFileSync(src);
  const { list } = frames(buf);
  const parts = [];
  let total = 0;
  for (const [a, b] of ranges) {
    const keep = list.filter(f => f.t >= a && f.t < b);
    parts.push(...keep.map(f => buf.slice(f.start, f.start + f.len)));
    total += b - a;
  }
  fs.writeFileSync(dst, Buffer.concat(parts));
  return total;
}

module.exports = { cut, cutRanges, frames };
if (require.main === module) {
  const [src, dst, a, b] = process.argv.slice(2);
  console.log(cut(src, dst, +a, b == null ? null : +b));
}
