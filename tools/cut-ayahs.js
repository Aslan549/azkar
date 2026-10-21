// Обрезает аяты, в которых дуа — только часть аята: оставляет звук с первого слова мольбы.
// Аудио и разметка слов: quran.com (Мишари аль-Афаси). node tools/cut-ayahs.js
const fs = require("fs");
const path = require("path");
const { cut } = require("./mp3cut");

// файл в audio/ → [аят, слово, с которого начинается мольба, точное начало в мс (если разметка quran.com захватывает хвост предыдущего слова)]
const JOBS = {
  q002201: ["2:201", "رَبَّنَآ"],
  q002127: ["2:127", "رَبَّنَا"],
  q007023: ["7:23", "رَبَّنَا"],
  q020025: ["20:25", "رَبِّ"],
  q020114: ["20:114", "وَقُل", 13500],   // «ва-кур-Рабби»: «р» слитное, поэтому мольба с «ва-куль», с паузы перед ним
  q017024: ["17:24", "رَّبِّ"],
  q025074: ["25:74", "رَبَّنَا"],
  q059010: ["59:10", "رَبَّنَا"],
  q028024: ["28:24", "رَبِّ"],
  q023118: ["23:118", "رَّبِّ", 550],
  q021083: ["21:83", "أَنِّى", 5120],   // после «раббаху» с протяжкой
};
const LEAD = 40; // мс запаса перед первым словом

const strip = s => s.normalize("NFC").replace(/[ً-ٰٟۖ-ۭـۭ]/g, "").replace(/[ٱإأآ]/g, "ا").replace(/ى/g, "ي");
const get = async url => { const r = await fetch(url); if (!r.ok) throw new Error(url + " " + r.status); return r; };

(async () => {
  const dir = path.join(__dirname, "..", "audio");
  const tmp = path.join(__dirname, "..", "tools", "src-audio");
  fs.mkdirSync(tmp, { recursive: true });
  for (const [file, [key, startWord, exact]] of Object.entries(JOBS)) {
    const words = (await (await get(`https://api.quran.com/api/v4/verses/by_key/${key}?words=true&word_fields=text_uthmani`)).json())
      .verse.words.filter(w => w.char_type_name === "word");
    const rec = (await (await get(`https://api.quran.com/api/v4/recitations/7/by_ayah/${key}?fields=segments`)).json()).audio_files[0];
    // слово мольбы: первое вхождение (в 59:10 «Раббана» встречается дважды, мольба начинается с первого)
    const target = strip(startWord);
    const idx = words.map(w => strip(w.text_uthmani)).indexOf(target);
    if (idx < 0) throw new Error(`${key}: не найдено слово ${startWord}`);
    const pos = words[idx].position;
    const seg = rec.segments.find(s => s[1] === pos);
    const src = path.join(tmp, file + ".mp3");
    fs.writeFileSync(src, Buffer.from(await (await get("https://verses.quran.com/" + rec.url)).arrayBuffer()));
    const res = cut(src, path.join(dir, file + ".mp3"), exact != null ? exact : Math.max(0, seg[2] - LEAD));
    console.log(`${file} ${key}: с слова ${pos} «${words[idx].text_uthmani}» (${seg[2]} мс) → ${Math.round(res.kept / 100) / 10} с из ${Math.round(res.duration / 100) / 10} с; оставлено: ${words.slice(idx).map(w => w.text_uthmani).join(" ")}`);
  }
})().catch(e => { console.error(e); process.exit(1); });
