// Локальный просмотр: node tools/serve.js → http://localhost:8766/
const http=require('http'),fs=require('fs'),path=require('path');const root=path.join(__dirname,'..');
const T={'.html':'text/html; charset=utf-8','.mp3':'audio/mpeg','.json':'application/json','.png':'image/png'};
http.createServer((q,s)=>{let p=decodeURIComponent(q.url.split('?')[0]);if(p.endsWith('/'))p+='index.html';const f=path.join(root,p);
fs.readFile(f,(e,d)=>{if(e){s.writeHead(404);return s.end();}s.writeHead(200,{'Content-Type':T[path.extname(f)]||'application/octet-stream'});s.end(d);});}).listen(8766);
