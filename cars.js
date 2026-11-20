// ===================== O AR EM VOLTA DOS CARROS =====================
// Os carros são desenhados só em 3D (carro3d.js). Aqui ficam os efeitos do ar por cima da cena: linhas do vácuo atrás
// do carro da frente, o ar sujo nas curvas e as linhas de velocidade.
function carFxAll(items,ctx,cw,ch,WP,detail){if(!detail||CAM.z<.55||!R||!R.started)return;const now=performance.now()/1000;
  for(const c of R.cars){const p=WP[c.id];if(!p||!running(c)||c.pit)continue;
    const A=c.aheadO,pa=A&&WP[A.id];
    if((c.tow||0)>.18&&pa){items.push({d:p.x+p.y-2,draw:()=>drawTow(ctx,cw,ch,p,pa,c.tow,now)})}
    else if((c.dirtyK||0)>.3&&pa){items.push({d:p.x+p.y-2,draw:()=>drawDirty(ctx,cw,ch,p,pa,c.dirtyK,now)})}
    if(c.isP&&(c.v||0)>70)items.push({d:p.x+p.y+1,draw:()=>drawSpeedLines(ctx,cw,ch,p,c.v,now)})}}
// linhas de ar saindo da traseira do carro da frente e envolvendo o carro de trás
function drawTow(ctx,cw,ch,p,pa,k,now){const Z=CAM.z;const dx=p.x-pa.x,dy=p.y-pa.y,L=Math.hypot(dx,dy);if(L<8||L>WS*45)return;const ux=dx/L,uy=dy/L,nx=-uy,ny=ux;
  ctx.lineWidth=Math.max(1,.45*WS*Z*.5);ctx.lineCap="round";
  for(let j=0;j<3;j++){const off=(j-1)*1.6*WS;const ph=((now*2.2+j*.23)%1);ctx.strokeStyle=`rgba(225,240,255,${(.1+.22*k)*(1-Math.abs(j-1)*.25)})`;
    ctx.beginPath();for(let s=0;s<=14;s++){const t=s/14;const spread=Math.sin(t*Math.PI)*off*(1.4-t*.4)+off*t*.6;const x=pa.x+dx*(t*1.05)-ux*10*CSC+nx*spread,y=pa.y+dy*(t*1.05)-uy*10*CSC+ny*spread;const q=toScreen(x,y,(2+Math.sin(t*6+j)*.4)*CSC,cw,ch);s?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1])}
    ctx.setLineDash([6*Z,10*Z]);ctx.lineDashOffset=-ph*16*Z;ctx.stroke()}
  ctx.setLineDash([]);ctx.lineDashOffset=0}
// ar sujo: redemoinhos atrás do carro da frente nas curvas
function drawDirty(ctx,cw,ch,p,pa,k,now){const Z=CAM.z;const dx=p.x-pa.x,dy=p.y-pa.y,L=Math.hypot(dx,dy);if(L<8)return;const ux=dx/L,uy=dy/L;
  ctx.lineWidth=Math.max(1,.35*WS*Z*.5);for(let j=0;j<6;j++){const t=(j+.5)/6;const cx=pa.x+dx*t,cy=pa.y+dy*t;const r=(1.5+t*3)*WS;const a0=now*4+j*1.3;const c=toScreen(cx,cy,2.2*CSC,cw,ch);
    ctx.strokeStyle=`rgba(255,215,170,${.12+k*.22})`;ctx.beginPath();ctx.ellipse(c[0],c[1],r*Z*.9,r*Z*.45,0,a0,a0+3.6);ctx.stroke()}}
function drawSpeedLines(ctx,cw,ch,p,v,now){const Z=CAM.z,co=Math.cos(p.h),si=Math.sin(p.h);const k=clamp((v-70)/25,0,1);ctx.lineWidth=1;
  for(let j=0;j<2;j++){const side=j%2?1:-1,lat=side*6*CSC;const ph=((now*3+j*.37)%1);const u0=(6-ph*26)*CSC,u1=u0-8*CSC;
    const a=toScreen(p.x+co*u0-si*lat,p.y+si*u0+co*lat,2*CSC,cw,ch),b=toScreen(p.x+co*u1-si*lat,p.y+si*u1+co*lat,2*CSC,cw,ch);ctx.strokeStyle=`rgba(255,255,255,${.16*k*(1-ph)})`;ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);ctx.stroke()}}

// texto pintado numa superfície do carro: origem O, fim do eixo do texto X, fim do eixo da altura Y (pontos de tela).
// Escolhe o sentido que deixa o texto legível (nunca espelhado), e não desenha se ficar pequeno demais para ler.
