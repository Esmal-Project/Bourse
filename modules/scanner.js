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
window.BourseScanner={normalize:normalizeMarketWatch,sort:scanSort,stats:scanStats};
