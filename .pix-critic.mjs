import sharp from 'sharp';
const file = process.argv[2];
const { data, info } = await sharp(file).raw().toBuffer({ resolveWithObject: true });
const W = info.width, H = info.height, C = info.channels;
const at = (x,y) => { const i=(y*W+x)*C; return [data[i],data[i+1],data[i+2]]; };
const rowMean = (y, x0=0, x1=W) => { let r=0,g=0,b=0,n=0; for(let x=x0;x<x1;x++){const p=at(x,y); r+=p[0];g+=p[1];b+=p[2];n++;} return [r/n,g/n,b/n]; };
const lin = (s) => { const c=s/255; return c<=0.04045? c/12.92 : Math.pow((c+0.055)/1.055,2.4); };
const L = (p) => 0.2126*lin(p[0])+0.7152*lin(p[1])+0.0722*lin(p[2]);
const rows = (process.argv[3] ?? '60,100,150,200,230,240,250,260,300,400,500,600,700').split(',').map(Number);
console.log(file, `${W}x${H}`);
for (const y of rows) {
  const m = rowMean(y, 40, W-40);
  console.log(`  y=${String(y).padStart(3)} sRGB ${m.map(v=>v.toFixed(0).padStart(3)).join('/')}  lin ${lin(m[0]).toFixed(4)}/${lin(m[1]).toFixed(4)}/${lin(m[2]).toFixed(4)}  L=${L(m).toFixed(4)}  b:r=${(lin(m[2])/(lin(m[0])||1e-9)).toFixed(3)}`);
}
// find the terrain horizon: biggest vertical jump in green-minus-blue
let best=-1,bestY=0;
for(let y=1;y<H-1;y++){ const a=rowMean(y-1,40,W-40), b=rowMean(y+1,40,W-40); const d=Math.abs((a[1]-a[2])-(b[1]-b[2])); if(d>best){best=d;bestY=y;} }
console.log(`  terrain edge (max d(G-B)/dy) at y=${bestY}, delta ${best.toFixed(1)}`);
