// @ts-nocheck
/* ============================================================
   ANTHRA A-40 — 3D Watch Engine (complete, self-contained)
   ============================================================ */

const clamp = (v, a = 0, b = 1) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (t) => t * t * (3 - 2 * t);
const easeOutExpo = (t) => t >= 1 ? 1 : 1 - Math.pow(2, -10 * t);
const TAU = Math.PI * 2, D2R = Math.PI / 180;

const V = {
  sub: (a, b) => [a[0]-b[0],a[1]-b[1],a[2]-b[2]],
  add: (a, b) => [a[0]+b[0],a[1]+b[1],a[2]+b[2]],
  mul: (a, s) => [a[0]*s,a[1]*s,a[2]*s],
  dot: (a, b) => a[0]*b[0]+a[1]*b[1]+a[2]*b[2],
  cross: (a, b) => [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],
  norm: (a) => { const l = Math.hypot(a[0],a[1],a[2]) || 1; return [a[0]/l,a[1]/l,a[2]/l]; }
};
const rotY = (p, a) => { const c = Math.cos(a), s = Math.sin(a); return [p[0]*c+p[2]*s, p[1], -p[0]*s+p[2]*c]; };
const rotX = (p, a) => { const c = Math.cos(a), s = Math.sin(a); return [p[0], p[1]*c-p[2]*s, p[1]*s+p[2]*c]; };
const rotZ = (p, a) => { const c = Math.cos(a), s = Math.sin(a); return [p[0]*c-p[1]*s, p[0]*s+p[1]*c, p[2]]; };

function hex2rgb(h) { h = h.replace('#',''); return [parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)]; }
function mixc(a, b, t) { return [a[0]+(b[0]-a[0])*t, a[1]+(b[1]-a[1])*t, a[2]+(b[2]-a[2])*t]; }
function rgbs(c, al) { return 'rgba('+(c[0]|0)+','+(c[1]|0)+','+(c[2]|0)+','+(al===undefined?1:al)+')'; }

const METALS = {
  titanium: { key:'titanium', name:'Titanium', model:'A-40/01', chip:'#9AA1A9', gloss:.95, d:hex2rgb('#101318'), m:hex2rgb('#99a1ab'), l:hex2rgb('#ffffff') },
  onyx:     { key:'onyx',     name:'Onyx',     model:'A-40/02', chip:'#1B1D21', gloss:.55, d:hex2rgb('#030405'), m:hex2rgb('#1e2126'), l:hex2rgb('#596069') },
  bronze:   { key:'bronze',   name:'Bronze',   model:'A-40/03', chip:'#8A6A3C', gloss:.82, d:hex2rgb('#1f1408'), m:hex2rgb('#8a6a3c'), l:hex2rgb('#f0d6a4') },
  slate:    { key:'slate',    name:'Slate',    model:'A-40/04', chip:'#5A6879', gloss:.72, d:hex2rgb('#0d1218'), m:hex2rgb('#536170'), l:hex2rgb('#c2d2e2') }
};
const ORDER = ['titanium','onyx','bronze','slate'];
const L1 = V.norm([-0.42,0.62,0.66]);
const L2 = V.norm([0.78,0.30,0.54]);
const EYE = [0,0,1];

function envLight(R, rough) {
  const w = 1+rough*3.2, amp = 1/(1+rough*1.2);
  const az = Math.atan2(R[0],R[2]);
  const band = Math.exp(-Math.pow((R[1]-0.12)*(2.1/w),2));
  const s1 = Math.exp(-Math.pow((az+0.85)*(2.7/w),2))*1.8;
  const s2 = Math.exp(-Math.pow((az-1.05)*(3.3/w),2))*1.2;
  const lid = smooth(clamp(R[1]*0.9+0.35))*0.55;
  const floor = -0.24*smooth(clamp(-R[1]*1.25));
  return 0.17+lid+floor+(s1+s2)*band*amp;
}
const toneMap = (x) => 1.07*x/(x+0.60);

function shade(n, pal, rough, tint, ax) {
  const gl = pal.gloss === undefined ? 0.8 : pal.gloss;
  const pol = (rough||60) >= 90;
  const NdE = clamp(V.dot(n,EYE),-1,1);
  const R = [2*NdE*n[0]-EYE[0],2*NdE*n[1]-EYE[1],2*NdE*n[2]-EYE[2]];
  const fres = 0.30+0.70*Math.pow(1-Math.abs(NdE),5);
  const d1 = Math.max(0,V.dot(n,L1)), d2 = Math.max(0,V.dot(n,L2));
  let env;
  if (pol) env = envLight(R,0.04);
  else if (ax) {
    const t = V.norm(V.cross(ax,n)); let e = 0;
    for (const k of [-0.24,0,0.24]) {
      const nn = V.norm([n[0]+t[0]*k,n[1]+t[1]*k,n[2]+t[2]*k]);
      const NE = clamp(V.dot(nn,EYE),-1,1);
      e += envLight([2*NE*nn[0]-EYE[0],2*NE*nn[1]-EYE[1],2*NE*nn[2]-EYE[2]],0.5);
    }
    env = e/3;
  } else env = envLight(R,0.5);
  const h1 = V.norm(V.add(L1,EYE)), h2 = V.norm(V.add(L2,EYE));
  const pw = pol ? 240 : 70;
  const sp = Math.pow(Math.max(0,V.dot(n,h1)),pw)*1.5 + Math.pow(Math.max(0,V.dot(n,h2)),pw)*0.9;
  const Lx = 0.055+0.15*d1+0.06*d2+env*(0.30+0.70*fres)*gl;
  const t2 = clamp(toneMap(Lx),0,1);
  let c = t2 < 0.5 ? mixc(pal.d,pal.m,t2/0.5) : mixc(pal.m,pal.l,(t2-0.5)/0.5);
  c = mixc(c,[255,255,255],clamp(sp*gl,0,1));
  if (tint) c = mixc(c,tint,0.5);
  return c;
}

const CASE_R = 1.0, CASE_T = 0.30, DIAL_Z = 0.10;

function quad(a,b,c,d,mat,extra) {
  const n = V.norm(V.cross(V.sub(b,a),V.sub(d,a)));
  return Object.assign({p:[a,b,c,d],n,mat:mat||'metal'}, extra||{});
}
function band(r0,z0,r1,z1,seg,mat,extra) {
  const out = [];
  for (let i=0;i<seg;i++) {
    const a0=i/seg*TAU, a1=(i+1)/seg*TAU;
    const A=[Math.cos(a0)*r0,Math.sin(a0)*r0,z0], B=[Math.cos(a1)*r0,Math.sin(a1)*r0,z0];
    const C=[Math.cos(a1)*r1,Math.sin(a1)*r1,z1], D=[Math.cos(a0)*r1,Math.sin(a0)*r1,z1];
    const f = quad(A,B,C,D,mat,extra);
    const m = Math.hypot(f.n[0],f.n[1]), nz = f.n[2];
    f.vn0 = [Math.cos(a0)*m,Math.sin(a0)*m,nz]; f.vn1 = [Math.cos(a1)*m,Math.sin(a1)*m,nz];
    out.push(f);
  }
  return out;
}
function annulus(ri,ro,z,seg,mat,extra) {
  const out = [];
  for (let i=0;i<seg;i++) {
    const a0=i/seg*TAU, a1=(i+1)/seg*TAU;
    const A=[Math.cos(a0)*ri,Math.sin(a0)*ri,z], B=[Math.cos(a1)*ri,Math.sin(a1)*ri,z];
    const C=[Math.cos(a1)*ro,Math.sin(a1)*ro,z], D=[Math.cos(a0)*ro,Math.sin(a0)*ro,z];
    out.push(quad(A,B,C,D,mat,extra));
  }
  return out;
}
function box(c,ax,ay,az,mat,extra) {
  const P = (sx,sy,sz) => [c[0]+ax[0]*sx+ay[0]*sy+az[0]*sz, c[1]+ax[1]*sx+ay[1]*sy+az[1]*sz, c[2]+ax[2]*sx+ay[2]*sy+az[2]*sz];
  const v = [P(-1,-1,-1),P(1,-1,-1),P(1,1,-1),P(-1,1,-1),P(-1,-1,1),P(1,-1,1),P(1,1,1),P(-1,1,1)];
  return [quad(v[4],v[5],v[6],v[7],mat,extra),quad(v[1],v[0],v[3],v[2],mat,extra),quad(v[0],v[1],v[5],v[4],mat,extra),quad(v[3],v[7],v[6],v[2],mat,extra),quad(v[0],v[4],v[7],v[3],mat,extra),quad(v[1],v[2],v[6],v[5],mat,extra)];
}

const LOOP = {cz:-1.30,Ry:2.00,Rz:1.50,phi0:30*D2R,N:38};
function loopPoint(phi) { return [0, LOOP.Ry*Math.sin(phi), LOOP.cz+LOOP.Rz*Math.cos(phi)]; }
function loopTangent(phi) { return V.norm([0, LOOP.Ry*Math.cos(phi), -LOOP.Rz*Math.sin(phi)]); }

function buildBracelet() {
  const F = [], a0 = LOOP.phi0, a1 = TAU-LOOP.phi0, N = LOOP.N;
  for (let i=0;i<N;i++) {
    const u=(i+0.5)/N, phi=lerp(a0,a1,u);
    const P=loopPoint(phi), T=loopTangent(phi);
    const R=V.norm(V.cross([1,0,0],T));
    const step=(a1-a0)/N;
    const half=Math.hypot(LOOP.Ry*Math.cos(phi),LOOP.Rz*Math.sin(phi))*step*0.47;
    const taper=Math.abs(phi-Math.PI)/(Math.PI-a0);
    const w=0.455+0.155*taper, th=0.062, gap=0.020;
    const mid=w*0.34, out_w=(w-mid-gap*2)*0.5, offx=mid+gap+out_w;
    const Pc=V.add(P,V.mul(R,0.014)), Po=V.add(P,V.mul(R,-0.006));
    F.push(...box(Pc,[mid,0,0],V.mul(T,half),V.mul(R,th*1.2),'link',{kind:'c'}));
    F.push(...box([Po[0]+offx,Po[1],Po[2]],[out_w,0,0],V.mul(T,half*0.99),V.mul(R,th),'link',{kind:'o'}));
    F.push(...box([Po[0]-offx,Po[1],Po[2]],[out_w,0,0],V.mul(T,half*0.99),V.mul(R,th),'link',{kind:'o'}));
  }
  return F;
}

function buildCase() {
  const F = [], S = 48;
  F.push(...band(CASE_R,-CASE_T*0.5,CASE_R,CASE_T*0.42,S,'metal',{grp:'case'}));
  F.push(...band(CASE_R,CASE_T*0.42,0.965,CASE_T*0.55,S,'metal',{grp:'bezel'}));
  F.push(...annulus(0.845,0.965,CASE_T*0.55,S,'metal',{grp:'bezel'}));
  F.push(...band(0.845,CASE_T*0.55,0.845,DIAL_Z,S,'metal',{grp:'bezel'}));
  F.push(...band(CASE_R,-CASE_T*0.5,0.80,-CASE_T*0.66,S,'metal',{grp:'back'}));
  F.push(...annulus(0.0,0.80,-CASE_T*0.66,S,'metal',{grp:'back',glass:true}));
  for (const sy of [1,-1]) for (const sx of [1,-1]) F.push(...box([sx*0.60,sy*0.985,-0.01],[0.085,0,0],[0,0.115,0],[0,0,0.075],'metal',{grp:'lug'}));
  const cz = 0;
  F.push(...band(0.115,0,0.115,0,12,'metal',{grp:'crown'}));
  for (let i=0;i<14;i++) { const a=i/14*TAU; F.push(...box([1.055+0.045,Math.sin(a)*0.10,cz+Math.cos(a)*0.10],[0.048,0,0],[0,0.016,0],[0,0,0.016],'metal',{grp:'crown'})); }
  F.push(...box([1.06,0,cz],[0.05,0,0],[0,0.088,0],[0,0,0.088],'metal',{grp:'crown'}));
  for (const sy of [0.40,-0.40]) F.push(...box([1.045,sy,cz],[0.042,0,0],[0,0.062,0],[0,0,0.062],'metal',{grp:'crown'}));
  return F;
}

function buildMovement() {
  const F = [];
  F.push(...band(0.78,-0.05,0.78,0.05,40,'metal',{grp:'mvt'}));
  F.push(...annulus(0,0.78,0.05,40,'metal',{grp:'mvt',plate:true}));
  return F;
}

const GEO = { bracelet: buildBracelet(), cases: buildCase(), mvt: buildMovement() };
const CAM = { dist: 9.2, focal: 9.2 };

function makeXform(st) {
  const f = st.focus;
  return (p) => {
    let q = [p[0],p[1],p[2]];
    if (st.explodeFn) q = st.explodeFn(q,p);
    if (f) q = [q[0]-f[0],q[1]-f[1],q[2]-f[2]];
    q = rotZ(q, st.rz||0); q = rotY(q, st.ry||0); q = rotX(q, st.rx||0);
    return q;
  };
}
function project(q, st) {
  const d = CAM.dist-q[2];
  const k = (CAM.focal/Math.max(0.35,d))*st.scale;
  return [st.cx+q[0]*k, st.cy-q[1]*k, q[2], k];
}
function xnorm(n, st) { let q = rotZ(n,st.rz||0); q = rotY(q,st.ry||0); return rotX(q,st.rx||0); }

let DIALC = null, DIALKEY = '', DIAL_S = 560, DIAL_P = 0.02;
let ctx = null;
let _DPR = 1;

function buildDialArt(pal) {
  const R = 0.845, RP = R+DIAL_P, S = DIAL_S, Wc = Math.ceil(2*RP*S);
  DIALC = document.createElement('canvas'); DIALC.width = DIALC.height = Wc;
  const live = ctx; ctx = DIALC.getContext('2d');
  ctx.setTransform(S,0,0,-S,Wc/2,Wc/2);
  const DISP = "'Avenir Next', sans-serif";
  const smoke = true;
  const g = ctx.createRadialGradient(-0.28,0.30,0.02,0,0,R*1.12);
  g.addColorStop(0, smoke?'#585F66':'#FBFCFD'); g.addColorStop(.45, smoke?'#393E44':'#E7EAED'); g.addColorStop(1, smoke?'#1F2429':'#C3C9CF');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0,0,R,0,TAU); ctx.fill();
  const ETCH = '255,255,255';
  ctx.lineWidth = 0.0055;
  for (let i=0;i<220;i++) { const t=i/220*TAU; ctx.strokeStyle='rgba('+ETCH+','+(0.035+0.035*Math.cos(t*3))+')'; ctx.beginPath(); ctx.moveTo(Math.cos(t)*0.10,Math.sin(t)*0.10); ctx.lineTo(Math.cos(t)*R,Math.sin(t)*R); ctx.stroke(); }
  ctx.lineWidth = 0.004;
  for (let r=0.16;r<R;r+=0.045) { ctx.strokeStyle='rgba('+ETCH+',.032)'; ctx.beginPath(); ctx.arc(0,0,r,0,TAU); ctx.stroke(); }
  ctx.strokeStyle = 'rgba('+ETCH+',.16)'; ctx.lineWidth = 0.008;
  ctx.beginPath(); ctx.arc(0,0,R*0.90,0,TAU); ctx.stroke();
  const FUR = '240,244,248';
  const ML = rgbs(pal.l), MM = rgbs(pal.m);
  for (let i=0;i<60;i++) { const t=i/60*TAU, maj=i%5===0; ctx.strokeStyle = maj ? 'rgba('+FUR+',.80)' : 'rgba('+FUR+',.34)'; ctx.lineWidth = maj ? 0.011 : 0.005; ctx.beginPath(); ctx.moveTo(Math.cos(t)*R*0.885,Math.sin(t)*R*0.885); ctx.lineTo(Math.cos(t)*R*(maj?0.825:0.850),Math.sin(t)*R*(maj?0.825:0.850)); ctx.stroke(); }
  ctx.save(); ctx.scale(1,-1);
  ctx.font = '300 0.135px '+DISP; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (let i=1;i<=12;i++) { if (i===12||i===6) continue; const t=(i/12)*TAU-Math.PI/2; const x=Math.cos(t)*R*0.70,y=Math.sin(t)*R*0.70; ctx.fillStyle='rgba('+FUR+',.90)'; ctx.fillText(String(i),x,-y); }
  ctx.fillStyle='rgba('+FUR+',.96)'; ctx.font='300 0.15px '+DISP; ctx.fillText('12',0,-R*0.70); ctx.fillText('6',0,R*0.70);
  ctx.font='400 0.066px '+DISP; ctx.fillStyle='rgba('+FUR+',.94)'; ctx.fillText('ANTHRA',-0.30,0.012);
  ctx.font='400 0.040px Inter, Helvetica, Arial'; ctx.fillStyle='rgba('+FUR+',.62)'; ctx.fillText('AUTOMATIC',0.34,-0.018); ctx.fillText('A-40',0.34,0.036);
  ctx.restore();
  const mpY=0.34;
  ctx.save(); ctx.beginPath(); ctx.arc(0,mpY,0.20,0,TAU); ctx.clip();
  const mg=ctx.createLinearGradient(0,mpY+0.2,0,mpY-0.2); mg.addColorStop(0,'#0a0b0c'); mg.addColorStop(1,'#1e2124'); ctx.fillStyle=mg; ctx.fillRect(-0.2,mpY-0.2,0.4,0.4);
  ctx.fillStyle='rgba(236,240,244,.92)'; ctx.beginPath(); ctx.arc(-0.055,mpY+0.045,0.072,0,TAU); ctx.fill(); ctx.beginPath(); ctx.arc(0.105,mpY+0.02,0.048,0,TAU); ctx.fill(); ctx.restore();
  ctx.strokeStyle='rgba('+FUR+',.34)'; ctx.lineWidth=0.008; ctx.beginPath(); ctx.arc(0,mpY,0.20,0,TAU); ctx.stroke();
  const th=-0.30;
  ctx.save(); ctx.beginPath(); ctx.arc(0,th,0.185,0,TAU); ctx.clip(); ctx.fillStyle='#0C1116'; ctx.fillRect(-0.2,th-0.2,0.4,0.4); ctx.translate(0,th);
  ctx.strokeStyle='rgba(194,162,106,.95)'; ctx.lineWidth=0.016; ctx.beginPath(); ctx.arc(0,0,0.115,0,TAU); ctx.stroke();
  ctx.strokeStyle='rgba(205,186,150,.8)'; ctx.lineWidth=0.008; ctx.beginPath(); ctx.arc(0,0,0.062,0,TAU); ctx.stroke(); ctx.restore();
  ctx.strokeStyle='rgba('+FUR+',.36)'; ctx.lineWidth=0.008; ctx.beginPath(); ctx.arc(0,th,0.185,0,TAU); ctx.stroke();
  ctx.fillStyle='rgba(232,237,242,.95)'; ctx.fillRect(0.53,-0.055,0.135,0.11);
  ctx.save(); ctx.scale(1,-1); ctx.font='400 0.075px Inter, Helvetica, Arial'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillStyle='#111'; ctx.fillText('24',0.5975,-0.002); ctx.restore();
  const arc=ctx.createRadialGradient(0,0,R*0.62,0,0,R); arc.addColorStop(0,'rgba(96,88,190,0)'); arc.addColorStop(.78,'rgba(96,88,190,.045)'); arc.addColorStop(1,'rgba(120,96,215,.13)'); ctx.fillStyle=arc; ctx.beginPath(); ctx.arc(0,0,R,0,TAU); ctx.fill();
  ctx.save(); ctx.rotate(-0.62);
  const st1=ctx.createLinearGradient(0,R*0.10,0,R*0.46); st1.addColorStop(0,'rgba(255,255,255,0)'); st1.addColorStop(.5,'rgba(255,255,255,.085)'); st1.addColorStop(1,'rgba(255,255,255,0)'); ctx.fillStyle=st1; ctx.fillRect(-R,R*0.10,2*R,R*0.36);
  ctx.restore();
  ctx = live; DIALKEY = pal.key;
}

function drawDial(st, pal, opt) {
  opt = opt || {};
  const X = makeXform(st);
  const z = opt.z !== undefined ? opt.z : DIAL_Z;
  const O = project(X([0,0,z]),st), U = project(X([1,0,z]),st), Vv = project(X([0,1,z]),st);
  const ux=U[0]-O[0],uy=U[1]-O[1],vx=Vv[0]-O[0],vy=Vv[1]-O[1];
  if (Math.abs(ux*vy-uy*vx)<1.2) return;
  const facing = xnorm([0,0,1],st)[2];
  if (opt.back ? facing>-0.02 : facing<0.02) return;
  ctx.save(); ctx.transform(ux,uy,vx,vy,O[0],O[1]);
  const R=0.845, a=clamp(Math.abs(facing)*1.4)*(opt.alpha===undefined?1:opt.alpha);
  ctx.globalAlpha=a; ctx.beginPath(); ctx.arc(0,0,R,0,TAU); ctx.clip();
  if (opt.back) { drawCaseback(pal,R); ctx.restore(); return; }
  if (!DIALC||DIALKEY!==pal.key) buildDialArt(pal);
  ctx.save(); ctx.scale(1,-1); const RP=0.845+DIAL_P; ctx.drawImage(DIALC,-RP,-RP,2*RP,2*RP); ctx.restore();
  const smoke=true, ML=rgbs(pal.l), MM=rgbs(pal.m), spin=(opt.spin||0), th=-0.30;
  ctx.save(); ctx.beginPath(); ctx.arc(0,th,0.185,0,TAU); ctx.clip(); ctx.translate(0,th); ctx.rotate(spin);
  ctx.strokeStyle='rgba(194,162,106,.95)'; ctx.lineWidth=0.011;
  for (let i=0;i<3;i++){const t=i/3*TAU; ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(Math.cos(t)*0.115,Math.sin(t)*0.115); ctx.stroke();}
  ctx.rotate(-spin*2.6); ctx.strokeStyle='rgba(226,214,188,.9)'; ctx.lineWidth=0.010; ctx.beginPath(); ctx.moveTo(-0.05,0); ctx.lineTo(0.05,0); ctx.stroke(); ctx.restore();
  const hh=opt.hourAng!==undefined?opt.hourAng:(-40*D2R), mm=opt.minAng!==undefined?opt.minAng:(72*D2R);
  const HL=smoke?ML:'#5B646D', HD=smoke?MM:'#14181C';
  drawHand(hh,0.44,0.030,HL,HD); drawHand(mm,0.66,0.024,HL,HD);
  ctx.save(); ctx.rotate(spin*0.55); ctx.strokeStyle='rgba(194,162,106,.95)'; ctx.lineWidth=0.010; ctx.beginPath(); ctx.moveTo(0,-0.14); ctx.lineTo(0,0.60); ctx.stroke(); ctx.restore();
  ctx.fillStyle=HL; ctx.beginPath(); ctx.arc(0,0,0.030,0,TAU); ctx.fill();
  ctx.fillStyle=smoke?'#0b0b0c':'#F2F4F6'; ctx.beginPath(); ctx.arc(0,0,0.013,0,TAU); ctx.fill();
  ctx.restore();
}

function drawBezelFace(st,pal,alpha) {
  const X=makeXform(st), z=CASE_T*0.55+0.002;
  const O=project(X([0,0,z]),st),U=project(X([1,0,z]),st),Vv=project(X([0,1,z]),st);
  const ux=U[0]-O[0],uy=U[1]-O[1],vx=Vv[0]-O[0],vy=Vv[1]-O[1];
  if (Math.abs(ux*vy-uy*vx)<1.2) return;
  const facing=xnorm([0,0,1],st)[2]; if (facing<0.03) return;
  ctx.save(); ctx.transform(ux,uy,vx,vy,O[0],O[1]); ctx.globalAlpha=clamp(alpha*facing*1.5);
  const ri=0.845, ro=0.985;
  ctx.beginPath(); ctx.arc(0,0,ro,0,TAU); ctx.arc(0,0,ri,0,TAU,true); ctx.clip('evenodd');
  for (let i=0;i<64;i++) { const a0=i/64*TAU,a1=(i+1)/64*TAU,am=(a0+a1)/2; const n=V.norm(xnorm([Math.cos(am)*0.42,Math.sin(am)*0.42,0.85],st)); const c=shade(n,pal,120); ctx.fillStyle=rgbs(c); ctx.beginPath(); ctx.moveTo(0,0); ctx.arc(0,0,ro,a0-0.004,a1+0.004); ctx.closePath(); ctx.fill(); }
  ctx.restore();
  ctx.save(); ctx.transform(ux,uy,vx,vy,O[0],O[1]); ctx.globalAlpha=clamp(alpha*facing*1.5);
  for (let i=0;i<8;i++) { const a=i/8*TAU+Math.PI/8, sx=Math.cos(a)*0.915, sy=Math.sin(a)*0.915; const g=ctx.createLinearGradient(sx-0.03,sy-0.03,sx+0.03,sy+0.03); g.addColorStop(0,rgbs(pal.l)); g.addColorStop(1,rgbs(pal.d)); ctx.fillStyle=g; ctx.beginPath(); ctx.arc(sx,sy,0.032,0,TAU); ctx.fill(); ctx.strokeStyle='rgba(0,0,0,.45)'; ctx.lineWidth=0.008; ctx.beginPath(); ctx.moveTo(sx-0.021,sy-0.012); ctx.lineTo(sx+0.021,sy+0.012); ctx.stroke(); }
  ctx.restore();
}

function drawHand(ang,len,w,ML,MM) {
  ctx.save(); ctx.rotate(ang); const g=ctx.createLinearGradient(-w,0,w,0); g.addColorStop(0,MM); g.addColorStop(.45,ML); g.addColorStop(1,MM); ctx.fillStyle=g;
  ctx.beginPath(); ctx.moveTo(-w,-0.10); ctx.lineTo(-w*0.55,len); ctx.lineTo(0,len+w*1.5); ctx.lineTo(w*0.55,len); ctx.lineTo(w,-0.10); ctx.closePath(); ctx.fill();
  ctx.strokeStyle='rgba(0,0,0,.35)'; ctx.lineWidth=0.004; ctx.stroke(); ctx.restore();
}

function drawCaseback(pal,R) {
  const g=ctx.createRadialGradient(-0.25,0.28,0.02,0,0,R); g.addColorStop(0,rgbs(pal.l)); g.addColorStop(.5,rgbs(pal.m)); g.addColorStop(1,rgbs(pal.d)); ctx.fillStyle=g; ctx.beginPath(); ctx.arc(0,0,R,0,TAU); ctx.fill();
  ctx.save(); ctx.beginPath(); ctx.arc(0,0,R*0.62,0,TAU); ctx.clip(); ctx.fillStyle='#0e0f11'; ctx.fillRect(-R,-R,2*R,2*R);
  ctx.restore();
  ctx.strokeStyle='rgba(255,255,255,.25)'; ctx.lineWidth=0.012; ctx.beginPath(); ctx.arc(0,0,R*0.62,0,TAU); ctx.stroke();
}

let DOFC = null;
function matRough(f) { if (f.mat==='link') return f.kind==='c'?140:70; if (f.grp==='bezel') return 140; return 62; }

function drawFaces(faces, st, pal, opt) {
  opt = opt || {};
  const X = makeXform(st), out = [];
  const ax = xnorm([0,0,1],st);
  for (const f of faces) {
    if (opt.filter && !opt.filter(f)) continue;
    const q = [X(f.p[0]),X(f.p[1]),X(f.p[2]),X(f.p[3])];
    const n = xnorm(f.n,st);
    const cz=(q[0][2]+q[1][2]+q[2][2]+q[3][2])*0.25;
    const cxm=(q[0][0]+q[1][0]+q[2][0]+q[3][0])*0.25;
    const cym=(q[0][1]+q[1][1]+q[2][1]+q[3][1])*0.25;
    const view=V.norm([-cxm,-cym,CAM.dist-cz]);
    if (V.dot(n,view)<=0.001) continue;
    out.push({q,n,z:cz,f});
  }
  out.sort((a,b)=>a.z-b.z);
  const al=opt.alpha===undefined?1:opt.alpha;
  const paint=(o)=>{ const r=matRough(o.f); const P=o.q.map(p=>project(p,st)); ctx.beginPath(); ctx.moveTo(P[0][0],P[0][1]); for(let i=1;i<4;i++) ctx.lineTo(P[i][0],P[i][1]); ctx.closePath();
    if (o.f.vn0) { const cA=shade(xnorm(o.f.vn0,st),pal,r,null,ax); const cB=shade(xnorm(o.f.vn1,st),pal,r,null,ax); const ax0=(P[0][0]+P[3][0])/2,ay0=(P[0][1]+P[3][1])/2,bx0=(P[1][0]+P[2][0])/2,by0=(P[1][1]+P[2][1])/2; let fill; if(Math.abs(ax0-bx0)+Math.abs(ay0-by0)<0.75) fill=rgbs(cA); else { const g=ctx.createLinearGradient(ax0,ay0,bx0,by0); g.addColorStop(0,rgbs(cA)); g.addColorStop(1,rgbs(cB)); fill=g; } ctx.fillStyle=fill; ctx.fill(); ctx.strokeStyle=fill; ctx.lineWidth=0.6; ctx.stroke(); } else { const c=shade(o.n,pal,r,null,ax); ctx.fillStyle=rgbs(c); ctx.fill(); ctx.strokeStyle=rgbs(c); ctx.lineWidth=0.6; ctx.stroke(); } };
  ctx.save(); ctx.globalAlpha=al;
  for (const o of out) paint(o);
  ctx.restore();
}

function drawMovementFace(st,pal,alpha,spin) {
  const X=makeXform(st);
  const O=project(X([0,0,0.051]),st),U=project(X([1,0,0.051]),st),Vv=project(X([0,1,0.051]),st);
  const ux=U[0]-O[0],uy=U[1]-O[1],vx=Vv[0]-O[0],vy=Vv[1]-O[1];
  if (Math.abs(ux*vy-uy*vx)<1.2) return;
  const facing=xnorm([0,0,1],st)[2]; if (facing<0.02) return;
  ctx.save(); ctx.transform(ux,uy,vx,vy,O[0],O[1]); ctx.globalAlpha=clamp(alpha*facing*1.4);
  const R=0.78; ctx.beginPath(); ctx.arc(0,0,R,0,TAU); ctx.clip();
  const g=ctx.createRadialGradient(-0.2,0.25,0.02,0,0,R); g.addColorStop(0,'#c8ced4'); g.addColorStop(.55,'#8d949b'); g.addColorStop(1,'#4c5257'); ctx.fillStyle=g; ctx.fillRect(-R,-R,2*R,2*R);
  ctx.save(); ctx.rotate(-0.5);
  for (let x=-R;x<R;x+=0.075) { const lg=ctx.createLinearGradient(x,0,x+0.075,0); lg.addColorStop(0,'rgba(255,255,255,.16)'); lg.addColorStop(1,'rgba(0,0,0,.13)'); ctx.fillStyle=lg; ctx.fillRect(x,-R,0.075,2*R); }
  ctx.restore();
  ctx.save(); ctx.rotate(spin*0.35); ctx.beginPath(); ctx.moveTo(0,0); ctx.arc(0,0,R*0.92,-0.25,Math.PI+0.25); ctx.closePath();
  const rg=ctx.createLinearGradient(-R,R,R,-R); rg.addColorStop(0,'#3b3f43'); rg.addColorStop(.5,'#202326'); rg.addColorStop(1,'#0e1012'); ctx.fillStyle=rg; ctx.fill(); ctx.restore();
  const wheels=[[0.30,-0.10,0.17],[0.05,-0.30,0.13],[-0.26,-0.16,0.115],[-0.10,0.18,0.10]];
  for (const w of wheels) { const wx=w[0],wy=w[1],wr=w[2]; ctx.save(); ctx.translate(wx,wy); ctx.rotate(spin*(0.8+wr)); ctx.fillStyle='rgba(188,158,106,.92)'; ctx.beginPath(); ctx.arc(0,0,wr,0,TAU); ctx.fill(); ctx.strokeStyle='rgba(94,76,46,.55)'; ctx.lineWidth=0.008; for(let i=0;i<16;i++){const t=i/16*TAU; ctx.beginPath(); ctx.moveTo(Math.cos(t)*wr*0.55,Math.sin(t)*wr*0.55); ctx.lineTo(Math.cos(t)*wr,Math.sin(t)*wr); ctx.stroke();} ctx.fillStyle='rgba(32,26,16,.7)'; ctx.beginPath(); ctx.arc(0,0,wr*0.22,0,TAU); ctx.fill(); ctx.restore(); }
  ctx.restore();
}

function drawGlassDisc(st,r,z,alpha) {
  const X=makeXform(st), seg=48, P=[];
  for (let i=0;i<seg;i++){const a=i/seg*TAU; P.push(project(X([Math.cos(a)*r,Math.sin(a)*r,z]),st));}
  ctx.save(); ctx.globalAlpha=clamp(alpha)*0.55;
  ctx.beginPath(); ctx.moveTo(P[0][0],P[0][1]); for(let i=1;i<seg;i++) ctx.lineTo(P[i][0],P[i][1]); ctx.closePath();
  const c=project(X([0,0,z]),st);
  const g=ctx.createLinearGradient(c[0]-P[0][3]*0.8,c[1]-P[0][3]*0.8,c[0]+P[0][3]*0.8,c[1]+P[0][3]*0.8);
  g.addColorStop(0,'rgba(255,255,255,.42)'); g.addColorStop(.5,'rgba(220,230,240,.10)'); g.addColorStop(1,'rgba(255,255,255,.34)');
  ctx.fillStyle=g; ctx.fill(); ctx.strokeStyle='rgba(255,255,255,.55)'; ctx.lineWidth=1.2; ctx.stroke(); ctx.restore();
}

const EXPLODE = { crystal:2.30, bezel:1.55, dial:0.95, mvt:0.05, back:-1.15, case:0.0, lug:0.0, crown:0.35 };

function watchState(o) { return {cx:o.cx,cy:o.cy,scale:o.scale,ry:o.ry,rx:o.rx,rz:o.rz||0,focus:o.focus||null,explodeFn:o.explodeFn||null}; }

function drawWatch(o, canvases) {
  const pal=o.pal, st=watchState(o), ex=o.explode||0, A=Math.max(0.001,o.alpha===undefined?1:o.alpha);
  st.W=canvases.W; st.H=canvases.H; st.dpr=canvases.DPR; st.cvW=canvases.cvW; st.cvH=canvases.cvH;
  if (o.bracelet>0.004) { const bst=Object.assign({},st); if(ex>0.001) bst.explodeFn=q=>[q[0],q[1],q[2]-ex*1.9]; drawFaces(GEO.bracelet,bst,pal,{alpha:o.bracelet*A,dof:o.dof}); }
  const groups=[['back',EXPLODE.back],['case',EXPLODE.case],['lug',EXPLODE.lug],['crown',EXPLODE.crown],['bezel',EXPLODE.bezel]];
  for (const g of groups) { const gs=Object.assign({},st); const off=g[1]; if(ex>0.001){const dz=off*ex*1.35; gs.explodeFn=q=>[q[0],q[1],q[2]+dz];} drawFaces(GEO.cases,gs,pal,{alpha:A,dof:o.dof,filter:f=>f.grp===g[0]}); }
  const bs=Object.assign({},st); if(ex>0.001){const dz=EXPLODE.back*ex*1.35; bs.explodeFn=q=>[q[0],q[1],q[2]+dz];} drawDial(bs,pal,{back:true,z:-CASE_T*0.66-0.001,alpha:A});
  if (ex>0.02) { const ms=Object.assign({},st); const dz=EXPLODE.mvt*ex*1.35; ms.explodeFn=q=>[q[0],q[1],q[2]+dz]; drawFaces(GEO.mvt,ms,pal,{alpha:ex*A}); drawMovementFace(ms,pal,ex*A,o.spin||0); }
  const ds=Object.assign({},st); if(ex>0.001){const dz=EXPLODE.dial*ex*1.35; ds.explodeFn=q=>[q[0],q[1],q[2]+dz];} drawDial(ds,pal,{alpha:A,spin:o.spin||0,hourAng:o.hourAng,minAng:o.minAng});
  const zs=Object.assign({},st); if(ex>0.001){const dz=EXPLODE.bezel*ex*1.35; zs.explodeFn=q=>[q[0],q[1],q[2]+dz];} drawBezelFace(zs,pal,A);
  if (ex>0.02) { const cs=Object.assign({},st); const dz=EXPLODE.crystal*ex*1.35; cs.explodeFn=q=>[q[0],q[1],q[2]+dz]; drawGlassDisc(cs,0.845,DIAL_Z,ex*0.9*A); }
}

let BGC=null,POOL=null,SHAD=null;
function buildField(W,H) {
  BGC=document.createElement('canvas'); BGC.width=W*_DPR; BGC.height=H*_DPR;
  const g=BGC.getContext('2d'); g.setTransform(_DPR,0,0,_DPR,0,0);
  g.fillStyle='rgb(19,19,22)'; g.fillRect(0,0,W,H);
  const gr=document.createElement('canvas'); gr.width=gr.height=180;
  const gg=gr.getContext('2d');
  for(let i=0;i<3400;i++){gg.fillStyle='rgba(255,255,255,'+(Math.random()*0.05).toFixed(3)+')'; gg.fillRect(Math.random()*180|0,Math.random()*180|0,1,1);}
  g.globalAlpha=0.55; g.fillStyle=g.createPattern(gr,'repeat'); g.fillRect(0,0,W,H); g.globalAlpha=1;
  const vg=g.createRadialGradient(W/2,H/2,Math.min(W,H)*0.42,W/2,H/2,Math.max(W,H)*0.78); vg.addColorStop(0,'rgba(0,0,0,0)'); vg.addColorStop(1,'rgba(0,0,0,.32)'); g.fillStyle=vg; g.fillRect(0,0,W,H);
  POOL=document.createElement('canvas'); POOL.width=POOL.height=256;
  {const p=POOL.getContext('2d'); const r=p.createRadialGradient(128,128,12,128,128,128); r.addColorStop(0,'rgba(255,255,255,.07)'); r.addColorStop(1,'rgba(255,255,255,0)'); p.fillStyle=r; p.fillRect(0,0,256,256);}
  SHAD=document.createElement('canvas'); SHAD.width=SHAD.height=256;
  {const p=SHAD.getContext('2d'); const r=p.createRadialGradient(128,128,0,128,128,128); r.addColorStop(0,'rgba(0,0,0,1)'); r.addColorStop(.55,'rgba(0,0,0,.45)'); r.addColorStop(1,'rgba(0,0,0,0)'); p.fillStyle=r; p.fillRect(0,0,256,256);}
}
function drawBackdrop(deep,W,H) { if(!BGC) buildField(W,H); ctx.drawImage(BGC,0,0,W,H); if(deep>0.004){ctx.fillStyle='rgba(0,0,0,'+(0.40*deep).toFixed(3)+')'; ctx.fillRect(0,0,W,H);} }

const PLATES = [
  {id:'p0',label:'Cover',   pose:{x:.63,y:.52,s:.30,ry:-.38,rx:.10,rz:0}},
  {id:'p1',label:'Thesis',  pose:{x:.76,y:.52,s:.21,ry:-1.05,rx:.14,rz:0}},
  {id:'p2',label:'Case',    pose:{x:.70,y:.50,s:.38,ry:-.58,rx:.16,rz:0}},
  {id:'p3',label:'Dial',    pose:{x:.27,y:.50,s:.42,ry:-.05,rx:.03,rz:0}},
  {id:'p4',label:'Calibre', pose:{x:.60,y:.48,s:.19,ry:-1.30,rx:.06,rz:0}},
  {id:'p5',label:'Bracelet',pose:{x:.64,y:.46,s:.42,ry:-1.38,rx:.30,rz:0}},
  {id:'p6',label:'Finishes',pose:{x:.50,y:.24,s:.15,ry:-.40,rx:.10,rz:0}},
  {id:'p7',label:'Data',    pose:{x:.76,y:.55,s:.19,ry:-.22,rx:.08,rz:0}},
  {id:'p8',label:'End',     pose:{x:.50,y:.40,s:.12,ry:-.35,rx:.10,rz:0}}
];
const N = PLATES.length;
const bell = (p,c,w) => Math.max(0,1-Math.abs(p-c)/(w||1));

export function initWatch(bgCanvas, stageCanvas, refs) {
  const cv = stageCanvas, ctxW = cv.getContext('2d');
  const bgc = bgCanvas, ctxB = bgc.getContext('2d');
  let W=0,H=0,DPR=1;
  let spin=0, tSec=0, sT=0, loaded=true, revealAt=performance.now();
  let metalKey='titanium';
  const M = () => METALS[metalKey];
  let last=performance.now(), lastActive=-1;
  let glideRAF=0, gliding=false, lastInput=0, lastYpx=0;
  let rafId = null;
  let running = true;

  function resize() {
    DPR=Math.min(2,window.devicePixelRatio||1); _DPR=DPR;
    W=window.innerWidth; H=window.innerHeight;
    for (const c of [cv,bgc]) { c.width=W*DPR; c.height=H*DPR; c.style.width=W+'px'; c.style.height=H+'px'; }
    ctxW.setTransform(DPR,0,0,DPR,0,0); ctxB.setTransform(DPR,0,0,DPR,0,0);
    BGC=null; DOFC=null;
  }

  function glideTo(y, dur) {
    cancelAnimationFrame(glideRAF);
    const y0=window.scrollY, d=y-y0, t0=performance.now();
    if (Math.abs(d)<1) { gliding=false; return; }
    gliding=true;
    const ease=(t)=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
    const step=(now)=>{ const p=clamp((now-t0)/dur); window.scrollTo(0,y0+d*ease(p)); if(p<1) glideRAF=requestAnimationFrame(step); else gliding=false; };
    glideRAF=requestAnimationFrame(step);
  }
  function stopGlide(){ cancelAnimationFrame(glideRAF); gliding=false; }

  const onWheel = () => { lastInput=performance.now(); stopGlide(); };
  const onTouch = () => { lastInput=performance.now(); stopGlide(); };
  window.addEventListener('wheel', onWheel, {passive:true});
  window.addEventListener('touchmove', onTouch, {passive:true});

  function go(n) { n=clamp(n,0,N-1); glideTo(n*window.innerHeight,620); }
  window.addEventListener('keydown', (e) => {
    const cur=Math.round(window.scrollY/window.innerHeight);
    if(e.key==='ArrowDown'||e.key==='PageDown'||e.key===' '){e.preventDefault(); go(cur+1);}
    if(e.key==='ArrowUp'||e.key==='PageUp'){e.preventDefault(); go(cur-1);}
  });

  // Boot after short delay for loader animation
  setTimeout(() => {
    loaded = true;
    revealAt = performance.now();
    refs.onBoot?.();
  }, 1400);

  refs.getIndexLinks?.().forEach(a => {
    a.style.pointerEvents='auto';
    a.addEventListener('click', (e) => { e.preventDefault(); go(+a.dataset.go); });
  });

  refs.getChips?.().forEach(b => b.addEventListener('click', () => {
    metalKey = b.dataset.k;
    const m = METALS[metalKey];
    refs.getChips().forEach(bb => bb.classList.toggle('on', bb.dataset.k===metalKey));
    refs.onMetalChange?.(m);
  }));

  const io = new IntersectionObserver(es => {
    es.forEach(e => { if (e.isIntersecting) e.target.classList.add('seen'); });
  }, {threshold:.35});
  refs.getPlates?.().forEach(p => io.observe(p));

  function frame(now) {
    if (!running) return;
    try {
      tick(now);
    } catch(e) {
      console.error('ANTHRA engine error:', e.message, e.stack);
      running = false;
    }
  }

  function tick(now) {
    const dt=Math.min(48,now-last); last=now; tSec+=dt; spin+=dt*0.0016;
    if (window.innerWidth!==W||window.innerHeight!==H) resize();
    if (!W||!H) return;

    const target=clamp(window.scrollY/H,0,N-1);
    sT+=(target-sT)*(1-Math.pow(0.0006,dt/1000));

    const calm=now-lastInput>240;
    const vel=Math.abs(window.scrollY-lastYpx); lastYpx=window.scrollY;
    const nearestY=Math.round(target)*H;
    if (loaded&&calm&&!gliding&&vel<0.4&&Math.abs(window.scrollY-nearestY)>2) glideTo(nearestY,540);

    const i=Math.min(N-2,Math.floor(sT));
    const f=smooth(clamp(sT-i));
    const A=PLATES[i].pose, B=PLATES[i+1].pose;
    const L=(a,b)=>a+(b-a)*f;

    const deep=bell(sT,4,1), ex=bell(sT,4,0.85);
    const rise = loaded ? easeOutExpo(clamp((now-revealAt)/1500)) : 0.8;
    const alphaVal = Math.max(0.5, rise); // FIX: always at least 0.5 alpha

    const wx=L(A.x,B.x)*W, wy=L(A.y,B.y)*H, ws=L(A.s,B.s)*Math.min(W,H);

    // Backdrop
    ctx=ctxB; ctx.setTransform(DPR,0,0,DPR,0,0);
    drawBackdrop(deep,W,H);
    ctx.save(); ctx.globalAlpha=0.9;
    ctx.drawImage(POOL,wx-ws*3.4,wy-ws*3.4,ws*6.8,ws*6.8);
    const shA=0.55*clamp(1.15-(ws/Math.min(W,H))*1.55)*(1-ex)*alphaVal;
    if (shA>0.012) { ctx.globalAlpha=shA; ctx.drawImage(SHAD,wx-ws*1.55,wy+ws*1.30-ws*0.23,ws*3.1,ws*0.46); }
    ctx.restore();

    // Watch
    ctx=ctxW; ctx.setTransform(DPR,0,0,DPR,0,0); ctx.clearRect(0,0,W,H);
    const idle=Math.sin(tSec*0.00025)*0.05;
    drawWatch({
      pal:M(),cx:wx,cy:wy,
      scale:ws*(0.6+0.4*alphaVal),
      ry:L(A.ry,B.ry)+idle,rx:L(A.rx,B.rx),rz:L(A.rz,B.rz),
      explode:ex,bracelet:1,alpha:alphaVal,spin,
      dof:ws>Math.min(W,H)*0.30
    }, {W,H,DPR,cvW:cv.width,cvH:cv.height});

    const active=Math.round(target);
    if (active!==lastActive) {
      lastActive=active;
      refs.onPlateChange?.(active);
    }
  }

  window.addEventListener('resize', resize);

  return {
    destroy: () => {
      running = false;
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchmove', onTouch);
      io.disconnect();
    },
    go,
    setMetal: (k) => { metalKey=k; const m=METALS[k]; refs.onMetalChange?.(m); }
  };
}
