// Собирает index.html для GitHub Pages / Telegram Mini App из azkar.html (исходник артефакта).
// Запуск: node build.js
const fs = require("fs");

const app = fs.readFileSync(__dirname + "/azkar.html", "utf8");

const head = `<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#DFE6E2">
<script src="https://telegram.org/js/telegram-web-app.js"></script>
<style>
:root { padding-top: env(safe-area-inset-top, 0px); padding-bottom: env(safe-area-inset-bottom, 0px); }
body { margin: 0; font: 14px system-ui, sans-serif; }
img { max-width: 100%; }
[hidden] { display: none !important; }
</style>
</head>
<body>
`;

// Связь с Телеграмом: тёмная тема, цвет шапки, открытие нужной вкладки по ссылке ?startapp=m|e|p|d|j.
const telegram = `
<script>
(function () {
  const tg = window.Telegram && window.Telegram.WebApp;
  if (!tg || !tg.initData) return;
  tg.ready();
  tg.expand();
  let saved = null;
  try { saved = JSON.parse(localStorage.getItem("azkar:skin")); } catch (e) {}
  if ((!saved || saved === "default") && tg.colorScheme === "dark") document.documentElement.dataset.theme = "dark";
  const paint = () => {
    const bg = getComputedStyle(document.body).backgroundColor;
    try { tg.setHeaderColor(bg); tg.setBackgroundColor(bg); } catch (e) {}
  };
  paint();
  document.getElementById("skins").addEventListener("click", () => setTimeout(paint, 0));
  const start = tg.initDataUnsafe && tg.initDataUnsafe.start_param;
  const tab = start && document.getElementById("tab-" + start);
  if (tab) tab.click();
})();
</script>
</body>
</html>
`;

fs.writeFileSync(__dirname + "/index.html", head + app + telegram);
console.log("index.html собран:", (head + app + telegram).length, "байт");
