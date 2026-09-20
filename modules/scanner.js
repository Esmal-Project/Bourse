function scanNum(v){const n=Number(v);return Number.isFinite(n)?n:null}
function normalizeMarketWatch(raw){
  const rows=raw?.marketwatch||raw?.data||raw;
  if(!Array.isArray(rows))return [];
  return rows.map(r=>{
    const pl=scanNum(r?.pl??r?.pDrCotVal),py=scanNum(r?.py??r?.priceYesterday);
    const change=pl!=null&&py?((pl-py)/py)*100:null;
    return {
      insCode:r?.insCode??r?.ins_code??null,
      symbol:r?.lVal18??r?.l18??r?.lVal18AFC??"",
      name:r?.lVal30??r?.l30??"",
      last:pl,close:scanNum(r?.pc??r?.pClosing),yesterday:py,
      change,volume:scanNum(r?.tvol??r?.qTotTran5J),value:scanNum(r?.tval??r?.qTotCap),
      trades:scanNum(r?.tno??r?.zTotTran),min:scanNum(r?.pmin??r?.priceMin),
      max:scanNum(r?.pmax??r?.priceMax),flow:r?.flow??null,raw:r
    };
  }).filter(r=>r.insCode&&r.symbol);
}
function scanSort(rows,key="change",dir="desc"){
  return [...rows].sort((a,b)=>{
    const av=Number.isFinite(a[key])?a[key]:-Infinity,bv=Number.isFinite(b[key])?b[key]:-Infinity;
    return dir==="asc"?av-bv:bv-av;
  });
}
function scanStats(rows){
  const valid=rows.filter(r=>Number.isFinite(r.change));
  return {
    count:rows.length,
    positive:valid.filter(r=>r.change>0).length,
    negative:valid.filter(r=>r.change<0).length,
    flat:valid.filter(r=>r.change===0).length,
    totalValue:rows.reduce((s,r)=>s+(r.value||0),0)
  };
}

function percentileRanks(rows,key){
  const vals=rows.map(r=>scanNum(r[key])).filter(v=>v!=null).sort((a,b)=>a-b);
  if(!vals.length)return new Map();
  const rank=new Map();
  rows.forEach(r=>{
    const v=scanNum(r[key]);
    if(v==null)return;
    let lo=0,hi=vals.length;
    while(lo<hi){const m=(lo+hi)>>1;if(vals[m]<=v)lo=m+1;else hi=m}
    rank.set(r.insCode,vals.length===1?50:((lo-1)/(vals.length-1))*100);
  });
  return rank;
}
function addActivityScore(rows){
  const enriched=[...rows];
  enriched.forEach(r=>{r.absChange=Math.abs(r.change??0)});
  const rv=percentileRanks(enriched,"volume"),rt=percentileRanks(enriched,"value"),rn=percentileRanks(enriched,"trades"),rc=percentileRanks(enriched,"absChange");
  enriched.forEach(r=>{
    const parts=[rv.get(r.insCode),rt.get(r.insCode),rn.get(r.insCode),rc.get(r.insCode)].filter(Number.isFinite);
    r.activityScore=parts.length?parts.reduce((x,y)=>x+y,0)/parts.length:null;
  });
  return enriched;
}
window.BourseScanner={normalize:normalizeMarketWatch,sort:scanSort,stats:scanStats,activity:addActivityScore};
