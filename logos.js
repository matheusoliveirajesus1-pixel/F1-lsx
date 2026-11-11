// ===================== EMBLEMAS DAS EQUIPES =====================
// Desenhos próprios do jogo (não são as marcas reais): cada equipe tem um símbolo simples ligado ao nome dela,
// nas cores da equipe, legível em 12–16 px (torre, classificação, menus).
const LOGO_ART={
  // Mercedez: flecha prateada
  mercedes:(c,d)=>`<circle cx="12" cy="12" r="11" fill="${d}"/><path d="M5 15 L12 6 L19 15 L15.5 15 L12 10.6 L8.5 15Z" fill="${c}"/><rect x="7" y="16.5" width="10" height="2" rx="1" fill="#C8CCD2"/>`,
  // Fehari: chama dentro de um escudo
  ferrari:(c,d)=>`<path d="M12 1.5 L21 4.5 V11 C21 17 16.5 21 12 22.5 C7.5 21 3 17 3 11 V4.5Z" fill="${c}"/><path d="M12 6 C14.5 9 16 10.8 16 13.6 A4 4 0 0 1 8 13.6 C8 12 9 10.8 10 10 C10 11.6 10.8 12.4 11.6 12.6 C11 10.4 11.4 8.2 12 6Z" fill="${d}"/>`,
  // Red Bison Racing: cabeça de bisão de frente, com chifres
  redbull:(c,d)=>`<circle cx="12" cy="12" r="11" fill="${c}"/><path d="M4.5 7.5 C5 10 6.5 11 8.5 11 L8.5 15.5 C8.5 18 10 19.5 12 19.5 C14 19.5 15.5 18 15.5 15.5 L15.5 11 C17.5 11 19 10 19.5 7.5 C18 8.8 16.8 9 15.6 8.8 C14.8 8 13.5 7.6 12 7.6 C10.5 7.6 9.2 8 8.4 8.8 C7.2 9 6 8.8 4.5 7.5Z" fill="${d}"/><circle cx="10.4" cy="12.8" r=".9" fill="${c}"/><circle cx="13.6" cy="12.8" r=".9" fill="${c}"/>`,
  // Racing Bisons: chifres de bisão
  racingbulls:(c,d)=>`<rect x="1.5" y="1.5" width="21" height="21" rx="5" fill="${c}"/><path d="M4 8 C4.5 12 7 13.5 10 13.5 L14 13.5 C17 13.5 19.5 12 20 8 C18.5 10 16.5 10.8 14.5 10.8 L9.5 10.8 C7.5 10.8 5.5 10 4 8Z" fill="${d}"/><rect x="10" y="13.5" width="4" height="5.5" rx="1.5" fill="${d}"/>`,
  // McLarren: monograma M num hexágono
  mclaren:(c,d)=>`<path d="M12 1.5 L21.5 7 V17 L12 22.5 L2.5 17 V7Z" fill="${c}"/><path d="M6.5 16.5 V8 L12 13 L17.5 8 V16.5 H15.3 V12.6 L12 15.6 L8.7 12.6 V16.5Z" fill="${d}"/>`,
  // Alpyne: picos de montanha
  alpine:(c,d)=>`<circle cx="12" cy="12" r="11" fill="${c}"/><path d="M3.5 17.5 L9.5 7.5 L12.5 12.5 L14.8 9 L20.5 17.5Z" fill="${d}"/><path d="M9.5 7.5 L11.2 10.4 L10.2 9.8 L9.5 10.8 L8.6 9.9 L7.9 10.3Z" fill="#FFFFFF"/>`,
  // Hass: H em bloco
  haas:(c,d)=>`<rect x="1.5" y="1.5" width="21" height="21" rx="4" fill="${d}"/><path d="M6 5.5 H9.5 V10.3 H14.5 V5.5 H18 V18.5 H14.5 V13.5 H9.5 V18.5 H6Z" fill="${c}"/>`,
  // Audy: raio num hexágono
  audi:(c,d)=>`<path d="M12 1.5 L21.5 7 V17 L12 22.5 L2.5 17 V7Z" fill="${c}"/><path d="M13.5 4.5 L7.5 13 L11.3 13 L10 19.5 L16.5 10.5 L12.6 10.5Z" fill="${d}"/>`,
  // Willians: losango com ondas
  williams:(c,d)=>`<path d="M12 1.5 L22.5 12 L12 22.5 L1.5 12Z" fill="${c}"/><path d="M6 11 C8 9.2 10 9.2 12 11 C14 12.8 16 12.8 18 11 M6 14.2 C8 12.4 10 12.4 12 14.2 C14 16 16 16 18 14.2" stroke="${d}" stroke-width="1.8" fill="none" stroke-linecap="round"/>`,
  // Aston Marten: pegada de marta
  astonmartin:(c,d)=>`<circle cx="12" cy="12" r="11" fill="${c}"/><ellipse cx="12" cy="15" rx="4" ry="3.4" fill="${d}"/><circle cx="7.6" cy="10.6" r="1.6" fill="${d}"/><circle cx="10.4" cy="8" r="1.6" fill="${d}"/><circle cx="13.6" cy="8" r="1.6" fill="${d}"/><circle cx="16.4" cy="10.6" r="1.6" fill="${d}"/>`,
  // Cadilak: três divisas empilhadas
  cadillac:(c,d)=>`<rect x="1.5" y="1.5" width="21" height="21" rx="3" fill="${c}"/><path d="M5.5 6 L12 10 L18.5 6 M5.5 10.5 L12 14.5 L18.5 10.5 M5.5 15 L12 19 L18.5 15" stroke="${d}" stroke-width="2.2" fill="none" stroke-linejoin="round"/>`};
// equipe criada no multiplayer ou desconhecida: inicial da equipe num círculo
function logoSvgInner(t){const f=LOGO_ART[t.id];if(f)return f(t.c||"#888",logoInk(t));const ch=esc0((t.n||"?").trim().charAt(0).toUpperCase());return`<circle cx="12" cy="12" r="11" fill="${t.c||"#888"}"/><text x="12" y="16.5" font-size="13" font-weight="900" text-anchor="middle" font-family="system-ui,sans-serif" fill="${logoInk(t)}">${ch}</text>`}
// cor do símbolo: a segunda cor da equipe, a não ser que ela some sobre a primeira
function logoInk(t){const a=t.c||"#888",b=t.c2||"#FFFFFF";const L=h=>{const n=parseInt(String(h).replace("#","").slice(0,6),16);if(isNaN(n))return .5;return(.299*(n>>16&255)+.587*(n>>8&255)+.114*(n&255))/255};return Math.abs(L(a)-L(b))>.28?b:(L(a)>.55?"#111111":"#FFFFFF")}
function esc0(s){return String(s).replace(/[&<>"]/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[m]))}
// HTML pronto para colocar ao lado do nome (substitui a antiga tarja de cor)
function teamLogo(t,cls){if(!t)return"";return`<svg class="${cls||"tlogo"}" viewBox="0 0 24 24" aria-hidden="true">${logoSvgInner(t)}</svg>`}
// imagem para desenhar em canvas (transmissão)
const LOGO_IMG={};function logoImg(t){if(!t||typeof Image==="undefined")return null;const k=t.id+(t.c||"")+(t.c2||"");if(LOGO_IMG[k])return LOGO_IMG[k];const im=new Image();im.src="data:image/svg+xml;charset=utf-8,"+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="64" height="64">${logoSvgInner(t)}</svg>`);LOGO_IMG[k]=im;return im}
