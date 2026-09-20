function drawHistory(canvas,rows){
 const ctx=canvas.getContext("2d"),dpr=window.devicePixelRatio||1,w=canvas.clientWidth||800,h=canvas.clientHeight||360;
 canvas.width=w*dpr;canvas.height=h*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
 if(!rows.length)return;
 const vals=rows.map(x=>Number(x.close)).filter(Number.isFinite);if(!vals.length)return;
 const min=Math.min(...vals),max=Math.max(...vals),pad=36,range=Math.max(1,max-min);
 ctx.strokeStyle="#1b2b37";ctx.lineWidth=1;
 for(let i=0;i<4;i++){const y=pad+i*(h-pad*2)/3;ctx.beginPath();ctx.moveTo(pad,y);ctx.lineTo(w-pad,y);ctx.stroke()}
 ctx.beginPath();vals.forEach((v,i)=>{const x=pad+i*(w-pad*2)/Math.max(1,vals.length-1),y=h-pad-(v-min)/range*(h-pad*2);i?ctx.lineTo(x,y):ctx.moveTo(x,y)});
 ctx.strokeStyle="#9fc0cf";ctx.lineWidth=2;ctx.stroke();ctx.fillStyle="#78909c";ctx.font="12px Tahoma";ctx.fillText(String(max.toLocaleString("fa-IR")),8,18);ctx.fillText(String(min.toLocaleString("fa-IR")),8,h-8);
}
window.drawHistory=drawHistory;