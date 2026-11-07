// ===================== REDE: SALA ONLINE NO SEU PRÓPRIO SERVIDOR (FIREBASE) =====================
// Dentro do Claude, a sala usa a conexão do próprio Claude. Fora dele (no seu site), usa o Firebase Realtime Database
// com o mesmo jeito de funcionar: cada jogador escreve o próprio "presence" (um texto de até ~6 KB) e lê o dos outros.
// Quem fecha a página some da sala sozinho (o servidor apaga o registro quando a conexão cai).
const NET={db:null,peer:null,conn:false,ch:new Set(),rooms:{}};
const NET_FB="https://cdn.jsdelivr.net/npm/firebase@10.12.2/";
function netConfig(){let c=null;try{const w=window.PADDOCK_ONLINE;if(w&&w.firebase&&typeof w.firebase==="object")c=w.firebase}catch(e){}
  if(!c){try{const s=localStorage.getItem("paddock-firebase");if(s)c=JSON.parse(s)}catch(e){}}
  return c&&typeof c.databaseURL==="string"&&/^https:\/\/[a-z0-9.-]+\/?$/i.test(c.databaseURL)&&typeof c.apiKey==="string"?c:null}
function netScript(src){return new Promise((ok,no)=>{const s=document.createElement("script");s.src=src;s.onload=ok;s.onerror=()=>no(new Error("não carregou "+src.split("/").pop()));document.head.appendChild(s)})}
async function netRoom(){const cfg=netConfig();if(!cfg)return null;
  if(!window.firebase||!window.firebase.database){await netScript(NET_FB+"firebase-app-compat.js");await netScript(NET_FB+"firebase-database-compat.js")}
  const fb=window.firebase;const app=fb.apps&&fb.apps.length?fb.app():fb.initializeApp(cfg);NET.db=fb.database(app);
  NET.peer="p"+Date.now().toString(36)+Math.random().toString(36).slice(2,8);
  NET.db.ref(".info/connected").on("value",s=>{NET.conn=!!s.val();if(NET.conn)for(const k in NET.rooms)NET.rooms[k]._re();NET.ch.forEach(h=>{try{h(NET.conn)}catch(e){}})});
  addEventListener("beforeunload",()=>{for(const k in NET.rooms)NET.rooms[k]._bye()});
  return netMkRoom("lobby")}
function netMkRoom(name){const safe=String(name).toLowerCase().replace(/[^a-z0-9-]/g,"").slice(0,40)||"lobby";if(NET.rooms[safe])return NET.rooms[safe];
  const ref=NET.db.ref("pdk/"+safe),me=ref.child(NET.peer);let mine={},hs=new Set(),snap=[],tm=0,wq=0,alive=true;const others=new Map();
  const self=()=>Object.freeze({peer:NET.peer,isMe:true,sameTab:true,kind:"viewer",guest:false,presence:Object.freeze(JSON.parse(JSON.stringify(mine))),updatedAt:Date.now()});
  const build=()=>{snap=Object.freeze([self(),...others.values()])};build();
  const notify=()=>{if(tm)return;tm=setTimeout(()=>{tm=0;build();hs.forEach(h=>{try{h({peers:snap})}catch(e){console.error(e)}})},30)};
  const write=()=>{if(wq)return;wq=1;Promise.resolve().then(()=>{wq=0;if(!alive)return;me.set({j:JSON.stringify(mine),t:window.firebase.database.ServerValue.TIMESTAMP}).catch(e=>console.warn("sala online:",e&&e.message))})};
  const put=s=>{if(s.key===NET.peer)return;let p=null;try{const v=s.val();if(v&&typeof v.j==="string"&&v.j.length<6000&&!(v.t&&Date.now()-v.t>12*3600e3))p=JSON.parse(v.j)}catch(e){p=null}
    if(!p||typeof p!=="object"||Array.isArray(p)){if(others.delete(s.key))notify();return}
    others.set(s.key,Object.freeze({peer:s.key,isMe:false,sameTab:false,kind:"viewer",guest:false,presence:Object.freeze(p),updatedAt:Date.now()}));notify()};
  ref.on("child_added",put);ref.on("child_changed",put);ref.on("child_removed",s=>{if(others.delete(s.key))notify()});
  const api={name:safe,_re(){if(!alive)return;me.onDisconnect().remove();write()},_bye(){try{me.remove()}catch(e){}},
    presence(patch){for(const k in patch){if(patch[k]===null||patch[k]===undefined)delete mine[k];else mine[k]=patch[k]}
      if(JSON.stringify(mine).length>5800)return Promise.reject({code:"invalid_argument",message:"dados grandes demais"});write();build();notify();return Promise.resolve()},
    peers(){return snap},onPeers(h){hs.add(h);setTimeout(()=>h({peers:snap}),0);return()=>hs.delete(h)},
    connected(){return NET.conn},onConnection(h){NET.ch.add(h);setTimeout(()=>h(NET.conn),0);return()=>NET.ch.delete(h)},
    emit(){return Promise.resolve()},on(){return()=>{}},
    leave(){alive=false;ref.off();try{me.onDisconnect().cancel()}catch(e){}delete NET.rooms[safe];return me.remove().catch(()=>{})},
    join(n){return Promise.resolve(netMkRoom("r-"+n))}};
  me.onDisconnect().remove();NET.rooms[safe]=api;return api}
// ---------- colar a configuração do Firebase pela tela (alternativa ao arquivo config.js)
function netParseCfg(txt){let t=String(txt||"");const a=t.indexOf("{"),b=t.lastIndexOf("}");if(a<0||b<a)return null;t=t.slice(a,b+1);
  try{return JSON.parse(t)}catch(e){}try{return JSON.parse(t.replace(/'/g,'"').replace(/([{,]\s*)([A-Za-z_][A-Za-z0-9_]*)\s*:/g,'$1"$2":').replace(/,\s*}/g,"}"))}catch(e){return null}}
function mpNetSetup(){if(window.claude)return"";const has=!!netConfig();
  return`<details class="netcfg"${has?"":" open"}><summary>Usar o meu servidor (Firebase)</summary>
   <p class="muted" style="font-size:12.5px">Cole o <b>firebaseConfig</b> do seu projeto (o guia mostra onde achar). O melhor é colocar no arquivo <b>config.js</b> do site, assim vale para todo mundo; colado aqui, vale só neste aparelho.</p>
   <textarea class="txt" id="mpFb" rows="5" placeholder='{ apiKey: "...", databaseURL: "https://....firebaseio.com", ... }' style="width:100%;box-sizing:border-box;font:12px ui-monospace,monospace"></textarea>
   <div class="row" style="margin-top:6px"><button class="btn sm go" data-act="mpFbSave">Salvar e conectar</button>${has?`<button class="btn sm" data-act="mpFbClear">Esquecer configuração</button>`:""}</div></details>`}
function netAction(a){if(a==="mpFbSave"){const e=document.getElementById("mpFb");const c=netParseCfg(e&&e.value);
    if(!c||!c.databaseURL||!c.apiKey){MP.err="Não entendi a configuração. Ela precisa ter apiKey e databaseURL.";mpScreen();return true}
    try{localStorage.setItem("paddock-firebase",JSON.stringify(c))}catch(x){}MP.err="";MP.st="off";MP.room=null;mpConnect();return true}
  if(a==="mpFbClear"){try{localStorage.removeItem("paddock-firebase")}catch(x){}MP.st="none";mpScreen();return true}return false}
