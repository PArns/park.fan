import sharp from 'sharp';
const f=process.argv[2];
const {data,info}=await sharp(f).raw().toBuffer({resolveWithObject:true});
const W=info.width,C=info.channels;
const box=(x0,y0,x1,y1)=>{let r=0,g=0,b=0,n=0;for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){const i=(y*W+x)*C;r+=data[i];g+=data[i+1];b+=data[i+2];n++;}return [r/n,g/n,b/n];};
const sd=(x0,y0,x1,y1)=>{let s=0,s2=0,n=0;for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){const i=(y*W+x)*C;const v=0.299*data[i]+0.587*data[i+1]+0.114*data[i+2];s+=v;s2+=v*v;n++;}const m=s/n;return Math.sqrt(s2/n-m*m);};
for (const spec of process.argv.slice(3)) {
  const [name,x0,y0,x1,y1]=spec.split(',');
  const m=box(+x0,+y0,+x1,+y1);
  console.log(`  ${name.padEnd(22)} sRGB ${m.map(v=>v.toFixed(1).padStart(6)).join('/')}   stddev(luma)=${sd(+x0,+y0,+x1,+y1).toFixed(2)}`);
}
