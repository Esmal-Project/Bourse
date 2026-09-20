function analysisNumber(v){const n=Number(v);return Number.isFinite(n)?n:null}
function pct(a,b){return a!=null&&b!=null&&b!==0?(a-b)/b*100:null}
function avg(values){const v=values.filter(Number.isFinite);return v.length?v.reduce((a,b)=>a+b,0)/v.length:null}
function fa(v,d=0){return v==null?"—":Number(v).toLocaleString("fa-IR",{maximumFractionDigits:d,minimumFractionDigits:d})}
function signedPct(v){return v==null?"—":(v>=0?"+":"")+v.toFixed(2)+"٪"}
function describeTrend(ret5,ret20,ma5,ma20,last){
  if(last==null)return "داده کافی نیست";
  if(ma5!=null&&ma20!=null&&last>ma5&&ma5>ma20)return "صعودی کوتاه‌مدت";
  if(ma5!=null&&ma20!=null&&last<ma5&&ma5<ma20)return "نزولی کوتاه‌مدت";
  if(ret5!=null&&ret20!=null&&ret5>0&&ret20>0)return "مثبت";
  if(ret5!=null&&ret20!=null&&ret5<0&&ret20<0)return "منفی";
  return "خنثی / نوسانی";
}
function buildAnalysis(rows){
  const clean=rows.map(r=>({
    date:r.date,
    close:analysisNumber(r.close),
    last:analysisNumber(r.last),
    min:analysisNumber(r.min),
    max:analysisNumber(r.max),
    volume:analysisNumber(r.volume),
    value:analysisNumber(r.value),
    trades:analysisNumber(r.trades),
    first:analysisNumber(r.first),
    yesterday:analysisNumber(r.yesterday)
  })).filter(r=>r.close!=null||r.last!=null);
  const priceRows=clean.map(r=>r.last??r.close).filter(Number.isFinite);
  const vols=clean.map(r=>r.volume).filter(Number.isFinite);
  const last=priceRows.at(-1)??null;
  const prev=priceRows.at(-2)??null;
  const p5=priceRows.at(-6)??null;
  const p20=priceRows.at(-21)??null;
  const ma5=avg(priceRows.slice(-5));
  const ma20=avg(priceRows.slice(-20));
  const avgVol20=avg(vols.slice(-21,-1));
  const currentVol=vols.at(-1)??null;
  const volumeRatio=currentVol!=null&&avgVol20?currentVol/avgVol20:null;
  const recent=clean.slice(-20);
  const high20=Math.max(...recent.map(r=>r.max??r.last??r.close).filter(Number.isFinite));
  const low20=Math.min(...recent.map(r=>r.min??r.last??r.close).filter(Number.isFinite));
  const rangePos=last!=null&&Number.isFinite(high20)&&Number.isFinite(low20)&&high20!==low20?(last-low20)/(high20-low20)*100:null;
  return {
    count:clean.length,date:clean.at(-1)?.date??null,last,prev,
    dayChange:pct(last,prev),return5:pct(last,p5),return20:pct(last,p20),
    ma5,ma20,volume:currentVol,avgVol20,volumeRatio,
    high20:Number.isFinite(high20)?high20:null,low20:Number.isFinite(low20)?low20:null,
    rangePos,trend:describeTrend(pct(last,p5),pct(last,p20),ma5,ma20,last),
    rows:clean.slice(-10).reverse()
  };
}
function renderAnalysis(a){
  const set=(id,v)=>{const el=document.getElementById(id);if(el)el.textContent=v};
  set("aTrend",a.trend); set("aDayChange",signedPct(a.dayChange)); set("aReturn5",signedPct(a.return5)); set("aReturn20",signedPct(a.return20));
  set("aMA5",fa(a.ma5)); set("aMA20",fa(a.ma20)); set("aVolumeRatio",a.volumeRatio==null?"—":a.volumeRatio.toFixed(2)+"×");
  set("a20High",fa(a.high20)); set("a20Low",fa(a.low20)); set("aRangePos",a.rangePos==null?"—":a.rangePos.toFixed(1)+"٪");
  set("analysisCount",fa(a.count));
  const tbody=document.getElementById("analysisTableBody");
  if(tbody)tbody.innerHTML=a.rows.map(r=>{
    const p=r.last??r.close;
    const ch=pct(p,r.yesterday);
    return "<tr><td>"+(r.date??"—")+"</td><td>"+fa(p)+"</td><td>"+signedPct(ch)+"</td><td>"+fa(r.volume)+"</td><td>"+fa(r.value)+"</td><td>"+fa(r.trades)+"</td></tr>";
  }).join("");
}
window.BourseAnalysis={build:buildAnalysis,render:renderAnalysis,fa};
